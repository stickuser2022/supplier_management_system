@AGENTS.md
# Qingger Suppliers Management

> A geographic-first supplier management system for cross-border procurement.

## 项目概述

这是一个供个人采购业务使用的供应商管理系统,主要解决的核心痛点是:

- 供应商信息散落在微信、邮箱、Excel 中,难以检索
- 缺少地理直观的视角,无法快速回答"我在某地区,谁可以拜访"
- 与海外家人协作时,信息共享和语言阅读存在障碍

系统通过中国地图 + 红点节点的方式可视化供应商分布,支持按品类、关键词、标签快速搜索,并集中存储供应商相关的画册、视频、图片、交易记录等资料。

## 用户与角色

本系统是**单管理员、多阅览者**的协作模式:

- **Admin(1 人):** 项目主人(青格力),负责所有供应商数据的采集、录入、维护
- **Viewer(若干人):** 海外家人(俄罗斯),纯阅览权限,用于查询供应商信息

数据所有权统一,不区分"我的供应商"和"他们的供应商"。

## 语言策略

- **界面语言:** 中文 / 俄语双语,用户登录后可切换,偏好持久化
- **数据录入语言:** Admin 始终用中文录入
- **数据显示语言:** 
  - 结构化字段(供应商名、城市、地址、联系人姓名等):按用户界面语言显示,俄语版由系统自动翻译并缓存,Admin 可手工修正
  - 自由文本(备注、沟通记录):始终显示中文原文,提供"翻译"按钮按需翻译给俄语用户
  - 标签(品类、质量评级等):系统内置中俄对照,用户自建标签时强制双语录入

## 关键设计决策

- **数据库:** 开发期 SQLite,长期可平滑迁移至 PostgreSQL,统一通过 Prisma ORM 访问
- **文件存储:** 开发期本地文件系统(按供应商分目录),长期可迁移至对象存储(OSS/COS);代码层做存储抽象,业务层不感知底层
- **翻译服务:** 通过抽象层接入,当前使用 DeepL,可热切换至 DeepSeek 等其他提供商
- **部署形态:** 短期跑在 Admin 笔记本上,中长期迁移至国内云服务器


## 数据备份策略(本地部署期)

短期内系统跑在 Admin 笔记本上,数据风险只有"硬盘坏 / 误删 / 笔记本丢"这几种场景。备份策略对应解法:每天自动把核心数据复制到云盘同步目录,云盘自动传上云。

### 备份范围

只备份 2 样,其他都不需要:
- `dev.db` — SQLite 数据库,所有业务数据
- `storage/` — 文件存储根目录,所有上传的画册、视频、截图、文档

代码不备份(GitHub 有);node_modules 不备份(npm install 可重建);.next 不备份(运行时缓存)。

### 工具栈

