import { wrapHtml, card, avatar, footer, COLORS } from './styles'

export interface LineupDetailPet { pet_name: string; pet_img_url: string; skills: string[] }
export interface LineupDetailData {
  lineup: {
    name: string
    tags: string[]
    pets: LineupDetailPet[]
    author_name: string
    author_avatar: string
    likes: number
    lineup_code: string
  }
}

export function render(data: LineupDetailData): string {
  const l = data.lineup
  const tags = l.tags.map(t => `<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${COLORS.accent};margin-right:4px;">${t}</span>`).join('')
  const pets = l.pets.map(p => {
    const skills = p.skills.map(s =>
      `<img src="${s}" style="width:24px;height:24px;border-radius:4px;margin-right:2px;" />`
    ).join('')
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${COLORS.cardLight};border-radius:8px;margin-bottom:6px;">
      <img src="${p.pet_img_url}" style="width:56px;height:56px;object-fit:contain;border-radius:8px;" />
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:bold;">${p.pet_name}</div>
        <div style="display:flex;margin-top:6px;">${skills}</div>
      </div>
    </div>`
  }).join('')

  const body = `
    ${card(`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:20px;font-weight:bold;">${l.name || '未命名'}</span>
        ${tags}
      </div>
      ${pets}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid ${COLORS.border};">
        <div style="display:flex;align-items:center;gap:8px;">
          ${avatar(l.author_avatar, 28)}
          <span style="font-size:12px;">${l.author_name || '?'}</span>
          <span style="font-size:12px;color:${COLORS.textMuted};">❤ ${l.likes}</span>
        </div>
        <span style="font-size:11px;color:${COLORS.textMuted};">阵容码：${l.lineup_code}</span>
      </div>
    `)}
    ${footer('查看阵容 <阵容码>')}
  `
  return wrapHtml(body, 700)
}
