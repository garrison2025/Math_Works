/** R100: genuine supplemental preview drills for historically held intents.
 * Original 51 v18 generators, 488 keyword evidence rows and SEO index allowlist remain untouched.
 */
export type FocusKind='literal'|'multi-step'|'simplify'|'point-angles';
export type FocusMode=FocusKind|'mixed';
export type FocusLevel='easy'|'standard'|'challenge';
export type FocusValues={a:number;b:number;c:number;d:number;variant:number};
export type FocusProblem={id:string;kind:FocusKind;values:FocusValues;question:string;answer:string;steps:string[]};
export type FocusPack={version:'fd1';seed:number;mode:FocusMode;level:FocusLevel;problems:FocusProblem[]};
export const FOCUS_MODES:readonly FocusMode[]=['mixed','literal','multi-step','simplify','point-angles'];
export const FOCUS_LEVELS:readonly FocusLevel[]=['easy','standard','challenge'];
export const FOCUS_COUNTS:readonly number[]=[4,8,12,16,20];
const ALGEBRA:readonly FocusKind[]=['literal','multi-step','simplify'];
const KINDS:readonly FocusKind[]=[...ALGEBRA,'point-angles'];
const LABELS=['A','B','C','D'] as const;
class Rng{
 private x:number;
 constructor(seed:number){this.x=(seed>>>0)||0x6d2b79f5}
 next(){let x=this.x;x^=x<<13;x^=x>>>17;x^=x<<5;this.x=x>>>0;return this.x}
 int(a:number,b:number){return a+this.next()%(b-a+1)}
}
const sign=(n:number)=>n<0?'- '+Math.abs(n):'+ '+n;
const signedX=(c:number)=>c===1?'x':c===-1?'-x':c+'x';
const simplified=(x:number,k:number)=>signedX(x)+(k===0?'':k<0?' - '+Math.abs(k):' + '+k);
function validValue(v:number,minimum:number,maximum:number):number{
 if(!Number.isSafeInteger(v)||v<minimum||v>maximum)throw Error('Invalid worksheet parameter');
 return v;
}
function model(kind:FocusKind,v:FocusValues):Pick<FocusProblem,'question'|'answer'|'steps'>{
 const {a,b,c,d,variant}=v;
 if(kind==='literal'){
  validValue(a,2,25);validValue(b,2,25);validValue(variant,0,3);
  if(c!==0||d!==0)throw Error('Invalid literal metadata');
  if(variant===0){
   const answer='x = (y - '+b+'t) / '+a;
   return {question:'Rearrange y = '+a+'x + '+b+'t to make x the subject.',
    answer,steps:['Subtract '+b+'t from both sides: '+a+'x = y - '+b+'t.','Divide by '+a+': '+answer+'.']};
  }
  if(variant===1){
   const answer='p = (S - '+b+'q) / '+a;
   return {question:'Rearrange S = '+a+'p + '+b+'q to make p the subject.',
    answer,steps:['Subtract '+b+'q from both sides: '+a+'p = S - '+b+'q.','Divide by '+a+': '+answer+'.']};
  }
  if(variant===2){
   const answer='w = E / ('+a+'v)';
   return {question:'Rearrange E = '+a+'vw to make w the subject (v is not zero).',
    answer,steps:['Identify '+a+'v as the factor multiplying w.','Divide both sides by '+a+'v: '+answer+'.']};
  }
  const answer='s = (P - '+a+'r) / '+b;
  return {question:'Rearrange P = '+a+'r + '+b+'s to make s the subject.',
   answer,steps:['Subtract '+a+'r from both sides: '+b+'s = P - '+a+'r.','Divide by '+b+': '+answer+'.']};
 }
 if(kind==='multi-step'){
  validValue(a,2,25);validValue(b,-40,40);validValue(c,-40,40);validValue(d,-40,40);
  if(variant!==0||b===0)throw Error('Invalid multistep metadata');
  const rhs=a*(d+b)+c,base=a*(d+b);
  return {question:'Solve '+a+'(x '+sign(b)+') '+sign(c)+' = '+rhs+'.',
   answer:'x = '+d,
   steps:['Subtract ('+c+') from both sides: '+a+'(x '+sign(b)+') = '+base+'.',
    'Divide by '+a+': x '+sign(b)+' = '+(d+b)+'.',
    'Subtract ('+b+'): x = '+d+'.']};
 }
 if(kind==='simplify'){
  validValue(a,2,25);validValue(b,-40,40);validValue(c,-40,40);validValue(d,-40,40);
  if(variant!==0||b===0||c===0||d===0||a+c===0)throw Error('Invalid simplifying metadata');
  const answer=simplified(a+c,a*b+d);
  return {question:'Simplify '+a+'(x '+sign(b)+') '+sign(c)+'x '+sign(d)+'.',
   answer,
   steps:['Distribute '+a+': '+a+'x '+sign(a*b)+' '+sign(c)+'x '+sign(d)+'.',
    'Combine coefficients ('+a+' + '+c+') and constants ('+(a*b)+' + '+d+'): '+answer+'.']};
 }
 if(kind==='point-angles'){
  validValue(a,35,150);validValue(b,35,150);validValue(c,35,150);validValue(d,0,3);
  if(variant!==0)throw Error('Invalid point-angle metadata');
  const fourth=360-a-b-c;
  validValue(fourth,35,150);
  const angles=[a,b,c,fourth],missing=angles[d];
  const detail=LABELS.map((label,i)=>label+' = '+(i===d?'x':angles[i])+'°').join(', ');
  return {question:'Four consecutive angles around point O: '+detail+'. Find x.',
   answer:'x = '+missing+'°',
   steps:['Angles around a point total 360°.',
    'Known angles total '+(360-missing)+'°. So x = 360° - '+(360-missing)+'° = '+missing+'°.']};
 }
 throw Error('Unsupported drill kind');
}
export function pointAngles(p:FocusProblem):{angles:[number,number,number,number];hidden:number}{
 if(p.kind!=='point-angles')throw Error('Not an angles-around-point question');
 const {a,b,c,d}=p.values;
 model(p.kind,p.values);
 return {angles:[a,b,c,360-a-b-c],hidden:d};
}
/** Data-only SVG: all displayed values are validated integers, not user-supplied HTML. */
export function pointAngleSvg(p:FocusProblem):string{
 const {angles,hidden}=pointAngles(p),cx=110,cy=110,radius=80;
 const polar=(deg:number,r:number):[number,number]=>{
  const rad=deg*Math.PI/180;
  return [Math.round((cx+Math.cos(rad)*r)*100)/100,Math.round((cy+Math.sin(rad)*r)*100)/100];
 };
 let start=-90;
 let shapes='<circle cx="110" cy="110" r="3" fill="#203c5d"/>';
 for(let i=0;i<4;i++){
  const endpoint=polar(start,radius),begin=polar(start,31),end=polar(start+angles[i],31),
   midpoint=polar(start+angles[i]/2,53);
  shapes+='<line x1="110" y1="110" x2="'+endpoint[0]+'" y2="'+endpoint[1]+'" stroke="#275d91" stroke-width="2"/>';
  shapes+='<path d="M '+begin[0]+' '+begin[1]+' A 31 31 0 0 1 '+end[0]+' '+end[1]+'" fill="none" stroke="#83a7c9" stroke-width="1.3"/>';
  shapes+='<text x="'+midpoint[0]+'" y="'+(midpoint[1]-3)+'" text-anchor="middle" font-size="10" fill="#253b54">'+LABELS[i]+'</text>';
  shapes+='<text x="'+midpoint[0]+'" y="'+(midpoint[1]+9)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#134c82">'+(i===hidden?'x':angles[i]+'°')+'</text>';
  start+=angles[i];
 }
 shapes+='<text x="117" y="123" font-size="10" fill="#26425f">O</text>';
 return '<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Four angles A B C D about point O. Unknown angle is x." style="width:100%;max-width:220px;height:auto">'+shapes+'</svg>';
}
function candidate(rng:Rng,kind:FocusKind,level:FocusLevel):Omit<FocusProblem,'id'>{
 const cap=level==='easy'?8:level==='standard'?13:22;
 let values:FocusValues;
 if(kind==='literal'){
  values={a:rng.int(2,cap),b:rng.int(2,cap),c:0,d:0,variant:rng.int(0,3)};
 }else if(kind==='multi-step'){
  const b=rng.int(1,cap)*(rng.int(0,1)?1:-1);
  values={a:rng.int(2,cap),b,c:rng.int(-cap,cap),d:rng.int(-cap,cap),variant:0};
 }else if(kind==='simplify'){
  const a=rng.int(2,cap),b=rng.int(1,cap)*(rng.int(0,1)?1:-1);
  let c=0,d=0;
  while(c===0||a+c===0)c=rng.int(-cap,cap);
  while(d===0)d=rng.int(-cap,cap);
  values={a,b,c,d,variant:0};
 }else{
  let a=0,b=0,c=0,fourth=0;
  do{a=rng.int(55,110);b=rng.int(55,110);c=rng.int(55,110);fourth=360-a-b-c}
  while(fourth<35||fourth>150);
  values={a,b,c,d:rng.int(0,3),variant:0};
 }
 return {kind,values,...model(kind,values)};
}
export function verifyFocusPack(pack:FocusPack):void{
 if(pack.version!=='fd1'||!Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
   !FOCUS_MODES.includes(pack.mode)||!FOCUS_LEVELS.includes(pack.level)||
   !FOCUS_COUNTS.includes(pack.problems.length))throw Error('Invalid focus drill settings');
 const seen=new Set<string>();
 for(let i=0;i<pack.problems.length;i++){
  const p=pack.problems[i];
  if(p.id!=='Q'+(i+1)||!KINDS.includes(p.kind)||
   (pack.mode==='mixed'?p.kind==='point-angles':p.kind!==pack.mode))
   throw Error('Invalid focus drill type/order');
  const expected=model(p.kind,p.values);
  if(p.question!==expected.question||p.answer!==expected.answer||
    JSON.stringify(p.steps)!==JSON.stringify(expected.steps))throw Error('Drill question-answer-steps mismatch');
  if(seen.has(p.question))throw Error('Duplicate focus drill');
  seen.add(p.question);
 }
}
export function makeFocusPack(seed:number,count=8,mode:FocusMode='mixed',level:FocusLevel='standard'):FocusPack{
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!FOCUS_COUNTS.includes(count)||
  !FOCUS_MODES.includes(mode)||!FOCUS_LEVELS.includes(level))throw Error('Invalid focus drill generator options');
 const rng=new Rng(seed),problems:FocusProblem[]=[],seen=new Set<string>();
 let tries=0;
 while(problems.length<count){
  if(++tries>20000)throw Error('Exhausted distinct drill questions');
  const kind=mode==='mixed'?ALGEBRA[problems.length%ALGEBRA.length]:mode;
  const p=candidate(rng,kind,level);
  if(seen.has(p.question))continue;
  seen.add(p.question);problems.push({id:'Q'+(problems.length+1),...p});
 }
 const pack:FocusPack={version:'fd1',seed,mode,level,problems};
 verifyFocusPack(pack);
 return pack;
}
