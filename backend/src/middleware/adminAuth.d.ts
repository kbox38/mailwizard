import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            admin?: {
                adminId: string;
                email: string;
                role: string;
                permissions: string[];
            };
        }
    }
}
export declare function authenticateAdmin(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function requireAdminPermission(...permissions: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function logAdminActivity(data: {
    adminId: string;
    actionType: string;
    resourceType?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void>;
export declare function adminLogin(email: string, password: string): Promise<{
    token: string;
    admin: {
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        role: any;
        permissions: string[] | undefined;
    };
}>;
//# sourceMappingURL=adminAuth.d.ts.map