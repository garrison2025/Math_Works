/** Topic-specific choices are part of the deterministic generator contract. */
export type TopicOptions = Record<string,string>;
export type Choice = { value:string; label:string };
export type TopicOptionDefinition = { key:string; label:string; hint:string; defaultValue:string; choices:readonly Choice[] };
const choice=(...values:string[]):Choice[]=>values.map(value=>({value,label:value.replace(/-/g,' ').replace(/^./,ch=>ch.toUpperCase())}));
const entry=(key:string,label:string,hint:string,values:readonly Choice[]):TopicOptionDefinition=>({key,label,hint,defaultValue:values[0].value,choices:values});
const mixed=(...values:string[])=>choice('mixed',...values);
export const topicOptionDefinitions:Readonly<Record<string,readonly TopicOptionDefinition[]>>={
 'integer-operations-worksheets':[entry('operation','Integer operation','Target one operation or combine all four.',mixed('addition','subtraction','multiplication','division'))],
 'one-step-equations-worksheets':[entry('operation','Equation form','Practice additive equations, multiplicative equations, or both.',mixed('addition','multiplication'))],
 'two-step-equations-worksheets':[entry('coefficient','Coefficient sign','Focus on positive or negative coefficients.',mixed('positive','negative'))],
 'inequalities-worksheets':[entry('coefficient','Coefficient sign','Negative coefficients require reversing the inequality sign.',mixed('positive','negative'))],
 'order-of-operations-worksheets':[entry('grouping','Expression grouping','Select parentheses, no parentheses, or both.',mixed('parentheses','no-parentheses'))],
 'equivalent-fractions-worksheets':[entry('missing','Missing part','Choose which part of the equivalent fraction is blank.',mixed('numerator','denominator'))],
 'fractions-worksheets':[entry('operation','Fraction operation','Choose addition, subtraction, multiplication or division.',mixed('addition','subtraction','multiplication','division')),entry('denominators','Denominator relationship','Practice equal or unequal denominator pairs for all four fraction operations.',mixed('same','unlike'))],
 'multiplication-tables-worksheets':[entry('table','Times table','Target one times table or mix all tables 1 through 12.',[{value:'mixed',label:'Mixed 1–12'},...Array.from({length:12},(_,i)=>({value:String(i+1),label:`${i+1} times table`}))])],
 'long-division-worksheets':[entry('remainder','Remainder practice','Choose exact divisions, remainders, or both.',mixed('yes','no'))],
 'mean-median-mode-range-worksheets':[entry('statistic','Statistics skill','Target one statistic or practice the full set.',mixed('mean','median','mode','range')),entry('modePattern','Data frequency pattern','Practice one mode, two modes, or no mode. Mean, median and range questions use the same varied datasets.',mixed('single','two','none'))],
 'scatter-plot-worksheets':[entry('task','Scatter task','Read a scatter plot to identify its trend, or plot six coordinate pairs on a blank grid.',choice('identify','plot')),entry('trend','Linear trend','Practice positive, negative, or no clear linear trend.',mixed('positive','negative','none'))],
 'number-line-worksheets':[entry('sign','Target number sign','Practice placing negative or positive integers.',mixed('positive','negative'))],
 'coordinate-plane-worksheets':[entry('quadrant','Quadrant','Practice a specific quadrant or all four.',[{value:'mixed',label:'Mixed quadrants'},...['I','II','III','IV'].map(value=>({value,label:`Quadrant ${value}`}))])],
 'two-digit-by-one-digit-multiplication-worksheets':[entry('regrouping','Regrouping','Choose multiplication with or without a carry.',mixed('yes','no'))],
 'addition-worksheets':[entry('regrouping','Addition carrying','Target addition with or without regrouping.',mixed('yes','no'))],
 'subtraction-worksheets':[entry('borrowing','Subtraction borrowing','Target subtraction requiring a borrow or no borrow.',mixed('yes','no'))],
 'decimal-multiplication-worksheets':[entry('places','Decimal places','Number of decimal places in each factor.',[{value:'mixed',label:'Mixed 1–2 places'},{value:'1',label:'1 place each'},{value:'2',label:'2 places each'}])],
 'multiplying-fractions-worksheets':[entry('result','Fraction result','Select a proper or improper product.',mixed('proper','improper'))],
 'place-value-worksheets':[entry('place','Place to practice','Choose which digit position to identify.',mixed('ones','tens','hundreds','thousands'))],
 'decimal-place-value-worksheets':[entry('place','Decimal place','Choose tenths, hundredths or thousandths.',mixed('tenths','hundredths','thousandths'))],
 'percentages-worksheets':[entry('direction','Percentage skill','Convert fractions and percentages, find a percent of an amount, or calculate a percentage increase/decrease.',[
  {value:'mixed',label:'Mixed percentage skills'},
  {value:'fraction-to-percent',label:'Fraction to percent'},
  {value:'percent-to-fraction',label:'Percent to fraction'},
  {value:'percent-of-number',label:'Find percent of a number'},
  {value:'percent-change',label:'Percentage increase / decrease'}
 ])],
 'scientific-notation-worksheets':[
  entry('direction','Conversion direction','Convert numbers to or from scientific notation.',mixed('to-scientific','to-standard')),
  entry('exponentSign','Exponent sign','Practice powers of ten above one, below one, or both.',mixed('positive','negative')),
  entry('significantDigits','Significant figures','Set 2, 3 or 4 significant digits in the coefficient.',[
   {value:'mixed',label:'Mixed (2–4 digits)'},{value:'2',label:'2 significant digits'},
   {value:'3',label:'3 significant digits'},{value:'4',label:'4 significant digits'}
  ])
 ],
 'functions-worksheets':[entry('task','Function task','Evaluate a function or find its input from the output.',mixed('evaluate','solve-input'))],
 'slope-worksheets':[entry('line','Line orientation','Practice vertical lines with undefined slopes or non-vertical slopes.',mixed('vertical','nonvertical'))],
 'volume-of-rectangular-prisms-worksheets':[entry('task','Prism task','Find the volume or solve for the missing height.',mixed('volume','missing-height'))],
 'box-plots-worksheets':[entry('statistic','Box plot skill','Focus on quartiles, interquartile range or outliers.',[{value:'mixed',label:'Mixed skills'},...['Q1','median','Q3','IQR','outliers','draw'].map(value=>({value,label:value==='outliers'?'Outliers':value==='draw'?'Draw modified box plot':value}))])],
 'division-worksheets':[entry('divisor','Divisor','Choose one divisor or mixed division facts.',[{value:'mixed',label:'Mixed divisors'},...Array.from({length:11},(_,i)=>i+2).map(value=>({value:String(value),label:`Divide by ${value}`}))])],
 'complementary-supplementary-angles-worksheets':[entry('relation','Angle relationship','Practice complementary, supplementary, or mixed angle pairs.',mixed('complementary','supplementary'))],
 'lines-rays-segments-worksheets':[entry('figure','Figure type','Focus on lines, rays or segments.',mixed('line','ray','segment'))],
 'gcf-worksheets':[entry('relation','Common factors','Practice relatively prime pairs or pairs with a nontrivial GCF.',mixed('coprime','shared-factor'))],
 'two-digit-multiplication-worksheets':[entry('factorRange','Factor size','Choose smaller or larger two-digit factors.',mixed('small','large'))],
 'three-digit-by-two-digit-multiplication-worksheets':[entry('multiplierRange','Multiplier size','Choose two-digit multipliers below or at least 50.',mixed('low','high'))],
 'adding-unlike-fractions-worksheets':[entry('sumType','Fraction sum','Target sums less than one or at least one.',mixed('proper','improper'))],
 'area-of-triangles-worksheets':[entry('task','Triangle task','Find the area from base and height, or the missing height from area and base.',choice('area','missing-height'))],
 'area-of-parallelograms-worksheets':[entry('task','Parallelogram task','Find the area or find an unknown perpendicular height.',choice('area','missing-height'))],
 'area-of-trapezoids-worksheets':[entry('task','Trapezoid task','Find the area or find an unknown perpendicular height.',choice('area','missing-height'))],
 'area-worksheets':[entry('shape','Area shape','Practice rectangles or squares.',choice('rectangle','square'))],
 'triangle-angle-sum-worksheets':[entry('thirdAngle','Third-angle type','Practice triangles whose missing angle is acute, right or obtuse.',mixed('acute','right','obtuse'))],
 'pythagorean-worksheets':[entry('scale','Triangle sizes','Practice smaller or larger scaled Pythagorean triples.',mixed('small','large')),entry('task','Missing side','Find the hypotenuse, the missing leg, or a mix of both.',choice('hypotenuse','missing-leg','mixed'))],
 'domain-range-worksheets':[entry('task','Identify','Find the domain or range, or determine whether the relation is a function.',mixed('domain','range','function-test')),entry('relation','Relation type','Compare a function (one output per input) with a non-function (one input has two outputs).',choice('function','not-function'))],
 'angle-worksheets':[entry('kind','Angle category','Practice acute, obtuse or mixed angle classification.',mixed('acute','obtuse'))],
 'vertical-angles-worksheets':[entry('task','Angle to find','Find a vertically opposite or an adjacent supplementary angle.',choice('vertical','adjacent'))],
 'mean-absolute-deviation-worksheets':[entry('distribution','Data pattern','Choose symmetric datasets or skewed datasets with an outlier.',choice('symmetric','skewed')),entry('size','Sample size','Practice 5, 6 or 8 observations; mixed varies the count.',[{value:'mixed',label:'Mixed (5, 6 or 8)'},...['5','6','8'].map(value=>({value,label:`${value} observations`}))])],
 'multiplication-worksheets':[entry('factors','Multiplication facts','Practice mixed, times-table or two-digit-by-one-digit products.',mixed('times-tables','two-digit-by-one-digit'))],
 'surface-area-worksheets':[entry('solid','Solid type','Find the surface area of a rectangular prism or cube.',choice('rectangular-prism','cube'))],
 'mixed-addition-subtraction-worksheets':[entry('operation','Operation','Mix addition and subtraction, or focus on one operation.',mixed('addition','subtraction'))],
 'printable-protractor':[entry('angleRange','Angle range','Focus on acute, obtuse, or mixed angles on the printed protractor.',mixed('acute','obtuse'))],
 'systems-equations-worksheets':[entry('solutions','Solution signs','Practice positive or negative integer solutions.',mixed('positive','negative')),entry('method','System form','Practice a unique solution, no solution (parallel lines), or infinitely many solutions (coincident lines).',[
  {value:'simple',label:'Simple unique solution'},
  {value:'general',label:'General elimination'},
  {value:'parallel',label:'Parallel: no solution'},
  {value:'coincident',label:'Coincident: infinitely many'}
 ])],
 'function-tables-worksheets':[entry('missing','Missing table column','Choose the first, middle or last column to complete.',choice('middle','first','last')),entry('task','Missing table value','Find an output, solve for a missing input, or mix the two types.',choice('output','input','mixed'))],
 'number-recognition-worksheets':[entry('task','Number task','Count objects or convert number words to numerals.',mixed('count-dots','word-to-numeral'))],
 'linear-equations-worksheets':[entry('slope','Slope sign','Practice positive, negative or zero slopes on a coordinate grid.',mixed('positive','negative','zero')),entry('task','Linear function task','Evaluate y at a given x or draw the line on an empty coordinate grid.',choice('evaluate','graph'))],
};
export function topicOptionsFor(topic:string):readonly TopicOptionDefinition[]{return topicOptionDefinitions[topic]??[];}
export function normalizeTopicOptions(topic:string,options:TopicOptions={}):TopicOptions {
 const defs=topicOptionsFor(topic);
 if(options===null||typeof options!=='object'||Array.isArray(options))throw new Error('Invalid topic options');
 const allowed=new Set(defs.map(d=>d.key));
 for(const key of Object.keys(options))if(!allowed.has(key))throw new Error(`Unsupported option: ${key}`);
 const output:TopicOptions={};
 for(const def of defs){const value=options[def.key]??def.defaultValue;
  if(typeof value!=='string'||!def.choices.some(c=>c.value===value))throw new Error(`Invalid ${def.label.toLowerCase()} selection`);
  output[def.key]=value;
 }
 return output;
}
export function optionsFingerprint(topic:string,difficulty:string,quantity:number,options:TopicOptions):string {
 const ordered=normalizeTopicOptions(topic,options);
 const value=JSON.stringify([topic,difficulty,quantity,ordered]);
 let hash=0x811c9dc5;
 for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),0x01000193)>>>0;
 return hash.toString(16).padStart(8,'0');
}

