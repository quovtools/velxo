import { Role } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const RequireRoles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
