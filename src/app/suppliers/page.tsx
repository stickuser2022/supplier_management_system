import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, isOwner } from "@/lib/auth";
import { pickLocalized } from "@/i18n/pick-localized";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SupplierActionsCell } from "./_components/SupplierActionsCell";
import { SupplierSearchAndFilter } from "./_components/SupplierSearchAndFilter";
import { CooperationLevelBadge } from "@/components/suppliers/cooperation-level-badge";
import { COOPERATION_LEVELS } from "./_validations/supplier-schema";
import { cn } from "@/lib/utils";
import { LightboxImage } from "@/components/ui/lightbox-image";
import type { Prisma } from "@/generated/prisma/client";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{
    archived?: string;
    q?: string;
    tags?: string;
    level?: string;
  }>;
}) {
  const params = await searchParams;
  const showArchived = params.archived === "1";
  const q = (params.q ?? "").trim();
  const tagIds = (params.tags ?? "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n > 0);
  const levelParam =
    params.level &&
    (COOPERATION_LEVELS as readonly string[]).includes(params.level)
      ? (params.level as (typeof COOPERATION_LEVELS)[number])
      : null;

  const t = await getTranslations("suppliers");
  const locale = await getLocale();

  // 组合 where 条件
  const whereAnd: Prisma.SupplierWhereInput[] = [];
  if (q) {
    whereAnd.push({
      OR: [
        { code: { contains: q } },
        { nameZh: { contains: q } },
        { nameRu: { contains: q } },
        { shortNameZh: { contains: q } },
        { shortNameRu: { contains: q } },
        { provinceZh: { contains: q } },
        { provinceRu: { contains: q } },
        { cityZh: { contains: q } },
        { cityRu: { contains: q } },
        { districtZh: { contains: q } },
        { districtRu: { contains: q } },
        { addressZh: { contains: q } },
        { addressRu: { contains: q } },
        { mainProductsZh: { contains: q } },
        { mainProductsRu: { contains: q } },
        { descriptionZh: { contains: q } },
        { descriptionRu: { contains: q } },
        { discoveredVia: { contains: q } },
        // 原始意图字段
        { originalIntentProductNameZh: { contains: q } },
        { originalIntentProductNameRu: { contains: q } },
        { originalIntentOverviewZh: { contains: q } },
        { originalIntentOverviewRu: { contains: q } },
        // 通过 Quote 关联查产品名
        { quotes: { some: { productNameZh: { contains: q } } } },
        { quotes: { some: { productNameRu: { contains: q } } } },
      ],
    });
  }
  // 标签 AND 语义:每个 tag 都必须命中。命中定义 = 供应商自己挂了 OR 旗下有 Quote 挂了
  for (const tagId of tagIds) {
    whereAnd.push({
      OR: [
        { supplierTags: { some: { tagId } } },
        { quotes: { some: { quoteTags: { some: { tagId } } } } },
      ],
    });
  }
  if (levelParam) {
    whereAnd.push({ cooperationLevel: levelParam });
  }

  const where: Prisma.SupplierWhereInput = {
    isActive: !showArchived,
    ...(whereAnd.length > 0 ? { AND: whereAnd } : {}),
  };

  const [suppliers, currentUser, allTags] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        contacts: {
          where: {
            status: "ACTIVE",
            isPrimary: true,
          },
          take: 1,
          select: {
            id: true,
            nameZh: true,
            nameRu: true,
            roleZh: true,
            roleRu: true,
            phone: true,
            wechat: true,
          },
        },
        supplierTags: {
          include: {
            tag: {
              select: {
                id: true,
                nameZh: true,
                nameRu: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            contacts: true,
            quotes: true,
            transactions: true,
            notes: true,
            files: true,
          },
        },
      },
    }),
    requireCurrentUser(),
    prisma.tag.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { nameZh: "asc" }],
      select: {
        id: true,
        category: true,
        nameZh: true,
        nameRu: true,
        color: true,
      },
    }),
  ]);

  // 一次性查 logo,按 supplierId 索引(避免 N+1)
  const logoFiles = await prisma.file.findMany({
    where: {
      supplierId: { in: suppliers.map((s) => s.id) },
      type: "SUPPLIER_LOGO",
      isActive: true,
    },
    select: { id: true, supplierId: true },
  });
  const logoMap = new Map<number, number>();
  for (const f of logoFiles) {
    if (f.supplierId) logoMap.set(f.supplierId, f.id);
  }

  // 一次性查原始意图图片,按 supplierId 索引
  const intentImageFiles = await prisma.file.findMany({
    where: {
      supplierId: { in: suppliers.map((s) => s.id) },
      type: "ORIGINAL_INTENT_IMAGE",
      isActive: true,
    },
    select: { id: true, supplierId: true },
    orderBy: { sortOrder: 'asc' },
  });
  const intentImageMap = new Map<number, number>();
  for (const f of intentImageFiles) {
    if (f.supplierId && !intentImageMap.has(f.supplierId)) {
      intentImageMap.set(f.supplierId, f.id);
    }
  }

  return (
    <div className="w-full px-6 py-6">
      {/* 页面头部 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("total", { count: suppliers.length })}
          </p>
        </div>
        {!showArchived && (
          <Button asChild>
            <Link href="/suppliers/new">{t("newSupplier")}</Link>
          </Button>
        )}
      </div>

      {/* 搜索 + 筛选 */}
      <SupplierSearchAndFilter
        initialQ={q}
        initialTagIds={tagIds}
        initialLevel={levelParam}
        allTags={allTags}
        locale={locale}
      />

      {/* Tab 切换 */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 -mb-px">
          <TabLink href="/suppliers" isActive={!showArchived}>
            {t("activeView")}
          </TabLink>
          <TabLink href="/suppliers?archived=1" isActive={showArchived}>
            {t("archivedView")}
          </TabLink>
        </nav>
      </div>

      {/* 供应商表格 — 桌面端 */}
      <div className="hidden md:block w-full overflow-x-auto rounded-md border border-border">
        <Table className="table-fixed" style={{ minWidth: 1500 }}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[26%]">
                {locale === "ru" ? "Поставщик" : "供应商"}
              </TableHead>
              <TableHead className="w-[14%]">
                {locale === "ru" ? "Оригинальное намерение" : "原始意图"}
              </TableHead>
              <TableHead className="w-[30%]">
                {locale === "ru"
                  ? "Регион / Основная продукция"
                  : "地区 / 主营"}
              </TableHead>
              <TableHead className="w-[8%]">
                {locale === "ru" ? "Данные" : "业务数据"}
              </TableHead>
              <TableHead className="w-[14%]">
                {locale === "ru" ? "Рейтинг/теги" : "等级 / 标签"}
              </TableHead>
              <TableHead className="w-[8%] text-right">
                {t("columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-12"
                >
                  {q || tagIds.length > 0 || levelParam
                    ? t("search.noResults")
                    : t("emptyList")}
                </TableCell>
              </TableRow>
            )}
            {suppliers.map((s) => {
              const logoId = logoMap.get(s.id);
              const displayName = pickLocalized(s.nameZh, s.nameRu, locale);

              const locationParts = [
                pickLocalized(s.provinceZh, s.provinceRu, locale),
                pickLocalized(s.cityZh, s.cityRu, locale),
                pickLocalized(s.districtZh, s.districtRu, locale),
              ].filter(Boolean);

              const mainProducts = pickLocalized(
                s.mainProductsZh,
                s.mainProductsRu,
                locale,
              );

              const primaryContact = s.contacts[0];

              return (
                <TableRow key={s.id} className="align-top hover:bg-muted/40">
                  <TableCell className="py-4">
                    <div className="flex gap-3">
                      <Link href={`/suppliers/${s.id}`} className="shrink-0">
                        {logoId ? (
                          <LightboxImage
                            src={`/api/files/${logoId}?thumb=1`}
                            alt=""
                            className="size-12 rounded-lg object-cover border border-border bg-muted"
                          />
                        ) : (
                          <span className="size-12 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground border border-border">
                            {(s.nameZh ?? "?").slice(0, 1)}
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link
                          href={`/suppliers/${s.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline line-clamp-2 break-words"
                        >
                          {displayName}
                        </Link>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{s.code}</span>
                          {!s.isActive && (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                              {locale === "ru" ? "Архив" : "已归档"}
                            </span>
                          )}
                        </div>

                        {primaryContact && (
                          <div className="mt-2 text-xs text-muted-foreground line-clamp-2 break-words">
                            {locale === "ru"
                              ? "Основной контакт: "
                              : "主联系人："}
                            <span className="text-foreground">
                              {pickLocalized(
                                primaryContact.nameZh,
                                primaryContact.nameRu,
                                locale,
                              )}
                            </span>

                            {pickLocalized(
                              primaryContact.roleZh,
                              primaryContact.roleRu,
                              locale,
                            ) && (
                              <>
                                {" · "}
                                {pickLocalized(
                                  primaryContact.roleZh,
                                  primaryContact.roleRu,
                                  locale,
                                )}
                              </>
                            )}

                            {primaryContact.phone && (
                              <>
                                {" · "}
                                {primaryContact.phone}
                              </>
                            )}

                            {!primaryContact.phone && primaryContact.wechat && (
                              <>
                                {" · "}
                                {locale === "ru" ? "WeChat " : "微信 "}
                                {primaryContact.wechat}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* 原始意图 */}
                  <TableCell className="py-4">
                    <OriginalIntentCell
                      supplier={s}
                      imageId={intentImageMap.get(s.id)}
                      locale={locale}
                    />
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-foreground line-clamp-2 break-words">
                        {locationParts.length > 0
                          ? locationParts.join(" / ")
                          : locale === "ru"
                            ? "Регион не указан"
                            : "未填写地区"}
                      </div>

                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {mainProducts
                          ? `${locale === "ru" ? "Основная продукция" : "主营"}：${mainProducts}`
                          : locale === "ru"
                            ? "Основная продукция не указана"
                            : "未填写主营产品"}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <StatBadge
                        label={locale === "ru" ? "Контакты" : "联系人"}
                        value={s._count.contacts}
                      />
                      <StatBadge
                        label={locale === "ru" ? "КП" : "报价"}
                        value={s._count.quotes}
                      />
                      <StatBadge
                        label={locale === "ru" ? "Сделки" : "交易"}
                        value={s._count.transactions}
                      />
                      <StatBadge
                        label={locale === "ru" ? "Заметки" : "备注"}
                        value={s._count.notes}
                      />
                      <StatBadge
                        label={locale === "ru" ? "Файлы" : "文件"}
                        value={s._count.files}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <CooperationLevelBadge level={s.cooperationLevel} />

                      {s.supplierTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.supplierTags.slice(0, 3).map((st) => (
                            <span
                              key={st.tag.id}
                              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                              style={
                                st.tag.color
                                  ? { borderColor: st.tag.color }
                                  : undefined
                              }
                            >
                              {pickLocalized(
                                st.tag.nameZh,
                                st.tag.nameRu,
                                locale,
                              )}
                            </span>
                          ))}

                          {s.supplierTags.length > 3 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              +{s.supplierTags.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {locale === "ru" ? "Нет тегов" : "暂无标签"}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 text-right">
                    <SupplierActionsCell
                      supplier={{
                        id: s.id,
                        nameZh: s.nameZh,
                        nameRu: s.nameRu,
                        isActive: s.isActive,
                      }}
                      canEdit={isOwner(s, currentUser)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片 */}
      <div className="md:hidden space-y-3">
        {suppliers.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">
            {q || tagIds.length > 0 || levelParam
              ? t("search.noResults")
              : t("emptyList")}
          </p>
        ) : (
          suppliers.map((s) => {
            const logoId = logoMap.get(s.id);
            const displayName = pickLocalized(s.nameZh, s.nameRu, locale);
            const locationStr = [
              pickLocalized(s.provinceZh, s.provinceRu, locale),
              pickLocalized(s.cityZh, s.cityRu, locale),
              pickLocalized(s.districtZh, s.districtRu, locale),
            ].filter(Boolean).join(' / ') || (locale === 'ru' ? 'Регион не указан' : '未填写地区');
            const mainProducts = pickLocalized(s.mainProductsZh, s.mainProductsRu, locale);
            const primaryContact = s.contacts[0];
            const intentImageId = intentImageMap.get(s.id);

            return (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                {/* 头部: logo + 名称 + 等级 */}
                <div className="flex items-start gap-3">
                  <Link href={`/suppliers/${s.id}`} className="shrink-0">
                    {logoId ? (
                      <LightboxImage
                        src={`/api/files/${logoId}?thumb=1`}
                        alt=""
                        className="size-11 rounded-lg object-cover border border-border bg-muted"
                      />
                    ) : (
                      <span className="size-11 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground border border-border">
                        {(s.nameZh ?? '?').slice(0, 1)}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/suppliers/${s.id}`}
                      className="font-medium text-foreground hover:text-primary line-clamp-2 break-words"
                    >
                      {displayName}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      <span className="font-mono">{s.code}</span>
                      {!s.isActive && (
                        <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-destructive">
                          {locale === 'ru' ? 'Архив' : '已归档'}
                        </span>
                      )}
                    </div>
                  </div>
                  <CooperationLevelBadge level={s.cooperationLevel} />
                </div>

                {/* 原始意图（如有） */}
                {(s.originalIntentProductNameZh || s.originalIntentOverviewZh) && (
                  <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5">
                    {intentImageId ? (
                      <LightboxImage
                        src={`/api/files/${intentImageId}?thumb=1`}
                        alt=""
                        className="size-9 rounded object-cover border border-border shrink-0"
                      />
                    ) : null}
                    <div className="min-w-0 text-xs leading-relaxed">
                      {s.originalIntentProductNameZh && (
                        <Link
                          href={`/suppliers/${s.id}/original-intent/edit`}
                          className="font-medium text-foreground block hover:text-primary hover:underline"
                        >
                          {pickLocalized(s.originalIntentProductNameZh, s.originalIntentProductNameRu, locale)}
                        </Link>
                      )}
                      {s.originalIntentOverviewZh && (
                        <span className="text-muted-foreground line-clamp-2">
                          {pickLocalized(s.originalIntentOverviewZh, s.originalIntentOverviewRu, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 地区 + 主营 */}
                <div className="text-xs space-y-0.5">
                  <div className="text-foreground">{locationStr}</div>
                  {mainProducts && (
                    <div className="text-muted-foreground">
                      {locale === 'ru' ? 'Осн. продукция' : '主营'}：{mainProducts}
                    </div>
                  )}
                </div>

                {/* 主联系人 */}
                {primaryContact && (
                  <div className="text-xs text-muted-foreground border-t border-border pt-2.5">
                    <span className="text-foreground font-medium">
                      {pickLocalized(primaryContact.nameZh, primaryContact.nameRu, locale)}
                    </span>
                    {pickLocalized(primaryContact.roleZh, primaryContact.roleRu, locale) && (
                      <> · {pickLocalized(primaryContact.roleZh, primaryContact.roleRu, locale)}</>
                    )}
                    {primaryContact.phone && <> · {primaryContact.phone}</>}
                    {!primaryContact.phone && primaryContact.wechat && <> · WeChat: {primaryContact.wechat}</>}
                  </div>
                )}

                {/* 标签 */}
                {s.supplierTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.supplierTags.slice(0, 4).map((st) => (
                      <span
                        key={st.tag.id}
                        className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                        style={st.tag.color ? { borderColor: st.tag.color } : undefined}
                      >
                        {pickLocalized(st.tag.nameZh, st.tag.nameRu, locale)}
                      </span>
                    ))}
                  </div>
                )}

                {/* 底部：统计 + 操作 */}
                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{locale === 'ru' ? 'Конт' : '联系人'} {s._count.contacts}</span>
                    <span>{locale === 'ru' ? 'КП' : '报价'} {s._count.quotes}</span>
                    <span>{locale === 'ru' ? 'Заказы' : '订单'} {s._count.transactions}</span>
                  </div>
                  <SupplierActionsCell
                    supplier={{ id: s.id, nameZh: s.nameZh, nameRu: s.nameRu, isActive: s.isActive }}
                    canEdit={isOwner(s, currentUser)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function OriginalIntentCell({
  supplier,
  imageId,
  locale,
}: {
  supplier: {
    id: number;
    originalIntentProductNameZh: string | null;
    originalIntentProductNameRu: string | null;
    originalIntentOverviewZh: string | null;
    originalIntentOverviewRu: string | null;
  };
  imageId: number | undefined;
  locale: string;
}) {
  const overview = pickLocalized(
    supplier.originalIntentOverviewZh ?? '',
    supplier.originalIntentOverviewRu,
    locale,
  );
  const productName = pickLocalized(
    supplier.originalIntentProductNameZh ?? '',
    supplier.originalIntentProductNameRu,
    locale,
  );

  const hasContent = Boolean(
    supplier.originalIntentProductNameZh || supplier.originalIntentOverviewZh,
  );

  if (!hasContent) {
    return (
      <span className="text-xs text-muted-foreground italic">
        {locale === 'ru' ? '—' : '—'}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 缩略图 — 点击看大图，不跳转 */}
      {imageId ? (
        <LightboxImage
          src={`/api/files/${imageId}?thumb=1`}
          alt=""
          className="w-full h-20 rounded-md object-contain border border-border bg-muted p-1"
        />
      ) : (
        <div className="w-full h-20 rounded-md bg-muted flex items-center justify-center border border-border">
          <svg className="size-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </div>
      )}

      {/* 文字：产品名可点击跳转编辑页 */}
      <div className="min-w-0">
        {productName && (
          <Link
            href={`/suppliers/${supplier.id}/original-intent/edit`}
            className="block text-sm font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
          >
            {productName}
          </Link>
        )}
        {overview && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-0.5">
            {overview}
          </p>
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2 py-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}

function TabLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 text-sm font-medium border-b-2 transition-colors rounded-t-sm",
        "focus:outline-none focus-visible:bg-muted/50", // ← 新增这一行
        isActive
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
