import { Context } from 'koishi';
import { RocomClient } from './client';
import { UserManager, MerchantSubscriptionManager } from './user';
import { EggService } from './egg-service';
import { Renderer } from './render';
export interface PluginConfig {
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
export interface PluginDeps {
    ctx: Context;
    config: PluginConfig;
    client: RocomClient;
    userMgr: UserManager;
    merchantSubMgr: MerchantSubscriptionManager;
    eggService: EggService;
    renderer: Renderer;
}
