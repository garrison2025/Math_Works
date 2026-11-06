/** R40: reviewed 24 parent/specialist intent comparisons from owner V2 spec.
 * Navigation evidence only, NOT permission to index pages.
 */
export type SkillRelation={parent:string;child:string;difference:string};
export const SKILL_RELATIONS:readonly SkillRelation[]=[
 {parent:'multiplication-worksheets',child:'two-digit-multiplication-worksheets',difference:'Mixed multiplication facts vs strictly two-digit-by-two-digit column practice'},
 {parent:'multiplication-worksheets',child:'two-digit-by-one-digit-multiplication-worksheets',difference:'Mixed multiplication vs exactly two-digit-by-one-digit vertical working'},
 {parent:'multiplication-worksheets',child:'three-digit-by-two-digit-multiplication-worksheets',difference:'Mixed multiplication vs extended three-digit-by-two-digit column calculations'},
 {parent:'multiplication-worksheets',child:'multiplication-tables-worksheets',difference:'Varied products vs focused 1–12 multiplication table facts'},
 {parent:'fractions-worksheets',child:'equivalent-fractions-worksheets',difference:'Mixed fraction arithmetic vs finding missing values in equivalent fractions'},
 {parent:'fractions-worksheets',child:'adding-unlike-fractions-worksheets',difference:'Mixed fraction operations vs only adding unlike denominators'},
 {parent:'fractions-worksheets',child:'multiplying-fractions-worksheets',difference:'Mixed fraction operations vs dedicated fraction multiplication'},
 {parent:'area-worksheets',child:'area-of-triangles-worksheets',difference:'Rectangular and square area vs triangle base-and-height problems'},
 {parent:'area-worksheets',child:'area-of-parallelograms-worksheets',difference:'Rectangular and square area vs parallelogram perpendicular-height practice'},
 {parent:'area-worksheets',child:'area-of-trapezoids-worksheets',difference:'Rectangular and square area vs trapezoids with two parallel bases'},
 {parent:'angle-worksheets',child:'complementary-supplementary-angles-worksheets',difference:'Classifying acute/right/obtuse angles vs finding 90° and 180° angle pairs'},
 {parent:'angle-worksheets',child:'vertical-angles-worksheets',difference:'Classifying single angles vs vertical/adjacent angles at intersections'},
 {parent:'angle-worksheets',child:'triangle-angle-sum-worksheets',difference:'Classifying angles vs calculating a missing triangle interior angle'},
 {parent:'mean-median-mode-range-worksheets',child:'mean-absolute-deviation-worksheets',difference:'Mean/median/mode/range vs computing average absolute distance from the mean'},
 {parent:'mean-median-mode-range-worksheets',child:'box-plots-worksheets',difference:'Summary statistics vs five-number-summary and modified box-plot construction'},
 {parent:'mean-median-mode-range-worksheets',child:'scatter-plot-worksheets',difference:'Single-variable statistics vs plotting ordered pairs and detecting trend'},
 {parent:'functions-worksheets',child:'function-tables-worksheets',difference:'Function evaluation and reverse rules vs missing cells in function tables'},
 {parent:'functions-worksheets',child:'linear-equations-worksheets',difference:'Function rule arithmetic vs graphing straight lines on coordinate axes'},
 {parent:'division-worksheets',child:'long-division-worksheets',difference:'Division facts vs digit-by-digit long division with remainders'},
 {parent:'place-value-worksheets',child:'decimal-place-value-worksheets',difference:'Whole-number positions through billions vs decimal digits and rounding'},
 {parent:'addition-worksheets',child:'mixed-addition-subtraction-worksheets',difference:'Focused addition and regrouping vs mixed addition/subtraction'},
 {parent:'subtraction-worksheets',child:'mixed-addition-subtraction-worksheets',difference:'Focused subtraction and borrowing vs mixed addition/subtraction'},
 {parent:'coordinate-plane-worksheets',child:'scatter-plot-worksheets',difference:'Locating ordered pairs vs analyzing six-point patterns and correlation'},
 {parent:'inequalities-worksheets',child:'one-step-equations-worksheets',difference:'Inequality signs and solution sets vs solving a single-value equation'}
];
/** R63: additional deliberately contrasted generators where source keywords
 * were wrongly mapped, or nearby user tasks need a different real tool.
 * These do NOT extend the 24 owner-V2 relations or grant indexation.
 */
export const SEO_INTENT_CONTRASTS:readonly SkillRelation[]=[
 {parent:'volume-of-rectangular-prisms-worksheets',child:'surface-area-worksheets',difference:'Volume counts cubic units inside a rectangular prism; surface area totals its exterior square-unit faces'},
 {parent:'two-digit-multiplication-worksheets',child:'two-digit-by-one-digit-multiplication-worksheets',difference:'Two-digit by two-digit column multiplication vs multiplying a two-digit factor by one digit'},
 {parent:'functions-worksheets',child:'domain-range-worksheets',difference:'Substitute into a function rule vs list domain and range or identify when a relation is a function'},
 {parent:'slope-worksheets',child:'linear-equations-worksheets',difference:'Compute slope from two ordered pairs vs plot a linear equation on a coordinate plane'},
 {parent:'area-worksheets',child:'surface-area-worksheets',difference:'Flat rectangle/square area vs three-dimensional cube or rectangular-prism exterior area'},
 {parent:'angle-worksheets',child:'printable-protractor',difference:'Identify acute/right/obtuse angles vs print and physically calibrate a 180-degree measuring protractor'}
];
export function relatedSkillTasks(slug:string){
 return [...SKILL_RELATIONS,...SEO_INTENT_CONTRASTS].filter(r=>r.parent===slug||r.child===slug)
  .map(r=>({slug:r.parent===slug?r.child:r.parent,difference:r.difference}));
}
