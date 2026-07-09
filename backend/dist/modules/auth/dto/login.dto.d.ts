import { Role } from '@prisma/client';
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    preferences?: Record<string, any>;
    referralCode?: string;
}
export declare class ResetPasswordDto {
    email: string;
    oldPassword: string;
    newPassword: string;
}
