import { wrapHtml, card, avatar, footer, statItem, COLORS } from './styles'

export interface BattleData {
  time: string
  date: string
  result: string
  leftName: string
  leftAvatar: string
  leftPets: { icon: string }[]
  rightName: string
  rightAvatar: string
  rightPets: { icon: string }[]
}
export interface RecordData {
  userName: string
  userAvatarDisplay: string
  userLevel: number
  winRate: string
  totalMatch: number
  battles: BattleData[]
}

export function render(data: RecordData): string {
  const petIcons = (pets: { icon: string }[]) => pets.map(p =>
    `<img src="${p.icon}" style="width:32px;height:32px;border-radius:4px;margin-right:2px;" />`
  ).join('')

  const battleCards = data.battles.map(b => {
    const resultColor = b.result === 'win' ? COLORS.success : COLORS.danger
    const resultText = b.result === 'win' ? '胜' : '负'
    return `<div style="display:flex;align-items:center;background:${COLORS.cardLight};border-radius:8px;padding:10px 12px;margin-bottom:8px;gap:8px;">
      <span style="font-size:11px;color:${COLORS.textMuted};width:40px;">${b.time}</span>
      <div style="display:flex;align-items:center;gap:4px;flex:1;">
        ${avatar(b.leftAvatar, 28)}
        <span style="font-size:12px;max-width:80px;overflow:hidden;">${b.leftName}</span>
        <div style="display:flex;margin-left:4px;">${petIcons(b.leftPets)}</div>
      </div>
      <span style="padding:2px 8px;border-radius:4px;background:${resultColor};font-size:12px;font-weight:bold;">${resultText}</span>
      <div style="display:flex;align-items:center;gap:4px;flex:1;justify-content:flex-end;">
        <div style="display:flex;">${petIcons(b.rightPets)}</div>
        <span style="font-size:12px;max-width:80px;overflow:hidden;">${b.rightName}</span>
        ${avatar(b.rightAvatar, 28)}
      </div>
    </div>`
  }).join('')

  const body = `
    ${card(`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        ${avatar(data.userAvatarDisplay, 48)}
        <div>
          <div style="font-size:18px;font-weight:bold;">${data.userName}</div>
          <span style="font-size:12px;color:${COLORS.textSecondary};">Lv.${data.userLevel}</span>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        ${statItem('胜率', data.winRate)}
        ${statItem('总场次', data.totalMatch)}
      </div>
    `, '闪耀大赛')}
    ${card(data.battles.length ? battleCards : `<div style="text-align:center;color:${COLORS.textMuted};padding:20px;">暂无对战记录</div>`, '对战记录')}
    ${footer('洛克战绩 <页码>')}
  `
  return wrapHtml(body, 800)
}
