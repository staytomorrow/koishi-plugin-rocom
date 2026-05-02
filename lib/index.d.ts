import { Context, Schema } from 'koishi';
export declare const name = "rocom";
export declare const inject: {
    required: string[];
};
export interface Config {
    apiBaseUrl: string;
    wegameApiKey: string;
    qqLoginDebugMode: boolean;
    adminUserIds: string[];
    autoRefreshEnabled: boolean;
    autoRefreshTime: string[];
    merchantSubscriptionEnabled: boolean;
    merchantSubscriptionItems: string[];
    merchantCheckInterval: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
