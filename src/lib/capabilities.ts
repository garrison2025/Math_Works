/** Step PDFs are opt-in for independently tested math routines.
 * Addition, subtraction, multiplication, division and fractions are the five
 * explicitly audited CONDITIONAL_HUB worked-step exceptions; they stay noindex. */
const STEP_TOPICS=new Set([
 'two-digit-by-one-digit-multiplication-worksheets',
 'integer-operations-worksheets',
 'addition-worksheets',
 'subtraction-worksheets',
 'mixed-addition-subtraction-worksheets',
 'multiplication-worksheets',
 'multiplication-tables-worksheets',
 'division-worksheets',
 'two-digit-multiplication-worksheets',
 'three-digit-by-two-digit-multiplication-worksheets',
 'one-step-equations-worksheets',
 'two-step-equations-worksheets',
 'order-of-operations-worksheets',
 'equivalent-fractions-worksheets',
 'adding-unlike-fractions-worksheets',
 'multiplying-fractions-worksheets',
 'fractions-worksheets',
 'long-division-worksheets',
 'pythagorean-worksheets',
 'area-of-triangles-worksheets',
 'area-of-parallelograms-worksheets',
 'area-of-trapezoids-worksheets',
 'mean-absolute-deviation-worksheets',
 'complementary-supplementary-angles-worksheets',
 'triangle-angle-sum-worksheets',
 'vertical-angles-worksheets',
 'volume-of-rectangular-prisms-worksheets'
]);
export const hasVerifiedSteps=(topicId:string)=>STEP_TOPICS.has(topicId);
export const verifiedStepTopics=()=>[...STEP_TOPICS];
