import { wrapHtml, card, footer, COLORS } from './styles'

export interface EggPetCard { id: number; name: string; icon: string; type_label: string; egg_groups_label: string }
export interface EggSection { id: number; label: string; desc: string; count: number; members: EggPetCard[]; has_more: boolean; total: number }
export interface EggSearchData {
  pet_name: string
  pet_icon: string
  pet_id: number
  type_label: string
  egg_groups_label: string
  male_rate: number | null
  female_rate: number | null
  hatch_label: string
  weight_label: string
  height_label: string
  total_compatible: number
  is_undiscovered: boolean
  egg_group_sections: EggSection[]
}

export function render(data: EggSearchData): string {
  const genderBar = (data.male_rate != null && data.female_rate != null)
    ? `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
        <span style="font-size:11px;color:#6cb4ee;">♂ ${data.male_rate}%</span>
        <div style="flex:1;height:8px;border-radius:4px;background:${COLORS.cardLight};display:flex;">
          <div style="width:${data.male_rate}%;background:#6cb4ee;border-radius:4px 0 0 4px;"></div>
          <div style="width:${data.female_rate}%;background:#f06292;border-radius:0 4px 4px 0;"></div>
        </div>
        <span style="font-size:11px;color:#f06292;">♀ ${data.female_rate}%</span>
      </div>` : ''

  const sections = data.egg_group_sections.filter(s => s.id !== 1).map(s => {
    const members = s.members.slice(0, 15).map(m =>
      `<div style="display:flex;align-items:center;gap:4px;padding:3px 6px;background:${COLORS.cardLight};border-radius:4px;font-size:10px;">
        <img src="${m.icon}" style="width:20px;height:20px;border-radius:50%;" />${m.name}
      </div>`
    ).join('')
    const more = s.has_more ? `<span style="font-size:10px;color:${COLORS.textMuted};">...还有${s.total - 15}只</span>` : ''
    return `<div style="margin-top:12px;">
      <div style="font-size:13px;font-weight:bold;margin-bottom:6px;">${s.label} (${s.count}只)</div>
      ${s.desc ? `<div style="font-size:10px;color:${COLORS.textMuted};margin-bottom:6px;">${s.desc}</div>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:4px;">${members}${more}</div>
    </div>`
  }).join('')

  const body = `
    ${card(`
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${data.pet_icon}" style="width:56px;height:56px;object-fit:contain;" />
        <div style="flex:1;">
          <div style="font-size:18px;font-weight:bold;">${data.pet_name} <span style="font-size:12px;color:${COLORS.textMuted};">#${data.pet_id}</span></div>
          <div style="font-size:12px;color:${COLORS.textSecondary};margin-top:4px;">${data.type_label} · ${data.egg_groups_label}</div>
          ${genderBar}
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">孵化：${data.hatch_label}</span>
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">身高：${data.height_label}</span>
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">体重：${data.weight_label}</span>
        <span style="font-size:11px;padding:3px 8px;background:${COLORS.cardLight};border-radius:4px;">可配种：${data.total_compatible}只</span>
      </div>
      ${data.is_undiscovered ? `<div style="margin-top:12px;padding:8px;background:rgba(233,69,96,0.2);border-radius:6px;font-size:12px;color:${COLORS.danger};">⚠️ 该精灵属于「未发现」蛋组，无法配种</div>` : ''}
    `)}
    ${!data.is_undiscovered && sections ? card(sections, '同蛋组精灵') : ''}
    ${footer('洛克查蛋 <精灵名> | 洛克配种 <父体> <母体>')}
  `
  return wrapHtml(body, 750)
}
