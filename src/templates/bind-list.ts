import { wrapHtml, card, footer, badge, COLORS } from './styles'

export interface BindItem {
  index: number
  nickname: string
  isPrimary: boolean
  role_id: string
  type_label: string
  created_at: string
}
export interface BindListData { title: string; subtitle: string; bindings: BindItem[] }

export function render(data: BindListData): string {
  const items = data.bindings.map(b => {
    const primary = b.isPrimary ? badge('主账号', COLORS.gold) : ''
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${COLORS.border};">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;color:${COLORS.textSecondary};width:24px;">${b.index}</span>
        <span style="font-size:15px;font-weight:bold;">${b.nickname}</span>
        ${primary}
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:12px;color:${COLORS.textSecondary};">ID:${b.role_id}</span>
        <span style="font-size:12px;color:${COLORS.textMuted};">${b.type_label}</span>
        <span style="font-size:11px;color:${COLORS.textMuted};">${b.created_at}</span>
      </div>
    </div>`
  }).join('')

  const body = `
    ${card(items, `${data.title} (${data.bindings.length})`)}
    ${footer('洛克切换 <序号> | 洛克解绑 <序号>')}
  `
  return wrapHtml(body, 700)
}
