/** Exact browser-only numeric answer checking; no eval, float rounding or storage. */
export type AnswerCheck='correct'|'incorrect'|'invalid'|'unsupported';
type Exact={n:bigint;d:bigint};
const abs=(n:bigint)=>n<0n?-n:n;
function gcd(a:bigint,b:bigint):bigint{a=abs(a);b=abs(b);while(b!==0n){const r=a%b;a=b;b=r;}return a||1n;}
export function parseExactNumber(raw:string):Exact|undefined{
 const s=raw.trim().replace(/−/g,'-');
 if(s.length===0||s.length>64)return;
 const fraction=s.match(/^([+-]?\d+)\/([+-]?\d+)$/);
 if(fraction){
  let n=BigInt(fraction[1]),d=BigInt(fraction[2]);
  if(d===0n)return;
  if(d<0n){n=-n;d=-d;}
  const factor=gcd(n,d);return {n:n/factor,d:d/factor};
 }
 const decimal=s.match(/^([+-]?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/);
 if(!decimal)return;
 const digits=decimal[2].replace(/,/g,'')+(decimal[3]??'');
 const d=10n**BigInt((decimal[3]??'').length);
 const n=(decimal[1]==='-'?-1n:1n)*BigInt(digits);
 const factor=gcd(n,d);return {n:n/factor,d:d/factor};
}
export const supportsExactNumber=(answer:string)=>parseExactNumber(answer)!==undefined;
export function checkExactNumber(expected:string,userAnswer:string):AnswerCheck{
 const target=parseExactNumber(expected);if(!target)return 'unsupported';
 const actual=parseExactNumber(userAnswer);if(!actual)return 'invalid';
 return actual.n===target.n&&actual.d===target.d?'correct':'incorrect';
}
