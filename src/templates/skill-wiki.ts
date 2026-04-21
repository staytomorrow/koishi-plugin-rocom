import { wrapHtml, card, footer, COLORS } from './styles'

export interface SkillWikiData {
  name: string
  attribute: string
  category: string
  description: string
  cost: string | number
  power: string | number
}

export function render(data: SkillWikiData): string {
  const body = `
    ${card(`
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="font-size:24px;font-weight:bold;">${data.name}</div>
        <span style="padding:3px 10px;border-radius:8px;background:${COLORS.accent};font-size:12px;">${data.attribute}</span>
        <span style="padding:3px 10px;border-radius:8px;background:${COLORS.cardLight};font-size:12px;">${data.category}</span>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div style="display:flex;flex-direction:column;align-items:center;padding:12px 20px;background:${COLORS.cardLight};border-radius:8px;">
          <span style="font-size:11px;color:${COLORS.textSecondary};">威力</span>
          <span style="font-size:20px;font-weight:bold;color:${COLORS.gold};">${data.power ?? '?'}</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;padding:12px 20px;background:${COLORS.cardLight};border-radius:8px;">
          <span style="font-size:11px;color:${COLORS.textSecondary};">PP</span>
          <span style="font-size:20px;font-weight:bold;">${data.cost ?? '?'}</span>
        </div>
      </div>
      <div style="padding:12px;background:${COLORS.cardLight};border-radius:8px;font-size:14px;line-height:1.6;color:${COLORS.textSecondary};">
        ${data.description || '暂无描述'}
      </div>
    `)}
    ${footer('洛克技能 <技能名>')}
  `
  return wrapHtml(body, 600)
}
