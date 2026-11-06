/** R75: genuine two-dimensional L-shaped composite figure area.
 * The upper-right rectangle is removed from an outer rectangle.
 * Separate subtract-whole and split-into-rectangles explanations share exact geometry.
 */
import {Rng,type Difficulty} from './math.ts';
export const COMPOSITE_AREA_VERSION='R75.1' as const;
export type CompositeMode='mixed'|'subtract'|'split';
export type CompositeKind=Exclude<CompositeMode,'mixed'>;
export type CompositeProblem={
 id:string;kind:CompositeKind;outerWidth:number;outerHeight:number;
 cutWidth:number;cutHeight:number;unit:'cm'|'m'|'in'|'ft';
 area:number;question:string;answer:string;steps:readonly [string,string,string];
};
export type CompositePack={topic:'area-worksheets';version:typeof COMPOSITE_AREA_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;mode:CompositeMode;problems:CompositeProblem[];};
const kinds:readonly CompositeKind[]=['subtract','split'];
const units:readonly CompositeProblem['unit'][]=['cm','m','in','ft'];
function build(id:string,kind:CompositeKind,W:number,H:number,w:number,h:number,
 unit:CompositeProblem['unit']):CompositeProblem{
 if(!kinds.includes(kind)||!units.includes(unit)||![W,H,w,h].every(Number.isSafeInteger)||
  W<5||W>30||H<5||H>30||w<2||h<2||w>=W||h>=H)throw Error('Invalid nondegenerate L figure');
 const total=W*H,removed=w*h,area=total-removed;
 const question=kind==='subtract'
 ?'Find the area of the L-shaped figure. Outer width '+W+' '+unit+', outer height '+H+
  ' '+unit+'; a top-right '+w+' by '+h+' '+unit+' rectangle is removed.'
 :'Find the area of the L shape by splitting it into two rectangles. Outer '+W+
  ' by '+H+' '+unit+'; its missing top-right corner measures '+w+' by '+h+' '+unit+'.';
 const steps:readonly [string,string,string]=kind==='subtract'?[
  'Start with the outer '+W+' × '+H+' rectangle: '+W+' × '+H+' = '+total+' '+unit+'².',
  'The missing corner is '+w+' × '+h+' = '+removed+' '+unit+'².',
  'Subtract: '+total+' - '+removed+' = '+area+' '+unit+'².'
 ]:[
  'Left rectangle: width '+(W-w)+' and height '+H+'; area '+((W-w)*H)+' '+unit+'².',
  'Right-bottom rectangle: width '+w+' and height '+(H-h)+'; area '+(w*(H-h))+' '+unit+'².',
  'Add nonoverlapping parts: '+((W-w)*H)+' + '+(w*(H-h))+' = '+area+' '+unit+'².'
 ];
 return {id,kind,outerWidth:W,outerHeight:H,cutWidth:w,cutHeight:h,unit,area,
  question,answer:area+' '+unit+'²',steps};
}
export function createCompositePack(topic:CompositePack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:CompositeMode='mixed'):CompositePack{
 if(topic!=='area-worksheets')throw Error('Composite area route mismatch');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid composite seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1-40 composite area problems');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid composite difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid composite area mode');
 const rng=new Rng(seed),shift=rng.int(0,1),seen=new Set<string>(),problems:CompositeProblem[]=[];
 const max=difficulty==='easy'?12:difficulty==='standard'?20:30;
 for(let i=0;i<quantity;i++){
  const kind:CompositeKind=mode==='mixed'?kinds[(i+shift)%2]:mode;
  let selected:CompositeProblem|undefined;
  for(let trial=0;trial<2500;trial++){
   const W=rng.int(6,max),H=rng.int(6,max),w=rng.int(2,W-2),h=rng.int(2,H-2),unit=rng.pick(units);
   const candidate=build('Q'+(i+1),kind,W,H,w,h,unit);
   if(seen.has(candidate.question))continue;
   selected=candidate;seen.add(candidate.question);break;
  }
  if(!selected)throw Error('Unable to produce distinct L-shaped area questions');
  problems.push(selected);
 }
 return {topic,version:COMPOSITE_AREA_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyCompositePack(pack:CompositePack):void{
 if(!pack||pack.topic!=='area-worksheets'||pack.version!==COMPOSITE_AREA_VERSION||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid composite area pack metadata');
 const expected=createCompositePack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))throw Error('Composite dimensions, L geometry, area or method altered');
}