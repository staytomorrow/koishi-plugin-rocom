import { wrapHtml, card, avatar, footer, pagination, COLORS } from './styles'

export interface ExchangePost {
  userName: string
  userLevel: number
  isOnline: boolean
  avatarUrl: string
  userId: string
  wantText: string
  provideItems: { name: string }[]
  timeLabel: string
}
export interface ExchangeHallData {
  posts: ExchangePost[]
  currentPage: number
  totalPages: number
}

export function render(data: ExchangeHallData): string {
  const posts = data.posts.map(p => {
    const status = p.isOnline ? `<span style="color:${COLORS.success};font-size:10px;">● 在线</span>` : ''
    const offers = p.provideItems.map(i =>
      `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${COLORS.cardLight};margin-right:4px;">${i.name || i}</span>`
    ).join('')
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:${COLORS.cardLight};border-radius:8px;margin-bottom:8px;">
      ${avatar(p.avatarUrl, 36)}
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;font-weight:bold;">${p.userName}</span>
          <span style="font-size:11px;color:${COLORS.textMuted};">Lv.${p.userLevel}</span>
          ${status}
        </div>
        <div style="margin-top:6px;font-size:12px;color:${COLORS.gold};">求：${p.wantText}</div>
        ${offers ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;">${offers}</div>` : ''}
      </div>
      <span style="font-size:10px;color:${COLORS.textMuted};">${p.timeLabel}</span>
    </div>`
  }).join('')

  const empty = !data.posts.length ? `<div style="text-align:center;color:${COLORS.textMuted};padding:30px;">暂无海报</div>` : ''

  const body = `
    ${card(posts + empty, '交换大厅')}
    ${pagination(data.currentPage, data.totalPages)}
    ${footer('洛克交换大厅 <页码>')}
  `
  return wrapHtml(body, 750)
}
