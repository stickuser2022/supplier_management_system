'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  createSupplier,
  updateSupplier,
  translateSupplierFields,
  type SupplierFormState,
  type SupplierTranslateField,
} from '../_actions/supplier-actions';
import { COOPERATION_LEVELS } from '../_validations/supplier-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';
import { TagMultiSelect } from '../[id]/quotes/_components/TagMultiSelect';
import { cn } from '@/lib/utils';

// ===== 类型与常量(未变动)=====
// 合作深度的中文 label 移到 i18n(messages.cooperationLevel)。
// 旧版的本地常量删除,组件内用 useTranslations('cooperationLevel') 取

export type SupplierFormInitialData = {
  id: number;
  code: string;
  nameZh: string;
  nameRu: string | null;
  nameRuAutoTranslated: boolean;
  shortNameZh: string | null;
  shortNameRu: string | null;
  shortNameRuAutoTranslated: boolean;
  provinceZh: string;
  provinceRu: string | null;
  provinceRuAutoTranslated: boolean;
  cityZh: string;
  cityRu: string | null;
  cityRuAutoTranslated: boolean;
  districtZh: string | null;
  districtRu: string | null;
  districtRuAutoTranslated: boolean;
  addressZh: string | null;
  addressRu: string | null;
  addressRuAutoTranslated: boolean;
  descriptionZh: string | null;
  descriptionRu: string | null;
  descriptionRuAutoTranslated: boolean;
  mainProductsZh: string | null;
  mainProductsRu: string | null;
  mainProductsRuAutoTranslated: boolean;
  latitude: number;
  longitude: number;
  cooperationLevel: typeof COOPERATION_LEVELS[number];
  discoveredVia: string;
  website: string | null;
};

type BilingualState = {
  nameZh: string; nameRu: string; nameRuAutoTranslated: boolean;
  shortNameZh: string; shortNameRu: string; shortNameRuAutoTranslated: boolean;
  provinceZh: string; provinceRu: string; provinceRuAutoTranslated: boolean;
  cityZh: string; cityRu: string; cityRuAutoTranslated: boolean;
  districtZh: string; districtRu: string; districtRuAutoTranslated: boolean;
  addressZh: string; addressRu: string; addressRuAutoTranslated: boolean;
  descriptionZh: string; descriptionRu: string; descriptionRuAutoTranslated: boolean;
  mainProductsZh: string; mainProductsRu: string; mainProductsRuAutoTranslated: boolean;
};

const EMPTY_BILINGUAL: BilingualState = {
  nameZh: '', nameRu: '', nameRuAutoTranslated: true,
  shortNameZh: '', shortNameRu: '', shortNameRuAutoTranslated: true,
  provinceZh: '', provinceRu: '', provinceRuAutoTranslated: true,
  cityZh: '', cityRu: '', cityRuAutoTranslated: true,
  districtZh: '', districtRu: '', districtRuAutoTranslated: true,
  addressZh: '', addressRu: '', addressRuAutoTranslated: true,
  descriptionZh: '', descriptionRu: '', descriptionRuAutoTranslated: true,
  mainProductsZh: '', mainProductsRu: '', mainProductsRuAutoTranslated: true,
};

function buildBilingualFromInitial(d?: SupplierFormInitialData): BilingualState {
  if (!d) return EMPTY_BILINGUAL;
  return {
    nameZh: d.nameZh,
    nameRu: d.nameRu ?? '',
    nameRuAutoTranslated: d.nameRuAutoTranslated,
    shortNameZh: d.shortNameZh ?? '',
    shortNameRu: d.shortNameRu ?? '',
    shortNameRuAutoTranslated: d.shortNameRuAutoTranslated,
    provinceZh: d.provinceZh,
    provinceRu: d.provinceRu ?? '',
    provinceRuAutoTranslated: d.provinceRuAutoTranslated,
    cityZh: d.cityZh,
    cityRu: d.cityRu ?? '',
    cityRuAutoTranslated: d.cityRuAutoTranslated,
    districtZh: d.districtZh ?? '',
    districtRu: d.districtRu ?? '',
    districtRuAutoTranslated: d.districtRuAutoTranslated,
    addressZh: d.addressZh ?? '',
    addressRu: d.addressRu ?? '',
    addressRuAutoTranslated: d.addressRuAutoTranslated,
    descriptionZh: d.descriptionZh ?? '',
    descriptionRu: d.descriptionRu ?? '',
    descriptionRuAutoTranslated: d.descriptionRuAutoTranslated,
    mainProductsZh: d.mainProductsZh ?? '',
    mainProductsRu: d.mainProductsRu ?? '',
    mainProductsRuAutoTranslated: d.mainProductsRuAutoTranslated,
  };
}

