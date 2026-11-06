/** R67 opt-in exact decimal division practice. Separate from the v18 integer
 * division facts engine. Only finite, nonzero, exact problems are generated.
 * No floats in displayed values or the multiplication/division oracle.
 */
import {Rng,rational,mulR,divR,type Rational,type Difficulty} from './math.ts';
export type DecimalDivisionDivisor='mixed'|'whole'|'decimal';
export type DecimalDivisionPrecision='mixed'|'tenths'|'hundredths';
export type DecimalDivisionTopic='division-worksheets';
export const DECIMAL_DIVISION_VERSION='R67.1' as const;
export type DecimalDivisionQuestion={
 id:string;question:string;answer:string;steps:readonly string[];
 dividend:string;divisor:string;quotient:string;scaleFactor:number;
 scaledDividend:string;scaledDivisor:string;divisorKind:'whole'|'decimal';
 precision:'tenths'|'hundredths';
};
export type DecimalDivisionPack={
 topic:DecimalDivisionTopic;version:typeof DECIMAL_DIVISION_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;
 divisorMode:DecimalDivisionDivisor;precisionMode:DecimalDivisionPrecision;
 questions:DecimalDivisionQuestion[];
};
export function decimalDigits(value:Rational):number{
 let denominator=value.d,two=0,five=0;
 while(denominator%2n===0n){denominator/=2n;two++}
 while(denominator%5n===0n){denominator/=5n;five++}
 if(denominator!==1n)throw Error('Repeating decimal not permitted in exact worksheet');
 return Math.max(two,five);
}
export function decimalTextExact(value:Rational):string{
 const precision=decimalDigits(value);
 if(precision>5)throw Error('More than five decimal places is not print supported');
 const mult=10n**BigInt(precision),scaled=value.n*(mult/value.d);
 const abs=scaled<0n?-scaled:scaled,sign=scaled<0n?'-':'';
 if(!precision)return sign+String(abs);
 const str=abs.toString().padStart(precision+1,'0');
 return sign+(str.slice(0,-precision)+'.'+str.slice(-precision)).replace(/0+$/,'').replace(/\.$/,'');
}
export function parseExactDecimal(value:string):Rational{
 if(!/^(?:0|[1-9]\d*)(?:\.\d{1,5})?$/.test(value))throw Error('Invalid exact positive decimal');
 const [whole,part='']=value.split('.');
 return rational(BigInt(whole)*10n**BigInt(part.length)+BigInt(part||0),10n**BigInt(part.length));
}
export function createDecimalDivisionPack(topic:DecimalDivisionTopic,seed:number,quantity:number,
 difficulty:Difficulty='standard',divisorMode:DecimalDivisionDivisor='mixed',
 precisionMode:DecimalDivisionPrecision='mixed'):DecimalDivisionPack{
 if(topic!=='division-worksheets')throw Error('Unsupported decimal division route');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid decimal division seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Use 1–40 decimal division questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid decimal division difficulty');
 if(!['mixed','whole','decimal'].includes(divisorMode))throw Error('Invalid divisor type');
 if(!['mixed','tenths','hundredths'].includes(precisionMode))throw Error('Invalid decimal precision');
 const rng=new Rng(seed),seen=new Set<string>(),questions:DecimalDivisionQuestion[]=[];
 for(let i=0;i<quantity;i++){
  let row:DecimalDivisionQuestion|undefined;
  for(let tryCount=0;tryCount<1200;tryCount++){
   const kind: 'whole'|'decimal'=divisorMode==='mixed'?rng.pick(['whole','decimal']):divisorMode;
   const precision: 'tenths'|'hundredths'=precisionMode==='mixed'?rng.pick(['tenths','hundredths']):precisionMode;
   const qPower=precision==='tenths'?10n:100n;
   const quotientTop=precision==='tenths'?
    rng.int(11,difficulty==='easy'?59:difficulty==='standard'?129:399):
    rng.int(101,difficulty==='easy'?599:difficulty==='standard'?1299:3999);
   if(quotientTop%10===0)continue; // visibly noninteger quotient
   const quotient=rational(BigInt(quotientTop),qPower);
   let divisor:Rational;
   if(kind==='whole'){
    divisor=rational(BigInt(rng.int(2,difficulty==='easy'?6:difficulty==='standard'?12:25)));
   }else{
    const top=rng.int(2,difficulty==='easy'?19:difficulty==='standard'?59:99);
    if(top%10===0)continue; // genuinely decimal divisor
    divisor=rational(BigInt(top),10n);
   }
   const dividend=mulR(quotient,divisor);
   const dividendText=decimalTextExact(dividend),divisorText=decimalTextExact(divisor),answer=decimalTextExact(quotient);
   if(!dividendText.includes('.')||!answer.includes('.'))continue;
   const question='Calculate: '+dividendText+' ÷ '+divisorText+' = ____';
   if(seen.has(question))continue;seen.add(question);
   const places=Math.max(decimalDigits(dividend),decimalDigits(divisor)),factor=10n**BigInt(places);
   const wholeDividend=dividend.n*(factor/dividend.d),wholeDivisor=divisor.n*(factor/divisor.d);
   if(wholeDivisor<=0n||wholeDividend<=0n)throw Error('Invalid scaled exact division');
   const steps=[
    'Multiply both terms by '+String(factor)+': '+wholeDividend+' ÷ '+wholeDivisor+'.',
    'Divide: '+wholeDividend+' ÷ '+wholeDivisor+' = '+answer+'.',
    'Check: '+divisorText+' × '+answer+' = '+dividendText+'.'
   ];
   row={id:'Q'+(i+1),question,answer,steps,dividend:dividendText,
    divisor:divisorText,quotient:answer,scaleFactor:Number(factor),
    scaledDividend:String(wholeDividend),scaledDivisor:String(wholeDivisor),divisorKind:kind,precision};
   break;
  }
  if(!row)throw Error('Not enough distinct decimal division examples');
  questions.push(row);
 }
 return {topic,version:DECIMAL_DIVISION_VERSION,seed,quantity,difficulty,divisorMode,precisionMode,questions};
}
export function verifyDecimalDivisionPack(pack:DecimalDivisionPack){
 if(!pack||pack.version!=='R67.1'||pack.topic!=='division-worksheets'||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||
  !['mixed','whole','decimal'].includes(pack.divisorMode)||
  !['mixed','tenths','hundredths'].includes(pack.precisionMode)||
  !Array.isArray(pack.questions)||pack.questions.length!==pack.quantity)
  throw Error('Invalid decimal division pack');
 const seen=new Set<string>();
 for(const [i,q] of pack.questions.entries()){
  const dividend=parseExactDecimal(q.dividend),divisor=parseExactDecimal(q.divisor),quotient=parseExactDecimal(q.answer);
  if(q.id!=='Q'+(i+1)||seen.has(q.question)||q.question!=='Calculate: '+q.dividend+' ÷ '+q.divisor+' = ____'||
   q.quotient!==q.answer||!q.answer.includes('.')||!q.dividend.includes('.')||
   q.divisorKind!==(q.divisor.includes('.')?'decimal':'whole')||
   q.precision!==(decimalDigits(quotient)>1?'hundredths':'tenths')||
   q.steps.length!==3)throw Error('Decimal division question mismatch: '+(i+1));
  seen.add(q.question);
  const actual=divR(dividend,divisor);
  if(actual.n!==quotient.n||actual.d!==quotient.d||
   mulR(divisor,quotient).n!==dividend.n||mulR(divisor,quotient).d!==dividend.d)
   throw Error('Decimal division exact answer mismatch: '+(i+1));
  const expected=10n**BigInt(Math.max(decimalDigits(dividend),decimalDigits(divisor)));
  if(q.scaleFactor!==Number(expected)||
   q.scaledDividend!==String(dividend.n*(expected/dividend.d))||
   q.scaledDivisor!==String(divisor.n*(expected/divisor.d)))
   throw Error('Decimal division scaling mismatch: '+(i+1));
  const expectedSteps=[
   'Multiply both terms by '+q.scaleFactor+': '+q.scaledDividend+' ÷ '+q.scaledDivisor+'.',
   'Divide: '+q.scaledDividend+' ÷ '+q.scaledDivisor+' = '+q.answer+'.',
   'Check: '+q.divisor+' × '+q.answer+' = '+q.dividend+'.'
  ];
  if(q.steps.some((s,j)=>s!==expectedSteps[j]))throw Error('Decimal division worked steps mismatch: '+(i+1));
 }
}
