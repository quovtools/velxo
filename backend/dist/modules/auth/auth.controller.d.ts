import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { ApiResponseDto } from '@/common/dto/api-response.dto';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<ApiResponseDto<{
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
        };
        accessToken: string;
        emailSent: boolean;
    }>>;
    login(dto: LoginDto): Promise<ApiResponseDto<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.Role;
            avatarUrl: string;
            emailVerified: boolean;
        };
        accessToken: string;
    }>>;
    getCurrentUser(userId: string): Promise<ApiResponseDto<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        createdAt: Date;
        emailVerified: boolean;
        phone: string;
        avatarUrl: string;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue;
    }>>;
    logout(userId: string): Promise<ApiResponseDto<any>>;
    verifyEmail(token: string): Promise<ApiResponseDto<{
        email: string;
        id: string;
        emailVerified: boolean;
    }>>;
    resendVerification(userId: string): Promise<ApiResponseDto<{
        alreadyVerified: boolean;
        sent?: undefined;
    } | {
        sent: boolean;
        alreadyVerified?: undefined;
    }>>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ApiResponseDto<any>>;
    forgotPassword(email: string): Promise<ApiResponseDto<any>>;
    resetPassword(token: string, newPassword: string): Promise<ApiResponseDto<any>>;
    googleLogin(req: Request, res: Response): void;
    googleCallback(req: Request, code: string, res: Response): Promise<void>;
}
