import { Logger } from 'koishi'
import { PluginDeps } from '../types'
import { Binding } from '../user'

const logger = new Logger('rocom-admin')

export function register(deps: PluginDeps) {
  const { ctx, config, client, userMgr } = deps

  function isAdmin(userId: string): boolean {
    return config.adminUserIds.includes(userId)
  }

  ctx.command('洛克刷新所有凭证', '刷新所有用户凭证（管理员）')
    .action(async ({ session }) => {
      if (!isAdmin(session!.userId!)) return '⚠️ 此指令仅限管理员使用。'
      await session!.send('正在刷新所有用户的凭证...')
      const allUsers = userMgr.getAllUsersBindings()
      let success = 0, fail = 0
      for (const [userId, bindings] of Object.entries(allUsers)) {
        for (const binding of bindings) {
          if (binding.login_type !== 'qq' || !binding.binding_id) continue
          try {
            const res = await client.refreshBinding(ctx, binding.binding_id, userId)
            if (res?.framework_token) {
              binding.framework_token = res.framework_token
              const userBindings = userMgr.getUserBindings(userId)
              const idx = userBindings.findIndex(b => b.binding_id === binding.binding_id)
              if (idx >= 0) userBindings[idx] = binding
              userMgr.saveUserBindings(userId, userBindings)
              success++
            } else { fail++ }
          } catch { fail++ }
        }
      }
      return `刷新完成：成功 ${success}，失败 ${fail}`
    })

  ctx.command('洛克删除无效绑定', '清理失效绑定（管理员）')
    .action(async ({ session }) => {
      if (!isAdmin(session!.userId!)) return '⚠️ 此指令仅限管理员使用。'
      await session!.send('正在检查所有用户的绑定有效性...')
      const allUsers = userMgr.getAllUsersBindings()
      let totalInvalid = 0, totalValid = 0
      for (const [userId, bindings] of Object.entries(allUsers)) {
        const valid: Binding[] = []
        for (const binding of bindings) {
          if (!binding.framework_token && !binding.binding_id) {
            totalInvalid++
            continue
          }
          const roleRes = await client.getRole(ctx, binding.framework_token)
          if (roleRes?.role) {
            valid.push(binding)
            totalValid++
          } else {
            if (binding.binding_id) {
              await client.deleteBinding(ctx, binding.binding_id, userId)
            }
            totalInvalid++
          }
        }
        userMgr.saveUserBindings(userId, valid)
      }
      return totalInvalid > 0
        ? `✅ 清理完成！移除 ${totalInvalid} 个无效绑定，剩余 ${totalValid} 个有效绑定。`
        : `✅ 所有绑定均有效，无需清理。共 ${totalValid} 个有效绑定。`
    })

  if (config.autoRefreshEnabled) {
    ctx.setInterval(async () => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (!config.autoRefreshTime.includes(timeStr)) return
      const allUsers = userMgr.getAllUsersBindings()
      for (const [userId, bindings] of Object.entries(allUsers)) {
        for (const binding of bindings) {
          if (binding.login_type !== 'qq' || !binding.binding_id) continue
          try {
            const res = await client.refreshBinding(ctx, binding.binding_id, userId)
            if (res?.framework_token) {
              binding.framework_token = res.framework_token
              const userBindings = userMgr.getUserBindings(userId)
              const idx = userBindings.findIndex(b => b.binding_id === binding.binding_id)
              if (idx >= 0) userBindings[idx] = binding
              userMgr.saveUserBindings(userId, userBindings)
            }
          } catch (e) {
            logger.warn(`自动刷新用户 ${userId} 失败: ${e}`)
          }
        }
      }
    }, 60000)
  }
}
