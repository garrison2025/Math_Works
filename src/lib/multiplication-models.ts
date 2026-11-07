/** R84.1: genuine dot arrays, scale-correct equal-jump number lines, and
 * elementary multiplication stories. Separate opt-in PDFs do not change
 * the original v18 generator or historical keyword evidence.
 */
import {Rng,type Difficulty} from './math.ts';
export const MULTIPLICATION_MODELS_VERSION='R84.1' as const;
export type MultiplicationModelMode='mixed'|'arrays'|'number-line'|'stories';
export type MultiplicationModelKind=Exclude<MultiplicationModelMode,'mixed'>;
export type MultiplicationModelProblem={
 id:string;kind:MultiplicationModelKind;groups:number;size:number;product:number;
 context:number;question:string;answer:string;steps:readonly [string,string,string];
};
export type MultiplicationModelPack={
 topic:'multiplication-worksheets';version:typeof MULTIPLICATION_MODELS_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;mode:MultiplicationModelMode;
 problems:MultiplicationModelProblem[];
};
const KINDS:readonly MultiplicationModelKind[]=['arrays','number-line','stories'];
const MODES:readonly MultiplicationModelMode[]=['mixed',...KINDS];
const contexts=[
 (a:number,b:number)=>'There are '+a+' rows of chairs, with '+b+' chairs in each row. How many chairs are there?',
 (a:number,b:number)=>'A school has '+a+' packs of pencils, with '+b+' pencils per pack. How many pencils are there?',
 (a:number,b:number)=>'A shop sets out '+a+' trays, each holding '+b+' muffins. How many muffins are there?',
 (a:number,b:number)=>'A gardener plants '+a+' equal rows of flowers, with '+b+' flowers in each row. How many flowers are planted?',
 (a:number,b:number)=>'A class fills '+a+' baskets with '+b+' blocks in each basket. How many blocks are there?',
 (a:number,b:number)=>'There are '+a+' groups of students, with '+b+' students in each group. How many students are there?'
] as const;
function describe(kind:MultiplicationModelKind,a:number,b:number,context:number){
 if(kind==='arrays')return 'Look at the dot array with '+a+' rows and '+b+' dots per row. How many dots are there?';
 if(kind==='number-line')return 'Show '+a+' equal jumps of '+b+' units, starting at zero. What number do you land on?';
 return contexts[context](a,b);
}
function stepsFor(kind:MultiplicationModelKind,a:number,b:number):readonly [string,string,string]{
 const n=a*b;
 return [
  'Count '+a+' groups of '+b+' each.',
  'Multiply: '+a+' x '+b+' = '+n+'.',
  kind==='number-line'?'Verify the final landing point is '+n+'.':
  kind==='arrays'?'Verify the array has '+a+' rows and '+b+' columns.':
  'Check with division: '+n+' / '+a+' = '+b+'.'
 ];
}
function range(difficulty:Difficulty){
 return difficulty==='easy'?{min:2,max:8,sizeMax:9}:
  difficulty==='standard'?{min:2,max:10,sizeMax:12}:
  {min:3,max:12,sizeMax:12};
}
export function createMultiplicationModelPack(seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:MultiplicationModelMode='mixed'):MultiplicationModelPack{
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Seed must be a 32-bit unsigned integer');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Choose 1-40 multiplication problems');
 if(!['easy','standard','challenge'].includes(difficulty)||!MODES.includes(mode))throw Error('Invalid multiplication model settings');
 const limits=range(difficulty),rng=new Rng(seed),seen=new Set<string>(),problems:MultiplicationModelProblem[]=[];
 for(let i=0;i<quantity;i++){
  const kind:MultiplicationModelKind=mode==='mixed'?KINDS[i%KINDS.length]:mode;
  let task:MultiplicationModelProblem|undefined;
  for(let attempt=0;attempt<1800;attempt++){
   const groups=rng.int(limits.min,limits.max);
   const size=rng.int(limits.min,limits.sizeMax);
   const context=kind==='stories'?rng.int(0,contexts.length-1):0;
   const question=describe(kind,groups,size,context),signature=kind+'|'+question;
   if(seen.has(signature))continue;
   seen.add(signature);
   const product=groups*size;
   task={id:'Q'+(i+1),kind,groups,size,product,context,question,
    answer:String(product),steps:stepsFor(kind,groups,size)};
   break;
  }
  if(!task)throw Error('Not enough distinct multiplication tasks for selected mode');
  problems.push(task);
 }
 return {topic:'multiplication-worksheets',version:MULTIPLICATION_MODELS_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyMultiplicationModelPack(pack:MultiplicationModelPack):void{
 if(!pack||pack.topic!=='multiplication-worksheets'||pack.version!==MULTIPLICATION_MODELS_VERSION||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!MODES.includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid multiplication model pack');
 const bounds=range(pack.difficulty),seen=new Set<string>();
 for(const [i,p] of pack.problems.entries()){
  const kind=pack.mode==='mixed'?KINDS[i%KINDS.length]:pack.mode;
  if(p.id!=='Q'+(i+1)||p.kind!==kind||!Number.isSafeInteger(p.groups)||
   !Number.isSafeInteger(p.size)||p.groups<bounds.min||p.groups>bounds.max||
   p.size<bounds.min||p.size>bounds.sizeMax||
   !Number.isInteger(p.context)||p.context<0||p.context>=contexts.length||
   (kind!=='stories'&&p.context!==0)||
   p.product!==p.groups*p.size||p.answer!==String(p.product)||
   p.question!==describe(kind,p.groups,p.size,p.context)||
   JSON.stringify(p.steps)!==JSON.stringify(stepsFor(kind,p.groups,p.size)))
   throw Error('Multiplication model math or teaching trace mismatch: '+p.id);
  const key=p.kind+'|'+p.question;
  if(seen.has(key))throw Error('Duplicate multiplication model question: '+p.id);
  seen.add(key);
 }
}