const INITIAL_FORM_STATE: SupplierFormState = { status: 'idle' };

type FieldPair = {
  key: SupplierTranslateField;
  zhFieldName: keyof BilingualState;
  ruFieldName: keyof BilingualState;
  flagFieldName: keyof BilingualState;
  zhLabel: string;
  ruLabel: string;
  required?: boolean;
  multiline?: boolean;
  zhPlaceholder?: string;
};

// FIELD_PAIRS 移到组件内,label 走 t()

// ===== 子组件 =====

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  const tCommon = useTranslations('forms.common');
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? tCommon('submitting') : isEdit ? tCommon('update') : tCommon('submit')}
    </Button>
  );
}

function BilingualFieldRow({
  pair, bi, errors, onZhChange, onRuChange,
}: {
  pair: FieldPair;
  bi: BilingualState;
  errors?: Record<string, string[] | undefined>;
  onZhChange: (key: keyof BilingualState, value: string) => void;
  onRuChange: (ruKey: keyof BilingualState, flagKey: keyof BilingualState, value: string) => void;
}) {
  const zhValue = bi[pair.zhFieldName] as string;
  const ruValue = bi[pair.ruFieldName] as string;
  const flagValue = bi[pair.flagFieldName] as boolean;
  const zhFieldId = `${pair.key}-zh`;
  const ruFieldId = `${pair.key}-ru`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        label={pair.zhLabel}
        htmlFor={zhFieldId}
        required={pair.required}
        error={errors?.[pair.zhFieldName]?.[0]}
      >
        {pair.multiline ? (
          <Textarea
            id={zhFieldId}
            name={pair.zhFieldName}
            value={zhValue}
            onChange={(e) => onZhChange(pair.zhFieldName, e.target.value)}
            rows={3}
            placeholder={pair.zhPlaceholder}
          />
        ) : (
          <Input
            id={zhFieldId}
            type="text"
            name={pair.zhFieldName}
            value={zhValue}
            onChange={(e) => onZhChange(pair.zhFieldName, e.target.value)}
            placeholder={pair.zhPlaceholder}
          />
        )}
      </FormField>

      <FormField label={pair.ruLabel} htmlFor={ruFieldId}>
        {pair.multiline ? (
          <Textarea
            id={ruFieldId}
            name={pair.ruFieldName}
            value={ruValue}
            onChange={(e) => onRuChange(pair.ruFieldName, pair.flagFieldName, e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            id={ruFieldId}
            type="text"
            name={pair.ruFieldName}
            value={ruValue}
            onChange={(e) => onRuChange(pair.ruFieldName, pair.flagFieldName, e.target.value)}
          />
        )}
        <input type="hidden" name={pair.flagFieldName} value={flagValue ? 'true' : 'false'} />
      </FormField>
    </div>
  );
}

// ===== 主组件 =====

export function SupplierForm({
  initialData,
  availableTags = [],
  initialTagIds = [],
  locale = 'zh',
}: {
  initialData?: SupplierFormInitialData;
  availableTags?: { id: number; nameZh: string; nameRu: string }[];
  initialTagIds?: number[];
  locale?: string;
}) {
  const isEdit = Boolean(initialData);
  const action = isEdit
    ? updateSupplier.bind(null, initialData!.id)
    : createSupplier;
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);
  const [bi, setBi] = useState<BilingualState>(() => buildBilingualFromInitial(initialData));
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const errors = state.errors;

  const t = useTranslations('forms.supplier');
  const tCommon = useTranslations('forms.common');
  const tLevel = useTranslations('cooperationLevel');

  // FIELD_PAIRS 移到组件内,label 走 t()
  const FIELD_PAIRS: FieldPair[] = [
    { key: 'name', zhFieldName: 'nameZh', ruFieldName: 'nameRu', flagFieldName: 'nameRuAutoTranslated', zhLabel: t('labelNameZh'), ruLabel: t('labelNameRu'), required: true },
    { key: 'shortName', zhFieldName: 'shortNameZh', ruFieldName: 'shortNameRu', flagFieldName: 'shortNameRuAutoTranslated', zhLabel: t('labelShortNameZh'), ruLabel: t('labelShortNameRu') },
    { key: 'province', zhFieldName: 'provinceZh', ruFieldName: 'provinceRu', flagFieldName: 'provinceRuAutoTranslated', zhLabel: t('labelProvinceZh'), ruLabel: t('labelProvinceRu'), required: true, zhPlaceholder: t('provincePlaceholder') },
    { key: 'city', zhFieldName: 'cityZh', ruFieldName: 'cityRu', flagFieldName: 'cityRuAutoTranslated', zhLabel: t('labelCityZh'), ruLabel: t('labelCityRu'), required: true, zhPlaceholder: t('cityPlaceholder') },
    { key: 'district', zhFieldName: 'districtZh', ruFieldName: 'districtRu', flagFieldName: 'districtRuAutoTranslated', zhLabel: t('labelDistrictZh'), ruLabel: t('labelDistrictRu') },
    { key: 'address', zhFieldName: 'addressZh', ruFieldName: 'addressRu', flagFieldName: 'addressRuAutoTranslated', zhLabel: t('labelAddressZh'), ruLabel: t('labelAddressRu') },
    { key: 'description', zhFieldName: 'descriptionZh', ruFieldName: 'descriptionRu', flagFieldName: 'descriptionRuAutoTranslated', zhLabel: t('labelDescriptionZh'), ruLabel: t('labelDescriptionRu'), multiline: true },
    { key: 'mainProducts', zhFieldName: 'mainProductsZh', ruFieldName: 'mainProductsRu', flagFieldName: 'mainProductsRuAutoTranslated', zhLabel: t('labelMainProductsZh'), ruLabel: t('labelMainProductsRu'), multiline: true },
  ];

  const handleZhChange = (key: keyof BilingualState, value: string) => {
    setBi((s) => ({ ...s, [key]: value }));
  };
  // 已去除"已手改"机制:用户改俄文不再翻 flag,重翻会覆盖
  const handleRuChange = (ruKey: keyof BilingualState, _flagKey: keyof BilingualState, value: string) => {
    setBi((s) => ({ ...s, [ruKey]: value }));
  };

  const runTranslate = (direction: 'zh-to-ru' | 'ru-to-zh') => {
    setTranslateError(null);
    const srcField = direction === 'zh-to-ru' ? 'zhFieldName' : 'ruFieldName';
    const dstField = direction === 'zh-to-ru' ? 'ruFieldName' : 'zhFieldName';
    const requests = FIELD_PAIRS
      .filter((p) => (bi[p[srcField]] as string).trim().length > 0)
      .map((p) => ({ field: p.key, text: bi[p[srcField]] as string }));

    if (requests.length === 0) {
      setTranslateError(direction === 'zh-to-ru' ? tCommon('noZhContent') : tCommon('noRuContent'));
      return;
    }

    startTranslating(async () => {
      const res = await translateSupplierFields(requests, direction);
      if (!res.ok) {
        setTranslateError(res.error);
        return;
      }
      setBi((s) => {
        const next = { ...s };
        for (const r of res.results) {
          const pair = FIELD_PAIRS.find((p) => p.key === r.field);
          if (!pair) continue;
          (next as Record<string, string | boolean>)[pair[dstField]] = r.translated;
          (next as Record<string, string | boolean>)[pair.flagFieldName] = true;
        }
        return next;
      });
    });
  };
  const hasZhContent = FIELD_PAIRS.some((p) => (bi[p.zhFieldName] as string).trim().length > 0);
  const hasRuContent = FIELD_PAIRS.some((p) => (bi[p.ruFieldName] as string).trim().length > 0);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === 'error' && state.message && (
        <div className="p-3 rounded-md border border-danger-fg/20 bg-danger-bg text-danger-fg text-sm">
          {state.message}
        </div>
      )}
      {translateError && (
        <div className="p-3 rounded-md border border-warning-fg/20 bg-warning-bg text-warning-fg text-sm">
          {translateError}
        </div>
      )}

      {/* 自动翻译辅助区:双向 */}
      <div className="flex items-start gap-3 p-4 rounded-md border border-border bg-muted/40">
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            type="button"
            onClick={() => runTranslate('zh-to-ru')}
            disabled={isTranslating || !hasZhContent}
            variant="secondary"
            size="sm"
          >
            {isTranslating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {tCommon('translateZhToRu')}
          </Button>
          <Button
            type="button"
            onClick={() => runTranslate('ru-to-zh')}
            disabled={isTranslating || !hasRuContent}
            variant="secondary"
            size="sm"
          >
            {isTranslating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {tCommon('translateRuToZh')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {t('autoTranslateHint')}
        </p>
      </div>

      <FormSection title={t('sectionBilingual')}>
        {FIELD_PAIRS.map((pair) => (
          <BilingualFieldRow
            key={pair.key}
            pair={pair}
            bi={bi}
            errors={errors}
            onZhChange={handleZhChange}
            onRuChange={handleRuChange}
          />
        ))}
      </FormSection>

      <FormSection title={t('sectionOther')}>
        <FormField
          label={
            <>
              {t('labelCode')}
              {isEdit && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  {t('codeReadOnlySuffix')}
                </span>
              )}
            </>
          }
          htmlFor="code"
          required
          error={errors?.code?.[0]}
        >
          <Input
            id="code"
            type="text"
            name="code"
            placeholder={t('codePlaceholder')}
            defaultValue={initialData?.code}
            readOnly={isEdit}
            className={cn(isEdit && 'bg-muted cursor-not-allowed text-muted-foreground')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('labelLatitude')} htmlFor="latitude" required error={errors?.latitude?.[0]}>
            <Input
              id="latitude"
              type="number"
              step="any"
              name="latitude"
              placeholder={t('latitudePlaceholder')}
              defaultValue={initialData?.latitude}
            />
          </FormField>
          <FormField label={t('labelLongitude')} htmlFor="longitude" required error={errors?.longitude?.[0]}>
            <Input
              id="longitude"
              type="number"
              step="any"
              name="longitude"
              placeholder={t('longitudePlaceholder')}
              defaultValue={initialData?.longitude}
            />
          </FormField>
        </div>

        <FormField label={t('labelCooperationLevel')} htmlFor="cooperationLevel">
          <select
            id="cooperationLevel"
            name="cooperationLevel"
            defaultValue={initialData?.cooperationLevel ?? 'INITIAL_CONTACT'}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {COOPERATION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {tLevel(level)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('labelDiscoveredVia')} htmlFor="discoveredVia" required error={errors?.discoveredVia?.[0]}>
          <Input
            id="discoveredVia"
            type="text"
            name="discoveredVia"
            placeholder={t('discoveredViaPlaceholder')}
            defaultValue={initialData?.discoveredVia}
          />
        </FormField>

        <FormField label={t('labelWebsite')} htmlFor="website" error={errors?.website?.[0]}>
          <Input
            id="website"
            type="text"
            name="website"
            placeholder={t('websitePlaceholder')}
            defaultValue={initialData?.website ?? ''}
          />
        </FormField>
      </FormSection>

      <FormSection title={t('sectionTags')} description={t('tagsHint')}>
        <TagMultiSelect
          availableTags={availableTags}
          initialSelectedIds={initialTagIds}
          locale={locale}
        />
      </FormSection>

      <FormActions>
        <SubmitButton isEdit={isEdit} />
      </FormActions>
    </form>
  );
}