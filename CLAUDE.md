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

## 2026.6.10 项目进度日志(阶段 5 里程碑 2a.0–2a.3 完成:存储抽象层 + LOGO 端到端)

### 当前阶段:阶段 5 第一片(SUPPLIER 资料文件)进行中,LOGO 跑通,BROCHURE / DOC 待做

### 里程碑范围

阶段 5 整体目标是"做一层存储抽象,让业务代码不知道文件是落在本地、OSS 还是 COS",路径与阶段 4 翻译抽象一致。本片(2a)聚焦供应商资料的三种文件类型——LOGO / BROCHURE / DOC,本轮把基础设施(2a.0–2a.2)+ 第一种 type 端到端(2a.3)做完。

### 关键架构决策

- **Route Handler 而非 Server Action**:大文件(画册 PDF 5-20MB、视频 50MB+)走 Next.js Server Action 默认 1MB body 限制扛不住,改走标准 `/api/upload` 多部分表单上传。Server Action 仍用于不涉及上传字节的小操作(如 clearSupplierLogo)
- **存储抽象层四件套** (`src/lib/storage/`):types.ts 定义 `StorageProvider` 接口(put/get/delete/exists 四方法),key.ts 提供 `keyFor()` / `thumbKeyFor()` 纯函数,local.ts 实现本地文件系统,index.ts 按 `STORAGE_DRIVER` 环境变量挑 provider 并导出单例。未来加 OSS 只需新 provider 文件 + index.ts 加一个 case
- **`keyFor(type, ownerId, filename)` 集中维护路径风格**:`{业务实体}/{ownerId}/{子分类}/{stamp}-{rand}-{safe-filename}`。改路径风格只改一个文件,业务调用方零感知
- **`sanitizeFilename` 文件名净化**:非字母数字下划线短横线全替换为 `_`,扩展名小写,截断 60 字符,防止"../"目录穿越和中文文件名跨平台不稳
- **`thumbKeyFor` 追加 `.thumb.webp` 而非替换扩展名**:`xxx.png` → `xxx.png.thumb.webp`,排错时一眼对得上原图,删原图也能查到孤儿缩略图
- **写入顺序:存储先 → DB 后**:存储成功 DB 失败时清理孤儿文件,失败模式比"DB 成功存储失败"产生的幽灵记录友好。每条 catch 路径都做反向清理
- **缩略图同步生成 + 失败容忍**:sharp 处理图片(300x300 inside resize + webp quality 80),缩略图失败只警告不阻断主流程(避免奇葩格式炸了整条链路)。视频缩略图留到 2a.5,需要系统装 ffmpeg
- **LOGO 唯一性走 Prisma 事务**:同 Contact.isPrimary 模式,事务里 updateMany 旧 LOGO 归档 + create 新 LOGO,任何环节失败整体回滚
- **文件访问通过专用路由**:`storage/` 不在 `public/`,浏览器不能直接访问。`/api/files/[id]` 校验登录态后流出文件;`?thumb=1` 走缩略图分支。`Content-Disposition: inline` + `filename*=UTF-8''xx` 编码非 ASCII 文件名;`Cache-Control: private, max-age=3600` 浏览器缓存 1 小时,CDN/代理不缓存
- **临时安全债:DEV_FALLBACK_ADMIN_ID 兜底**:沿用 supplier-actions.ts 同一模式——session 拿不到时兜底为 admin user id。优点是当前阶段无需登录就能联调;**代价是 Route Handler 比 Server Action 暴露面更大**(curl 也能调)。阶段 2 完整接入认证 UI 后必须移除兜底,改强制要求 session,并真正引入 role gate
- **`<img>` 而非 `<Image>`**:Next.js 的 Image 组件适合静态资源,不适合权限保护的动态 API URL,阶段 6 UI 美化时再视情况切

### 已完成

**2a.0 准备工作:**
- ✅ `npm install sharp`(图片处理)
- ✅ 项目根建 `storage/` 目录 + `.gitignore` 写 `*`(目录入 Git、内容不入)
- ✅ `.env` / `.env.example` 补 `STORAGE_DRIVER` / `STORAGE_ROOT`
- ✅ 验证 Prisma 客户端导出 `FileType` 枚举

**2a.1 存储抽象层** (`src/lib/storage/`):
- ✅ types.ts — `StorageProvider` 接口契约
- ✅ key.ts — `keyFor` / `thumbKeyFor` / 内部 `sanitizeFilename` 纯函数
- ✅ local.ts — `LocalStorageProvider` 类,含 zip slip 防护
- ✅ index.ts — 按 env 挑 provider,导出 `storage` 单例

**2a.2 两条 API 路由:**
- ✅ `POST /api/upload`:multipart 解析、类型校验、所有 9 个 FileType 的 MIME / 大小白名单、缩略图、事务唯一性、孤儿清理、revalidatePath
- ✅ `GET /api/files/[id]`:权限校验、`?thumb=1` 缩略图分支、Content-Disposition inline、Cache-Control private

