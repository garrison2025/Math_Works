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
 'percentages-worksheets',
 'decimal-multiplication-worksheets',
 'scientific-notation-worksheets',
 'area-of-triangles-worksheets',
 'area-of-parallelograms-worksheets',
 'area-worksheets',
 'volume-of-rectangular-prisms-worksheets',
 'surface-area-worksheets',
 'functions-worksheets',
 'linear-equations-worksheets',
 'one-step-equations-worksheets',
 'division-worksheets',
 'coordinate-plane-worksheets',
 'function-tables-worksheets',
 'number-line-worksheets',
 'number-recognition-worksheets',
 'gcf-worksheets',
 'triangle-angle-sum-worksheets',
 'complementary-supplementary-angles-worksheets',
 'vertical-angles-worksheets',
 'angle-worksheets',
 'mean-absolute-deviation-worksheets',
 'box-plots-worksheets',
 'scatter-plot-worksheets',
 'slope-worksheets',
 'domain-range-worksheets',
 'systems-equations-worksheets'
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
/** Exact decimal representation; no binary floating point or rounding. */
function decimalParts(raw:string):[bigint,number]{
 const m=raw.match(/^(\d+)(?:\.(\d+))?$/);
 if(!m)throw Error('Math oracle: non-decimal operand');
 return [BigInt(m[1]+(m[2]??'')),(m[2]??'').length];
}
function decimalString(n:bigint,places:number):string{
 if(!Number.isInteger(places)||places<0||places>24)throw Error('Math oracle: unsafe decimal places');
 const sign=n<0n?'-':'',digits=String(abs(n)).padStart(places+1,'0');
 if(places===0)return sign+digits;
 return sign+(digits.slice(0,-places)+'.'+digits.slice(-places)).replace(/0+$/,'').replace(/\.$/,'');
}
function signedOffset(sign:string,magnitude:string):bigint{
 return BigInt(magnitude)*(sign==='−'?-1n:1n);
}
function safeInt(raw:string):number{
 const n=Number(raw);
 if(!Number.isSafeInteger(n))throw Error('Math oracle: unsafe integer');
 return n;
}
/** Reconstruct normalized scientific notation from displayed decimal digits. */
function scientificFromStandard(raw:string):string{
 if(!/^(?:\d+)(?:\.\d+)?$/.test(raw))throw Error('Math oracle: invalid standard notation');
 const dot=raw.indexOf('.'),integerPlaces=dot<0?raw.length:dot;
 const all=raw.replace('.',''),first=all.search(/[1-9]/);
 if(first<0)throw Error('Math oracle: zero has no finite normalized exponent');
 const significant=all.slice(first).replace(/0+$/,'');
 if(significant.length<2||significant.length>4)
  throw Error('Math oracle: scientific problem must have 2-4 significant figures');
 return `${significant[0]}.${significant.slice(1)} × 10^${integerPlaces-first-1}`;
}
function standardFromScientific(coefficient:string,powerRaw:string):string{
 const m=coefficient.match(/^([1-9])\.(\d{1,3})$/);
 if(!m||m[2].endsWith('0'))throw Error('Math oracle: non-normalized scientific coefficient');
 const power=safeInt(powerRaw);
 if(power< -8||power>8)throw Error('Math oracle: exponent out of supported range');
 const all=m[1]+m[2],shift=power-m[2].length,place=all.length+shift;
 if(shift>=0)return all+'0'.repeat(shift);
 return place>0?all.slice(0,place)+'.'+all.slice(place):'0.'+'0'.repeat(-place)+all;
}
/** Parse only supported integer sample listings, with bounded observation count. */
function valuesFromList(raw:string,min=2,max=16):number[]{
 if(!/^\d+(?:, \d+)*$/.test(raw))throw Error('Math oracle: invalid integer data list');
 const values=raw.split(', ').map(safeInt);
 if(values.length<min||values.length>max)throw Error('Math oracle: observation count out of bounds');
 return values;
}
/** Parse a displayed point-set string; do not read generated answer fields. */
function listedPairs(raw:string):[number,number][]{
 if(!/^\(-?\d+,-?\d+\)(?:, \(-?\d+,-?\d+\))*$/.test(raw))
  throw Error('Math oracle: invalid point relation');
 return raw.split(', ').map(part=>{
  const m=match(part,/^\((-?\d+),(-?\d+)\)$/);
  return [safeInt(m[1]),safeInt(m[2])];
 });
}
function halfValue(twoTimesValue:number):string{
 if(!Number.isSafeInteger(twoTimesValue)||twoTimesValue<0)
  throw Error('Math oracle: invalid half value');
 return halfString(twoTimesValue);
}
function medianDouble(xs:number[]):number{
 const s=[...xs].sort((a,b)=>a-b),n=s.length;
 if(n<1)throw Error('Math oracle: empty median data');
 return n%2===0?s[n/2-1]+s[n/2]:2*s[Math.floor(n/2)];
}
function twoEquationResult(a:bigint,b:bigint,c:bigint,d:bigint,r:bigint,s:bigint):string{
 const det=a*d-b*c;
 if(det===0n)
  return a*s===c*r&&b*s===d*r?'infinitely many solutions':'no solution';
 const numeratorX=r*d-b*s,numeratorY=a*s-r*c;
 if(numeratorX%det!==0n||numeratorY%det!==0n)
  throw Error('Math oracle: noninteger system solution');
 return `x = ${numeratorX/det}, y = ${numeratorY/det}`;
}
function readEquation(raw:string):[bigint,bigint,bigint]{
 const m=match(raw,/^(-?\d+)x ([+−]) (\d+)y = (-?\d+)$/);
 return [integer(m[1]),signedOffset(m[2],m[3]),integer(m[4])];
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
 case 'decimal-multiplication-worksheets':{
  const m=match(q,/^(\d+\.\d+) × (\d+\.\d+) = ____$/);
  const [a,da]=decimalParts(m[1]),[b,db]=decimalParts(m[2]);
  if(da!==db||(da!==1&&da!==2))throw Error('Math oracle: invalid decimal-factor precision');
  return decimalString(a*b,da+db);
 }
 case 'scientific-notation-worksheets':{
  const input=q.match(/^Write (\d+(?:\.\d+)?) in scientific notation\.$/);
  if(input)return scientificFromStandard(input[1]);
  const output=match(q,/^Write (\d+\.\d+) × 10\^(-?\d+) in standard form\.$/);
  return standardFromScientific(output[1],output[2]);
 }
 case 'area-of-triangles-worksheets':{
  const forward=q.match(/^Find the area of a triangle with base (\d+) and height (\d+)\.$/);
  if(forward){
   const x=safeInt(forward[1]),h=safeInt(forward[2]);
   checkDiagram(p,'triangle',[x,h]);
   return halfString(x*h);
  }
  const inverse=match(q,/^A triangle has base (\d+) and area (\d+(?:\.5)?) square units\. Find its perpendicular height\.$/);
  const x=safeInt(inverse[1]),twiceArea=parseDouble(inverse[2]);
  if(x<=0||twiceArea%x!==0)throw Error('Math oracle: impossible triangle height');
  checkDiagram(p,'triangle',[x]);
  return String(twiceArea/x);
 }
 case 'area-of-parallelograms-worksheets':{
  const forward=q.match(/^Find the area of a parallelogram with base (\d+) and perpendicular height (\d+)\.$/);
  if(forward){
   const x=safeInt(forward[1]),h=safeInt(forward[2]);
   checkDiagram(p,'parallelogram',[x,h]);
   return String(x*h);
  }
  const inverse=match(q,/^A parallelogram has base (\d+) and area (\d+) square units\. Find its perpendicular height\.$/);
  const x=safeInt(inverse[1]),area=safeInt(inverse[2]);
  if(x<=0||area%x!==0)throw Error('Math oracle: impossible parallelogram height');
  checkDiagram(p,'parallelogram',[x]);
  return String(area/x);
 }
 case 'area-worksheets':{
  const square=q.match(/^Find the area of a square with side (\d+)\.$/);
  if(square){
   const x=safeInt(square[1]);checkDiagram(p,'rectangle',[x,x]);
   if(p.diagramSpec?.labels?.[0]!=='square')throw Error('Math oracle: square diagram label mismatch');
   return String(x*x);
  }
  const rect=match(q,/^Find the area of a (\d+) by (\d+) rectangle\.$/);
  const x=safeInt(rect[1]),y=safeInt(rect[2]);
  checkDiagram(p,'rectangle',[x,y]);
  if(p.diagramSpec?.labels?.[0]!=='rectangle')throw Error('Math oracle: rectangle diagram label mismatch');
  return String(x*y);
 }
 case 'volume-of-rectangular-prisms-worksheets':{
  const inverse=q.match(/^A rectangular prism has volume (\d+) cubic units, length (\d+) and width (\d+)\. Find its height\.$/);
  if(inverse){
   const volume=safeInt(inverse[1]),length=safeInt(inverse[2]),width=safeInt(inverse[3]);
   if(length<=0||width<=0||volume%(length*width)!==0)
    throw Error('Math oracle: impossible prism height');
   checkDiagram(p,'prism',[length,width]);
   return String(volume/(length*width));
  }
  const forward=match(q,/^Find the volume of a rectangular prism (\d+) × (\d+) × (\d+)\.$/);
  const x=safeInt(forward[1]),y=safeInt(forward[2]),z=safeInt(forward[3]);
  checkDiagram(p,'prism',[x,y,z]);
  return String(x*y*z);
 }
 case 'surface-area-worksheets':{
  const cube=q.match(/^Find surface area of a cube with side (\d+)\.$/);
  if(cube){
   const x=safeInt(cube[1]);
   checkDiagram(p,'prism',[x,x,x]);
   if(p.diagramSpec?.labels?.[0]!=='cube')throw Error('Math oracle: cube drawing is not marked cube');
   return String(6*x*x);
  }
  const prism=match(q,/^Find surface area of a rectangular prism: (\d+) × (\d+) × (\d+)\.$/);
  const [x,y,z]=prism.slice(1).map(safeInt);
  checkDiagram(p,'prism',[x,y,z]);
  if(p.diagramSpec?.labels?.[0]!=='rectangular-prism')
   throw Error('Math oracle: prism drawing is mislabeled');
  return String(2*(x*y+x*z+y*z));
 }
 case 'functions-worksheets':{
  const evaluate=q.match(/^If f\(x\) = (\d+)x ([+−]) (\d+), find f\((-?\d+)\)\.$/);
  if(evaluate){
   const a=integer(evaluate[1]),b=signedOffset(evaluate[2],evaluate[3]),x=integer(evaluate[4]);
   return String(a*x+b);
  }
  const inverse=match(q,/^If f\(x\) = (\d+)x ([+−]) (\d+) and f\(x\) = (-?\d+), find x\.$/);
  const a=integer(inverse[1]),b=signedOffset(inverse[2],inverse[3]),v=integer(inverse[4]);
  if(a===0n||(v-b)%a!==0n)throw Error('Math oracle: noninteger function inverse');
  return String((v-b)/a);
 }
 case 'linear-equations-worksheets':{
  const graph=q.match(/^Graph the line y = (-?\d+)x ([+−]) (\d+) on the coordinate grid\.$/);
  if(graph){
   const m=safeInt(graph[1]),b=safeInt(graph[3])*(graph[2]==='−'?-1:1);
   checkDiagram(p,'linear-function',[m,b,0,b]);
   if(!p.diagramSpec?.labels?.includes('draw'))throw Error('Math oracle: missing blank-graph label');
   return `slope = ${m}; y-intercept = (0, ${b})`;
  }
  const evaluate=match(q,/^For y = (-?\d+)x ([+−]) (\d+), find y when x = (-?\d+)\.$/);
  const m=safeInt(evaluate[1]),b=safeInt(evaluate[3])*(evaluate[2]==='−'?-1:1),x=safeInt(evaluate[4]);
  const y=m*x+b;
  checkDiagram(p,'linear-function',[m,b,x,y]);
  if(p.diagramSpec?.labels?.includes('draw'))throw Error('Math oracle: answer graph unexpectedly marked blank');
  return String(y);
 }
 case 'one-step-equations-worksheets':{
  const addition=q.match(/^Solve: x ([+−]) (\d+) = (-?\d+)$/);
  if(addition){
   const b=signedOffset(addition[1],addition[2]),c=integer(addition[3]);
   return `x = ${c-b}`;
  }
  const multiplied=match(q,/^Solve: (-?\d+)x = (-?\d+)$/);
  const a=integer(multiplied[1]),c=integer(multiplied[2]);
  if(a===0n||c%a!==0n)throw Error('Math oracle: invalid one-step equation');
  return `x = ${c/a}`;
 }
 case 'division-worksheets':{
  const m=match(q,/^(\d+) ÷ (\d+) = ____$/);
  const a=integer(m[1]),d=integer(m[2]);
  if(d===0n||a%d!==0n)throw Error('Math oracle: inexact division fact');
  return String(a/d);
 }
 case 'coordinate-plane-worksheets':{
  const m=match(q,/^Which quadrant contains \((-?\d+), (-?\d+)\)\?$/);
  const x=safeInt(m[1]),y=safeInt(m[2]);
  if(x===0||y===0)throw Error('Math oracle: point lies on axis');
  checkDiagram(p,'coordinate',[x,y]);
  return x>0?(y>0?'I':'IV'):(y>0?'II':'III');
 }
 case 'function-tables-worksheets':{
  const m=match(q,/^Complete the input\/output table for f\(x\) = (\d+)x ([+−]) (\d+)\. Find the missing (input|output)\.$/);
  const a=safeInt(m[1]),b=safeInt(m[3])*(m[2]==='−'?-1:1),role=m[4];
  const d=p.diagramSpec;
  if(d?.kind!=='function-table'||d.values.length!==10)throw Error('Math oracle: malformed function table');
  const [coef,inter,...tail]=d.values;
  const xs=tail.slice(0,3),ys=tail.slice(3,6),position=tail[6],missingInput=tail[7];
  if(coef!==a||inter!==b||![0,1,2].includes(position)||
   missingInput!==(role==='input'?1:0)||
   !xs.every(Number.isSafeInteger)||!ys.every(Number.isSafeInteger)||
   !xs.every((v,i)=>i===0||v===xs[i-1]+1)||
   !ys.every((v,i)=>v===a*xs[i]+b))
   throw Error('Math oracle: function table contradicts visible linear function');
  return String(role==='input'?xs[position]:ys[position]);
 }
 case 'number-line-worksheets':{
  const m=match(q,/^Mark (-?\d+) on the number line\.$/);
  const n=safeInt(m[1]);
  checkDiagram(p,'numberline',[n]);
  if(p.diagramSpec?.labels?.length)throw Error('Math oracle: unexpected ray on numberline');
  return String(n);
 }
 case 'number-recognition-worksheets':{
  const words=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  if(q==='Count the dots shown below.'){
   if(p.diagramSpec?.kind!=='dots'||p.diagramSpec.values.length!==1||
    !Number.isSafeInteger(p.diagramSpec.values[0])||p.diagramSpec.values[0]<1||
    p.diagramSpec.values[0]>12)throw Error('Math oracle: invalid dot count diagram');
   return String(p.diagramSpec.values[0]);
  }
  const m=match(q,/^Write the numeral for “([a-z]+)”\.$/);
  const pos=words.indexOf(m[1]);
  if(pos<0||p.diagramSpec)throw Error('Math oracle: unrecognized number word or unexpected diagram');
  return String(pos+1);
 }
 case 'gcf-worksheets':{
  const m=match(q,/^Find the GCF of (\d+) and (\d+)\.$/);
  return String(gcd(integer(m[1]),integer(m[2])));
 }
 case 'triangle-angle-sum-worksheets':{
  const m=match(q,/^Triangle angles are (\d+)° and (\d+)°\. Find the third angle\.$/);
  const a=safeInt(m[1]),b=safeInt(m[2]),c=180-a-b;
  if(a<=0||b<=0||c<=0)throw Error('Math oracle: invalid triangle angle sum');
  checkDiagram(p,'triangle-angles',[a,b,c]);
  return `${c}°`;
 }
 case 'complementary-supplementary-angles-worksheets':{
  const m=match(q,/^Find the angle (complementary|supplementary) to (\d+)°\.$/);
  const x=safeInt(m[2]),total=m[1]==='complementary'?90:180,y=total-x;
  if(x<=0||y<=0)throw Error('Math oracle: invalid complementary/supplementary pair');
  checkDiagram(p,'angle',[x,y]);
  return `${y}°`;
 }
 case 'vertical-angles-worksheets':{
  const m=match(q,/^Intersecting lines make an angle of (\d+)°\. Find its (adjacent supplementary|vertical) angle\.$/);
  const x=safeInt(m[1]),adjacent=m[2]==='adjacent supplementary';
  if(x<=0||x>=180)throw Error('Math oracle: intersecting angle out of range');
  checkDiagram(p,'intersecting-lines',[x,adjacent?1:0]);
  return `${adjacent?180-x:x}°`;
 }
 case 'angle-worksheets':{
  const m=match(q,/^Classify a (\d+)° angle\.$/);
  const x=safeInt(m[1]);
  if(x<1||x>179)throw Error('Math oracle: unsupported angle measure');
  checkDiagram(p,'angle',[x]);
  return x<90?'acute':x===90?'right':'obtuse';
 }
 case 'mean-absolute-deviation-worksheets':{
  const m=match(q,/^Find the mean absolute deviation of \[([\d, ]+)\]\.$/);
  const values=valuesFromList(m[1],5,8),n=BigInt(values.length);
  const sum=values.reduce((a,b)=>a+BigInt(b),0n);
  const deviations=values.reduce((a,v)=>a+abs(BigInt(v)*n-sum),0n);
  return exact(deviations,n*n);
 }
 case 'box-plots-worksheets':{
  const draw=q.match(/^Draw a modified box plot for \[([\d, ]+)\]\. Use median-of-halves and 1\.5×IQR for outliers\.$/);
  const m=draw??match(q,/^Find (Q1|median|Q3|IQR|outliers) for \[([\d, ]+)\] using median-of-halves\.$/);
  const raw=draw?draw[1]:m[2],values=valuesFromList(raw,8,8);
  const order=[...values].sort((a,b)=>a-b);
  checkDiagram(p,'box-practice',values);
  const q1Twice=medianDouble(order.slice(0,4)),medianTwice=medianDouble(order),
    q3Twice=medianDouble(order.slice(4)),iqrTwice=q3Twice-q1Twice;
  const good=order.filter(v=>4*v>=2*q1Twice-3*iqrTwice&&4*v<=2*q3Twice+3*iqrTwice);
  if(good.length===0)throw Error('Math oracle: no inside-fence whiskers');
  const outliers=order.filter(v=>4*v<2*q1Twice-3*iqrTwice||4*v>2*q3Twice+3*iqrTwice);
  if(draw)
   return `Q1=${halfValue(q1Twice)}, median=${halfValue(medianTwice)}, Q3=${halfValue(q3Twice)}; whiskers=${good[0]} to ${good.at(-1)}; outliers=${outliers.join(', ')||'none'}`;
  if(m[1]==='Q1')return halfValue(q1Twice);
  if(m[1]==='median')return halfValue(medianTwice);
  if(m[1]==='Q3')return halfValue(q3Twice);
  if(m[1]==='IQR')return halfValue(iqrTwice);
  return outliers.join(', ')||'none';
 }
 case 'scatter-plot-worksheets':{
  const d=p.diagramSpec;
  if(d?.kind!=='scatter'||d.values.length!==12||
   !d.values.every(Number.isSafeInteger))throw Error('Math oracle: invalid scatter data');
  const ys:number[]=[];
  for(let i=0;i<6;i++){
   if(d.values[i*2]!==i+1||d.values[i*2+1]<0||d.values[i*2+1]>10)
    throw Error('Math oracle: wrong scatter axis or point coordinates');
   ys.push(d.values[i*2+1]);
  }
  const coordinates=ys.map((y,i)=>`(${i+1}, ${y})`).join(', ');
  if(q.startsWith('Plot these six points on the scatter grid: ')){
   if(q!==`Plot these six points on the scatter grid: ${coordinates}.`||
    d.labels?.[0]!=='plot')throw Error('Math oracle: scatter plotting instructions contradict diagram');
   return `Coordinates: ${coordinates}`;
  }
  if(q!=='Describe the overall linear trend in the scatter plot.'||
   d.labels?.[0]!=='identify')throw Error('Math oracle: scatter trend question mislabeled');
  const twiceCov=ys.reduce((sum,y,i)=>sum+(2*(i+1)-7)*y,0);
  return twiceCov===0?'no clear linear trend':twiceCov>0?'positive':'negative';
 }
 case 'slope-worksheets':{
  const m=match(q,/^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/);
  const x1=integer(m[1]),y1=integer(m[2]),x2=integer(m[3]),y2=integer(m[4]);
  checkDiagram(p,'coordinate',[Number(x1),Number(y1),Number(x2),Number(y2)]);
  if(x1===x2)return 'undefined';
  return exact(y2-y1,x2-x1);
 }
 case 'domain-range-worksheets':{
  const m=match(q,/^(?:List the (domain|range) of|Is the relation) \{([^}]+)\}(?:\.| a function\? Answer yes or no\.)$/);
  const pairs=listedPairs(m[2]),unique=(xs:number[])=>[...new Set(xs)].sort((a,b)=>a-b);
  const functionMaps=new Map<number,number>();
  let isFunction=true;
  for(const [x,y] of pairs){
   if(functionMaps.has(x)&&functionMaps.get(x)!==y)isFunction=false;
   functionMaps.set(x,y);
  }
  if(q.startsWith('Is the relation '))return isFunction?'yes':'no';
  return `{${unique(pairs.map(v=>m[1]==='domain'?v[0]:v[1])).join(', ')}}`;
 }
 case 'systems-equations-worksheets':{
  const simple=q.match(/^Solve: x \+ y = (-?\d+); x − y = (-?\d+)$/);
  if(simple){
   const plus=integer(simple[1]),minus=integer(simple[2]),xs=plus+minus,ys=plus-minus;
   if(xs%2n!==0n||ys%2n!==0n)throw Error('Math oracle: noninteger simple system');
   return `x = ${xs/2n}, y = ${ys/2n}`;
  }
  const full=match(q,/^(Solve the system:|Classify and solve the system:) ([^.]+)\.$/);
  const equations=full[2].split('; ');
  if(equations.length!==2)throw Error('Math oracle: two equations required');
  const [a,b,rhs]=readEquation(equations[0]),[c,d,rhs2]=readEquation(equations[1]);
  const result=twoEquationResult(a,b,c,d,rhs,rhs2);
  // Classify by the verified coefficient determinant, not English wording.
  // "no solution" is singular; "infinitely many solutions" is plural.
  const determinant=a*d-b*c;
  if(full[1]==='Solve the system:'&&determinant===0n)
   throw Error('Math oracle: expected a unique system, got zero determinant');
  if(full[1]==='Classify and solve the system:'&&determinant!==0n)
   throw Error('Math oracle: expected a parallel or coincident system, got nonzero determinant');
  return result;
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
