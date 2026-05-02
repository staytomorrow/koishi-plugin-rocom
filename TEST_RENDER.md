# 测试图片渲染

## 前置条件

1. **安装 puppeteer 插件**
   ```bash
   # 在 Koishi 控制台安装，或者
   npm install koishi-plugin-puppeteer
   ```

2. **安装浏览器**
   - Chrome / Edge / Firefox 任选其一
   - puppeteer 会自动检测系统已安装的浏览器

## 测试步骤

### 方法 1：通过 Koishi 命令测试（推荐）

1. 启动 Koishi
   ```bash
   cd /d/koishi-qq-end/highlander
   npm start
   ```

2. 在 Koishi 控制台启用 `rocom` 插件和 `puppeteer` 插件

3. 在聊天界面使用命令：
   ```
   洛克QQ登录
   # 或
   洛克微信登录
   # 或
   洛克导入 <fw_token>
   ```

4. 登录成功后，使用：
   ```
   洛克档案
   ```

5. 如果一切正常，会收到一张档案卡片图片

### 方法 2：直接测试模板渲染

如果你只想看模板效果，不需要真实数据：

1. 修改 `test-render.ts` 中的 `mockData`
2. 运行测试脚本：
   ```bash
   npx tsx test-render.ts
   ```

## 可能的问题

### 1. puppeteer 找不到浏览器

**错误信息**：
```
Error: Could not find Chrome/Edge/Firefox
```

**解决方法**：
- 安装 Chrome: https://www.google.com/chrome/
- 或安装 Edge: https://www.microsoft.com/edge
- 或安装 Firefox: https://www.mozilla.org/firefox/

### 2. 渲染超时

**错误信息**：
```
TimeoutError: Navigation timeout
```

**解决方法**：
- 检查网络连接（模板中的远程图片需要加载）
- 增加 puppeteer 超时时间（在 Koishi 控制台配置）

### 3. 图片发送失败

**错误信息**：
```
[rocom-send] image send failed
```

**解决方法**：
- 检查聊天平台是否支持图片发送
- 检查图片大小是否超过平台限制
- 查看 `send-image.ts` 的日志输出

## 模板文件位置

- **档案卡片**: `src/render-templates/personal-card/`
  - HTML: `index.html`
  - CSS: `style.css`

- **战绩**: `src/render-templates/record/`
- **背包**: `src/render-templates/package/`
- **阵容**: `src/render-templates/lineup/`
- **交换大厅**: `src/render-templates/exchange-hall/`
- **远行商人**: `src/render-templates/yuanxing-shangren/`

## 调试技巧

### 查看生成的 HTML

在 `src/render.ts` 的 `renderHtml` 方法中添加：

```typescript
// 保存 HTML 用于调试
fs.writeFileSync('debug.html', finalHtml, 'utf-8')
console.log('HTML 已保存到 debug.html')
```

然后在浏览器中打开 `debug.html` 查看效果。

### 检查模板数据

在命令文件（如 `src/commands/query.ts`）中添加：

```typescript
console.log('模板数据:', JSON.stringify(data, null, 2))
```

查看传递给模板的数据是否正确。

## 示例输出

成功渲染后，你会看到类似这样的日志：

```
[rocom-render] 渲染模板: personal-card
[rocom-send] [query:personal-card] image send success | size=245KB | platform=onebot user=123456
```

图片会直接发送到聊天界面。
