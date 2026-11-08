/** R98 supports working, deliberately noindex preview pages for V2's four HOLD intents.
 * The original 55-row source contract, 51 primary-v18 generators and frozen 488 keywords
 * remain untouched. A preview route does not imply approved organic search indexing.
 */
export const R98_PREVIEW_ONLY_HOLD_PAGES=Object.freeze([
 'word-problems-worksheets',
 'worksheets-by-grade',
 'algebra-general-worksheets',
 'geometry-general-worksheets'
] as const);
export const isR98PreviewHold=(slug:string):boolean=>
 (R98_PREVIEW_ONLY_HOLD_PAGES as readonly string[]).includes(slug);
