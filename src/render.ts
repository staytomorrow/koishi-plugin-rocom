import { Context, Logger } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import * as template from 'art-template'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const logger = new Logger('rocom-render')

function toDirectoryFileUrl(dirPath: string): string {
  const href = pathToFileURL(dirPath).href
  return href.endsWith('/') ? href : `${href}/`
}

function normalizeTemplateResourcePaths(content: string): string {
  return content.replace(/\{\{(_res_path|pluResPath)\}\}render\//g, '{{$1}}')
}

export class Renderer {
  constructor(private resPath: string) {}

  private getTemplateRoot() {
    return path.join(this.resPath, 'src', 'render-templates')
  }

  private getTemplatePath(templateName: string) {
    return path.join(this.getTemplateRoot(), templateName, 'index.html')
  }

  private getStylePath(templateName: string) {
    return path.join(this.getTemplateRoot(), templateName, 'style.css')
  }

  async renderHtml(ctx: Context, templateName: string, data: any): Promise<Buffer | null> {
    try {
      const templatePath = this.getTemplatePath(templateName)
      if (!fs.existsSync(templatePath)) {
        logger.error(`template file missing: ${templatePath}`)
        return null
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      const normalizedTemplateContent = normalizeTemplateResourcePaths(templateContent)
      const resPathUrl = toDirectoryFileUrl(this.getTemplateRoot())
      const renderData = { ...data, _res_path: resPathUrl, pluResPath: resPathUrl }
      const html = template.render(normalizedTemplateContent, renderData)

      if (!ctx.puppeteer?.page) {
        logger.error('puppeteer service is unavailable')
        return null
      }

      const page = await ctx.puppeteer.page()
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocom-render-'))
      const tempHtmlPath = path.join(tempDir, `${templateName.replace(/[\\/]/g, '_')}.html`)

      try {
        fs.writeFileSync(tempHtmlPath, html, 'utf-8')

        await page.setViewport({ width: 1280, height: 768, deviceScaleFactor: 2 })
        try {
          await page.goto(pathToFileURL(tempHtmlPath).href, {
            waitUntil: 'networkidle0',
            timeout: 15000,
          })
        } catch (err) {
          logger.warn(`page.goto failed for ${templateName}: ${err}`)
        }

        try {
          await page.evaluate(async () => {
            const images = Array.from(document.images)
            await Promise.all(images.map((img) => {
              if (img.complete) return Promise.resolve()
              return new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              })
            }))

            const fonts = (document as any).fonts
            if (fonts?.ready) {
              await fonts.ready
            }
          })
        } catch (err) {
          logger.warn(`asset wait failed for ${templateName}: ${err}`)
        }

        await new Promise(resolve => setTimeout(resolve, 300))

        const selectors = [
          '.exchange-page',
          '.record-page',
          '.package-cont',
          '.searcheggs-cont',
          '.bwiki-shell',
          '.skill-shell',
          '.page-section-main',
          '.stats-cont',
          '.lineup-page',
          '.inspect-page',
          '.player-search-page',
          '.ingame-shop-page',
          '.friendship-page',
          '.student-state-page',
          '.student-perks-page',
          '.student-page',
        ]

        let target: any = null
        for (const selector of selectors) {
          target = await page.$(selector)
          if (target) break
        }
        if (!target) {
          target = await page.$('body')
        }

        if (target) {
          const box = await target.boundingBox()
          if (box && box.width > 0 && box.height > 0) {
            await page.setViewport({
              width: Math.max(Math.ceil(box.width) + 8, 200),
              height: Math.max(Math.ceil(box.height) + 8, 200),
              deviceScaleFactor: 2,
            })
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          const screenshot = await target.screenshot({ type: 'png' })
          return Buffer.isBuffer(screenshot) ? screenshot : Buffer.from(screenshot)
        }

        const screenshot = await page.screenshot({ fullPage: true })
        return Buffer.isBuffer(screenshot) ? screenshot : Buffer.from(screenshot)
      } finally {
        try {
          await page.close()
        } catch {
          // ignore
        }
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    } catch (e) {
      logger.error(`render failed: ${e}`)
      return null
    }
  }
}
