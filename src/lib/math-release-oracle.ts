/** R46 independent arithmetic verification at the last PDF export boundary.
 * Parse visible question strings, recompute exact answers and fail closed.
 * These are independent of generator solve(), expectedAnswer and answerMap.
 * Coverage is deliberately explicit: other topics retain their established
 * CI oracle suites, but are NOT claimed as PDF-runtime independently checked.
 */
import type {Problem,Worksheet} from './math.ts';

export const VERIFIED_AT_PDF_BOUNDARY=Object.freeze([
 'two-step-equations-worksheets',
 'inequalities-worksheets',
 'long-division-worksheets',
 'fractions-worksheets',
 'adding-unlike-fractions-worksheets',
 'multiplying-fractions-worksheets',
 'area-of-trapezoids-worksheets',
 'pythagorean-worksheets',
 'mean-median-mode-range-worksheets',
 'percentages-worksheets'
] as const);
const verified=new Set<string>(VERIFIED_AT_PDF_BOUNDARY);
const integer=(raw:string)=>BigInt(raw);
const abs=(n:bigint)=>n<0n?-n:n;
function gcd(a:bigint,b:bigint):bigint{
 a=abs(a);b=abs(b);
 while(b!==0n){const tmp=a%b;a=b;b=tmp;}
 return a||1n;
}
function exact(n:bigint,d:bigint=1n):string{
 if(d===0n)throw Error('Math oracle: zero denominator');
 if(d<0n){n=-n;d=-d;}
 const k=gcd(n,d);n/=k;d/=k;
 return d===1n?String(n):`${n}/${d}`;
}
function halfString(double:number):string{
 if(!Number.isSafeInteger(double)||double<0)throw Error('Math oracle: unsafe half number');
 return double%2===0?String(double/2):`${Math.floor(double/2)}.5`;
}
function parseDouble(raw:string):number{
 if(!/^\d+(?:\.5)?$/.test(raw))throw Error('Math oracle: invalid half-unit number');
 return raw.includes('.')?2*Number(raw.split('.')[0])+1:2*Number(raw);
}
function match(question:string,expr:RegExp):RegExpMatchArray{
 const m=question.match(expr);
 if(!m)throw Error(`Math oracle: unrecognized question ${question}`);
 return m;
}
function checkDiagram(p:Problem,kind:string,values:readonly number[]):void{
 if(p.diagramSpec?.kind!==kind||p.diagramSpec.values.length!==values.length||
  !values.every((v,i)=>p.diagramSpec?.values[i]===v))
  throw Error(`Math oracle: mismatch between ${kind} diagram and question`);
}
function computed(p:Problem):string{
 const q=p.payload.question;
 switch(p.topicId){
 case 'two-step-equations-worksheets':{
  const m=match(q,/^Solve: (-?\d+)x ([+−]) (\d+) = (-?\d+)$/);
  const a=integer(m[1]),b=integer(m[3])*(m[2]==='−'?-1n:1n),c=integer(m[4]);
  if(a===0n||(c-b)%a!==0n)throw Error('Math oracle: equation is not uniquely integer-solvable');
  return `x = ${(c-b)/a}`;
 }
 case 'inequalities-worksheets':{
  const m=match(q,/^Solve: (-?\d+)x ([+−]) (\d+) ([<≤]) (-?\d+)$/);
  const a=integer(m[1]),b=integer(m[3])*(m[2]==='−'?-1n:1n),c=integer(m[5]);
  if(a===0n||(c-b)%a!==0n)throw Error('Math oracle: invalid inequality boundary');
  const boundary=(c-b)/a;
  const op=a<0n?(m[4]==='<'?'>':'≥'):m[4];
  checkDiagram(p,'numberline',[Number(boundary)]);
  if(p.diagramSpec?.labels?.[0]!==op)throw Error('Math oracle: inequality ray direction or endpoint wrong');
  return `x ${op} ${boundary}`;
 }
 case 'long-division-worksheets':{
  const m=match(q,/^(\d+) ÷ (\d+) = ____ \(quotient R remainder\)$/);
  const a=integer(m[1]),b=integer(m[2]);
  if(b<=0n)throw Error('Math oracle: division by zero');
  checkDiagram(p,'long-division',[Number(a),Number(b)]);
  return `${a/b} R ${a%b}`;
 }
 case 'fractions-worksheets':
 case 'adding-unlike-fractions-worksheets':
 case 'multiplying-fractions-worksheets':{
  const m=match(q,/^(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+) = ____$/);
  const n=integer(m[1]),d=integer(m[2]),v=integer(m[4]),e=integer(m[5]);
  if(d===0n||e===0n||m[3]==='÷'&&v===0n)throw Error('Math oracle: invalid fraction denominator');
  if(p.topicId==='adding-unlike-fractions-worksheets'&&(m[3]!=='+'||d===e))
   throw Error('Math oracle: unlike fraction specialization violated');
  if(p.topicId==='multiplying-fractions-worksheets'&&m[3]!=='×')
   throw Error('Math oracle: multiplication fraction specialization violated');
  if(m[3]==='+')return exact(n*e+v*d,d*e);
  if(m[3]==='−')return exact(n*e-v*d,d*e);
  if(m[3]==='×')return exact(n*v,d*e);
  return exact(n*e,d*v);
 }
 case 'area-of-trapezoids-worksheets':{
  const area= q.match(/^A trapezoid has bases (\d+), (\d+) and height (\d+)\. Find area\.$/);
  if(area){
   const [x,y,h]=area.slice(1).map(Number);
   checkDiagram(p,'trapezoid',[x,y,h]);
   return halfString((x+y)*h);
  }
  const unknown=match(q,/^A trapezoid has bases (\d+), (\d+) and area (\d+(?:\.5)?) square units\. Find its height\.$/);
  const x=Number(unknown[1]),y=Number(unknown[2]),doubleArea=parseDouble(unknown[3]);
  if(x+y===0||doubleArea%(x+y)!==0)throw Error('Math oracle: impossible trapezoid height');
  checkDiagram(p,'trapezoid',[x,y]);
  return String(doubleArea/(x+y));
 }
 case 'pythagorean-worksheets':{
  const hyp=q.match(/^A right triangle has legs (\d+) and (\d+)\. Find its hypotenuse\.$/);
  if(hyp){
   const [a,b]=hyp.slice(1).map(Number),c=Math.sqrt(a*a+b*b);
   if(!Number.isSafeInteger(c))throw Error('Math oracle: noninteger hypotenuse');
   checkDiagram(p,'right-triangle',[a,b]);
   return String(c);
  }
  const leg=match(q,/^A right triangle has hypotenuse (\d+) and one leg (\d+)\. Find the other leg\.$/);
  const c=Number(leg[1]),known=Number(leg[2]),missing=Math.sqrt(c*c-known*known);
  if(!Number.isSafeInteger(missing)||missing<=0)throw Error('Math oracle: impossible missing leg');
  if(p.diagramSpec?.kind!=='right-triangle'||p.diagramSpec.values.length!==3)
   throw Error('Math oracle: missing-leg diagram mismatch');
  const [a,b,h]=p.diagramSpec.values;
  if(h!==c||!(a===known&&b===missing||b===known&&a===missing)||
   !p.diagramSpec.labels?.some(s=>s=== (a===missing?'missing-base':'missing-vertical')))
   throw Error('Math oracle: missing-leg diagram reveals or misidentifies the answer');
  return String(missing);
 }
 case 'mean-median-mode-range-worksheets':{
  const m=match(q,/^Find the (mean|median|mode|range) of \[([\d, ]+)\]\.$/);
  const values=m[2].split(', ').map(x=>Number(x));
  if(values.length<2||values.some(n=>!Number.isSafeInteger(n)))throw Error('Math oracle: invalid statistics sample');
  const order=[...values].sort((a,b)=>a-b),total=values.reduce((a,b)=>a+BigInt(b),0n);
  if(m[1]==='mean')return exact(total,BigInt(values.length));
  if(m[1]==='median'){
   const mid=order.length/2;
   return order.length%2===0?halfString(order[mid-1]+order[mid]):String(order[Math.floor(mid)]);
  }
  if(m[1]==='range')return String(order.at(-1)!-order[0]);
  const counts=new Map<number,number>();
  for(const v of values)counts.set(v,(counts.get(v)??0)+1);
  const highest=Math.max(...counts.values());
  return highest===1?'no mode':[...counts].filter(([,count])=>count===highest).map(([value])=>value).sort((a,b)=>a-b).join(', ');
 }
 case 'percentages-worksheets':{
  const fromFraction=q.match(/^Convert (\d+)\/(\d+) into a percentage\.$/);
  if(fromFraction){
   const a=integer(fromFraction[1]),d=integer(fromFraction[2]);
   if(d===0n||1000n*a%d!==0n)throw Error('Math oracle: percentage not tenths-terminating');
   const tenths=Number(1000n*a/d);
   return `${tenths%10===0?String(tenths/10):`${Math.floor(tenths/10)}.${tenths%10}`}%`;
  }
  const toFraction=q.match(/^Convert (\d+(?:\.\d+)?)% into a fraction in simplest form\.$/);
  if(toFraction){
   const digits=toFraction[1].split('.')[1]?.length??0;
   return exact(BigInt(toFraction[1].replace('.','')),100n*10n**BigInt(digits));
  }
  const amount=q.match(/^Find (\d+)% of (\d+)\.$/);
  if(amount){
   const hundredths=integer(amount[1])*integer(amount[2]),whole=hundredths/100n,rest=hundredths%100n;
   return rest===0n?String(whole):`${whole}.${String(rest).padStart(2,'0').replace(/0$/,'')}`;
  }
  const change=match(q,/^Find the percentage (increase|decrease) from (\d+) to (\d+)\.$/);
  const from=integer(change[2]),to=integer(change[3]),delta=abs(to-from);
  if(from===0n||delta*100n%from!==0n||(change[1]==='increase'&&to<=from)||(change[1]==='decrease'&&to>=from))
   throw Error('Math oracle: invalid percent change');
  return `${delta*100n/from}%`;
 }
 default: throw Error(`Math oracle: unsupported topic ${p.topicId}`);
 }
}
/** Refuse to export a supported mathematical topic whose answer is wrong even
 * when the answerMap has been tampered with to match expectedAnswer. */
export function assertWorksheetMath(sheet:Worksheet):void{
 if(!verified.has(sheet.topicId))return;
 for(const p of sheet.problems){
  const actual=computed(p);
  if(actual!==p.expectedAnswer)
   throw Error(`Math oracle: incorrect ${p.topicId} ${p.id} answer: expected ${actual}, received ${p.expectedAnswer}`);
 }
}
