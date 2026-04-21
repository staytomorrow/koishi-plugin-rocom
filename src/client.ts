import { Context, Logger } from 'koishi'

const logger = new Logger('rocom-client')

export class RocomClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number

  constructor(baseUrl: string, apiKey: string, timeout = 15000) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
    this.timeout = timeout
  }

  private sanitizeUid(uid: string): string {
    if (!uid) return ''
    return uid.trim().replace(/[^a-zA-Z0-9_\- 一-龥]/g, '').trim()
  }

  private wegameHeaders(fwToken = '', userIdentifier = ''): Record<string, string> {
    const headers: Record<string, string> = {}
    if (this.apiKey) headers['X-API-Key'] = this.apiKey
    if (fwToken) headers['X-Framework-Token'] = fwToken
    if (userIdentifier) headers['X-User-Identifier'] = this.sanitizeUid(userIdentifier)
    return headers
  }

  private rocomHeaders(fwToken: string): Record<string, string> {
    const headers: Record<string, string> = { 'X-Framework-Token': fwToken }
    if (this.apiKey) headers['X-API-Key'] = this.apiKey
    return headers
  }

  private async get(ctx: Context, path: string, headers: Record<string, string>, params?: Record<string, any>) {
    try {
      const resp: any = await ctx.http.get(`${this.baseUrl}${path}`, {
        headers,
        params,
        timeout: this.timeout,
      })
      if (resp?.code !== 0) {
        logger.warn(`${path} 错误: ${resp?.message || '未知'}`)
        return null
      }
      return resp?.data ?? {}
    } catch (e) {
      logger.error(`GET ${path} 失败: ${e}`)
      return null
    }
  }
  private async post(ctx: Context, path: string, headers: Record<string, string>, json?: any, params?: Record<string, any>) {
    try {
      const resp: any = await ctx.http.post(`${this.baseUrl}${path}`, json, {
        headers,
        params,
        timeout: this.timeout,
      })
      if (resp?.code !== 0) {
        logger.warn(`${path} 错误: ${resp?.message || '未知'}`)
        return null
      }
      return resp?.data ?? {}
    } catch (e) {
      logger.error(`POST ${path} 失败: ${e}`)
      return null
    }
  }

  private async delete(ctx: Context, path: string, headers: Record<string, string>) {
    try {
      const resp: any = await ctx.http('DELETE', `${this.baseUrl}${path}`, { headers, timeout: this.timeout })
      if (resp?.code !== 0) return null
      return resp?.data ?? {}
    } catch (e) {
      logger.error(`DELETE ${path} 失败: ${e}`)
      return null
    }
  }

  // ─── 登录相关 ───

  async qqQrLogin(ctx: Context, userIdentifier: string) {
    const params: any = { client_type: 'bot', client_id: 'koishi' }
    if (userIdentifier) params.user_identifier = this.sanitizeUid(userIdentifier)
    return this.get(ctx, '/api/v1/login/wegame/qr', this.wegameHeaders('', userIdentifier), params)
  }

  async qqQrStatus(ctx: Context, fwToken: string, userIdentifier: string) {
    const params: any = {}
    if (userIdentifier) params.user_identifier = this.sanitizeUid(userIdentifier)
    return this.get(ctx, '/api/v1/login/wegame/status', this.wegameHeaders(fwToken, userIdentifier), params)
  }

  async wechatQrLogin(ctx: Context, userIdentifier: string) {
    const params: any = { client_type: 'bot', client_id: 'koishi' }
    if (userIdentifier) params.user_identifier = this.sanitizeUid(userIdentifier)
    return this.get(ctx, '/api/v1/login/wegame/wechat/qr', this.wegameHeaders('', userIdentifier), params)
  }

  async wechatQrStatus(ctx: Context, fwToken: string, userIdentifier: string) {
    const params: any = {}
    if (userIdentifier) params.user_identifier = this.sanitizeUid(userIdentifier)
    return this.get(ctx, '/api/v1/login/wegame/wechat/status', this.wegameHeaders(fwToken, userIdentifier), params)
  }

  async importToken(ctx: Context, tgpId: string, tgpTicket: string, userIdentifier: string) {
    const body: any = { tgp_id: tgpId, tgp_ticket: tgpTicket, client_type: 'bot', client_id: 'koishi' }
    if (userIdentifier) body.user_identifier = this.sanitizeUid(userIdentifier)
    return this.post(ctx, '/api/v1/login/wegame/token', this.wegameHeaders('', userIdentifier), body)
  }

  async createBinding(ctx: Context, fwToken: string, userIdentifier: string) {
    const payload = { framework_token: fwToken, user_identifier: this.sanitizeUid(userIdentifier), client_type: 'bot', client_id: 'koishi' }
    return this.post(ctx, '/api/v1/user/bindings', this.wegameHeaders('', userIdentifier), payload)
  }

  async refreshBinding(ctx: Context, bindingId: string, userIdentifier: string) {
    return this.post(ctx, `/api/v1/user/bindings/${bindingId}/refresh`, this.wegameHeaders('', userIdentifier), {})
  }

  async deleteBinding(ctx: Context, bindingId: string, userIdentifier: string) {
    const res = await this.delete(ctx, `/api/v1/user/bindings/${bindingId}`, this.wegameHeaders('', userIdentifier))
    return res !== null
  }

  // ─── 游戏数据 ───

  async getRole(ctx: Context, fwToken: string, accountType?: number) {
    const params: any = {}
    if (accountType) params.account_type = accountType
    return this.get(ctx, '/api/v1/games/rocom/profile/role', this.rocomHeaders(fwToken), params)
  }

  async getEvaluation(ctx: Context, fwToken: string) {
    return this.get(ctx, '/api/v1/games/rocom/profile/evaluation', this.rocomHeaders(fwToken))
  }

  async getPetSummary(ctx: Context, fwToken: string) {
    return this.get(ctx, '/api/v1/games/rocom/profile/pet-summary', this.rocomHeaders(fwToken))
  }

  async getCollection(ctx: Context, fwToken: string) {
    return this.get(ctx, '/api/v1/games/rocom/profile/collection', this.rocomHeaders(fwToken))
  }

  async getBattleOverview(ctx: Context, fwToken: string) {
    return this.get(ctx, '/api/v1/games/rocom/profile/battle-overview', this.rocomHeaders(fwToken))
  }

  async getBattleList(ctx: Context, fwToken: string, pageSize = 4, afterTime = '') {
    const params: any = { page_size: pageSize }
    if (afterTime) params.after_time = afterTime
    return this.get(ctx, '/api/v1/games/rocom/battle/list', this.rocomHeaders(fwToken), params)
  }

  async getPets(ctx: Context, fwToken: string, petSubset = 0, pageNo = 1, pageSize = 10) {
    const params = { pet_subset: petSubset, page_no: pageNo, page_size: pageSize }
    return this.get(ctx, '/api/v1/games/rocom/battle/pets', this.rocomHeaders(fwToken), params)
  }

  async getLineupList(ctx: Context, fwToken: string, pageNo = 1, category = '') {
    const params: any = { page_no: pageNo }
    if (category) params.category = category
    return this.get(ctx, '/api/v1/games/rocom/lineup/list', this.rocomHeaders(fwToken), params)
  }

  async getExchangePosters(ctx: Context, fwToken: string, pageNo = 1) {
    const params = { page_no: Math.max(pageNo, 1), refresh: 'false' }
    return this.get(ctx, '/api/v1/games/rocom/exchange/posters', this.wegameHeaders(fwToken), params)
  }

  async getMerchantInfo(ctx: Context, refresh = false) {
    return this.get(ctx, '/api/v1/games/rocom/merchant/info', this.wegameHeaders(), { refresh: refresh ? 'true' : 'false' })
  }

  async queryPetSize(ctx: Context, diameter: number, weight: number) {
    return this.get(ctx, '/api/v1/games/rocom/pet/size-query', this.wegameHeaders(), { diameter, weight })
  }

  async searchWikiPet(ctx: Context, query: string, limit = 10) {
    return this.get(ctx, '/api/v1/games/rocom/wiki/pet', this.wegameHeaders(), { q: query, limit })
  }

  async searchWikiSkill(ctx: Context, query: string, limit = 10) {
    return this.get(ctx, '/api/v1/games/rocom/wiki/skill', this.wegameHeaders(), { q: query, limit })
  }
}
