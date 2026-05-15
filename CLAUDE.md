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

# Prisma 相关(阶段 1 安装后才有)
npx prisma studio          # 数据库可视化管理
npx prisma migrate dev     # 应用 schema 变更到数据库
npx prisma generate        # 重新生成 Prisma Client
```

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
| 自由文本(沟通记录) | 备注流水 | Admin 仅录中文,Viewer 看时**按需点翻译按钮**实时翻译 | 数据库只存原文,翻译不持久化 |

### 双语字段命名约定

凡是需要双语的字段,统一遵循:

```
[字段名]_zh                       中文版本(主)
[字段名]_ru                       俄文版本(可空,可自动)
[字段名]_ru_auto_translated       是否由 AI 自动翻译(仅供应商类数据需要)
```

加新双语字段时按此模板套用,无需每次单独设计。

---

### Supplier 表(供应商)

供应商是系统的核心实体,代表一家公司。

**字段定义:**

```
Supplier(供应商)
├── id                                  Int        主键,自增
│
├── # 身份信息
├── code                                String?    自定义编号(如 GZ-001)
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
├── discovered_via                      String?    认识渠道(自由文本)
├── website                             String?    主官网链接
├── logo_path                           String?    Logo 文件路径
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
