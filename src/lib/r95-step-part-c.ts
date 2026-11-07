/** R95 independent worked-step reconstruction, part C: exact ratios, systems and sets. */
import type {Problem} from './math.ts';
import {matches,decimalText} from './r95-step-part-a.ts';
function gcd(a:bigint,b:bigint):bigint{
 a=a<0n?-a:a;b=b<0n?-b:b;
 while(b){const r=a%b;a=b;b=r;}
 return a||1n;
}
function ratio(n:bigint,d:bigint):string{
 if(d===0n)throw Error('Worked-step audit: division by zero');
 const g=gcd(n,d);n/=g;d/=g;
 if(d<0n){n=-n;d=-d;}
 return d===1n?String(n):n+'/'+String(d);
}
function parsePercentage(x:string):{numerator:bigint,scale:bigint}{
 const digits=x.split('.')[1]?.length??0;
 return {numerator:BigInt(x.replace('.','')),scale:10n**BigInt(digits)};
}
const abs=(v:bigint)=>v<0n?-v:v;
const sign=(n:bigint)=>n<0n?'−':'+';
function standardFor(coefficient:string,exponent:number):string{
 const m=matches(coefficient,/^([1-9])\.(\d{1,3})$/),raw=m[1]+m[2],position=1+exponent;
 if(position<=0)return '0.'+'0'.repeat(-position)+raw;
 if(position>=raw.length)return raw+'0'.repeat(position-raw.length);
 return raw.slice(0,position)+'.'+raw.slice(position);
}
function scientificFor(standard:string):{coefficient:string,exponent:number}{
 if(!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(standard))throw Error('Worked-step audit: invalid standard decimal');
 const bits=standard.split('.'),all=bits.join('');
 const leading=all.search(/[1-9]/);
 if(leading<0)throw Error('Worked-step audit: zero scientific input');
 const sig=all.slice(leading).replace(/0+$/,'');
 const exponent=bits[0].length-leading-1;
 if(sig.length<2||sig.length>4||exponent< -8||exponent>8)
  throw Error('Worked-step audit: scientific precision out of range');
 return {coefficient:sig[0]+'.'+sig.slice(1),exponent};
}
function parseEquations(q:string):[bigint,bigint,bigint,bigint,bigint,bigint]{
 const m=matches(q,/^(-?\d+)x ([+−]) (\d+)y = (-?\d+); (-?\d+)x ([+−]) (\d+)y = (-?\d+)\.$/);
 const signed=(s:string,v:string)=>BigInt(v)*(s==='−'?-1n:1n);
 return [BigInt(m[1]),signed(m[2],m[3]),BigInt(m[4]),
   BigInt(m[5]),signed(m[6],m[7]),BigInt(m[8])];
}
function equation(a:bigint,b:bigint,c:bigint):string{
 return a+'x '+sign(b)+' '+abs(b)+'y = '+c;
}
export function expectedRemainingC(p:Problem):string[]|null{
 const q=p.payload.question;
 switch(p.topicId){
 case 'percentages-worksheets':{
  const frac=q.match(/^Convert (\d+)\/(\d+) into a percentage\.$/);
  if(frac){
   const a=BigInt(frac[1]),b=BigInt(frac[2]);
   if(a<=0n||b<=a||10000n*a%b!==0n)throw Error('Worked-step audit: invalid percentage fraction');
   const answer=decimalText(10000n*a/b,2);
   return ['Divide '+a+' by '+b+', then multiply by 100%','Answer: '+answer+'%'];
  }
  const reverse=q.match(/^Convert (\d+(?:\.\d+)?)% into a fraction in simplest form\.$/);
  if(reverse){
   const n=parsePercentage(reverse[1]),result=ratio(n.numerator,n.scale*100n);
   return ['Divide '+reverse[1]+' by 100','Simplify to '+result];
  }
  const part=q.match(/^Find (\d+)% of (\d+)\.$/);
  if(part){
   const rate=BigInt(part[1]),amount=BigInt(part[2]);
   if(rate<=0n||amount<=0n)throw Error('Worked-step audit: invalid percentage amount');
   const result=decimalText(amount*rate,2);
   return [rate+'% means '+rate+'/100',amount+' × '+rate+'/100 = '+result,
    'Answer: '+result];
  }
  const change=matches(q,/^Find the percentage (increase|decrease) from (\d+) to (\d+)\.$/);
  const initial=BigInt(change[2]),final=BigInt(change[3]),difference=abs(final-initial);
  if(initial<=0n||(change[1]==='increase'&&final<=initial)||(change[1]==='decrease'&&final>=initial)||
    difference*100n%initial!==0n)throw Error('Worked-step audit: inconsistent percent change');
  const rate=difference*100n/initial;
  return ['Difference: |'+final+' − '+initial+'| = '+difference,
   'Divide by the original value ('+initial+'): '+difference+'/'+initial,
   'Multiply by 100: '+difference+'/'+initial+' × 100 = '+rate+'%'];
 }
 case 'scientific-notation-worksheets':{
  const inverse=q.match(/^Write ([1-9]\.\d{1,3}) × 10\^(-?\d+) in standard form\.$/);
  if(inverse){
   const exponent=Number(inverse[2]),standard=standardFor(inverse[1],exponent);
   if(exponent< -8||exponent>8)throw Error('Worked-step audit: invalid exponent');
   return ['Move the decimal '+Math.abs(exponent)+' places '+(exponent<0?'left':exponent>0?'right':'(zero places)'),
    'Insert any needed zeros without rounding','Exact standard form: '+standard];
  }
  const forward=matches(q,/^Write ([\d.]+) in scientific notation\.$/);
  const {coefficient,exponent}=scientificFor(forward[1]);
  if(standardFor(coefficient,exponent)!==forward[1])
   throw Error('Worked-step audit: scientific notation roundtrip mismatch');
  return ['Place the decimal after the first nonzero digit: '+coefficient,
   'Count decimal places: '+Math.abs(exponent)+'; the exponent is '+exponent,
   'Check: '+coefficient+' × 10^'+exponent+' = '+forward[1]];
 }
 case 'systems-equations-worksheets':{
  const basic=q.match(/^Solve: x \+ y = (-?\d+); x − y = (-?\d+)$/);
  if(basic){
   const first=BigInt(basic[1]),second=BigInt(basic[2]);
   if((first+second)%2n)throw Error('Worked-step audit: system not integral');
   const x=(first+second)/2n,y=first-x;
   return ['Add equations: 2x = '+(first+second),'x = '+x,'Substitute to find y = '+y];
  }
  const general=q.match(/^Solve the system: (.+)$/);
  if(general){
   const [a,b,s,c,d,t]=parseEquations(general[1]);
   const determinant=a*d-b*c,numerator=s*d-t*b,numeratorY=a*t-c*s;
   if(determinant===0n||numerator%determinant||numeratorY%determinant)
    throw Error('Worked-step audit: nonunique or nonintegral system');
   const x=numerator/determinant,y=numeratorY/determinant;
   if(a*x+b*y!==s||c*x+d*y!==t)throw Error('Worked-step audit: system solution mismatch');
   return ['Eliminate y: multiply the first equation by '+d+' and the second by '+b+', then subtract.',
    '('+a+' × '+d+' − '+b+' × '+c+')x = '+s+' × '+d+' − '+t+' × '+b,
    determinant+'x = '+numerator+'; x = '+x,
    'Substitute into '+equation(a,b,s)+': y = '+y,
    'Check both: '+(a*x+b*y)+' = '+s+' and '+(c*x+d*y)+' = '+t];
  }
  const classification=q.match(/^Classify and solve the system: (.+)$/);
  if(classification){
   const [a,b,s,c,d,t]=parseEquations(classification[1]);
   if(a===0n||b===0n||c%a!==0n)throw Error('Worked-step audit: invalid proportional system');
   const factor=c/a,expected=s*factor;
   if(factor===0n||c!==a*factor||d!==b*factor)throw Error('Worked-step audit: invalid system classification');
   const parallel=t!==expected,status=parallel?'no solution':'infinitely many solutions';
   return ['The x and y coefficients of the second equation are '+factor+' times those of the first.',
    'Multiplying the first equation by '+factor+' yields '+equation(c,d,expected)+'.',
    parallel?'The second equation instead has right-hand side '+t+', so the equations are inconsistent.':
    'The two equations are identical after multiplication and describe the same line.',
    'Conclusion: '+status+'.'];
  }
  throw Error('Worked-step audit: unsupported system '+q);
 }
 case 'domain-range-worksheets':{
  const m=matches(q,/^(List the (domain|range) of|Is the relation) \{(.+)\}(?:\.| a function\? Answer yes or no\.)$/);
  const points=[...m[3].matchAll(/\((-?\d+),(-?\d+)\)/g)].map(v=>[Number(v[1]),Number(v[2])]);
  if(points.length<3||points.length>4)throw Error('Worked-step audit: invalid relation cardinality');
  const normalized=points.map(pair=>'('+pair.join(',')+')').join(', ');
  if(normalized!==m[3])throw Error('Worked-step audit: invalid or hidden relation coordinates');
  const set=idx=>'{'+[...new Set(points.map(p=>p[idx]))].sort((a,b)=>a-b).join(', ')+'}';
  if(m[1].startsWith('List the '))return [
   (m[2]==='domain'?'Domain = the set of distinct x-values; list each input once.':
    'Range = the set of distinct y-values; list each output once.')];
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),uniqueX=new Set(xs).size===points.length;
  if(uniqueX!== (points.length===3)||(!uniqueX&&(xs[3]!==xs[0]||ys[3]===ys[0])))
   throw Error('Worked-step audit: invalid function mapping');
  return ['A relation is a function only if each distinct input maps to exactly one output.',
   uniqueX?'All input values are distinct, so the relation is a function.':
    'The input '+xs[0]+' maps to both '+ys[0]+' and '+ys[3]+', so it is not a function.'];
 }
 default:return null;
 }
}
