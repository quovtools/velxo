import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class AdminPasswordGuard implements CanActivate {
    private readonly logger;
    private readonly adminPassword;
    canActivate(context: ExecutionContext): boolean;
}
