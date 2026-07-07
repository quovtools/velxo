import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '@/common/services/prisma.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { UnauthorizedException, ConflictException } from '@/common/exceptions/custom-exceptions'
import { Role } from '@prisma/client'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
