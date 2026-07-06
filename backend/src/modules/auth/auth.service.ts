import { Injectable, Logger } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'
import { PrismaService } from '@/common/services/prisma.service'
import { LoginDto, RegisterDto } from './dto/login.dto'
import { UnauthorizedException, ConflictException } from '@/common/exceptions/custom-exceptions'
import { Role } from '@prisma/client'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private supabase

  constructor(private prisma: PrismaService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
  }

  async register(dto: RegisterDto) {
    this.logger.log(`Registering new user: ${dto.email}`)

    // Create user in Supabase
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // Auto-verify in development
    })

    if (error) {
      this.logger.error('Supabase registration error:', error)
      throw new ConflictException('User already exists or invalid credentials')
    }

    // Create user profile in database
    const user = await this.prisma.users.create({
      data: {
        id: data.user.id,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerified: true,
        role: Role.BUYER,
      },
    })

    // Create wallet for user
    await this.prisma.wallet.create({
      data: {
        userId: user.id,
      },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      session: data.session,
    }
  }

  async login(dto: LoginDto) {
    this.logger.log(`User login attempt: ${dto.email}`)

    // Authenticate with Supabase
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    })

    if (error) {
      this.logger.warn(`Login failed for ${dto.email}`)
      throw new UnauthorizedException('Invalid email or password')
    }

    // Get user profile from database
    const user = await this.prisma.users.findUnique({
      where: { id: data.user.id },
    })

    if (!user) {
      throw new UnauthorizedException('User profile not found')
    }

    if (user.isBanned) {
      throw new UnauthorizedException('User account is banned')
    }

    // Update last login time
    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      session: data.session,
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
    this.logger.log(`Verifying email for user ${userId}`)

    return this.prisma.users.update({
      where: { id: userId },
      data: { emailVerified: true },
    })
  }

  async resetPassword(userId: string, newPassword: string) {
    this.logger.log(`Resetting password for user ${userId}`)

    // Update password in Supabase
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      this.logger.error('Error resetting password:', error)
      throw new Error('Failed to reset password')
    }

    return { success: true }
  }

  async logout(userId: string) {
    this.logger.log(`User logout: ${userId}`)
    // Invalidate token server-side if needed
    return { success: true }
  }

  async updateUserRole(userId: string, role: Role, moderatorId: string) {
    this.logger.log(`Updating role for user ${userId} to ${role}`)

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { role },
    })

    // Audit log
    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'ROLE_CHANGE',
        entityType: 'user',
        entityId: userId,
        newValue: { role },
      },
    })

    return user
  }

  async banUser(userId: string, reason: string, moderatorId: string) {
    this.logger.log(`Banning user ${userId}`)

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: reason,
      },
    })

    await this.prisma.adminAuditLogs.create({
      data: {
        actorId: moderatorId,
        action: 'STATUS_CHANGE',
        entityType: 'user',
        entityId: userId,
        newValue: { isBanned: true, reason },
      },
    })

    return user
  }
}
