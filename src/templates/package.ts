
import { wrapHtml, card, avatar, footer, pagination, COLORS } from './styles'

export interface PetItem {
  name: string
  custom_name?: string
  level: number
  pet_img_url: string
  elementIcons: { src: string; name: string }[]
}
export interface PackageData {
  userName: string
  userLevel: number
  userAvatar: string
  pageTitle: string
  currentTab: string
  totalCount: number
  pets: PetItem[]
  currentPage: number
  totalPages: number
}

export function render(data: PackageData): string {
  const petCards = data.pets.map(p => {
    const elements = p.elementIcons.map(e =>
      `<span style="font-size:10px;padding:1px 4px;border-radius:4px;background:${COLORS.cardLight};">${e.name}</span>`
    ).join('')
    const displayName = p.custom_name ? `${p.name}&${p.custom_name}` : p.name
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px;background:${COLORS.cardLight};border-radius:8px;margin-bottom:6px;">
      <img src="${p.pet_img_url}" style="width:48px;height:48px;border-radius:6px;object-fit:contain;" />
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:bold;">${displayName}</div>
        <div style="display:flex;gap:4px;margin-top:4px;">${elements}</div>
      </div>
      <span style="font-size:13px;color:${COLORS.gold};">Lv.${p.level}</span>
    </div>`
  }).join('')

  const empty = !data.pets.length ? `<div style="text-align:center;color:${COLORS.textMuted};padding:30px;">暂无精灵</div>` : ''

  const body = `
    ${card(`
      <div style="display:flex;align-items:center;gap:12px;">
        ${avatar(data.userAvatar, 40)}
        <div>
          <span style="font-size:16px;font-weight:bold;">${data.userName}</span>
          <span style="font-size:12px;color:${COLORS.textSecondary};margin-left:8px;">Lv.${data.userLevel}</span>
        </div>
        <div style="margin-left:auto;font-size:13px;color:${COLORS.textSecondary};">${data.currentTab} · 共${data.totalCount}只</div>
      </div>
    `)}
    ${card(petCards + empty)}
    ${pagination(data.currentPage, data.totalPages)}
    ${footer('洛克背包 <全部/异色/了不起/炫彩> <页码>')}
  `
  return wrapHtml(body, 700)
}
