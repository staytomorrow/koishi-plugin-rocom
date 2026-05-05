import { Logger } from 'koishi'
import { PluginDeps } from '../types'
import { sendImageWithFallback } from '../send-image'

const logger = new Logger('rocom-merchant')

const TEXT = {
  merchant: '\u8fdc\u884c\u5546\u4eba',
  subscribe: '\u8ba2\u9605\u8fdc\u884c\u5546\u4eba',
  unsubscribe: '\u53d6\u6d88\u8ba2\u9605\u8fdc\u884c\u5546\u4eba',
  viewSubscribe: '\u67e5\u770b\u8fdc\u884c\u5546\u4eba\u8ba2\u9605',
  unknown: '\u672a\u77e5',
  notOpen: '\u672a\u5f00\u653e',
  defaultSource: '\u9ed8\u8ba4',
  customSource: '\u81ea\u5b9a\u4e49',
}

type MerchantRoundInfo = {
  current: number | null
  countdown: string
  is_open: boolean
  round_id: string
}

function normalizeTimestamp(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp)) return null
  return timestamp < 100000000000 ? timestamp * 1000 : timestamp
}

function formatProductWindow(product: any): string {
  const start = normalizeTimestamp(product?.start_time)
  const end = normalizeTimestamp(product?.end_time)
  if (!start && !end) return ''

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  }

  if (start && end) return `${formatTime(start)}-${formatTime(end)}`
  if (start) return `${formatTime(start)}+`
  return `${formatTime(end!)}-`
}

function getMerchantActivity(res: any): any {
  const activities = res?.merchantActivities || res?.merchant_activities || []
  return activities[0] || {}
}

function getActiveProducts(res: any): any[] {
  const activity = getMerchantActivity(res)
  const products = activity?.products || activity?.product_list || activity?.get_props || []
  return products.filter((p: any) => {
    const now = Date.now()
    const start = normalizeTimestamp(p.start_time) ?? 0
    const end = normalizeTimestamp(p.end_time) ?? Infinity
    return now >= start && now < end
  })
}

function getCurrentMerchantRound(): MerchantRoundInfo {
  const now = new Date()
  const hour = now.getHours()
  const rounds = [8, 12, 16, 20]
  let currentRound: number | null = null
  let nextRound: number | null = null

  for (let i = 0; i < rounds.length; i++) {
    if (hour >= rounds[i] && (i === rounds.length - 1 || hour < rounds[i + 1])) {
      currentRound = i + 1
      nextRound = i < rounds.length - 1 ? rounds[i + 1] : rounds[0]
      break
    }
  }
  if (currentRound === null) nextRound = rounds[0]

  const nextTime = new Date(now)
  if (nextRound! <= hour) nextTime.setDate(nextTime.getDate() + 1)
  nextTime.setHours(nextRound!, 0, 0, 0)

  const diff = nextTime.getTime() - now.getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  return {
    current: currentRound,
    countdown: `${hours}\u5c0f\u65f6${mins}\u5206\u949f`,
    is_open: currentRound !== null,
    round_id: `${datePart}-${currentRound || 'closed'}`,
  }
}

function parseMerchantSubscriptionArgs(args: string | undefined, defaultItems: string[]) {
  const parts = (args || '').split(/\s+/).filter(Boolean)
  let mentionAll = false

  if (parts[0] === '1' || parts[0] === '0') {
    mentionAll = parts.shift() === '1'
  }

  const items = parts.length ? parts : defaultItems
  return {
    mention_all: mentionAll,
    items,
    source: parts.length ? TEXT.customSource : TEXT.defaultSource,
  }
}

function getSubscriptionTarget(session: any) {
  const platform = session.platform || session.bot?.platform || ''
  const channelId = session.channelId || session.guildId || ''
  const key = session.guildId
  return { key, platform, channelId }
}

