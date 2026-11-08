/** R99 original solid-volume problem generator. Exact rational coefficients; no floating-point π approximations.
 * This is a supplemental preview-only capability on a historically HOLD geometry hub.
 */
export type SolidKind='sphere'|'cone'|'square-pyramid'|'triangular-pyramid';
export type SolidMode=SolidKind|'mixed';
export type SolidLevel='easy'|'standard'|'challenge';
export type SolidUnit='cm'|'m'|'ft';
export type SolidDimensions={r?:number;h?:number;s?:number;b?:number;triHeight?:number;solidHeight?:number};
export type SolidProblem={
 id:string;kind:SolidKind;dimensions:SolidDimensions;unit:SolidUnit;
 question:string;answer:string;steps:[string,string];coefficient:{n:number;d:number};hasPi:boolean;
};
export type SolidSet={version:'sv1';seed:number;mode:SolidMode;level:SolidLevel;problems:SolidProblem[]};
export const SOLID_KINDS:readonly SolidKind[]=['sphere','cone','square-pyramid','triangular-pyramid'];
export const SOLID_MODES:readonly SolidMode[]=['mixed',...SOLID_KINDS];
export const SOLID_LEVELS:readonly SolidLevel[]=['easy','standard','challenge'];
export const SOLID_COUNTS:readonly number[]=[4,8,12,16,20];
const UNITS:readonly SolidUnit[]=['cm','m','ft'];
class Rng{
 private x:number;
 constructor(seed:number){this.x=(seed>>>0)||0x6d2b79f5}
 next(){let x=this.x;x^=x<<13;x^=x>>>17;x^=x<<5;this.x=x>>>0;return this.x}
 int(a:number,b:number){return a+this.next()%(b-a+1)}
 choose<T>(items:readonly T[]):T{return items[this.int(0,items.length-1)]}
}
function gcd(a:number,b:number):number{while(b){const t=a%b;a=b;b=t}return a}
function rational(n:number,d:number):{n:number;d:number}{
 if(!Number.isSafeInteger(n)||n<=0||!Number.isSafeInteger(d)||d<=0)throw Error('Invalid exact volume');
 const g=gcd(n,d);return {n:n/g,d:d/g};
}
function required(x:number|undefined):number{
 if(!Number.isSafeInteger(x)||x===undefined||x<1||x>60)throw Error('Invalid positive dimension');
 return x;
}
export function exactSolidCoefficient(kind:SolidKind,d:SolidDimensions):{n:number;d:number;hasPi:boolean}{
 if(kind==='sphere'){const r=required(d.r);return {...rational(4*r*r*r,3),hasPi:true}}
 if(kind==='cone'){const r=required(d.r),h=required(d.h);return {...rational(r*r*h,3),hasPi:true}}
 if(kind==='square-pyramid'){const s=required(d.s),h=required(d.h);return {...rational(s*s*h,3),hasPi:false}}
 if(kind==='triangular-pyramid'){
  const b=required(d.b),t=required(d.triHeight),h=required(d.solidHeight);
  return {...rational(b*t*h,6),hasPi:false};
 }
 throw Error('Unknown solid type');
}
export function formatSolidVolume(n:number,d:number,hasPi:boolean,unit:SolidUnit):string{
 const c=rational(n,d);
 if(!UNITS.includes(unit))throw Error('Invalid unit');
 const body=hasPi?(c.n===1?'π':String(c.n)+'π'):String(c.n);
 return body+(c.d===1?'':'/'+c.d)+' cubic '+unit;
}
function presentation(kind:SolidKind,d:SolidDimensions,unit:SolidUnit){
 const exact=exactSolidCoefficient(kind,d);
 const answer=formatSolidVolume(exact.n,exact.d,exact.hasPi,unit);
 if(kind==='sphere'){
  const r=required(d.r);
  return {question:'A sphere has radius '+r+' '+unit+'. Find its exact volume in cubic '+unit+', in terms of π.',
   steps:['Sphere formula: V = (4/3) × π × r³.',
    'With r = '+r+': V = (4 × '+r+'³ / 3) × π = '+answer+'.'],answer,exact};
 }
 if(kind==='cone'){
  const r=required(d.r),h=required(d.h);
  return {question:'A right circular cone has radius '+r+' '+unit+' and perpendicular height '+h+' '+unit+'. Find its exact volume in cubic '+unit+', in terms of π.',
   steps:['Cone formula: V = (1/3) × π × r² × h.',
    'With r = '+r+' and h = '+h+': V = (1/3) × π × '+r+'² × '+h+' = '+answer+'.'],answer,exact};
 }
 if(kind==='square-pyramid'){
  const s=required(d.s),h=required(d.h);
  return {question:'A right square pyramid has square base side '+s+' '+unit+' and perpendicular height '+h+' '+unit+'. Find its volume in cubic '+unit+'.',
   steps:['Pyramid formula: V = (base area × perpendicular height) / 3.',
    'Base area = '+s+'²; volume = ('+s+'² × '+h+') / 3 = '+answer+'.'],answer,exact};
 }
 const b=required(d.b),t=required(d.triHeight),h=required(d.solidHeight);
 return {question:'A triangular pyramid has a triangular base of length '+b+' '+unit+' and triangle altitude '+t+' '+unit+'. Its perpendicular pyramid height is '+h+' '+unit+'. Find its volume in cubic '+unit+'.',
  steps:['Base triangle area = (base × triangle altitude) / 2; pyramid volume = base area × pyramid height / 3.',
   'V = ('+b+' × '+t+' × '+h+') / 6 = '+answer+'.'],answer,exact};
}
function sample(rng:Rng,kind:SolidKind,level:SolidLevel):Omit<SolidProblem,'id'>{
 const [min,max]=level==='easy'?[2,21]:level==='standard'?[4,25]:[8,30];
 const unit=rng.choose(UNITS);
 const dimensions:SolidDimensions=kind==='sphere'?{r:rng.int(min,max)}:
  kind==='cone'?{r:rng.int(min,max),h:rng.int(min,max)}:
  kind==='square-pyramid'?{s:rng.int(min,max),h:rng.int(min,max)}:
  {b:rng.int(min,max),triHeight:rng.int(min,max),solidHeight:rng.int(min,max)};
 const p=presentation(kind,dimensions,unit);
 return {kind,dimensions,unit,question:p.question,answer:p.answer,
  steps:p.steps as [string,string],coefficient:{n:p.exact.n,d:p.exact.d},hasPi:p.exact.hasPi};
}
export function verifySolidSet(set:SolidSet):void{
 if(set.version!=='sv1'||!Number.isSafeInteger(set.seed)||set.seed<0||set.seed>0xffffffff
   ||!SOLID_MODES.includes(set.mode)||!SOLID_LEVELS.includes(set.level)||!SOLID_COUNTS.includes(set.problems.length))
  throw Error('Invalid solid worksheet configuration');
 const seen=new Set<string>();
 for(let i=0;i<set.problems.length;i++){
  const p=set.problems[i];
  if(p.id!=='Q'+(i+1)||!SOLID_KINDS.includes(p.kind)
     ||set.mode!=='mixed'&&p.kind!==set.mode||!UNITS.includes(p.unit))
   throw Error('Invalid solid problem metadata');
  const x=presentation(p.kind,p.dimensions,p.unit);
  if(p.answer!==x.answer||p.question!==x.question||p.steps.length!==2||
     p.steps[0]!==x.steps[0]||p.steps[1]!==x.steps[1]||
     p.coefficient.n!==x.exact.n||p.coefficient.d!==x.exact.d||p.hasPi!==x.exact.hasPi)
   throw Error('Solid volume question/answer/steps mismatch');
  if(seen.has(p.question))throw Error('Duplicate volume problem');
  seen.add(p.question);
 }
}
export function makeSolidSet(seed:number,count:number=8,mode:SolidMode='mixed',level:SolidLevel='standard'):SolidSet{
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!SOLID_COUNTS.includes(count)||
   !SOLID_MODES.includes(mode)||!SOLID_LEVELS.includes(level))throw Error('Invalid solid worksheet options');
 const rng=new Rng(seed),problems:SolidProblem[]=[],seen=new Set<string>();
 let tries=0;
 while(problems.length<count){
  if(++tries>15000)throw Error('Unable to generate enough distinct solid problems');
  const kind=mode==='mixed'?SOLID_KINDS[problems.length%SOLID_KINDS.length]:mode;
  const p=sample(rng,kind,level);
  if(seen.has(p.question))continue;
  seen.add(p.question);
  problems.push({id:'Q'+(problems.length+1),...p});
 }
 const set:SolidSet={version:'sv1',seed,mode,level,problems};
 verifySolidSet(set);return set;
}
