import { Context, Logger } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import * as template from 'art-template'
import * as fs from 'fs'
import * as path from 'path'

const logger = new Logger('rocom-render')

export class Renderer {
  constructor(private resPath: string) {}

  async renderHtml(ctx: Context, templateName: string, data: any): Promise<Buffer | null> {
    try {
      const templatePath = path.join(this.resPath, 'src', 'doc', 'astrbot_plugin_rocom', 'render', templateName, 'index.html')
      if (!fs.existsSync(templatePath)) {
        logger.error(`模板文件不存在: ${templatePath}`)
        return null
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      const cssPath = path.join(this.resPath, 'src', 'doc', 'astrbot_plugin_rocom', 'render', templateName, 'style.css')
      const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : ''

      const resPathUrl = `file://${this.resPath.replace(/\\/g, '/')}/src/doc/astrbot_plugin_rocom/`
      const renderData = { ...data, _res_path: resPathUrl }

      const html = template.render(templateContent, renderData)
      const finalHtml = cssContent
        ? html.replace('</head>', `<style>${cssContent}</style></head>`)
        : html

      if (!ctx.puppeteer?.render) {
        logger.error('puppeteer 服务不可用')
        return null
      }

      const result = await ctx.puppeteer.render(finalHtml)
      return Buffer.from(result)
    } catch (e) {
      logger.error(`渲染失败: ${e}`)
      return null
    }
  }
}
