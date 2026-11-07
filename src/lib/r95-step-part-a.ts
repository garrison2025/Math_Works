/** R95 independent worked-step reconstruction, part A.
 * Student text and the displayed diagram are the only inputs, never generator steps.
 * All results are cross-checked against the separate math oracle at PDF export.
 */
import type {Problem} from './math.ts';
export function matches(q:string,re:RegExp):RegExpMatchArray{
 const m=q.match(re);
 if(!m)throw Error('Worked-step audit: unrecognized question '+q);
 return m;
}
const places:Readonly<Record<string,bigint>>={ones:1n,tens:10n,hundreds:100n,thousands:1000n,millions:1000000n,billions:1000000000n};
const decimals:Readonly<Record<string,number>>={tenths:1,hundredths:2,thousandths:3};
const comma=(n:bigint)=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const signValue=(mark:string,n:string)=>BigInt(n)*(mark==='−'?-1n:1n);
export function decimalText(n:bigint,places:number):string{
 const size=10n**BigInt(places),whole=n/size,frac=String(n%size).padStart(places,'0').replace(/0+$/,'');
 return frac?whole+'.'+frac:String(whole);
}
export function expectedRemainingA(p:Problem):string[]|null{
 const q=p.payload.question;
 switch(p.topicId){
 case 'inequalities-worksheets':{
  const m=matches(q,/^Solve: (-?\d+)x ([+−]) (\d+) (<|≤) (-?\d+)$/);
  const a=BigInt(m[1]),offset=signValue(m[2],m[3]),rhs=BigInt(m[5]);
  if(a===0n||(rhs-offset)%a!==0n)throw Error('Worked-step audit: invalid inequality');
  const point=(rhs-offset)/a,orig=m[4];
  const op=a<0n?(orig==='<'?'>':'≥'):orig;
  if(p.diagramSpec?.kind!=='numberline'||p.diagramSpec.values[0]!==Number(point)||p.diagramSpec.labels?.[0]!==op)
   throw Error('Worked-step audit: inequality plot does not match question');
  return ['Subtract '+offset+' from both sides','Divide by '+a+'; '+(a<0n?'reverse':'keep')+' the inequality sign',
   'Solution: x '+op+' '+point];
 }
 case 'decimal-multiplication-worksheets':{
  const m=matches(q,/^(\d+)\.(\d+) × (\d+)\.(\d+) = ____$/);
  const digits=m[2].length;
  if(digits!==m[4].length||digits<1||digits>2)throw Error('Worked-step audit: mismatched decimal precision');
  const a=BigInt(m[1]+m[2]),b=BigInt(m[3]+m[4]),product=a*b;
  return ['Multiply whole numbers: '+a+' × '+b+' = '+product,
   'Place '+(digits*2)+' digits after the decimal point',
   'Exact decimal = '+decimalText(product,digits*2)];
 }
 case 'place-value-worksheets':{
  const m=matches(q,/^What (digit is in|is the value of) the (ones|tens|hundreds|thousands|millions|billions) (?:place of|digit in) ([\d,]+)\?$/);
  const n=BigInt(m[3].replaceAll(',','')),factor=places[m[2]],digit=(n/factor)%10n,value=digit*factor;
  if(n<0n||n>9999999999n||!factor)throw Error('Worked-step audit: invalid whole place');
  if(m[1]==='digit is in')return ['Read the whole-number places from right to left.','The '+m[2]+' digit is '+digit+'.'];
  return ['Identify the '+m[2]+' digit: '+digit+'.',
   'Multiply by '+comma(factor)+': '+digit+' × '+comma(factor)+' = '+comma(value)+'.'];
 }
 case 'decimal-place-value-worksheets':{
  const digit=q.match(/^What (digit is in|is the value of) the (tenths|hundredths|thousandths) (?:place of|digit in) (\d+)\.(\d{4})\?$/);
  const rounding=q.match(/^Round (\d+)\.(\d{4}) to the nearest (tenths|hundredths|thousandths)\.$/);
  if(digit){
   const index=decimals[digit[2]]-1,selected=Number(digit[4][index]),place=digit[2];
   if(digit[1]==='digit is in')return [
    'The digits right of the decimal point are tenths, hundredths, thousandths, then ten-thousandths.',
    'The '+place+' digit is '+selected+'.'];
   const value=selected?'0.'+'0'.repeat(index)+selected:'0';
   return ['Find the digit in the '+place+' position: '+selected+'.','Write its exact value: '+value+'.'];
  }
  if(rounding){
   const whole=BigInt(rounding[1]),fraction=BigInt(rounding[2]),count=decimals[rounding[3]];
   const next=Number(rounding[2][count]),unit=10n**BigInt(4-count);
   const total=whole*10000n+fraction,rounded=(total+unit/2n)/unit;
   const value=String(rounded/(10n**BigInt(count)))+'.'+String(rounded%(10n**BigInt(count))).padStart(count,'0');
   return ['Check the next digit to the right of the '+rounding[3]+' position: '+next+'.',
    next>=5?'It is 5 or more, so round the selected place up.':'It is less than 5, so keep the selected place.',
    'Write the result with the correct number of decimal places: '+value+'.'];
  }
  throw Error('Worked-step audit: unsupported decimal place question '+q);
 }
 case 'gcf-worksheets':{
  const m=matches(q,/^Find the GCF of (\d+) and (\d+)\.$/);
  let a=BigInt(m[1]),b=BigInt(m[2]);if(!a||!b)throw Error('Worked-step audit: zero GCF input');
  while(b!==0n){const r=a%b;a=b;b=r;}
  return ['Find common divisors','Greatest common factor: '+a];
 }
 case 'functions-worksheets':{
  const eva=q.match(/^If f\(x\) = (\d+)x ([+−]) (\d+), find f\((-?\d+)\)\.$/);
  if(eva){
   const a=BigInt(eva[1]),b=signValue(eva[2],eva[3]),x=BigInt(eva[4]);
   return ['Substitute x = '+x,a+' × '+x+' + ('+b+') = '+(a*x+b)];
  }
  const inv=matches(q,/^If f\(x\) = (\d+)x ([+−]) (\d+) and f\(x\) = (-?\d+), find x\.$/);
  const a=BigInt(inv[1]),b=signValue(inv[2],inv[3]),target=BigInt(inv[4]);
  if(a===0n||(target-b)%a!==0n)throw Error('Worked-step audit: impossible function input');
  return ['Subtract '+b+': '+a+'x = '+(target-b),'Divide by '+a+': x = '+(target-b)/a];
 }
 case 'function-tables-worksheets':{
  const m=matches(q,/^Complete the input\/output table for f\(x\) = (\d+)x ([+−]) (\d+)\. Find the missing (input|output)\.$/);
  const a=BigInt(m[1]),b=signValue(m[2],m[3]),d=p.diagramSpec;
  if(d?.kind!=='function-table'||d.values.length!==10)throw Error('Worked-step audit: function table unavailable');
  const values=d.values,position=values[8],kind=values[9];
  if(!Number.isInteger(position)||position<0||position>2||kind!==(m[4]==='input'?1:0))
   throw Error('Worked-step audit: wrong table target');
  if(values[0]!==Number(a)||values[1]!==Number(b))throw Error('Worked-step audit: table equation mismatch');
  for(let j=0;j<3;j++)if(BigInt(values[5+j])!==a*BigInt(values[2+j])+b)
   throw Error('Worked-step audit: table cells inconsistent');
  const x=BigInt(values[2+position]),y=a*x+b;
  return m[4]==='output'?[
   'Use the known input x = '+x+'.','f('+x+') = '+a+' × '+x+' + ('+b+') = '+y+'.'
  ]:[
   'Set '+a+'x + ('+b+') = '+y+'.','Subtract '+b+' from both sides: '+a+'x = '+(y-b)+'.',
   'Divide by '+a+': x = '+x+'.'];
 }
 case 'linear-equations-worksheets':{
  const graph=q.match(/^Graph the line y = (-?\d+)x ([+−]) (\d+) on the coordinate grid\.$/);
  if(graph){
   const a=BigInt(graph[1]),b=signValue(graph[2],graph[3]);
   if(p.diagramSpec?.kind!=='linear-function'||p.diagramSpec.values[0]!==Number(a)||p.diagramSpec.values[1]!==Number(b))
    throw Error('Worked-step audit: incorrect line diagram');
   return ['Plot the y-intercept at (0, '+b+').',
    'Use slope '+a+': from (0, '+b+') to (1, '+(a+b)+').',
    'Draw a straight line through both points.'];
  }
  const m=matches(q,/^For y = (-?\d+)x ([+−]) (\d+), find y when x = (-?\d+)\.$/);
  const a=BigInt(m[1]),b=signValue(m[2],m[3]),x=BigInt(m[4]);
  return ['y = '+a+'×'+x+' + ('+b+')','y = '+(a*x+b)];
 }
 default:return null;
 }
}
