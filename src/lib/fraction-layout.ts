/** Conservatively recognize the supported generated fraction questions. */
export type FractionToken=
 | {kind:'fraction'; numerator:string; denominator:string}
 | {kind:'symbol'; value:string};
export type FractionLayout={tokens:FractionToken[]};
const TOPICS=new Set([
 'fractions-worksheets','equivalent-fractions-worksheets',
 'adding-unlike-fractions-worksheets','multiplying-fractions-worksheets',
 'percentages-worksheets'
]);
function asFraction(text:string):FractionToken|null{
 const match=/^(\d{1,3}|____)\/(\d{1,3}|____)$/.exec(text);
 if(!match||match[2]!=='____'&&Number(match[2])===0||
   match[1]==='____'&&match[2]==='____')return null;
 return {kind:'fraction',numerator:match[1],denominator:match[2]};
}
const sym=(value:string):FractionToken=>({kind:'symbol',value});
export function fractionLayoutFor(topic:string,question:string):FractionLayout|null{
 if(!TOPICS.has(topic))return null;
 if(topic==='percentages-worksheets'){
  const m=/^Convert (\d{1,3}\/\d{1,3}) into a percentage\.$/.exec(question);
  const one=m&&asFraction(m[1]);
  return one?{tokens:[one,sym('= ____%')]}:null;
 }
 const binary=/^(\d{1,3}\/\d{1,3}) ([+−×÷]) (\d{1,3}\/\d{1,3}) = ____$/.exec(question);
 if(binary){
  const a=asFraction(binary[1]),b=asFraction(binary[3]);
  return a&&b?{tokens:[a,sym(binary[2]),b,sym('='),sym('____')]}:null;
 }
 if(topic==='equivalent-fractions-worksheets'){
  const equal=/^(\d{1,3}\/\d{1,3}) = ((?:____|\d{1,3})\/(?:____|\d{1,3}))$/.exec(question);
  if(equal){
   const a=asFraction(equal[1]),b=asFraction(equal[2]);
   return a&&b?{tokens:[a,sym('='),b]}:null;
  }
 }
 return null;
}
/** Decorative rendering only. The original plain-text question remains. */
export function fractionMarkup(layout:FractionLayout|null):string{
 if(!layout)return '';
 const tokens=layout.tokens.map(t=>t.kind==='fraction'
  ?`<span class="stacked-frac"><span class="stacked-numerator">${t.numerator}</span><span class="stacked-denominator">${t.denominator}</span></span>`
  :`<span class="stacked-op">${t.value}</span>`).join('');
 return `<div class="stacked-equation" aria-hidden="true">${tokens}</div>`;
}
