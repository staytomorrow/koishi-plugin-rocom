import { h } from 'koishi'
import { PluginDeps } from '../types'
import {
  getRoleToken,
  removeRoleToken,
  upsertRoleToken,
} from '../role-token'
import { Binding } from '../user'

export async function getPrimaryToken(deps: PluginDeps, userId: string): Promise<string> {
  const token = await getRoleToken(deps.ctx, userId)
  return token?.fwt || ''
}

export function notLoggedInHint(): string {
  return '您尚未绑定洛克王国账号，请先使用“洛克QQ登录”或“洛克微信登录”进行绑定。'
}

export async function saveBindingWithRoleInfo(
  deps: PluginDeps,
  session: any,
  fwToken: string,
  loginType: string,
  userId: string,
) {
  const { ctx, client, userMgr } = deps
  await session.send('登录成功，正在调用绑定接口...')

  const bindRes = await client.createBinding(ctx, fwToken, userId)
  const bindingId = String(bindRes?.binding?.id || fwToken || '').trim()
  if (!bindRes?.binding || !bindingId) {
    await session.send('绑定接口调用失败，请稍后重试。')
    return
  }

  await session.send('绑定成功，正在获取角色信息...')
  const roleRes = await client.getRole(ctx, fwToken, undefined, userId)
  if (!roleRes?.role) {
    await session.send('绑定成功，但获取角色信息失败，请尝试重新登录。')
    return
  }

  const role = roleRes.role
  const binding: Binding = {
    binding_id: bindingId,
    login_type: loginType,
    role_id: role.id || 'unknown',
    nickname: role.name || '洛克',
    bind_time: Date.now(),
    is_primary: true,
  }

  userMgr.addBinding(userId, binding)
  await upsertRoleToken(ctx, {
    userId,
    fwt: fwToken,
    bindingId,
    roleId: binding.role_id,
    loginType,
  })

  await session.send(`绑定成功！当前账号：${binding.nickname} (ID: ${binding.role_id})`)
}

export function register(deps: PluginDeps) {
  const { ctx, client, userMgr } = deps

  ctx.command('洛克QQ登录', 'QQ 扫码登录')
    .action(async ({ session }) => {
      const userId = session!.userId!
      const qrData = await client.qqQrLogin(ctx, userId)
      if (!qrData?.qr_image) return '获取 QQ 二维码失败。'

      const fwToken = qrData.frameworkToken
      const qrB64 = qrData.qr_image
      const imgData = qrB64.includes(',') ? qrB64.split(',')[1] : qrB64
      await session!.send(h('message', {},
        h.at(userId),
        h.text('\n请使用 QQ 扫描二维码登录（有效时间 2 分钟）\n注意需要双设备扫码。\n'),
        h.image(`data:image/png;base64,${imgData}`),
      ))

      const startTime = Date.now()
      while (Date.now() - startTime < 115000) {
        await new Promise(r => setTimeout(r, 3000))
        const status = await client.qqQrStatus(ctx, fwToken, userId)
        if (!status) continue
        if (status.status === 'done') {
          await saveBindingWithRoleInfo(deps, session, fwToken, 'qq', userId)
          return
        }
        if (['expired', 'failed', 'canceled'].includes(status.status)) break
      }
      return '登录超时或失败，请重试。'
    })

  ctx.command('洛克微信登录', '微信扫码登录')
    .action(async ({ session }) => {
      const userId = session!.userId!
      const qrData = await client.wechatQrLogin(ctx, userId)
      if (!qrData?.qr_image) return '获取微信登录链接失败。'

      const fwToken = qrData.frameworkToken
      const qrUrl = qrData.qr_image
      await session!.send(`请使用微信打开以下链接扫码登录（有效时间 2 分钟）\n注意需要双设备扫码。\n${qrUrl}`)

      const startTime = Date.now()
      while (Date.now() - startTime < 115000) {
        await new Promise(r => setTimeout(r, 3000))
        const status = await client.wechatQrStatus(ctx, fwToken, userId)
        if (!status) continue
        if (status.status === 'done') {
          await saveBindingWithRoleInfo(deps, session, fwToken, 'wechat', userId)
          return
        }
        if (['expired', 'failed'].includes(status.status)) break
      }
      return '登录超时或失败，请重试。'
    })

  ctx.command('洛克导入 <tgpId:string> <tgpTicket:string>', '导入 WeGame 凭证')
    .action(async ({ session }, tgpId, tgpTicket) => {
      if (!tgpId || !tgpTicket) return '用法：洛克导入 <tgp_id> <tgp_ticket>'
      const userId = session!.userId!
      const res = await client.importToken(ctx, tgpId, tgpTicket, userId)
      if (!res?.frameworkToken) return '凭证导入失败。'
      await saveBindingWithRoleInfo(deps, session, res.frameworkToken, 'manual', userId)
    })

  ctx.command('洛克绑定列表', '查看已绑定账号')
    .action(async ({ session }) => {
      const bindings = userMgr.getUserBindings(session!.userId!)
      if (!bindings.length) return '暂无绑定账号。'

      const lines = ['【绑定账号列表】']
      bindings.forEach((binding, index) => {
        const mark = binding.is_primary ? '（主账号）' : ''
        const time = binding.bind_time > 0 ? new Date(binding.bind_time).toLocaleString('zh-CN') : '未知'
        lines.push(`[${index + 1}] ${binding.nickname} (ID: ${binding.role_id}) ${binding.login_type}${mark} · ${time}`)
      })
      return lines.join('\n')
    })

  ctx.command('洛克切换 <index:number>', '切换主账号')
    .action(async ({ session }, index) => {
      if (!index) return '用法：洛克切换 <序号>'
      return userMgr.switchPrimary(session!.userId!, index)
        ? `成功切换到序号 ${index} 账号。`
        : '序号无效。'
    })

  ctx.command('洛克解绑 <index:number>', '解绑账号')
    .action(async ({ session }, index) => {
      if (!index) return '用法：洛克解绑 <序号>'
      const removed = userMgr.deleteUserBinding(session!.userId!, index)
      if (!removed) return '序号无效。'

      if (removed.binding_id) {
        try {
          await client.deleteBinding(ctx, removed.binding_id, session!.userId!)
        } catch {
          // 解绑本地记录优先，服务端删除失败不阻断结果。
        }
      }
      if (userMgr.getUserBindings(session!.userId!).length === 0) {
        await removeRoleToken(ctx, session!.userId!)
      }
      return `已解绑账号：${removed.nickname}`
    })

  ctx.command('洛克刷新', '刷新当前主账号凭证')
    .action(async ({ session }) => {
      const userId = session!.userId!
      const binding = userMgr.getPrimaryBinding(userId)
      if (!binding) return notLoggedInHint()
      if (!binding.binding_id) return '绑定 ID 无效，请重新绑定账号。'

      await session!.send('正在刷新凭证，服务端会自动处理，无需手动操作。')
      const res = await client.refreshBinding(ctx, binding.binding_id, userId)
      if (res?.framework_token) {
        await upsertRoleToken(ctx, {
          userId,
          fwt: res.framework_token,
          bindingId: binding.binding_id,
          roleId: binding.role_id,
          loginType: binding.login_type,
        })
        return '当前账号凭证刷新成功。'
      }
      return '凭证刷新失败，可能已过期或不支持刷新（仅 QQ 扫码支持）。'
    })
}
