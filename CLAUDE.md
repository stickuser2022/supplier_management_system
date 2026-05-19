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
├── unit                                     String?    单位(自由文本:件/个/套/打/箱)
├── moq                                      Int?       起订量(Minimum Order Quantity)
│
├── # 报价上下文
├── quoted_at                                Date       报价日期,必填
├── valid_until                              Date?      报价有效期
├── payment_terms                            String?    付款条件(自由文本)
├── lead_time_days                           Int?       交货天数
├── source                                   String?    报价来源(自由文本)
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
- Quote → QuoteImage : 一对多

**重要设计决策:**

- **不建 Product 表**:产品品类靠 Quote ↔ Tag 多对多解决(关联 PRODUCT 类型 Tag),具体产品描述以 `product_name_zh` 和 `product_spec_zh` 自由文本承载。比价靠"按 Tag 聚合 + 全文搜索 + 缩略图肉眼判断"。等业务出现"SKU 级精确比价"或"品类挂图说明"的需求时,再引入 Product 表
- **单项录入为主,扩展口预留**:第一版只做单项录入(一条 Quote 一个产品),`quote_batch_id` 字段保留备用。未来一张报价单录入多个产品时,生成同一批次号关联,无需改表结构
- **状态字段两档,过期实时算**:`status` 只区分 ACTIVE / ARCHIVED,管理员手动维护;"过期"不存进 status,运行时按 `valid_until` 字段实时判断。比价视图默认条件:`status = 'ACTIVE' AND (valid_until IS NULL OR valid_until > today)`
- **比价的核心结构**:三件套——产品名字段全文索引(模糊搜索)、QuoteImage 缩略图(肉眼判断同款)、按 Tag 聚合的比价视图(查询页)
- **货币用枚举,单位用自由文本**:货币种类有限且需要按种类归一化比价(将来可加汇率表);单位发散且不需要归一化,自由文本即可
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
- **`content_ru` 字段是"按需翻译"模式的人工逃生通道**:与双语策略中"自由文本不入库"的默认行为兼容——默认留空,Viewer 看时由 API 实时翻译不持久化;特殊情况下(API 不稳定 / 翻译质量差 / 重要 Note 需人工把关)Admin 可手动填入俄文版本。显示逻辑:`content_ru` 有值优先用,没值才调 API
- **不需要 `content_ru_auto_translated` 标记**:Note 的 `content_ru` 一旦有值必然是 Admin 手填(API 翻译永远不入库),来源单一无需溯源。这与 Supplier 表"机翻+人工双源"的设计形成对照
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
├── unit                                     String?  单位(录入,自由文本)
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
- **`screenshot_path` 是临时单字段**:等阶段 5 File 表上线后,此字段会迁移为 File 关联(`File.type = 'payment_screenshot'`),业务层零感知
- **`method` 和 `purpose_zh` 用自由文本**:付款方式和用途的表达千变万化("微信群里说的"、"老李代付"、"补差价"),枚举不灵活;自由文本最贴合实际

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



````

## 二、进度日志整段替换

```markdown
## 2026.5.18 项目进度日志

> 此区域是"项目接力棒",每次结束工作前更新。下次开新对话,把整个 CLAUDE.md 粘给 Claude,即可无缝续接上下文。

### 当前阶段:阶段 1 — 项目骨架 + 数据模型雏形

### 已完成

- ✅ Next.js 16.2.6 项目初始化(TypeScript + Tailwind + App Router + Turbopack)
- ✅ Git 仓库初始化和首次提交,用户配置完成
- ✅ CLAUDE.md 第 1 段(项目概览 + 用户角色 + 语言策略 + 关键设计决策)
- ✅ CLAUDE.md 第 2 段(技术栈 + 项目目录结构 + 常用命令)
- ✅ 数据模型:Supplier 表 + Tag 表 + SupplierTag 中间表
- ✅ 数据模型:Contact 表(联系人)
- ✅ 数据模型:Quote 表 + QuoteTag 中间表(QuoteImage 子表已废,功能并入 File 表)
- ✅ 数据模型:Note 表(沟通记录)
- ✅ 数据模型:Transaction + TransactionItem + Payment
- ✅ 数据模型:**File(文件)表**(统一文件载体,挂载到 Supplier / Quote / Payment / Note / Transaction)
- ✅ 临时设计清理:删除 `Supplier.logo_path`、`Payment.screenshot_path`、`QuoteImage` 表整张
- ✅ 字段命名修正:`Payment.purpose_zh` 补齐双语三件套(`purpose_ru` + `purpose_ru_auto_translated`)

### 进行中

- 🔄 数据模型设计:**User(用户)表** — 待开始讨论

### 待办(按顺序)

1. 完成 User(用户)表设计
2. **历史字段双语审计**(装 Prisma 前必做):Quote.payment_terms / Quote.source / Quote.unit / Quote.discovered_via / Payment.method 等当前"无 _zh 后缀"的自由文本字段,逐个评估是否升级为双语三件套
3. 安装 Prisma + 初始化 SQLite + 写第一版 `schema.prisma`
4. 跑 `prisma migrate dev` 生成数据库
5. 用 Prisma Studio 手动塞测试数据
6. 写第一个最简页面:从数据库读供应商列表显示为文字

### 下次开始时,需要决策的 User 表问题

(初步罗列,具体取舍下次讨论时展开)

- **角色字段**:用枚举 `ADMIN / VIEWER` 直接落字段,还是依赖 Auth.js 的角色管理机制?
- **认证方式**:用户名 + 密码?邮箱 + 密码?或者让 Auth.js 接管整套认证流程?(关系到密码 hash、登录入口、找回密码等)
- **语言偏好字段**:用户登录后切换中文 / 俄语界面,这个偏好存哪里?字段命名?是枚举还是字符串?
- **个人信息字段**:姓名、头像、时区(青格力 +8 vs 家人 +3)是否需要?
- **User 表自身是否需要双语处理**:每个用户看自己的界面,理论上不需要双语;但 Admin 在系统其他位置(如供应商详情里的"创建人")可能被俄语 Viewer 看到,这种"用户名展示"要不要双语?
```

