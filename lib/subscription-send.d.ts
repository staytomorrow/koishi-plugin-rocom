import { Context } from 'koishi';
export interface SubscriptionTarget {
    platform?: string;
    channelId?: string;
    guildId?: string;
    userId?: string;
}
export declare function sendScheduledMessage(ctx: Context, target: SubscriptionTarget, message: any): Promise<boolean>;
export declare function sendScheduledImageWithFallback(ctx: Context, target: SubscriptionTarget, image: Buffer | null, fallbackText: string, mentionAll?: boolean): Promise<boolean>;
