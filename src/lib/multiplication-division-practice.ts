/** R71 real multiplication/division mixed-fact, inverse fact-family and
 * partitioned rectangular area-model practices. Separate opt-in PDFs leave
 * all original v18 generators and 488 Semrush source rows untouched.
 */
import {Rng,type Difficulty} from './math.ts';
export const VISUAL_MULTIPLICATION_VERSION='R71.1' as const;
export type MultDivisionTopic='multiplication-worksheets'|'division-worksheets';
export type MultDivisionMode='mixed-facts'|'fact-family'|'area-model';
export type AreaFactors='mixed'|'two-by-one'|'two-by-two';
export type AreaGrid={rows:number[];columns:number[];cells:number[][]};
export type MultDivisionQuestion={
 id:string;mode:MultDivisionMode;question:string;answer:string;
 a:number;b:number;product:number;
 operator:'multiply'|'divide'|'family'|'model';
 facts:readonly string[];steps:readonly string[];area:AreaGrid|null;
};
export type MultDivisionPack={
 topic:MultDivisionTopic;version:typeof VISUAL_MULTIPLICATION_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;
 mode:MultDivisionMode;areaFactors:AreaFactors;
 questions:MultDivisionQuestion[];
};
function gridFor(a:number,b:number):AreaGrid{
 const rows=[Math.floor(a/10)*10,a%10];
 const columns=b>=10?[Math.floor(b/10)*10,b%10]:[b];
 return {rows,columns,cells:rows.map(r=>columns.map(c=>r*c))};
}
function fourFacts(a:number,b:number):string[]{
 const product=a*b;
 return [a+' × '+b+' = '+product,b+' × '+a+' = '+product,
  product+' ÷ '+a+' = '+b,product+' ÷ '+b+' = '+a];
}
export function createMultDivisionPack(topic:MultDivisionTopic,seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:MultDivisionMode='mixed-facts',
 areaFactors:AreaFactors='mixed'):MultDivisionPack{
 if(!['multiplication-worksheets','division-worksheets'].includes(topic))throw Error('Invalid multiplication/division practice topic');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Seed must be unsigned 32-bit integer');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Choose 1–40 questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid multiplication/division difficulty');
 if(!['mixed-facts','fact-family','area-model'].includes(mode))throw Error('Unknown multiplication/division practice mode');
 if(!['mixed','two-by-one','two-by-two'].includes(areaFactors))throw Error('Invalid area model factor sizes');
 if(topic==='division-worksheets'&&mode==='area-model')throw Error('Area model only supports multiplication practice');
 const rng=new Rng(seed),seen=new Set<string>(),questions:MultDivisionQuestion[]=[];
 for(let index=0;index<quantity;index++){
  let q:MultDivisionQuestion|undefined;
  for(let trial=0;trial<1600;trial++){
   let a:number,b:number;
   let operator:MultDivisionQuestion['operator'];
   let area:AreaGrid|null=null;
   if(mode==='area-model'){
    const factorSize=areaFactors==='mixed'?(index%2===0?'two-by-one':'two-by-two'):areaFactors;
    a=rng.int(difficulty==='easy'?12:21,difficulty==='easy'?49:99);
    b=factorSize==='two-by-one'?rng.int(2,9):
     rng.int(difficulty==='easy'?11:21,difficulty==='easy'?49:99);
    operator='model';
    area=gridFor(a,b);
   }else{
    const low=difficulty==='challenge'?3:2,high=difficulty==='easy'?12:difficulty==='standard'?16:24;
    a=rng.int(low,high);b=rng.int(low,high);
    if(a===b)continue; // A useful family must contain four distinct statements.
    operator=mode==='fact-family'?'family':(index%2===0?'multiply':'divide');
   }
   const product=a*b;
   const signature=mode==='fact-family'?[Math.min(a,b),Math.max(a,b)].join('x'):
    operator==='model'?a+'x'+b+'-'+areaFactors:
    (index%2===0?'m':'d')+'-'+a+'-'+b;
   const facts=fourFacts(a,b);
   let question:string,answer:string,steps:string[];
   if(operator==='family'){
    question='Complete the four multiplication and division facts for '+a+', '+b+', '+product+'.';
    answer=facts.join(' | ');
    steps=['Multiply the two factors: '+a+' × '+b+' = '+product+'.',
     'Swap the factors and divide the product by each factor.',
     'Check that all four sentences use the same three numbers.'];
   }else if(operator==='model'){
    const partials=area!.cells.flat(),sum=partials.reduce((acc,n)=>acc+n,0);
    question='Partition an area model to multiply '+a+' × '+b+'.';
    answer=String(product);
    steps=['Split '+a+' into '+area!.rows.join(' + ')+' and '+b+' into '+area!.columns.join(' + ')+'.',
     'Find each partial area: '+partials.join(' + ')+'.',
     'Add partial areas: '+partials.join(' + ')+' = '+sum+'.',
     'Check: '+product+' ÷ '+a+' = '+b+'.'];
   }else if(operator==='multiply'){
    question=a+' × '+b+' = ____';
    answer=String(product);
    steps=['Multiply '+a+' by '+b+' to get '+product+'.',
     'Check: '+product+' ÷ '+a+' = '+b+'.'];
   }else{
    const leftDivisor=index%4===1?a:b,quotient=product/leftDivisor;
    question=product+' ÷ '+leftDivisor+' = ____';
    answer=String(quotient);
    steps=['Find which number multiplied by '+leftDivisor+' gives '+product+'.',
     'Check: '+leftDivisor+' × '+quotient+' = '+product+'.'];
   }
   // In division mode, swapping a and b may produce the SAME displayed
   // division sentence despite different internal signatures. Deduplicate
   // the *actual printable question*, not the hidden factor ordering.
   const uniqueKey=mode==='fact-family'?signature:question;
   if(seen.has(uniqueKey))continue;
   seen.add(uniqueKey);
   q={id:'Q'+(index+1),mode,question,answer,a,b,product,
    operator,facts,steps,area};
   break;
  }
  if(!q)throw Error('Could not generate unique math task; adjust difficulty or count');
  questions.push(q);
 }
 return {topic,version:VISUAL_MULTIPLICATION_VERSION,seed,quantity,difficulty,mode,areaFactors,questions};
}
export function verifyMultDivisionPack(pack:MultDivisionPack):void{
 if(!pack||pack.version!=='R71.1'||!['multiplication-worksheets','division-worksheets'].includes(pack.topic)||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||
  !['mixed-facts','fact-family','area-model'].includes(pack.mode)||
  !['mixed','two-by-one','two-by-two'].includes(pack.areaFactors)||
  !Array.isArray(pack.questions)||pack.questions.length!==pack.quantity||
  (pack.topic==='division-worksheets'&&pack.mode==='area-model'))
  throw Error('Invalid multiplication/division pack');
 const seen=new Set<string>();
 for(const [i,q] of pack.questions.entries()){
  if(q.id!=='Q'+(i+1)||q.mode!==pack.mode||
   !Number.isSafeInteger(q.a)||!Number.isSafeInteger(q.b)||
   q.a<2||q.b<2||q.a===q.b&&pack.mode!=='area-model'||
   q.product!==q.a*q.b||q.product<=0||
   !Array.isArray(q.facts)||q.facts.length!==4||
   q.facts.some((f,k)=>f!==fourFacts(q.a,q.b)[k])||
   !Array.isArray(q.steps)||q.steps.length<2)
   throw Error('Invalid multiplication/division math row '+(i+1));
  let expectedQuestion='',expectedAnswer='',expectedSteps:string[]=[],area:AreaGrid|null=null;
  if(pack.mode==='fact-family'){
   if(q.operator!=='family')throw Error('Invalid fact family operator');
   expectedQuestion='Complete the four multiplication and division facts for '+q.a+', '+q.b+', '+q.product+'.';
   expectedAnswer=q.facts.join(' | ');
   expectedSteps=['Multiply the two factors: '+q.a+' × '+q.b+' = '+q.product+'.',
    'Swap the factors and divide the product by each factor.',
    'Check that all four sentences use the same three numbers.'];
  }else if(pack.mode==='area-model'){
   if(q.operator!=='model')throw Error('Area model cannot contain division facts');
   area=gridFor(q.a,q.b);
   expectedQuestion='Partition an area model to multiply '+q.a+' × '+q.b+'.';
   expectedAnswer=String(q.product);
   const parts=area.cells.flat(),sum=parts.reduce((a,b)=>a+b,0);
   expectedSteps=['Split '+q.a+' into '+area.rows.join(' + ')+' and '+q.b+' into '+area.columns.join(' + ')+'.',
    'Find each partial area: '+parts.join(' + ')+'.',
    'Add partial areas: '+parts.join(' + ')+' = '+sum+'.',
    'Check: '+q.product+' ÷ '+q.a+' = '+q.b+'.'];
   if(sum!==q.product)throw Error('Invalid area partition arithmetic');
  }else if(q.operator==='multiply'){
   expectedQuestion=q.a+' × '+q.b+' = ____';expectedAnswer=String(q.product);
   expectedSteps=['Multiply '+q.a+' by '+q.b+' to get '+q.product+'.',
    'Check: '+q.product+' ÷ '+q.a+' = '+q.b+'.'];
  }else if(q.operator==='divide'){
   const leftDivisor=i%4===1?q.a:q.b,quotient=q.product/leftDivisor;
   expectedQuestion=q.product+' ÷ '+leftDivisor+' = ____';
   expectedAnswer=String(quotient);
   expectedSteps=['Find which number multiplied by '+leftDivisor+' gives '+q.product+'.',
    'Check: '+leftDivisor+' × '+quotient+' = '+q.product+'.'];
  }else throw Error('Unknown math exercise operator');
  if(q.question!==expectedQuestion||q.answer!==expectedAnswer||
   JSON.stringify(q.steps)!==JSON.stringify(expectedSteps)||
   JSON.stringify(q.area)!==JSON.stringify(area))
   throw Error('Multiplication/division question or worked answer mismatch '+(i+1));
  const signature=pack.mode==='fact-family'?[Math.min(q.a,q.b),Math.max(q.a,q.b)].join('x'):
   q.question;
  if(seen.has(signature))throw Error('Duplicate mathematical task '+(i+1));
  seen.add(signature);
 }
}
