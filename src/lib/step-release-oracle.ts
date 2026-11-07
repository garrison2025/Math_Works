/** R50: independent reconstruction of the printed worked arithmetic.
 * IMPORTANT: answers are checked separately in math-release-oracle.ts.
 * This module checks steps, from the visible student question, on explicitly
 * listed topics; do not claim the unlisted step topics are re-derived.
 */
import {hasVerifiedSteps} from './capabilities.ts';
import {expectedRemainingA} from './r95-step-part-a.ts';
import {expectedRemainingB} from './r95-step-part-b.ts';
import {expectedRemainingC} from './r95-step-part-c.ts';
import {expectedRemainingD} from './r95-step-part-d.ts';
import type {Problem,Worksheet} from './math.ts';

export const INDEPENDENT_STEP_TOPICS=Object.freeze([
 'inequalities-worksheets',
 'decimal-multiplication-worksheets',
 'place-value-worksheets',
 'decimal-place-value-worksheets',
 'percentages-worksheets',
 'scientific-notation-worksheets',
 'gcf-worksheets',
 'systems-equations-worksheets',
 'functions-worksheets',
 'function-tables-worksheets',
 'linear-equations-worksheets',
 'slope-worksheets',
 'domain-range-worksheets',
 'number-recognition-worksheets',
 'number-line-worksheets',
 'coordinate-plane-worksheets',
 'area-worksheets',
 'surface-area-worksheets',
 'angle-worksheets',
 'lines-rays-segments-worksheets',
 'mean-median-mode-range-worksheets',
 'box-plots-worksheets',
 'scatter-plot-worksheets',
 'printable-protractor',
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
 'two-step-equations-worksheets',
 'fractions-worksheets',
 'adding-unlike-fractions-worksheets',
 'multiplying-fractions-worksheets',
 'long-division-worksheets',
 'mean-absolute-deviation-worksheets',
 'complementary-supplementary-angles-worksheets',
 'triangle-angle-sum-worksheets',
 'vertical-angles-worksheets',
 'volume-of-rectangular-prisms-worksheets',
 'one-step-equations-worksheets',
 'order-of-operations-worksheets',
 'equivalent-fractions-worksheets',
 'pythagorean-worksheets',
 'area-of-triangles-worksheets',
 'area-of-parallelograms-worksheets',
 'area-of-trapezoids-worksheets'
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
 case 'two-digit-by-one-digit-multiplication-worksheets':
 case 'multiplication-worksheets':
 case 'multiplication-tables-worksheets':{
  const m=requireMatch(q,/^(\d+) × (\d+) = ____$/);
  const x=BigInt(m[1]),y=BigInt(m[2]),tens=x/10n*10n,ones=x%10n,product=x*y;
  return tens>0n?[
   'Split '+x+' into '+tens+' + '+ones+'.',
   'Multiply: '+tens+' × '+y+' = '+tens*y+'; '+ones+' × '+y+' = '+ones*y+'.',
   'Add partial products: '+tens*y+' + '+ones*y+' = '+product+'.'
  ]:[
   x+' groups of '+y+' makes '+product+'.',
   'Inverse check: '+product+' ÷ '+y+' = '+x+'.'
  ];
 }
 case 'integer-operations-worksheets':{
  const division=q.match(/^(-?\d+) ÷ \((-?\d+)\) = ____$/);
  if(division){
   const dividend=BigInt(division[1]),d=BigInt(division[2]);
   if(!d||dividend%d)throw Error('Worked-step audit: integer division invalid');
   const quotient=dividend/d;
   return ['Check inverse multiplication: '+d+' × '+quotient+' = '+dividend+'.',
    'Therefore '+dividend+' ÷ ('+d+') = '+quotient+'.'];
  }
  const m=requireMatch(q,/^(-?\d+) ([+−×]) \((-?\d+)\) = ____$/);
  const x=BigInt(m[1]),y=BigInt(m[3]),op=m[2];
  const value=op==='+'?x+y:op==='−'?x-y:x*y;
  return [
   'Calculate with integer signs: '+x+' '+op+' ('+y+') = '+value+'.',
   op==='+'?'Inverse check: '+value+' − ('+y+') = '+x+'.':
    op==='−'?'Inverse check: '+value+' + ('+y+') = '+x+'.':
    y!==0n?'Inverse check: '+value+' ÷ ('+y+') = '+x+'.':
    'Zero-product check: '+x+' × 0 = 0.'
  ];
 }
 case 'addition-worksheets':{
  const m=requireMatch(q,/^(\d+) \+ (\d+) = ____$/);
  const x=Number(m[1]),y=Number(m[2]);
  if(x<100||x>999||y<100||y>999)throw Error('Worked-step audit: invalid addition digits');
  const ones=x%10+y%10,c1=Math.floor(ones/10);
  const tens=Math.floor(x/10)%10+Math.floor(y/10)%10+c1,c2=Math.floor(tens/10);
  const hundreds=Math.floor(x/100)+Math.floor(y/100)+c2;
  return [
   'Ones: '+x%10+' + '+y%10+' = '+ones+'; write '+ones%10+', carry '+c1+'.',
   'Tens: '+(Math.floor(x/10)%10)+' + '+(Math.floor(y/10)%10)+' + '+c1+' = '+tens+'; write '+tens%10+', carry '+c2+'.',
   'Hundreds and thousands: '+Math.floor(x/100)+' + '+Math.floor(y/100)+' + '+c2+' = '+hundreds+'.',
   'Combine columns: '+x+' + '+y+' = '+(x+y)+'.'
  ];
 }
 case 'subtraction-worksheets':{
  const m=requireMatch(q,/^(\d+) − (\d+) = ____$/);
  const x=Number(m[1]),y=Number(m[2]);
  if(x<300||x>999||y<100||y>x)throw Error('Worked-step audit: invalid subtraction digits');
  const b1=x%10<y%10?1:0,ones=x%10+10*b1-y%10;
  const baseTens=Math.floor(x/10)%10-b1,yTens=Math.floor(y/10)%10;
  const b2=baseTens<yTens?1:0,tens=baseTens+10*b2-yTens;
  const hundreds=Math.floor(x/100)-b2-Math.floor(y/100);
  return [
   'Ones: '+x%10+(b1?' + 10 borrowed':'')+' − '+y%10+' = '+ones+'.',
   'Tens: '+baseTens+(b2?' + 10 borrowed':'')+' − '+yTens+' = '+tens+'.',
   'Hundreds: '+Math.floor(x/100)+' − '+b2+' − '+Math.floor(y/100)+' = '+hundreds+'.',
   'Combine columns: '+x+' − '+y+' = '+(x-y)+'.'
  ];
 }
 case 'mixed-addition-subtraction-worksheets':{
  const m=requireMatch(q,/^(\d+) ([+−]) (\d+) = ____$/);
  const x=BigInt(m[1]),y=BigInt(m[3]),op=m[2],answer=op==='+'?x+y:x-y;
  return [
   'Calculate: '+x+' '+op+' '+y+' = '+answer+'.',
   op==='+'?'Inverse check: '+answer+' − '+y+' = '+x+'.':
    'Inverse check: '+answer+' + '+y+' = '+x+'.'
  ];
 }
 case 'division-worksheets':{
  const m=requireMatch(q,/^(\d+) ÷ (\d+) = ____$/);
  const dividend=BigInt(m[1]),d=BigInt(m[2]);
  if(!d||dividend%d)throw Error('Worked-step audit: invalid division question');
  const quotient=dividend/d;
  return ['Use inverse multiplication: '+d+' × '+quotient+' = '+dividend+'.',
   'Therefore '+dividend+' ÷ '+d+' = '+quotient+'.'];
 }
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
 case 'one-step-equations-worksheets':{
  const additive=q.match(/^Solve: x ([+−]) (\d+) = (-?\d+)$/);
  if(additive){
   const k=BigInt(additive[2])*(additive[1]==='−'?-1n:1n);
   const rhs=BigInt(additive[3]),x=rhs-k;
   return [
    'Subtract '+k+' from both sides',
    'x = '+x
   ];
  }
  const multiplied=requireMatch(q,/^Solve: (-?\d+)x = (-?\d+)$/);
  const k=BigInt(multiplied[1]),rhs=BigInt(multiplied[2]);
  if(!k||rhs%k!==0n)throw Error('Worked-step audit: invalid integer one-step solution');
  return ['Divide both sides by '+k,'x = '+rhs/k];
 }
 case 'order-of-operations-worksheets':{
  // Evaluate the student-facing expression with explicit precedence rather
  // than trusting the generator's "value" variable or worked lines.
  let m=q.match(/^\((\d+) \+ (\d+)\) × (\d+) − (\d+) = ____$/);
  if(m){
   const [x,y,f,sub]=m.slice(1).map(BigInt);
   return [
    'Parentheses first: '+x+' + '+y+' = '+(x+y)+'.',
    'Multiply: '+(x+y)+' × '+f+' = '+((x+y)*f)+'.',
    'Subtract '+sub+'; answer = '+((x+y)*f-sub)+'.'
   ];
  }
  m=q.match(/^(\d+) \+ (\d+) × (\d+) − (\d+) = ____$/);
  if(m){
   const [x,y,f,sub]=m.slice(1).map(BigInt);
   return [
    'Multiply first: '+y+' × '+f+' = '+(y*f)+'.',
    'Add: '+x+' + '+(y*f)+' = '+(x+y*f)+'.',
    'Subtract '+sub+'; answer = '+(x+y*f-sub)+'.'
   ];
  }
  m=q.match(/^\((\d+) \+ (\d+)\) ÷ (\d+) × (\d+) = ____$/);
  if(m){
   const [x,y,d,f]=m.slice(1).map(BigInt);
   if(!d||(x+y)%d!==0n)throw Error('Worked-step audit: non-exact grouped division');
   const quotient=(x+y)/d;
   return [
    'Parentheses: '+x+' + '+y+' = '+(x+y)+'.',
    'Division before multiplication: '+(x+y)+' ÷ '+d+' = '+quotient+'.',
    'Multiply: '+quotient+' × '+f+' = '+(quotient*f)+'.'
   ];
  }
  m=q.match(/^(\d+) \+ (\d+) ÷ (\d+) × (\d+) = ____$/);
  if(m){
   const [x,y,d,f]=m.slice(1).map(BigInt);
   if(!d||y%d!==0n)throw Error('Worked-step audit: non-exact division');
   const quotient=y/d;
   return [
    'Divide first: '+y+' ÷ '+d+' = '+quotient+'.',
    'Multiply next: '+quotient+' × '+f+' = '+(quotient*f)+'.',
    'Add: '+x+' + '+(quotient*f)+' = '+(x+quotient*f)+'.'
   ];
  }
  m=q.match(/^\((\d+) \+ (\d+)\)² − (\d+) = ____$/);
  if(m){
   const [x,y,sub]=m.slice(1).map(BigInt);
   const squared=(x+y)**2n;
   return [
    'Parentheses: '+x+' + '+y+' = '+(x+y)+'.',
    'Square: '+(x+y)+'² = '+squared+'.',
    'Subtract: '+squared+' − '+sub+' = '+(squared-sub)+'.'
   ];
  }
  m=q.match(/^(\d+) \+ (\d+)² × (\d+) = ____$/);
  if(m){
   const [x,y,f]=m.slice(1).map(BigInt);
   const power=y*y;
   return [
    'Exponent before multiplication: '+y+'² = '+power+'.',
    'Multiply: '+power+' × '+f+' = '+(power*f)+'.',
    'Add: '+x+' + '+(power*f)+' = '+(x+power*f)+'.'
   ];
  }
  throw Error('Worked-step audit: unrecognized order-of-operations expression');
 }
 case 'equivalent-fractions-worksheets':{
  const numerator=q.match(/^(\d+)\/(\d+) = ____\/(\d+)$/);
  if(numerator){
   const [n,d,newD]=numerator.slice(1).map(BigInt);
   if(!d||newD%d!==0n||newD<=d)throw Error('Worked-step audit: invalid equivalent denominator');
   const f=newD/d;
   return [
    'Multiply numerator and denominator by '+f,
    n+' × '+f+' = '+(n*f)
   ];
  }
  const denominator=requireMatch(q,/^(\d+)\/(\d+) = (\d+)\/____$/);
  const [n,d,newN]=denominator.slice(1).map(BigInt);
  if(!n||!d||newN%n!==0n||newN<=n)
   throw Error('Worked-step audit: invalid equivalent numerator');
  const f=newN/n;
  return [
   'Multiply numerator and denominator by '+f,
   d+' × '+f+' = '+(d*f)
  ];
 }
 case 'pythagorean-worksheets':{
  const hyp=q.match(/^A right triangle has legs (\d+) and (\d+)\. Find its hypotenuse\.$/);
  if(hyp){
   const [x,y]=hyp.slice(1).map(BigInt);
   const squared=x*x+y*y,c=Math.sqrt(Number(squared));
   if(!Number.isSafeInteger(c)||c<1)throw Error('Worked-step audit: invalid hypotenuse');
   return ['a² + b² = c²',
    x+'² + '+y+'² = '+squared,
    'c = '+c
   ];
  }
  const missing=requireMatch(q,/^A right triangle has hypotenuse (\d+) and one leg (\d+)\. Find the other leg\.$/);
  const c=BigInt(missing[1]),known=BigInt(missing[2]),square=c*c-known*known;
  if(square<=0n)throw Error('Worked-step audit: impossible triangle leg');
  const other=Math.sqrt(Number(square));
  if(!Number.isSafeInteger(other)||other<1||BigInt(other)**2n!==square)
   throw Error('Worked-step audit: nonintegral missing triangle leg');
  return [
   'Use a² + b² = c²; rearrange to missing leg² = '+c+'² − '+known+'²',
   'Missing leg² = '+c*c+' − '+known*known+' = '+square,
   'Take the positive square root: missing leg = '+other
  ];
 }
 case 'area-of-triangles-worksheets':{
  const area=q.match(/^Find the area of a triangle with base (\d+) and height (\d+)\.$/);
  if(area){
   const x=BigInt(area[1]),h=BigInt(area[2]),twiceArea=x*h;
   const result=twiceArea%2n===0n?String(twiceArea/2n):String(twiceArea/2n)+'.5';
   return [
    'A = ½ × base × height',
    'A = '+x+' × '+h+' ÷ 2 = '+result+' square units'
   ];
  }
  const inverse=requireMatch(q,/^A triangle has base (\d+) and area (\d+(?:\.5)?) square units\. Find its perpendicular height\.$/);
  const x=BigInt(inverse[1]),areaText=inverse[2],double=areaText.includes('.5')
   ?BigInt(areaText.slice(0,-2))*2n+1n:BigInt(areaText)*2n;
  if(!x||double%x!==0n)throw Error('Worked-step audit: impossible triangle height');
  const h=double/x;
  return ['Area = base × height / 2',
   'Height = 2 × '+areaText+' / '+x+' = '+h+' units'];
 }
 case 'area-of-parallelograms-worksheets':{
  const area=q.match(/^Find the area of a parallelogram with base (\d+) and perpendicular height (\d+)\.$/);
  if(area){
   const x=BigInt(area[1]),h=BigInt(area[2]);
   return ['A = base × height = '+(x*h)+' square units'];
  }
  const inverse=requireMatch(q,/^A parallelogram has base (\d+) and area (\d+) square units\. Find its perpendicular height\.$/);
  const x=BigInt(inverse[1]),total=BigInt(inverse[2]);
  if(!x||total%x!==0n)throw Error('Worked-step audit: impossible parallelogram height');
  return ['Area = base × perpendicular height',
   'Height = '+total+' / '+x+' = '+(total/x)+' units'];
 }
 case 'area-of-trapezoids-worksheets':{
  const area=q.match(/^A trapezoid has bases (\d+), (\d+) and height (\d+)\. Find area\.$/);
  if(area){
   const [a,b,h]=area.slice(1).map(BigInt),double=(a+b)*h;
   const result=double%2n===0n?String(double/2n):String(double/2n)+'.5';
   return ['A = (a + b) × h / 2',
    '('+a+'+'+b+')×'+h+'/2='+result+' square units'];
  }
  const inverse=requireMatch(q,/^A trapezoid has bases (\d+), (\d+) and area (\d+(?:\.5)?) square units\. Find its height\.$/);
  const a=BigInt(inverse[1]),b=BigInt(inverse[2]),areaText=inverse[3];
  const double=areaText.includes('.5')
   ?BigInt(areaText.slice(0,-2))*2n+1n:BigInt(areaText)*2n;
  if(!(a+b)||double%(a+b)!==0n)throw Error('Worked-step audit: impossible trapezoid height');
  return ['Area = (a + b) × height / 2',
   'Height = 2 × '+areaText+' / ('+a+' + '+b+') = '+(double/(a+b))+' units'];
 }

 case 'complementary-supplementary-angles-worksheets':{
  const m=requireMatch(q,/^Find the angle (complementary|supplementary) to (\d+)°\.$/);
  const x=BigInt(m[2]),total=m[1]==='complementary'?90n:180n;
  if(x<=0n||x>=total)throw Error('Worked-step audit: invalid angle relationship');
  return ['Subtract '+x+'° from '+total+'°','Answer: '+(total-x)+'°'];
 }
 case 'triangle-angle-sum-worksheets':{
  const m=requireMatch(q,/^Triangle angles are (\d+)° and (\d+)°\. Find the third angle\.$/);
  const a=BigInt(m[1]),b=BigInt(m[2]),missing=180n-a-b;
  if(a<=0n||b<=0n||missing<=0n)throw Error('Worked-step audit: impossible triangle');
  return ['Angles sum to 180°','180 − '+a+' − '+b+' = '+missing+'°'];
 }
 case 'vertical-angles-worksheets':{
  const m=requireMatch(q,/^Intersecting lines make an angle of (\d+)°\. Find its (adjacent supplementary|vertical) angle\.$/);
  const angle=BigInt(m[1]),adjacent=m[2]==='adjacent supplementary';
  if(angle<=0n||angle>=180n)throw Error('Worked-step audit: invalid intersecting angle');
  return [
   adjacent?'Angles on a straight line add to 180°':'Vertical angles are equal',
   'Answer: '+(adjacent?180n-angle:angle)+'°'
  ];
 }
 case 'volume-of-rectangular-prisms-worksheets':{
  const missing=q.match(/^A rectangular prism has volume (\d+) cubic units, length (\d+) and width (\d+)\. Find its height\.$/);
  if(missing){
   const volume=BigInt(missing[1]),length=BigInt(missing[2]),width=BigInt(missing[3]);
   if(volume<=0n||length<=0n||width<=0n||volume%(length*width)!==0n)
    throw Error('Worked-step audit: impossible prism height');
   const height=volume/(length*width);
   return ['V = length × width × height',
    'h = '+volume+' ÷ ('+length+' × '+width+') = '+height+' units'];
  }
  const m=requireMatch(q,/^Find the volume of a rectangular prism (\d+) × (\d+) × (\d+)\.$/);
  const length=BigInt(m[1]),width=BigInt(m[2]),height=BigInt(m[3]);
  if(length<=0n||width<=0n||height<=0n)throw Error('Worked-step audit: invalid prism dimensions');
  return ['V = length × width × height','V = '+(length*width*height)+' cubic units'];
 }
 default:{
  const derived=expectedRemainingA(p)??expectedRemainingB(p)??expectedRemainingC(p)??expectedRemainingD(p);
  if(derived!==null)return derived;
  throw Error('Worked-step audit: unsupported independent topic '+p.topicId);
 }
 }
}

/** Called only for an authorized worked-steps PDF, after answer verification.
 * All 51 authorized generator families receive independent full-step reconstruction.
 * Fail closed if a newly enabled step topic has no independent implementation.
 */
export function assertWorksheetSteps(sheet:Worksheet):void{
 if(!hasVerifiedSteps(sheet.topicId))
  throw Error('Worked-step audit: topic not authorized for worked steps');
 for(const p of sheet.problems){
  if(!Array.isArray(p.solutionSteps)||p.solutionSteps.length===0||
   p.solutionSteps.length>14||p.solutionSteps.some(step=>
    typeof step!=='string'||step.trim().length<5||
    step.length>1600||/[\u0000-\u0008\u000e-\u001f]/.test(step)||
    (/\b(?:NaN|Infinity)\b/.test(step)||
     (/\bundefined\b/.test(step)&&
      step!=='The denominator is zero: the line is vertical and the slope is undefined.'))))
   throw Error('Worked-step audit: missing, invalid or unsafe teaching step '+p.id);
  if(!audited.has(sheet.topicId))throw Error('Worked-step audit: unverified step topic '+sheet.topicId);
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
