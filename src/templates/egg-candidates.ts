import { wrapHtml, card, footer, COLORS } from './styles'

export interface CandidatePet { id: number; name: string; icon: string; type_label: string; egg_groups_label: string }
export interface EggCandidatesData { keyword: string; count: number; candidates: CandidatePet[] }

export function render(data: EggCandidatesData): string {
  const items = data.candidates.map(p =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${COLORS.cardLight};border-radius:6px;margin-bottom:4px;">
      <img src="${p.icon}" style="width:32px;height:32px;border-radius:50%;object-fit:contain;" />
      <span style="font-size:13px;font-weight:bold;">${p.name}</span>
      <span style="font-size:10px;color:${COLORS.textMuted};">#${p.id}</span>
      <span style="font-size:10px;color:${COLORS.textSecondary};margin-left:auto;">${p.type_label} · ${p.egg_groups_label}</span>
    </div>`
  ).join('')

  const body = `
    ${card(items, `「${data.keyword}」匹配到 ${data.count} 只精灵`)}
    ${footer('请使用更精确的名称重新查询')}
  `
  return wrapHtml(body, 650)
}
