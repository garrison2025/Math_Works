/** R69 opt-in exact fraction ↔ decimal conversion; preserves v18 51 topic generators.
 * Integer units at 1/1000 avoid all binary floating-point arithmetic.
 */
import {Rng,type Difficulty} from './math.ts';
export const FRACTION_DECIMAL_VERSION='R69.1' as const;
export type ConversionDirection='fraction-to-decimal'|'decimal-to-fraction'|'mixed';
export type ConversionPrecision='tenths'|'hundredths'|'thousandths'|'mixed';
export type ConversionKind='fraction-to-decimal'|'decimal-to-fraction';
export type ConversionQuestion={
 id:string;kind:ConversionKind;places:number;input:string;answer:string;
 decimal:string;fraction:string;numerator:number;denominator:number;
 thousandthUnits:number;question:string;steps:readonly string[];
};
export type ConversionPack={
 topic:'fractions-worksheets';version:typeof FRACTION_DECIMAL_VERSION;seed:number;
 quantity:number;difficulty:Difficulty;direction:ConversionDirection;
 precision:ConversionPrecision;questions:ConversionQuestion[];
};
const gcd=(x:number,y:number):number=>{
 let a=Math.abs(x),b=Math.abs(y);
 while(b){const r=a%b;a=b;b=r;}return a;
};
const denominators={
 easy:new Set([2,4,5,8,10,20,25,40,50,100,125,200]),
 standard:new Set([2,4,5,8,10,20,25,40,50,100,125,200,250,500]),
 challenge:new Set([2,4,5,8,10,20,25,40,50,100,125,200,250,500,1000])
};
const maxThousandths={easy:4999,standard:9999,challenge:19999};
const targetPlaces={tenths:1,hundredths:2,thousandths:3} as const;
export function decimalFromThousandths(value:number):string{
 if(!Number.isSafeInteger(value)||value<1||value>19999)throw Error('Invalid exact decimal units');
 const str=String(value%1000).padStart(3,'0');
 return Math.floor(value/1000)+'.'+str.replace(/0+$/,'');
}
export function decimalPlaceCount(units:number):number{
 if(!Number.isSafeInteger(units)||units<=0||units>19999)throw Error('Invalid exact decimal unit count');
 return units%10?3:units%100?2:1;
}
export function createFractionDecimalPack(topic:ConversionPack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',direction:ConversionDirection='mixed',
 precision:ConversionPrecision='mixed'):ConversionPack{
 if(topic!=='fractions-worksheets')throw Error('Unsupported fraction decimal conversion topic');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid conversion seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Choose 1–40 conversion exercises');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid conversion difficulty');
 if(!['fraction-to-decimal','decimal-to-fraction','mixed'].includes(direction))
  throw Error('Invalid conversion direction');
 if(!['tenths','hundredths','thousandths','mixed'].includes(precision))
  throw Error('Invalid conversion precision');
 const rng=new Rng(seed),buckets=new Map<number,{units:number;n:number;d:number}[]>();
 for(const places of [1,2,3]){
  const rows:{units:number;n:number;d:number}[]=[];
  for(let units=1;units<=maxThousandths[difficulty];units++){
   if(units%1000===0||decimalPlaceCount(units)!==places)continue;
   const factor=gcd(units,1000),n=units/factor,d=1000/factor;
   if(denominators[difficulty].has(d))rows.push({units,n,d});
  }
  for(let i=rows.length-1;i>0;i--){
   const j=rng.int(0,i);[rows[i],rows[j]]=[rows[j],rows[i]];
  }
  buckets.set(places,rows);
 }
 const firstPlaces=rng.int(0,2),firstDirection=rng.int(0,1);
 const questions:ConversionQuestion[]=[];
 for(let i=0;i<quantity;i++){
  const places=precision==='mixed'?[1,2,3][(i+firstPlaces)%3]:targetPlaces[precision];
  const pick=buckets.get(places);
  if(!pick||!pick.length)throw Error('Not enough distinct exact conversions for selected settings');
  const {units,n,d}=pick.pop()!;
  const kind:ConversionKind=direction==='mixed'?
   (i+firstDirection)%2===0?'fraction-to-decimal':'decimal-to-fraction':direction;
  const decimal=decimalFromThousandths(units),fraction=n+'/'+d;
  const input=kind==='fraction-to-decimal'?fraction:decimal;
  const answer=kind==='fraction-to-decimal'?decimal:fraction;
  const power=10**places,rawUnits=units/(1000/power),reduction=gcd(rawUnits,power);
  const scale=power/d;
  if(!Number.isInteger(scale)||!Number.isInteger(rawUnits)||!Number.isInteger(reduction))
   throw Error('Unexpected inexact conversion candidate');
  const steps=kind==='fraction-to-decimal'?[
   'Make the denominator '+power+': multiply top and bottom by '+scale+'.',
   'Equivalent fraction: '+(n*scale)+'/'+power+'.',
   'Divide '+(n*scale)+' by '+power+' to get '+decimal+'.',
   'Check: '+decimal+' × '+d+' = '+n+'.'
  ]:[
   'Write '+decimal+' using place value: '+rawUnits+'/'+power+'.',
   'Divide top and bottom by '+reduction+'.',
   'Simplest form: '+fraction+'.',
   'Check: '+n+' ÷ '+d+' = '+decimal+'.'
  ];
  const question=kind==='fraction-to-decimal'?
   'Convert '+fraction+' to a decimal.':'Convert '+decimal+' to a simplified fraction.';
  questions.push({id:'Q'+(i+1),kind,places,input,answer,decimal,fraction,
   numerator:n,denominator:d,thousandthUnits:units,question,steps});
 }
 return {topic,version:FRACTION_DECIMAL_VERSION,seed,quantity,difficulty,direction,precision,questions};
}
export function verifyFractionDecimalPack(pack:ConversionPack):void{
 if(!pack||pack.version!=='R69.1'||pack.topic!=='fractions-worksheets'||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||
  !['fraction-to-decimal','decimal-to-fraction','mixed'].includes(pack.direction)||
  !['tenths','hundredths','thousandths','mixed'].includes(pack.precision)||
  !Array.isArray(pack.questions)||pack.questions.length!==pack.quantity)
  throw Error('Invalid fraction-decimal conversion metadata');
 const used=new Set<number>();
 for(const [i,q] of pack.questions.entries()){
  if(q.id!=='Q'+(i+1)||!Number.isSafeInteger(q.thousandthUnits)||
   q.thousandthUnits<1||q.thousandthUnits>maxThousandths[pack.difficulty]||
   !Number.isSafeInteger(q.numerator)||!Number.isSafeInteger(q.denominator)||
   q.denominator<2||!denominators[pack.difficulty].has(q.denominator)||
   q.numerator<1||q.places!==decimalPlaceCount(q.thousandthUnits)||
   q.decimal!==decimalFromThousandths(q.thousandthUnits)||
   q.fraction!==q.numerator+'/'+q.denominator||
   q.numerator*1000!==q.thousandthUnits*q.denominator||
   gcd(q.numerator,q.denominator)!==1||
   !['fraction-to-decimal','decimal-to-fraction'].includes(q.kind)||
   (pack.direction!=='mixed'&&q.kind!==pack.direction)||
   (pack.precision!=='mixed'&&q.places!==targetPlaces[pack.precision]))
   throw Error('Exact fraction-decimal conversion mismatch at '+(i+1));
  const input=q.kind==='fraction-to-decimal'?q.fraction:q.decimal;
  const output=q.kind==='fraction-to-decimal'?q.decimal:q.fraction;
  if(q.input!==input||q.answer!==output||
   q.question!==(q.kind==='fraction-to-decimal'?
    'Convert '+q.fraction+' to a decimal.':
    'Convert '+q.decimal+' to a simplified fraction.')||
   !Array.isArray(q.steps)||q.steps.length!==4||
   used.has(q.thousandthUnits))
   throw Error('Conversion exercise prompt, answer or duplicate mismatch at '+(i+1));
  used.add(q.thousandthUnits);
  const power=10**q.places,raw=q.thousandthUnits/(1000/power);
  const reduction=gcd(raw,power),scale=power/q.denominator;
  const steps=q.kind==='fraction-to-decimal'?[
   'Make the denominator '+power+': multiply top and bottom by '+scale+'.',
   'Equivalent fraction: '+(q.numerator*scale)+'/'+power+'.',
   'Divide '+(q.numerator*scale)+' by '+power+' to get '+q.decimal+'.',
   'Check: '+q.decimal+' × '+q.denominator+' = '+q.numerator+'.'
  ]:[
   'Write '+q.decimal+' using place value: '+raw+'/'+power+'.',
   'Divide top and bottom by '+reduction+'.',
   'Simplest form: '+q.fraction+'.',
   'Check: '+q.numerator+' ÷ '+q.denominator+' = '+q.decimal+'.'
  ];
  if(q.steps.some((s,k)=>s!==steps[k]))
   throw Error('Conversion worked steps mismatch at '+(i+1));
 }
}
