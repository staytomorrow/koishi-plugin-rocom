import { Logger } from 'koishi'
import fs from 'node:fs'
import path from 'node:path'

const logger = new Logger('rocom-egg')

export const EGG_GROUP_META: Record<number, { label: string; desc: string }> = {
  1:  { label: '未发现', desc: '不能和任何精灵生蛋' },
  2:  { label: '怪兽', desc: '像怪兽一样的动物' },
  3:  { label: '两栖', desc: '两栖动物和水边生活的多栖动物' },
  4:  { label: '虫', desc: '看起来像虫子的精灵' },
  5:  { label: '飞行', desc: '会飞的精灵' },
  6:  { label: '陆上', desc: '生活在陆地上的精灵' },
  7:  { label: '妖精', desc: '可爱的小动物' },
  8:  { label: '植物', desc: '看起来像植物的精灵' },
  9:  { label: '人型', desc: '看起来像人的精灵' },
  10: { label: '软体', desc: '看起来软软的精灵' },
  11: { label: '矿物', desc: '身体由矿物组成的精灵' },
  12: { label: '不定形', desc: '没有固定形态的精灵' },
  13: { label: '鱼', desc: '看起来像鱼的精灵' },
  14: { label: '龙', desc: '看起来像龙的精灵' },
  15: { label: '机械', desc: '身体由机械组成的精灵' },
}

export function getEggGroupLabel(id: number): string {
  return EGG_GROUP_META[id]?.label || `蛋组${id}`
}

export function formatEggGroups(ids: number[]): string {
  if (!ids?.length) return '暂无蛋组数据'
  return ids.map(getEggGroupLabel).join(' / ')
}

export interface SearchResult {
  matchType: 'exact' | 'fuzzy' | 'multi' | 'not_found'
  pet?: any
  candidates?: any[]
}

function petName(p: any): string {
  return p?.localized?.zh?.name || p?.name || '???'
}

function petType(p: any): string {
  const parts: string[] = []
  const mt = p?.main_type?.localized?.zh
  if (mt) parts.push(mt)
  const st = p?.sub_type?.localized?.zh
  if (st) parts.push(st)
  return parts.join(' / ') || '未知'
}

function fmtDur(s: number): string {
  if (!s || s <= 0) return '暂无数据'
  if (s % 86400 === 0) return `${s / 86400} 天`
  const h = s / 3600
  return h === Math.floor(h) ? `${h} 小时` : `${h.toFixed(1)} 小时`
}
function wt(v: number | null | undefined): number | null {
  return v != null ? Math.round(v / 1000 * 10) / 10 : null
}

function fmtRange(lo: number | null, hi: number | null, u: string): string {
  if (lo == null && hi == null) return '暂无数据'
  if (lo != null && hi != null) return lo === hi ? `${lo}${u}` : `${lo}-${hi}${u}`
  return `${lo ?? hi}${u}`
}

function assetPetId(petId: any): number | null {
  const n = Number(petId)
  if (isNaN(n)) return null
  return n >= 3000 ? n : n + 3000
}

function petIconUrl(petId: any): string {
  const aid = assetPetId(petId)
  return aid ? `https://game.gtimg.cn/images/rocom/rocodata/jingling/${aid}/icon.png` : ''
}

function petImageUrl(petId: any): string {
  const aid = assetPetId(petId)
  return aid ? `https://game.gtimg.cn/images/rocom/rocodata/jingling/${aid}/image.png` : ''
}

export class EggService {
  private pets: any[] = []
  private byId: Map<number, any> = new Map()
  private byZh: Map<string, any> = new Map()
  private byEn: Map<string, any> = new Map()

  constructor(dataDir: string) {
    this.load(dataDir)
  }

