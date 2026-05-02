/**
 * 测试脚本：生成示例图片
 *
 * 使用方法：
 * 1. 确保已安装 koishi-plugin-puppeteer
 * 2. 确保系统已安装 Chrome/Edge/Firefox
 * 3. 运行：node test-render.js
 */

const { Context } = require('koishi')
const { Renderer } = require('./lib/render')
const path = require('path')
const fs = require('fs')

async function testRender() {
  // 创建 Koishi 上下文
  const ctx = new Context()

  // 加载 puppeteer 插件
  try {
    ctx.plugin(require('koishi-plugin-puppeteer'))
  } catch (e) {
    console.error('❌ 请先安装 koishi-plugin-puppeteer:')
    console.error('   npm install koishi-plugin-puppeteer')
    process.exit(1)
  }

  // 等待插件加载
  await ctx.start()
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 创建渲染器
  const resPath = path.resolve(__dirname)
  const renderer = new Renderer(resPath)

  // 模拟档案数据
  const mockData = {
    userName: 'BvzRays',
    userLevel: 53,
    userUid: '704693375',
    userAvatarDisplay: 'https://game.gtimg.cn/images/rocom/web202304/avatar/default.png',
    enrollDays: 18,
    starName: '精灵博学者',
    backgroundUrl: '',
    hasAiProfileData: true,
    bestPetName: '星辰伯爵 绝不妥协',
    summaryTitleParts: ['星', '辰', '伯', '爵', ' ', '绝', '不', '妥', '协'],
    bestPetImageDisplay: 'https://game.gtimg.cn/images/rocom/rocodata/jingling/3001/image.png',
    fallbackPetImage: '',
    scoreText: '9.1',
    aiCommentText: '也许它的反应慢半拍，也许它总是最后才醒，但这又如何（和爱）？只要远离它永远是你最坚实的后盾。',
    centerX: 130,
    centerY: 130,
    radarPolygons: [
      '130,40 220,130 130,220 40,130',
      '130,70 190,130 130,190 70,130',
      '130,100 160,130 130,160 100,130',
    ],
    radarAxes: [
      { x: 130, y: 40 },
      { x: 220, y: 130 },
      { x: 130, y: 220 },
      { x: 40, y: 130 },
    ],
    radarAreaPoints: '130,47 213,130 130,196 63,130',
    radarAxisLabels: [
      { x: 130, y: 12, name: '战力', anchor: 'middle' },
      { x: 248, y: 130, name: '收藏', anchor: 'middle' },
      { x: 130, y: 248, name: '捉定', anchor: 'middle' },
      { x: 12, y: 130, name: '推进', anchor: 'middle' },
    ],
    radarValueBadges: [
      { x: 110, y: 34, width: 40, value: 86 },
      { x: 214, y: 144, width: 40, value: 77 },
      { x: 110, y: 144, width: 40, value: 93 },
      { x: 20, y: 144, width: 40, value: 76 },
    ],
    radarDots: [
      { x: 130, y: 47 },
      { x: 213, y: 130 },
      { x: 130, y: 196 },
      { x: 63, y: 130 },
    ],
    currentCollectionCount: 207,
    totalCollectionCount: 347,
    amazingSpriteCount: 42,
    shinySpriteCount: 2,
    colorfulSpriteCount: 14,
    fashionCollectionCount: 5,
    itemCount: 22638,
    collectionHint: '查看收藏详情',
    hasBattleData: true,
    tierBadgeUrl: 'https://game.gtimg.cn/images/rocom/web202304/tier/tier_5.png',
    winRate: '45.45%',
    totalMatch: 11,
    matchResult: 'win',
    leftTeamPets: [],
    rightTeamPets: [],
    opponentName: '',
    opponentAvatarDisplay: '',
    commandHint: '洛克背包 <筛选> <页码> | 洛克战绩 <页码>',
    copyright: 'Koishi & WeGame 洛克王国插件',
  }

  console.log('🎨 开始渲染档案卡片...')

  try {
    const png = await renderer.renderHtml(ctx, 'personal-card', mockData)

    if (png) {
      const outputPath = path.join(__dirname, 'test-output.png')
      fs.writeFileSync(outputPath, png)
      console.log(`✅ 渲染成功！图片已保存到: ${outputPath}`)
      console.log(`   图片大小: ${(png.length / 1024).toFixed(2)} KB`)
    } else {
      console.error('❌ 渲染失败：返回空图片')
    }
  } catch (e) {
    console.error('❌ 渲染出错:', e)
  }

  // 清理
  await ctx.stop()
  process.exit(0)
}

testRender().catch(e => {
  console.error('❌ 测试失败:', e)
  process.exit(1)
})
