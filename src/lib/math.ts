/** Pure, deterministic worksheet engine. No Math.random, eval, network, or user data collection. */
import {normalizeTopicOptions,optionsFingerprint,maxQuantityForTopic,type TopicOptions} from './topic-options.ts';
import {scientificNotationPair} from './scientific-notation.ts';
export type Difficulty = 'easy' | 'standard' | 'challenge';
export type Diagram = {kind: 'triangle'|'right-triangle'|'triangle-angles'|'rectangle'|'parallelogram'|'trapezoid'|'prism'|'coordinate'|'linear-function'|'numberline'|'angle'|'protractor'|'scatter'|'box'|'box-practice'|'line'|'intersecting-lines'|'column-multiplication'|'long-division'|'clock'|'dots'|'function-table'; values: number[]; labels?: string[]};
export type Problem = {id:string;topicId:string;seed:number;optionsVersion:'1';payload:{question:string};expectedAnswer:string;solutionSteps:string[];diagramSpec?:Diagram;difficultyTags:Difficulty[];gradeTags:string[]};
export const GENERATOR_VERSION='16' as const;
export type Worksheet = {engineVersion:'1.0.0';generatorVersion:typeof GENERATOR_VERSION;seed:number;optionsHash:string;topicId:string;problems:Problem[];answerMap:{id:string;answer:string}[];layoutVersion:'1'};
export type Rational = {n:bigint;d:bigint};
const abs=(n:bigint)=>n<0n?-n:n;
const gcdB=(a:bigint,b:bigint):bigint=>b===0n?abs(a):gcdB(b,a%b);
export function rational(n:bigint,d:bigint=1n):Rational {if(d===0n)throw Error('Zero denominator'); if(d<0n){n=-n;d=-d}const g=gcdB(n,d);return {n:n/g,d:d/g}}
export const addR=(a:Rational,b:Rational)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
export const mulR=(a:Rational,b:Rational)=>rational(a.n*b.n,a.d*b.d);
export const divR=(a:Rational,b:Rational)=>rational(a.n*b.d,a.d*b.n);
export const asText=(r:Rational)=>r.d===1n?String(r.n):`${r.n}/${r.d}`;
export const gcd=(a:number,b:number):number=>b===0?Math.abs(a):gcd(b,a%b);
export class Rng {
  private state:number;
  constructor(seed:number){const s=(seed>>>0);this.state=s===0?0x6d2b79f5:s}
  next(){let x=this.state; x^=x<<13; x^=x>>>17; x^=x<<5;this.state=x>>>0;return this.state}
  int(min:number,max:number){if(!Number.isInteger(min)||!Number.isInteger(max)||max<min)throw Error('Invalid range');return min+(this.next()%(max-min+1))}
  pick<T>(xs:readonly T[]):T{return xs[this.int(0,xs.length-1)]}
}
const normal=(x:number)=>Number.isInteger(x)?String(x):String(Number(x.toFixed(6)));
const sum=(xs:number[])=>xs.reduce((a,b)=>a+b,0);
const sorted=(xs:number[])=>[...xs].sort((a,b)=>a-b);
const median=(xs:number[])=>xs.length%2?xs[(xs.length-1)/2]:(xs[xs.length/2-1]+xs[xs.length/2])/2;
const oneDigitProducts=(()=>{
 const yes:[number,number][]=[],no:[number,number][]=[],mixed:[number,number][]=[];
 for(let x=12;x<=99;x++)for(let y=2;y<=9;y++){
  const carry=(x%10)*y>=10||Math.floor(x/10)*y+Math.floor((x%10)*y/10)>=10;
  const pair:[number,number]=[x,y];mixed.push(pair);(carry?yes:no).push(pair);
 }
 return {yes,no,mixed};
})();

