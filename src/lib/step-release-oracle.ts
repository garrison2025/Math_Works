/** R50: independent reconstruction of the printed worked arithmetic.
 * IMPORTANT: answers are checked separately in math-release-oracle.ts.
 * This module checks steps, from the visible student question, on explicitly
 * listed topics; do not claim the unlisted step topics are re-derived.
 */
import {hasVerifiedSteps} from './capabilities.ts';
import type {Problem,Worksheet} from './math.ts';

export const INDEPENDENT_STEP_TOPICS=Object.freeze([
 'two-digit-multiplication-worksheets',
 'three-digit-by-two-digit-multiplication-worksheets',
 'two-step-equations-worksheets',
 'fractions-worksheets',
 'adding-unlike-fractions-worksheets',
 'multiplying-fractions-worksheets',
 'long-division-worksheets',
 'mean-absolute-deviation-worksheets'
] as const);
const audited=new Set<string>(INDEPENDENT_STEP_TOPICS);

function requireMatch(q:string,re:RegExp):RegExpMatchArray{
 const m=q.match(re);
 if(!m)throw Error('Worked-step audit: unrecognized student question '+q);
 return m;
}
function bgcd(a:bigint,b:bigint):bigint{
 a=a<0n?-a:a;b=b<0n?-b:b;
 while(b){const hold=a%b;a=b;b=hold;}
 return a||1n;
}
function rational(n:bigint,d:bigint):string{
 if(d===0n)throw Error('Worked-step audit: zero denominator');
 if(d<0n){n=-n;d=-d;}
 const common=bgcd(n,d);
 n/=common;d/=common;
 return d===1n?String(n):String(n)+'/'+String(d);
}
function format(n:number|string):string{return String(n);}
function expectedSteps(p:Problem):string[]{
 const q=p.payload.question;
 switch(p.topicId){
 case 'two-digit-multiplication-worksheets':{
  const m=requireMatch(q,/^(\d+) × (\d+) = ____$/);
  const a=Number(m[1]),b=Number(m[2]);
  const ones=a*(b%10),tens=a*Math.floor(b/10)*10;
  return [
   'Ones partial product: '+a+' × '+(b%10)+' = '+ones,
   'Tens partial product: '+a+' × '+Math.floor(b/10)+'0 = '+tens,
   'Add: '+ones+' + '+tens+' = '+(ones+tens)
  ];
 }
 case 'three-digit-by-two-digit-multiplication-worksheets':{
  const m=requireMatch(q,/^(\d+) × (\d+) = ____$/);
  const a=Number(m[1]),b=Number(m[2]);
  const ones=a*(b%10),tens=a*Math.floor(b/10)*10;
  return ['Partial products: '+ones+' and '+tens,
   'Sum: '+ones+'+'+tens+'='+(ones+tens)];
 }
 case 'two-step-equations-worksheets':{
  const m=requireMatch(q,/^Solve: (-?\d+)x ([+−]) (\d+) = (-?\d+)$/);
  const coef=BigInt(m[1]),constant=BigInt(m[3])*(m[2]==='−'?-1n:1n),rhs=BigInt(m[4]);
  if(coef===0n||(rhs-constant)%coef!==0n)
   throw Error('Worked-step audit: invalid two-step solution');
  const x=(rhs-constant)/coef;
  return [
   'Subtract '+constant+' from both sides: '+coef+'x = '+(rhs-constant),
   'Divide by '+coef+': x = '+x,
   'Check: '+coef+' × '+x+' + ('+constant+') = '+rhs
  ];
 }
 case 'fractions-worksheets':{
  const m=requireMatch(q,/^(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+) = ____$/);
  const n=BigInt(m[1]),d=BigInt(m[2]),v=BigInt(m[4]),e=BigInt(m[5]),op=m[3];
  if(d===0n||e===0n||(op==='÷'&&v===0n))
   throw Error('Worked-step audit: invalid fraction');
  if(op==='+'||op==='−'){
   const common=d*e/bgcd(d,e),left=n*(common/d),right=v*(common/e);
   const result=op==='+'?left+right:left-right;
   const reduced=rational(result,common);
   return [
    'Use common denominator '+common+': '+left+'/'+common+' '+op+' '+right+'/'+common,
    'Combine numerators: '+left+' '+op+' '+right+' = '+result,
    'Reduce '+result+'/'+common+' to '+reduced
   ];
  }
  if(op==='×'){
   return [
    'Multiply numerators: '+n+' × '+v+' = '+(n*v),
    'Multiply denominators: '+d+' × '+e+' = '+(d*e),
    'Reduce '+(n*v)+'/'+(d*e)+' to '+rational(n*v,d*e)
   ];
  }
  return [
   'Divide by '+v+'/'+e+' by multiplying by its reciprocal '+e+'/'+v,
   'Multiply: '+n+'/'+d+' × '+e+'/'+v+' = '+(n*e)+'/'+(d*v),
   'Reduce '+(n*e)+'/'+(d*v)+' to '+rational(n*e,d*v)
  ];
 }
 case 'adding-unlike-fractions-worksheets':{
  const m=requireMatch(q,/^(\d+)\/(\d+) \+ (\d+)\/(\d+) = ____$/);
  const n=BigInt(m[1]),d=BigInt(m[2]),v=BigInt(m[3]),e=BigInt(m[4]);
  if(d===0n||e===0n||d===e)throw Error('Worked-step audit: not unlike denominators');
  const numerator=n*e+v*d,denominator=d*e;
  return [
   'Common denominator: '+denominator,
   'Numerator: '+n+'×'+e+'+'+v+'×'+d+'='+numerator,
   'Simplify: '+rational(numerator,denominator)
  ];
 }
 case 'multiplying-fractions-worksheets':{
  const m=requireMatch(q,/^(\d+)\/(\d+) × (\d+)\/(\d+) = ____$/);
  const n=BigInt(m[1]),d=BigInt(m[2]),v=BigInt(m[3]),e=BigInt(m[4]);
  if(d===0n||e===0n)throw Error('Worked-step audit: invalid denominator');
  return [
   'Multiply numerators and denominators: '+(n*v)+'/'+(d*e),
   'Reduce: '+rational(n*v,d*e)
  ];
 }
 case 'long-division-worksheets':{
  const m=requireMatch(q,/^(\d+) ÷ (\d+) = ____ \(quotient R remainder\)$/);
  const dividend=Number(m[1]),divisor=Number(m[2]);
  if(!Number.isSafeInteger(dividend)||!Number.isSafeInteger(divisor)||divisor<2)
   throw Error('Worked-step audit: invalid long division operands');
  const steps:string[]=[];let carry=0,started=false;
  for(const [i,digitText] of [...String(dividend)].entries()){
   const digit=Number(digitText),partial=carry*10+digit,qDigit=Math.floor(partial/divisor);
   carry=partial-qDigit*divisor;
   if(!started&&qDigit===0)
    steps.push('Bring down '+digit+': '+partial+' is below '+divisor+'; use the next dividend digit.');
   else{
    started=true;
    steps.push('Step '+(i+1)+', bring down '+digit+': '+partial+' ÷ '+divisor+
     ' gives quotient digit '+qDigit+'; subtract '+(qDigit*divisor)+'; carry '+carry+'.');
   }
  }
  const quotient=Math.floor(dividend/divisor),remainder=dividend%divisor;
  if(carry!==remainder)throw Error('Worked-step audit: long division residual mismatch');
  steps.push('Check: '+divisor+' × '+quotient+' + '+remainder+' = '+dividend);
  return steps;
 }
 case 'mean-absolute-deviation-worksheets':{
  const m=requireMatch(q,/^Find the mean absolute deviation of \[([\d, ]+)\]\.$/);
  if(!/^\d+(?:, \d+)*$/.test(m[1]))throw Error('Worked-step audit: invalid MAD observations');
  const values=m[1].split(', ').map(Number),n=values.length;
  if(n<5||n>8||values.some(v=>!Number.isSafeInteger(v)))
   throw Error('Worked-step audit: invalid sample size');
  const sum=values.reduce((acc,v)=>acc+v,0);
  const deviations=values.map(v=>Math.abs(n*v-sum));
  const deviationSum=deviations.reduce((acc,v)=>acc+v,0);
  const half=Math.ceil(n/2);
  const deStrings=deviations.map(v=>rational(BigInt(v),BigInt(n)));
  const answer=rational(BigInt(deviationSum),BigInt(n*n));
  return [
   'There are '+n+' observations; mean = '+sum+'/'+n+' = '+rational(BigInt(sum),BigInt(n))+'.',
   'Absolute deviations (first group): '+deStrings.slice(0,half).join(', ')+'.',
   'Absolute deviations (remaining): '+deStrings.slice(half).join(', ')+'.',
   'Sum the absolute deviations and divide by '+n+': '+deviationSum+'/'+(n*n)+' = '+answer+'.'
  ];
 }
 default:throw Error('Worked-step audit: unsupported independent topic '+p.topicId);
 }
}

