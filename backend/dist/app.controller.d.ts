import { Response } from 'express';
export declare class AppController {
    healthCheck(): {
        status: string;
        service: string;
        version: string;
        timestamp: string;
        uptime: number;
    };
    healthCheckHead(res: Response): void;
}
