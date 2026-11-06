/** R78 exact geometry: right-triangle-based right prisms, right square
 * pyramids and regular tetrahedra. The common word "triangular pyramid" is
 * intentionally narrowed to REGULAR tetrahedra wherever the √3 formula applies.
 */
import {Rng,type Difficulty} from './math.ts';
export const SOLID_NET_VERSION='R78.1' as const;
export type SolidNetMode='mixed'|'triangular-prism-volume'|'triangular-prism-surface'|'square-pyramid-surface'|'regular-tetrahedron-surface';
export type SolidKind=Exclude<SolidNetMode,'mixed'>;
export type SolidProblem={
 id:string;kind:SolidKind;unit:'cm'|'m'|'in'|'ft';
 a:number;b:number;c:number;length:number;side:number;slant:number;
 question:string;answer:string;steps:readonly [string,string,string];
};
export type SolidPack={
 topic:'volume-of-rectangular-prisms-worksheets'|'surface-area-worksheets';
 version:typeof SOLID_NET_VERSION;seed:number;quantity:number;
 difficulty:Difficulty;mode:SolidNetMode;problems:SolidProblem[];
};
const kinds:readonly SolidKind[]=[
 'triangular-prism-volume','triangular-prism-surface',
 'square-pyramid-surface','regular-tetrahedron-surface'
];
const unitList:readonly SolidProblem['unit'][]=['cm','m','in','ft'];
const triangles:readonly (readonly [number,number,number])[]=[
 [3,4,5],[5,12,13],[8,15,17],[7,24,25]
];
const isVolume=(k:SolidKind)=>k==='triangular-prism-volume';
function build(id:string,kind:SolidKind,unit:SolidProblem['unit'],
 a:number,b:number,c:number,length:number,side:number,slant:number):SolidProblem{
 if(!kinds.includes(kind)||!unitList.includes(unit)||![a,b,c,length,side,slant].every(Number.isSafeInteger))
  throw Error('Invalid solid data');
 let question:string,answer:string,steps:readonly [string,string,string];
 if(kind==='triangular-prism-volume'||kind==='triangular-prism-surface'){
  if(a<3||b<4||c<5||a*a+b*b!==c*c||length<2||length>24||side!==0||slant!==0)
   throw Error('Invalid right triangular prism dimensions');
  const base=a*b/2,perimeter=a+b+c,volume=base*length,total=2*base+perimeter*length;
  if(kind==='triangular-prism-volume'){
   question='A right triangular prism has a right-triangle base with legs '+a+' and '+b+
    ' '+unit+' and a prism length of '+length+' '+unit+'. Find its exact volume.';
   answer=volume+' '+unit+'³';
   steps=[
    'Right triangle base area = (a × b) / 2 = ('+a+' × '+b+') / 2 = '+base+' '+unit+'².',
    'A right prism volume equals base area times the perpendicular prism length '+length+' '+unit+'.',
    'V = '+base+' × '+length+' = '+volume+' '+unit+'³.'
   ];
  }else{
   question='Find total surface area of a closed right triangular prism. The right-triangle base legs are '+
    a+' and '+b+' '+unit+', hypotenuse '+c+' '+unit+', and prism length '+length+' '+unit+'.';
   answer=total+' '+unit+'²';
   steps=[
    'Two right-triangle bases: 2 × ('+a+' × '+b+' / 2) = '+(a*b)+' '+unit+'².',
    'Three rectangular sides: ('+a+' + '+b+' + '+c+') × '+length+' = '+(perimeter*length)+' '+unit+'².',
    'Total closed area = '+(a*b)+' + '+(perimeter*length)+' = '+total+' '+unit+'².'
   ];
  }
 }else if(kind==='square-pyramid-surface'){
  if(side<4||side>24||slant<=side/2||slant>30||a!==0||b!==0||c!==0||length!==0)
   throw Error('Invalid right square pyramid dimensions');
  const base=side*side,lateral=2*side*slant,total=base+lateral;
  question='A right square pyramid has base side '+side+' '+unit+' and face slant height '+
   slant+' '+unit+'. Find its total surface area (NOT its vertical height).';
  answer=total+' '+unit+'²';
  steps=[
   'The square base contributes s² = '+side+'² = '+base+' '+unit+'².',
   'Four triangular faces contribute 4 × (s × slant height / 2) = 2 × '+side+' × '+slant+' = '+lateral+' '+unit+'².',
   'Total area = '+base+' + '+lateral+' = '+total+' '+unit+'². Slant height is not perpendicular pyramid height.'
  ];
 }else{
  if(side<3||side>25||a!==0||b!==0||c!==0||length!==0||slant!==0)
   throw Error('Invalid regular tetrahedron dimensions');
  const coefficient=side*side;
  question='A REGULAR triangular pyramid (tetrahedron) has four equilateral faces, each with edge length '+
   side+' '+unit+'. Find its exact total surface area in terms of √3.';
  answer=coefficient+'√3 '+unit+'²';
  steps=[
   'Each equilateral triangular face has area (√3 / 4) × s².',
   'Four congruent faces give 4 × (√3 / 4) × '+side+'² = '+coefficient+'√3.',
   'Exact total surface area = '+coefficient+'√3 '+unit+'². This requires a regular tetrahedron.'
  ];
 }
 return {id,kind,unit,a,b,c,length,side,slant,question,answer,steps};
}
export function createSolidPack(topic:SolidPack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:SolidNetMode='mixed'):SolidPack{
 if(!['volume-of-rectangular-prisms-worksheets','surface-area-worksheets'].includes(topic))
  throw Error('Invalid solid worksheet route');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid solid seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1-40 solid geometry questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid solid difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid solid mode');
 if(topic==='volume-of-rectangular-prisms-worksheets'&&
   !['mixed','triangular-prism-volume'].includes(mode))
  throw Error('The volume page cannot generate a surface-area-only worksheet');
 const allowed:readonly SolidKind[]=topic==='volume-of-rectangular-prisms-worksheets'
  ?['triangular-prism-volume']:kinds.slice(1);
 const rng=new Rng(seed),shift=rng.int(0,allowed.length-1);
 const seen=new Set<string>(),problems:SolidProblem[]=[];
 for(let i=0;i<quantity;i++){
  const kind:SolidKind=mode==='mixed'?allowed[(i+shift)%allowed.length]:mode;
  if(!allowed.includes(kind))throw Error('Solid mode is not available on the selected worksheet route');
  let selected:SolidProblem|undefined;
  for(let tries=0;tries<2500;tries++){
   const unit=rng.pick(unitList),basic=rng.pick(triangles);
   const factor=difficulty==='easy'?1:rng.int(1,difficulty==='standard'?2:3);
   const [a,b,c]=basic.map(x=>x*factor);
   const length=rng.int(2,difficulty==='easy'?9:difficulty==='standard'?15:24);
   const side=rng.int(kind==='regular-tetrahedron-surface'?3:4,
    difficulty==='easy'?10:difficulty==='standard'?18:24);
   const slant=rng.int(Math.floor(side/2)+1,
    Math.max(Math.floor(side/2)+1,difficulty==='easy'?13:difficulty==='standard'?22:30));
   const p=build('Q'+(i+1),kind,unit,
    kind.startsWith('triangular-prism')?a:0,kind.startsWith('triangular-prism')?b:0,
    kind.startsWith('triangular-prism')?c:0,kind.startsWith('triangular-prism')?length:0,
    kind.startsWith('triangular-prism')?0:side,kind==='square-pyramid-surface'?slant:0);
   const key=kind+'|'+unit+'|'+p.a+'|'+p.b+'|'+p.length+'|'+p.side+'|'+p.slant;
   if(seen.has(key))continue;
   seen.add(key);selected=p;break;
  }
  if(!selected)throw Error('Insufficient distinct prism or pyramid exercises');
  problems.push(selected);
 }
 return {topic,version:SOLID_NET_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifySolidPack(pack:SolidPack):void{
 if(!pack||!['volume-of-rectangular-prisms-worksheets','surface-area-worksheets'].includes(pack.topic)||
  pack.version!==SOLID_NET_VERSION||!Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid solid pack metadata');
 const expected=createSolidPack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))
  throw Error('Solid dimensions, face geometry, formula or key altered');
}