/** Called only for an authorized worked-steps PDF, after answer verification.
 * All 15 step-capable topics get structural checks; the eight explicitly listed
 * families receive an independently reconstructed full arithmetic trace.
 */
export function assertWorksheetSteps(sheet:Worksheet):void{
 if(!hasVerifiedSteps(sheet.topicId))
  throw Error('Worked-step audit: topic not authorized for worked steps');
 for(const p of sheet.problems){
  if(!Array.isArray(p.solutionSteps)||p.solutionSteps.length===0||
   p.solutionSteps.length>14||p.solutionSteps.some(step=>
    typeof step!=='string'||step.trim().length<5||
    step.length>1600||/[\u0000-\u0008\u000e-\u001f]/.test(step)||
    /\b(?:undefined|NaN|Infinity)\b/.test(step)))
   throw Error('Worked-step audit: missing, invalid or unsafe teaching step '+p.id);
  if(!audited.has(sheet.topicId))continue;
  const expected=expectedSteps(p);
  if(expected.length!==p.solutionSteps.length)
   throw Error('Worked-step audit: incorrect number of mathematical steps '+p.id);
  for(let i=0;i<expected.length;i++){
   if(p.solutionSteps[i]!==expected[i])
    throw Error('Worked-step audit: step '+(i+1)+' misstates mathematics in '+p.id+
     ' ('+sheet.topicId+')');
  }
 }
}
