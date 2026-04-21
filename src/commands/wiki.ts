import { h } from 'koishi'
import { PluginDeps } from '../types'

export function register(deps: PluginDeps) {
  const { ctx, client } = deps

  ctx.command('洛克wiki <name:text>', '查询精灵 wiki')
    .action(async (_, name) => {
      if (!name) return '用法：洛克wiki <精灵名>'
      const res = await client.searchWikiPet(ctx, name, 10)
      const results = res?.results || []
      if (!results.length) return `未找到与"${name}"相关的精灵 wiki。`
      if (results.length > 1) {
        const names = results.slice(0, 8).map((i: any) => `${i.name || ''}${i.form || ''}`.trim()).join('、')
        return `找到多个结果：${names}\n请使用更精确的名称重新查询。`
      }
      const item = results[0]
      return `【${item.name}】NO.${item.no}\n特性：${item.ability_name || '暂无'}\n${item.url || ''}`
    })

  ctx.command('洛克技能 <name:text>', '查询技能 wiki')
    .action(async (_, name) => {
      if (!name) return '用法：洛克技能 <技能名>'
      const res = await client.searchWikiSkill(ctx, name, 10)
      const results = res?.results || []
      if (!results.length) return `未找到与"${name}"相关的技能 wiki。`
      if (results.length > 1) {
        const names = results.slice(0, 8).map((i: any) => i.name || '').join('、')
        return `找到多个结果：${names}\n请使用更精确的技能名称重新查询。`
      }
      const item = results[0]
      return `【${item.name}】${item.attribute}/${item.category} 威力:${item.power ?? '?'} PP:${item.cost ?? '?'}\n${item.description || ''}`
    })
}
