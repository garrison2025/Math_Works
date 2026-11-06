/** R68 opt-in exact fixed-point decimal add/subtract practice.
 * Numerators are integer place-value units; never compute answers as JS floats.
 * Completely separate from the 51 existing v18 seeded worksheet generators.
 */
import {Rng,type Difficulty} from './math.ts';
export type DecimalAddSubTopic='addition-worksheets'|'subtraction-worksheets'|'mixed-addition-subtraction-worksheets';
export type DecimalAddSubOperation='mixed'|'addition'|'subtraction';
export type DecimalAddSubPrecision='mixed'|'tenths'|'hundredths';
export type DecimalAddSubRegrouping='mixed'|'yes'|'no';
export const DECIMAL_ADD_SUB_VERSION='R68.1' as const;
export type DecimalAddSubQuestion={
 id:string;operation:'addition'|'subtraction';precision:'tenths'|'hundredths';places:number;
 leftUnits:number;rightUnits:number;resultUnits:number;
 a:string;b:string;answer:string;regrouping:boolean;question:string;
 steps:readonly [string,string,string];
};
export type DecimalAddSubPack={
 topic:DecimalAddSubTopic;version:typeof DECIMAL_ADD_SUB_VERSION;seed:number;
 difficulty:Difficulty;quantity:number;operation:DecimalAddSubOperation;
 precision:DecimalAddSubPrecision;regrouping:DecimalAddSubRegrouping;
 questions:DecimalAddSubQuestion[];
};
export function decimalUnitsText(units:number,places:number):string{
 if(!Number.isSafeInteger(units)||units<0||units>1000000||(places!==1&&places!==2))
  throw Error('Invalid exact decimal units');
 const scale=10**places,integerPart=Math.floor(units/scale),frac=String(units%scale).padStart(places,'0');
 return integerPart+'.'+frac;
}
export function hasDecimalRegrouping(a:number,b:number,operation:'addition'|'subtraction'):boolean{
 if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<0||b<0||a>1000000||b>1000000||
  !['addition','subtraction'].includes(operation)||(operation==='subtraction'&&a<b))
  throw Error('Invalid exact arithmetic regrouping operands');
 let x=a,y=b,carryOrBorrow=0,any=false;
 while(x>0||y>0){
  const left=x%10,right=y%10;
  if(operation==='addition'){
   const sum=left+right+carryOrBorrow;
   if(sum>=10)any=true;
   carryOrBorrow=sum>=10?1:0;
  }else{
   if(left-carryOrBorrow<right){any=true;carryOrBorrow=1;}
   else carryOrBorrow=0;
  }
  x=Math.floor(x/10);y=Math.floor(y/10);
 }
 return any;
}
function oneQuestion(rng:Rng,difficulty:Difficulty,operation:'addition'|'subtraction',
 places:number):{a:number;b:number;c:number;regroup:boolean}|undefined{
 const scale=10**places,maxInteger=difficulty==='easy'?9:difficulty==='standard'?49:199;
 const max=maxInteger*scale+(scale-1);
 const randomNoninteger=()=>{
  // Force both operands to visibly require the selected fractional place.
  let number=0;
  for(let attempts=0;attempts<80;attempts++){
   number=rng.int(1,max);
   if(number%scale!==0&&(places!==2||number%10!==0))return number;
  }
  throw Error('Decimal operand generation exhausted');
 };
 let a=randomNoninteger(),b=randomNoninteger();
 if(operation==='subtraction'&&a<b)[a,b]=[b,a];
 const c=operation==='addition'?a+b:a-b;
 if(c<=0||c%scale===0||a===b)return undefined;
 const regroup=hasDecimalRegrouping(a,b,operation);
 return {a,b,c,regroup};
}
export function createDecimalAddSubPack(topic:DecimalAddSubTopic,seed:number,quantity:number,
 difficulty:Difficulty='standard',operation:DecimalAddSubOperation='mixed',
 precision:DecimalAddSubPrecision='mixed',regrouping:DecimalAddSubRegrouping='mixed'):DecimalAddSubPack{
 if(!['addition-worksheets','subtraction-worksheets','mixed-addition-subtraction-worksheets'].includes(topic))
  throw Error('Unsupported decimal addition/subtraction page');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid decimal add/sub seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1–40 decimal add/sub problems');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid decimal difficulty');
 if(!['mixed','addition','subtraction'].includes(operation))throw Error('Invalid decimal operation');
 if(!['mixed','tenths','hundredths'].includes(precision))throw Error('Invalid decimal precision');
 if(!['mixed','yes','no'].includes(regrouping))throw Error('Invalid decimal regrouping');
 const rng=new Rng(seed),seen=new Set<string>(),questions:DecimalAddSubQuestion[]=[];
 for(let i=0;i<quantity;i++){
  let row:DecimalAddSubQuestion|undefined;
  for(let trial=0;trial<1600;trial++){
   const kind: 'addition'|'subtraction'=operation==='mixed'?rng.pick(['addition','subtraction']):operation;
   const precisionKind:'tenths'|'hundredths'=precision==='mixed'?rng.pick(['tenths','hundredths']):precision;
   const places=precisionKind==='tenths'?1:2,math=oneQuestion(rng,difficulty,kind,places);
   if(!math)continue;
   if(regrouping!=='mixed'&&math.regroup!==(regrouping==='yes'))continue;
   const a=decimalUnitsText(math.a,places),b=decimalUnitsText(math.b,places);
   const answer=decimalUnitsText(math.c,places),symbol=kind==='addition'?'+':'−';
   const question='Calculate: '+a+' '+symbol+' '+b+' = ____';
   if(seen.has(question))continue;seen.add(question);
   const steps=[
    'Line up decimal points and matching place-value columns.',
    kind==='addition'?
     (math.regroup?'Add right to left, carrying to the next column where needed.':'Add each column from right to left without carrying.'):
     (math.regroup?'Subtract right to left, borrowing from the next column where needed.':'Subtract each column from right to left without borrowing.'),
    kind==='addition'?('Check: '+answer+' − '+b+' = '+a+'.'):('Check: '+answer+' + '+b+' = '+a+'.')
   ] as const;
   row={id:'Q'+(i+1),operation:kind,precision:precisionKind,places,
    leftUnits:math.a,rightUnits:math.b,resultUnits:math.c,a,b,answer,
    regrouping:math.regroup,question,steps};
   break;
  }
  if(!row)throw Error('Could not create enough distinct decimal problems for selected options');
  questions.push(row);
 }
 return {topic,version:DECIMAL_ADD_SUB_VERSION,seed,difficulty,quantity,operation,precision,regrouping,questions};
}
export function verifyDecimalAddSubPack(pack:DecimalAddSubPack):void{
 if(!pack||pack.version!=='R68.1'||!['addition-worksheets','subtraction-worksheets','mixed-addition-subtraction-worksheets'].includes(pack.topic)||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||
  !['mixed','addition','subtraction'].includes(pack.operation)||
  !['mixed','tenths','hundredths'].includes(pack.precision)||
  !['mixed','yes','no'].includes(pack.regrouping)||
  !Array.isArray(pack.questions)||pack.questions.length!==pack.quantity)
  throw Error('Invalid decimal add/sub pack metadata');
 const seen=new Set<string>();
 for(const [i,q] of pack.questions.entries()){
  const places=q.precision==='tenths'?1:2;
  if(!['addition','subtraction'].includes(q.operation)||q.places!==places||
   q.id!=='Q'+(i+1)||!Number.isSafeInteger(q.leftUnits)||!Number.isSafeInteger(q.rightUnits)||
   !Number.isSafeInteger(q.resultUnits)||q.leftUnits<0||q.rightUnits<0||q.resultUnits<0||
   !q.a.includes('.')||!q.b.includes('.')||!q.answer.includes('.'))
   throw Error('Invalid decimal add/sub row '+(i+1));
  const expectedOp=q.operation==='addition'?'+':'−';
  const expectedResult=q.operation==='addition'?q.leftUnits+q.rightUnits:q.leftUnits-q.rightUnits;
  if(expectedResult!==q.resultUnits||q.resultUnits===0||
   decimalUnitsText(q.leftUnits,places)!==q.a||decimalUnitsText(q.rightUnits,places)!==q.b||
   decimalUnitsText(q.resultUnits,places)!==q.answer||
   q.regrouping!==hasDecimalRegrouping(q.leftUnits,q.rightUnits,q.operation)||
   q.question!=='Calculate: '+q.a+' '+expectedOp+' '+q.b+' = ____'||
   (pack.operation!=='mixed'&&q.operation!==pack.operation)||
   (pack.precision!=='mixed'&&q.precision!==pack.precision)||
   (pack.regrouping!=='mixed'&&q.regrouping!==(pack.regrouping==='yes'))||
   q.steps.length!==3)
   throw Error('Decimal add/sub arithmetic/config mismatch '+(i+1));
  const expectedSteps=[
   'Line up decimal points and matching place-value columns.',
   q.operation==='addition'?
    (q.regrouping?'Add right to left, carrying to the next column where needed.':'Add each column from right to left without carrying.'):
    (q.regrouping?'Subtract right to left, borrowing from the next column where needed.':'Subtract each column from right to left without borrowing.'),
   q.operation==='addition'?('Check: '+q.answer+' − '+q.b+' = '+q.a+'.'):('Check: '+q.answer+' + '+q.b+' = '+q.a+'.')
  ];
  if(q.steps.some((s,j)=>s!==expectedSteps[j])||seen.has(q.question))
   throw Error('Decimal add/sub worked-step or duplicate mismatch '+(i+1));
  seen.add(q.question);
 }
}
