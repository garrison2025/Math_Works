/** Full-scope closure: five narrowly defined historical maths gaps in one
 * exact, seeded, PDF-only pack. Never change v18 baseline question identity.
 */
import {Rng,type Difficulty} from './math.ts';
export const CLOSURE_VERSION='CLOSE.1' as const;
export type ClosureTopic=
 'angle-worksheets'|'mixed-addition-subtraction-worksheets'|
 'lines-rays-segments-worksheets'|'multiplication-worksheets'|'surface-area-worksheets';
export type ClosureMode='mixed'|'order-sides'|'order-angles'|
 'addition'|'subtraction'|'plane-points'|'line-plane'|'unique-plane'|
 'lattice'|'right-triangular-pyramid';
export const CLOSURE_MODES:Record<ClosureTopic,readonly ClosureMode[]>={
 'angle-worksheets':['mixed','order-sides','order-angles'],
 'mixed-addition-subtraction-worksheets':['mixed','addition','subtraction'],
 'lines-rays-segments-worksheets':['mixed','plane-points','line-plane','unique-plane'],
 'multiplication-worksheets':['lattice'],
 'surface-area-worksheets':['right-triangular-pyramid']
};
export type ClosureProblem={
 id:string;topic:ClosureTopic;mode:ClosureMode;kind:string;
 a:number;b:number;c:number;d:number;e:number;f:number;h:number;
 question:string;answer:string;steps:readonly [string,string,string];
};
export type ClosurePack={
 version:typeof CLOSURE_VERSION;topic:ClosureTopic;seed:number;quantity:number;
 difficulty:Difficulty;mode:ClosureMode;problems:ClosureProblem[];
};
const triangles=[[4,5,6],[5,7,9],[5,12,13],[6,8,11],[8,9,13],[7,10,12],
 [9,11,15],[10,14,17],[13,14,15],[8,15,17],[7,12,16],[12,17,20]];
