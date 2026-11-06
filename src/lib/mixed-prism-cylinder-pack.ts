/** R79 — a SINGLE mixed worksheet containing actual rectangular prisms,
 * right triangular prisms and right circular cylinders. No separate PDFs
 * stitched together. Every part uses true proportional unfolded nets.
 */
import {Rng,type Difficulty} from './math.ts';
export const MIXED_SOLID_VERSION='R79.1' as const;
export type MixedSolidTask='volume'|'surface';
export type MixedSolidMode='mixed'|'rectangular-prism'|'triangular-prism'|'cylinder';
export type MixedSolidKind=Exclude<MixedSolidMode,'mixed'>;
export type MixedSolidProblem={
 id:string;kind:MixedSolidKind;task:MixedSolidTask;unit:'cm'|'m'|'in'|'ft';
 l:number;w:number;h:number;a:number;b:number;c:number;length:number;radius:number;height:number;
 question:string;answer:string;steps:readonly [string,string,string];
};
export type MixedSolidPack={
 topic:'volume-of-rectangular-prisms-worksheets'|'surface-area-worksheets';
 version:typeof MIXED_SOLID_VERSION;seed:number;quantity:number;difficulty:Difficulty;
 mode:MixedSolidMode;task:MixedSolidTask;problems:MixedSolidProblem[];
};
const kinds:readonly MixedSolidKind[]=['rectangular-prism','triangular-prism','cylinder'];
const units:readonly MixedSolidProblem['unit'][]=['cm','m','in','ft'];
const triples:readonly (readonly [number,number,number])[]=[[3,4,5],[5,12,13],[8,15,17],[7,24,25]];
function build(id:string,task:MixedSolidTask,kind:MixedSolidKind,unit:MixedSolidProblem['unit'],
 dims:Pick<MixedSolidProblem,'l'|'w'|'h'|'a'|'b'|'c'|'length'|'radius'|'height'>):MixedSolidProblem{
 if(!kinds.includes(kind)||!units.includes(unit)||!['volume','surface'].includes(task)||
  Object.values(dims).some(x=>!Number.isSafeInteger(x)||x<0))
  throw Error('Invalid mixed solid data');
 let question='',answer='',steps:readonly [string,string,string];
 if(kind==='rectangular-prism'){
  const {l,w,h}=dims;
  if(l<2||w<2||h<2||l>24||w>24||h>24||
   dims.a||dims.b||dims.c||dims.length||dims.radius||dims.height)
   throw Error('Invalid rectangular prism dimensions');
  const volume=l*w*h,area=2*(l*w+l*h+w*h);
  if(task==='volume'){
   question='A rectangular prism measures '+l+' x '+w+' x '+h+' '+unit+'. Find its volume.';
   answer=volume+' '+unit+'³';
   steps=['A rectangular prism has a rectangle base with area '+l+' x '+w+' = '+l*w+' '+unit+'².',
    'Multiply the base area by its perpendicular height '+h+' '+unit+'.',
    'V = '+l+' x '+w+' x '+h+' = '+volume+' '+unit+'³.'];
  }else{
   question='A closed rectangular prism measures '+l+' x '+w+' x '+h+' '+unit+'. Find its entire surface area.';
   answer=area+' '+unit+'²';
   steps=['The six faces are two l x w, two l x h and two w x h rectangles.',
    'Each opposing pair contributes '+(2*l*w)+', '+(2*l*h)+' and '+(2*w*h)+' '+unit+'².',
    'Total surface area = 2(lw + lh + wh) = '+area+' '+unit+'².'];
  }
 }else if(kind==='triangular-prism'){
  const {a,b,c,length:L}=dims;
  if(a<3||b<4||c<5||a*a+b*b!==c*c||L<2||L>24||
   dims.l||dims.w||dims.h||dims.radius||dims.height)
   throw Error('Invalid right triangular prism dimensions');
  const base=a*b/2,volume=base*L,area=2*base+(a+b+c)*L;
  if(task==='volume'){
   question='A right triangular prism has perpendicular triangle legs '+a+', '+b+
    ' '+unit+' and prism length '+L+' '+unit+'. Calculate the volume.';
   answer=volume+' '+unit+'³';
   steps=['Right-triangle base area B = ('+a+' x '+b+') / 2 = '+base+' '+unit+'².',
    'Prism volume = base area B times the perpendicular prism length L = '+L+' '+unit+'.',
    'V = '+base+' x '+L+' = '+volume+' '+unit+'³.'];
  }else{
   question='Find the surface area of a closed right triangular prism with base legs '+
    a+', '+b+', hypotenuse '+c+' '+unit+' and prism length '+L+' '+unit+'.';
   answer=area+' '+unit+'²';
   steps=['Two triangular bases contribute 2 x '+base+' = '+(2*base)+' '+unit+'².',
    'The three side rectangles contribute ('+a+' + '+b+' + '+c+') x '+L+' = '+((a+b+c)*L)+' '+unit+'².',
    'Total area = '+(2*base)+' + '+((a+b+c)*L)+' = '+area+' '+unit+'².'];
  }
 }else{
  const {radius:r,height:h}=dims;
  if(r<2||h<2||r>25||h>30||dims.l||dims.w||dims.h||
   dims.a||dims.b||dims.c||dims.length)
   throw Error('Invalid cylinder dimensions');
  const V=r*r*h,SA=2*r*r+2*r*h;
  if(task==='volume'){
   question='A right circular cylinder has radius '+r+' '+unit+' and height '+h+' '+unit+
    '. Find its exact volume in terms of pi.';
   answer=V+'π '+unit+'³';
   steps=['The circular base area is pi x r^2 = '+(r*r)+'pi '+unit+'².',
    'Multiply by the perpendicular cylinder height '+h+' '+unit+'.',
    'V = pi x '+r+'^2 x '+h+' = '+V+'pi '+unit+'³.'];
  }else{
   question='A CLOSED right circular cylinder has radius '+r+' '+unit+' and height '+h+' '+unit+
    '. Find its exact TOTAL surface area in terms of pi.';
   answer=SA+'π '+unit+'²';
   steps=['Both circular bases contribute 2pi r^2 = '+(2*r*r)+'pi '+unit+'².',
    'The curved rectangular side contributes 2pi r h = '+(2*r*h)+'pi '+unit+'².',
    'Total closed surface area = '+(2*r*r)+'pi + '+(2*r*h)+'pi = '+SA+'pi '+unit+'².'];
  }
 }
 return {id,kind,task,unit,...dims,question,answer,steps};
}
export function createMixedSolidPack(topic:MixedSolidPack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:MixedSolidMode='mixed'):MixedSolidPack{
 if(!['volume-of-rectangular-prisms-worksheets','surface-area-worksheets'].includes(topic))
  throw Error('Invalid mixed prism/cylinder worksheet route');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid mixed solid seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1-40 mixed prism/cylinder questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid mixed solid difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid mixed solid mode');
 const rng=new Rng(seed),shift=rng.int(0,kinds.length-1);
 const task:MixedSolidTask=topic==='surface-area-worksheets'?'surface':'volume';
 const problems:MixedSolidProblem[]=[],used=new Set<string>();
 for(let i=0;i<quantity;i++){
  const kind:MixedSolidKind=mode==='mixed'?kinds[(i+shift)%kinds.length]:mode;
  let selected:MixedSolidProblem|undefined;
  for(let tries=0;tries<2500;tries++){
   const unit=rng.pick(units),max=difficulty==='easy'?8:difficulty==='standard'?14:24;
   const l=rng.int(2,max),w=rng.int(2,max),h=rng.int(2,max);
   const [a,b,c]=rng.pick(triples);
   const length=rng.int(2,max);
   const radius=rng.int(2,difficulty==='easy'?8:difficulty==='standard'?14:24);
   const height=rng.int(2,difficulty==='easy'?10:difficulty==='standard'?20:28);
   const dims=kind==='rectangular-prism'
    ?{l,w,h,a:0,b:0,c:0,length:0,radius:0,height:0}
    :kind==='triangular-prism'
    ?{l:0,w:0,h:0,a,b,c,length,radius:0,height:0}
    :{l:0,w:0,h:0,a:0,b:0,c:0,length:0,radius,height};
   const p=build('Q'+(i+1),task,kind,unit,dims);
   const key=kind+'|'+unit+'|'+Object.values(dims).join('|');
   if(used.has(key))continue;
   used.add(key);selected=p;break;
  }
  if(!selected)throw Error('Could not generate distinct mixed solid problems');
  problems.push(selected);
 }
 return {topic,version:MIXED_SOLID_VERSION,seed,quantity,difficulty,mode,task,problems};
}
export function verifyMixedSolidPack(pack:MixedSolidPack){
 if(!pack||!['volume-of-rectangular-prisms-worksheets','surface-area-worksheets'].includes(pack.topic)||
  pack.version!==MIXED_SOLID_VERSION||!Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !['volume','surface'].includes(pack.task)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid mixed solid pack metadata');
 const expected=createMixedSolidPack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))
  throw Error('Mixed solid questions/shape dimensions/formulas/answers were modified');
}
