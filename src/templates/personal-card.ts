export interface PersonalCardData {
  userName: string
  userLevel: number
  userUid: string
  userAvatarDisplay: string
  enrollDays: number
  starName: string
  score: string
  strength: number
  collection: number
  capture: number
  progression: number
  currentCollectionCount: number
  totalCollectionCount: number
  amazingSpriteCount: number
  shinySpriteCount: number
  colorfulSpriteCount: number
  fashionCollectionCount?: number
  itemCount?: number
  totalMatch: number
  winRate: number
  summaryContent: string
  bestPetName?: string
  bestPetImageDisplay?: string
  tierBadgeUrl?: string
}

export function render(data: PersonalCardData): string {
  // Radar chart SVG
  const cx = 130, cy = 130, r = 90, maxVal = 100
  const dims = [
    { label: '战力', value: data.strength, angle: -90 },
    { label: '收藏', value: data.collection, angle: 0 },
    { label: '捉定', value: data.capture, angle: 90 },
    { label: '推进', value: data.progression, angle: 180 },
  ]
  const toXY = (angle: number, radius: number) => {
    const rad = angle * Math.PI / 180
    return { x: Math.round(cx + radius * Math.cos(rad)), y: Math.round(cy + radius * Math.sin(rad)) }
  }
  const grids = [1, 0.66, 0.33].map(s => {
    const pts = dims.map(d => toXY(d.angle, r * s))
    return `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#ddd8cd" stroke-width="1.2"/>`
  }).join('')
  const axisLines = dims.map(d => {
    const p = toXY(d.angle, r)
    return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#ddd8cd" stroke-width="1.2"/>`
  }).join('')
  const pts = dims.map(d => toXY(d.angle, r * Math.min(d.value, maxVal) / maxVal))
  const areaPts = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `<polygon points="${areaPts}" fill="rgba(251,195,94,0.68)"/><polygon points="${areaPts}" fill="none" stroke="#f18837" stroke-width="3" stroke-linejoin="round"/>`
  const dots = pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#f18837"/>`).join('')
  const labelPositions = dims.map(d => {
    const p = toXY(d.angle, r + 28)
    return `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" fill="#6b6457" font-size="13" font-weight="bold">${d.label}</text>`
  }).join('')
  const valueBadges = dims.map(d => {
    const p = toXY(d.angle, r + 14)
    return `<rect x="${p.x - 20}" y="${p.y + 8}" width="40" height="20" rx="10" fill="#f3eee2" stroke="#ddd8cd" stroke-width="1"/>
      <text x="${p.x}" y="${p.y + 18}" text-anchor="middle" dominant-baseline="middle" fill="#6b6457" font-size="12">${d.value}</text>`
  }).join('')
  const radarSvg = `<svg viewBox="0 0 260 260" style="width:240px;height:240px;">${grids}${axisLines}${area}${dots}${labelPositions}${valueBadges}</svg>`

  const avatarHtml = data.userAvatarDisplay
    ? `<img src="${data.userAvatarDisplay}" style="width:72px;height:72px;border-radius:50%;border:3px solid #fbf7ee;object-fit:cover;" />`
    : `<div style="width:72px;height:72px;border-radius:50%;background:#ddd;border:3px solid #fbf7ee;"></div>`

  const petImageHtml = data.bestPetImageDisplay
    ? `<img src="${data.bestPetImageDisplay}" style="width:160px;height:160px;object-fit:contain;" />`
    : ''

  const tierHtml = data.tierBadgeUrl
    ? `<img src="${data.tierBadgeUrl}" style="width:120px;height:100px;object-fit:contain;" />`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: "Microsoft YaHei","PingFang SC",sans-serif; background:#e8dcc8; width:960px; padding:20px; }
    .title { text-align:center; font-size:28px; font-weight:bold; color:#3d3d3d; margin-bottom:16px; }
    .main { display:flex; gap:16px; }
    .col-left { width:520px; display:flex; flex-direction:column; gap:14px; }
    .col-right { flex:1; display:flex; flex-direction:column; gap:14px; }
    .panel { background:#f3eee2; border-radius:14px; padding:16px; }
    .panel-title { font-size:16px; font-weight:bold; color:#272727; margin-bottom:10px; }
    .info-row { display:flex; align-items:center; gap:8px; }
    .tag-row { display:flex; gap:10px; margin-top:12px; }
    .tag-item { display:flex; justify-content:space-between; align-items:center; flex:1; height:30px; padding:0 12px; background:#f8f3e8; border-radius:6px; border:1px solid #e8e1d1; }
    .tag-label { font-size:13px; color:#423c38; }
    .tag-value { font-size:14px; color:#3d3d3db3; }
    .lv-badge { display:inline-flex; padding:2px 10px; border-radius:12px; background:#ffc65f; color:#3d3d3d; font-size:14px; font-weight:bold; }
    .uid { font-size:13px; color:#000000b3; margin-top:6px; }
    .ai-section { display:flex; gap:14px; }
    .ai-card { width:170px; flex-shrink:0; background:#2d2d2d; border-radius:12px; padding:12px; display:flex; flex-direction:column; align-items:center; }
    .ai-card-title { color:#f2f0df; font-size:15px; font-weight:bold; text-align:center; margin-bottom:6px; }
    .ai-score { color:#ffc65f; font-size:22px; font-weight:bold; margin-top:4px; }
    .ai-score-label { color:#f2f0df; font-size:11px; }
    .ai-pet-name { color:#fbf7ee; font-size:14px; font-weight:bold; margin-top:4px; }
    .radar-box { display:flex; justify-content:center; }
    .ai-comment { background:#e8e1d1; border-radius:10px; padding:10px 12px; margin-top:10px; }
    .ai-comment-label { font-size:12px; font-weight:bold; color:#1f1f1f; margin-bottom:4px; }
    .ai-comment-text { font-size:12px; color:#7f7b77; line-height:1.5; }
    .collect-header { display:flex; gap:12px; align-items:flex-start; }
    .collect-badge { width:100px; height:90px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#2d6b4f; border-radius:12px; color:#fff; }
    .collect-num { font-size:24px; font-weight:bold; }
    .collect-total { font-size:12px; color:#ffffffb3; }
    .collect-label { font-size:11px; color:#f4eee1; margin-top:4px; }
    .collect-types { display:flex; gap:8px; flex:1; }
    .collect-type-item { flex:1; display:flex; flex-direction:column; align-items:center; padding:8px 4px; background:#e8e1d1; border-radius:10px; }
    .collect-type-label { font-size:12px; color:#3d3d3d; }
    .collect-type-num { font-size:18px; font-weight:bold; color:#3d3d3db3; margin-top:2px; }
    .collect-footer { display:flex; gap:10px; margin-top:10px; }
    .collect-footer-item { flex:1; display:flex; justify-content:space-between; padding:0 12px; height:28px; align-items:center; background:#f8f3e8; border-radius:6px; border:1px solid #e8e1d1; font-size:13px; }
    .battle-main { display:flex; gap:12px; align-items:flex-start; }
    .battle-stats { display:flex; gap:8px; }
    .battle-stat { display:flex; flex-direction:column; align-items:center; padding:6px 14px; background:#e8e1d1; border-radius:10px; }
    .battle-stat-label { font-size:12px; color:#3d3d3d; }
    .battle-stat-num { font-size:16px; font-weight:bold; color:#3d3d3db3; }
    .footer { display:flex; justify-content:center; margin-top:12px; padding-top:10px; }
    .footer-hint { color:#ca5d00; font-size:12px; }
  </style></head><body>
    <div class="title">洛克档案</div>
    <div class="main">
      <div class="col-left">
        <div class="panel">
          <div class="info-row">
            ${avatarHtml}
            <div style="margin-left:8px;">
              <div class="info-row">
                <span style="font-size:22px;font-weight:bold;color:#000;">${data.userName}</span>
                <span class="lv-badge">Lv. ${data.userLevel}</span>
              </div>
              <div class="uid">ID:${data.userUid}</div>
            </div>
          </div>
          <div class="tag-row">
            <div class="tag-item"><span class="tag-label">入学天数</span><span class="tag-value">${data.enrollDays}</span></div>
            <div class="tag-item"><span class="tag-label">魔法师星级</span><span class="tag-value">${data.starName}</span></div>
          </div>
        </div>
        <div class="panel">
          <div class="ai-section">
            <div class="ai-card">
              <div class="ai-card-title">${data.bestPetName ? data.bestPetName.split('').join(' ') : ''}</div>
              ${petImageHtml}
              <div class="ai-score-label">AI评分</div>
              <div class="ai-score">${data.score}</div>
              <div class="ai-pet-name">${data.bestPetName || ''}</div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;">
              <div class="radar-box">${radarSvg}</div>
              <div class="ai-comment">
                <div class="ai-comment-label">AI点评</div>
                <div class="ai-comment-text">${data.summaryContent || '暂无点评'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-right">
        <div class="panel">
          <div class="panel-title">我的收藏</div>
          <div class="collect-header">
            <div class="collect-badge">
              <div class="collect-num">${data.currentCollectionCount}</div>
              <div class="collect-total">/${data.totalCollectionCount}</div>
              <div class="collect-label">搜集情况</div>
            </div>
            <div class="collect-types">
              <div class="collect-type-item"><span class="collect-type-label">了不起精灵</span><span class="collect-type-num">${data.amazingSpriteCount}</span></div>
              <div class="collect-type-item"><span class="collect-type-label">异色精灵</span><span class="collect-type-num">${data.shinySpriteCount}</span></div>
              <div class="collect-type-item"><span class="collect-type-label">炫彩精灵</span><span class="collect-type-num">${data.colorfulSpriteCount}</span></div>
            </div>
          </div>
          <div class="collect-footer">
            <div class="collect-footer-item"><span class="tag-label">时装收藏</span><span class="tag-value">${data.fashionCollectionCount ?? 0}</span></div>
            <div class="collect-footer-item"><span class="tag-label">道具收藏</span><span class="tag-value">${data.itemCount ?? 0}</span></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">闪耀大赛</div>
          <div class="battle-main">
            ${tierHtml}
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div class="battle-stats">
                <div class="battle-stat"><span class="battle-stat-label">对战胜率</span><span class="battle-stat-num">${data.winRate}%</span></div>
                <div class="battle-stat"><span class="battle-stat-label">对战场次</span><span class="battle-stat-num">${data.totalMatch}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer"><span class="footer-hint">洛克背包 &lt;筛选&gt; &lt;页码&gt; | 洛克战绩 &lt;页码&gt; | 洛克 查看菜单</span></div>
  </body></html>`
}