/** Hard cap based on the number of different questions available under narrow configurations. */
export function maxQuantityForTopic(topic:string, options:TopicOptions={}, difficulty:'easy'|'standard'|'challenge'='standard'):number {
 const value=normalizeTopicOptions(topic,options);
 // A single horizontal line is determined by its intercept (11 distinct choices);
 // restricted signed slopes yield 3 slopes x 11 intercepts (33 unique lines).
 // Leave a margin for deterministic random drawing without excessive retries.
 if(topic==='linear-equations-worksheets'&&value.task==='graph')return value.slope==='zero'?10:value.slope==='mixed'?40:30;
 if(topic==='scatter-plot-worksheets')return value.trend==='none'?10:value.trend==='mixed'?40:20;
 if(topic==='multiplication-tables-worksheets'&&value.table!=='mixed')return 12;
 if(topic==='two-digit-by-one-digit-multiplication-worksheets'&&value.regrouping==='no')return 20;
 if(topic==='division-worksheets'&&value.divisor!=='mixed')return 11;
 if(topic==='number-line-worksheets')return value.sign==='mixed'?16:9;
 if(topic==='number-recognition-worksheets')return value.task==='mixed'?20:12;
 if(topic==='surface-area-worksheets'&&value.solid==='cube')return 11;
 if(topic==='area-worksheets'&&value.shape==='square')return difficulty==='easy'?8:difficulty==='standard'?16:40;
 if(topic==='pythagorean-worksheets'&&value.scale==='small')return difficulty==='easy'?8:difficulty==='standard'?20:30;
 if(topic==='pythagorean-worksheets'&&difficulty==='easy'&&value.scale==='mixed')return 16;
 if(topic==='pythagorean-worksheets'&&difficulty==='easy'&&value.scale==='large')return 12;
 return 40;
}
