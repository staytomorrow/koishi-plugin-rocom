import { Context } from 'koishi'
import { Binding, UserManager } from './user'

export interface RoleToken {
  UserId: string
  fwt: string
  bindingId: string
  roleId: string
  loginType: string
  updatedAt: Date
}

declare module 'koishi' {
  interface Tables {
    roleToken: RoleToken
  }
}

function normalize(value?: string) {
  return String(value ?? '').trim()
}

function pickLatest(rows: RoleToken[]): RoleToken | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) => {
    const aTime = new Date(a.updatedAt as any).getTime() || 0
    const bTime = new Date(b.updatedAt as any).getTime() || 0
    return bTime - aTime
  })[0] ?? null
}

function pickLegacyToken(binding: Binding & { framework_token?: string }) {
  return normalize((binding as any).framework_token)
}

export function setupRoleTokenModel(ctx: Context) {
  ;(ctx.model as any).extend('roleToken', {
    UserId: 'string',
    fwt: 'string',
    bindingId: 'string',
    roleId: 'string',
    loginType: 'string',
    updatedAt: 'timestamp',
  }, {
    primary: 'UserId',
    indexes: ['bindingId'],
  })
}

export async function upsertRoleToken(
  ctx: Context,
  payload: {
    userId: string
    fwt: string
    bindingId?: string
    roleId?: string
    loginType?: string
  },
) {
  const userId = normalize(payload.userId)
  const fwt = normalize(payload.fwt)
  if (!userId || !fwt) return

  await (ctx.database as any).remove('roleToken', { UserId: userId })
  await (ctx.database as any).upsert(
    'roleToken',
    () => [{
      UserId: userId,
      fwt,
      bindingId: normalize(payload.bindingId),
      roleId: normalize(payload.roleId),
      loginType: normalize(payload.loginType),
      updatedAt: new Date(),
    }],
    'UserId',
  )
}

export async function getRoleToken(ctx: Context, userId: string): Promise<RoleToken | null> {
  const normalizedUserId = normalize(userId)
  if (!normalizedUserId) return null

  const rows = await (ctx.database as any).get('roleToken', { UserId: normalizedUserId })
  if (!Array.isArray(rows) || !rows.length) return null
  return pickLatest(rows as RoleToken[])
}

export async function removeRoleToken(ctx: Context, userId: string) {
  const normalizedUserId = normalize(userId)
  if (!normalizedUserId) return
  await (ctx.database as any).remove('roleToken', { UserId: normalizedUserId })
}

export async function migrateRoleTokensToUserId(ctx: Context) {
  const rows = await (ctx.database as any).get('roleToken', {})
  if (!Array.isArray(rows) || !rows.length) return 0

  const groups = new Map<string, RoleToken[]>()
  for (const row of rows as RoleToken[]) {
    const userId = normalize(row?.UserId)
    if (!userId) continue
    const bucket = groups.get(userId) || []
    bucket.push(row)
    groups.set(userId, bucket)
  }

  let migrated = 0
  for (const [userId, items] of groups) {
    if (items.length <= 1) continue
    const latest = pickLatest(items)
    if (!latest?.fwt) continue
    await removeRoleToken(ctx, userId)
    await upsertRoleToken(ctx, {
      userId,
      fwt: latest.fwt,
      bindingId: latest.bindingId,
      roleId: latest.roleId,
      loginType: latest.loginType,
    })
    migrated++
  }

  return migrated
}

export async function migrateLegacyFrameworkTokens(ctx: Context, userMgr: UserManager) {
  const allUsers = userMgr.getAllUsersBindings()
  let migrated = 0

  for (const [userId, bindings] of Object.entries(allUsers)) {
    const normalizedUserId = normalize(userId)
    if (!normalizedUserId) continue

    const existing = await getRoleToken(ctx, normalizedUserId)
    const bindingsWithToken = (bindings as (Binding & { framework_token?: string })[]).filter(binding => pickLegacyToken(binding))
    const chosen = bindingsWithToken.find(binding => binding.is_primary) || bindingsWithToken[0]

    if (!existing?.fwt && chosen) {
      const legacyToken = pickLegacyToken(chosen)
      if (legacyToken) {
        await upsertRoleToken(ctx, {
          userId: normalizedUserId,
          fwt: legacyToken,
          bindingId: chosen.binding_id,
          roleId: chosen.role_id,
          loginType: chosen.login_type,
        })
        migrated++
      }
    }

    if (bindingsWithToken.length > 0) {
      let needsSave = false
      for (const binding of bindings as (Binding & { framework_token?: string })[]) {
        if (!binding.framework_token) continue
        delete binding.framework_token
        needsSave = true
      }
      if (needsSave) {
        userMgr.saveUserBindings(normalizedUserId, bindings as Binding[])
      }
    }
  }

  return migrated
}
