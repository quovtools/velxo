import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '@/common/services/prisma.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { UnauthorizedException, ConflictException } from '@/common/exceptions/custom-exceptions'
import { Role } from '@prisma/client'
import { EmailService } from '@/shared/email.service'
import { AffiliateService } from '@/modules/affiliate/affiliate.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private affiliateService: AffiliateService,
  ) {}

  private signToken(userId: string, email: string, role: Role): string {
    return this.jwtService.sign({ sub: userId, email, role })
  }

  private googleRedirectUri(req?: Request): string {
    if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI
    const proto = (req?.headers?.['x-forwarded-proto'] as string) || req?.protocol || 'https'
    const host = req?.get?.('host') || process.env.API_URL || 'http://localhost:3001'
    const base = String(host).startsWith('http') ? String(host) : `${proto}://${host}`
    return `${base.replace(/\/$/, '')}/api/v1/auth/google/callback`
  }

  getGoogleAuthUrl(req?: Request): string {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = this.googleRedirectUri(req)
    const scope = 'openid email profile'
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=select_account`
  }


  private signVerificationToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, purpose: 'email_verification' },
      { expiresIn: '72h' },
    )
  }

  async register(dto: RegisterDto) {
    this.logger.log(`Registering new user: ${dto.email}`)

    const existing = await this.prisma.users.findUnique({ where: { email: dto.email } })
    if (existing) {
      throw new ConflictException('An account with this email already exists')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)

    let user: any
    try {
      user = await this.prisma.users.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          emailVerified: false,
          // Never allow self-assignment of privileged roles (ADMIN, MODERATOR,
          // SUPER_ADMIN) during public registration.
          role:
            dto.role === Role.BUYER || dto.role === Role.SELLER
              ? dto.role
              : Role.BUYER,
          preferences: dto.preferences ?? undefined,
        },
      })
    } catch (prismaError: any) {
      this.logger.error('Prisma user creation error:', prismaError)
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('An account with this email already exists')
      }
      throw new Error('Failed to create user profile. Please try again.')
    }

    // Create wallet
    try {
      await this.prisma.wallet.create({ data: { userId: user.id } })
    } catch (walletError) {
      this.logger.error('Wallet creation error:', walletError)
    }

    // Record affiliate referral if a valid referral code was provided
    if (dto.referralCode) {
      try {
        const referral = await this.affiliateService.registerReferral(dto.referralCode, user.id)
        if (referral) {
          this.logger.log(`User ${user.id} registered via referral ${dto.referralCode}`)
        }
      } catch (referralError) {
        this.logger.error('Affiliate referral recording error (non-fatal):', referralError)
      }
    }

    // Send verification email
    let emailSent = false
    try {
      const verificationToken = this.signVerificationToken(user.id, user.email)
      const result = await this.emailService.sendVerificationEmail(user.email, verificationToken)
      emailSent = result.success
      if (!result.success) {
        this.logger.error('Verification email failed to send:', result.error)
      }
    } catch (emailError) {
      this.logger.error('Verification email send error:', emailError)
      // Non-fatal — user can resend from the verification page
    }

    const accessToken = this.signToken(user.id, user.email, user.role)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      emailSent,
    }
  }

  async login(dto: LoginDto) {
    this.logger.log(`User login attempt: ${dto.email}`)

    const user = await this.prisma.users.findUnique({ where: { email: dto.email } })

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) {
      this.logger.warn(`Login failed for ${dto.email} — wrong password`)
      throw new UnauthorizedException('Invalid email or password')
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Your account has been suspended')
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastSeenAt: new Date() } as any,
    })

    const accessToken = this.signToken(user.id, user.email, user.role)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
      accessToken,
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        emailVerified: true,
        notificationPreferences: true,
        preferences: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  async verifyEmailToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token) as any
      if (decoded.purpose !== 'email_verification') {
        throw new UnauthorizedException('Invalid verification token')
      }
      const user = await this.prisma.users.update({
        where: { id: decoded.sub },
        data: { emailVerified: true },
        select: { id: true, email: true, emailVerified: true },
      })
      return user
    } catch {
      throw new UnauthorizedException('Invalid or expired verification link')
    }
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')
    if (user.emailVerified) return { alreadyVerified: true }

    const token = this.signVerificationToken(user.id, user.email)
    const result = await this.emailService.sendVerificationEmail(user.email, token)
    if (!result.success) {
      throw new Error(result.error || 'Failed to send verification email')
    }
    return { sent: true }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')

    if (user.passwordHash) {
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) throw new UnauthorizedException('Current password is incorrect')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.users.update({ where: { id: userId }, data: { passwordHash } })
    return { success: true }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } })
    if (user) {
      const resetToken = this.jwtService.sign(
        { sub: user.id, email: user.email, purpose: 'password_reset' },
        { expiresIn: '24h' },
      )
      await this.emailService.sendPasswordResetEmail(user.email, resetToken)
    }
    // Silent — don't reveal if email exists
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token) as any
      if (decoded.purpose !== 'password_reset') {
        throw new UnauthorizedException('Invalid reset token')
      }
      const passwordHash = await bcrypt.hash(newPassword, 12)
      await this.prisma.users.update({
        where: { id: decoded.sub },
        data: { passwordHash },
      })
      return { success: true }
    } catch {
      throw new UnauthorizedException('Invalid or expired reset link')
    }
  }

  async logout(userId: string) {
    this.logger.log(`User logout: ${userId}`)
    return { success: true }
  }

  async updateUserRole(userId: string, role: Role, moderatorId: string) {
    const user = await this.prisma.users.update({ where: { id: userId }, data: { role } })
    await this.prisma.adminAuditLogs.create({
      data: { actorId: moderatorId, action: 'ROLE_CHANGE', entityType: 'user', entityId: userId, newValue: { role } },
    })
    return user
  }

  async handleGoogleCallback(code: string, req?: Request) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: this.googleRedirectUri(req),
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      this.logger.error('Google token exchange failed:', err)
      throw new Error('Google authentication failed')
    }

    const tokens: any = await tokenRes.json()
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser: any = await userInfoRes.json()
    const { email, given_name, family_name } = googleUser

    let user = await this.prisma.users.findUnique({ where: { email } })

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email,
          firstName: given_name || '',
          lastName: family_name || '',
          emailVerified: true,
          role: Role.BUYER,
        },
      })
      await this.prisma.wallet.create({ data: { userId: user.id } }).catch(() => {})
    } else {
      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          ...(user.firstName ? {} : { firstName: given_name, lastName: family_name }),
        },
      })
    }

    if (user.isBanned) throw new Error('Your account has been suspended')

    await this.prisma.users.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const accessToken = this.signToken(user.id, user.email, user.role)
    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, emailVerified: true },
      accessToken,
    }
  }

  async banUser(userId: string, reason: string, moderatorId: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { isBanned: true, banReason: reason },
    })
    await this.prisma.adminAuditLogs.create({
      data: { actorId: moderatorId, action: 'STATUS_CHANGE', entityType: 'user', entityId: userId, newValue: { isBanned: true, reason } },
    })
    return user
  }
}
