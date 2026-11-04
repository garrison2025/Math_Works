export type TopicOptions=Record<string,string>;
export type Choice={value:string;label:string};
export type TopicOptionDefinition={key:string;label:string;hint:string;defaultValue:string;choices:readonly Choice[]};
const choices=(...values:string[]):Choice[]=>values.map(value=>({value,label:value.replace(/-/g,' ').replace(/^./,x=>x.toUpperCase())}));
const field=(key:string,label:string,hint:string,items:Choice[]):TopicOptionDefinition=>({key,label,hint,defaultValue:items[0].value,choices:items});
const mixed=(...values:string[])=>choices('mixed',...values);
export const topicOptionDefinitions:Readonly<Record<string,readonly TopicOptionDefinition[]>>={
'integer-operations-worksheets':[field('operation','Integer operation','Choose addition, subtraction, multiplication, division or all.',mixed('addition','subtraction','multiplication','division'))],
'one-step-equations-worksheets':[field('operation','Equation form','Practice additive or multiplicative equations.',mixed('addition','multiplication'))],
'two-step-equations-worksheets':[field('coefficient','Coefficient sign','Positive or negative coefficients.',mixed('positive','negative'))],
'inequalities-worksheets':[field('coefficient','Coefficient sign','Negative coefficients reverse the inequality symbol.',mixed('positive','negative'))],
'order-of-operations-worksheets':[field('grouping','Grouping','With or without parentheses.',mixed('parentheses','no-parentheses'))],
'equivalent-fractions-worksheets':[field('missing','Missing fraction part','Find a missing numerator or denominator.',mixed('numerator','denominator'))],
'fractions-worksheets':[field('operation','Fraction operation','Choose a specific fraction operation.',mixed('addition','subtraction','multiplication'))],
'multiplication-tables-worksheets':[field('table','Times table','Pick a single table or practice all 1–12.',[{value:'mixed',label:'Mixed 1–12'},...Array.from({length:12},(_,i)=>({value:String(i+1),label:String(i+1)+' times table'}))])],
'long-division-worksheets':[field('remainder','Remainder practice','With or without remainders.',mixed('yes','no'))],
'mean-median-mode-range-worksheets':[field('statistic','Statistics skill','Mean, median, mode or range.',mixed('mean','median','mode','range'))],
'scatter-plot-worksheets':[field('trend','Trend direction','Positive or negative trends.',mixed('positive','negative'))],
'number-line-worksheets':[field('sign','Target number sign','Positive or negative integers.',mixed('positive','negative'))],
'coordinate-plane-worksheets':[field('quadrant','Quadrant','Practice a specific quadrant.',[{value:'mixed',label:'Mixed quadrants'},...['I','II','III','IV'].map(value=>({value,label:'Quadrant '+value}))])]
};
export const topicOptionsFor=(topic:string):readonly TopicOptionDefinition[]=>topicOptionDefinitions[topic]??[];
export function normalizeTopicOptions(topic:string,options:TopicOptions={}):TopicOptions{
 const defs=topicOptionsFor(topic);if(options===null||typeof options!=='object'||Array.isArray(options))throw Error('Invalid topic options');
 const allowed=new Set(defs.map(d=>d.key));for(const key of Object.keys(options))if(!allowed.has(key))throw Error('Unsupported option: '+key);
 const result:TopicOptions={};for(const d of defs){const value=options[d.key]??d.defaultValue;if(typeof value!=='string'||!d.choices.some(c=>c.value===value))throw Error('Invalid '+d.label+' selection');result[d.key]=value;}return result;
}
export function optionsFingerprint(topic:string,difficulty:string,quantity:number,options:TopicOptions):string{
 const str=JSON.stringify([topic,difficulty,quantity,normalizeTopicOptions(topic,options)]);let hash=0x811c9dc5;
 for(let i=0;i<str.length;i++)hash=Math.imul(hash^str.charCodeAt(i),0x01000193)>>>0;return hash.toString(16).padStart(8,'0');
}