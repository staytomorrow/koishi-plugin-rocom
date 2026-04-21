import { h } from 'koishi'
import { PluginDeps } from '../types'
import { getPrimaryToken, notLoggedInHint } from './account'

async function sendImage(deps: PluginDeps, session: any, templateName: string, data: any, fallback: string) {
  const png = await deps.renderer.renderHtml(deps.ctx, templateName, data)
  if (png) await session.send(h.image(png, 'image/png'))
  else await session.send(fallback)
}

export function register(deps: PluginDeps) {
  const { ctx, client } = deps

  ctx.command('洛克档案', '查看个人档案')
    .action(async ({ session }) => {
      const fwToken = getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()
      await session!.send('正在获取洛克王国数据...')
      const [roleRes, evalRes, sumRes, collRes, boRes] = await Promise.all([
        client.getRole(ctx, fwToken), client.getEvaluation(ctx, fwToken),
        client.getPetSummary(ctx, fwToken), client.getCollection(ctx, fwToken),
        client.getBattleOverview(ctx, fwToken),
      ])
      if (!roleRes?.role) return '获取角色档案失败，凭据可能已过期，请重新登录。'
      const role = roleRes.role, ev = evalRes || {}, sm = sumRes || {}, cl = collRes || {}, bo = boRes || {}

      const summaryTitleParts = sm.best_pet_name ? sm.best_pet_name.split('') : []
      const radarData = {
        strength: ev.strength || 0,
        collection: ev.collection || 0,
        capture: ev.capture || 0,
        progression: ev.progression || 0,
      }
      const cx = 130, cy = 130, r = 90
      const dims = [
        { label: '战力', value: radarData.strength, angle: -90 },
        { label: '收藏', value: radarData.collection, angle: 0 },
        { label: '捉定', value: radarData.capture, angle: 90 },
        { label: '推进', value: radarData.progression, angle: 180 },
      ]
      const toXY = (angle: number, radius: number) => {
        const rad = angle * Math.PI / 180
        return { x: Math.round(cx + radius * Math.cos(rad)), y: Math.round(cy + radius * Math.sin(rad)) }
      }
      const radarPolygons = [1, 0.66, 0.33].map(s => {
        const pts = dims.map(d => toXY(d.angle, r * s))
        return pts.map(p => `${p.x},${p.y}`).join(' ')
      })
      const radarAxes = dims.map(d => toXY(d.angle, r))
      const radarAreaPoints = dims.map(d => toXY(d.angle, r * Math.min(d.value, 100) / 100)).map(p => `${p.x},${p.y}`).join(' ')
      const radarAxisLabels = dims.map(d => {
        const p = toXY(d.angle, r + 28)
        return { x: p.x, y: p.y, name: d.label, anchor: 'middle' }
      })
      const radarValueBadges = dims.map(d => {
        const p = toXY(d.angle, r + 14)
        return { x: p.x - 20, y: p.y + 8, width: 40, value: d.value }
      })
      const radarDots = dims.map(d => toXY(d.angle, r * Math.min(d.value, 100) / 100))

      const data = {
        userName: role.name || '洛克',
        userLevel: role.level || 1,
        userUid: role.id || '',
        userAvatarDisplay: role.avatar_url || '',
        enrollDays: role.enroll_days || 0,
        starName: role.star_name || '魔法学徒',
        backgroundUrl: '',
        hasAiProfileData: !!sm.best_pet_name,
        bestPetName: sm.best_pet_name || '',
        summaryTitleParts,
        bestPetImageDisplay: sm.best_pet_img_url || '',
        fallbackPetImage: '',
        scoreText: ev.score || '0.0',
        aiCommentText: sm.summary_content || '暂无点评',
        centerX: cx,
        centerY: cy,
        radarPolygons,
        radarAxes,
        radarAreaPoints,
        radarAxisLabels,
        radarValueBadges,
        radarDots,
        currentCollectionCount: cl.current_collection_count || 0,
        totalCollectionCount: cl.total_collection_count || 0,
        amazingSpriteCount: cl.amazing_sprite_count || 0,
        shinySpriteCount: cl.shiny_sprite_count || 0,
        colorfulSpriteCount: cl.colorful_sprite_count || 0,
        fashionCollectionCount: cl.fashion_collection_count || 0,
        itemCount: cl.item_count || 0,
        collectionHint: '查看收藏详情',
        hasBattleData: bo.total_match > 0,
        tierBadgeUrl: bo.tier_icon_url || '',
        winRate: `${bo.win_rate || 0}%`,
        totalMatch: bo.total_match || 0,
        matchResult: 'win',
        leftTeamPets: [],
        rightTeamPets: [],
        opponentName: '',
        opponentAvatarDisplay: '',
        commandHint: '洛克背包 <筛选> <页码> | 洛克战绩 <页码>',
        copyright: 'Koishi & WeGame 洛克王国插件',
      }
      const fallback = `【${role.name}的档案】Lv.${role.level} UID:${role.id}\n评分:${ev.score || '0'} 收藏:${cl.current_collection_count || 0}/${cl.total_collection_count || 0}`
      await sendImage(deps, session, 'personal-card', data, fallback)
    })

  ctx.command('洛克战绩 [page:number]', '查看对战战绩')
    .action(async ({ session }, _page = 1) => {
      const fwToken = getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()
      const [roleRes, boRes, blRes] = await Promise.all([
        client.getRole(ctx, fwToken), client.getBattleOverview(ctx, fwToken),
        client.getBattleList(ctx, fwToken, 4),
      ])
      if (!roleRes?.role) return '获取战绩数据失败。'
      const role = roleRes.role, bo = boRes || {}
      const battles = (blRes?.battles || []).map((b: any) => {
        const resClass = b.result === 1 ? 'fail' : 'win'
        const bt = b.battle_time ? new Date(b.battle_time) : null
        return {
          time: bt ? bt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '?',
          date: bt ? bt.toLocaleDateString('zh-CN') : '?', result: resClass,
          leftName: b.nickname || '', leftAvatar: b.avatar_url || '',
          leftPets: (b.pet_base_info || []).map((p: any) => ({ icon: p.pet_img_url?.replace('/image.png', '/icon.png') || '' })),
          rightName: b.enemy_nickname || '', rightAvatar: b.enemy_avatar_url || '',
          rightPets: (b.enemy_pet_base_info || []).map((p: any) => ({ icon: p.pet_img_url?.replace('/image.png', '/icon.png') || '' })),
        }
      })
      const data = {
        userAvatarDisplay: role.avatar_url || '',
        userName: role.name,
        userLevel: role.level || 1,
        userUid: role.id || '',
        winRate: `${bo.win_rate || 0}%`,
        totalMatch: bo.total_match || 0,
        battles,
        commandHint: '洛克战绩 <页码>',
        copyright: 'Koishi & WeGame 洛克王国插件',
      }
      await sendImage(deps, session, 'record', data, `【${role.name}的战绩】胜率:${bo.win_rate || 0}% 场次:${bo.total_match || 0}`)
    })

  ctx.command('洛克背包 [arg1:string] [arg2:string]', '查看精灵背包')
    .action(async ({ session }, arg1, arg2) => {
      const fwToken = getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()
      const catMap: Record<string, number> = { '全部': 0, '了不起': 1, '异色': 2, '炫彩': 3 }
      let category = '全部', pageNo = 1
      for (const arg of [arg1, arg2]) {
        if (!arg) continue
        if (/^\d+$/.test(arg)) pageNo = parseInt(arg)
        else if (arg in catMap) category = arg
        else if (arg.replace('精灵', '') in catMap) category = arg.replace('精灵', '')
      }
      const petSubset = catMap[category] ?? 0
      const [roleRes, petRes] = await Promise.all([
        client.getRole(ctx, fwToken), client.getPets(ctx, fwToken, petSubset, pageNo, 10),
      ])
      if (!roleRes?.role || !petRes?.pets) return '获取背包数据失败。'
      const role = roleRes.role
      const data = {
        userName: role.name || '洛克',
        userLevel: role.level || 1,
        userUid: role.id || '',
        userAvatar: role.avatar_url || '',
        pageTitle: `背包 - ${category}精灵`,
        tabs: [{ name: '全部', active: category === '全部' }],
        currentTab: `${category}精灵`,
        totalCount: petRes.total || 0,
        accountLabel: role.name || '',
        pets: (petRes.pets || []).map((p: any) => ({
          name: p.pet_name?.split('&')[0] || '?',
          custom_name: p.pet_name?.includes('&') ? p.pet_name.split('&')[1] : undefined,
          level: p.pet_level || 1,
          pet_img_url: p.pet_img_url || '',
          elementIcons: (p.pet_types_info || []).map((t: any) => ({ src: t.icon || '', name: t.name || '' })),
          badgeImage: '',
        })),
        emptySlots: [],
        currentPage: pageNo,
        totalPages: Math.max(1, Math.ceil((petRes.total || 0) / 10)),
        pageSize: 10,
        commandHint: '洛克背包 <全部/异色/了不起/炫彩> <页码>',
        fallbackPetImage: '',
      }
      await sendImage(deps, session, 'package', data, `【背包 - ${category}精灵】共${petRes.total || 0}只`)
    })

  ctx.command('洛克阵容 [arg1:string] [arg2:string]', '查看阵容推荐')
    .action(async ({ session }, arg1, arg2) => {
      const fwToken = getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()
      let category = '', pageNo = 1
      for (const arg of [arg1, arg2]) {
        if (!arg) continue
        if (/^\d+$/.test(arg)) pageNo = parseInt(arg)
        else category = arg
      }
      const res = await client.getLineupList(ctx, fwToken, pageNo, category)
      if (!res?.lineups) return '获取阵容数据失败。'
      const data = {
        category: category || '热门推荐',
        lineups: (res.lineups || []).map((l: any) => ({
          name: l.name || '',
          tags: l.tags || [],
          likes: l.likes || 0,
          author_name: l.author_name || '?',
          lineup_code: String(l.id || ''),
          pets: (l.lineup?.pets || []).map((p: any) => ({
            pet_name: p.pet_name || '',
            pet_img_url: p.pet_img_url || '',
            skills_info: (p.skills_info || []).map((s: any) => ({ skill_img_url: s.skill_img_url || '' })),
          })),
        })),
        page_no: res.page_no || pageNo,
        total_pages: res.total_pages || 1,
        fallbackPetImage: '',
        commandHint: '洛克阵容 <分类> <页码>',
      }
      await sendImage(deps, session, 'lineup', data, `【阵容推荐】${category || '热门'} 第${pageNo}页`)
    })

  ctx.command('洛克交换大厅 [page:number]', '查看交换大厅')
    .alias('洛克大厅').alias('交换大厅')
    .action(async ({ session }, page = 1) => {
      const fwToken = getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()
      const res = await client.getExchangePosters(ctx, fwToken, page)
      if (!res?.posters) return '获取交换大厅数据失败。'
      const data = {
        filterLabel: '全部',
        posts: (res.posters || []).map((p: any) => {
          const u = p.user_info || {}
          return {
            userName: u.nickname || '?',
            userLevel: u.level || 0,
            isOnline: u.online_status === 1,
            avatarUrl: u.avatar_url || '',
            userId: u.role_id || '',
            wantText: p.want_item_name || '交友',
            wantBadgeUrl: '',
            isExpired: false,
            provideItems: (p.offer_items || []).map((i: any) => ({ name: i.name || i })),
            timeLabel: p.create_time
              ? new Date(Number(p.create_time) * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
              : '?',
          }
        }),
        currentPage: page,
        totalPages: res.total_pages || 1,
        commandHint: '洛克交换大厅 <页码>',
      }
      await sendImage(deps, session, 'exchange-hall', data, `【交换大厅】第${page}页`)
    })
}
