# astrbot_plugin_rocom v3 功能移植记录

更新时间：2026-05-06

## 来源

本次移植对照目录：

- `src/doc/astrbot_plugin_rocom`
- 上游版本：`3.0.0`
- 上游重点更新：家园查询、家园订阅、远行商人私聊订阅、Ingame 查询、学生/商店/好友关系查询、模板渲染补充。

## 已移植功能

### 家园查询

- 新增命令：`洛克.家园 [UID]`
- 支持传入 UID 查询他人家园。
- 未传 UID 时，会尝试使用当前绑定账号的 `role_id`。
- 接入接口：`/api/v1/games/rocom/ingame/home/info`
- 支持后端 `202 task_id` 队列返回，并轮询 `/api/v1/games/rocom/ingame/tasks/{task_id}`。
- 渲染内容包括：
  - 家园概览
  - 菜园作物
  - 守卫精灵
  - 室内精灵
  - 作物成熟状态、倒计时、产量、可偷次数
  - 精灵灵感状态

### 家园订阅

- 新增命令：`订阅家园菜园 [UID]`
- 新增命令：`订阅家园灵感 [UID]`
- 新增命令：`取消订阅家园 [菜园/灵感/全部] [UID]`
- 新增配置：
  - `homeSubscriptionEnabled`
  - `homeSubscriptionIntervalMinutes`
- 订阅数据保存到 Koishi 数据目录下的 `rocom_home_subscriptions.json`。
- 支持首个完成和全部完成两档推送：
  - 菜园：首个成熟、全部成熟
  - 灵感：首个完成、全部完成

### Ingame 玩家查询

- 新增命令：`洛克.玩家 <UID>`
- 接入接口：`/api/v1/games/rocom/ingame/player/search`
- 支持后端同步返回和 `task_id` 异步轮询。
- 渲染玩家核心档案、家园信息、名片信息和个性签名。

### Ingame 商店查询

- 新增命令：`洛克.商店 <shop_id>`
- 接入接口：`/api/v1/games/rocom/ingame/merchant/info`
- 优先 GET，失败后降级 POST。
- 支持通用结构渲染，包括摘要卡片、商品列表、补充字段。

### 好友关系查询

- 新增命令：`洛克.好友关系 <id1,id2>`
- 接入接口：`/api/v1/games/rocom/social/friendship`
- 当前接口只返回有限状态字段，渲染中已按实验性功能处理。

### 学生认证与福利查询

- 新增命令：`洛克.学生 [area] [account_type]`
- 接入接口：
  - `/api/v1/games/rocom/activity/student-state`
  - `/api/v1/games/rocom/activity/perks`
- 渲染学生认证状态、学校信息、奖励列表和接口状态。

### 远行商人订阅补齐

- 保留原有命令：`订阅远行商人 [1/0] [商品...]`
- 补齐私聊订阅支持。
- 新增配置：`merchantPrivateSubscriptionEnabled`
- 群聊仍要求群管理员或 bot 管理员配置。
- 私聊订阅不使用 `@全体`。

## 静态资源与模板

从上游同步到 `src/render-templates`：

- `home`
- `player-search`
- `ingame-shop`
- `friendship`
- `student`
- `student-state`
- `student-perks`
- `inspect`

家园作物图标数据同步在：

- `src/render-templates/home/data/home_item_list.json`
- `src/render-templates/home/img/home_icon/*`

## 代码变更范围

- `src/client.ts`
  - 新增 `getLastError`
  - 新增带状态码请求方法
  - 新增 Ingame 任务轮询
  - 新增家园、商店、好友关系、学生接口
  - 调整玩家搜索以兼容异步队列机制

- `src/commands/query.ts`
  - 新增家园数据解析与渲染数据构造
  - 新增玩家、商店、好友、学生渲染数据构造
  - 新增家园订阅、取消订阅、定时检查逻辑
  - 新增对应 Koishi 命令注册

- `src/commands/merchant.ts`
  - 远行商人订阅支持私聊
  - 私聊和群聊使用不同订阅 key

- `src/user.ts`
  - 新增 `HomeSubscriptionManager`
  - 扩展远行商人订阅字段以记录私聊订阅

- `src/index.ts`
  - 注册 `HomeSubscriptionManager`
  - 新增家园订阅和远行商人私聊订阅配置项

- `src/types.ts`
  - 同步新增配置和依赖类型

- `src/render.ts`
  - 新增资源 URL 生成方法
  - 截图目标选择器补充 `.home-page`

## 验证

已执行：

```bash
npx tsc -p tsconfig.json --noEmit --pretty false
```

结果：通过。

## 注意事项

- Wiki 功能仍按上游当前状态保留为占位/暂不可用逻辑，未恢复旧 wiki 接口调用。
- 家园订阅推送依赖 Koishi `ctx.broadcast`，实际私聊/群聊投递格式可能随适配器平台有所差异。
- 新增 Ingame 接口依赖后端返回结构，渲染数据构造已做通用字段兼容，但部分实验性接口仍可能返回较少信息。
