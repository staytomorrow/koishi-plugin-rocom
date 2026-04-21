import { wrapHtml, card, footer, badge, COLORS } from './styles'

export interface PetStat { label: string; value: number; color: string }
export interface PetTrait { name: string; type: string; effect: string }
export interface PetEvolution { name: string; number: string | number; is_current: boolean; condition: string }
export interface PetSkill { name: string; type: string; category: string; power: string | number; pp: string | number; effect: string; level: string | number }
export interface PetWikiData {
  name: string
  number: string | number
  form: string
  pet_types: { name: string }[]
  description: string
  pet_icon: string
  main_image: string
  total_stats: number
  pet_stats: PetStat[]
  pet_traits: PetTrait[]
  pet_evolution: PetEvolution[]
  sprite_skills: PetSkill[]
}

export function render(data: PetWikiData): string {
  const types = data.pet_types.map(t => badge(t.name, COLORS.accent)).join(' ')
  const statsBar = data.pet_stats.map(s => {
    const pct = Math.min(s.value / 255 * 100, 100)
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <span style="width:36px;font-size:11px;color:${COLORS.textSecondary};">${s.label}</span>
      <div style="flex:1;height:12px;background:${COLORS.cardLight};border-radius:6px;">
        <div style="width:${pct}%;height:100%;background:${s.color};border-radius:6px;"></div>
      </div>
      <span style="width:28px;font-size:11px;text-align:right;">${s.value}</span>
    </div>`
  }).join('')

  const traits = data.pet_traits.map(t =>
    `<div style="padding:6px 0;border-bottom:1px solid ${COLORS.border};">
      <div style="display:flex;gap:6px;align-items:center;">
        <span style="font-size:12px;font-weight:bold;">${t.name}</span>
        <span style="font-size:10px;color:${COLORS.textMuted};">[${t.type}]</span>
      </div>
      <div style="font-size:11px;color:${COLORS.textSecondary};margin-top:2px;">${t.effect}</div>
    </div>`
  ).join('')

  const evoLine = data.pet_evolution.map(e => {
    const highlight = e.is_current ? `border:2px solid ${COLORS.gold};` : ''
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:40px;height:40px;border-radius:50%;background:${COLORS.cardLight};${highlight}display:flex;align-items:center;justify-content:center;">
        <span style="font-size:10px;">${e.number}</span>
      </div>
      <span style="font-size:9px;color:${COLORS.textSecondary};max-width:50px;text-align:center;">${e.name}</span>
    </div>`
  }).join('<span style="color:' + COLORS.textMuted + ';margin:0 4px;">→</span>')

  const skills = data.sprite_skills.slice(0, 12).map(s =>
    `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:${COLORS.cardLight};border-radius:6px;margin-bottom:4px;">
      <span style="font-size:11px;font-weight:bold;width:60px;">${s.name}</span>
      <span style="font-size:9px;color:${COLORS.textMuted};width:32px;">${s.type}</span>
      <span style="font-size:9px;color:${COLORS.textMuted};width:32px;">${s.category}</span>
      <span style="font-size:10px;width:28px;">威${s.power}</span>
      <span style="font-size:10px;width:28px;">PP${s.pp}</span>
      <span style="font-size:10px;color:${COLORS.textMuted};margin-left:4px;">Lv.${s.level}</span>
    </div>`
  ).join('')

  const body = `
    ${card(`
      <div style="display:flex;gap:16px;">
        <img src="${data.main_image || data.pet_icon}" style="width:100px;height:100px;object-fit:contain;" />
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:22px;font-weight:bold;">${data.name}</span>
            <span style="font-size:12px;color:${COLORS.textMuted};">NO.${data.number}</span>
            ${data.form ? `<span style="font-size:11px;color:${COLORS.textSecondary};">${data.form}</span>` : ''}
          </div>
          <div style="margin-top:6px;">${types}</div>
          <div style="margin-top:8px;font-size:12px;color:${COLORS.textSecondary};line-height:1.5;">${data.description}</div>
        </div>
      </div>
    `)}
    <div style="display:flex;gap:16px;">
      <div style="flex:1;">
        ${card(`<div style="margin-bottom:4px;font-size:12px;color:${COLORS.textMuted};">总和：${data.total_stats}</div>${statsBar}`, '种族值')}
        ${card(traits, '特性 & 属性克制')}
      </div>
      <div style="flex:1;">
        ${card(`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">${evoLine}</div>`, '进化链')}
        ${card(skills || `<span style="color:${COLORS.textMuted};">暂无技能数据</span>`, '技能列表')}
      </div>
    </div>
    ${footer('洛克wiki <精灵名> | 洛克技能 <技能名>')}
  `
  return wrapHtml(body, 850)
}
