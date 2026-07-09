import { Strategy } from 'passport-jwt';
declare const JwtAuthGuard_base: new (...args: any[]) => Strategy;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    constructor();
    validate(payload: any): Promise<{
        userId: any;
        email: any;
    }>;
}
export {};
