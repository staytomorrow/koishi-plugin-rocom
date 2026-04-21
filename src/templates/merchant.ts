import { wrapHtml, card, footer, COLORS } from './styles'

export interface MerchantProduct { name: string; image: string; time_label: string }
export interface MerchantRoundInfo { current: number | null; countdown: string; is_open: boolean }
export interface MerchantData {
  title: string
  subtitle: string
  products: MerchantProduct[]
  round_info: MerchantRoundInfo
}

export function render(data: MerchantData): string {
  const products = data.products.map(p =>
    `<div style="display:flex;flex-direction:column;align-items:center;padding:12px;background:${COLORS.cardLight};border-radius:10px;width:140px;">
      <img src="${p.image}" style="width:64px;height:64px;object-fit:contain;margin-bottom:8px;" />
      <span style="font-size:13px;font-weight:bold;text-align:center;">${p.name}</span>
      <span style="font-size:10px;color:${COLORS.textMuted};margin-top:4px;">${p.time_label}</span>
    </div>`
  ).join('')

  const roundText = data.round_info.is_open
    ? `第${data.round_info.current}轮 · 剩余 ${data.round_info.countdown}`
    : '未开市'

  const body = `
    ${card(`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-size:20px;font-weight:bold;">${data.title}</div>
          <div style="font-size:12px;color:${COLORS.textSecondary};margin-top:4px;">${data.subtitle}</div>
        </div>
        <span style="padding:4px 12px;border-radius:8px;background:${COLORS.accent};font-size:12px;">${roundText}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
        ${products || `<span style="color:${COLORS.textMuted};">暂无商品</span>`}
      </div>
    `)}
    ${footer('远行商人')}
  `
  return wrapHtml(body, 700)
}