  private load(dataDir: string) {
    const filePath = path.join(dataDir, 'Pets.json')
    if (!fs.existsSync(filePath)) {
      logger.error(`Pets.json 不存在: ${filePath}`)
      return
    }
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      this.pets = Array.isArray(raw) ? raw : []
      for (const p of this.pets) {
        this.byId.set(p.id, p)
        const zh = p.localized?.zh?.name
        if (zh) this.byZh.set(zh, p)
        const en = p.name?.toLowerCase()
        if (en) this.byEn.set(en, p)
      }
      logger.info(`加载 ${this.pets.length} 只精灵`)
    } catch (e) {
      logger.error(`加载 Pets.json 失败: ${e}`)
    }
  }

  getEggGroups(pet: any): number[] {
    return pet?.breeding_profile?.egg_groups || []
  }

  search(keyword: string): SearchResult {
    const kw = keyword.trim()
    if (!kw) return { matchType: 'not_found' }
    if (this.byZh.has(kw)) return { matchType: 'exact', pet: this.byZh.get(kw) }
    const pid = Number(kw)
    if (!isNaN(pid) && this.byId.has(pid)) return { matchType: 'exact', pet: this.byId.get(pid) }
    if (this.byEn.has(kw.toLowerCase())) return { matchType: 'exact', pet: this.byEn.get(kw.toLowerCase()) }
    const kwLower = kw.toLowerCase()
    const hits = this.pets.filter(p => {
      const zh = p.localized?.zh?.name || ''
      const en = p.name || ''
      return zh.toLowerCase().includes(kwLower) || en.toLowerCase().includes(kwLower)
    })
    if (hits.length === 1) return { matchType: 'fuzzy', pet: hits[0] }
    if (hits.length > 1) return { matchType: 'multi', candidates: hits.slice(0, 20) }
    return { matchType: 'not_found' }
  }

  searchBySize(height?: number, weight?: number): { perfect: any[]; range: any[] } {
    const perfect: any[] = [], range: any[] = []
    for (const p of this.pets) {
      const br = p.breeding || {}
      let hMatch: string | null = null, wMatch: string | null = null
      if (height != null) {
        const hLo = br.height_low, hHi = br.height_high
        if (hLo != null && hHi != null) {
          if (hLo <= height && height <= hHi) hMatch = 'perfect'
          else if (hLo * 0.85 <= height && height <= hHi * 1.15) hMatch = 'range'
          else hMatch = 'none'
        } else hMatch = 'none'
      }
      if (weight != null) {
        const wLo = br.weight_low, wHi = br.weight_high
        if (wLo != null && wHi != null) {
          const wKgLo = wLo / 1000, wKgHi = wHi / 1000
          if (wKgLo <= weight && weight <= wKgHi) wMatch = 'perfect'
          else if (wKgLo * 0.85 <= weight && weight <= wKgHi * 1.15) wMatch = 'range'
          else wMatch = 'none'
        } else wMatch = 'none'
      }
      if (height != null && weight != null) {
        if (hMatch === 'perfect' && wMatch === 'perfect') perfect.push(p)
        else if (hMatch !== 'none' && wMatch !== 'none') range.push(p)
      } else if (height != null) {
        if (hMatch === 'perfect') perfect.push(p)
        else if (hMatch === 'range') range.push(p)
      } else if (weight != null) {
        if (wMatch === 'perfect') perfect.push(p)
        else if (wMatch === 'range') range.push(p)
      }
    }
    return { perfect: perfect.slice(0, 20), range: range.slice(0, 20) }
  }

  getCompatiblePets(pet: any): any[] {
    const groups = new Set(this.getEggGroups(pet))
    if (!groups.size || groups.has(1)) return []
    return this.pets.filter(o => {
      if (o.id === pet.id) return false
      const og = new Set(this.getEggGroups(o))
      if (!og.size || og.has(1)) return false
      for (const g of groups) if (og.has(g)) return true
      return false
    })
  }

  getBreedingParents(pet: any): any[] {
    const eggGroups = new Set(this.getEggGroups(pet))
    if (!eggGroups.size || eggGroups.has(1)) return []
    return this.pets.filter(o => {
      if (o.id === pet.id) return false
      const og = new Set(this.getEggGroups(o))
      if (!og.size || og.has(1)) return false
      for (const g of eggGroups) if (og.has(g)) return true
      return false
    })
  }

  evaluatePair(a: any, b: any) {
    const ga = new Set(this.getEggGroups(a)), gb = new Set(this.getEggGroups(b))
    const shared = [...ga].filter(g => gb.has(g)).sort()
    const reasons: string[] = []
    if (!ga.size) reasons.push(`${petName(a)} 暂无蛋组数据`)
    if (!gb.size) reasons.push(`${petName(b)} 暂无蛋组数据`)
    if (ga.has(1)) reasons.push(`${petName(a)} 属于「未发现」蛋组`)
    if (gb.has(1)) reasons.push(`${petName(b)} 属于「未发现」蛋组`)
    if (!shared.length && !reasons.length) reasons.push('蛋组不相同，无法配种')
    const br = a.breeding || {}
    return {
      compatible: !reasons.length && shared.length > 0,
      reasons,
      shared_egg_groups: shared,
      shared_egg_group_labels: shared.map(getEggGroupLabel),
      hatch_label: fmtDur(br.hatch_data),
      weight_label: fmtRange(wt(br.weight_low), wt(br.weight_high), 'kg'),
      height_label: fmtRange(br.height_low, br.height_high, 'cm'),
    }
  }
  // ─── 文本构建 ───

  buildSizeSearchText(height?: number, weight?: number, results?: { perfect: any[]; range: any[] }): string {
    const cond: string[] = []
    if (height != null) cond.push(`身高=${height}cm`)
    if (weight != null) cond.push(`体重=${weight}kg`)
    const condStr = cond.join(' + ')
    if (!results || (!results.perfect.length && !results.range.length)) return `❌ 未找到符合 ${condStr} 的精灵。`
    const lines: string[] = []
    if (results.perfect.length) {
      lines.push(`✅ 完美匹配 ${condStr} 的精灵（共 ${results.perfect.length} 只）：`)
      results.perfect.slice(0, 10).forEach((p, i) => {
        const br = p.breeding || {}
        lines.push(`  ${i + 1}. ${petName(p)} (#${p.id}) — ${fmtRange(br.height_low, br.height_high, 'cm')} / ${fmtRange(wt(br.weight_low), wt(br.weight_high), 'kg')} · ${formatEggGroups(this.getEggGroups(p))}`)
      })
    }
    if (results.range.length) {
      if (lines.length) lines.push('')
      lines.push(`🔍 范围匹配 ${condStr} 的精灵（共 ${results.range.length} 只，容差±15%）：`)
      results.range.slice(0, 10).forEach((p, i) => {
        const br = p.breeding || {}
        lines.push(`  ${i + 1}. ${petName(p)} (#${p.id}) — ${fmtRange(br.height_low, br.height_high, 'cm')} / ${fmtRange(wt(br.weight_low), wt(br.weight_high), 'kg')} · ${formatEggGroups(this.getEggGroups(p))}`)
      })
    }
    return lines.join('\n')
  }

  buildSizeSearchTextFromApi(height?: number, weight?: number, results?: any): string {
    const cond: string[] = []
    if (height != null) cond.push(`身高=${height}cm`)
    if (weight != null) cond.push(`体重=${weight}kg`)
    const condStr = cond.join(' + ') || '当前条件'
    const exact = results?.exactResults || []
    const candidates = results?.candidates || []
    if (!exact.length && !candidates.length) return `❌ 未找到符合 ${condStr} 的精灵。`
    const lines: string[] = []
    if (exact.length) {
      lines.push(`✅ 完美匹配 ${condStr} 的精灵（共 ${exact.length} 只）：`)
      exact.slice(0, 10).forEach((item: any, i: number) => {
        lines.push(`  ${i + 1}. ${item.pet || '未知'} (#${item.petId || '-'})`)
      })
    }
    if (candidates.length) {
      if (lines.length) lines.push('')
      lines.push(`🔍 范围匹配 ${condStr} 的精灵（共 ${candidates.length} 只）：`)
      candidates.slice(0, 10).forEach((item: any, i: number) => {
        lines.push(`  ${i + 1}. ${item.pet || '未知'} (#${item.petId || '-'})`)
      })
    }
    return lines.join('\n')
  }

  buildSearchText(pet: any): string {
    const egs = this.getEggGroups(pet)
    const compat = this.getCompatiblePets(pet)
    const lines = [
      `🥚 ${petName(pet)} (#${pet.id})`,
      `属性：${petType(pet)}`,
      `蛋组：${formatEggGroups(egs)}`,
      `可配种精灵数：${compat.length}`,
    ]
    if (egs.includes(1)) lines.push('⚠️ 该精灵属于「未发现」蛋组，无法配种。')
    return lines.join('\n')
  }

  buildCandidatesText(keyword: string, candidates: any[]): string {
    const lines = [`🔍 「${keyword}」匹配到 ${candidates.length} 只精灵，请精确输入：`]
    candidates.slice(0, 10).forEach((p, i) => {
      lines.push(`  ${i + 1}. ${petName(p)} (#${p.id}) — ${petType(p)} · ${formatEggGroups(this.getEggGroups(p))}`)
    })
    if (candidates.length > 10) lines.push(`  ... 还有 ${candidates.length - 10} 个结果`)
    return lines.join('\n')
  }

  buildWantPetText(pet: any): string {
    const zh = petName(pet)
    const egs = this.getEggGroups(pet)
    const lines = [`🥚 想要孵出「${zh}」：`, `蛋组：${formatEggGroups(egs)}`]
    if (egs.includes(1)) {
      lines.push('⚠️ 该精灵属于「未发现」蛋组，无法通过配种获得。')
      return lines.join('\n')
    }
    lines.push(`\n📌 母体必须是「${zh}」（孵蛋结果跟随母体）`)
    const fathers = this.getBreedingParents(pet)
    if (fathers.length) {
      lines.push(`\n🔗 可选父体（共 ${fathers.length} 只）：`)
      fathers.slice(0, 15).forEach((f, i) => {
        lines.push(`  ${i + 1}. ${petName(f)} — ${formatEggGroups(this.getEggGroups(f))}`)
      })
      if (fathers.length > 15) lines.push(`  ... 还有 ${fathers.length - 15} 只`)
    } else {
      lines.push('\n❌ 未找到可配种的父体精灵。')
    }
    return lines.join('\n')
  }

  buildPairText(a: any, b: any): string {
    const ev = this.evaluatePair(a, b)
    const ma = petName(a), fa = petName(b)
    if (ev.compatible) {
      return `✅ 父体 ${fa} × 母体 ${ma} 可以配种！\n共享蛋组：${ev.shared_egg_group_labels.join(' / ')}\n孵出结果：${ma}（跟随母体）\n孵化时长：${ev.hatch_label}`
    }
    return `❌ ${fa} × ${ma} 无法配种。\n原因：${ev.reasons.join('；')}`
  }
}

