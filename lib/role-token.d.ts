import { Context } from 'koishi';
import { UserManager } from './user';
export interface RoleToken {
    UserId: string;
    fwt: string;
    bindingId: string;
    roleId: string;
    loginType: string;
    updatedAt: Date;
}
declare module 'koishi' {
    interface Tables {
        roleToken: RoleToken;
    }
}
export declare function setupRoleTokenModel(ctx: Context): void;
export declare function upsertRoleToken(ctx: Context, payload: {
    userId: string;
    fwt: string;
    bindingId?: string;
    roleId?: string;
    loginType?: string;
}): Promise<void>;
export declare function getRoleToken(ctx: Context, userId: string): Promise<RoleToken | null>;
export declare function removeRoleToken(ctx: Context, userId: string): Promise<void>;
export declare function migrateRoleTokensToUserId(ctx: Context): Promise<number>;
export declare function migrateLegacyFrameworkTokens(ctx: Context, userMgr: UserManager): Promise<number>;
