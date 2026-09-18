// Kept in its own leaf module, deliberately with no other project imports: `Browser.tsx`
// re-exports everything here, but several files (`variantTableColumns.tsx`,
// `VariantsInGene.tsx`, `ASC2Browser.tsx`, ...) need the value-level exports
// (`defineVariantCategoryOptions`, `DEFAULT_VARIANT_CATEGORY_OPTIONS`) without pulling in
// Browser.tsx's full import graph, which runs dataset-config-dependent module-level code
// (`DownloadsPage.tsx`) that throws outside a fully configured `window.datasetConfig`
// (e.g. in unit tests that only need a table column or a filter default).

export type ConsequenceCategory = 'lof' | 'missense' | 'synonymous' | 'other'

export interface VariantConsequence {
  term: string
  label?: string
  category: ConsequenceCategory
}

export type VariantConsequenceCategoryLabels = Record<ConsequenceCategory, string>

// The id of a variant category is dataset-specific (e.g. ASC2 uses its own
// Mis0/Mis1/Mis2/PTV/synonymous classes instead of lof/missense/synonymous/other),
// so it's typed as `string` here where components must stay dataset-agnostic.
// Datasets that want compile-time exhaustiveness over their own closed set of
// category ids should build this list with `defineVariantCategoryOptions`
// below, rather than writing the array out by hand.
export interface VariantCategoryOption<TCategory extends string = string> {
  id: TCategory
  label: string
  color: string
  keyboardShortcut?: string
}

// A `Record<TCategory, ...>` argument makes TypeScript reject both a
// misspelled category id (excess property) and a missing one, at the one
// place a dataset's categories are authored by hand.
export const defineVariantCategoryOptions = <TCategory extends string>(
  detailsByCategory: Record<TCategory, Omit<VariantCategoryOption<TCategory>, 'id'>>
): VariantCategoryOption<TCategory>[] =>
  (Object.keys(detailsByCategory) as TCategory[]).map((id) => ({
    id,
    ...detailsByCategory[id],
  }))

export const DEFAULT_VARIANT_CATEGORY_COLOR = '#757575'

export const DEFAULT_VARIANT_CATEGORY_OPTIONS: VariantCategoryOption<
  ConsequenceCategory
>[] = defineVariantCategoryOptions<ConsequenceCategory>({
  lof: { label: 'LoF', color: '#FF583F', keyboardShortcut: 'l' },
  missense: { label: 'Missense', color: '#F0C94D', keyboardShortcut: 'm' },
  synonymous: { label: 'Synonymous', color: '#008000', keyboardShortcut: 's' },
  other: { label: 'Other', color: DEFAULT_VARIANT_CATEGORY_COLOR, keyboardShortcut: 'o' },
})
