/** R74 exact area-of-circle and circular-sector practice.
 * Circle, diameter, semicircle, quarter-circle, minor sector and inverse radius.
 * Coefficients of pi are reduced rational numbers; never approximate pi in keys.
 */
import {Rng,type Difficulty} from './math.ts';
export const CIRCLE_AREA_VERSION='R74.1' as const;
export type CircleAreaMode='mixed'|'radius'|'diameter'|'semicircle'|'quarter-circle'|'sector'|'missing-radius';
export type CircleAreaKind=Exclude<CircleAreaMode,'mixed'>;
export type CircleAreaProblem={
 id:string;kind:CircleAreaKind;radius:number;degrees:number;unit:'cm'|'m'|'in'|'ft';
 areaNumerator:number;areaDenominator:number;question:string;answer:string;
 steps:readonly [string,string,string];
};
export type CircleAreaPack={
 topic:'area-worksheets';version:typeof CIRCLE_AREA_VERSION;seed:number;
 quantity:number;difficulty:Difficulty;mode:CircleAreaMode;problems:CircleAreaProblem[];
};
const kinds:readonly CircleAreaKind[]=['radius','diameter','semicircle','quarter-circle','sector','missing-radius'];
const units:readonly CircleAreaProblem['unit'][]=['cm','m','in','ft'];
const angles=[30,45,60,72,90,120,135,150,180] as const;
function gcd(a:number,b:number):number{return b?gcd(b,a%b):Math.abs(a)}
function coefficient(n:number,d:number):string{
 return d===1?(n===1?'π':n+'π'):'('+n+'/'+d+')π';
}
function materialize(p:Pick<CircleAreaProblem,'id'|'kind'|'radius'|'degrees'|'unit'>):CircleAreaProblem{
 const {kind,radius,unit,degrees}=p;
 if(!Number.isSafeInteger(radius)||radius<2||radius>40||!units.includes(unit)||
  !Number.isSafeInteger(degrees)||degrees<=0||degrees>360)throw Error('Invalid circle dimensions');
 const angle=kind==='semicircle'?180:kind==='quarter-circle'?90:kind==='sector'?degrees:360;
 if(kind==='sector'&&!angles.includes(degrees as (typeof angles)[number]))throw Error('Invalid sector angle');
 const n0=radius*radius*angle,d0=360,div=gcd(n0,d0),n=n0/div,d=d0/div;
 const area=coefficient(n,d)+' '+unit+'²';
 let question='';
 if(kind==='radius')question='Find the area of a circle with radius '+radius+' '+unit+'. Give the exact answer in terms of pi.';
 if(kind==='diameter')question='Find the area of a circle with diameter '+radius*2+' '+unit+'. Give the exact answer in terms of pi.';
 if(kind==='semicircle')question='Find the area of a semicircle with radius '+radius+' '+unit+'. Give the exact answer in terms of pi.';
 if(kind==='quarter-circle')question='Find the area of a quarter-circle (90° sector) with radius '+radius+' '+unit+'. Give the exact answer in terms of pi.';
 if(kind==='sector')question='Find the area of the '+angle+'° minor sector of a circle with radius '+radius+' '+unit+'. Give the exact answer in terms of pi.';
 if(kind==='missing-radius')question='A circle has area '+coefficient(radius*radius,1)+' '+unit+'². Find its positive radius.';
 if(!question)throw Error('Invalid circle area kind');
 const answer=kind==='missing-radius'?radius+' '+unit:area;
 const steps:[string,string,string]=kind==='missing-radius'
  ?['Use A = πr². Given A = '+radius*radius+'π '+unit+'².',
    'Divide by π: r² = '+radius*radius+'.','The radius is positive, so r = '+radius+' '+unit+'.']
  :['Use the circle or sector formula A = (θ/360) × πr².',
    'Here θ = '+angle+'° and r = '+radius+' '+unit+'; π coefficient = '+n+'/'+d+'.',
    'The exact area is '+area+'.'];
 return {...p,areaNumerator:n,areaDenominator:d,question,answer,steps};
}
export function createCircleAreaPack(topic:CircleAreaPack['topic'],seed:number,
 quantity:number,difficulty:Difficulty='standard',mode:CircleAreaMode='mixed'):CircleAreaPack{
 if(topic!=='area-worksheets')throw Error('Circle area route mismatch');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid circle seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1–40 circle area problems');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid circle area difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid circle area mode');
 const rng=new Rng(seed),shift=rng.int(0,kinds.length-1),used=new Set<string>();
 const problems:CircleAreaProblem[]=[];
 for(let i=0;i<quantity;i++){
  const kind=mode==='mixed'?kinds[(i+shift)%kinds.length]:mode;
  let found:CircleAreaProblem|undefined;
  for(let attempt=0;attempt<2000;attempt++){
   const min=2,max=difficulty==='easy'?24:difficulty==='standard'?30:40;
   let radius=rng.int(min,max);
   if(kind==='semicircle'||kind==='quarter-circle')radius=2*Math.ceil(radius/2);
   const degrees=kind==='sector'?rng.pick(angles):kind==='semicircle'?180:kind==='quarter-circle'?90:360;
   const unit=rng.pick(units),p=materialize({id:'Q'+(i+1),kind,radius,degrees,unit});
   if(used.has(p.question))continue;
   used.add(p.question);found=p;break;
  }
  if(!found)throw Error('Insufficient distinct circle area questions');
  problems.push(found);
 }
 return {topic,version:CIRCLE_AREA_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyCircleAreaPack(pack:CircleAreaPack):void{
 if(!pack||pack.topic!=='area-worksheets'||pack.version!==CIRCLE_AREA_VERSION||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid circle area pack metadata');
 const expected=createCircleAreaPack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))throw Error('Incorrect circle/sector area, unit, angle, question or answer');
 for(const p of pack.problems){
  if(p.areaNumerator<=0||p.areaDenominator<=0||gcd(p.areaNumerator,p.areaDenominator)!==1)
   throw Error('Circle area coefficient is not a reduced positive rational');
 }
}
