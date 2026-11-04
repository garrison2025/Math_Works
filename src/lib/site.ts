export type Route = {slug:string;tier:string;kd:number;volume:number;example:string;type:'CONDITIONAL_TOOL'|'CONDITIONAL_HUB'|'HOLD';priority:string};
export const titleFor = (slug:string) => slug === 'printable-protractor' ? 'Printable Protractor' : slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export function category(slug:string):string{
 if(/multiplication|division|addition|subtraction|fraction|integer|gcf|decimal|scientific|percentage|place-value/.test(slug))return 'Arithmetic & Numbers';
 if(/equation|function|slope|inequal|domain|linear/.test(slug))return 'Algebra & Functions';
 if(/angle|area|volume|surface|triangle|pythagorean|coordinate|protractor|line|ray/.test(slug))return 'Geometry & Graphs';
 return 'Data & Statistics';
}
export const topicIntro=(slug:string)=>{
 const names:Record<string,string>={
  'two-step-equations-worksheets':'Practice solving equations that require undoing two operations. Each sheet includes a matching answer key and worked steps.',
  'one-step-equations-worksheets':'Create addition or multiplication equations with a single unknown and a unique solution.',
  'equivalent-fractions-worksheets':'Find the missing numerator in equivalent fractions using the same scale factor on top and bottom.',
  'adding-unlike-fractions-worksheets':'Build confidence with common denominators, fraction addition and reducing exact answers.',
  'mean-median-mode-range-worksheets':'Practice the four most common ways to summarize small numerical data sets.',
  'box-plots-worksheets':'Find quartiles using the exclusive median-of-halves convention and read the five-number summary.',
  'printable-protractor':'Print a precise 180° protractor and use the included 50 mm calibration bar to verify physical scale.',
  'multiplication-tables-worksheets':'Generate new times-table facts for independent practice and quick classroom warmups.'
 };
 return names[slug] || `Create fresh ${titleFor(slug).toLowerCase()} with a reproducible question set, downloadable practice pages and separate answer keys.`;
};
export function howTo(slug:string):string[]{
 if(slug.includes('fraction'))return ['Read both numerators and denominators carefully.','Find a common denominator or simplify only when the operation requires it.','Compare your reduced fraction to the answer key.'];
 if(slug.includes('equation')||slug.includes('inequal'))return ['Identify the operation affecting the unknown.','Undo operations on both sides; reverse inequality signs when dividing by a negative.','Substitute your result to check it.'];
 if(slug.includes('area')||slug.includes('volume')||slug.includes('surface'))return ['Read the dimensions shown in the question.','Choose the appropriate area, volume or surface-area formula.','Record square or cubic units where appropriate.'];
 if(slug.includes('statistics')||slug.includes('mean')||slug.includes('box'))return ['Put the data values in order if needed.','Use the stated statistical convention to compute the result.','Check the answer and working steps.'];
 return ['Choose a difficulty and number of practice questions.','Solve the questions on your printable worksheet.','Use the separate answer key to verify each answer.'];
}
