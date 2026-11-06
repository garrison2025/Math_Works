/** R75: triangle inequality is a geometric side-length constraint, not
 * symbolic linear inequality manipulation. All lengths are positive integers.
 */
import {Rng,type Difficulty} from './math.ts';
export const TRIANGLE_INEQUALITY_VERSION='R75.1' as const;
export type TriangleMode='mixed'|'possible'|'missing-side'|'integer-count';
export type TriangleKind=Exclude<TriangleMode,'mixed'>;
export type TriangleProblem={id:string;kind:TriangleKind;a:number;b:number;c:number;unit:'cm'|'in';
 question:string;answer:string;steps:readonly [string,string,string];valid:boolean;lower:number;upper:number;};
export type TrianglePack={topic:'inequalities-worksheets';version:typeof TRIANGLE_INEQUALITY_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;mode:TriangleMode;problems:TriangleProblem[];};
const kinds:readonly TriangleKind[]=['possible','missing-side','integer-count'];
const units:readonly TriangleProblem['unit'][]=['cm','in'];
function build(id:string,kind:TriangleKind,a:number,b:number,c:number,unit:TriangleProblem['unit']):TriangleProblem{
 if(!kinds.includes(kind)||!units.includes(unit)||![a,b].every(v=>Number.isSafeInteger(v)&&v>=3&&v<=40)
  ||!Number.isSafeInteger(c)||c<0||c>85)throw Error('Invalid triangle side lengths');
 const lower=Math.abs(a-b),upper=a+b;
 if(kind==='possible'){
  if(c<1)throw Error('Candidate side must be positive');
  const longest=Math.max(a,b,c),other=a+b+c-longest,valid=other>longest;
  return {id,kind,a,b,c,unit,lower,upper,valid,
   question:'Can segments of lengths '+a+', '+b+' and '+c+' '+unit+' form a nondegenerate triangle? Answer yes or no.',
   answer:valid?'Yes - a triangle is possible':'No - a triangle is impossible',
   steps:[
    'For three positive sides, the sum of the two shorter sides must be greater than the longest side.',
    'Here the two shorter sides total '+other+' '+unit+'; the longest side measures '+longest+' '+unit+'.',
    other+(valid?' > ':' <= ')+longest+'; '+(valid?'the strict inequality holds, so a triangle can form.':'equality or a larger side prevents a nondegenerate triangle.')
   ]};
 }
 const count=upper-lower-1;
 if(count<=0)throw Error('No candidate integer third sides');
 const commonSteps:readonly [string,string,string]=[
  'The missing third side x must satisfy |a - b| < x < a + b.',
  'With a = '+a+' and b = '+b+': '+lower+' < x < '+upper+'.',
  'The bounds are strict: collinear (degenerate) endpoint lengths are excluded.'
 ];
 if(kind==='missing-side'){
  return {id,kind,a,b,c:0,unit,lower,upper,valid:true,
   question:'Two sides of a triangle are '+a+' '+unit+' and '+b+' '+unit+'. Find the strict range for its third side x.',
   answer:lower+' < x < '+upper+' (x in '+unit+')',steps:commonSteps};
 }
 return {id,kind,a,b,c:0,unit,lower,upper,valid:true,
  question:'Two triangle sides are '+a+' '+unit+' and '+b+' '+unit+'. How many positive integer lengths x '+unit+' can be the third side?',
  answer:count+' possible integer lengths',
  steps:[
   commonSteps[0],
   'Strict limits: '+lower+' < x < '+upper+'; integers run from '+(lower+1)+' through '+(upper-1)+'.',
   'There are ('+(upper-1)+') - ('+(lower+1)+') + 1 = '+count+' possible integer lengths.'
  ]};
}
export function createTrianglePack(topic:TrianglePack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:TriangleMode='mixed'):TrianglePack{
 if(topic!=='inequalities-worksheets')throw Error('Triangle theorem route mismatch');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid triangle seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1-40 triangle inequality problems');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid triangle difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid triangle theorem mode');
 const rng=new Rng(seed),shift=rng.int(0,2),seen=new Set<string>(),problems:TriangleProblem[]=[];
 const max=difficulty==='easy'?14:difficulty==='standard'?25:40;
 for(let i=0;i<quantity;i++){
  const kind:TriangleKind=mode==='mixed'?kinds[(i+shift)%3]:mode;
  let chosen:TriangleProblem|undefined;
  for(let trial=0;trial<2500;trial++){
   const a=rng.int(3,max),b=rng.int(3,max),unit=rng.pick(units);
   let c=0;
   if(kind==='possible'){
    const lower=Math.abs(a-b),upper=a+b;
    const validity=rng.int(0,2);
    c=validity===0?rng.int(lower+1,upper-1):
      validity===1?upper:rng.int(upper+1,Math.min(85,upper+Math.max(3,Math.floor(max/2))));
   }
   const p=build('Q'+(i+1),kind,a,b,c,unit);
   if(seen.has(p.question))continue;
   seen.add(p.question);chosen=p;break;
  }
  if(!chosen)throw Error('Insufficient distinct triangle theorem questions');
  problems.push(chosen);
 }
 return {topic,version:TRIANGLE_INEQUALITY_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyTrianglePack(pack:TrianglePack):void{
 if(!pack||pack.topic!=='inequalities-worksheets'||pack.version!==TRIANGLE_INEQUALITY_VERSION||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid triangle theorem pack metadata');
 const expected=createTrianglePack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(expected)!==JSON.stringify(pack))throw Error('Triangle theorem question, math, units or solution altered');
}