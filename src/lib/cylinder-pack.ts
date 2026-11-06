/** R76 — exact right circular cylinder nets, surface areas and volumes.
 * No false assertion that a lateral-only (open) cylinder has two caps.
 */
import {Rng,type Difficulty} from './math.ts';
export const CYLINDER_VERSION='R76.1' as const;
export type CylinderMode='mixed'|'total-surface'|'lateral-surface'|'volume'|'surface-and-volume';
export type CylinderKind=Exclude<CylinderMode,'mixed'>;
export type CylinderProblem={
 id:string;kind:CylinderKind;radius:number;height:number;unit:'cm'|'m'|'in'|'ft';
 totalCoefficient:number;lateralCoefficient:number;volumeCoefficient:number;
 question:string;answer:string;steps:readonly [string,string,string];
};
export type CylinderPack={
 topic:'surface-area-worksheets';version:typeof CYLINDER_VERSION;seed:number;
 quantity:number;difficulty:Difficulty;mode:CylinderMode;problems:CylinderProblem[];
};
const kinds:readonly CylinderKind[]=['total-surface','lateral-surface','volume','surface-and-volume'];
const units:readonly CylinderProblem['unit'][]=['cm','m','in','ft'];
function problem(id:string,kind:CylinderKind,r:number,h:number,unit:CylinderProblem['unit']):CylinderProblem{
 if(!kinds.includes(kind)||!units.includes(unit)||!Number.isSafeInteger(r)||!Number.isSafeInteger(h)||
  r<2||r>25||h<2||h>30)throw Error('Invalid cylinder dimensions');
 const lateral=2*r*h,topBottom=2*r*r,total=lateral+topBottom,volume=r*r*h;
 const dimensions='radius '+r+' '+unit+' and height '+h+' '+unit;
 let question='',answer='';
 let steps:readonly [string,string,string];
 if(kind==='total-surface'){
  question='A closed right circular cylinder has '+dimensions+'. Find its total surface area. Give the exact answer in terms of pi.';
  answer=total+'π '+unit+'²';
  steps=[
   'A closed cylinder has two circular bases and a curved lateral surface: SA = 2πr² + 2πrh.',
   'Two bases: 2 × '+r+'²π = '+topBottom+'π. Lateral: 2 × '+r+' × '+h+'π = '+lateral+'π.',
   'Total surface area = ('+topBottom+' + '+lateral+')π = '+total+'π '+unit+'².'
  ];
 }else if(kind==='lateral-surface'){
  question='A right circular cylinder has '+dimensions+'. Find ONLY its curved lateral surface area (do not include the two bases). Use exact pi.';
  answer=lateral+'π '+unit+'²';
  steps=[
   'Unroll the curved side into a rectangle: width = 2πr, height = h.',
   'Lateral area = 2πrh = 2 × '+r+' × '+h+' × π.',
   'Curved lateral area = '+lateral+'π '+unit+'²; neither circular end is included.'
  ];
 }else if(kind==='volume'){
  question='A right circular cylinder has '+dimensions+'. Find its volume. Give the exact answer in terms of pi.';
  answer=volume+'π '+unit+'³';
  steps=[
   'Cylinder volume = area of circular base × height = πr²h.',
   'Substitute r = '+r+' and h = '+h+': π × '+r+'² × '+h+'.',
   'Volume = '+volume+'π '+unit+'³ (cubic units, not square units).'
  ];
 }else{
  question='A closed right circular cylinder has '+dimensions+'. Find BOTH its total surface area and its volume in terms of pi.';
  answer='SA = '+total+'π '+unit+'²; V = '+volume+'π '+unit+'³';
  steps=[
   'Surface area = two bases + curved side = 2πr² + 2πrh.',
   'Here SA = ('+topBottom+' + '+lateral+')π = '+total+'π '+unit+'².',
   'Volume = πr²h = '+r+'² × '+h+' × π = '+volume+'π '+unit+'³.'
  ];
 }
 return {id,kind,radius:r,height:h,unit,totalCoefficient:total,lateralCoefficient:lateral,
  volumeCoefficient:volume,question,answer,steps};
}
export function createCylinderPack(topic:CylinderPack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:CylinderMode='mixed'):CylinderPack{
 if(topic!=='surface-area-worksheets')throw Error('Cylinder practice route mismatch');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid cylinder seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1-40 cylinder problems');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid cylinder difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid cylinder mode');
 const rng=new Rng(seed),shift=rng.int(0,kinds.length-1),seen=new Set<string>(),problems:CylinderProblem[]=[];
 const maxR=difficulty==='easy'?9:difficulty==='standard'?16:25;
 const maxH=difficulty==='easy'?12:difficulty==='standard'?22:30;
 for(let i=0;i<quantity;i++){
  const kind=mode==='mixed'?kinds[(i+shift)%kinds.length]:mode;
  let candidate:CylinderProblem|undefined;
  for(let tries=0;tries<2500;tries++){
   const r=rng.int(2,maxR),h=rng.int(2,maxH),unit=rng.pick(units);
   const p=problem('Q'+(i+1),kind,r,h,unit);
   if(seen.has(p.question))continue;
   seen.add(p.question);candidate=p;break;
  }
  if(!candidate)throw Error('Insufficient distinct cylinder questions');
  problems.push(candidate);
 }
 return {topic,version:CYLINDER_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyCylinderPack(pack:CylinderPack):void{
 if(!pack||pack.topic!=='surface-area-worksheets'||pack.version!==CYLINDER_VERSION||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid cylinder metadata');
 const expected=createCylinderPack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))throw Error('Cylinder math, dimensions, unit, prompt or answer altered');
}
