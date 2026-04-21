import { wrapHtml, card, footer, COLORS } from './styles'

export interface MenuItem { cmd: string; desc: string }
export interface MenuGroup { groupTitle: string; menuItems: MenuItem[] }
export interface MenuData { pageTitle: string; menuGroups: MenuGroup[] }

export function render(data: MenuData): string {
  const groups = data.menuGroups.map(g => {
    const items = g.menuItems.map(i =>
      `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid ${COLORS.border};">
        <span style="font-size:13px;color:${COLORS.gold};">${i.cmd}</span>
        <span style="font-size:12px;color:${COLORS.textSecondary};">${i.desc}</span>
      </div>`
    ).join('')
    return card(items, g.groupTitle)
  }).join('')

  const body = `
    <div style="font-size:24px;font-weight:bold;margin-bottom:20px;text-align:center;">${data.pageTitle}</div>
    ${groups}
    ${footer('发送对应指令即可使用')}
  `
  return wrapHtml(body, 700)
}
