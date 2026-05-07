import { Context } from 'koishi';
export interface SubscriptionTarget {
    platform?: string;
    channelId?: string;
    guildId?: string;
    userId?: string;
}
export declare function sendScheduledMessage(ctx: Context, target: SubscriptionTarget, message: string): Promise<boolean>;
