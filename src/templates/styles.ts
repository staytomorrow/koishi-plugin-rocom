export const COLORS = {
  bg: '#1a1a2e',
  card: '#16213e',
  cardLight: '#0f3460',
  accent: '#e94560',
  gold: '#ffc107',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textMuted: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  border: 'rgba(255,255,255,0.1)',
}

export const BASE_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: ${COLORS.text}; background: ${COLORS.bg}; }
`

export function wrapHtml(body: string, width = 800): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style></head><body style="width:${width}px;padding:24px;">${body}</body></html>`
}

export function card(content: string, title?: string): string {
  const titleHtml = title ? `<div style="font-size:18px;font-weight:bold;margin-bottom:12px;color:${COLORS.gold};">${title}</div>` : ''
  return `<div style="background:${COLORS.card};border-radius:12px;padding:20px;margin-bottom:16px;">${titleHtml}${content}</div>`
}

export function badge(text: string, color = COLORS.accent): string {
  return `<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:12px;background:${color};color:#fff;font-size:12px;font-weight:bold;">${text}</span>`
}

export function avatar(url: string, size = 48): string {
  if (!url) return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#333;flex-shrink:0;"></div>`
  return `<img src="${url}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
}

export function footer(hint: string, copyright = 'Koishi & WeGame 洛克王国插件'): string {
  return `<div style="display:flex;flex-direction:column;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid ${COLORS.border};gap:4px;">
    <span style="color:${COLORS.gold};font-size:12px;">${hint}</span>
    <span style="color:${COLORS.textMuted};font-size:10px;">${copyright}</span>
  </div>`
}

export function statItem(label: string, value: string | number): string {
  return `<div style="display:flex;flex-direction:column;align-items:center;padding:8px 12px;background:${COLORS.cardLight};border-radius:8px;min-width:80px;">
    <span style="font-size:11px;color:${COLORS.textSecondary};">${label}</span>
    <span style="font-size:16px;font-weight:bold;margin-top:4px;">${value}</span>
  </div>`
}

export function pageTitle(title: string, subtitle?: string): string {
  const sub = subtitle ? `<span style="font-size:13px;color:${COLORS.textSecondary};margin-left:12px;">${subtitle}</span>` : ''
  return `<div style="display:flex;align-items:baseline;margin-bottom:16px;">
    <span style="font-size:22px;font-weight:bold;">${title}</span>${sub}
  </div>`
}

export function pagination(current: number, total: number): string {
  return `<div style="display:flex;justify-content:center;align-items:center;margin-top:12px;gap:8px;">
    <span style="font-size:12px;color:${COLORS.textSecondary};">第 ${current} / ${total} 页</span>
  </div>`
}
