import { h } from 'koishi'
import { PluginDeps } from '../types'
import { formatEggGroups } from '../egg-service'

function petIconUrl(petId: any): string {
  const n = Number(petId)
  if (isNaN(n)) return ''
  const aid = n >= 3000 ? n : n + 3000
  return `https://game.gtimg.cn/images/rocom/rocodata/jingling/${aid}/icon.png`
}

function petName(p: any): string {
  return p?.localized?.zh?.name || p?.name || '???'
}

export function register(deps: PluginDeps) {
  const { ctx, client, eggService } = deps

  ctx.command('洛克查蛋 [arg1:string] [arg2:string]', '查询精灵蛋组')
    .alias('查蛋')
    .action(async (_, arg1, arg2) => {
      if (!arg1) return '🥚 查蛋用法：\n  洛克查蛋 <精灵名>\n  洛克查蛋 25 1.5\n  洛克查蛋 25'
      const name = [arg1, arg2].filter(Boolean).join(' ')
      const sr = eggService.search(name)
      if (sr.matchType === 'multi') {
        const names = sr.candidates!.slice(0, 8).map(petName).join('、')
        return `找到多个结果：${names}\n请使用更精确的名称重新查询。`
      }
      if (sr.matchType === 'not_found') return `❌ 未找到名为「${name}」的精灵。`
      const pet = sr.pet
      return eggService.buildSearchText(pet)
    })

  ctx.command('洛克配种 <nameA:string> [nameB:string]', '配种查询')
    .alias('配种')
    .action(async (_, nameA, nameB) => {
      if (!nameA) return '🥚 配种用法：\n  洛克配种 <父体> <母体>\n  洛克配种 <精灵名>'
      if (!nameB) {
        const sr = eggService.search(nameA)
        if (sr.matchType === 'multi') {
          const names = sr.candidates!.slice(0, 8).map(petName).join('、')
          return `找到多个结果：${names}\n请使用更精确的名称重新查询。`
        }
        if (sr.matchType === 'not_found') return `❌ 未找到名为「${nameA}」的精灵。`
        return eggService.buildWantPetText(sr.pet)
      }
      const srA = eggService.search(nameA)
      if (srA.matchType === 'multi') {
        const names = srA.candidates!.slice(0, 8).map(petName).join('、')
        return `找到多个结果：${names}\n请使用更精确的名称重新查询。`
      }
      if (srA.matchType === 'not_found') return `❌ 未找到名为「${nameA}」的精灵。`
      const srB = eggService.search(nameB)
      if (srB.matchType === 'multi') {
        const names = srB.candidates!.slice(0, 8).map(petName).join('、')
        return `找到多个结果：${names}\n请使用更精确的名称重新查询。`
      }
      if (srB.matchType === 'not_found') return `❌ 未找到名为「${nameB}」的精灵。`
      return eggService.buildPairText(srB.pet, srA.pet)
    })
}
