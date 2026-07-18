export * from './auth.module'
export * from './auth.service'
export * from './auth.controller'
export * from './strategies/jwt.strategy'
// FIX #15: Both LoginDto and RegisterDto come from login.dto.ts (canonical).
// The duplicate register.dto.ts (with weaker validation) has been deleted.
export { LoginDto, RegisterDto } from './dto/login.dto'
