import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '@/common/services/prisma.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { UnauthorizedException, ConflictException } from '@/common/exceptions/custom-exceptions'
import { Role } from '@prisma/client'
import { EmailService } from '@/shared/email.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private signToken(userId: string, email: string, role: Role): string {
    return this.jwtService.sign({ sub: userId, email, role })
  }

  async register(dto: RegisterDto) {
    this.logger.log(`Registering new user: ${dto.email}`)

    // Check for existing email
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
          role: Role.BUYER,
        },
      })
    } catch (prismaError: any) {
      this.logger.error('Prisma user creation error:', prismaError)
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('An account with this email already exists')
      }
      throw new Error('Failed to create user profile. Please try again.')
    }

    // Create wallet for user
    try {
      await this.prisma.wallet.create({ data: { userId: user.id } })
    } catch (walletError) {
      this.logger.error('Prisma wallet creation error:', walletError)
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
      data: { lastLoginAt: new Date() },
    })

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
        emailVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  async verifyEmail(userId: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { emailVerified: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  async resetPassword(userId: string, newPassword: string) {
    this.logger.log(`Resetting password for user ${userId}`)
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.users.update({ where: { id: userId }, data: { passwordHash } })
    return { success: true }
  }

  async logout(userId: string) {
    this.logger.log(`User logout: ${userId}`)
    return { success: true }
  }

  async updateUserRole(userId: string, role: Role, moderatorId: string) {
    this.logger.log(`Updating role for user ${userId} to ${role}`)
    const user = await this.prisma.users.update({ where: { id: userId }, data: { role } })
    await this.prisma.adminAuditLogs.create({
      data: { actorId: moderatorId, action: 'ROLE_CHANGE', entityType: 'user', entityId: userId, newValue: { role } },
    })
    return user
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } })
    if (user) {
      this.logger.log(`Password reset requested for ${email}`)
      
      // Generate reset token
      const resetToken = this.jwtService.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '24h' }
      )
      
      // Send reset email
      await this.emailService.sendPasswordResetEmail(user.email, resetToken)
    }
    // Don't reveal if user exists or not for security
  }

  async verifyUserEmail(userId: string) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { emailVerified: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    // Send verification confirmation email
    await this.emailService.sendNotificationEmail(
      user.email,
      'Email Verified - Velxo',
      'Your email has been successfully verified. You can now enjoy all Velxo features.'
    )

    return user
  }

  async handleGoogleCallback(code: string) {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.API_URL || 'http://localhost:3001/api/v1'}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      this.logger.error('Google token exchange failed:', err)
      throw new Error('Google authentication failed')
    }

    const tokens: any = await tokenRes.json()

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser: any = await userInfoRes.json()

    const { email, given_name, family_name, sub: googleId } = googleUser

    // Upsert user in DB
    let user = await this.prisma.users.findUnique({ where: { email } })

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email,
          firstName: given_name || '',
          lastName: family_name || '',
          emailVerified: true,
          role: Role.BUYER,
          // No passwordHash — Google-only account
        },
      })
      // Create wallet
      await this.prisma.wallet.create({ data: { userId: user.id } }).catch(() => {})
    } else {
      // Update name if missing
      if (!user.firstName) {
        await this.prisma.users.update({
          where: { id: user.id },
          data: { firstName: given_name, lastName: family_name, emailVerified: true },
        })
      }
    }

    if (user.isBanned) throw new Error('Your account has been suspended')

    await this.prisma.users.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const accessToken = this.signToken(user.id, user.email, user.role)
    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      accessToken,
    }
  }

  async banUser(userId: string, reason: string, moderatorId: string) {
    this.logger.log(`Banning user ${userId}`)
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
