import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.users.findUnique({ where: { email } })
    if (!user) throw new ConflictException('Invalid credentials')
    // Password validation against Supabase / bcrypt would happen here
    const { passwordHash, ...rest } = user
    return rest
  }

  async login(user: any) {
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role })
    return { success: true, data: { token, user } }
  }

  async register(data: any) {
    const existing = await this.prisma.users.findUnique({ where: { email: data.email } }).catch(() => null)
    if (existing) throw new ConflictException('User already exists')
    const user = await this.prisma.users.create({
      data: { email: data.email, role: 'BUYER', isActive: true },
    })
    const { passwordHash, ...rest } = user
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role })
    return { success: true, data: { token, user: rest } }
  }
}
