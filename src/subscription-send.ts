import { Context, Logger } from 'koishi'

const logger = new Logger('rocom-subscription-send')

export interface SubscriptionTarget {
  platform?: string
  channelId?: string
  guildId?: string
  userId?: string
}

function findBot(ctx: Context, platform = ''): any {
  if (!ctx.bots?.length) return null
  if (!platform) return ctx.bots[0]
  return ctx.bots.find((bot: any) => bot.platform === platform) || ctx.bots[0]
}

export async function sendScheduledMessage(ctx: Context, target: SubscriptionTarget, message: string) {
  const platform = target.platform || ''
  const channelId = target.channelId || target.guildId || ''
  const userId = target.userId || ''
  const bot = findBot(ctx, platform)

  if (!bot) {
    logger.warn('no available bot, skip scheduled push')
    return false
  }

  try {
    if (userId && !target.guildId) {
      if (typeof bot.sendPrivateMessage === 'function') {
        await bot.sendPrivateMessage(userId, message)
        return true
      }
      if (typeof bot.sendMessage === 'function') {
        await bot.sendMessage(userId, message)
        return true
      }
    }

    if (platform && channelId) {
      await ctx.broadcast([`${platform}:${channelId}`], message)
      return true
    }

    if (channelId && typeof bot.sendMessage === 'function') {
      await bot.sendMessage(channelId, message, target.guildId)
      return true
    }
  } catch (err) {
    logger.warn(`scheduled push failed: ${err}`)
    return false
  }

  logger.warn(`scheduled push target is incomplete: ${JSON.stringify(target)}`)
  return false
}
