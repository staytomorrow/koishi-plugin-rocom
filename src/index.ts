import { Context, Schema } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import path from 'node:path'
import { RocomClient } from './client'
import { UserManager, MerchantSubscriptionManager } from './user'
import { EggService } from './egg-service'
import { Renderer } from './render'
import { PluginDeps } from './types'
import { register as registerAccount } from './commands/account'
import { register as registerQuery } from './commands/query'
import { register as registerMerchant } from './commands/merchant'
import { register as registerWiki } from './commands/wiki'
import { register as registerEgg } from './commands/egg'
import { register as registerAdmin } from './commands/admin'

export const name = 'rocom'
export const inject = { required: ['puppeteer'] }

export interface Config {
  apiBaseUrl: string
  wegameApiKey: string
  adminUserIds: string[]
  autoRefreshEnabled: boolean
  autoRefreshTime: string[]
  merchantSubscriptionEnabled: boolean
  merchantSubscriptionItems: string[]
  merchantCheckInterval: number
}

export const Config: Schema<Config> = Schema.object({
  apiBaseUrl: Schema.string().default('https://wegame.shallow.ink').description('API 基础地址'),
  wegameApiKey: Schema.string().default('').description('WeGame API Key'),
  adminUserIds: Schema.array(String).default([]).description('管理员用户 ID 列表（允许执行管理员命令）'),
  autoRefreshEnabled: Schema.boolean().default(false).description('启用自动刷新凭证'),
  autoRefreshTime: Schema.array(String).default(['00:00', '12:00']).description('自动刷新时间'),
  merchantSubscriptionEnabled: Schema.boolean().default(true).description('启用远行商人订阅'),
  merchantSubscriptionItems: Schema.array(String).default(['国王球', '棱镜球', '炫彩精灵蛋']).description('默认订阅商品'),
  merchantCheckInterval: Schema.number().default(300000).description('商人检查间隔(ms)'),
})

export function apply(ctx: Context, config: Config) {
  const client = new RocomClient(config.apiBaseUrl, config.wegameApiKey)
  const dataDir = path.join(ctx.baseDir, 'data', 'rocom')
  const userMgr = new UserManager(dataDir)
  const merchantSubMgr = new MerchantSubscriptionManager(dataDir)
  const resPath = path.resolve(__dirname, '..')
  const renderer = new Renderer(resPath)
  const searcheggsDir = path.join(resPath, 'src', 'doc', 'astrbot_plugin_rocom', 'render', 'searcheggs')
  const eggService = new EggService(searcheggsDir)

  const deps: PluginDeps = { ctx, config, client, userMgr, merchantSubMgr, eggService, renderer }

  ctx.command('洛克', '洛克王国帮助菜单')
    .action(async () => [
      '【洛克王国插件】',
      '',
      '📋 账号管理：',
      '  洛克QQ登录 / 洛克微信登录 / 洛克导入',
      '  洛克绑定列表 / 洛克切换 / 洛克解绑 / 洛克刷新',
      '',
      '📊 数据查询：',
      '  洛克档案 / 洛克战绩 / 洛克背包 / 洛克阵容',
      '  洛克交换大厅 / 远行商人 / 订阅远行商人',
      '',
      '📖 百科查询：',
      '  洛克wiki / 洛克技能 / 洛克查蛋 / 洛克配种',
    ].join('\n'))

  registerAccount(deps)
  registerQuery(deps)
  registerMerchant(deps)
  registerWiki(deps)
  registerEgg(deps)
  registerAdmin(deps)
}
