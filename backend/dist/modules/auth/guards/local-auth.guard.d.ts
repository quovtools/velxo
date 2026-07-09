declare const LocalAuthGuard_base: new (...args: any[]) => any;
export declare class LocalAuthGuard extends LocalAuthGuard_base {
    constructor();
    validate(email: string, password: string): Promise<{
        email: string;
        passwordHash: string;
    }>;
}
export {};
