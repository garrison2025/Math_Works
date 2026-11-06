/** R80 exact unfold-and-add surface area of real solid nets plus exposed
 * surface of two joined rectangular prisms (extruded L-shaped cross section).
 * Every PDF carries dimension-proportional true vector faces; unsupported
 * compound or other 3D solids are explicitly outside scope.
 */
import {Rng,type Difficulty} from './math.ts';
export const R80_VERSION='R80.1' as const;
export type R80Skill='nets'|'composite';
export type R80NetKind='rectangular-prism'|'triangular-prism'|'cylinder'|'square-pyramid'|'regular-tetrahedron';
export type R80Mode='mixed'|R80NetKind|'left-step'|'right-step';
export type R80Unit='cm'|'m'|'in'|'ft';
export type R80Problem={
 id:string;skill:R80Skill;kind:R80NetKind|'joined-L-prisms';unit:R80Unit;
 l:number;w:number;h:number;a:number;b:number;c:number;length:number;
 radius:number;height:number;side:number;slant:number;
 baseLength:number;stepLength:number;depth:number;lowHeight:number;upperHeight:number;
 orientation:'left'|'right'|'none';
 question:string;answer:string;steps:readonly [string,string,string];
};
export type R80Pack={
 topic:'surface-area-worksheets';version:typeof R80_VERSION;skill:R80Skill;
 seed:number;quantity:number;difficulty:Difficulty;mode:R80Mode;problems:R80Problem[];
};
const kinds:readonly R80NetKind[]=['rectangular-prism','triangular-prism','cylinder','square-pyramid','regular-tetrahedron'];
const units:readonly R80Unit[]=['cm','m','in','ft'];
const triples:readonly (readonly [number,number,number])[]=[[3,4,5],[5,12,13],[8,15,17],[7,24,25]];
type Dims=Pick<R80Problem,'l'|'w'|'h'|'a'|'b'|'c'|'length'|'radius'|'height'|'side'|'slant'|'baseLength'|'stepLength'|'depth'|'lowHeight'|'upperHeight'>;
function materialize(id:string,skill:R80Skill,kind:R80Problem['kind'],unit:R80Unit,d:Dims,
 orientation:R80Problem['orientation']):R80Problem{
 if(!units.includes(unit)||Object.values(d).some(n=>!Number.isSafeInteger(n)||n<0))
  throw Error('Invalid unfolded surface-area dimensions');
 let question='',answer='',steps:readonly [string,string,string];
 if(skill==='composite'){
  if(kind!=='joined-L-prisms'||!['left','right'].includes(orientation))
   throw Error('Invalid joined-prism geometry');
  const {baseLength:L,stepLength:T,depth:D,lowHeight:H,upperHeight:J}=d;
  if(L<6||L>24||T<2||T>=L||D<2||D>15||H<2||H>15||J<2||J>15||
   d.l||d.w||d.h||d.a||d.b||d.c||d.length||d.radius||d.height||d.side||d.slant)
   throw Error('Invalid L-shaped joined solid dimensions');
  const lower=2*(L*D+L*H+D*H),upper=2*(T*D+T*J+D*J),joint=T*D;
  const total=lower+upper-2*joint;
  // Independent perimeter×depth identity, matching the true net geometry.
  const area=2*(L*H+T*J)+2*D*(L+H+J);
  if(area!==total)throw Error('Composite solid surface math inconsistency');
  question='Two closed rectangular prisms share a full-width top joint. Bottom: '+L+' x '+D+' x '+H+
   ' '+unit+'. Top step: '+T+' x '+D+' x '+J+' '+unit+' at the '+orientation+
   '. Find the EXPOSED surface area from the L-shaped net (joined faces hidden).';
  answer=total+' '+unit+'²';
  steps=[
   'Bottom prism SA = 2('+L+' x '+D+' + '+L+' x '+H+' + '+D+' x '+H+') = '+lower+' '+unit+'².',
   'Top prism SA = 2('+T+' x '+D+' + '+T+' x '+J+' + '+D+' x '+J+') = '+upper+' '+unit+'².',
   'Subtract both concealed joint faces: '+lower+' + '+upper+' - 2 x '+joint+
    ' = '+total+' '+unit+'².'
  ];
 }else{
  if(skill!=='nets'||!kinds.includes(kind as R80NetKind)||orientation!=='none'||
   d.baseLength||d.stepLength||d.depth||d.lowHeight||d.upperHeight)
   throw Error('Invalid regular solid net');
  if(kind==='rectangular-prism'){
   const {l,w,h}=d;
   if(Math.min(l,w,h)<2||Math.max(l,w,h)>24||d.a||d.b||d.c||d.length||d.radius||d.height||d.side||d.slant)
    throw Error('Invalid rectangular prism net');
   const area=2*(l*w+l*h+w*h);
   question='Use the UNFOLDED SIX-FACE rectangular prism net. Dimensions: '+l+' x '+w+' x '+h+' '+unit+'. Find TOTAL surface area.';
   answer=area+' '+unit+'²';
   steps=['Identify the two l x w, two l x h and two w x h rectangular net faces.',
    'Pair areas are '+2*l*w+', '+2*l*h+' and '+2*w*h+' '+unit+'².',
    'Sum the six faces: 2(lw + lh + wh) = '+area+' '+unit+'².'];
  }else if(kind==='triangular-prism'){
   const {a,b,c,length:L}=d;
   if(a<3||b<4||a*a+b*b!==c*c||L<2||L>24||d.l||d.w||d.h||d.radius||d.height||d.side||d.slant)
    throw Error('Invalid right triangular prism net');
   const tri=a*b,rect=(a+b+c)*L,total=tri+rect;
   question='Find TOTAL surface area from the right-triangular-prism net. Triangle legs '+a+', '+b+
    ', hypotenuse '+c+' '+unit+'; length '+L+' '+unit+'.';
   answer=total+' '+unit+'²';
   steps=['Two right-triangle ends together: '+a+' x '+b+' = '+tri+' '+unit+'².',
    'Three rectangular net faces: ('+a+' + '+b+' + '+c+') x '+L+' = '+rect+' '+unit+'².',
    'Sum all five faces: '+tri+' + '+rect+' = '+total+' '+unit+'².'];
  }else if(kind==='cylinder'){
   const {radius:r,height:h}=d;
   if(r<2||h<2||r>25||h>30||d.l||d.w||d.h||d.a||d.b||d.c||d.length||d.side||d.slant)
    throw Error('Invalid closed cylinder net');
   const bases=2*r*r,side=2*r*h,total=bases+side;
   question='The closed CYLINDER net has two circular bases and one unfolded rectangle. Radius '+
    r+' '+unit+', height '+h+' '+unit+'. Find exact TOTAL surface area in pi.';
   answer=total+'π '+unit+'²';
   steps=['Two circular disks contribute 2pi r² = '+bases+'pi '+unit+'².',
    'Rectangle has circumference 2pi r and height '+h+', contributing '+side+'pi '+unit+'².',
    'Total net area = '+bases+'pi + '+side+'pi = '+total+'pi '+unit+'².'];
  }else if(kind==='square-pyramid'){
   const {side:s,slant:l}=d;
   if(s<4||s>24||l<=s/2||l>30||d.l||d.w||d.h||d.a||d.b||d.c||d.length||d.radius||d.height)
    throw Error('Invalid right square pyramid net');
   const square=s*s,faces=2*s*l,total=square+faces;
   question='Use the unfolded RIGHT square pyramid net: square base '+s+' '+unit+
    ', triangular FACE slant height '+l+' '+unit+'. Find TOTAL surface area.';
   answer=total+' '+unit+'²';
   steps=['Square base net face: s² = '+square+' '+unit+'².',
    'Four triangular net faces together: 4 x s x slant / 2 = '+faces+' '+unit+'².',
    'Total area = '+square+' + '+faces+' = '+total+' '+unit+'².'];
  }else{
   const s=d.side;
   if(s<3||s>25||d.l||d.w||d.h||d.a||d.b||d.c||d.length||d.radius||d.height||d.slant)
    throw Error('Invalid regular tetrahedron net');
   question='Four congruent equilateral triangles form this REGULAR tetrahedron net. All edges '+s+
    ' '+unit+'. Find exact TOTAL area in sqrt(3).';
   answer=s*s+'√3 '+unit+'²';
   steps=['An equilateral triangle of side '+s+' has altitude sqrt(3) x '+s+' / 2.',
    'One face area is sqrt(3) x '+s+'² / 4; the net has four identical faces.',
    'Total net area = '+s*s+'sqrt(3) '+unit+'².'];
  }
 }
 return {id,skill,kind,unit,...d,orientation,question,answer,steps};
}
export function createR80Pack(seed:number,quantity:number,difficulty:Difficulty='standard',
 skill:R80Skill='nets',mode:R80Mode='mixed'):R80Pack{
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid R80 seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1-40 R80 questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid R80 difficulty');
 if(!['nets','composite'].includes(skill))throw Error('Invalid R80 skill');
 if(skill==='nets'&&!['mixed',...kinds].includes(mode))throw Error('Unsupported net shape selection');
 if(skill==='composite'&&!['mixed','left-step','right-step'].includes(mode))throw Error('Unsupported composite solid selection');
 const rng=new Rng(seed),shift=rng.int(0,skill==='nets'?kinds.length-1:1);
 const problems:R80Problem[]=[],used=new Set<string>();
 for(let i=0;i<quantity;i++){
  const kind:R80Problem['kind']=skill==='composite'?'joined-L-prisms':
   mode==='mixed'?kinds[(i+shift)%kinds.length]:mode as R80NetKind;
  const orientation:R80Problem['orientation']=skill==='nets'?'none':
   mode==='mixed'?(i+shift)%2===0?'left':'right':mode==='left-step'?'left':'right';
  let chosen:R80Problem|undefined;
  for(let attempts=0;attempts<3500;attempts++){
   const unit=rng.pick(units);
   const max=difficulty==='easy'?9:difficulty==='standard'?15:24;
   const l=rng.int(2,max),w=rng.int(2,max),h=rng.int(2,max);
   const [a,b,c]=rng.pick(triples);
   const length=rng.int(2,max);
   const radius=rng.int(2,Math.min(max,24)),height=rng.int(2,Math.min(28,max+3));
   const side=rng.int(3,Math.max(15,max)),slant=rng.int(Math.floor(side/2)+1,Math.max(Math.floor(side/2)+1,Math.min(30,max+7)));
   const baseLength=rng.int(8,Math.max(12,max));
   const stepLength=rng.int(2,baseLength-2);
   const depth=rng.int(2,Math.min(15,max));
   const lowHeight=rng.int(2,Math.min(15,max));
   const upperHeight=rng.int(2,Math.min(15,max));
   const zero:Dims={l:0,w:0,h:0,a:0,b:0,c:0,length:0,radius:0,height:0,
    side:0,slant:0,baseLength:0,stepLength:0,depth:0,lowHeight:0,upperHeight:0};
   const dims:Dims=kind==='rectangular-prism'?{...zero,l,w,h}
    :kind==='triangular-prism'?{...zero,a,b,c,length}
    :kind==='cylinder'?{...zero,radius,height}
    :kind==='square-pyramid'?{...zero,side,slant}
    :kind==='regular-tetrahedron'?{...zero,side}
    :{...zero,baseLength,stepLength,depth,lowHeight,upperHeight};
   const p=materialize('Q'+(i+1),skill,kind,unit,dims,orientation);
   const key=kind+'|'+unit+'|'+orientation+'|'+Object.values(dims).join(',');
   if(used.has(key))continue;
   used.add(key);chosen=p;break;
  }
  if(!chosen)throw Error('Could not create distinct authentic net exercises');
  problems.push(chosen);
 }
 return {topic:'surface-area-worksheets',version:R80_VERSION,skill,seed,quantity,difficulty,mode,problems};
}
export function verifyR80Pack(pack:R80Pack):void{
 if(!pack||pack.topic!=='surface-area-worksheets'||pack.version!==R80_VERSION||
  !['nets','composite'].includes(pack.skill)||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||typeof pack.mode!=='string'||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)throw Error('Invalid R80 pack metadata');
 const exact=createR80Pack(pack.seed,pack.quantity,pack.difficulty,pack.skill,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(exact))
  throw Error('R80 solid net math, source dimensions or teacher key modified');
}
