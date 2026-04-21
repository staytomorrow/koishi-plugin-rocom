import { wrapHtml, card, footer, pagination, COLORS } from './styles'

export interface LineupPet { pet_name: string; pet_img_url: string; skills: string[] }
export interface LineupItem {
  name: string
  tags: string[]
  pets: LineupPet[]
  author_name: string
  likes: number
  lineup_code: string
}
export interface LineupData {
  category: string
  lineups: LineupItem[]
  page_no: number
  total_pages: number
}

export function render(data: LineupData): string {
  const lineups = data.lineups.map(l => {
    const tags = l.tags.map(t => `<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:${COLORS.accent};margin-right:4px;">${t}</span>`).join('')
    const pets = l.pets.map(p =>
      `<div style="display:flex;flex-direction:column;align-items:center;width:56px;">
        <img src="${p.pet_img_url}" style="width:48px;height:48px;object-fit:contain;border-radius:6px;" />
        <span style="font-size:9px;color:${COLORS.textSecondary};margin-top:2px;text-align:center;max-width:56px;overflow:hidden;">${p.pet_name}</span>
      </div>`
    ).join('')
    return `<div style="background:${COLORS.cardLight};border-radius:10px;padding:12px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:14px;font-weight:bold;">${l.name || '未命名'}</span>
        ${tags}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px;">${pets}</div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:${COLORS.textMuted};">
        <span>作者：${l.author_name || '?'} · ❤ ${l.likes}</span>
        <span>阵容码：${l.lineup_code}</span>
      </div>
    </div>`
  }).join('')

  const empty = !data.lineups.length ? `<div style="text-align:center;color:${COLORS.textMuted};padding:30px;">暂无阵容</div>` : ''

  const body = `
    ${card(lineups + empty, `阵容推荐 · ${data.category || '热门'}`)}
    ${pagination(data.page_no, data.total_pages)}
    ${footer('洛克阵容 <分类> <页码>')}
  `
  return wrapHtml(body, 750)
}