export function polynomialText(a:number,b:number,c:number){
 const terms:[number,string][]=[[a,'x^2'],[b,'x'],[c,'']];
 let result='';
 for(const [n,suffix] of terms){
  if(n===0)continue;
  const abs=Math.abs(n),part=(suffix&&abs===1?'':String(abs))+suffix;
  if(!result)result=(n<0?'-':'')+part;
  else result+=(n<0?' - ':' + ')+part;
 }
 return result||'0';
}
export function latticeDiagonals(a:number,b:number){
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<10||a>99||b<10||b>99)
  throw Error('Lattice mode supports two-digit by two-digit only');
 const at=Math.floor(a/10),ao=a%10,bt=Math.floor(b/10),bo=b%10;
 const units=ao*bo,c1=Math.floor(units/10);
 const tens=c1+(at*bo)%10+(ao*bt)%10,c2=Math.floor(tens/10);
 const hundreds=c2+Math.floor(at*bo/10)+Math.floor(ao*bt/10)+(at*bt)%10;
 const thousands=Math.floor(hundreds/10)+Math.floor(at*bt/10);
 const combined=thousands*1000+(hundreds%10)*100+(tens%10)*10+(units%10);
 if(combined!==a*b)throw Error('Lattice diagonal carry arithmetic mismatch');
 return {at,ao,bt,bo,products:[at*bt,ao*bt,at*bo,ao*bo] as const,
  units,tens,hundreds,thousands,combined};
}
export function triangularPyramidArea(a:number,b:number,h:number){
 if(![a,b,h].every(Number.isSafeInteger)||a<=0||b<=0||h<=0)
  throw Error('Right-base triangular pyramid must use positive integer dimensions');
 // Apex lies vertically above the right-angle vertex of the triangular base.
 // Two lateral faces are right triangles; the third is not in general.
 const radicand=a*a*b*b+h*h*(a*a+b*b);
 const doubleArea=a*b+a*h+b*h+Math.sqrt(radicand);
 return {radicand,base:a*b/2,lateralA:a*h/2,lateralB:b*h/2,
  lateralHyp:Math.sqrt(radicand)/2,total:doubleArea/2};
}
function ordinal(names:string[],sizes:number[]){
 return [...names].sort((x,y)=>sizes[names.indexOf(x)]-sizes[names.indexOf(y)]).join(' < ');
}
function describe(topic:ClosureTopic,kind:string,a:number,b:number,c:number,d:number,e:number,f:number,h:number):
 Pick<ClosureProblem,'question'|'answer'|'steps'>{
 if(topic==='angle-worksheets'){
  if(!(a+b>c&&a+c>b&&b+c>a&&new Set([a,b,c]).size===3))
   throw Error('Invalid unequal-side triangle');
  const sides=[a,b,c],angles=['A','B','C'],sideNames=['a (BC)','b (AC)','c (AB)'];
  const sidesOrder=ordinal(sideNames,sides),angleOrder=ordinal(angles,sides);
  const question=kind==='order-sides'?
   'Triangle ABC has side lengths a=BC='+a+', b=AC='+b+', c=AB='+c+'. Order the sides shortest to longest.':
   'Triangle ABC has opposite side lengths a='+a+', b='+b+', c='+c+
   '. Order angles A, B, C from smallest to largest.';
  const answer=kind==='order-sides'?sidesOrder:angleOrder;
  return {question,answer,steps:[
   'Compare the three real side lengths: '+a+', '+b+' and '+c+'.',
   'The larger angle is always opposite the longer side in the same triangle.',
   'Side order '+sidesOrder+'; angle order '+angleOrder+'.'
  ]};
 }
 if(topic==='mixed-addition-subtraction-worksheets'){
  const op=kind==='addition'?'+':'-',sgn=op==='+'?1:-1;
  const result=[a+sgn*d,b+sgn*e,c+sgn*f];
  const first=polynomialText(a,b,c),second=polynomialText(d,e,f);
  return {
   question:'Simplify ('+first+') '+op+' ('+second+'). Write in descending powers of x.',
   answer:polynomialText(...result as [number,number,number]),
   steps:['Group like terms in the x^2, x and constant columns.',
    'Combine coefficients: ('+a+') '+op+' ('+d+'), ('+b+') '+op+
     ' ('+e+'), ('+c+') '+op+' ('+f+').',
    'Result '+result.join(', ')+' for x^2, x, constant: '+polynomialText(...result as [number,number,number])+'.'
   ]};
 }
 if(topic==='lines-rays-segments-worksheets'){
  const coords='A=(0,0,0), B=('+a+',0,0), C=(0,'+b+',0), D=(0,0,'+h+').';
  if(kind==='plane-points')return{
   question:'Plane P is z=0. '+coords+' Which labelled points belong to plane P?',
   answer:'A, B, C (D is outside P).',
   steps:['A point lies on z=0 exactly when its third coordinate is zero.',
    'A, B, and C have z=0; D has z='+h+'.','Therefore only A, B, C belong to P.']};
  if(kind==='line-plane')return{
   question:'Plane P is z=0. '+coords+' Does line AD lie in P, intersect P once, or run parallel to P?',
   answer:'Line AD intersects P exactly once at A.',
   steps:['Point A has z=0 and point D has z='+h+'.',
    'A is on P; D is outside P, so the whole line cannot lie in P.',
    'The line crosses P at A only.']};
  return{
   question:'Plane P is z=0. '+coords+' Which three labelled points uniquely determine P?',
   answer:'Noncollinear A, B, C determine plane P.',
   steps:['A, B, C all have z=0.',
    'AB follows the x-axis and AC follows the y-axis; a,b>0 so they are not collinear.',
    'Exactly one plane contains three noncollinear points: P.']};
 }
 if(topic==='multiplication-worksheets'){
  const l=latticeDiagonals(a,b);
  return{
   question:'Use the diagonal lattice (gelosia) method to multiply '+a+' x '+b+'.',
   answer:String(a*b),
   steps:['Place digits '+l.at+','+l.ao+' across the top and '+l.bt+','+l.bo+' beside the grid.',
    'Cell products from top-left to bottom-right: '+l.products.join(', ')+'; separate tens and ones.',
    'Sum diagonals with carries: '+l.thousands+' | '+(l.hundreds%10)+
     ' | '+(l.tens%10)+' | '+(l.units%10)+' => '+a*b+'.'
   ]};
 }
 if(topic==='surface-area-worksheets'){
  const area=triangularPyramidArea(a,b,h);
  return{
   question:'A right triangular pyramid has a right-triangle base with legs '+a+
    ', '+b+' cm. Its apex is '+h+' cm directly above the right-angle base vertex. Find TOTAL surface area to 2 decimals.',
   answer:area.total.toFixed(2)+' cm^2 (approx.)',
   steps:['The base area is ('+a+' x '+b+')/2 = '+area.base+' cm^2.',
    'Two lateral right faces have areas '+area.lateralA+' and '+area.lateralB+
     ' cm^2; third lateral area = sqrt('+area.radicand+')/2 cm^2.',
    'Total = ('+(a*b+a*h+b*h)+' + sqrt('+area.radicand+
     '))/2 = '+area.total.toFixed(2)+' cm^2 (rounded).'
   ]};
 }
 throw Error('Invalid closure topic');
}
export function makeClosurePack(topic:ClosureTopic,seed:number,quantity:number,
 difficulty:Difficulty='standard',mode?:ClosureMode):ClosurePack{
 if(!Object.hasOwn(CLOSURE_MODES,topic))throw Error('Unknown closure topic');
 const allowed=CLOSURE_MODES[topic],chosen=mode??allowed[0];
 if(!allowed.includes(chosen)||!['easy','standard','challenge'].includes(difficulty))
  throw Error('Invalid closure practice configuration');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||
  !Number.isInteger(quantity)||quantity<1||quantity>40)
  throw Error('Closure seed must be uint32 and question count 1–40');
 const rng=new Rng(seed),seen=new Set<string>(),problems:ClosureProblem[]=[];
 for(let i=0;i<quantity;i++){
  const choice=chosen==='mixed'?allowed[1+(i%(allowed.length-1))]:chosen;
  let problem:ClosureProblem|undefined;
  for(let attempt=0;attempt<4000;attempt++){
   let a=0,b=0,c=0,d=0,e=0,f=0,h=0;
   if(topic==='angle-worksheets'){
    const t=triangles[rng.int(0,triangles.length-1)],multiplier=rng.int(1,difficulty==='easy'?3:6);
    const sides=t.map(v=>v*multiplier);
    // Permute the original 3 unequal sides; ABC still uniquely defined.
    for(let z=2;z>0;z--){const j=rng.int(0,z);[sides[z],sides[j]]=[sides[j],sides[z]];}
    [a,b,c]=sides;
   }else if(topic==='mixed-addition-subtraction-worksheets'){
    const lim=difficulty==='easy'?5:difficulty==='standard'?10:18;
    [a,b,c,d,e,f]=Array.from({length:6},()=>rng.int(-lim,lim));
    if((a===0&&b===0&&c===0)||(d===0&&e===0&&f===0))continue;
   }else if(topic==='lines-rays-segments-worksheets'){
    a=rng.int(2,22);b=rng.int(2,22);h=rng.int(2,22);
   }else if(topic==='multiplication-worksheets'){
    a=rng.int(difficulty==='easy'?11:21,difficulty==='challenge'?99:89);
    b=rng.int(difficulty==='easy'?11:21,difficulty==='challenge'?99:89);
   }else{
    a=rng.int(3,difficulty==='easy'?9:16);
    b=rng.int(4,difficulty==='easy'?10:17);
    h=rng.int(3,difficulty==='challenge'?19:14);
   }
   const sig=[choice,a,b,c,d,e,f,h].join('|');
   if(seen.has(sig))continue;seen.add(sig);
   const detail=describe(topic,choice,a,b,c,d,e,f,h);
   problem={id:'Q'+(i+1),topic,mode:chosen,kind:choice,a,b,c,d,e,f,h,...detail};
   break;
  }
  if(!problem)throw Error('Cannot generate requested count of distinct closure tasks');
  problems.push(problem);
 }
 return{version:CLOSURE_VERSION,topic,seed,quantity,difficulty,mode:chosen,problems};
}
export function verifyClosurePack(p:ClosurePack){
 if(!p||!Object.hasOwn(CLOSURE_MODES,p.topic)||!Array.isArray(p.problems))
  throw Error('Invalid closure task pack');
 const expected=makeClosurePack(p.topic,p.seed,p.quantity,p.difficulty,p.mode);
 if(JSON.stringify(expected)!==JSON.stringify(p))
  throw Error('Closure pack seed, mathematical value, diagram or key mismatch');
}
