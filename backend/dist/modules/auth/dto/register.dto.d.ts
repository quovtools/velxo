import { Role } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: Role;
    preferences?: Record<string, any>;
    referralCode?: string;
}
