# Shuxiwan · 创业活动现场连接

把活动现场的人，变成真正能聊得起来的人。

A webapp for in-person startup events that turns passive attendees into actively
connected people: AI-collected profiles, a live venue grid, topic-based zones,
and double-opt-in matchmaking.

## 快速开始

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，会看到 demo 活动。作为参与者点进活动，
用任意名字「入场」即创建账号。seed 已经造了 7 个虚拟参与者，你可以以他们的名字登录来体验匹配。

## 技术栈

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS + 一组极简内置组件
- Prisma + SQLite (dev) → PostgreSQL (prod，切换 `provider` 即可)
- 可插拔 AI provider（默认 stub，可接 Anthropic / OpenAI）

## 结构

```
src/
  app/
    page.tsx                       # 活动首页
    events/[id]/                   # 参与者视图
      page.tsx                     # 现场 grid
      profile/                     # 画像填表 + AI 对话
      zones/[zid]/                 # zone 详情
      zones/new/                   # 发起 zone
      recommendations/             # 双向匹配推荐
      recap/                       # 活动后回顾
    admin/events/                  # 主办方后台
    actions/                       # server actions
  components/ui.tsx                # Button / Card / Input ...
  lib/
    db.ts                          # prisma client + JSON helpers
    ai.ts                          # AI provider 抽象 + stub
    match.ts                       # 推荐打分 + 匹配理由
    session.ts                     # cookie session (MVP)
prisma/
  schema.prisma                    # 数据模型
  seed.ts                          # demo 数据
```

## 待办（按优先级）

- [ ] 接真实 LLM（Anthropic Claude / OpenAI）替换 stub
- [ ] 上传场地图持久化到对象存储
- [ ] 实时通道（SSE / WebSocket）替代轮询/重新加载
- [ ] 真实 OTP 登录（手机 + 邮箱）
- [ ] zone 拖拽编辑（替代当前坐标输入）
- [ ] 活动结束后 72h 归档任务
- [ ] 推荐里的 "skip" 持久化（避免反复推荐）
