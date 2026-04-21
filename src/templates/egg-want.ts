import { wrapHtml, card, footer, COLORS } from './styles'

export interface WantPetCard { id: number; name: string; icon: string; type_label: string; egg_groups_label: string }
export interface EggWantData {
  target: WantPetCard
  egg_groups_label: string
  female_rate: number | null
  male_rate: number | null
  is_undiscovered: boolean
  fathers: WantPetCard[]
  father_count: number
}

export function render(data: EggWantData): string {
  const fathers = data.fathers.slice(0, 20).map(f =>
    `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:${COLORS.cardLight};border-radius:4px;margin-bottom:3px;">
      <img src="${f.icon}" style="width:24px;height:24px;border-radius:50%;" />
      <span style="font-size:12px;">${f.name}</span>
      <span style="font-size:9px;color:${COLORS.textMuted};margin-left:auto;">${f.egg_groups_label}</span>
    </div>`
  ).join('')
  const more = data.father_count > 20 ? `<div style="font-size:11px;color:${COLORS.textMuted};margin-top:4px;">...还有${data.father_count - 20}只</div>` : ''

  const content = data.is_undiscovered
    ? `<div style="padding:16px;text-align:center;color:${COLORS.danger};font-size:14px;">⚠️ 该精灵属于「未发现」蛋组，无法通过配种获得</div>`
    : data.fathers.length
      ? `<div style="font-size:12px;color:${COLORS.textSecondary};margin-bottom:8px;">📌 母体必须是「${data.target.name}」（孵蛋结果跟随母体）</div>${fathers}${more}`
      : `<div style="padding:16px;text-align:center;color:${COLORS.textMuted};">未找到可配种的父体精灵</div>`

  const body = `
    ${card(`
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${data.target.icon}" style="width:48px;height:48px;object-fit:contain;" />
        <div>
          <div style="font-size:16px;font-weight:bold;">想要孵出「${data.target.name}」</div>
          <div style="font-size:11px;color:${COLORS.textSecondary};margin-top:4px;">${data.target.type_label} · ${data.egg_groups_label}</div>
        </div>
      </div>
    `)}
    ${card(content, `可选父体 (${data.father_count}只)`)}
    ${footer('洛克配种 <父体> <母体> | 洛克查蛋 <精灵名>')}
  `
  return wrapHtml(body, 650)
}
