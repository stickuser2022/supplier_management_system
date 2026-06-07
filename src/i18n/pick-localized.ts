/**
 * 双语字段选择工具
 *
 * 根据用户当前 locale,从 _zh + _ru 字段对里选要显示的值。
 *
 * 规则:
 * - locale === 'ru' 且 ru 有值 → 返回 ru
 * - 否则 → 返回 zh(永不显示空白,即使俄文还没翻译过来)
 *
 * 用法:
 *   const name = pickLocalized(supplier.nameZh, supplier.nameRu, locale);
 *
 * 这个函数会在所有"双语三件套字段"的展示场景反复用到:
 * Supplier / Contact / Quote / Transaction / Payment / File 的 title 等。
 */
export function pickLocalized(
  zh: string | null | undefined,
  ru: string | null | undefined,
  locale: string,
): string {
  if (locale === 'ru' && ru) {
    return ru;
  }
  return zh ?? '';
}