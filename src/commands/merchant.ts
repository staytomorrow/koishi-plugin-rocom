import { Logger, h } from 'koishi'
import { PluginDeps } from '../types'

const logger = new Logger('rocom-merchant')

function getActiveProducts(res: any): any[] {
  const activities = res?.merchantActivities || res?.merchant_activities || []
  if (!activities.length) return []
  const activity = activities[0]
  const products = activity?.products || activity?.product_list || []
  return products.filter((p: any) => {
    const now = Date.now()
    const start = p.start_time ? Number(p.start_time) * 1000 : 0
    const end = p.end_time ? Number(p.end_time) * 1000 : Infinity
    return now >= start && now < end
  })
}

function getCurrentMerchantRound(): { current: number | null; countdown: string; is_open: boolean } {
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
  if (currentRound === null) {
    currentRound = null
    nextRound = rounds[0]
  }
  const nextTime = new Date(now)
  if (nextRound! <= hour) nextTime.setDate(nextTime.getDate() + 1)
  nextTime.setHours(nextRound!, 0, 0, 0)
  const diff = nextTime.getTime() - now.getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return {
    current: currentRound,
    countdown: `${hours}小时${mins}分钟`,
    is_open: currentRound !== null,
  }
}

export function register(deps: PluginDeps) {
  const { ctx, config, client, merchantSubMgr } = deps

  ctx.command('远行商人', '查看远行商人商品')
    .action(async ({ session }) => {
      const res = await client.getMerchantInfo(ctx, true)
      if (!res) return '获取远行商人数据失败。'
      const products = getActiveProducts(res)
      const roundInfo = getCurrentMerchantRound()
      const activities = res?.merchantActivities || res?.merchant_activities || []
      const activity = activities[0] || {}
      const data = {
        background: '',
        title: activity.name || '远行商人',
        subtitle: activity.start_date || '每日 08:00 / 12:00 / 16:00 / 20:00 刷新',
        titleIcon: '',
        product_count: products.length,
        round_info: roundInfo,
        products: products.map((p: any) => ({
          name: p.name || '未知',
          image: p.icon_url || '',
          time_label: '',
        })),
      }
      const fallback = products.length
        ? `远行商人当前商品：${products.map((p: any) => p.name || '未知').join('、')}\n轮次：${roundInfo.current || '未开放'}\n剩余：${roundInfo.countdown}`
        : '当前远行商人暂无商品。'
      const png = await deps.renderer.renderHtml(ctx, 'yuanxing-shangren', data)
      if (png) await session!.send(h.image(png, 'image/png'))
      else await session!.send(fallback)
    })

  ctx.command('订阅远行商人 [args:text]', '订阅远行商人商品提醒')
    .action(async ({ session }, args) => {
      if (!session!.guildId) return '该命令仅支持群聊使用。'
      const role = (session!.event?.member?.roles || []) as any[]
      const isGroupAdmin = role.includes('admin') || role.includes('owner')
      const isBotAdmin = config.adminUserIds.includes(session!.userId!)
      if (!isGroupAdmin && !isBotAdmin) return '⚠️ 仅群管理员或 bot 管理员可配置远行商人订阅。'
      const guildId = session!.guildId
      if (!args) {
        const sub = merchantSubMgr.get(guildId)
        if (!sub) return '当前群组未订阅远行商人。\n用法：订阅远行商人 <商品名1> <商品名2> ...'
        return `当前订阅商品：${sub.items.join('、')}`
      }
      const items = args.split(/\s+/).filter(Boolean)
      merchantSubMgr.upsert(guildId, { items })
      return `✅ 已订阅远行商人商品：${items.join('、')}`
    })

  ctx.command('取消订阅远行商人', '取消远行商人订阅')
    .action(async ({ session }) => {
      if (!session!.guildId) return '该命令仅支持群聊使用。'
      const role = (session!.event?.member?.roles || []) as any[]
      const isGroupAdmin = role.includes('admin') || role.includes('owner')
      const isBotAdmin = config.adminUserIds.includes(session!.userId!)
      if (!isGroupAdmin && !isBotAdmin) return '⚠️ 仅群管理员或 bot 管理员可取消远行商人订阅。'
      const guildId = session!.guildId
      merchantSubMgr.delete(guildId)
      return '✅ 已取消远行商人订阅。'
    })

  if (config.merchantSubscriptionEnabled) {
    let lastProducts: string[] = []
    ctx.setInterval(async () => {
      const res = await client.getMerchantInfo(ctx, true)
      if (!res) return
      const products = getActiveProducts(res)
      const productNames = products.map((p: any) => p.name || '').filter(Boolean)
      if (JSON.stringify(productNames) === JSON.stringify(lastProducts)) return
      lastProducts = productNames
      const subs = merchantSubMgr.getAll()
      for (const [guildId, sub] of Object.entries(subs)) {
        const matched = sub.items.filter((item: string) => productNames.some(n => n.includes(item)))
        if (matched.length) {
          const msg = `🔔 远行商人刷新提醒\n当前商品：${productNames.join('、')}\n匹配订阅：${matched.join('、')}`
          try {
            await ctx.broadcast([`${ctx.bots[0].platform}:${guildId}`], msg)
          } catch (e) {
            logger.error(`推送失败 ${guildId}: ${e}`)
          }
        }
      }
    }, config.merchantCheckInterval)
  }
}
