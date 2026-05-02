import { h, Logger } from 'koishi'

const logger = new Logger('rocom-send')

function formatSessionContext(session: any): string {
  if (!session) return 'session=<null>'
  const platform = session.platform ?? 'unknown'
  const userId = session.userId ?? 'unknown'
  const guildId = session.guildId ?? 'private'
  const channelId = session.channelId ?? 'unknown'
  return `platform=${platform} user=${userId} guild=${guildId} channel=${channelId}`
}

function hasSendResult(result: any): boolean {
  if (result == null) return false
  if (typeof result === 'string') return result.length > 0
  if (Array.isArray(result)) return result.length > 0
  return true
}

export async function sendImageWithFallback(
  session: any,
  image: Buffer | null,
  fallbackText: string,
  scene: string,
) {
  const ctxInfo = formatSessionContext(session)

  if (!image) {
    logger.warn(`[${scene}] render returned empty image, fallback to text | ${ctxInfo}`)
    try {
      await session.send(fallbackText)
    } catch (e) {
      logger.error(`[${scene}] text fallback send failed | ${ctxInfo} | ${e}`)
    }
    return
  }

  try {
    const result = await session.send(h.image(image, 'image/png'))
    if (!hasSendResult(result)) {
      logger.warn(`[${scene}] image send returned empty result | size=${image.length}B | ${ctxInfo}`)
    }
  } catch (e) {
    logger.error(`[${scene}] image send failed | size=${image.length}B | ${ctxInfo} | ${e}`)
    try {
      await session.send(fallbackText)
    } catch (fallbackErr) {
      logger.error(`[${scene}] text fallback send failed after image send error | ${ctxInfo} | ${fallbackErr}`)
    }
  }
}

