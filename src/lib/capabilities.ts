/** Step PDFs are opt-in for independently tested math routines.
 * Fractions, multiplication and division are the three explicitly certified
 * CONDITIONAL_HUB worked-step exceptions; none becomes indexable as a hub. */
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
 'mean-absolute-deviation-worksheets'
]);
export const hasVerifiedSteps=(topicId:string)=>STEP_TOPICS.has(topicId);
export const verifiedStepTopics=()=>[...STEP_TOPICS];
