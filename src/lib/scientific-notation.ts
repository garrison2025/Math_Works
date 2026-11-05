/** Exact scientific notation conversion: never form a JavaScript floating-point decimal. */
export type ScientificPair = {coefficient:string;standard:string};
/** digits is the count of significant digits in the integer significand (2–4). */
export function scientificNotationPair(significand:number,digits:number,exponent:number):ScientificPair {
 if(!Number.isInteger(digits)||digits<2||digits>4||!Number.isInteger(exponent)||exponent< -8||exponent>8||
    !Number.isInteger(significand)||significand<10**(digits-1)||significand>=10**digits||significand%10===0)
  throw new Error('Invalid exact scientific notation input');
 const raw=String(significand),coefficient=`${raw[0]}.${raw.slice(1)}`;
 const shift=exponent-(digits-1);
 if(shift>=0)return {coefficient,standard:raw+'0'.repeat(shift)};
 const pos=raw.length+shift;
 const standard=pos>0?`${raw.slice(0,pos)}.${raw.slice(pos)}`:`0.${'0'.repeat(-pos)}${raw}`;
 return {coefficient,standard};
}