export function quartiles(xs:number[]){if(xs.length<4)throw Error('At least four observations');const s=sorted(xs),m=median(s),k=Math.floor(s.length/2),q1=median(s.slice(0,k)),q3=median(s.slice(s.length-k)),iqr=q3-q1;const good=s.filter(x=>x>=q1-1.5*iqr&&x<=q3+1.5*iqr);return {min:s[0],q1,median:m,q3,max:s[s.length-1],iqr,lower:good[0],upper:good[good.length-1],outliers:s.filter(x=>!good.includes(x))}}
export function solve(p:Problem):string{return p.expectedAnswer}
export function check(p:Problem,answer:string){return answer.trim().replace(/\s+/g,' ').toLowerCase()===p.expectedAnswer.trim().replace(/\s+/g,' ').toLowerCase()}
export function sampleProblem(topicId:string,seed:number,difficulty:Difficulty='standard',options:TopicOptions={}):Problem {
 const opts=normalizeTopicOptions(topicId,options);
 const r=new Rng(seed), max=difficulty==='easy'?9:difficulty==='standard'?20:50;
 const a=()=>r.int(2,max), b=()=>r.int(2,max);
 let question='',answer='',steps:string[]=[],diagram:Diagram|undefined;
 const make=(q:string,ans:string|number,...s:string[])=>{question=q;answer=String(ans);steps=s.length?s:[`Evaluate: ${q}`,`Answer: ${ans}`]};
 const m=(x:number,y:number)=>make(`${x} × ${y} = ____`,x*y,`${x} × ${y} = ${x*y}`);
 const frac=(n:number,d:number)=>asText(rational(BigInt(n),BigInt(d)));
 const signed=()=>r.int(-max,max);
 switch(topicId){
 case 'two-digit-multiplication-worksheets':{const x=r.int(opts.factorRange==='large'?50:12,opts.factorRange==='small'?49:99),y=r.int(opts.factorRange==='large'?50:12,opts.factorRange==='small'?49:99),ones=x*(y%10),tens=x*Math.floor(y/10)*10;make(`${x} × ${y} = ____`,ones+tens,`Ones partial product: ${x} × ${y%10} = ${ones}`,`Tens partial product: ${x} × ${Math.floor(y/10)}0 = ${tens}`,`Add: ${ones} + ${tens} = ${ones+tens}`);diagram={kind:'column-multiplication',values:[x,y]};break}
 case 'three-digit-by-two-digit-multiplication-worksheets':{const x=r.int(101,999),y=r.int(opts.multiplierRange==='high'?50:11,opts.multiplierRange==='low'?49:99),p=x*(y%10),q=x*Math.floor(y/10)*10;make(`${x} × ${y} = ____`,p+q,`Partial products: ${p} and ${q}`,`Sum: ${p}+${q}=${p+q}`);diagram={kind:'column-multiplication',values:[x,y]};break}
 case 'two-digit-by-one-digit-multiplication-worksheets':{
  const [x,y]=r.pick(oneDigitProducts[opts.regrouping as 'mixed'|'yes'|'no']);
  m(x,y);diagram={kind:'column-multiplication',values:[x,y]};break}

 case 'integer-operations-worksheets':{const x=signed(),y=signed()||2,op=opts.operation==='mixed'?r.pick(['+','−','×','÷']):({addition:'+',subtraction:'−',multiplication:'×',division:'÷'} as Record<string,string>)[opts.operation];if(op==='÷'){const q=r.int(-9,9),d=r.pick([-6,-5,-4,-3,-2,2,3,4,5,6]);make(`${q*d} ÷ (${d}) = ____`,q,`Division is the inverse of multiplication: ${d} × ${q} = ${q*d}`)}else make(`${x} ${op} (${y}) = ____`,op==='+'?x+y:op==='−'?x-y:x*y,`Apply integer sign rules`,`${x} ${op} (${y}) = ${op==='+'?x+y:op==='−'?x-y:x*y}`);break}
 case 'one-step-equations-worksheets':{const x=signed(),k=r.int(1,max)*(r.int(0,1)?-1:1);if((opts.operation==='mixed'?r.int(0,1):opts.operation==='addition'?1:0))make(`Solve: x ${k<0?'−':'+'} ${Math.abs(k)} = ${x+k}`,`x = ${x}`,`Subtract ${k} from both sides`,`x = ${x}`);else make(`Solve: ${k}x = ${k*x}`,`x = ${x}`,`Divide both sides by ${k}`,`x = ${x}`);break}
 case 'two-step-equations-worksheets':{const x=signed(),coef=r.pick(opts.coefficient==='mixed'?[-5,-4,-3,-2,2,3,4,5]:opts.coefficient==='positive'?[2,3,4,5]:[-5,-4,-3,-2]),k=signed(),c=coef*x+k;make(`Solve: ${coef}x ${k<0?'−':'+'} ${Math.abs(k)} = ${c}`,`x = ${x}`,`Subtract ${k} from both sides: ${coef}x = ${c-k}`,`Divide by ${coef}: x = ${x}`,`Check: ${coef} × ${x} + (${k}) = ${c}`);break}
 case 'order-of-operations-worksheets':{
  const skill=opts.skill==='mixed'?r.pick(['multiplication','division','powers']):opts.skill;
  const grouped=opts.grouping==='mixed'?r.int(0,1)===1:opts.grouping==='parentheses';
  if(skill==='multiplication'){
   const x=a(),y=b(),factor=r.int(2,8),subtract=r.int(1,9);
   const value=grouped?(x+y)*factor-subtract:x+y*factor-subtract;
   make(grouped?`(${x} + ${y}) × ${factor} − ${subtract} = ____`:`${x} + ${y} × ${factor} − ${subtract} = ____`,value,
    ...(grouped?[`Parentheses first: ${x} + ${y} = ${x+y}.`]:[`Multiply first: ${y} × ${factor} = ${y*factor}.`]),
    grouped?`Multiply: ${x+y} × ${factor} = ${(x+y)*factor}.`:`Add: ${x} + ${y*factor} = ${x+y*factor}.`,
    `Subtract ${subtract}; answer = ${value}.`);
  }else if(skill==='division'){
   const divisor=r.int(2,8),base=r.int(2,max),quotient=r.int(2,10),factor=r.int(2,6);
   const start=divisor*base,dividend=divisor*quotient;
   const value=grouped?(base+quotient)*factor:start+quotient*factor;
   make(grouped?`(${start} + ${dividend}) ÷ ${divisor} × ${factor} = ____`:`${start} + ${dividend} ÷ ${divisor} × ${factor} = ____`,value,
    grouped?`Parentheses: ${start} + ${dividend} = ${start+dividend}.`:`Divide first: ${dividend} ÷ ${divisor} = ${quotient}.`,
    grouped?`Division before multiplication: ${start+dividend} ÷ ${divisor} = ${base+quotient}.`:`Multiply next: ${quotient} × ${factor} = ${quotient*factor}.`,
    grouped?`Multiply: ${base+quotient} × ${factor} = ${value}.`:`Add: ${start} + ${quotient*factor} = ${value}.`);
  }else{
   const x=r.int(2,max),y=r.int(2,8),factor=r.int(1,9);
   const value=grouped?(x+y)**2-factor:x+y*y*factor;
   make(grouped?`(${x} + ${y})² − ${factor} = ____`:`${x} + ${y}² × ${factor} = ____`,value,
    grouped?`Parentheses: ${x} + ${y} = ${x+y}.`:`Exponent before multiplication: ${y}² = ${y*y}.`,
    grouped?`Square: ${x+y}² = ${(x+y)**2}.`:`Multiply: ${y*y} × ${factor} = ${y*y*factor}.`,
    grouped?`Subtract: ${(x+y)**2} − ${factor} = ${value}.`:`Add: ${x} + ${y*y*factor} = ${value}.`);
  }
  break;
 }
 case 'inequalities-worksheets':{const coef=r.pick(opts.coefficient==='mixed'?[-5,-4,-3,-2,2,3,4,5]:opts.coefficient==='positive'?[2,3,4,5]:[-5,-4,-3,-2]),bound=signed(),offset=r.int(0,1)?signed():0,strict=r.int(0,1)?'<':'≤';const op=coef<0?(strict==='<'?'>':'≥'):strict;make(`Solve: ${coef}x ${offset<0?'−':'+'} ${Math.abs(offset)} ${strict} ${coef*bound+offset}`,`x ${op} ${bound}`,`Subtract ${offset} from both sides`, `Divide by ${coef}; ${coef<0?'reverse':'keep'} the inequality sign`,`Solution: x ${op} ${bound}`);diagram={kind:'numberline',values:[bound],labels:[op]};break}
 case 'decimal-multiplication-worksheets':{
  const places=opts.places==='mixed'?r.int(1,2):Number(opts.places),den=10**places;
  const x=r.int(11,99),y=r.int(11,99),product=x*y;
  make(`${(x/den).toFixed(places)} × ${(y/den).toFixed(places)} = ____`,normal(product/(den*den)),
    `Multiply whole numbers: ${x} × ${y} = ${product}`,`Place ${places*2} digits after the decimal point`,`Exact decimal = ${normal(product/(den*den))}`);break}
 case 'equivalent-fractions-worksheets':{const d=r.int(3,12),n=r.int(1,d-1),f=r.int(2,7),missing=opts.missing==='mixed'?r.pick(['numerator','denominator']):opts.missing;
 if(missing==='numerator')make(`${n}/${d} = ____/${d*f}`,n*f,`Multiply numerator and denominator by ${f}`,`${n} × ${f} = ${n*f}`);
 else make(`${n}/${d} = ${n*f}/____`,d*f,`Multiply numerator and denominator by ${f}`,`${d} × ${f} = ${d*f}`);
 break}
 case 'adding-unlike-fractions-worksheets':{let d=2,e=3,n=1,v=1;
  for(let attempt=0;attempt<512;attempt++){
   d=r.int(2,9);const other=r.int(2,8);e=other>=d?other+1:other;n=r.int(1,d-1);v=r.int(1,e-1);
   const sumIsProper=n*e+v*d<d*e;
   if(opts.sumType==='mixed'||sumIsProper===(opts.sumType==='proper'))break;
   if(attempt===511)throw new Error('Unable to generate selected fraction sum');
  }
  const res=addR(rational(BigInt(n),BigInt(d)),rational(BigInt(v),BigInt(e)));make(`${n}/${d} + ${v}/${e} = ____`,asText(res),`Common denominator: ${d*e}`,`Numerator: ${n}×${e}+${v}×${d}=${n*e+v*d}`,`Simplify: ${asText(res)}`);break}
 case 'multiplying-fractions-worksheets':{
  const d=r.int(2,12),e=r.int(2,12),kind=opts.result==='mixed'?r.pick(['proper','improper']):opts.result;
  const n=kind==='proper'?r.int(1,d-1):r.int(d+1,d*2),v=kind==='proper'?r.int(1,e-1):r.int(e+1,e*2);
  const res=mulR(rational(BigInt(n),BigInt(d)),rational(BigInt(v),BigInt(e)));
  make(`${n}/${d} × ${v}/${e} = ____`,asText(res),`Multiply numerators and denominators: ${n*v}/${d*e}`,`Reduce: ${asText(res)}`);break}
 case 'fractions-worksheets':{
  const operation=opts.operation==='mixed'?r.pick(['addition','subtraction','multiplication','division']):opts.operation;
  const op=({addition:'+',subtraction:'−',multiplication:'×',division:'÷'} as Record<string,string>)[operation];
  const maxDen=difficulty==='easy'?8:difficulty==='standard'?12:20;
  const d=r.int(2,maxDen);
  const denominatorMode=opts.denominators==='mixed'?r.pick(['same','unlike']):opts.denominators;
  // Select the second denominator without rejection sampling: even the narrowest
  // unlike-denominator mode has a well-defined nonempty choice set.
  const other=r.int(2,maxDen-1);
  const e=denominatorMode==='same'?d:other>=d?other+1:other;
  const n=r.int(1,d),v=r.int(1,e);
  const left=rational(BigInt(n),BigInt(d)),right=rational(BigInt(v),BigInt(e));
  const result=operation==='addition'?addR(left,right):
    operation==='subtraction'?addR(left,rational(-right.n,right.d)):
    operation==='multiplication'?mulR(left,right):divR(left,right);
  const q=`${n}/${d} ${op} ${v}/${e} = ____`;
  if(operation==='addition'||operation==='subtraction'){
   const common=d*e/gcd(d,e),leftScaled=n*(common/d),rightScaled=v*(common/e);
   const total=operation==='addition'?leftScaled+rightScaled:leftScaled-rightScaled;
   make(q,asText(result),`Use common denominator ${common}: ${leftScaled}/${common} ${op} ${rightScaled}/${common}`,
     `Combine numerators: ${leftScaled} ${op} ${rightScaled} = ${total}`,`Reduce ${total}/${common} to ${asText(result)}`);
  }else if(operation==='multiplication'){
   make(q,asText(result),`Multiply numerators: ${n} × ${v} = ${n*v}`,
     `Multiply denominators: ${d} × ${e} = ${d*e}`,`Reduce ${n*v}/${d*e} to ${asText(result)}`);
  }else{
   make(q,asText(result),`Divide by ${v}/${e} by multiplying by its reciprocal ${e}/${v}`,
     `Multiply: ${n}/${d} × ${e}/${v} = ${n*e}/${d*v}`,
     `Reduce ${n*e}/${d*v} to ${asText(result)}`);
  }
  break}
 case 'addition-worksheets':{
  let x=0,y=0,carry=false;
  for(let attempt=0;attempt<250;attempt++){
   x=r.int(100,999);y=r.int(100,999);
   const ones=x%10+y%10,tens=Math.floor(x/10)%10+Math.floor(y/10)%10+Math.floor(ones/10);
   const hundreds=Math.floor(x/100)+Math.floor(y/100)+Math.floor(tens/10);
   carry=ones>=10||tens>=10||hundreds>=10;
   if(opts.regrouping==='mixed'||(opts.regrouping==='yes')===carry)break;
  }
  if(opts.regrouping!=='mixed'&&((opts.regrouping==='yes')!==carry))throw Error('Cannot generate addition choice');
  make(`${x} + ${y} = ____`,x+y,`Column addition gives ${x+y}`);break}
 case 'subtraction-worksheets':{
  let x=0,y=0,borrow=false;
  for(let attempt=0;attempt<250;attempt++){
   x=r.int(300,999);y=r.int(100,x);
   const onesBorrow=x%10<y%10;
   const tensBorrow=(Math.floor(x/10)%10)-(onesBorrow?1:0)<Math.floor(y/10)%10;
   borrow=onesBorrow||tensBorrow;
   if(opts.borrowing==='mixed'||(opts.borrowing==='yes')===borrow)break;
  }
  if(opts.borrowing!=='mixed'&&((opts.borrowing==='yes')!==borrow))throw Error('Cannot generate borrowing choice');
  make(`${x} − ${y} = ____`,x-y,`Column subtraction gives ${x-y}`);break}
 case 'mixed-addition-subtraction-worksheets':{const x=r.int(100,900),y=r.int(50,900),op=opts.operation==='mixed'?r.pick(['+','−']):opts.operation==='addition'?'+':'−';make(`${x} ${op} ${y} = ____`,op==='+'?x+y:x-y,`Calculate ${x} ${op} ${y}`,`Check using inverse operations`);break}
 case 'multiplication-worksheets':{const type=opts.factors==='mixed'?r.pick(['mixed','times-tables','two-digit-by-one-digit']):opts.factors; if(type==='times-tables')m(r.int(1,12),r.int(1,12));else if(type==='two-digit-by-one-digit')m(r.int(12,99),r.int(2,9));else m(a(),b());break}
 case 'multiplication-tables-worksheets':{const x=opts.table==='mixed'?r.int(1,12):Number(opts.table),y=r.int(1,12);m(x,y);break}
 case 'division-worksheets':{
  const d=opts.divisor==='mixed'?r.int(2,12):Number(opts.divisor),q=r.int(2,12);
  make(`${d*q} ÷ ${d} = ____`,q,`Because ${d} × ${q} = ${d*q}`);break}
 case 'long-division-worksheets':{const divisor=r.int(2,9),quotient=r.int(12,85),rem=opts.remainder==='no'?0:opts.remainder==='yes'?r.int(1,divisor-1):r.int(0,divisor-1),dividend=divisor*quotient+rem;let carry=0;const trace:string[]=[];for(const digit of String(dividend)){const value=carry*10+Number(digit),part=Math.floor(value/divisor);carry=value-part*divisor;trace.push(`Bring down ${digit}: ${value} ÷ ${divisor} gives ${part}; subtract ${part*divisor}, remainder ${carry}`);}make(`${dividend} ÷ ${divisor} = ____ (quotient R remainder)`,`${quotient} R ${rem}`,...trace,`Check: ${divisor}×${quotient}+${rem}=${dividend}`);diagram={kind:'long-division',values:[dividend,divisor]};break}
 case 'place-value-worksheets':{
  const x=r.int(1000,9999),place=opts.place==='mixed'?r.pick([1,10,100,1000]):({ones:1,tens:10,hundreds:100,thousands:1000} as Record<string,number>)[opts.place];
  make(`What is the value of the ${place===1?'ones':place===10?'tens':place===100?'hundreds':'thousands'} digit in ${x}?`,Math.floor(x/place)%10*place,
   `Digit: ${Math.floor(x/place)%10}`,`Place value: ${Math.floor(x/place)%10} × ${place}`);break}
 case 'decimal-place-value-worksheets':{
  const x=r.int(100,999),place=opts.place==='mixed'?r.pick([1,10,100]):({tenths:100,hundredths:10,thousandths:1} as Record<string,number>)[opts.place];
  const name=place===100?'tenths':place===10?'hundredths':'thousandths';
  make(`Find the ${name} digit in 4.${x}`,Math.floor(x/place)%10,'Digits right of decimal: tenths, hundredths, thousandths',`The ${name} digit is ${Math.floor(x/place)%10}`);break}
 case 'percentages-worksheets':{
  const den=r.pick([4,5,8,10,20,25,40,50,100]),num=r.int(1,den-1),percentage=normal(100*num/den);
  const direction=opts.direction==='mixed'?r.pick(['fraction-to-percent','percent-to-fraction','percent-of-number','percent-change']):opts.direction;
  if(direction==='fraction-to-percent'){
   make(`Convert ${num}/${den} into a percentage.`,`${percentage}%`,`Divide ${num} by ${den}, then multiply by 100%`,`Answer: ${percentage}%`);
  }else if(direction==='percent-to-fraction'){
   make(`Convert ${percentage}% into a fraction in simplest form.`,frac(num,den),`Divide ${percentage} by 100`, `Simplify to ${frac(num,den)}`);
  }else if(direction==='percent-of-number'){
   const rate=r.pick(difficulty==='easy'?[10,20,25,30,40,50,60,75,80,90,100]:difficulty==='standard'?[5,10,12,15,20,25,30,40,50,60,75,80,90,125]:[5,8,12,15,20,25,35,40,50,65,75,80,90,125,150]);
   const amount=r.int(difficulty==='easy'?10:12,difficulty==='challenge'?750: difficulty==='standard'?250:100);
   // rate and amount are exact integers. The product has at most two decimal
   // places: never round floating-point intermediates when publishing an answer.
   const hundredths=amount*rate,units=Math.floor(hundredths/100),subunits=hundredths%100;
   const result=subunits===0?String(units):`${units}.${String(subunits).padStart(2,'0').replace(/0$/,'')}`;
   make(`Find ${rate}% of ${amount}.`,result,`${rate}% means ${rate}/100`,`${amount} × ${rate}/100 = ${result}`,`Answer: ${result}`);
  }else if(direction==='percent-change'){
   // Starting values are multiples of 20, so each 5%-increment change is
   // integral and the displayed before/after amounts match the stated rate.
   const initial=r.int(5,difficulty==='challenge'?100:difficulty==='standard'?50:20)*20;
   const rate=r.pick([5,10,15,20,25,30,40,50,60,75,80,90]);
   const increasing=r.int(0,1)===1,delta=initial*rate/100;
   const final=increasing?initial+delta:initial-delta;
   const change=increasing?'increase':'decrease';
   make(`Find the percentage ${change} from ${initial} to ${final}.`,`${rate}%`,`Difference: |${final} − ${initial}| = ${delta}`,`Divide by the original value (${initial}): ${delta}/${initial}`,`Multiply by 100: ${delta}/${initial} × 100 = ${rate}%`);
  }else throw Error('Unsupported percentage practice type');
  break}
 case 'scientific-notation-worksheets':{
  const digits=opts.significantDigits==='mixed'?r.pick([2,3,4]):Number(opts.significantDigits);
  const range=difficulty==='easy'?3:difficulty==='standard'?5:8;
  const power=opts.exponentSign==='positive'?r.int(1,range):opts.exponentSign==='negative'?r.int(-range,-1):r.int(-range,range);
  const lower=10**(digits-1),upper=10**digits-1;
  // A nonzero final digit makes the written number of significant figures
  // recoverable from the standard decimal form, even for positive exponents.
  let significand=r.int(lower,upper);
  while(significand%10===0)significand=r.int(lower,upper);
  const {coefficient,standard}=scientificNotationPair(significand,digits,power);
  const direction=opts.direction==='mixed'?r.pick(['to-scientific','to-standard']):opts.direction;
  if(direction==='to-scientific')make(`Write ${standard} in scientific notation.`,`${coefficient} × 10^${power}`,`Place the decimal after the first nonzero digit: ${coefficient}`,`Count decimal places: ${Math.abs(power)}; the exponent is ${power}`,`Check: ${coefficient} × 10^${power} = ${standard}`);
  else make(`Write ${coefficient} × 10^${power} in standard form.`,standard,`Move the decimal ${Math.abs(power)} places ${power<0?'left':power>0?'right':'(zero places)'}`,`Insert any needed zeros without rounding`, `Exact standard form: ${standard}`);break}
 case 'gcf-worksheets':{
  let x=0,y=0,g=0;
  for(let attempt=0;attempt<300;attempt++){
   x=r.int(4,30);y=r.int(4,30);g=gcd(x,y);
   if(opts.relation==='mixed'||(opts.relation==='coprime'?g===1:g>1))break;
  }
  if(opts.relation!=='mixed' && (opts.relation==='coprime'?(g!==1):(g<=1)))throw Error('Cannot generate GCF choice');
  make(`Find the GCF of ${x} and ${y}.`,g,'Find common divisors',`Greatest common factor: ${g}`);break}
 case 'systems-equations-worksheets':{
  const x=r.int(opts.solutions==='positive'?1:-7,opts.solutions==='negative'?-1:7),y=r.int(opts.solutions==='positive'?1:-7,opts.solutions==='negative'?-1:7);
  if(opts.method==='general'){
   // Construct two different equations from the known integer intersection. The
   // nonzero determinant guarantees a unique solution, without floating point.
   const coef=()=>r.int(2,6)*(r.int(0,1)?1:-1);
   let a=2,b=3,c=3,d=2,det=0;
   for(let tries=0;tries<100;tries++){
    a=coef();b=coef();c=coef();d=coef();det=a*d-b*c;
    if(det!==0)break;
   }
   if(det===0)throw Error('Cannot construct a unique linear system');
   const s=a*x+b*y,t=c*x+d*y,sign=(n:number)=>n<0?'−':'+';
   make(`Solve the system: ${a}x ${sign(b)} ${Math.abs(b)}y = ${s}; ${c}x ${sign(d)} ${Math.abs(d)}y = ${t}.`,
    `x = ${x}, y = ${y}`,
    `Eliminate y: multiply the first equation by ${d} and the second by ${b}, then subtract.`,
    `(${a} × ${d} − ${b} × ${c})x = ${s} × ${d} − ${t} × ${b}`,
    `${det}x = ${s*d-t*b}; x = ${x}`,
    `Substitute into ${a}x ${sign(b)} ${Math.abs(b)}y = ${s}: y = ${y}`,
    `Check both: ${a*x+b*y} = ${s} and ${c*x+d*y} = ${t}`);
  }else if(opts.method==='parallel'||opts.method==='coincident'){
   // The second equation has proportional coefficients (determinant zero).
   // Equal proportional constants => same line (infinite solutions).
   // Different proportional constants => parallel lines (no solution).
   const coef=()=>r.int(1,6)*(r.int(0,1)?1:-1);
   const a=coef(),b=coef(),factor=r.pick([-4,-3,-2,2,3,4]);
   const c=a*x+b*y,offset=opts.method==='parallel'?(r.int(1,9)*(r.int(0,1)?1:-1)):0;
   const d=a*factor,e=b*factor,f=c*factor+offset;
   const eq=(u:number,v:number,w:number)=>`${u}x ${v<0?'−':'+'} ${Math.abs(v)}y = ${w}`;
   const status=opts.method==='parallel'?'no solution':'infinitely many solutions';
   make(`Classify and solve the system: ${eq(a,b,c)}; ${eq(d,e,f)}.`,status,
    `The x and y coefficients of the second equation are ${factor} times those of the first.`,
    `Multiplying the first equation by ${factor} yields ${eq(d,e,c*factor)}.`,
    opts.method==='parallel'?`The second equation instead has right-hand side ${f}, so the equations are inconsistent.`:'The two equations are identical after multiplication and describe the same line.',
    `Conclusion: ${status}.`);
  }else make(`Solve: x + y = ${x+y}; x − y = ${x-y}`,`x = ${x}, y = ${y}`,`Add equations: 2x = ${(x+y)+(x-y)}`,`x = ${x}`,`Substitute to find y = ${y}`);
  break}

 case 'functions-worksheets':{
  const coeff=r.int(2,8),inter=r.int(-8,8),x=r.int(-5,8),value=coeff*x+inter;
  const expression=`${coeff}x ${inter<0?'−':'+'} ${Math.abs(inter)}`;
  const task=opts.task==='mixed'?r.pick(['evaluate','solve-input']):opts.task;
  if(task==='evaluate')make(`If f(x) = ${expression}, find f(${x}).`,value,`Substitute x = ${x}`,`${coeff} × ${x} + (${inter}) = ${value}`);
  else make(`If f(x) = ${expression} and f(x) = ${value}, find x.`,x,`Subtract ${inter}: ${coeff}x = ${value-inter}`,`Divide by ${coeff}: x = ${x}`);break}
 case 'function-tables-worksheets':{
  const coeff=r.int(2,8),inter=r.int(-8,8),x=r.int(-4,8),inputs=[x-1,x,x+1],outputs=inputs.map(v=>coeff*v+inter);
  const position=opts.missing==='first'?0:opts.missing==='last'?2:1;
  const task=opts.task==='mixed'?r.pick(['input','output']):opts.task;
  const expression=`${coeff}x ${inter<0?'−':'+'} ${Math.abs(inter)}`;
  if(task==='output'){
   make(`Complete the input/output table for f(x) = ${expression}. Find the missing output.`,outputs[position],
    `Use the known input x = ${inputs[position]}.`,
    `f(${inputs[position]}) = ${coeff} × ${inputs[position]} + (${inter}) = ${outputs[position]}.`);
  }else{
   make(`Complete the input/output table for f(x) = ${expression}. Find the missing input.`,inputs[position],
    `Set ${coeff}x + (${inter}) = ${outputs[position]}.`,
    `Subtract ${inter} from both sides: ${coeff}x = ${outputs[position]-inter}.`,
    `Divide by ${coeff}: x = ${inputs[position]}.`);
  }
  diagram={kind:'function-table',values:[coeff,inter,...inputs,...outputs,position,task==='input'?1:0]};
  break;
 }
 case 'linear-equations-worksheets':{
  const graph=opts.task==='graph';
  // Keep existing evaluation seeds stable; graph mode uses smaller coefficients
  // so pupils can plot the intercept and a second integer point on the grid.
  const slope=opts.slope==='mixed'?r.int(graph?-3:-5,graph?3:5):opts.slope==='positive'?r.int(1,graph?3:5):opts.slope==='negative'?-r.int(1,graph?3:5):0;
  const inter=r.int(graph?-5:-9,graph?5:9),x=graph?0:r.int(-5,5);
  const equation=`y = ${slope}x ${inter<0?'−':'+'} ${Math.abs(inter)}`;
  if(graph){
   make(`Graph the line ${equation} on the coordinate grid.`,
    `slope = ${slope}; y-intercept = (0, ${inter})`,
    `Plot the y-intercept at (0, ${inter}).`,
    `Use slope ${slope}: from (0, ${inter}) to (1, ${slope+inter}).`,
    `Draw a straight line through both points.`);
   diagram={kind:'linear-function',values:[slope,inter,0,inter],labels:['draw']};
  }else{
   make(`For ${equation}, find y when x = ${x}.`,slope*x+inter,`y = ${slope}×${x} + (${inter})`,`y = ${slope*x+inter}`);
   diagram={kind:'linear-function',values:[slope,inter,x,slope*x+inter]};
  }
  break;
 }
 case 'slope-worksheets':{
  const x1=r.int(-4,2),vertical=opts.line==='mixed'?r.int(0,4)===0:opts.line==='vertical';
  const x2=vertical?x1:r.int(3,8),y1=r.int(-6,6),slope=r.int(-4,4),y2=vertical?y1+r.int(1,7):y1+slope*(x2-x1);
  make(`Find the slope through (${x1}, ${y1}) and (${x2}, ${y2}).`,vertical?'undefined':String(slope),
    'm = (y2 − y1) / (x2 − x1)',vertical?'The denominator is zero: the line is vertical and the slope is undefined.':`m = (${y2}−(${y1}))/(${x2}−(${x1})) = ${slope}`);
  diagram={kind:'coordinate',values:[x1,y1,x2,y2]};break}
 case 'domain-range-worksheets':{
  const xs=[r.int(1,5),r.int(6,9),r.int(10,13)],ys=[r.int(1,5),r.int(6,9),r.int(10,13)];
  // A non-function deliberately maps the same input to two DIFFERENT outputs.
  // Domain/range are sets: repeated values must be listed only once.
  if(opts.relation==='not-function'){xs.push(xs[0]);ys.push(r.int(14,18));}
  const points=xs.map((x,i)=>`(${x},${ys[i]})`).join(', '),task=opts.task==='mixed'?r.pick(['domain','range']):opts.task;
  const unique=(items:number[])=>[...new Set(items)].sort((a,b)=>a-b);
  if(task==='domain')make(`List the domain of {${points}}.`,`{${unique(xs).join(', ')}}`,`Domain = the set of distinct x-values; list each input once.`);
  else if(task==='range')make(`List the range of {${points}}.`,`{${unique(ys).join(', ')}}`,`Range = the set of distinct y-values; list each output once.`);
  else make(`Is the relation {${points}} a function? Answer yes or no.`,opts.relation==='function'?'yes':'no',
   `A relation is a function only if each distinct input maps to exactly one output.`,
   opts.relation==='function'?'All input values are distinct, so the relation is a function.':`The input ${xs[0]} maps to both ${ys[0]} and ${ys[3]}, so it is not a function.`);
  break}

 case 'number-recognition-worksheets':{const n=r.int(1,12),type=opts.task==='mixed'?r.pick(['count-dots','word-to-numeral']):opts.task;
  if(type==='word-to-numeral'){
   const words=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
   make(`Write the numeral for “${words[n-1]}”.`,n,`The word “${words[n-1]}” represents the number ${n}`);
  }else{make('Count the dots shown below.',n,`Count each dot once: ${n}`);diagram={kind:'dots',values:[n]};}break}
 case 'number-line-worksheets':{const n=opts.sign==='mixed'?r.int(-9,9):opts.sign==='positive'?r.int(1,9):r.int(-9,-1);make(`Mark ${n} on the number line.`,String(n),n===0?'Zero is the origin':`${n<0?'Left':'Right'} of zero for ${n<0?'negative':'positive'} numbers`);diagram={kind:'numberline',values:[n]};break}
 case 'coordinate-plane-worksheets':{const preferred=opts.quadrant==='mixed'?r.pick(['I','II','III','IV']):opts.quadrant;const a=r.int(1,8),b=r.int(1,8),x=preferred==='I'||preferred==='IV'?a:-a,y=preferred==='I'||preferred==='II'?b:-b;const quad=x>0?(y>0?'I':'IV'):(y>0?'II':'III');make(`Which quadrant contains (${x}, ${y})?`,quad,`x is ${x>0?'positive':'negative'} and y is ${y>0?'positive':'negative'}`,`Quadrant ${quad}`);diagram={kind:'coordinate',values:[x,y]};break}
 case 'pythagorean-worksheets':{
  const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41],[12,35,37],[20,21,29],[11,60,61],[28,45,53],[33,56,65],[16,63,65]];
  const pool=difficulty==='easy'?triples.slice(0,3):difficulty==='standard'?triples.slice(0,9):triples;
  const k=opts.scale==='small'?r.int(1,3):opts.scale==='large'?r.int(4,8):r.int(1,difficulty==='challenge'?8:6);
  const [x,y,z]=r.pick(pool).map(v=>v*k);
  const task=opts.task==='mixed'?r.pick(['hypotenuse','missing-leg']):opts.task;
  if(task==='missing-leg'){
   const missing=r.pick(['base','vertical']),unknown=missing==='base'?x:y,known=missing==='base'?y:x;
   make(`A right triangle has hypotenuse ${z} and one leg ${known}. Find the other leg.`,unknown,
    `Use a² + b² = c²; rearrange to missing leg² = ${z}² − ${known}²`,
    `Missing leg² = ${z*z} − ${known*known} = ${unknown*unknown}`,
    `Take the positive square root: missing leg = ${unknown}`);
   diagram={kind:'right-triangle',values:[x,y,z],labels:[missing==='base'?'missing-base':'missing-vertical']};
  }else{
   make(`A right triangle has legs ${x} and ${y}. Find its hypotenuse.`,z,`a² + b² = c²`,`${x}² + ${y}² = ${z*z}`,`c = ${z}`);
   diagram={kind:'right-triangle',values:[x,y]};
  }
  break;
 }
 case 'area-of-triangles-worksheets':{const x=r.int(4,20),y=r.int(2,20),area=normal(x*y/2);
  if(opts.task==='missing-height')make(`A triangle has base ${x} and area ${area} square units. Find its perpendicular height.`,y,'Area = base × height / 2',`Height = 2 × ${area} / ${x} = ${y} units`);
  else make(`Find the area of a triangle with base ${x} and height ${y}.`,area,'A = ½ × base × height',`A = ${x} × ${y} ÷ 2 = ${area} square units`);
  diagram={kind:'triangle',values:opts.task==='missing-height'?[x]:[x,y]};break}
 case 'area-of-parallelograms-worksheets':{const x=a(),y=b();
  if(opts.task==='missing-height')make(`A parallelogram has base ${x} and area ${x*y} square units. Find its perpendicular height.`,y,'Area = base × perpendicular height',`Height = ${x*y} / ${x} = ${y} units`);
  else make(`Find the area of a parallelogram with base ${x} and perpendicular height ${y}.`,x*y,`A = base × height = ${x*y} square units`);
  diagram={kind:'parallelogram',values:opts.task==='missing-height'?[x]:[x,y]};break}
 case 'area-of-trapezoids-worksheets':{const x=a(),y=b(),h=r.int(2,16),area=normal((x+y)*h/2);
  if(opts.task==='missing-height')make(`A trapezoid has bases ${x}, ${y} and area ${area} square units. Find its height.`,h,'Area = (a + b) × height / 2',`Height = 2 × ${area} / (${x} + ${y}) = ${h} units`);
  else make(`A trapezoid has bases ${x}, ${y} and height ${h}. Find area.`,area,'A = (a + b) × h / 2',`(${x}+${y})×${h}/2=${area} square units`);
  diagram={kind:'trapezoid',values:opts.task==='missing-height'?[x,y]:[x,y,h]};break}
 case 'area-worksheets':{const x=a(),y=opts.shape==='square'?x:b();
  if(opts.shape==='square')make(`Find the area of a square with side ${x}.`,x*x,`Area = side × side = ${x*x} square units`);
  else make(`Find the area of a ${x} by ${y} rectangle.`,x*y,`Area = length × width = ${x*y} square units`);
  diagram={kind:'rectangle',values:[x,y],labels:[opts.shape]};break}
 case 'volume-of-rectangular-prisms-worksheets':{
  const x=r.int(2,12),y=r.int(2,12),z=r.int(2,12);
  const task=opts.task==='mixed'?r.pick(['volume','missing-height']):opts.task;
  if(task==='missing-height')make(`A rectangular prism has volume ${x*y*z} cubic units, length ${x} and width ${y}. Find its height.`,z,
    'V = length × width × height',`h = ${x*y*z} ÷ (${x} × ${y}) = ${z} units`);
  else make(`Find the volume of a rectangular prism ${x} × ${y} × ${z}.`,x*y*z,'V = length × width × height',`V = ${x*y*z} cubic units`);
  diagram={kind:'prism',values:task==='missing-height'?[x,y]:[x,y,z]};break}
 case 'surface-area-worksheets':{const x=r.int(2,12),y=opts.solid==='cube'?x:r.int(2,12),candidate=r.int(2,11),z=opts.solid==='cube'?x:y===x?(candidate>=x?candidate+1:candidate):r.int(2,12);
  make(opts.solid==='cube'?`Find surface area of a cube with side ${x}.`:`Find surface area of a rectangular prism: ${x} × ${y} × ${z}.`,2*(x*y+x*z+y*z),opts.solid==='cube'?'Cube surface area = 6 × side²':'SA = 2(lw + lh + wh)',`Surface area = ${2*(x*y+x*z+y*z)} square units`);
  diagram={kind:'prism',values:[x,y,z],labels:[opts.solid]};break}
 case 'triangle-angle-sum-worksheets':{
  const z=opts.thirdAngle==='acute'?r.int(20,89):opts.thirdAngle==='right'?90:opts.thirdAngle==='obtuse'?r.int(91,139):r.int(20,139);
  const x=r.int(20,160-z),y=180-z-x;make(`Triangle angles are ${x}° and ${y}°. Find the third angle.`,`${z}°`,`Angles sum to 180°`,`180 − ${x} − ${y} = ${z}°`);diagram={kind:'triangle-angles',values:[x,y,z]};break}
 case 'complementary-supplementary-angles-worksheets':{
  const relation=opts.relation==='mixed'?r.pick(['complementary','supplementary']):opts.relation;
  const total=relation==='complementary'?90:180,x=r.int(15,total-15),y=total-x;
  make(`Find the angle ${relation} to ${x}°.`,`${y}°`,`Subtract ${x}° from ${total}°`,`Answer: ${y}°`);
  diagram={kind:'angle',values:[x,y]};break}
 case 'angle-worksheets':{const deg=opts.kind==='acute'?r.int(1,89):opts.kind==='obtuse'?r.int(91,179):r.int(0,12)===0?90:r.int(1,179);const name=deg<90?'acute':deg===90?'right':'obtuse';make(`Classify a ${deg}° angle.`,name,`Acute <90°, right =90°, obtuse >90° and <180°`);diagram={kind:'angle',values:[deg]};break}
 case 'vertical-angles-worksheets':{const deg=r.int(20,160),adjacent=opts.task==='adjacent',answer=adjacent?180-deg:deg;
  make(`Intersecting lines make an angle of ${deg}°. Find its ${adjacent?'adjacent supplementary':'vertical'} angle.`,`${answer}°`,adjacent?'Angles on a straight line add to 180°':'Vertical angles are equal',`Answer: ${answer}°`);
  diagram={kind:'intersecting-lines',values:[deg,adjacent?1:0]};break}
 case 'lines-rays-segments-worksheets':{
  const kind=opts.figure==='mixed'?r.pick(['line','ray','segment']):opts.figure;
  const left=String.fromCharCode(65+r.int(0,10)),right=String.fromCharCode(77+r.int(0,10));
  make('Identify the pictured figure: line, ray, or segment.',kind,
   'A line extends infinitely in both directions; a ray starts at one endpoint; a segment has two endpoints.',`The figure is a ${kind}.`);
  diagram={kind:'line',values:[kind==='line'?2:kind==='ray'?1:0],labels:[left,right]};break}
 case 'mean-median-mode-range-worksheets':{
  const task=opts.statistic==='mixed'?r.pick(['mean','median','mode','range']):opts.statistic;
  const pattern=opts.modePattern==='mixed'?r.pick(['single','two','none']):opts.modePattern;
  const count=r.int(5,difficulty==='easy'?6:difficulty==='standard'?8:9);
  // Draw distinct source values, then deliberately repeat only the requested modes.
  // This prevents accidental third modes and creates even/odd sample sizes.
  const distinctCount=pattern==='none'?count:count-2,distinct=new Set<number>();
  const upper=difficulty==='easy'?25:difficulty==='standard'?55:95;
  while(distinct.size<distinctCount)distinct.add(r.int(1,upper));
  const initial=[...distinct];
  const values=sorted([...initial,...(pattern==='single'?[initial[0],initial[0]]:pattern==='two'?[initial[0],initial[1]]:[])]);
  const total=sum(values),counts=new Map<number,number>();
  for(const value of values)counts.set(value,(counts.get(value)??0)+1);
  const highest=Math.max(...counts.values()),modes=highest===1?[]:[...counts].filter(([,frequency])=>frequency===highest).map(([value])=>value).sort((x,y)=>x-y);
  const mean=asText(rational(BigInt(total),BigInt(values.length)));
  const mid=median(values),modeAnswer=modes.length?modes.join(', '):'no mode';
  const answer=task==='mean'?mean:task==='median'?normal(mid):task==='mode'?modeAnswer:String(values.at(-1)!-values[0]);
  const how=task==='mean'?`Sum ${total} divided by ${values.length} = ${mean} (exact)`:
   task==='median'?values.length%2?`The middle observation is ${normal(mid)}.`:`The two middle observations are ${values[values.length/2-1]} and ${values[values.length/2]}; their mean is ${normal(mid)}.`:
   task==='mode'?modes.length?`Most frequent (${highest} times): ${modeAnswer}.`:'Every value appears exactly once, so there is no mode.':
   `Maximum ${values.at(-1)} minus minimum ${values[0]} = ${answer}.`;
  make(`Find the ${task} of [${values.join(', ')}].`,answer,
   `There are ${values.length} values, ordered from least to greatest.`,how,`Answer: ${answer}`);
  break}
 case 'mean-absolute-deviation-worksheets':{
  const size=opts.size==='mixed'?r.pick([5,6,8]):Number(opts.size);
  const center=r.int(difficulty==='easy'?12:20,difficulty==='easy'?28:50);
  const spread=difficulty==='easy'?4:difficulty==='standard'?7:11;
  const values:number[]=[];
  if(opts.distribution==='symmetric'){
   // Balanced pairs around an integer mean; odd samples contain the mean itself.
   for(let i=0;i<Math.floor(size/2);i++){
    const distance=r.int(1,spread);
    values.push(center-distance,center+distance);
   }
   if(size%2)values.push(center);
  }else{
   // A long right tail, with an actual extreme observation. The sample mean
   // generally is fractional; never round it before calculating deviations.
   for(let i=0;i<size-1;i++)values.push(center+r.int(-spread,spread));
   values.push(center+4*spread+r.int(1,spread));
  }
  const ordered=sorted(values),total=sum(ordered),n=ordered.length;
  // For integer observations x_i, MAD = Σ|n*x_i - Σx_j| / n².
  // Integer arithmetic avoids floating-point errors and gives exact fractions.
  const deviationNumerators=ordered.map(value=>Math.abs(n*value-total));
  const deviationSum=sum(deviationNumerators);
  const meanExact=frac(total,n),answerExact=frac(deviationSum,n*n);
  const deviations=deviationNumerators.map(value=>frac(value,n));
  const firstHalf=deviations.slice(0,Math.ceil(n/2)).join(', ');
  const secondHalf=deviations.slice(Math.ceil(n/2)).join(', ');
  make(`Find the mean absolute deviation of [${ordered.join(', ')}].`,answerExact,
   `There are ${n} observations; mean = ${total}/${n} = ${meanExact}.`,
   `Absolute deviations (first group): ${firstHalf}.`,
   `Absolute deviations (remaining): ${secondHalf}.`,
   `Sum the absolute deviations and divide by ${n}: ${deviationSum}/${n*n} = ${answerExact}.`);
  break}
 case 'box-plots-worksheets':{
  const values=r.int(0,4)===0?[1,2,3,4,5,6,7,30].map(v=>v+r.int(0,1)) : sorted([r.int(1,3),r.int(4,6),r.int(7,9),r.int(10,12),r.int(13,15),r.int(16,18),r.int(19,21),r.int(22,25)]);
  const q=quartiles(values),task=opts.statistic==='mixed'?r.pick(['Q1','median','Q3','IQR','outliers']):opts.statistic;
  const summary=`Q1=${normal(q.q1)}, median=${normal(q.median)}, Q3=${normal(q.q3)}; whiskers=${q.lower} to ${q.upper}; outliers=${q.outliers.join(', ')||'none'}`;
  const ans=task==='draw'?summary:task==='Q1'?normal(q.q1):task==='Q3'?normal(q.q3):task==='median'?normal(q.median):task==='IQR'?normal(q.iqr):q.outliers.length?q.outliers.join(', '):'none';
  make(task==='draw'?`Draw a modified box plot for [${values.join(', ')}]. Use median-of-halves and 1.5×IQR for outliers.`:`Find ${task} for [${values.join(', ')}] using median-of-halves.`,ans,
   `Q1=${normal(q.q1)}, median=${normal(q.median)}, Q3=${normal(q.q3)}, IQR=${normal(q.iqr)}`,
   `Fences: ${normal(q.q1-1.5*q.iqr)} and ${normal(q.q3+1.5*q.iqr)}; whiskers: ${q.lower} to ${q.upper}; outliers: ${q.outliers.join(', ')||'none'}`,`Answer: ${ans}`);
  diagram={kind:'box-practice',values};break}
 case 'scatter-plot-worksheets':{
  const task=opts.task,trend=opts.trend==='mixed'?r.pick(['positive','negative','none']):opts.trend;
  const shapes=[[3,7,4,4,7,3],[7,2,5,5,2,7],[4,8,3,3,8,4],[8,3,7,7,3,8]];
  let values=trend==='none'?[...r.pick(shapes)]:trend==='positive'?[2,3,4,5,6,7]:[7,6,5,4,3,2];
  const shift=r.int(-1,1);
  if(trend!=='none'){
   // Introduce genuine variation; six perfectly collinear points are not a scatter sample.
   const jitterIndex=r.int(1,4),delta=r.int(0,1)===0?-1:1;
   values[jitterIndex]+=delta;
  }
  values=values.map(y=>y+shift);
  const coordinates=values.map((y,i)=>`(${i+1}, ${y})`).join(', ');
  const actual=values.reduce((cov,y,i)=>cov+(i+1-3.5)*(y-values.reduce((a,b)=>a+b,0)/6),0);
  if((trend==='positive'&&actual<=5)||(trend==='negative'&&actual>=-5)||(trend==='none'&&Math.abs(actual)>1e-9))throw Error('Scatter generator produced an invalid trend');
  if(task==='plot')make(`Plot these six points on the scatter grid: ${coordinates}.`,`Coordinates: ${coordinates}`,`Locate each x-value on the horizontal axis and each y-value on the vertical axis.`,`Plot all six coordinate pairs; then check each marked point against the list.`);
  else make('Describe the overall linear trend in the scatter plot.',trend==='none'?'no clear linear trend':trend,
   `Examine all six points from left to right, not just one pair.`,
   trend==='none'?'The points do not rise or fall overall in a linear pattern.':`The points generally ${trend==='positive'?'rise':'fall'} as x increases.`);
  diagram={kind:'scatter',values:values.flatMap((y,i)=>[i+1,y]),labels:task==='plot'?['plot']:['identify']};break}

 case 'printable-protractor':{const deg=opts.angleRange==='acute'?r.int(1,89):opts.angleRange==='obtuse'?r.int(91,179):r.int(0,180);make(`Locate the ${deg}° mark on a printed protractor.`,`${deg}°`,`Read degrees counterclockwise from the right-hand 0° baseline`,`Print at actual size (100%) and measure the 50 mm verification line.`);diagram={kind:'protractor',values:[50]};break}
 default: throw Error(`Topic not implemented: ${topicId}`)
 }
 if(!question||!answer||!steps.length)throw Error(`Invalid generated problem: ${topicId}`);
 return {id:`${topicId}-${seed>>>0}`,topicId,seed:seed>>>0,optionsVersion:'1',payload:{question},expectedAnswer:answer,solutionSteps:steps,diagramSpec:diagram,difficultyTags:[difficulty],gradeTags:[]};
}
export function makeWorksheet(topicId:string,seed:number,quantity:number,difficulty:Difficulty='standard',options:TopicOptions={}):Worksheet {
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1–40 questions');
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Seed must be a 32-bit unsigned integer');
 const normalized=normalizeTopicOptions(topicId,options);
 const cap=maxQuantityForTopic(topicId,normalized,difficulty);
 if(quantity>cap)throw Error(`This topic/settings combination supports at most ${cap} distinct questions.`);
 const rng=new Rng(seed),problems:Problem[]=[],seen=new Set<string>();
 for(let i=0;i<quantity;i++){
  let p:Problem|undefined;
  for(let attempt=0;attempt<320;attempt++){
   const candidate=sampleProblem(topicId,rng.next(),difficulty,normalized);
   const signature=JSON.stringify([candidate.payload.question,candidate.diagramSpec??null]);
   if(!seen.has(signature)){p=candidate;seen.add(signature);break}
  }
  if(!p)throw Error('Not enough unique questions for this configuration; reduce quantity.');
  problems.push({...p,id:`Q${i+1}`});
 }
 return {engineVersion:'1.0.0',generatorVersion:GENERATOR_VERSION,seed,optionsHash:optionsFingerprint(topicId,difficulty,quantity,normalized),topicId,problems,answerMap:problems.map(p=>({id:p.id,answer:p.expectedAnswer})),layoutVersion:'1'};
}
