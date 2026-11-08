/** V2.0 /worksheets/ library and five navigational subject directories.
 * Five original subject directories now include unique math teaching guides and\n * are owner-approved indexable pages; no keyword permutations are manufactured.
 * Every built (non-HOLD) worksheet belongs to exactly one directory.
 */
export const WORKSHEET_SECTIONS=[
 {slug:'arithmetic',title:'Arithmetic & Number Practice',
  description:'Practice operations with whole numbers and integers, place value, decimals, factors, times tables, number lines and percentages.',
  short:'Whole numbers, decimals, arithmetic facts and number sense'},
 {slug:'fractions',title:'Fraction Worksheets',
  description:'Choose a focused generator for equivalent fractions, unlike-denominator addition or fraction multiplication, or practise mixed fraction operations.',
  short:'Equivalent, adding, multiplying and mixed fraction practice'},
 {slug:'algebra',title:'Algebra & Functions',
  description:'Build equation, inequality, function, slope, domain-and-range and function-table exercises from dedicated math generators.',
  short:'Equations, inequalities, functions and graphs'},
 {slug:'geometry',title:'Geometry & Measurement',
  description:'Print exercises about angles, area, surface area, volume, coordinate planes, lines and rays, right triangles and measurement.',
  short:'Angles, shapes, graphs and geometric measurement'},
 {slug:'data-statistics',title:'Data & Statistics',
  description:'Generate plots and statistics problems about averages, medians, modes, ranges, box plots, scatter plots and mean absolute deviation.',
  short:'Averages, box plots, scatter plots and statistical data'}
] as const;
export type WorksheetSection=typeof WORKSHEET_SECTIONS[number]['slug'];
export function worksheetSectionFor(slug:string):WorksheetSection{
 if(typeof slug!=='string'||!/^[a-z0-9-]+$/.test(slug))throw Error('Invalid worksheet route slug');
 if(slug.includes('fraction'))return 'fractions';
 if(/^(scatter-plot|box-plots|mean-median-mode-range|mean-absolute-deviation)-worksheets$/.test(slug))
  return 'data-statistics';
 if(/equation|inequal|function|domain-range|slope/.test(slug))return 'algebra';
 if(/area|volume|triangle|angle|pythagorean|coordinate-plane|lines-rays-segments|protractor/.test(slug))
  return 'geometry';
 return 'arithmetic';
}
export function sectionData(slug:WorksheetSection){
 const found=WORKSHEET_SECTIONS.find(x=>x.slug===slug);
 if(!found)throw Error('Unknown V2 worksheet library section: '+slug);
 return found;
}
