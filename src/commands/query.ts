import { Logger } from 'koishi'
import { PluginDeps } from '../types'
import { getPrimaryToken, notLoggedInHint } from './account'
import { sendImageWithFallback } from '../send-image'

const logger = new Logger('rocom-query')

async function sendImage(deps: PluginDeps, session: any, templateName: string, data: any, fallback: string) {
  const png = await deps.renderer.renderHtml(deps.ctx, templateName, data)
  await sendImageWithFallback(session, png, fallback, `query:${templateName}`)
}

type IngamePlayerRow = {
  field?: string
  label?: string
  value?: unknown
}

type IngamePlayerPayload = {
  rows?: IngamePlayerRow[]
  notes?: unknown[]
  title?: string
  [key: string]: any
}

function cleanPlayerFieldValue(field: string, value: unknown): string {
  const text = String(value ?? '').trim().replace(/^'+|'+$/g, '')
  if (!text || ['<0B>', '<0b>', '<0B >', '<0b >'].includes(text)) return '未设置'
  if (['is_online', 'online', 'chat_top_unlock', 'is_friend', 'is_black', 'is_black_role', 'is_chat_node_unlock'].includes(field)) {
    return ['1', 'true', 'True', '是'].includes(text) ? '是' : '否'
  }
  if (['sex', 'gender'].includes(field)) {
    return { '0': '未知', '1': '男', '2': '女' }[text] || text
  }
  if (field === 'friend_type') {
    return { '0': '默认', '1': '特殊' }[text] || text
  }
  if (field === 'battle_state') {
    return { '0': '空闲', '1': '对战中' }[text] || text
  }
  return text
}

function parseIngamePlayerPayload(payload: IngamePlayerPayload | null | undefined, uid: string) {
  const rows = payload?.rows || []
  const rowMap: Record<string, string> = {}
  const labelMap: Record<string, string> = {}

  for (const row of rows) {
    const field = String(row.field || '')
    if (!field) continue
    rowMap[field] = String(row.value ?? '')
    labelMap[field] = String(row.label || field)
  }

  const playerUid = cleanPlayerFieldValue('uin', rowMap.uin || uid)
  const signature = cleanPlayerFieldValue('signature', rowMap.signature || '')
  return {
    title: String(payload?.title || '玩家搜索'),
    nickname: cleanPlayerFieldValue('name', rowMap.name || '-'),
    uid: playerUid,
    level: cleanPlayerFieldValue('level', rowMap.level || '-'),
    signature: signature === '未设置' ? '' : signature,
    rowMap,
    labelMap,
  }
}

