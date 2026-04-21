import { wrapHtml, card, footer, COLORS } from './styles'

export interface PairPet { name: string; id: number; type_label: string; egg_groups_label: string }
export interface EggPairData {
  mother: PairPet
  father: PairPet
  compatible: boolean
  shared_egg_group_labels: string[]
  reasons: string[]
  hatch_label: string
  weight_label: string
  height_label: string
}

export function render(data: EggPairData): string {
  const resultColor = data.compatible ? COLORS.success : COLORS.danger
  const resultText = data.compatible ? '✅ 可以配种' : '❌ 无法配种'

  const petCard = (p: PairPet, role: string) =>
    `<div style="display:flex;flex-direction:column;align-items:center;padding:12px;background:${COLORS.cardLight};border-radius:8px;flex:1;">
      <span style="font-size:11px;color:${COLORS.textMuted};margin-bottom:4px;">${role}</span>
      <span style="font-size:16px;font-weight:bold;">${p.name}</span>
      <span style="font-size:10px;color:${COLORS.textSecondary};margin-top:4px;">#${p.id} · ${p.type_label}</span>
      <span style="font-size:10px;color:${COLORS.textMuted};margin-top:2px;">${p.egg_groups_label}</span>
    </div>`

  const details = data.compatible
    ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">共享蛋组：${data.shared_egg_group_labels.join(' / ')}</span>
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">孵化：${data.hatch_label}</span>
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">身高：${data.height_label}</span>
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">体重：${data.weight_label}</span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:${COLORS.textSecondary};">孵出结果跟随母体：${data.mother.name}</div>`
    : `<div style="margin-top:12px;font-size:12px;color:${COLORS.danger};">${data.reasons.join('；')}</div>`

  const body = `
    ${card(`
      <div style="display:flex;gap:12px;align-items:stretch;">
        ${petCard(data.father, '父体')}
        <div style="display:flex;align-items:center;font-size:20px;">×</div>
        ${petCard(data.mother, '母体')}
      </div>
      <div style="text-align:center;margin-top:16px;font-size:18px;font-weight:bold;color:${resultColor};">${resultText}</div>
      ${details}
    `)}
    ${footer('洛克配种 <父体> <母体> | 洛克配种 <精灵名>')}
  `
  return wrapHtml(body, 650)
}
