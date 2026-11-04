/** Pure, deterministic worksheet engine. No Math.random, eval, network, or user data collection. */
import {normalizeTopicOptions,optionsFingerprint,maxQuantityForTopic,type TopicOptions} from './topic-options.ts';
export type Difficulty = 'easy' | 'standard' | 'challenge';
export type Diagram = {kind: 'triangle'|'right-triangle'|'triangle-angles'|'rectangle'|'parallelogram'|'trapezoid'|'prism'|'coordinate'|'linear-function'|'numberline'|'angle'|'protractor'|'scatter'|'box'|'box-practice'|'line'|'intersecting-lines'|'column-multiplication'|'long-division'|'clock'|'dots'; values: number[]; labels?: string[]};
export type Problem = {id:string;topicId:string;seed:number;optionsVersion:'1';payload:{question:string};expectedAnswer:string;solutionSteps:string[];diagramSpec?:Diagram;difficultyTags:Difficulty[];gradeTags:string[]};
export const GENERATOR_VERSION='7' as const;
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
 case 'order-of-operations-worksheets':{const x=a(),y=b(),z=r.int(2,8),br=opts.grouping==='mixed'?r.int(0,1):opts.grouping==='parentheses'?1:0;make(br?`(${x} + ${y}) × ${z} = ____`:`${x} + ${y} × ${z} = ____`,br?(x+y)*z:x+y*z,br?'Calculate the parentheses first':'Multiply before adding',`Result = ${br?(x+y)*z:x+y*z}`);break}
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
 case 'fractions-worksheets':{const d=r.int(2,12),n=r.int(1,d),v=r.int(1,d),op=opts.operation==='mixed'?r.pick(['+','−','×']):({addition:'+',subtraction:'−',multiplication:'×'} as Record<string,string>)[opts.operation];const result=op==='+'?addR(rational(BigInt(n),BigInt(d)),rational(BigInt(v),BigInt(d))):op==='−'?addR(rational(BigInt(n),BigInt(d)),rational(-BigInt(v),BigInt(d))):mulR(rational(BigInt(n),BigInt(d)),rational(BigInt(v),BigInt(d)));make(`${n}/${d} ${op} ${v}/${d} = ____`,asText(result),op==='×'?`Multiply numerator ${n} × ${v} and denominator ${d} × ${d}`:op==='+'?`Add numerators ${n} + ${v}; keep denominator ${d}`:`Subtract numerators ${n} - ${v}; keep denominator ${d}`,`Reduce to ${asText(result)}`);break}
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
  const direction=opts.direction==='mixed'?r.pick(['fraction-to-percent','percent-to-fraction']):opts.direction;
  if(direction==='fraction-to-percent')make(`Convert ${num}/${den} into a percentage.`,`${percentage}%`,`Divide ${num} by ${den}, then multiply by 100%`,`Answer: ${percentage}%`);
  else make(`Convert ${percentage}% into a fraction in simplest form.`,frac(num,den),`Divide ${percentage} by 100`, `Simplify to ${frac(num,den)}`);break}
 case 'scientific-notation-worksheets':{
  const mantissa=r.int(11,99),power=r.int(-4,5),value=mantissa/10*10**power,coef=normal(mantissa/10),standard=normal(value);
  const direction=opts.direction==='mixed'?r.pick(['to-scientific','to-standard']):opts.direction;
  if(direction==='to-scientific')make(`Write ${standard} in scientific notation.`,`${coef} × 10^${power}`,'Move decimal so the coefficient is at least 1 and below 10',`Exponent is ${power}`);
  else make(`Write ${coef} × 10^${power} in standard form.`,standard,`Move the decimal ${Math.abs(power)} places ${power<0?'left':'right'}`,`Standard form: ${standard}`);break}
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
 case 'function-tables-worksheets':{const coeff=r.int(2,8),inter=r.int(-8,8),x=r.int(-4,8),inputs=[x-1,x,x+1],outputs=inputs.map(v=>coeff*v+inter),position=opts.missing==='first'?0:opts.missing==='last'?2:1;
  const table=inputs.map((v,i)=>`${v}→${i===position?'____':outputs[i]}`).join(', ');
  make(`Complete the input/output table for f(x) = ${coeff}x ${inter<0?'−':'+'} ${Math.abs(inter)}: ${table}.`,outputs[position],`Substitute the missing input x = ${inputs[position]}`,`f(${inputs[position]}) = ${coeff} × ${inputs[position]} + (${inter}) = ${outputs[position]}`);break}
 case 'linear-equations-worksheets':{const slope=opts.slope==='mixed'?r.int(-5,5):opts.slope==='positive'?r.int(1,5):opts.slope==='negative'?-r.int(1,5):0,inter=r.int(-9,9),x=r.int(-5,5);make(`For y = ${slope}x ${inter<0?'−':'+'} ${Math.abs(inter)}, find y when x = ${x}.`,slope*x+inter,`y = ${slope}×${x} + (${inter})`,`y = ${slope*x+inter}`);diagram={kind:'linear-function',values:[slope,inter,x,slope*x+inter]};break}
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
 case 'pythagorean-worksheets':{const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41],[12,35,37],[20,21,29],[11,60,61],[28,45,53],[33,56,65],[16,63,65]];const pool=difficulty==='easy'?triples.slice(0,3):difficulty==='standard'?triples.slice(0,9):triples;const k=opts.scale==='small'?r.int(1,3):opts.scale==='large'?r.int(4,8):r.int(1,difficulty==='challenge'?8:6),triple=r.pick(pool),[x,y,z]=triple.map(v=>v*k);make(`A right triangle has legs ${x} and ${y}. Find its hypotenuse.`,z,`a² + b² = c²`,`${x}² + ${y}² = ${z*z}`,`c = ${z}`);diagram={kind:'right-triangle',values:[x,y]};break}
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
 case 'mean-median-mode-range-worksheets':{const repeat=r.int(1,9),values=sorted([repeat,repeat,r.int(10,20),r.int(21,30),r.int(31,40)]);const task=opts.statistic==='mixed'?r.pick(['mean','median','mode','range']):opts.statistic;const answer=task==='mean'?normal(sum(values)/values.length):task==='median'?normal(median(values)):task==='mode'?String(repeat):String(values[values.length-1]-values[0]);make(`Find the ${task} of [${values.join(', ')}].`,answer,task==='mean'?`Add all numbers: ${sum(values)}; divide by ${values.length}`:task==='median'?`Sort the values and choose the middle: ${values[2]}`:task==='mode'?`The value ${repeat} appears twice; each other value appears once`:`Subtract minimum ${values[0]} from maximum ${values[values.length-1]}`,`Result = ${answer}`);break}
 case 'mean-absolute-deviation-worksheets':{const mid=r.int(4,12),delta=r.int(1,6),skewed=opts.distribution==='skewed',values=skewed?[mid-2*delta,mid+delta,mid+delta]:[mid-delta,mid,mid+delta],deviation=skewed?4*delta:2*delta;
  make(`Find the mean absolute deviation of [${values.join(', ')}].`,frac(deviation,3),`Mean = ${mid}`,`Absolute deviations: ${values.map(v=>Math.abs(v-mid)).join(', ')}`,`MAD = ${deviation}/3 = ${frac(deviation,3)}`);break}
 case 'box-plots-worksheets':{
  const values=r.int(0,4)===0?[1,2,3,4,5,6,7,30].map(v=>v+r.int(0,1)) : sorted([r.int(1,3),r.int(4,6),r.int(7,9),r.int(10,12),r.int(13,15),r.int(16,18),r.int(19,21),r.int(22,25)]);
  const q=quartiles(values),task=opts.statistic==='mixed'?r.pick(['Q1','median','Q3','IQR','outliers']):opts.statistic;
  const ans=task==='Q1'?normal(q.q1):task==='Q3'?normal(q.q3):task==='median'?normal(q.median):task==='IQR'?normal(q.iqr):q.outliers.length?q.outliers.join(', '):'none';
  make(`Find ${task} for [${values.join(', ')}] using median-of-halves.`,ans,
   `Q1=${normal(q.q1)}, median=${normal(q.median)}, Q3=${normal(q.q3)}, IQR=${normal(q.iqr)}`,
   `Fences: ${normal(q.q1-1.5*q.iqr)} and ${normal(q.q3+1.5*q.iqr)}; outliers: ${q.outliers.join(', ')||'none'}`,`Answer: ${ans}`);
  diagram={kind:'box-practice',values};break}
 case 'scatter-plot-worksheets':{const trend=opts.trend==='mixed'?r.pick(['positive','negative']):opts.trend,s=trend==='positive'?1:-1,step=r.int(1,7),offset=r.int(8,30);make(`Determine trend of points (1,${s*step+offset}), (2,${s*step*2+offset}), (3,${s*step*3+offset}).`,trend,`Compare x with y values`,`As x increases, y ${s>0?'increases':'decreases'}`);diagram={kind:'scatter',values:[1,s*step+offset,2,s*step*2+offset,3,s*step*3+offset]};break}
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