function isGroupAdmin(session: any, adminUserIds: string[]) {
  const roles = (session?.event?.member?.roles || []) as any[]
  return roles.includes('admin') || roles.includes('owner') || adminUserIds.includes(session?.userId)
}

function sameStringArray(left: string[], right: string[]) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function register(deps: PluginDeps) {
  const { ctx, config, client, merchantSubMgr } = deps

  ctx.command(TEXT.merchant, '\u67e5\u770b\u8fdc\u884c\u5546\u4eba\u5546\u54c1')
    .action(async ({ session }) => {
      const res = await client.getMerchantInfo(ctx, true)
      if (!res) return '\u83b7\u53d6\u8fdc\u884c\u5546\u4eba\u6570\u636e\u5931\u8d25\u3002'

      const products = getActiveProducts(res)
      const roundInfo = getCurrentMerchantRound()
      const activity = getMerchantActivity(res)
      const data = {
        background: '',
        title: activity.name || TEXT.merchant,
        subtitle: activity.start_date || '\u6bcf\u65e5 08:00 / 12:00 / 16:00 / 20:00 \u5237\u65b0',
        titleIcon: '',
        product_count: products.length,
        round_info: roundInfo,
        products: products.map((p: any) => ({
          name: p.name || TEXT.unknown,
          image: p.icon_url || '',
          time_label: formatProductWindow(p),
        })),
      }
      const fallback = products.length
        ? `\u8fdc\u884c\u5546\u4eba\u5f53\u524d\u5546\u54c1\uff1a${products.map((p: any) => p.name || TEXT.unknown).join('\u3001')}\n\u8f6e\u6b21\uff1a${roundInfo.current || TEXT.notOpen}\n\u5269\u4f59\uff1a${roundInfo.countdown}`
        : '\u5f53\u524d\u8fdc\u884c\u5546\u4eba\u6682\u65e0\u5546\u54c1\u3002'
      const png = await deps.renderer.renderHtml(ctx, 'yuanxing-shangren', data)
      await sendImageWithFallback(session, png, fallback, 'merchant:yuanxing-shangren')
    })

  ctx.command(`${TEXT.subscribe} [args:text]`, '\u8ba2\u9605\u8fdc\u884c\u5546\u4eba\u5546\u54c1\u63d0\u9192')
    .action(async ({ session }, args) => {
      if (!session?.guildId) return '\u8be5\u547d\u4ee4\u4ec5\u652f\u6301\u7fa4\u804a\u4f7f\u7528\u3002'
      if (!isGroupAdmin(session, config.adminUserIds)) return '\u26a0\ufe0f \u4ec5\u7fa4\u7ba1\u7406\u5458\u6216 bot \u7ba1\u7406\u5458\u53ef\u914d\u7f6e\u8fdc\u884c\u5546\u4eba\u8ba2\u9605\u3002'

      const target = getSubscriptionTarget(session)
      const parsed = parseMerchantSubscriptionArgs(args, config.merchantSubscriptionItems)
      const existing = merchantSubMgr.get(target.key)
      merchantSubMgr.upsert(target.key, {
        group_id: session.guildId,
        channel_id: target.channelId,
        platform: target.platform,
        items: parsed.items,
        mention_all: parsed.mention_all,
        last_push_round: existing?.last_push_round ?? null,
        last_matched_items: existing?.last_matched_items ?? [],
        updated_by: session.userId!,
      })

      return `\u2705 \u5df2\u8ba2\u9605\u8fdc\u884c\u5546\u4eba\u5546\u54c1\uff1a${parsed.items.join('\u3001')}\uff08${parsed.source}\uff09\uff1b${parsed.mention_all ? '\u547d\u4e2d\u540e\u4f1a @\u5168\u4f53' : '\u547d\u4e2d\u540e\u4e0d @\u5168\u4f53'}`
    })

  ctx.command(TEXT.viewSubscribe, '\u67e5\u770b\u5f53\u524d\u7fa4\u8fdc\u884c\u5546\u4eba\u8ba2\u9605')
    .action(async ({ session }) => {
      if (!session?.guildId) return '\u8be5\u547d\u4ee4\u4ec5\u652f\u6301\u7fa4\u804a\u4f7f\u7528\u3002'
      const target = getSubscriptionTarget(session)
      const sub = merchantSubMgr.get(target.key)
      if (!sub) return `\u5f53\u524d\u7fa4\u7ec4\u672a\u8ba2\u9605\u8fdc\u884c\u5546\u4eba\u3002\n\u7528\u6cd5\uff1a${TEXT.subscribe} [1/0] [\u5546\u54c1\u540d1] [\u5546\u54c1\u540d2] ...`
      return `\u5f53\u524d\u8ba2\u9605\u5546\u54c1\uff1a${sub.items.join('\u3001')}\n\u63d0\u9192\u65b9\u5f0f\uff1a${sub.mention_all ? '@\u5168\u4f53' : '\u666e\u901a\u63d0\u9192'}`
    })

  ctx.command(TEXT.unsubscribe, '\u53d6\u6d88\u8fdc\u884c\u5546\u4eba\u8ba2\u9605')
    .action(async ({ session }) => {
      if (!session?.guildId) return '\u8be5\u547d\u4ee4\u4ec5\u652f\u6301\u7fa4\u804a\u4f7f\u7528\u3002'
      if (!isGroupAdmin(session, config.adminUserIds)) return '\u26a0\ufe0f \u4ec5\u7fa4\u7ba1\u7406\u5458\u6216 bot \u7ba1\u7406\u5458\u53ef\u53d6\u6d88\u8fdc\u884c\u5546\u4eba\u8ba2\u9605\u3002'
      const target = getSubscriptionTarget(session)
      merchantSubMgr.delete(target.key)
      return '\u2705 \u5df2\u53d6\u6d88\u8fdc\u884c\u5546\u4eba\u8ba2\u9605\u3002'
    })

  if (config.merchantSubscriptionEnabled) {
    ctx.setInterval(async () => {
      const res = await client.getMerchantInfo(ctx, true)
      if (!res) return

      const products = getActiveProducts(res)
      const productNames = products.map((p: any) => p.name || '').filter(Boolean)
      const roundInfo = getCurrentMerchantRound()
      const subs = merchantSubMgr.getAll()

      for (const [key, sub] of Object.entries(subs)) {
        const matched = sub.items.filter((item: string) => productNames.some(n => n.includes(item)))
        if (!matched.length) continue
        if (sub.last_push_round === roundInfo.round_id && sameStringArray(matched, sub.last_matched_items || [])) continue

        const msg = `\ud83d\udd14 \u8fdc\u884c\u5546\u4eba\u5237\u65b0\u63d0\u9192\n\u5f53\u524d\u5546\u54c1\uff1a${productNames.join('\u3001')}\n\u5339\u914d\u8ba2\u9605\uff1a${matched.join('\u3001')}`
        try {
          if (!ctx.bots.length) {
            logger.warn('\u65e0\u53ef\u7528 bot\uff0c\u8df3\u8fc7\u63a8\u9001')
            continue
          }
          const platform = sub.platform || ctx.bots[0]?.platform
          const channelId = sub.channel_id || sub.group_id || key
          if (!platform || !channelId) {
            logger.warn(`\u63a8\u9001\u5931\u8d25 ${key}: \u65e0\u6cd5\u786e\u5b9a\u5e73\u53f0\u6216\u9891\u9053`)
            continue
          }
          await ctx.broadcast([`${platform}:${channelId}`], sub.mention_all ? `@\u5168\u4f53\n${msg}` : msg)
          merchantSubMgr.upsert(key, {
            ...sub,
            last_push_round: roundInfo.round_id,
            last_matched_items: matched,
          })
        } catch (e) {
          logger.error(`\u63a8\u9001\u5931\u8d25 ${key}: ${e}`)
        }
      }
    }, config.merchantCheckInterval)
  }
}