function playerField(parsed: ReturnType<typeof parseIngamePlayerPayload> | null, field: string, defaultValue = '未设置') {
  if (!parsed) return defaultValue
  const raw = parsed.rowMap[field]
  if (raw == null || raw === '') return defaultValue
  const value = cleanPlayerFieldValue(field, raw)
  return value && value !== '-' && value !== '未设置' ? value : defaultValue
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractTopLevelJsonSegments(text: string): string[] {
  const segments: string[] = []
  let start = -1
  let depth = 0
  let quote: '"' | '\'' | '' = ''
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === quote) quote = ''
      continue
    }

    if (ch === '"' || ch === '\'') {
      quote = ch as '"' | '\''
      continue
    }

    if (ch === '{' || ch === '[') {
      if (depth === 0) start = i
      depth++
      continue
    }

    if (ch === '}' || ch === ']') {
      if (depth <= 0) continue
      depth--
      if (depth === 0 && start >= 0) {
        segments.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return segments
}

function collectExchangeItemNames(input: unknown, output: Set<string>) {
  if (input == null) return

  if (Array.isArray(input)) {
    for (const item of input) collectExchangeItemNames(item, output)
    return
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>
    const preferredKeys = ['name', 'item_name', 'title', 'label', 'text', 'value']
    let consumedPreferred = false

    for (const key of preferredKeys) {
      if (record[key] == null) continue
      consumedPreferred = true
      collectExchangeItemNames(record[key], output)
    }

    if (!consumedPreferred) {
      for (const value of Object.values(record)) collectExchangeItemNames(value, output)
    }
    return
  }

  if (typeof input === 'string') {
    const text = input.trim()
    if (!text) return

    const direct = tryParseJson(text)
    if (direct != null) {
      collectExchangeItemNames(direct, output)
      return
    }

    const unescaped = text.replace(/\\"/g, '"')
    if (unescaped !== text) {
      const escapedParsed = tryParseJson(unescaped)
      if (escapedParsed != null) {
        collectExchangeItemNames(escapedParsed, output)
        return
      }
    }

    const chunks = extractTopLevelJsonSegments(text)
    let parsedFromChunks = false
    for (const chunk of chunks) {
      const parsed = tryParseJson(chunk)
      if (parsed == null) continue
      parsedFromChunks = true
      collectExchangeItemNames(parsed, output)
    }
    if (parsedFromChunks) return

    const nameRegex = /["']name["']\s*:\s*["']([^"']+)["']/g
    let matched = false
    for (let match = nameRegex.exec(text); match; match = nameRegex.exec(text)) {
      const candidate = match[1]?.trim()
      if (!candidate) continue
      output.add(candidate)
      matched = true
    }
    if (matched) return

    output.add(text)
    return
  }

  const text = String(input).trim()
  if (text) output.add(text)
}

function parseExchangeItems(raw: unknown): string[] {
  const names = new Set<string>()
  collectExchangeItemNames(raw, names)
  return [...names]
}

function parseExchangeWantText(raw: unknown): string {
  const names = parseExchangeItems(raw)
  return names[0] || '交友'
}

export function register(deps: PluginDeps) {
  const { ctx, client } = deps

  ctx.command('洛克档案', '查看个人档案')
    .action(async ({ session }) => {
      const fwToken = await getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()

      const userIdentifier = session!.userId!
      await session!.send('正在获取洛克王国数据...')

      const [roleRes, evalRes, sumRes, collRes, boRes, blRes] = await Promise.all([
        client.getRole(ctx, fwToken, undefined, userIdentifier),
        client.getEvaluation(ctx, fwToken, userIdentifier),
        client.getPetSummary(ctx, fwToken, userIdentifier),
        client.getCollection(ctx, fwToken, userIdentifier),
        client.getBattleOverview(ctx, fwToken, userIdentifier),
        client.getBattleList(ctx, fwToken, 1, '', userIdentifier),
      ])

      if (!roleRes?.role) return '获取角色档案失败，凭据可能已过期，请重新登录。'

      const role = roleRes.role
      const ev = evalRes || {}
      const sm = sumRes || {}
      const cl = collRes || {}
      const bo = boRes || {}
      const recentBattle = blRes?.battles?.[0]
      const playerSearchRes = role?.id ? await client.ingamePlayerSearch(ctx, String(role.id)) : null
      const playerSearchData = parseIngamePlayerPayload(playerSearchRes, String(role.id || ''))
      const profileSignature = playerSearchData?.signature || ''
      const profileHeadTags = playerSearchData ? [
        { label: '在线', value: playerField(playerSearchData, 'online', '未知') },
        { label: '性别', value: playerField(playerSearchData, 'gender', playerField(playerSearchData, 'sex', '未知')) },
        { label: '世界等级', value: playerField(playerSearchData, 'world_level') },
        { label: '家园等级', value: playerField(playerSearchData, 'home_level') },
      ].filter((item) => item.value && item.value !== '-' && item.value !== '未设置').slice(0, 4) : []
      const profileHomeItems = playerSearchData ? [
        { label: '家园名称', value: playerField(playerSearchData, 'home_name') },
        { label: '家园等级', value: playerField(playerSearchData, 'home_level') },
        { label: '家园经验', value: playerField(playerSearchData, 'home_experience') },
        { label: '舒适度', value: playerField(playerSearchData, 'home_comfort_level') },
        { label: '访客数量', value: playerField(playerSearchData, 'visitor_num') },
      ].filter((item) => item.value && item.value !== '-' && item.value !== '未设置') : []
      const profileCardItems = playerSearchData ? [
        { label: '名片皮肤', value: playerField(playerSearchData, 'card_skin_selected') },
        { label: '名片头像', value: playerField(playerSearchData, 'card_icon_selected') },
      ].filter((item) => item.value && item.value !== '-' && item.value !== '未设置') : []
      const profileCardImage = playerSearchData ? playerField(playerSearchData, 'card_bussiness_card_url', '') : ''
      const profileStatusText = playerSearchData ? playerField(playerSearchData, 'online', '未知') : '未知'
      const hasExtraProfileData = Boolean(profileSignature || profileHomeItems.length || profileCardItems.length || profileCardImage)

      let degraded = false
      if (!sm) {
        logger.warn('[Rocom] 洛克档案：pet-summary 接口不可用，已降级为基础档案渲染')
        degraded = true
      }
      if (!ev) {
        logger.warn('[Rocom] 洛克档案：evaluation 接口不可用，已降级为基础档案渲染')
        degraded = true
      }
      if (!cl) {
        logger.warn('[Rocom] 洛克档案：collection 接口不可用，已降级为基础档案渲染')
        degraded = true
      }
      if (!bo) {
        logger.warn('[Rocom] 洛克档案：battle-overview 接口不可用，已降级为基础档案渲染')
        degraded = true
      }
      if (degraded) {
        try {
          await session!.send('AI评分接口暂不可用，已降级为基础档案渲染。')
        } catch {
          // Ignore prompt delivery failure and continue rendering the card.
        }
      }

      const radarData = {
        strength: ev.strength || 0,
        collection: ev.collection || 0,
        capture: ev.capture || 0,
        progression: ev.progression || 0,
      }
      const cx = 130
      const cy = 130
      const r = 90
      const dims = [
        { label: '战力', value: radarData.strength, angle: -90 },
        { label: '收藏', value: radarData.collection, angle: 0 },
        { label: '捕捉', value: radarData.capture, angle: 90 },
        { label: '推进', value: radarData.progression, angle: 180 },
      ]
      const toXY = (angle: number, radius: number) => {
        const rad = angle * Math.PI / 180
        return { x: Math.round(cx + radius * Math.cos(rad)), y: Math.round(cy + radius * Math.sin(rad)) }
      }
      const radarPolygons = [1, 0.66, 0.33].map((scale) => {
        const pts = dims.map(dim => toXY(dim.angle, r * scale))
        return pts.map(point => `${point.x},${point.y}`).join(' ')
      })
      const radarAxes = dims.map(dim => toXY(dim.angle, r))
      const radarAreaPoints = dims
        .map(dim => toXY(dim.angle, r * Math.min(dim.value, 100) / 100))
        .map(point => `${point.x},${point.y}`)
        .join(' ')
      const radarAxisLabels = dims.map(dim => {
        const point = toXY(dim.angle, r + 28)
        return { x: point.x, y: point.y, name: dim.label, anchor: 'middle' }
      })
      const radarValueBadges = dims.map(dim => {
        const point = toXY(dim.angle, r + 14)
        return { x: point.x - 20, y: point.y + 8, width: 40, value: dim.value }
      })
      const radarDots = dims.map(dim => toXY(dim.angle, r * Math.min(dim.value, 100) / 100))

      const data = {
        userName: role.name || '洛克',
        userLevel: role.level || 1,
        userUid: role.id || '',
        userAvatarDisplay: role.avatar_url || '',
        enrollDays: role.enroll_days || 0,
        starName: role.star_name || '魔法学徒',
        backgroundUrl: role.background_url || '',
        hasAiProfileData: !!sm.best_pet_name,
        bestPetName: sm.best_pet_name || '',
        summaryTitleParts: String(sm.summary_title || '未 知').split(' '),
        bestPetImageDisplay: sm.best_pet_img_url || '',
        fallbackPetImage: '{{_res_path}}img/roco_icon.png',
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
        matchResult: '',
        leftTeamPets: [],
        rightTeamPets: [],
        opponentName: '',
        opponentAvatarDisplay: '',
        hasExtraProfileData,
        profileSignature,
        showProfileSignature: Boolean(profileSignature),
        profileHeadTags,
        profileHomeItems,
        profileCardItems,
        profileCardImage,
        profileStatusText,
        profileStatusClass: profileStatusText === '是' ? 'online' : 'offline',
        commandHint: '洛克背包 <筛选> <页码> | 洛克战绩 <页码> | 洛克 查看菜单',
        copyright: 'AstrBot & WeGame Locke Kingdom Plugin',
      }

      if (recentBattle) {
        data.hasBattleData = true
        data.matchResult = recentBattle.result === 1 ? 'fail' : 'win'
        data.opponentName = recentBattle.enemy_nickname || ''
        data.opponentAvatarDisplay = recentBattle.enemy_avatar_url || ''
        data.leftTeamPets = (recentBattle.pet_base_info || []).map((pet: any) => ({
          icon: pet.pet_img_url?.replace('/image.png', '/icon.png') || '',
        }))
        data.rightTeamPets = (recentBattle.enemy_pet_base_info || []).map((pet: any) => ({
          icon: pet.pet_img_url?.replace('/image.png', '/icon.png') || '',
        }))
      }

      const fallback = `【${role.name}的档案】Lv.${role.level} UID:${role.id}\n评分:${ev.score || '0'} 收藏:${cl.current_collection_count || 0}/${cl.total_collection_count || 0}`
      await sendImage(deps, session, 'personal-card', data, fallback)
    })

  ctx.command('洛克战绩 [page:number]', '查看对战战绩')
    .action(async ({ session }, _page = 1) => {
      const fwToken = await getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()

      const userIdentifier = session!.userId!
      const [roleRes, boRes, blRes] = await Promise.all([
        client.getRole(ctx, fwToken, undefined, userIdentifier),
        client.getBattleOverview(ctx, fwToken, userIdentifier),
        client.getBattleList(ctx, fwToken, 4, '', userIdentifier),
      ])

      if (!roleRes?.role) return '获取战绩数据失败。'

      const role = roleRes.role
      const bo = boRes || {}
      const battles = (blRes?.battles || []).map((battle: any) => {
        const result = battle.result === 1 ? 'fail' : 'win'
        const battleTime = battle.battle_time ? new Date(battle.battle_time) : null
        return {
          time: battleTime ? battleTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '?',
          date: battleTime ? battleTime.toLocaleDateString('zh-CN') : '?',
          result,
          leftName: battle.nickname || '',
          leftAvatar: battle.avatar_url || '',
          leftPets: (battle.pet_base_info || []).map((pet: any) => ({
            icon: pet.pet_img_url?.replace('/image.png', '/icon.png') || '',
          })),
          rightName: battle.enemy_nickname || '',
          rightAvatar: battle.enemy_avatar_url || '',
          rightPets: (battle.enemy_pet_base_info || []).map((pet: any) => ({
            icon: pet.pet_img_url?.replace('/image.png', '/icon.png') || '',
          })),
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
      const fwToken = await getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()

      const catMap: Record<string, number> = { '全部': 0, '了不起': 1, '异色': 2, '炫彩': 3 }
      let category = '全部'
      let pageNo = 1
      for (const arg of [arg1, arg2]) {
        if (!arg) continue
        if (/^\d+$/.test(arg)) pageNo = parseInt(arg)
        else if (arg in catMap) category = arg
        else if (arg.replace('精灵', '') in catMap) category = arg.replace('精灵', '')
      }

      const userIdentifier = session!.userId!
      const petSubset = catMap[category] ?? 0
      const [roleRes, petRes] = await Promise.all([
        client.getRole(ctx, fwToken, undefined, userIdentifier),
        client.getPets(ctx, fwToken, petSubset, pageNo, 10, userIdentifier),
      ])

      if (!roleRes?.role || !petRes?.pets) return '获取背包数据失败。'

      const role = roleRes.role
      const data = {
        userName: role.name || '洛克',
        userLevel: role.level || 1,
        userUid: role.id || '',
        userAvatar: role.avatar_url || '',
        pageTitle: `背包 - ${category}精灵`, 
        tabs: [
          { text: '全部精灵', active: category === '全部' },
          { text: '了不起精灵', active: category === '了不起' },
          { text: '异色精灵', active: category === '异色' },
          { text: '炫彩精灵', active: category === '炫彩' },
        ],
        currentTab: `${category}精灵`, 
        totalCount: petRes.total || 0,
        accountLabel: role.name || '',
        pets: (petRes.pets || []).map((pet: any) => ({
          name: pet.pet_name?.split('&')[0] || '?',
          custom_name: pet.pet_name?.includes('&') ? pet.pet_name.split('&')[1] : undefined,
          level: pet.pet_level || 1,
          pet_img_url: pet.pet_img_url || '',
          elementIcons: (pet.pet_types_info || []).map((petType: any) => ({ src: petType.icon || '', name: petType.name || '' })),
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
      const fwToken = await getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()

      const userIdentifier = session!.userId!
      let category = ''
      let pageNo = 1
      for (const arg of [arg1, arg2]) {
        if (!arg) continue
        if (/^\d+$/.test(arg)) pageNo = parseInt(arg)
        else category = arg
      }

      const res = await client.getLineupList(ctx, fwToken, pageNo, category, userIdentifier)
      if (!res?.lineups) return '获取阵容数据失败。'

      const data = {
        category: category || '热门推荐',
        lineups: (res.lineups || []).map((lineup: any) => ({
          name: lineup.name || '',
          tags: lineup.tags || [],
          likes: lineup.likes || 0,
          author_name: lineup.author_name || '?',
          lineup_code: String(lineup.id || ''),
          pets: (lineup.lineup?.pets || []).map((pet: any) => ({
            pet_name: pet.pet_name || '',
            pet_img_url: pet.pet_img_url || '',
            skills_info: (pet.skills_info || []).map((skill: any) => ({ skill_img_url: skill.skill_img_url || '' })),
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
      const fwToken = await getPrimaryToken(deps, session!.userId!)
      if (!fwToken) return notLoggedInHint()

      const userIdentifier = session!.userId!
      const res = await client.getExchangePosters(ctx, fwToken, page, userIdentifier)
      if (!res?.posters) return '获取交换大厅数据失败。'

      const data = {
        filterLabel: '全部',
        posts: (res.posters || []).map((poster: any) => {
          const user = poster.user_info || {}
          const provideItems = parseExchangeItems(
            poster.offer_items ?? poster.offer_item_names ?? poster.offerItems ?? [],
          )
          return {
            userName: user.nickname || '?',
            userLevel: user.level || 0,
            isOnline: user.online_status === 1,
            avatarUrl: user.avatar_url || '',
            userId: user.role_id || '',
            wantText: parseExchangeWantText(
              poster.want_item_name ?? poster.want_item ?? poster.wantText ?? '交友',
            ),
            wantBadgeUrl: '',
            isExpired: false,
            provideItems: provideItems.length > 0 ? provideItems : ['暂无'],
            timeLabel: poster.create_time
              ? new Date(Number(poster.create_time) * 1000).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
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