- **脚本**:`scripts/backup.ps1`(PowerShell)
- **调度**:Windows 任务计划程序,任务名 `QinggerDailyBackup`,每天凌晨 3:00 自动跑
- **云盘**:Google Drive for Desktop(本地同步路径 `G:\我的云端硬盘\supplier_management_backup\`)
- **保留窗口**:最近 7 天,自动清理更老的

### 关键设计决策

- **简单 Copy-Item 而非 SQLite online backup**:单 Admin 写入并发极低,凌晨 3 点几乎不会撞到正在写入的瞬间。即使某次快照偶尔捕获到不一致状态,前一天的快照仍可用,7 天滚动窗口让这种风险接近零。等真上生产再考虑 online backup API
- **`StartWhenAvailable` 电源容错**:任务计划带 `-StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries`,凌晨 3 点笔记本如果在睡眠/关机,下次开机后自动补跑一次,不丢备份
- **`DestinationRoot` 参数化**:不锁死特定云盘。今天 Google Drive,明天换阿里云盘只改任务计划里那一个路径参数,脚本逻辑不动
- **本地保留 7 天而非全部**:云盘同步是双向的,本地 7 天 = 云盘也 7 天。本地无限堆积会让云盘空间不可控

### 恢复流程(笔记本坏掉时)

```
1. 新机器装 Node 22 + Git + Google Drive 客户端
2. git clone 项目
3. 登录 Google Drive,等同步把 supplier_management_backup\ 拉下来
4. 从最新日期目录复制 dev.db 回项目根
5. 从最新日期目录镜像 storage\ 回项目根
6. npm install && npx prisma generate
7. npm run dev
8. 数据全回来,约 30 分钟内可恢复正常
```

### 健康度验证(每月一次)

- 打开 `G:\我的云端硬盘\supplier_management_backup\backup.log`,确认最近几天都有 `=== 备份完成 ===` 日志
- 打开当天快照目录,目测 dev.db 大小和 storage/ 文件数合理(不是 0、不是异常缩水)

### 升级方向(等真有需要再做)

- 上云后:服务器侧加 PostgreSQL 自动备份(pg_dump cron)+ OSS 自带的多版本存储
- 跨机房冷备:每月一份压缩快照拷到外接 U 盘,锁抽屉里
- 自动告警:备份失败发个微信/邮件提醒(目前只靠 backup.log 被动检查)

## AI 协作约定

本章节是给所有 AI 协作者(Claude、GPT、Gemini 等)的工作准则。每次开新对话,把整份 CLAUDE.md 粘给 AI 时,这些约定保证协作风格稳定、输出格式正确。

### 合作模式

- **混合模式**:AI 给思路、指示、关键片段,用户主导写代码、做架构决策
- **决策优先于动手**:每张表、每个功能,先聊清字段含义和取舍,再写 Prisma 或业务代码
- **每个小里程碑做 Git 提交**:养成习惯,便于回滚和追溯
- **CLAUDE.md 是项目大脑**:每次结束前更新"项目进度日志"段;阶段性里程碑同步更新本章节及其他相关章节

### 用人话沟通,慎用术语

AI 给用户解释时,**优先用日常类比和具体场景**,而不是堆专业术语。用户是业务负责人 + 编程学习者,术语密度过高会直接造成认知过载、影响判断质量。

- 遇到一个技术词不可避免,**首次出现时用一句话解释它的本意**(比如"adapter 就是把不同品牌插头转成统一接口的转接头"),然后再继续用这个词
- 解释机制先给比喻或具体场景(水管、配电箱、快递分拣),再上术语 —— **不要反过来**
- 一次回应里如果出现 3 个以上新术语,大概率用户会过载 —— **拆成多轮**,或聚焦到 1 个核心概念
- 用户表达"懵 / 一知半解 / 信息过载"时,**不要追加更多术语**,而是降一层抽象(用比喻、画图、举具体例子)
- 决策类问题(为什么这样设计),用**"如果不这样做会怎样"的反例**来讲,比直接灌定义易懂

这一条与"决策优先于动手"是同等优先级的协作准则。AI 写代码再准,如果用户读不懂决策依据,就不可能在长期项目中保留架构感,等同失败。

### Markdown 输出规范(重要)

当 AI 输出**供用户粘贴到 CLAUDE.md 的内容**时,必须遵守以下格式约定,否则用户在 md 预览里看到的内容会渲染错乱:

1. **整段用长代码围栏(7 个及以上反引号 + `markdown` 语言标识)包裹**——形如:

```````markdown
       ...内容...
```````

   理由:内部往往嵌套普通 3 反引号代码块(字段定义、枚举值等),外层围栏必须更长,否则会被内部反引号"刺穿"导致围栏提前关闭

2. **字段定义、枚举值用普通 3 反引号代码块包裹**:树形字符(`├── │ └──`)如果不放在代码块里,markdown 解析器可能将其当成特殊语义,导致缩进和对齐被破坏

3. **markdown 表格放在代码块外**:表格语法依赖 markdown 原生解析,在代码块里反而失效

4. **末尾元数据子项保持 4 空格缩进**:CLAUDE.md 现有所有表字段定义里,末尾"元数据"区子项前面有 4 个空格,新增表必须保持一致风格

5. **粘贴边界要清晰**:输出时明确说明"复制这一整段,粘贴到 CLAUDE.md 的哪个位置",避免用户不知道边界

不遵守此规范的常见后果:用户复制后在 md 预览看到树形结构错乱、表格不渲染、缩进丢失,需要回过头来人工修复,浪费双方时间。
6. **JSON 一律完整写全,不用"...(保留原内容)"占位符**:AI 给 JSON 片段时,所有键值对必须写出实际值。占位符容易被用户照字面意思粘贴,导致 messages 文件出现实际值是字面字符串 "..." 的字段,或者错位嵌套(把原本平级的对象嵌进了内部对象)。如果某个键的现有值 AI 不知道,**必须先问用户那段现有内容是什么,再给完整 JSON**——绝不留占位符让用户自己脑补

### 不确定时的处理

- AI 对项目业务细节有疑问时,**先问再做**,不要靠"合理推测"自己编
- 用户的"这个我懂了"和"按你说的来"在含义上不同——前者只是确认理解,后者才是授权动手;AI 模糊地带优先确认意图
- 字段命名、术语选择不一致时,AI 主动指出,不要静默修补
---

## 技术栈

### 核心框架

| 类别 | 选型 | 版本 | 备注 |
|------|------|------|------|
| Web 框架 | Next.js | 16.2.6 | App Router + Turbopack |
| UI 库 | React | 19.2.4 | |
| 语言 | TypeScript | ^5 | 强类型,严格模式 |
| 样式 | Tailwind CSS | ^4 | 原子化 CSS |
| 代码规范 | ESLint | ^9 | Next.js 推荐配置 |

### 计划引入(随阶段推进逐步添加)

| 类别 | 选型 | 引入阶段 | 用途 |
|------|------|---------|------|
| ORM | Prisma | 阶段 1 | 数据库访问抽象层 |
| 数据库(开发) | SQLite | 阶段 1 | 本地文件型数据库 |
| 数据库(生产) | PostgreSQL | 上云时 | 迁移目标,代码不变 |
| 认证 | Auth.js (NextAuth) | 阶段 2 | Admin / Viewer 角色 |
| 地图 | Leaflet + 中国 GeoJSON | 阶段 2 | 离线地图,不依赖海外服务 |
| 国际化 | next-intl | 阶段 3 | 中俄双语界面 |
| 翻译 API | DeepL → DeepSeek(可热切换) | 阶段 4 | 自由文本按需翻译 |
| 文件存储 | 本地文件系统 → OSS(可热切换) | 阶段 5 | 画册、视频、图片 |

## 项目目录结构
supplier_management_system/
├── src/                      ← 所有业务代码(我们的主战场)
│   └── app/                  ← Next.js App Router 路由目录
│
├── public/                   ← 静态资源(图片、favicon 等)
│
├── prisma/                   ← (待创建) Prisma schema 和迁移文件
│   └── schema.prisma         ← 数据库模型定义
├── scripts/                  ← 运维脚本(备份、维护任务等)
│   └── backup.ps1            ← 每日备份脚本,Task Scheduler 调度
│
├── messages/                 ← (待创建) i18n 翻译文件
│   ├── zh.json
│   └── ru.json
│
├── storage/                  ← (待创建) 本地文件存储根目录
│   └── suppliers/            ← 按供应商分目录
│
├── .gitignore                ← Git 忽略规则(node_modules、.env 等)
├── .env                      ← (待创建) 环境变量,不进 Git
├── .env.example              ← (待创建) 环境变量模板,进 Git
│
├── CLAUDE.md                 ← 项目大脑,AI 协作上下文 ← 你正在看的文件
├── AGENTS.md                 ← Next.js 16 官方 AI 协作约定
├── README.md                 ← 项目自述
│
├── package.json              ← 依赖清单
├── package-lock.json         ← 依赖版本锁定(自动生成)
├── tsconfig.json             ← TypeScript 配置
├── next.config.ts            ← Next.js 配置
├── postcss.config.mjs        ← PostCSS / Tailwind 配置
└── eslint.config.mjs         ← ESLint 配置

## 关键文件说明

- **`package.json`** — 项目身份证。新人接手项目第一个看的文件
- **`tsconfig.json`** — 决定 TypeScript 严格程度。保持默认严格模式
- **`next.config.ts`** — Next.js 行为配置(图片域名白名单、i18n、重定向等)
- **`prisma/schema.prisma`** — 数据库表结构的"单一事实来源"。改这个文件 + 跑 migrate 命令 = 数据库结构变更
- **`.env`** — 存放密钥、数据库连接串、API key。**绝对不能进 Git**,`.gitignore` 已配置
- **`messages/*.json`** — i18n 翻译文件,所有界面文字都从这里取

## 开发常用命令

```bash
# 启动开发服务器(http://localhost:3000)
npm run dev

# 构建生产版本(暂不需要)
npm run build

# 运行 ESLint 检查
npm run lint

```bash
# Prisma 相关
npx prisma studio                                # 数据库可视化管理(浏览器打开 localhost:5555)
npx prisma migrate dev --name <migration_name>   # 应用 schema 变更到数据库,带上本次变更的描述名
npx prisma generate                              # 重新生成 Prisma Client(Prisma 7 中必须显式跑)
npx prisma format                                # 自动格式化 schema.prisma 文件
```

> **Prisma 7 关键变化**:`migrate dev` 不再自动跑 `generate`(v6 旧版会自动跑)。改完 schema 后,**两条都要手动跑**:先 `migrate dev` 让数据库结构跟上,再 `generate` 让 TypeScript Client 代码跟上。如果只跑 migrate 不跑 generate,业务代码里的 `prisma.xxx.findMany(...)` 类型会过时报错。
```
## Prisma 7 + driver adapter 实操要点

本系统用的是 Prisma 7 + `@prisma/adapter-better-sqlite3` driver adapter 模式,与 Prisma 5/6 旧版差异较大。下面 5 个坑都是 2026.5.21 跑通 `src/lib/prisma.ts` 时实地踩过的,写在前头供未来对话避坑。

### 1. Generator 用新的 `prisma-client` provider

`prisma/schema.prisma` 顶部的 generator 块:

```
generator client {
  provider = "prisma-client"            // 新版,旧版叫 "prisma-client-js"
  output   = "../src/generated/prisma"  // 自定义输出路径
}
```

带来的具体影响:Client 的入口文件叫 **`client.ts`**(旧版叫 `index.ts`),所以 import 路径必须带 `/client` 后缀:

```typescript
import { PrismaClient } from '../generated/prisma/client';
//                                                ↑ 这段不能漏
```

漏 `/client` 会以 `Cannot find module` 报错。

### 2. Adapter 包的导出名是 `PrismaBetterSqlite3`

注意大小写:**小写 `Sqlite3`**,不是 `SQLite3`:

```typescript
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
const adapter = new PrismaBetterSqlite3({ url: '<abs-path>' });
```

写错会以 `is not a constructor` 报错(undefined 不能 new)。

**查任何 npm 包真实导出的金标方法是看 `.d.ts`**:

```powershell
type node_modules\@prisma\adapter-better-sqlite3\dist\index.d.ts
```

这是该包对外的"说明书",一切以它为准,比凭记忆或搜过时博客可靠得多。

### 3. 裸 Node 脚本必须手动加载 .env

`tsx` / `node` 直接跑 `.ts` / `.js` 脚本时,**不自动加载 .env**。Prisma CLI 和 Next.js 运行时自带 dotenv,所以业务代码无感;但 `scripts/` 下的工具脚本必须显式加载:

```typescript
import 'dotenv/config';                       // 必须在所有 import 之前
import { prisma } from '../src/lib/prisma';
```

否则 `process.env.DATABASE_URL` 是 `undefined`,而 `!` 非空断言只骗 TS、不影响运行时,后续会以 `Cannot read properties of undefined (reading 'replace')` 之类的间接错出现,**症状离根因很远,排查很费时**。

### 4. 路径锚点:CLI 和 adapter 都以 cwd 为基准

旧文档(Prisma 5/6 时代)常说 SQLite 相对路径相对于 `schema.prisma` 目录解析。**Prisma 7 + `prisma.config.ts` 模式下,实测两端都以 `process.cwd()` 为基准**(即从哪个目录跑命令,就从那里算)。

所以 `.env`:

```
DATABASE_URL="file:./dev.db"
```

从项目根目录跑命令时,真实路径是项目根目录的 `dev.db`,**不在 prisma/ 子目录**。`prisma.ts` 里转绝对路径也不需要补 `prisma/` 段:

```typescript
const raw = process.env.DATABASE_URL!.replace(/^file:/, '');
const dbPath = path.isAbsolute(raw)
  ? raw
  : path.resolve(process.cwd(), raw);   // 直接 cwd + raw,不加任何子目录
```

排错小窍门:任何"数据库文件位置 / 路径锚点"类困惑,先在 prisma.ts 里 `console.log` 出 `process.env.DATABASE_URL`、`raw`、`dbPath`、`process.cwd()` 这四个值,5 分钟定位,不要靠猜。

### 5. `prisma.config.ts` 是 Prisma 7 新引入的配置文件

项目根目录有 `prisma.config.ts`(Prisma 7 引入,部分配置从 schema.prisma 迁移到这里)。CLI 启动时会自动加载,日志里会看到 `Loaded Prisma config from prisma.config.ts.`。具体内容当前未深究,**只要知道它存在,且会影响 CLI 行为**即可,需要调整时再翻文档。

---

## 数据模型设计

### 核心实体一览

本系统的数据模型围绕"供应商"这一核心实体展开,关联以下实体:

| 实体 | 中文名 | 与 Supplier 的关系 | 阶段 |
|------|-------|------------------|------|
| Supplier | 供应商 | 核心实体 | 阶段 1 |
| Tag | 标签 | 多对多 | 阶段 1 |
| Contact | 联系人 | 一对多 | 阶段 1 |
| User | 用户 | 一对多(created_by) | 阶段 2 |
| Quote | 报价记录 | 一对多 | 阶段 4 |
| Note | 沟通记录 | 一对多 | 阶段 4 |
| Transaction | 交易记录 | 一对多 | 阶段 5 |
| File | 文件 | 一对多 | 阶段 5 |

### 双语策略(贯穿所有表)

数据库中需要双语显示的字段,采用**四种不同机制**,根据数据性质区分:

| 类别 | 例子 | 录入方式 | 数据库结构 |
|------|------|---------|-----------|
| 界面文字 | 按钮、菜单、表单标签 | 项目初始化时翻译 | `messages/zh.json` + `messages/ru.json` |
| **标签库** | 品类、资质、能力等 | Admin 录入时**强制填中俄两份**,AI 仅提供"建议"按钮 | Tag 表 `name_zh` + `name_ru` 都必填 |
| **供应商核心数据** | 公司名、城市、地址、备注 | Admin 仅录中文,系统**自动 AI 翻译**填俄文 | `xxx_zh` + `xxx_ru` + `xxx_ru_auto_translated` 三件套 |
| 自由文本(辅助/低频字段) | Note 内容、认识渠道、报价来源、付款方式 | Admin 仅录中文,Viewer 看时**按需点翻译按钮**实时翻译 | 数据库只存原文,翻译不持久化 |

### 按需翻译模式的适用字段清单与 UI 优化

走"按需翻译不入库"模式的字段(数据库只存中文原文,Viewer 视角下提供翻译按钮按需调 API 翻译,结果不持久化)目前包括:

| 字段 | 长度 | Viewer 浏览频率 | 备注 |
|------|------|---------------|------|
| `Supplier.discovered_via` | 短 | 低 | Admin 私人备忘性质 |
| `Quote.source` | 短 | 中 | 录入溯源元数据 |
| `Payment.method` | 短 | 中 | 已完成动作的描述 |

**为什么这几个字段不走双语三件套?** 它们的共同特征是:**Viewer 看与不看不影响决策**(辅助信息 / Admin 私人备忘 / 已完成动作的描述),或**长文本经常修改、机翻入库容易导致中俄不一致**(如 Note.content)。机翻入库的存储和维护开销不划算,UI 按钮 + 实时翻译是更经济的方案。

**UI 阶段需要做的流畅度优化**(影响 Viewer 体验,不影响 schema):

- **前端 localStorage 缓存**:Viewer 翻译过的同一段文本,本地缓存,再次浏览同一页面直接显示俄文,无需再调 API
- **批量翻译按钮**:Note 列表页提供「翻译当前页全部」一键按钮,Viewer 看完滚到底就够,避免逐条点击
- **(可选)预翻译策略**:Viewer 打开供应商详情时,系统后台预翻译该供应商的全部 Note,降低交互延迟

**API 用量评估**(以 DeepL 为参考基准):按 50 供应商 / 每供应商 10 条 Note / 每条 50 字 / 3 个 Viewer / 每人每天 20 条估算,月度翻译字符约 9 万,远低于 DeepL 免费版 50 万字符/月的限额。叠加 localStorage 缓存后实际调用更少。生产环境上正式平台时建议升级 DeepL Pro 或切换 DeepSeek(通过翻译抽象层一行配置切换)。

---
### 双语字段命名约定

凡是需要双语的字段,统一遵循:

```
[字段名]_zh                       中文版本(主)
[字段名]_ru                       俄文版本(可空,可自动)
[字段名]_ru_auto_translated       是否由 AI 自动翻译(仅供应商类数据需要)
```

加新双语字段时按此模板套用,无需每次单独设计。

### Prisma schema 命名约定

数据库层与代码层命名风格分离,统一通过 `@map` / `@@map` 桥接:

- **数据库层(实际列名 / 表名):** snake_case,例如 `name_zh`、`created_at`、`supplier_tag`
- **代码层(Prisma 模型字段 / 模型名):** camelCase / PascalCase,例如 `nameZh`、`createdAt`、`SupplierTag`
- **桥接方式:**
    - 字段:`nameZh String @map("name_zh")`
    - 表:`@@map("supplier_tag")`
- **本 CLAUDE.md 文档里所有"字段定义"段落给出的是数据库视角(snake_case),写 schema 时按 camelCase 转写,加 `@map`**

理由:Prisma 官方推荐 + 与 JS/TS 生态主流命名一致,业务代码里 `supplier.nameZh` 比 `supplier.name_zh` 自然;同时数据库层保持 snake_case 是 SQL 生态主流,迁移到 PostgreSQL 时也无需改列名。代价是 schema 文件里每个双语字段都要写一次 `@map`,但这是一次性成本,可接受。

### 关系删除策略(onDelete 决策规则)

外键关系的 `onDelete` 行为按"关系性质 + 字段可空性"两个维度分四类决策,不要逐个表临时拍:

| 关系性质 | `onDelete` | 含义 | 本项目例子 |
|---------|-----------|------|----------|
| **附属实体**(必填外键,脱离主表无业务意义) | `Cascade` | 主表行物理删除时,附属行一并清掉 | Contact / Quote / Note 对 Supplier;SupplierTag / QuoteTag 对各自主表 |
| **审计 / 所有权痕迹**(必填外键,记录"谁创建了") | `Restrict` | 引用方还在时,禁止物理删除被引用方 | 所有业务表的 `createdBy` 对 User |
| **共享资源引用**(必填外键,被引用方是项目级共享池) | `Restrict` | 还有引用时,禁止删除共享资源,防止误删影响一大片 | SupplierTag / QuoteTag 对 Tag |
| **弱关联**(**可空外键**,被引用方可有可无,不影响事件本身) | `SetNull` | 主表行被删时,子表对应外键自动置空,事件记录保留 | Quote 对 Contact;Note 对 Contact / Quote |

**为什么不全用 Cascade 简单粗暴?** 四类的业务含义不同:

- `createdBy` 的 Restrict 保护审计链,防止"删用户连带删走他所有数据"
- 共享 Tag 的 Restrict 防止"删一个 Tag 影响 30 家挂着它的供应商"
- **弱关联用 SetNull 的语义**:事件流(Quote / Note)是独立有价值的,即使原本关联的辅助对象(Contact / Quote)消失,事件本身仍要保留——置空外键意味着"原挂着的对象不在了,但这条记录本身的内容仍有意义"
- 这种"严格 vs 宽松"的分层是有意为之,所以**同一张中间表两个外键方向不对称是合理的**

**SetNull 与可空性的硬性绑定:** `SetNull` 只能用于可空外键(`Int?`)。必填外键(`Int`)用了 SetNull,Prisma 校验直接拒绝迁移——因为删除时往非空字段写 NULL 自相矛盾。这条铁律帮你在 schema 阶段就拍死一类设计错误。

**与软删除的协同:** 所有业务表都有 `isActive: Boolean` 软删除字段,正常工作流走软删除,物理删除仅用于"误录想撤销"的极端场景。四类 `onDelete` 规则只在物理删除路径上生效,平时不打扰正常流程。

**新增外键时的快速决策路径:**

| 外键可空? | 默认走哪一类 |
|---------|-----------|
| 必填(`Int`) | 在前三类(附属 Cascade / 审计 Restrict / 共享 Restrict)中按"性质"选 |
| 可空(`Int?`) | 默认走第 4 类 SetNull,除非业务上明确希望事件本身也一并消失 |

出现不属于上表的关系性质,再单独讨论扩展第 5 类。
---

### Supplier 表(供应商)

供应商是系统的核心实体,代表一家公司。

**字段定义:**

```
Supplier(供应商)
├── id                                  Int        主键,自增
│
├── # 身份信息
├── code                                String     自定义编号(如 GZ-001),必填且 unique(Admin 手动赋予人类可读编号,如"GZ-001"暗示广州第一家)
├── name_zh                             String     中文全名,必填
├── name_ru                             String?    俄文全名(可自动翻译)
├── short_name_zh                       String?    中文简称
├── short_name_ru                       String?    俄文简称(可自动翻译)
│
├── # 地理位置
├── province_zh                         String     省份(中文),必填
├── province_ru                         String?    省份(俄文,可自动翻译)
├── city_zh                             String     城市(中文),必填
├── city_ru                             String?    城市(俄文,可自动翻译)
├── district_zh                         String?    区县(中文)
├── district_ru                         String?    区县(俄文,可自动翻译)
├── address_zh                          String?    详细地址(中文)
├── address_ru                          String?    详细地址(俄文,可自动翻译)
├── latitude                            Float      纬度,必填
├── longitude                           Float      经度,必填
│
├── # 业务描述
├── cooperation_level                   Enum       合作深度,默认 INITIAL_CONTACT
├── description_zh                      Text?      中文描述/备注
├── description_ru                      Text?      俄文描述(可自动翻译)
├── discovered_via                      String    认识渠道(自由文本)
├── website                             String?    主官网链接
│
├── # 自动翻译标记(7 个)
├── name_ru_auto_translated             Boolean    默认 true
├── short_name_ru_auto_translated       Boolean    默认 true
├── province_ru_auto_translated         Boolean    默认 true
├── city_ru_auto_translated             Boolean    默认 true
├── district_ru_auto_translated         Boolean    默认 true
├── address_ru_auto_translated          Boolean    默认 true
├── description_ru_auto_translated      Boolean    默认 true
│
└── # 元数据
    ├── created_at                      DateTime   创建时间(自动)
    ├── updated_at                      DateTime   更新时间(自动)
    ├── created_by_id                   Int        创建人(外键 → User)
    └── is_active                       Boolean    是否启用(逻辑删除),默认 true
```

**枚举 CooperationLevel:**

```
INITIAL_CONTACT   初步接触(尚未下单)
TRIAL_ORDER       试单阶段(下过 1-2 单试水)
REGULAR           常规合作(稳定下单)
STRATEGIC         战略合作(主力供应商)
INACTIVE          已暂停(目前未合作但未拉黑)
```

**关联到其他表:**

- Supplier ↔ Tag : 多对多(通过 SupplierTag 中间表)
- Supplier → Contact : 一对多
- Supplier → Quote : 一对多
- Supplier → Note : 一对多
- Supplier → Transaction : 一对多
- Supplier → File : 一对多
- Supplier → User(created_by) : 多对一

**重要设计决策:**

- **逻辑删除而非物理删除**:删除操作仅设置 `is_active = false`,数据永久保留
- **质量评级不做静态字段**:不设 `quality_rating` 枚举;质量评估属于事件性数据,通过 Note(沟通记录)和 Transaction(交易记录)的时间线体现
- **付款条件、规格属性不做字段**:这些是订单维度的动态属性,落在 Quote / Transaction 表中
- **公司规模、营业执照等低频信息**:写入 `description_zh`,日后若发现高频再拎出来成字段
- **`discovered_via` 字段保持单语 + UI 翻译按钮**(2026.5.19 双语审计结论):Admin 用中文录入认识渠道(如"广交会"、"朋友介绍"、"老李推荐"),Viewer 视角下提供「翻译这一项」按钮按需翻译,翻译结果不入库。理由:这是 Admin 私人备忘性质的字段,Viewer 即使翻译了「老李推荐」也不知道老李是谁,不值得开双语三件套

---

### Tag 表(标签)

标签用于灵活地给供应商打多维度的属性标记,与品类、资质、能力等相关。

**字段定义:**

```
Tag(标签)
├── id                Int        主键,自增
├── category          Enum       标签分组(TagCategory)
├── name_zh           String     中文名,必填
├── name_ru           String     俄文名,必填
├── color             String?    颜色(7 位 hex,如 "#3B82F6")
├── icon              String?    图标标识符(Emoji / 图标库名 / 路径,延迟解读)
├── is_system         Boolean    是否系统预置,默认 false
├── needs_review      Boolean    是否需要审核(就地创建时为 true),默认 false
├── is_active         Boolean    是否启用,默认 true
├── created_at        DateTime   创建时间(自动)
├── updated_at        DateTime   更新时间(自动)
└── created_by_id     Int        创建人(外键 → User)
```

**枚举 TagCategory:**

```
PRODUCT     产品品类      (玩具、机械、电子、纺织等)
EXPORT      出口能力      (已出口俄罗斯、欧盟、中亚等)
CERT        认证资质      (EAC、CE、FCC、ISO 9001、FDA 等)
CAPACITY    生产能力      (OEM、ODM、自有品牌、打样快速、小批量等)
CUSTOM      其他/自定义   (兜底分组)
```

**重要设计决策:**

- **新建标签必须填中俄两份**:不依赖 AI 自动翻译;新建表单提供"AI 建议俄文"按钮,最终保存的必须是人工确认值
- **就地创建 + 后续审核**:录入供应商时遇到缺失标签可立即创建,自动标记 `needs_review = true`;管理页面有"待审核"过滤器,Admin 定期治理
- **系统预置标签不可删**:`is_system = true` 的标签可改可停,但不能删,防止误操作
- **`icon` 字段延迟解读**:数据库仅存字符串,具体解读规则(Emoji / 图标库 / 图片路径)在 UI 阶段(阶段 4)确定

---

### SupplierTag 表(供应商-标签关联)

Supplier 与 Tag 的多对多关系通过此中间表实现。

```
SupplierTag(供应商-标签关联)
├── supplier_id    Int        外键 → Supplier
├── tag_id         Int        外键 → Tag
├── created_at     DateTime   关联创建时间
└── (复合主键: supplier_id + tag_id)
```
此表由 Prisma 自动管理,业务代码通常无需直接操作。

---


### Contact 表(联系人)

联系人是供应商下的具体人,一个供应商可有多个联系人,其中至多 1 个为主要联系人。

**字段定义:**

```
Contact(联系人)
├── id                                 Int        主键,自增
├── supplier_id                        Int        外键 → Supplier,必填
│
├── # 身份信息
├── name_zh                            String     中文姓名,必填
├── name_ru                            String?    俄文姓名(可自动翻译)
├── role_zh                            String?    职位(中文,自由文本)
├── role_ru                            String?    职位(俄文,可自动翻译)
│
├── # 联系方式(全 nullable,允许 "/" 分隔多个号码)
├── phone                              String?    手机号
├── wechat                             String?    微信号
├── email                              String?    邮箱
├── whatsapp                           String?    WhatsApp
├── telegram                           String?    Telegram
├── qq                                 String?    QQ
│
├── # 状态
├── is_primary                         Boolean    是否主要联系人,默认 false
├── status                             Enum       ContactStatus,默认 ACTIVE
│
├── # 自动翻译标记
├── name_ru_auto_translated            Boolean    默认 true
├── role_ru_auto_translated            Boolean    默认 true
│
└── # 元数据
    ├── created_at                     DateTime   创建时间(自动)
    ├── updated_at                     DateTime   更新时间(自动)
    └── created_by_id                  Int        创建人(外键 → User)
```

**枚举 ContactStatus:**

```
ACTIVE     活跃
ARCHIVED   已归档(离职 / 失联 / 暂停往来等)
```

**关联到其他表:**

- Contact → Supplier : 多对一(必填)
- Contact → User(created_by) : 多对一
- Contact → Quote / Note : 一对多(后续表设计时建立)

**重要设计决策:**

- **每供应商至多 1 名主要联系人**:`is_primary` 的唯一性不在数据库层强制,在应用层保证。保存新主要联系人时,先把同一 supplier 下其他联系人的 `is_primary` 全部置为 false,再保存当前记录为 true,整个动作在一个 Prisma 事务里完成
- **联系方式 6 字段全可空,UI 层做"按需添加"体验**:数据模型保持单表 6 字段,但录入界面不一次性铺开 6 个输入框;管理者点"+ 添加联系方式" → 弹出可选类型 → 选了对应类型才显示该字段的输入框。已填字段保留,未填字段不显示
- **同一种联系方式有多个号码**:用 `/` 分隔放在同一字段里(如 `phone: "138.../139..."`)。将来真有需要给每个号码打备注的场景,再迁移到 ContactMethod 子表
- **软删而非硬删**:离职/失联/暂停往来都走 `status = ARCHIVED`,从默认视图隐藏但保留历史。物理删除仅在"录错想撤销"时提供
- **职位字段为自由文本且可空**:不用枚举,适配小作坊职责不清的实际情况
- **维护入口**:不分前台/后台,直接在供应商详情页内行内编辑联系人
- **不设联系人级备注字段**:此类零碎信息变动频繁、录入维护成本高,Admin 心里有数即可,不进入数据持久层

---


### Quote 表(报价记录)

每条 Quote 是"某供应商在某个时间点针对某产品给出的一份报价快照"。系统的比价能力基于此表。

**字段定义:**

```
Quote(报价记录)
├── id                                       Int        主键,自增
├── supplier_id                              Int        外键 → Supplier,必填
├── contact_id                               Int?       外键 → Contact,可空(口报可能没具体人)
│
├── # 产品信息(直接落字段,不引用 Product 表)
├── product_name_zh                          String     产品名/产品描述(中文),必填
├── product_name_ru                          String?    产品名(俄文,可自动翻译)
├── product_spec_zh                          String?    规格描述(中文,自由文本)
├── product_spec_ru                          String?    规格(俄文,可自动翻译)
│
├── # 价格信息(比价核心)
├── unit_price                               Decimal    单价,必填
├── currency                                 Enum       Currency,默认 CNY
├── unit_zh                                  String?    单位(中文,UI 自动补全)
├── unit_ru                                  String?    单位(俄文,UI 自动补全)
├── moq                                      Int?       起订量(Minimum Order Quantity)
│
├── # 报价上下文
├── quoted_at                                Date       报价日期,必填
├── valid_until                              Date?      报价有效期
├── payment_terms                            String?    付款条件(强制英文录入,详见设计决策)
├── lead_time_days                           Int?       交货天数
├── source                                   String?    报价来源(中文自由文本,UI 翻译按钮)
├── quote_batch_id                           String?    报价批次号(预留扩展口)
│
├── # 状态
├── status                                   Enum       QuoteStatus,默认 ACTIVE
│
├── # 自动翻译标记
├── product_name_ru_auto_translated          Boolean    默认 true
├── product_spec_ru_auto_translated          Boolean    默认 true
│
└── # 元数据
    ├── created_at                           DateTime   创建时间(自动)
    ├── updated_at                           DateTime   更新时间(自动)
    └── created_by_id                        Int        外键 → User
```

**枚举 Currency:**

```
CNY   人民币
USD   美元
RUB   俄罗斯卢布
EUR   欧元
```

**枚举 QuoteStatus:**

```
ACTIVE     有效(默认,出现在比价视图中)
ARCHIVED   已归档(主动作废:供应商撤回、合作终止、价格已变)
```

**关联到其他表:**

- Quote → Supplier : 多对一(必填)
- Quote → Contact : 多对一(可空)
- Quote → User(created_by) : 多对一
- Quote ↔ Tag : 多对多(通过 QuoteTag 中间表,Tag 限定 category=PRODUCT)
- Quote → File : 一对多(`type=QUOTE_IMAGE` 类型,挂载报价图/产品照)

**重要设计决策:**

- **不建 Product 表**:产品品类靠 Quote ↔ Tag 多对多解决(关联 PRODUCT 类型 Tag),具体产品描述以 `product_name_zh` 和 `product_spec_zh` 自由文本承载。比价靠"按 Tag 聚合 + 全文搜索 + 缩略图肉眼判断"。等业务出现"SKU 级精确比价"或"品类挂图说明"的需求时,再引入 Product 表
- **单项录入为主,扩展口预留**:第一版只做单项录入(一条 Quote 一个产品),`quote_batch_id` 字段保留备用。未来一张报价单录入多个产品时,生成同一批次号关联,无需改表结构
- **状态字段两档,过期实时算**:`status` 只区分 ACTIVE / ARCHIVED,管理员手动维护;"过期"不存进 status,运行时按 `valid_until` 字段实时判断。比价视图默认条件:`status = 'ACTIVE' AND (valid_until IS NULL OR valid_until > today)`
- **比价的核心结构**:三件套——产品名字段全文索引(模糊搜索)、File 表中 `type=QUOTE_IMAGE` 的缩略图(肉眼判断同款)、按 Tag 聚合的比价视图(查询页)
- **货币用枚举,单位用受控双字段**:货币种类有限且需要按种类归一化比价(将来可加汇率表);单位虽词汇集中但允许扩展(特殊单位手填),用"双字段 + UI 自动补全"模式
- **`unit` 字段双字段无 `_auto_translated` 标记**(2026.5.19 字段升级):`unit_zh` + `unit_ru` 双字段,UI 层维护一份"常见单位词表"(件/шт、个/шт、箱/коробка、打/дюжина、米/м、千克/кг 等)提供下拉自动补全;选下拉自动填中俄两份,特殊单位 Admin 手动填两份。无需 AI 翻译——单位词汇短小固定,机翻不可靠也不必要,Admin 录入即定
- **`payment_terms` 强制英文录入约定**(2026.5.19 双语审计结论):必须用英文 + 国际贸易标准术语(EXW / FOB / CIF / T/T / L/C / 30% downpayment / Net 30 等)。理由:中俄双方都能直读,无需翻译,避免双语三件套的存储和维护开销。即使非标准化条件(如 "50 sample units first, full payment against B/L copy")也必须用英文表达,不允许中文录入。UI 录入表单可在 placeholder / 字段说明里给出术语示例提醒
- **`source` 字段保持单语 + UI 翻译按钮**(2026.5.19 双语审计结论):Admin 用中文录入(如"微信语音 5.10"、"展会摊位现场"),Viewer 视角下提供「翻译这一项」小按钮按需翻译,翻译结果不入库。理由:source 是录入溯源的辅助元数据,Viewer 看不看都不影响比价决策,不值得为它开双语三件套
- **不设报价级备注字段**:与 Contact 表一致,避免低频字段。关键补充信息通过 `payment_terms` / `source` 字段承载

---


### QuoteTag 表(报价-标签关联)

Quote 与 Tag 的多对多关系通过此中间表实现。Tag 限定为 `category = PRODUCT` 类型(产品品类标签)。

```
QuoteTag(报价-标签关联)
├── quote_id     Int        外键 → Quote
├── tag_id       Int        外键 → Tag(category=PRODUCT)
├── created_at   DateTime   关联创建时间
└── (复合主键: quote_id + tag_id)
```

由 Prisma 自动管理。业务层添加 Tag 时校验 `tag.category === 'PRODUCT'`,防止误关联其他类型标签。

---

### Note 表(沟通记录)

Note 记录"关于供应商的事件流"——具体的沟通(电话、微信、邮件、面谈)+ Admin 的内部观察备忘。它是供应商"软档案"的载体,与 Quote(报价)和 Transaction(交易)在供应商时间线上并列展示。

**字段定义:**

```
Note(沟通记录)
├── id                       Int        主键,自增
├── supplier_id              Int        外键 → Supplier,必填
├── contact_id               Int?       外键 → Contact,可空
├── quote_id                 Int?       外键 → Quote,可空(关联具体报价的后续讨论)
│
├── # 内容
├── content_zh               Text       记录正文(中文,必填,自由文本)
├── content_ru               Text?      俄文版本(可空)
│
├── # 时间
├── happened_at              Date       事件实际发生时间(必填,默认今天)
│
├── # 状态
├── is_active                Boolean    软删除标记,默认 true
│
└── # 元数据
    ├── created_at           DateTime   系统录入时间(自动)
    ├── updated_at           DateTime   更新时间(自动)
    └── created_by_id        Int        外键 → User
```

**关联到其他表:**

- Note → Supplier : 多对一(必填)
- Note → Contact : 多对一(可空)
- Note → Quote : 多对一(可空,关联具体报价)
- Note → User(created_by) : 多对一

**重要设计决策:**

- **双时间字段:`happened_at` 与 `created_at` 分离**:前者是事件实际发生的时间(管理员录入时可填过去日期,补录历史不影响时间轴),后者是系统记录时间(自动生成不可改)。时间线视图按 `happened_at` 排序
- **范围:沟通 + 内部观察备忘**:不限制 Note 的内容形态,真实沟通(电话/微信/面谈)、Admin 的判断、备忘都进同一张表。"想到什么记什么"是设计意图
- **不分 type、不做重要标记、不做附件**:第一版保持最小集。附件(微信截图、录音、合同照片)等阶段 5 File 表上线后通过通用文件系统接入
- **`content_ru` 字段走 AI 翻译入库模式**(2026.6.9 阶段 4.5 1d.3 修订,与 Supplier 模式统一):Admin 录入 `content_zh` 必填,点"自动翻译俄文"按钮 → AI 翻译填 `content_ru` → 数据库一并存。Admin 手改 `content_ru` → `content_ru_auto_translated` flag 翻 false(锁定),后续重翻不覆盖。Note 表新增 `contentRuAutoTranslated Boolean @default(true)` 字段以支持锁定语义(本里程碑通过 prisma migrate 加入)。**为什么从初版"按需翻译不入库"改成"翻译入库"**:实际推进发现 Note 是写一次少改的事件记录,不像 Supplier 备注那种反复修改的字段,单次 AI 翻译入库划算;且 4 实体翻译模式统一后代码复用度高,无需为 Note 单独写"实时翻译按钮"组件
- **`quote_id` 是轻接触关联**:绝大多数 Note 不关联具体 Quote(留空);仅当 Note 明确是某次报价的后续讨论(对方还价、撤回、答应给样等)时关联。UI 录入入口默认不关联,有"+ 关联到报价"小按钮主动触发
- **删除策略用 `is_active: Boolean`**:Note 只有"误录想撤销"一种删除场景,无"归档"业务语义,Boolean 够用,与 Supplier 表一致

---

### Transaction 表(订单)

Transaction 记录"真实成交"——订单已下、款已开始付的实际交易。与 Quote(报价)和 Note(沟通)在供应商时间线上并列展示,是供应商关系最"硬"的数据(金额、时间、量都已确定)。

**字段定义:**

```
Transaction(订单)
├── id                            Int        主键,自增
├── supplier_id                   Int        外键 → Supplier,必填
├── contact_id                    Int?       外键 → Contact,可空(经手联系人)
│
├── # 订单基本信息
├── ordered_at                    Date       下单日期,必填
├── total_amount                  Decimal    订单总额(管理员录入,与单据一致)
├── currency                      Enum       Currency,一笔订单统一一个币种
│
├── # 描述
├── notes_zh                      Text?      订单备注(中文,自由文本)
├── notes_ru                      Text?      订单备注(俄文,可自动翻译)
│
├── # 状态
├── status                        Enum       TransactionStatus,默认 IN_PROGRESS
├── is_active                     Boolean    软删除标记,默认 true
│
├── # 自动翻译标记
├── notes_ru_auto_translated      Boolean    默认 true
│
└── # 元数据
    ├── created_at                DateTime   自动
    ├── updated_at                DateTime   自动
    └── created_by_id             Int        外键 → User
```

**枚举 TransactionStatus(极简三档):**

```
IN_PROGRESS   进行中(已下单但未完结,涵盖生产/发货/付款全过程)
COMPLETED     已完结(到货 + 全款已结)
CANCELLED     已取消(订单作废)
```

**关联到其他表:**

- Transaction → Supplier : 多对一(必填)
- Transaction → Contact : 多对一(可空)
- Transaction → User(created_by) : 多对一
- Transaction → TransactionItem : 一对多
- Transaction → Payment : 一对多

**重要设计决策:**

- **主从模型 vs Quote 的扁平模型不对称是有意为之**:Quote 用扁平 + `quote_batch_id` 软关联(因为多产品报价是偶发场景),Transaction 用主从模型(因为多产品订单是常态)。两张表设计不对称,因为业务现实就不对称,设计应贴合现实
- **TransactionItem 不引用 Product 表**:产品信息(name/spec)直接落字段,与 Quote 表一致;不建 Product 表的整体策略延续
- **所有数值字段都是"录入即存储",系统不计算、不校验**:`subtotal`、`total_amount` 等按订单单据原值录入。订单上写啥就是啥(允许打包折扣、整数约定、特殊处理等真实业务情形),系统不强制 `SUM(subtotal) = total_amount`,不强制 `subtotal = quantity × unit_price`。UI 阶段可加"快速填充"按钮作为录入便利,但数据模型层面所有字段都是录入字段
- **不设物流字段**:中俄跨境采购中物流是货代的独立业务,与工厂订单(Transaction)是两条线索;`expected_delivery_date` / `actual_delivery_date` / `delivery_address` 等字段不放在 Transaction 表
- **不设自定义订单号 `order_no`**:用系统主键 `id` 即可,需要外部沟通时格式化显示(如 `#20260515-1`)
- **`notes_zh` 是订单属性级备注,与 Note 表职责不同**:Note 表是"与供应商互动的事件流"(跨越多个事件,时间维度强);Transaction.notes_zh 是"这张订单本身的属性"(含税/运费/特殊约定,紧绑订单)。两者不重复,按 Supplier.description 的双语三件套处理
- **删除策略用 `is_active: Boolean`**:与 Supplier / Note 一致,只有"误录想撤销"一种删除场景

---

### TransactionItem 表(订单明细)

```
TransactionItem(订单明细)
├── id                                       Int      主键,自增
├── transaction_id                           Int      外键 → Transaction,必填
├── quote_id                                 Int?     可选关联到具体 Quote(业务链条上下文)
│
├── # 产品信息(直接落字段,不引用 Product 表)
├── product_name_zh                          String   产品名(中文),必填
├── product_name_ru                          String?  产品名(俄文,可自动翻译)
├── product_spec_zh                          String?  规格(中文)
├── product_spec_ru                          String?  规格(俄文,可自动翻译)
│
├── # 数量与单价(全部录入字段)
├── quantity                                 Int      数量(录入)
├── unit_zh                                  String?  单位(中文,UI 自动补全)
├── unit_ru                                  String?  单位(俄文,UI 自动补全)
├── unit_price                               Decimal  单价(录入)
├── subtotal                                 Decimal  小计(录入,与单据一致)
│
├── # 排序
├── sort_order                               Int      明细行显示顺序,默认 0
│
├── # 自动翻译标记
├── product_name_ru_auto_translated          Boolean  默认 true
├── product_spec_ru_auto_translated          Boolean  默认 true
│
└── # 元数据
    └── created_at                           DateTime 自动
```

**重要设计决策:**

- **`quote_id` 在 TransactionItem 层级而非 Transaction 主表**:多产品订单可能跨多个 Quote(同一笔订单买的 3 种产品来自 3 个不同 Quote),把 `quote_id` 放在明细层级才能精确还原业务链条
- **`quote_id` 是"业务链条上下文",不影响数据**:关联 Quote 仅为追溯成交是从哪个报价谈来的,**价格永远以 TransactionItem 自身的 `unit_price` 为准**,不读 Quote。允许成交价跟 Quote 不一致(谈判常态)
- **UI 下拉的复合识别信息**:录入 TransactionItem 时关联 Quote 的下拉框,默认按"日期 + 产品名 + 规格 + 价格 + 联系人"复合展示,管理员秒识别。下拉数据已被系统按 supplier_id 和 `status=ACTIVE` 过滤
- **`unit` 字段与 Quote 表同策略**(2026.5.19 字段升级):`unit_zh` + `unit_ru` 双字段,UI 自动补全,无 `_auto_translated` 标记。详见 Quote 表的相应设计决策

---

### Payment 表(付款流水)

每笔 Transaction 的付款由一条或多条 Payment 记录承载(定金 / 中款 / 尾款分多次)。

```
Payment(付款流水)
├── id                       Int        主键,自增
├── transaction_id           Int        外键 → Transaction,必填
│
├── # 付款信息
├── paid_at                  Date       付款日期,必填
├── amount                   Decimal    付款金额,必填
├── currency                 Enum       Currency,默认与订单一致
├── method                   String?    付款方式(自由文本:微信/对公转账/现金/支付宝)
├── purpose_zh               String?    用途(自由文本:定金/中款/尾款)
├── purpose_ru               String?    用途(俄文,可自动翻译)
├── purpose_ru_auto_translated      Boolean    默认 true
│
└── # 元数据
    ├── created_at           DateTime   自动
    └── created_by_id        Int        外键 → User
```

**重要设计决策:**

- **每次付款一条记录**:支持"定金 30% + 中款 30% + 尾款 40%"等多次付款场景。一笔 Transaction 多次付款是常态,子表自然处理
- **`method` 和 `purpose_zh` 用自由文本**:付款方式和用途的表达千变万化("微信群里说的"、"老李代付"、"补差价"),枚举不灵活;自由文本最贴合实际
- **`method` 字段保持单语 + UI 翻译按钮**(2026.5.19 双语审计结论):Admin 用中文录入(如"微信"、"对公转账"、"老李代付"),Viewer 视角下按需翻译。理由:付款方式是已完成动作的描述,主要给 Admin 自己记账用,Viewer 看了也不需要做决策。注意此条针对 `method` 字段;`purpose_zh` 字段已升级为双语三件套(见上面字段定义)

---

### File 表(文件)

File 是系统的统一文件载体,服务所有业务实体的文件附件——供应商 Logo / 画册 / 视频 / 资质文档、报价图、付款截图、沟通附件、订单单据等。

**字段定义:**

```
File(文件)
├── id                                  Int        主键,自增
│
├── # 业务挂载点(每条记录至多 1 个外键非空)
├── supplier_id                         Int?       外键 → Supplier(可空)
├── quote_id                            Int?       外键 → Quote(可空)
├── payment_id                          Int?       外键 → Payment(可空)
├── note_id                             Int?       外键 → Note(可空,阶段 5 启用)
├── transaction_id                      Int?       外键 → Transaction(可空,阶段 5 启用)
├── type                                Enum       FileType,必填
│
├── # 文件本体
├── file_name                           String     原始文件名,必填
├── storage_key                         String     存储 key(相对路径或对象 key),必填
├── mime_type                           String     MIME 类型,必填
├── size_bytes                          Int        文件大小(字节),必填
├── thumbnail_key                       String?    缩略图 storage_key(图片/视频)
│
├── # 显示标题(全可空,UI 按 type 决定显示规则)
├── title_zh                            String?    中文标题
├── title_ru                            String?    俄文标题
├── title_ru_auto_translated            Boolean    默认 true
│
├── # 排序与封面(仅部分 type 使用,UI 按需暴露)
├── sort_order                          Int        显示顺序,默认 0
├── is_cover                            Boolean    是否封面/主图,默认 false
│
├── # 状态
├── is_active                           Boolean    软删除标记,默认 true
│
└── # 元数据
    ├── created_at                      DateTime   创建时间(自动)
    ├── updated_at                      DateTime   更新时间(自动)
    └── created_by_id                   Int        创建人(外键 → User)
```

**枚举 FileType:**

```
SUPPLIER_LOGO          供应商 Logo(挂在 supplier_id,每个 supplier 至多 1 个)
SUPPLIER_BROCHURE      供应商画册 / 产品目录(挂在 supplier_id)
SUPPLIER_VIDEO         供应商工厂视频 / 产线展示(挂在 supplier_id)
SUPPLIER_DOC           供应商资质 / 营业执照 / 其他文档(挂在 supplier_id)
QUOTE_IMAGE            报价图 / 产品照(挂在 quote_id,有 sort_order + is_cover)
PAYMENT_SCREENSHOT     付款截图(挂在 payment_id)
NOTE_ATTACHMENT        沟通记录附件(挂在 note_id,阶段 5 启用)
TRANSACTION_DOC        订单单据 / 合同 / 发票 / 装箱单(挂在 transaction_id,阶段 5 启用)
OTHER                  其他(兜底)
```

**关联到其他表:**

- File → Supplier : 多对一(可空)
- File → Quote : 多对一(可空)
- File → Payment : 多对一(可空)
- File → Note : 多对一(可空,阶段 5 启用)
- File → Transaction : 多对一(可空,阶段 5 启用)
- File → User(created_by) : 多对一

**UI 层 title 显示规则(数据库字段统一,UI 差异化处理):**

| type | UI 显示 title 输入框 | title 显示时来源 |
|------|--------------------|----------------|
| `SUPPLIER_LOGO` | ❌ 不显示 | fallback 到 `Supplier.name_zh / name_ru` |
| `SUPPLIER_BROCHURE` | ✅ 推荐填 | `title_zh / title_ru` |
| `SUPPLIER_VIDEO` | ✅ 可选 | `title_zh` 优先,否则 `file_name` |
| `SUPPLIER_DOC` | ✅ 推荐填 | `title_zh / title_ru` |
| `QUOTE_IMAGE` | ✅ 可选 | `title_zh` 优先,否则 `file_name` |
| `PAYMENT_SCREENSHOT` | ❌ 不显示 | fallback 到 `Payment.purpose_zh / purpose_ru` |
| `NOTE_ATTACHMENT` | ✅ 可选 | `title_zh` 优先,否则 `file_name` |
| `TRANSACTION_DOC` | ✅ 可选 | `title_zh` 优先,否则固定文案"交易凭证 / Транзакционный документ" |
| `OTHER` | ✅ 可选 | `title_zh` 优先,否则 `file_name` |

**重要设计决策:**

- **挂载点用"多个 nullable 外键"方案**:File 表上为每个业务表准备一个 nullable FK(`supplier_id` / `quote_id` / `payment_id` / `note_id` / `transaction_id`),每条 File 记录至多 1 个外键非空,由应用层保证。相比多态关联(`owner_type + owner_id`)的优势是**真正的数据库外键约束 + Prisma 关系类型安全**;相比中间表方案的优势是"一份文件挂多处"的需求不明显,不为不需要的能力付出表数量翻倍的代价
- **`type` 字段是业务用途分类,与 MIME 类型不重叠**:`mime_type` 描述"这是 PDF / 图片 / 视频"(技术维度),`type` 描述"这是画册 / Logo / 报价图"(业务维度)。UI 层根据 type 决定布局(Logo 当头像、画册当画廊、视频用播放器、文档用列表)
- **`title` 三件套全可空,UI 按 type 决定显示规则**:数据库结构统一(所有 File 都有 `title_zh / title_ru / title_ru_auto_translated`),UI 层差异化处理(部分 type 不显示输入框,部分 type 推荐填,部分 type 留空时 fallback 到关联表字段)。与 Contact 表"按需添加联系方式"、`is_cover` 字段的"按 type 暴露"风格一致——**数据库一致,UI 差异化**是本项目反复出现的设计哲学
- **`storage_key` 而非 `path`**:字段名抽象,与存储后端解耦。本地存储下 `storage_key` = 相对于 `./storage` 根目录的相对路径(如 `suppliers/1/brochures/xxx.pdf`),OSS 存储下 `storage_key` = 对象 key。业务代码统一通过存储抽象层 `storage.url(file.storage_key)` 拿可访问 URL,底层切换零感知。**永不存绝对路径**,避免环境耦合
- **`sort_order` + `is_cover` 统一放在 File 表**:虽然只有 `QUOTE_IMAGE` 等少数 type 真正用到,字段本身的存储代价极低(几个字节),换来代码层面无差异处理,远比"为部分 type 单独开子表"经济
- **应用层保证两个 invariant**:① 每个 supplier 至多 1 个 `SUPPLIER_LOGO` ② 每个 quote 至多 1 个 `is_cover=true` 的 `QUOTE_IMAGE`。两者在 Prisma 事务里处理——写新 LOGO/封面前,先把同一关联下其他记录的对应字段清掉,与 `Contact.is_primary` 同模式
- **删除策略用 `is_active: Boolean`**:与 Supplier / Note / Transaction 一致,只有"误录想撤销"一种删除场景。物理删除文件本体的时机另议(阶段 5 上线 OSS 后才有意义)
- **三处临时设计一次性删除**:同步删除 `Supplier.logo_path` 字段、`Payment.screenshot_path` 字段、`QuoteImage` 整张表。当前项目 0 数据,改 schema 零成本

---
### User 表(用户)

User 是系统的登录身份载体,被所有业务表的 `created_by_id` 引用,记录"是谁录入了这条数据"。本系统用户规模为 1 Admin + 若干 Viewer(3-5 人量级),设计上极简。

**字段定义:**

```
User(用户)— 与 better-auth 集成,部分字段由 better-auth 强制要求
├── id                       String     主键,cuid 自动生成(better-auth 要求,不是 Int)
├── username                 String     登录名,unique,必填(better-auth username 插件)
├── role                     Enum       Role,默认 VIEWER
├── locale                   Enum?      Locale,可空(better-auth 不强制有默认)
├── is_active                Boolean    是否启用(软删除),默认 true
├── email                    String     邮箱,unique,必填(better-auth 标配)
├── email_verified           Boolean    邮箱验证标志,默认 false(better-auth 标配)
├── name                     String?    显示名(better-auth)
├── image                    String?    头像 URL(better-auth)
├── display_username         String?    显示用户名(better-auth username 插件)
│
└── # 元数据
    ├── created_at           DateTime   创建时间(自动)
    └── updated_at           DateTime   更新时间(自动)

# 关联表(better-auth 自动管理,业务代码无需关心):
# - Session(登录会话)
# - Account(第三方登录凭据 + password 哈希)
# - Verification(邮箱验证 token)

# 密码不在 User 表,由 better-auth 存到 Account.password,业务代码读不到
```

**枚举 Role:**

```
ADMIN     管理员(青格力,1 人,负责数据采集和维护)
VIEWER    阅览者(海外家人,纯只读权限)
```

**枚举 Locale:**

```
ZH    中文
RU    俄文
```

**关联到其他表(User 作为被引用方):**

- User → Supplier(created_by_id) : 一对多
- User → Tag(created_by_id) : 一对多
- User → Contact(created_by_id) : 一对多
- User → Quote(created_by_id) : 一对多
- User → Note(created_by_id) : 一对多
- User → Transaction(created_by_id) : 一对多
- User → Payment(created_by_id) : 一对多
- User → File(created_by_id) : 一对多

**重要设计决策:**

- **极简主义,只保留必需字段**:登录必需(`username` / `password_hash` / `role`)+ 功能必需(`locale` / `is_active`)+ 元数据。不设头像、时区、邮箱、电话、双语显示名等"看似有用"的字段——本系统用户规模 3-5 人,Admin 直接分发账号,这些字段会长期闲置。需要时再加,一个字段而已
- **`password_hash` 而非 `password`**:字段名明示存储的是哈希值,杜绝明文密码意外入库的可能。具体哈希算法(bcrypt / argon2 等)在阶段 2 接入认证库时决定
- **不设双语显示名**:与其他业务表的双语策略不对称是有意为之。用户规模小、相互识别成本低,username 用英文/拼音(如 `qingger` / `katya`)即可承担显示名职责。供应商详情页显示「由 katya 创建」虽然朴素但完全够用
- **`username` 约定为英文/拼音**:不强制数据库层正则约束(SQLite 支持有限),应用层在创建账号的表单校验。理由:登录名是 Latin 字符是行业标准,且与文件路径、URL 等兼容性好
- **没有 `created_by_id`**:账号是 Admin 在 Prisma Studio / 数据库层直接创建的运维行为,不存在业务级"谁创建了谁"的关系,因此不设此字段。这是 User 表与所有业务表的结构区别
- **`role` 落字段而非依赖 Auth.js 角色机制**:枚举字段是数据源,任何业务代码都能查询和判断;阶段 2 引入 Auth.js 时,它只是把 role 包装进 session/JWT,不改变数据本身。两者是分层关系而非互斥关系
- **`Locale` 枚举跨表共用**:本枚举只在 User 表使用,但命名为系统级 `Locale`(而非 `UserLocale`),为将来其他需要语言标记的字段(如 Supplier 的内部备注语言)预留复用空间
- **schema 设计属于阶段 1,认证流程接入是阶段 2**:本表此刻落地是为了让所有业务表的 `created_by_id` 外键有挂靠目标,Prisma migrate 能跑通;真正的登录页面、密码校验、session 管理在阶段 2 引入 Auth.js 时再做
- **删除策略用 `is_active: Boolean`**:停用账号(亲戚不再使用 / 怀疑泄露 / 临时禁用)走 `is_active = false`,数据保留以维护历史 `created_by_id` 外键的完整性。物理删除仅在"录错想撤销"时考虑

---

---

## 2026.6.15(后)项目进度日志(数据备份策略落地)

### 当前阶段:本地部署期的数据安全兜底

阶段 6 收工后,意识到笔记本本地跑数据有丢失风险。在不上云的前提下加了一层自动备份兜底,30 分钟设置完成。
### 关键架构决策

- **Payment id 稳定化**(核心难题):原本 update 走"先删后插",每次保存 Payment.id 都变,任何挂在它身上的截图都会因 Cascade FK 变成孤儿。改成 3-way diff:
  - **DELETE**:DB 里存在但提交里没保留的 id → 物理删除(级联清掉截图,符合"删付款连带删凭证"的直觉)
  - **UPDATE**:提交里带 id 且 DB 里有 → 原地更新数据,id 保留,截图不动
  - **CREATE**:提交里 id=null 的新行 → 插入新记录,createdById 设为当前用户
  - Items 维持先删后插不动(无外部 FK 引用 Item,无副作用)
- **redirect 目标改成同一编辑页**:Update 完成后回到 edit URL 而非 supplier detail,让用户立即给新建的 Payment 上传截图。"保存后离开"workflow 多一次点击(走顶部 back link),换来"保存后管理截图"workflow 从不可能到 1 步。Notion / Linear 都是这种保存后不跳走的模式
- **截图区与表单区职责分离**:表单上面是「付款流水」编辑区(state-based,数据变更走主 save 提交);表单下面是「付款凭证」管理区(DB-coupled,文件上传走独立 API,即时生效)。两者并列、不互相影响,与 TRANSACTION_DOC 一致的"表单 + 附件并列"模式
- **结构类型注解避开 Prisma Decimal import 折腾**:`amount: { toString: () => string }` 替代 `amount: Decimal`,绕开 Prisma 7 generator 输出路径的不确定性(`@/generated/prisma/runtime/library` 不存在,`@prisma/client/runtime/library` 也可能因 generator 配置不可用)。TS 鸭子类型只要 shape 对得上就 ok
-  **简单 Copy-Item 而非 SQLite 在线备份**:单用户写入并发低,7 天滚动快照足够覆盖偶发不一致风险
- **DestinationRoot 参数化**:换云盘只改任务计划一个参数,不锁死 Google Drive
- **不进 git 任何敏感路径**:backup.ps1 自身只是脚本(进 git),备份产物(dev.db、storage/)永远不进 git

### 已完成

- ✅ `transaction-schema.ts`:`paymentSchema` 加 `id: number | null | undefined`(允许 3 种语义)
- ✅ `TransactionForm.tsx`:`PaymentRow` 类型加 `id`;`emptyPayment()` 返回 `id: null`;表单 JSX 无变化(id 通过 JSON.stringify 自动透传)
- ✅ `transaction-actions.ts`:`updateTransaction` 的 payments 处理重写为 3-way diff;`createTransaction` 保持原样(创建时所有 Payment 必新)
- ✅ `payment-screenshots-list.tsx`(新):单 Payment 名下的截图列表组件,沿用 NoteAttachmentList 同套路(image thumbnail + FileText 图标 + FileItemActions)
- ✅ `payment-screenshots-section.tsx`(新):server component,接收 payments[] with files,每条付款渲染一个独立卡片(摘要头 + FileUploader + 截图列表)
- ✅ `transaction/[transactionId]/edit/page.tsx`:Prisma 查询加 `payments.include.files` 子查询,FormPage 底部新增「付款凭证」DetailSection
- ✅ i18n:`files` 命名空间下补 5 个 key(paymentScreenshotsTitle / uploadPaymentScreenshot / paymentScreenshotAcceptHint / paymentScreenshotsEmpty / paymentsEmptyForScreenshots)
- ### 已完成

- ✅ `scripts/backup.ps1`:PowerShell 脚本,做 3 件事——复制 dev.db / robocopy 镜像 storage/ / 清理 7 天前旧快照
- ✅ Windows 任务计划 `QinggerDailyBackup`:每天 3:00 自动跑,笔记本睡眠时下次开机补跑
- ✅ Google Drive for Desktop 同步:本地快照写到 `G:\我的云端硬盘\supplier_management_backup\`,云盘自动传云
- ✅ CLAUDE.md 新增「数据备份策略」章节,记录全套方案、恢复流程、健康验证

### 待办

1. ~~付款截图管理~~ ✅
2. ~~阶段 2 认证 UI 收尾~~ ✅
3. **阶段 7 部署**:迁 PostgreSQL + OSS,清理"开发期 OK 但生产风险"的决策


### 下一轮对话开始时的入口

直接说:**「进阶段 7 部署」**

---

## 2026.6.14 项目进度日志(阶段 2 认证 UI 收尾)

### 当前阶段:把"开发期兜底"全部铲掉,让认证成为真正的硬约束

阶段 2 中期为了不阻塞业务开发,所有 server action 和 upload API 都内置了一段"session 拿不到就用 admin user id"的兜底逻辑(`DEV_FALLBACK_ADMIN_ID` 常量)。逻辑上等同于"任何人不登录也能往数据库写东西",在本地 Admin 一个人用的阶段无碍,但上云或多 Viewer 介入前必须铲掉。本里程碑把这层兜底全部移除,用 helper 统一收口。

### 关键架构决策

- **两套 helper 而非一套**:server action / RSC 用 `requireUserId()`(无 session 直接 `redirect('/login')`),API route 用 `getOptionalUserId()`(返回 null,调用方自己组 401)。**为什么不能合二为一**:`redirect()` 在 API route 里不工作 —— Next.js 的 redirect 是给页面/server action 路径的特殊错误机制,API 必须用 HTTP 状态码沟通。强行统一会让其中一边语义错位
- **helper 放在 `src/lib/auth.ts`,而非新文件**:auth 相关的所有公开 API 集中在一个模块,业务代码 `import { requireUserId } from '@/lib/auth'` 一行收尾。新文件反而增加心智负担
- **`requireUserId()` 调用方不能包 try/catch**:`redirect()` 走 NEXT_REDIRECT 特殊错误,被 try/catch 吞掉就跳不动。所有调用点都改成裸调用(不在 try 块内),与 Prisma 错误捕获 try/catch 分开放
- **middleware 已经守住未登录访问**:`requireUserId()` 在 server action 里真正命中的场景极少(中途 session 失效 / cookie 被清),但作为定义在数据写入边界的兜底,值得有

### 已完成

- ✅ `src/lib/auth.ts`:新增 `requireUserId()` + `getOptionalUserId()` 两套 helper,附完整注释说明 try/catch 禁忌
- ✅ `src/app/api/upload/route.ts`:`POST` 入口换用 `getOptionalUserId() → 401` 模式,删除 `DEV_FALLBACK_ADMIN_ID` 常量与 try/catch 兜底
- ✅ `src/app/suppliers/_actions/supplier-actions.ts`:`createSupplier` 用 `requireUserId()`,删除 try/catch 兜底与常量
- ✅ `src/app/suppliers/[id]/contacts/_actions/contact-actions.ts`:删 `getCurrentUserId` 本地 helper,直接 `requireUserId()`
- ✅ `src/app/suppliers/[id]/notes/_actions/note-actions.ts`:同上
- ✅ `src/app/suppliers/[id]/quotes/_actions/quote-actions.ts`:同上
- ✅ `src/app/suppliers/[id]/transactions/_actions/transaction-actions.ts`:删 `getUserId` 本地 helper,直接 `requireUserId()`
- ✅ 全仓库 `grep DEV_FALLBACK_ADMIN_ID` 返回 0 命中(除本文档自身的历史叙述)
- ✅ `tsc --noEmit` 在 7 个改动文件上无新增报错
- ✅ 顺手清掉 3 个 pre-existing TS 报错:
    - `scripts/verify-prisma.ts` / `scripts/test-constraints.ts`:User 创建时 `passwordHash` 字段已被 better-auth 接管(挪到 Account 表),从 prisma.user.create / upsert 里删掉,补上必填的 `email`。脚本只验 Prisma 通路与外键约束,不验登录流程,直接 prisma 写库够用——真要"能登录的账号"得走 better-auth signUp API
    - `src/app/map/MapPageClient.tsx`:本地 `type Supplier` 缺 `nameRu / cityRu / provinceRu` 三个可空字段,导致传给 `MapView` 时 shape 不匹配报 TS2769。补齐这三个字段,并在注释里点明"两处类型口径必须统一"

### 待办

1. ~~登录/登出全链路手工验证~~ ✅(2026.6.15 浏览器跑通)
2. ~~阶段 7 部署~~ ✅(下方"2026.6.15 阶段 7"日志)

---

## 2026.6.15 项目进度日志(阶段 7:本地 + tunnel 部署)

### 当前阶段:让海外家人能用,但不上云

俄罗斯家人(3 位 Viewer)要登录看供应商数据。完整上云的话(PostgreSQL + OSS + 服务器)成本大、迁移工作量大、当下 schema 还会变,不划算。选择**本地部署 + Cloudflare Tunnel 中间态**:服务跑在 Admin 笔记本上,tunnel 把它暴露到公网,家人通过域名访问。等 1-2 个月业务跑顺、schema 稳定再考虑真上云。

### 关键架构决策

- **域名注册商选 Cloudflare Registrar**:`qg-suppliermanagement.com`(¥80/年)。直接在 Cloudflare 买的好处是 NS 已经在 Cloudflare 名下,不需要去阿里云/腾讯云改解析(国内域名调 NS 指 Cloudflare 会失去备案,坑大)。前置条件:国际信用卡 / Visa / Mastercard,不支持支付宝
- **Tunnel 而非云服务器**:Cloudflare Tunnel 让家人**不用装 WARP/任何 VPN 客户端**,直接点链接就能访问。中俄跨境用 Cloudflare 边缘网络比 Tailscale 这种 VPN 性质方案稳定得多 —— 俄罗斯老人不可能教会装 VPN
- **Tunnel 用 Token 模式建,不走 `cloudflared tunnel login`**:经典 CLI login 需要从国内访问 `login.cloudflareaccess.org`,GFW 高频 RST 切连接拿不到 cert.pem。换成走 Zero Trust 控制台(`one.dash.cloudflare.com`)→ 复制 `cloudflared service install <TOKEN>` → 装成服务,完全绕过被墙的 login 域名
- **公网入口配置走 "Published application routes" 而不是 "Hostname routes (Beta)"**:Cloudflare 2025.9 改版后把"公网域名绑 tunnel"功能迁到了 Published application routes;Hostname routes (Beta) 是给装了 WARP 客户端的人用的私网路由 —— UI 上不仔细看会选错(我自己就连错了三次)
- **`trustedOrigins` 同时保留 localhost + 公网域名**:开发期我还要在本机跑 `npm run dev` / `npm run start` 测试,localhost 必须留;家人通过 tunnel 进来时 Origin 是公网域名,也得加。两个一起在数组里 better-auth 会都识别,加新 origin 不要删旧的
- **`auth-client` 不写死 baseURL,用相对路径**:`createAuthClient({ plugins: [...] })`,不传 baseURL = 默认走当前页面 origin。这是 tunnel 模式能跑通的关键 —— 服务真实跑在 localhost:3000,但浏览器看到的 origin 是公网域名,只有"相对路径"两边都对。写死 NEXT_PUBLIC_BETTER_AUTH_URL 就会出岔
- **NSSM 包 `npm run start` 成 Windows 服务,而不是任务计划程序**:服务的核心价值是**崩了自动重启** + **跟登录会话解耦**。任务计划程序只有"开机起一次",崩了不管;NSSM 是专门为"长跑后台服务"设计的。家人凌晨访问时 Next.js 内存泄漏崩了 → NSSM 立即拉起 → 家人完全感觉不到
- **Viewer 账号建立走 seed 脚本**(`scripts/seed-viewers.ts`)+ `hashPassword`(from `better-auth/crypto`),而不是 better-auth signUp API。理由:signUp API 需要服务跑着、调 HTTP、有 trustedOrigin 等一堆前置;直接写 DB 简单粗暴一次写完。账号信息和初始密码记在脚本顶部,以后家人换人也容易
- **改密码功能不强制首次必须改,只在用户菜单里加个入口**:非技术用户场景(俄罗斯老人)做"强制首次改密码"流程会让他们慌、关页、打电话。给个**自助入口**(/account/password)就够了,他们想改就改,不改也安全(只要 URL + 密码自己不外传)。技术上做 force 需要 1.5-2 小时,做 voluntary 30 分钟,体验差距巨大反向

### 关键坑(踩过的)

- **better-auth username 插件强制 lowercase lookup**:`node_modules/better-auth/dist/plugins/username/index.mjs` 里写死 `username.toLowerCase()`。所以 username 字段**必须存小写**(供查找),原始大小写存到 `displayUsername`(供显示)。我第一版 seed 把 `Aldar` 直接写进 username,登录时 better-auth 转 `aldar` 查不到,报"User not found"。修法:`username: v.username.toLowerCase()` + `displayUsername: v.username`
- **winget 装的工具,PATH 当场不刷新**:cloudflared 和 nssm 都踩了一遍。winget 装完会提示"重启 shell 以使用新值",**但实测重开 shell 都不一定生效**。最稳的兜底:找 exe 实际路径,用 `& "full\path\to\exe.exe" 命令` 直接调,跳过 PATH
- **System32 写入要管理员权限,但 Copy-Item 失败后 Write-Host 不会停**:错误地以为"复制到 System32 让全局可用"是简单方案,结果非管理员 PowerShell 跑 Copy 抛 Access denied,但脚本后续 `Write-Host "已复制"` 照常执行,造成"显示成功但实际失败"的假象。教训:**非管理员场景下不要依赖 System32**,要么提示用户开管理员,要么干脆用全路径调
- **Cloudflare 控制台 UI 改版多次,经典文档过时**:2025.9 把 Public Hostname tab 改名搬位,旧博客全失效。导航三次走错(Hostname routes Beta、CIDR routes、最后才是 Published application routes)。**遇到 Cloudflare 类问题,直接 WebSearch 最新文档,别凭印象指**
- **PowerShell `<>` 是重定向运算符,不是占位符**:给用户写命令模板时,**用 `< >` 包裹占位符会被 PowerShell 当语法错误**(`The '<' operator is reserved for future use.`)。教训:命令模板里占位符要用别的标识(例如反引号、或者直接说"把 xxx 替换为 yyy"),不要用尖括号

### 已完成

- ✅ 域名 `qg-suppliermanagement.com` 在 Cloudflare Registrar 买好
- ✅ `npm run build && npm run start` 生产模式本地跑通,核心 workflow 验过
- ✅ Cloudflare Tunnel `supplier-mgmt` 装成 Windows 服务,Token 模式,绕过被墙的 login 域名
- ✅ Published application routes 配 `qg-suppliermanagement.com → http://localhost:3000`,DNS 自动 CNAME 到 `<UUID>.cfargotunnel.com`,Cloudflare 自动签 HTTPS 证书
- ✅ `src/lib/auth.ts` 的 trustedOrigins 加 `https://qg-suppliermanagement.com`,保留 localhost
- ✅ `src/lib/auth-client.ts` 去掉 baseURL 硬编码,走当前页面 origin(相对路径)
- ✅ `scripts/seed-viewers.ts`:批量创建 Aldar / Artem / Yigil 三个 VIEWER 账号,密码 `<Name>2026` 模式,小写 username + 原始 displayUsername 双轨存储
- ✅ `scripts/reset-password.ts`:一次性密码重置工具(Admin 用,绕过审计,只在忘密码时用)
- ✅ `/account/password` 页面:登录用户自助改密(走 `authClient.changePassword`,中俄双语)
- ✅ `AppHeader` 用户菜单加「修改密码」入口(在退出之上)
- ✅ `messages/zh.json` + `messages/ru.json` 新增 `navbar.changePassword` + `changePassword.*` 完整 17 个 key 中俄对照
- ✅ NSSM 包 Next.js 为 Windows 服务 `QinggerSupplier`(Path: `D:\Node\node.exe`,Args: `node_modules\next\dist\bin\next start -p 3000`,Startup dir: `D:\supplier_management_system`),开机自启 + 崩了自动重启
- ✅ 跨网 4G 验证:手机关 wifi 访问 `https://qg-suppliermanagement.com`,登录 + 浏览 + 改密码均通

### 现状:本地部署 + 公网入口的稳态

- **服务架构**:Admin 笔记本本机跑 NSSM 包的 Next.js 服务(localhost:3000) + Cloudflare Tunnel 服务(cloudflared)→ Cloudflare 边缘 → `https://qg-suppliermanagement.com`
- **数据**:SQLite `dev.db` 在项目根目录;`storage/` 在项目根目录;每天凌晨 3 点备份脚本同步到 Google Drive
- **认证**:better-auth + 用户名密码;Admin 1 个 + Viewer 3 个;Viewer 只读
- **可用性约束**:**笔记本关机/睡眠 = 家人访问不了**。NSSM 让进程级故障自动恢复,但解决不了硬件不在线问题。这是本阶段刻意接受的折中,等真有 24/7 需求再上云

### 待办

1. **(可选)重启电脑验证 NSSM + cloudflared 都能自启动** —— 5 分钟成本,换长期安心
2. **真正阶段 7(上云)推迟到业务跑顺后再启动** —— 触发条件:schema 1 个月不再改 / 家人活跃度上升 / 或 Admin 出差需要 24/7 可访问。届时迁 PostgreSQL + OSS + 阿里云或腾讯云服务器,本地代码改动极小(adapter 层做了抽象)

---

## 2026.6.15(下午晚段)项目进度日志(权限模型重构 + 全 form i18n)

### 当前阶段:让家人可以编辑数据,且界面真正双语

家人刚拿到账号试用时,发现两个问题:

1. **VIEWER 角色实际不实用**:家人不光要看,也要能加自己的备注、新认识的联系人。但旧设计把他们锁成纯只读,矛盾
2. **edit 页只有顶部 backLabel + title 在俄文,form 主体全是中文**:刚上线 i18n 时只清了 page.tsx 顶部那批,form 组件内部硬编码没动 —— 家人看到一个俄文标题 + 几十个中文字段名,很跳戏

本里程碑这两件事同时推:角色模型重构(让 VIEWER 升级成 EDITOR,业务代码加 owner-only 检查)+ 5 个 form 全部 i18n。

### 关键架构决策

#### 权限模型

- **VIEWER 角色重命名为 EDITOR,语义重定义**:不再是"只读",而是"能新建任何东西、能改自己创建的、改不动别人的"。ADMIN(青格力)保持兜底,可以改所有人的数据。**为什么改名而不是新加角色**:原来的 VIEWER 含义已经过时,继续叫 VIEWER 但实际能写,会让代码读者困惑。改成 EDITOR 一目了然
- **不上独立的 Permission 表**:权限规则只有"是不是自己创建的"和"是不是 ADMIN"两条,放业务表上直接读 `record.createdById` 比拉一张 Permission 表查询便宜得多。代码层加 `isOwner(record, user)` 同步 helper 就够,200 行内搞定整套系统
- **`requireCurrentUser` vs `requireUserId` 分两个 helper**:requireUserId 只取 session 里的 id(便宜),requireCurrentUser 多查一次 User 表拿 role(贵一些但只有受权限保护的 action 才用)。两个分开,业务代码按需挑
- **server action 错误处理:update 类返回 errorState,archive/restore 类 throw Error**:update 类已经返回 FormState 了,自然加一个 error 分支;archive/restore 是 void 返回,改成返回 object 会破坏所有 caller,直接 throw 让 Next.js error boundary 接住更省事
- **File 操作的所有权用上传者(file.createdById),而不是关联实体的 owner**:你上传的文件你自己能管;别人的 quote 上挂的图片由上传者负责。**这套规则有个边角:setQuoteImageCover / moveQuoteImage 也走 file ownership**,意味着别人上传的图能影响别人的 quote 显示顺序,目前接受,真出问题再收紧
- **UI 层 hide,而不是 disable**:`canEdit=false` 时整个 ActionsCell return null,操作列直接空。原因:disable 加 tooltip "你不能改"会让非技术家人误以为系统坏了,直接隐藏更平静。代价是他们不知道"为什么我没按钮"——业务规则简单,口头说一句就够,不值得 UI 复杂化

#### 全 form i18n

- **i18n key 集中在 `forms.<entity>` 命名空间**:每个 form 一个子命名空间(forms.contact / forms.note / forms.quote / forms.supplier),共享的"保存 / 翻译中 / 已手改"等放 `forms.common`。**为什么不复用 contacts / quotes / notes 顶级命名空间**:那些是详情/列表用的 label(比如表头"姓名"),form 用的 label 可能更长更具体("中文姓名" / "俄文姓名"),复用容易冲突
- **module-level `FIELD_PAIRS` 常量改成组件内变量**:原来 const FIELD_PAIRS 写死中文 label,改 i18n 必须搬进 component body 才能用 `t()`。代价是每次 render 重建这个数组(7 个对象,可忽略不计);收益是 label 跟语言环境绑定,切语言立即生效
- **`已手改` 这个公用 badge 通过 prop 透传给 BilingualFieldRow**:原本写死在 SupplierForm 的子组件里,改 i18n 时不想让子组件也 import useTranslations(它不需要别的 t),所以让父组件取好字符串通过 prop 传进来。这是"组件内 i18n 化的最小侵入"模式
- **TransactionForm 早就用了 useTranslations**:第一波 4.5 阶段就接了 `transactions` 命名空间,这次只是核对 ru.json 翻译齐全。其他 4 个 form 之所以漏了,因为最早期写 i18n 还没规范化,新写的有规范了

### 关键坑(踩过的)

- **Prisma generate 不会自己跑**:schema enum 改 VIEWER → EDITOR 后,生成的 client 里 enum 还有旧值,业务代码读到 role='EDITOR' 类型不匹配。必须 `npx prisma generate` 强制重建 client。Prisma 7 不再自动跑 generate,这条踩坑成本最高
- **SQLite + Prisma enum 是"软约束"**:Prisma migrate dev 看到 enum 值变化,可能不会生成实际 DDL(因为 SQLite 不强约束 enum)。但 client 类型变了,业务代码读到旧 role='VIEWER' 行的字符串值 → 类型不在新 enum 里 → 运行时类型报错。**必须用脚本把存量 VIEWER 数据 UPDATE 成 EDITOR** 才能完整迁移。`scripts/migrate-role-viewer-to-editor.ts` 就是干这个的,用 $executeRaw 绕过 Prisma 类型检查直接改字符串值
- **沙箱挂载又 lag 了**:多次出现 `wc -l` / `cat` 看到的文件是几天前的旧版,Read 工具看的才是真实状态。判断标准:Modify 时间戳早于本次会话就是 stale。绕开方法:相信 Read,bash 验证只在最关键点用
- **NSSM 服务管理要管理员权限**:`nssm start/stop/restart` 都要管理员 PowerShell;`nssm install` 也是;**只有 `nssm version` / `nssm status` 可以非管理员**。这条限制是 Windows 服务管理的硬性规定,绕不过

### 已完成

#### Schema + 数据
- ✅ `prisma/schema.prisma`:enum Role 从 `ADMIN / VIEWER` 改成 `ADMIN / EDITOR`;User.role 默认值跟着改;附完整注释解释语义
- ✅ `scripts/migrate-role-viewer-to-editor.ts`(新):一次性数据迁移,$executeRaw 绕过类型检查 UPDATE 存量
- ✅ `scripts/seed-viewers.ts` + `scripts/seed.ts`:role 值改成 EDITOR,注释更新

#### 权限 helper
- ✅ `src/lib/auth.ts` 新增:
    - `CurrentUser` 类型:`{ id: string; role: 'ADMIN' | 'EDITOR' }`
    - `requireCurrentUser()`:取当前用户 + role,无 session 走 redirect
    - `isOwner(record, user)` 同步 helper:ADMIN || record.createdById === user.id

#### server action 接入(全部 update/archive/restore)
- ✅ `supplier-actions.ts`:updateSupplier 加权限检查,archive/restoreSupplier 各做 owner 检查 throw
- ✅ `contact-actions.ts`:updateContact 加权限检查,抽出 `assertContactOwnership` 给 archive/restore/setPrimary 共用
- ✅ `note-actions.ts`:updateNote + `assertNoteOwnership` 同模式
- ✅ `quote-actions.ts`:updateQuote + `assertQuoteOwnership`
- ✅ `transaction-actions.ts`:updateTransaction + `assertTransactionOwnership`
- ✅ `file-actions.ts`:抽出 `assertFileOwnership` 给 archiveFile / restoreFile / updateFileTitle / physicallyDeleteFile;`clearSupplierLogo` 走 supplier-level ownership

#### UI 显隐
- ✅ 5 个 ActionsCell 加 `canEdit?: boolean` prop,false 时 return null:
    - `SupplierActionsCell` / `ContactActionsCell` / `QuoteActionsCell` / `NoteActionsCell` / `TransactionActionsCell`
- ✅ 2 个消费方页面(`suppliers/page.tsx` 列表 + 4 个 List 组件)取 currentUser、逐行算 isOwner、把 canEdit 透传给 ActionsCell

#### Form i18n(5 个 form 全部)
- ✅ `messages/zh.json` + `messages/ru.json` 新增完整命名空间:
    - `forms.common`(5 keys 共用)
    - `forms.contact`(16 keys)
    - `forms.note`(13 keys)
    - `forms.quote`(28 keys)
    - `forms.supplier`(30 keys)
    - `formPage`(13 keys,顶部 backLabel + title 用)
    总计新增约 100+ key 中俄对照
- ✅ `ContactForm.tsx`:FIELD_PAIRS 移入组件;接 `useTranslations('forms.contact')` + `useTranslations('forms.common')`;所有硬编码替换
- ✅ `NoteForm.tsx`:同模式
- ✅ `QuoteForm.tsx`:同模式
- ✅ `SupplierForm.tsx`:同模式 + `BilingualFieldRow` 通过 prop 接收 `manualEditLockedLabel`(避免子组件也要 import useTranslations);删除 `COOPERATION_LEVEL_LABELS` 本地常量,改成读 `useTranslations('cooperationLevel')`
- ✅ `TransactionForm.tsx`:之前就已经 i18n 化(走 `transactions` 命名空间),本轮只是核对 ru.json 翻译齐全

#### 10 个 page.tsx 顶部 i18n(本轮第一波就做了)
- ✅ `suppliers/new` + `suppliers/[id]/edit`
- ✅ `contacts/new` + `contacts/[contactId]/edit`
- ✅ `notes/new` + `notes/[noteId]/edit`
- ✅ `quotes/new` + `quotes/[quoteId]/edit`
- ✅ `transactions/new` + `transactions/[transactionId]/edit`

### 现状:家人可以真正参与

- **角色**:Admin 1 个(青格力) + EDITOR 3 个(Aldar / Artem / Yigil)
- **权限**:Admin 看全部、改全部;EDITOR 看全部,改自己创建的
- **界面**:中俄双语完整覆盖到 form 字段级,家人切俄文不会再看到混编中文
- **服务自启动**:NSSM + cloudflared 都是 Windows 服务,开机自动起来,不需要任何手动操作

### 待办

1. **真让家人开始用** —— 系统对 Admin 来说能用了,但俄罗斯家人没真实测过中俄跨境的登录体验、改密码流程、看页面流畅度。建议发 URL 给一个家人先试
2. **备份策略 review**:多用户写入了,凌晨 3 点 Copy-Item dev.db 撞写入冲突的概率比单 Admin 时高。可能要升级到 SQLite online backup API
3. **重启电脑做一次完整自启动验证** —— 之前没真的关机重启过,虽然 Get-Service 看着两个服务都 Running

### 下一轮对话开始时的入口

直接说:**「家人开始用了」** / **「升级备份」** / **「重启验证」** / 或具体业务功能

---

## 2026.6.16 项目进度日志(列表/地图功能完整化 + 业务字段补全)

### 当前阶段:把"工具勉强能用"打磨成"工具好用"

家人开始用之前,系统其实只有"创建-查看-编辑"基础 CRUD,没有真正的"找东西"能力。一旦录入 50+ 家供应商,光靠肉眼翻列表是不行的。这一轮重点是**搜索 + 筛选 + 视觉信号**,以及补齐几个被遗忘的业务字段。

### 关键架构决策

#### 搜索的实现策略:URL 即状态,服务端过滤

- **URL query params 是单一状态源**(`?q=玩具&tags=1,5&level=STRATEGIC`),不在 React state 里复制一份。优点:浏览器后退 / 收藏 / 分享 URL 全自动好使,刷新页面状态不丢,可以从 `/suppliers?q=玩具` 直接改成 `/map?q=玩具` 跳到地图看同一筛选结果
- **服务端组件读 searchParams 构建 Prisma where**,客户端搜索框只做"防抖 + URL 更新",不做任何过滤逻辑。这套架构让"列表页"和"地图页"完全可以复用同一个 `SupplierSearchAndFilter` 客户端组件 + 同一套 where 逻辑(只是 select 字段不同)
- **关键词搜索跨 ~20 个字段**(含 Quote.productNameZh/Ru),这是"找做玩具熊的工厂"场景的核心 —— **不只搜 Supplier 自身字段,还搜 Quote 关联的产品名**。子查询 `quotes: { some: { productNameZh: { contains: q } } }` 让一条 SQL 完成跨表 OR
- **标签筛选支持双源命中**:供应商自己挂了 OR 旗下任何报价挂了,都算命中。`{ OR: [{ supplierTags: { some: { tagId } } }, { quotes: { some: { quoteTags: { some: { tagId } } } } }] }`。理由:用户语义是"找做玩具的工厂",报价挂了玩具标签同样说明这家做玩具
- **多标签 AND 而非 OR**:勾"玩具" + "EAC"想要的是同时有这俩特征的工厂,不是其中一个有就行。每个 tagId 一条 AND 子句,而不是放进一个 OR

#### 俄语搜索的天然边界(已知问题,不修)

子串 LIKE 搜索遇到斯拉夫语言的"格变化"会显得不直观:
- `игрушки`(主格)只命中主格写法的字段
- `игрушек`(属格)只命中属格写法
- 但 `игруш` 命中所有以 игруш 开头的形态(因为是前缀子串)

**实用解法是用户教学**:placeholder 直接写"使用词根,比如 игруш 而不是 игрушки"。技术解法(俄语 stemming)代价太大,投资回报率低。中文无此问题,因为中文没有形态变化。

#### 地图智能缩放:flyTo / flyToBounds

- **dotSize 4 档随 zoom 切换**(10/14/18/24 px),拉近自动放大,拉远自动收缩。click target 跟着大,小屏不再难点
- **筛选后自动适配镜头**:1 个结果 `flyTo` + zoom 12;多个结果 `flyToBounds` + maxZoom 11 + 60px padding;0 结果或没筛选时**不动镜头**(避免用户没操作时被强制 reset)
- **依赖 `idsKey` 而非 `suppliers` 数组**做 effect 依赖比对,避免引用变化导致不必要的重新定位

#### 移除"已手改"翻译锁(产品决策)

之前的设计:Admin 手改俄文 → flag 翻 false(锁定)→ 下次翻译跳过这个字段。意图是"保护人工修正不被 AI 覆盖"。**实际使用中反而麻烦** —— 用户改完后想重翻全部,得先逐个清锁。一致性体验高于保护性。

**最终行为**:每次点翻译按钮都翻译所有非空中文字段,覆盖现有俄文。schema 的 `xxxRuAutoTranslated` 字段保留(future-proof,以后想恢复机制不用迁移)但 UI 永远写 true,业务层不再读。

#### 'use server' 文件的导出规则(踩坑)

`tag-actions.ts` 里 export 了一个非函数常量 `INITIAL_STATE`(对象类型),`npm run dev` 容忍,`npm run build` 直接拒绝并整个文件不可用,所有引用这个文件的 action 都会运行时崩溃(包括无关的 createTag、updateTag)。

**规则**:`'use server'` 文件**只允许 export async function**。类型 export 可以(TS 擦除)。常量、类、普通函数都不能 export。

#### 地图的客户端 level state 改成 URL state

旧版地图右上图例点击维护 `selectedLevel` 客户端 state。**新版改成读 URL `?level=` 参数,点击图例 chip 用 `router.replace` 改 URL**。好处:跟列表页 / 搜索栏的 level 下拉**共享同一个状态源**,三处永远一致,不会出现"列表筛了 STRATEGIC,地图却显示全部"这种割裂。

### 已完成

#### 业务字段补全
- ✅ Supplier 加 `mainProductsZh / mainProductsRu / mainProductsRuAutoTranslated` 三件套字段(prisma migration `add_main_products_field`)
- ✅ 详情页"其他信息"区显示主营产品
- ✅ 地图弹窗显示主营产品
- ✅ SupplierForm 第 8 个双语对(multiline)
- ✅ Supplier 加 `TagMultiSelect`(覆盖所有 5 个 category:产品/出口/认证/生产/自定义),create/update server action 处理 tagIds 重置(先删后建事务)
- ✅ 供应商详情页头部显示 tag chips
- ✅ 地图弹窗显示 tag chips
- ✅ 列表行加 logo 缩略图(无 logo 显示首字母占位)
- ✅ 地图弹窗信息增强:logo / 主营产品 / 联系人/报价/订单计数 / 主联系人姓名 + 全部联系方式 / tag chips

#### 视频→视频/图片
- ✅ `SUPPLIER_VIDEO` 类型的 allowedMime 从 `^video\/` 扩展到 `^(video\/|image\/(png|jpeg|webp|gif))`
- ✅ SupplierVideoGallery 按 mimeType 区分:视频盖播放按钮,图片纯展示
- ✅ i18n 文案"视频" → "视频与图片"

#### 搜索 + 筛选(/suppliers + /map 双页面)
- ✅ `SupplierSearchAndFilter` 客户端组件:防抖 500ms 搜索 / 标签多选 chips / 合作深度下拉 / 一键清空
- ✅ `usePathname()` 让组件路径无关,两页面共用
- ✅ 服务端 Prisma where 跨字段 OR 搜索 + tag AND 筛选 + level 单选
- ✅ 0 命中提示
- ✅ 俄文 placeholder 提示用词根
- ✅ URL 状态完整(后退/收藏/分享均工作)

#### 地图智能化
- ✅ marker 大小 4 档随 zoom 切换(10/14/18/24 px)
- ✅ 单点结果 → `map.flyTo(...)` 0.8s 动画 + zoom 12
- ✅ 多点结果 → `map.flyToBounds(...)` 0.8s 动画 + maxZoom 11 + 60px padding
- ✅ 无筛选 / 0 结果 → 镜头不动
- ✅ 图例 chip 点击同步 URL(三处状态源统一)
- ✅ 图例 chip 顺手加 hover 高亮

#### 标签管理页(已在前一轮 /tags 完成,这轮顺手做了)
- ✅ 移除"系统预置标签不可改"约束(权限走 ownership 通用规则)
- ✅ 修了 `tag-actions.ts` 的 `'use server'` 不允许导出对象的崩溃 bug

#### "已手改"清退
- ✅ 5 个 form(Contact / Note / Quote / Supplier / Transaction)全部去掉 `Lock + 已手改` badge UI
- ✅ `handleRuChange` 不再翻 flag,`handleTranslate` 不再 filter 已锁字段
- ✅ Hint 文案改为"每次翻译都会覆盖现有俄文"
- ✅ schema 保留 `xxxRuAutoTranslated` 字段(向后兼容,UI 永远写 true)

#### 项目导览 HTML
- ✅ 新建 `项目导览.html` 单文件教学文档:8 章节,SVG 图,折叠面板,锚点导航
- ✅ 覆盖:心智模型 / 文件夹地图 / 数据模型 / 抽象层 / 请求生命周期 / 关键代码片段 / 部署架构 / 开发循环

#### 清理
- ✅ 删了 4 个过期一次性脚本(`migrate-role-viewer-to-editor` / `test-constraints` / `verify-prisma` / `backfill-translations`)
- ✅ 修正 `.env example` → `.env.example`(原本有空格,Next.js 不会加载)

### 现状:工具到达"日常顺手用"阶段

- **核心 workflow 全覆盖**:创建 / 编辑 / 搜索 / 筛选 / 地图浏览 / 标签管理 / 上传文件 / 翻译 / 多用户权限 / 备份
- **跨语言体验对等**:中俄双语切换无缝,所有 form / 详情 / 弹窗 / 提示都对应
- **服务自启动 + 自动恢复**:NSSM + cloudflared 守着,你关电脑不影响家人
- **搜索从 0 到 1**:能按产品 / 标签 / 地区 / 合作深度找供应商,而不是凭记忆翻列表

### 待办

1. **(选做)列表页视觉丰富化**:用户提过"现在表格有点乏味",讨论过 3 个方向(A 加标签列 / B 重排单元格 / C 双视图切换),暂未实施。等真感觉用着烦时再加
2. **CLAUDE.md 篇幅控制**:本文档已经 1100+ 行,继续往下涨。下一轮考虑把"已完成"老历史归档到 `CLAUDE.archive.md`,主文档只保留"决策 / 现状 / 待办"
3. **真让家人开始用**(继承上一轮):没真实测过中俄跨境登录体验、改密码流程,需要发 URL 让家人试一次
4. **重启电脑验证自启动**(继承上一轮)

### 下一轮对话开始时的入口

直接说:**「列表丰富化」** / **「家人开始用了」** / **「重启验证」** / 或具体业务功能

---

## 2026.6.16(晚段补丁)项目进度日志

### 上午到下午的大块改造交付后,实际用起来发现的几个粗糙点,集中扫一遍

#### 关键决策

- **翻译改双向(zh↔ru)**:开放编辑权限后,家人会先用俄文录入字段,需要反向翻译填中文。原来只有 `自动翻译俄文` 单向按钮,现在变成 `中→俄` 和 `俄→中` 两个独立按钮,各自只翻译"源语言非空"的字段,**完全显式不靠 AI 猜方向**。每个 server action(supplier / contact / note / quote / transaction / tag)加 `direction: 'zh-to-ru' | 'ru-to-zh'` 参数,默认 `zh-to-ru` 保持向后兼容
- **页面标题双语化**:6 个 page.tsx(supplier/contact 的 new + edit)标题里嵌的供应商/联系人名 改成 `pickLocalized(nameZh, nameRu, locale)`,俄文 locale 下显示俄文名。`SupplierActionsCell` / `ContactActionsCell` 归档确认弹窗同样改了,需要 consumer 多传一个 `nameRu` prop(`suppliers/page.tsx` / `ContactsList.tsx` 等)
- **DropdownMenu z-index 修正**:Leaflet 内部 pane 的 z-index 最高 700,shadcn 默认给 DropdownMenuContent 的 `z-50` 完全打不过。地图页的"加标签筛选"下拉直接被地图盖死。修法:`SupplierSearchAndFilter` 里 DropdownMenuContent 显式加 `className="z-[1001]"`。**通用规则:当组件可能渲染在 Leaflet 之上时,z-index 必须 ≥ 1000**

#### 已完成

- ✅ 5 个 form + TagDialog UI 双按钮:**ContactForm / NoteForm / QuoteForm / SupplierForm**(垂直两按钮)+ **TransactionForm**(`← 翻译` / `翻译 →` 贴在两个 label 旁)+ **TagDialog**(同 TransactionForm 风格)
- ✅ 6 个 server action 加 `direction` 参数
- ✅ `forms.common` 加 4 个 key:`translateZhToRu / translateRuToZh / noZhContent / noRuContent`
- ✅ 标题 pickLocalized 化 8 处(6 个 page + 2 个 ActionsCell)
- ✅ 配套 consumer 改 prop:`suppliers/page.tsx` / `suppliers/[id]/page.tsx` / `ContactsList.tsx` 给 ActionsCell 多传 nameRu
- ✅ `SupplierSearchAndFilter` 的 DropdownMenuContent 加 `z-[1001]`

#### 项目导览本轮**不更新**

这些都是已记录架构模式的应用(pickLocalized 已经在 i18n 章节讲过、双向翻译只是参数翻转、z-index 是 leaflet 边角细节)。导览第 6 章关键代码已经覆盖了所有需要"读懂才能改"的模式,加这些细节是噪音。

### 现状

跟下午相比唯一变化:

- 家人 RU 录入俄文 → 点反向翻译 → 中文自动填,体验对等
- 俄文 locale 下所有页面标题里嵌的公司/联系人名,会自动切到俄文显示
- 地图筛选下拉永远在地图之上

### 下一轮对话开始时的入口

跟上面一样,直接说想做的事即可。