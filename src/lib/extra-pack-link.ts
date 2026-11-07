/** R82: share only declared PDF-only extension selectors, never student answers. */
export const EXTRA_PACK_LINK_VERSION = '1' as const;
export const EXTRA_PACK_KEYS = [
  "equation-kind",
  "fraction-line-task",
  "fraction-line-range",
  "decimal-divisor",
  "decimal-precision",
  "decimal-add-sub-operation",
  "decimal-add-sub-places",
  "decimal-add-sub-regrouping",
  "conversion-direction",
  "conversion-precision",
  "multdiv-mode",
  "multdiv-factors",
  "fraction-strip-set",
  "division-story-mode",
  "r74-inequality-mode",
  "r74-circle-mode",
  "r75-triangle-mode",
  "r75-composite-mode",
  "r76-cylinder-mode",
  "r77-dotplot-mode",
  "r78-solid-mode",
  "r79-mixed-solid-mode",
  "r80-nets-mode",
  "r80-composite-mode",
  "r84-multiplication-mode",
  "r85-fractions-mode",
  "r85-addition-pictures-mode",
  "r85-place-value-mode",
  "r85-division-equations-mode",
  "r86-graph-mode",
  "closure-mode"
] as const;
export type ExtraPackKey = (typeof EXTRA_PACK_KEYS)[number];
export type ExtraPackSelection = {
  key: ExtraPackKey;
  allowed: readonly string[];
  defaultValue: string;
  selectedValue: string;
};

const isAllowedKey = (key: string): key is ExtraPackKey =>
  (EXTRA_PACK_KEYS as readonly string[]).includes(key);

/** Append extension options without altering the tested v18 base-worksheet identity. */
export function buildExtraPackLink(baseUrl: string, selections: readonly ExtraPackSelection[]): string {
  const url = new URL(baseUrl);
  const seen = new Set<string>();
  let changed = 0;
  for (const selected of selections) {
    if (!isAllowedKey(selected.key) || seen.has(selected.key)) throw new Error('Invalid or duplicated extra pack selector');
    seen.add(selected.key);
    const {allowed,defaultValue,selectedValue,key} = selected;
    if (!allowed.includes(defaultValue) || !allowed.includes(selectedValue)) throw new Error('Invalid extra pack selector value');
    url.searchParams.delete('xp_' + key);
    if (selectedValue !== defaultValue) {
      url.searchParams.set('xp_' + key, selectedValue);
      changed++;
    }
  }
  url.searchParams.delete('xpv');
  if (changed) url.searchParams.set('xpv', EXTRA_PACK_LINK_VERSION);
  return url.toString();
}

/** Unsupported, stale, cross-topic and unexpected query arguments are ignored. */
export function parseExtraPackLink(currentUrl: string, available: readonly ExtraPackSelection[]): Partial<Record<ExtraPackKey,string>> {
  const result: Partial<Record<ExtraPackKey,string>> = {};
  const params = new URL(currentUrl).searchParams;
  if (params.get('xpv') !== EXTRA_PACK_LINK_VERSION) return result;
  for (const field of available) {
    if (!isAllowedKey(field.key)) continue;
    const value = params.get('xp_' + field.key);
    if (value !== null && field.allowed.includes(value)) result[field.key] = value;
  }
  return result;
}
