import { wrapHtml, card, footer, COLORS } from './styles'

export interface SizeMatchPet {
  id: string | number
  name: string
  icon: string
  height_label: string
  weight_label: string
  egg_groups_label: string
}
export interface EggSizeData {
  query_label: string
  has_results: boolean
  perfect_matches: SizeMatchPet[]
  range_matches: SizeMatchPet[]
}

function petRow(p: SizeMatchPet): string {
  return `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:${COLORS.cardLight};border-radius:6px;margin-bottom:4px;">
    <img src="${p.icon}" style="width:28px;height:28px;border-radius:50%;object-fit:contain;" />
    <span style="font-size:12px;font-weight:bold;">${p.name}</span>
    <span style="font-size:10px;color:${COLORS.textMuted};">#${p.id}</span>
    <span style="font-size:10px;color:${COLORS.textSecondary};margin-left:auto;">${p.height_label} / ${p.weight_label}</span>
  </div>`
}

export function render(data: EggSizeData): string {
  if (!data.has_results) {
    const body = `${card(`<div style="text-align:center;padding:20px;color:${COLORS.textMuted};">❌ 未找到符合 ${data.query_label} 的精灵</div>`)}`
    return wrapHtml(body, 600)
  }

  const perfect = data.perfect_matches.length
    ? card(data.perfect_matches.map(petRow).join(''), `✅ 完美匹配 (${data.perfect_matches.length})`)
    : ''
  const range = data.range_matches.length
    ? card(data.range_matches.map(petRow).join(''), `🔍 范围匹配 (${data.range_matches.length})`)
    : ''

  const body = `
    <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">尺寸反查：${data.query_label}</div>
    ${perfect}${range}
    ${footer('洛克查蛋 <精灵名> | 洛克查蛋 身高25 体重1.5')}
  `
  return wrapHtml(body, 650)
}