**2a.3 SUPPLIER_LOGO 端到端:**
- ✅ `src/app/suppliers/_actions/file-actions.ts` — `clearSupplierLogo` server action(无 auth gate,与 archiveSupplier 同模式)
- ✅ `src/app/suppliers/[id]/_components/supplier-logo.tsx` — 客户端组件,虚框占位 / 缩略图显示 / 替换 / 清除 / loading / 错误提示
- ✅ `messages/zh.json` + `messages/ru.json` 新增 `files` 命名空间
- ✅ `[id]/page.tsx` 顶部嵌入 SupplierLogo 组件
- ✅ 端到端验证:上传一张图 → 缩略图显示 → 替换 → 清除 → DB / 磁盘双向核对(`storage/suppliers/{id}/logo/` 下有原图 + .thumb.webp 两个文件)

### 本轮新概念

- **Route Handler vs Server Action 取舍**:大小、调用方、HTTP 标准、类型链分离的差异
- **`multipart/form-data` + FormData API**:浏览器端 `fetch + new FormData()` 上传文件的标准姿势,与 Server Action 完全不同的传输方式
- **`sharp` 库**:Node 上基于 libvips 的快速图片处理,`.resize().webp().toBuffer()` 链式调用
- **`webp` 格式**:体积小、现代浏览器全支持,作为缩略图统一格式
- **zip slip 防护**:`path.resolve(root, userKey)` 后用 `startsWith(root)` 校验,阻止恶意 key 含 `..` 穿到 root 外
- **`Content-Disposition: inline` 与 `filename*=UTF-8''...`**:让浏览器直接展示文件(图片/PDF/视频),并按 RFC 5987 编码中文文件名
- **`router.refresh()` 与 `revalidatePath` 配合**:服务端清缓存 + 客户端重新拉数据 + 重新渲染,两个都要,缺一个看不到刷新
- **隐藏 `<input type="file">` + 按钮触发 `click()`**:浏览器原生 file input 没法定制样式,通用做法是隐藏它用其他元素触发
- **TypeScript `never` 穷举检查**:`switch` 末尾 `const _: never = type` 把"漏 case"提到编译期发现
- **客户端预校验 + 服务端校验双重保险**:前者早失败友好,后者防绕过

### 本轮踩到的坑

- ❌ **`session.user.role` 在 better-auth 默认 User 类型上不存在**:role 字段是 Prisma schema 上的 custom 字段,better-auth 类型层不知道。结论:**阶段 5 不做 role 检查**,与现有 supplier-actions.ts 同步,等阶段 2 完整接入认证再处理 role
- ❌ **`translateBatch` 签名记错**:它吃**一个**数组参数 `[{text, from, to}, ...]`,不是 `(texts, locale)` 两参。调用前先翻 supplier-actions.ts 看真实姿势
- ❌ **`npx tsx -e` 不加载 tsconfig paths**:`@/...` 别名在 inline 脚本里解析失败,这种验证不可靠。判断代码是否能跑应该看 `npm run dev` 的编译输出
- ❌ **PowerShell `echo "*" > file` 可能写 UTF-16 BOM**:`.gitignore` 看似空文件。规避:用 VS Code 直接建文件,默认 UTF-8 无 BOM

### 待办

1. ~~2a.0 准备 / 2a.1 抽象层 / 2a.2 API 路由 / 2a.3 LOGO~~ ✅
2. **2a.4 BROCHURE + DOC**(下一步):多文件、有 title(走 AI 翻译入库)、列表 UI、归档/恢复/改 title 的 server actions。大部分基础设施(API 路由、存储层、缩略图)已就绪,主要是 UI 复用
3. **2a.5 SUPPLIER_VIDEO**:系统装 ffmpeg 命令行 + `fluent-ffmpeg` npm 包 + 抽第 1 秒一帧做封面 + 视频播放器 UI
4. **2b QUOTE_IMAGE**:多图 + sort_order + is_cover(每 Quote 唯一封面事务),与 Quote 详情联动
5. **2c PAYMENT_SCREENSHOT / NOTE_ATTACHMENT / TRANSACTION_DOC**:挂载到对应实体,UI 复用现有上传组件
6. 阶段 5 整体收尾后进**阶段 6 UI 美化**

### 临时安全债清单(阶段 2 / 阶段 6 处理)

- `/api/upload` 用 `DEV_FALLBACK_ADMIN_ID` 兜底拿 user id,无 session 也能上传——阶段 2 接入认证后改强制 session
- 所有 server action 与 route handler 都没有 role gate(viewer 理论上也能调 admin 接口)——阶段 2 引入 role 检查
- `<img>` 标签直接拼 API URL,无 Image 组件优化——阶段 6 UI 美化时评估

### 下一轮对话开始时的入口

直接说:**「继续阶段 5,进 2a.4 BROCHURE + DOC」**

2a.4 路线预览:
1. Server Actions:archiveFile / restoreFile / updateFileTitle / triggerTranslateTitle(类似 Note 的 title 翻译入库 + 锁定)
2. 复用现有 `/api/upload`(zero 改动),前端组件需要支持多文件选择 + title 输入
3. 详情页"画册"区段(画廊式缩略图网格 + 点击放大)和"资质文档"区段(列表式 + 文件图标 + 下载链接)
4. 引入"画廊视图"模式与 LOGO 的单图模式做对比,巩固"数据库一致 / UI 差异化"设计哲学
