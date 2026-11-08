/** R101 authentic supplemental math practice. No source SEO evidence or 51 core generators are modified. */
export type WideMode='grade2'|'grade5'|'real-shapes'|'shapes'|'polygon-sides'|'congruent'|'similar'|'triangles'|'circles'|'volumes'|'equation-stories';
export type WideLevel='easy'|'standard'|'challenge';
export type WideKind='g2-add'|'g2-sub'|'g2-place'|'g2-time'|'g2-money'|'g2-shape'|'g5-mult'|'g5-div'|'g5-decimal'|'g5-fraction'|'g5-volume'|'g5-order'|'g5-measure'|'g5-story'|'real-shape'|'polygon-sides'|'triangle-congruence'|'triangle-similarity'|'tri-angle'|'tri-area'|'circle-radius'|'circle-circumference'|'circle-area'|'circle-semicircle'|'vol-prism'|'vol-cylinder'|'vol-cone'|'vol-sphere'|'vol-pyramid'|'vol-tri-pyramid'|'eq-one-step'|'eq-two-step'|'eq-multi';
export type WideValues={a:number;b:number;c:number;d:number;v:number};
export type WideProblem={id:string;kind:WideKind;values:WideValues;question:string;answer:string;steps:string[]};
export type WidePack={version:'wm1';seed:number;mode:WideMode;level:WideLevel;problems:WideProblem[]};
export const WIDE_MODES:readonly WideMode[]=['grade2','grade5','real-shapes','shapes','polygon-sides','congruent','similar','triangles','circles','volumes','equation-stories'];
export const WIDE_LEVELS:readonly WideLevel[]=['easy','standard','challenge'];
export const WIDE_COUNTS:readonly number[]=[8,16,24];
const groups:Record<WideMode,readonly WideKind[]>={
 grade2:['g2-add','g2-sub','g2-place','g2-time','g2-money','g2-shape'],
 grade5:['g5-mult','g5-div','g5-decimal','g5-fraction','g5-volume','g5-order','g5-measure','g5-story'],
 'real-shapes':['real-shape'],shapes:['real-shape','polygon-sides','g2-shape','tri-angle'],
 'polygon-sides':['polygon-sides'],congruent:['triangle-congruence'],similar:['triangle-similarity'],
 triangles:['triangle-congruence','triangle-similarity','tri-angle','tri-area'],
 circles:['circle-radius','circle-circumference','circle-area','circle-semicircle'],
 volumes:['vol-prism','vol-cylinder','vol-cone','vol-sphere','vol-pyramid','vol-tri-pyramid'],
 'equation-stories':['eq-one-step','eq-two-step','eq-multi']
};
export const MODE_LABELS:Record<WideMode,string>={
 grade2:'Grade 2 mixed skills (six strands)',grade5:'Grade 5 mixed skills (eight strands)',
 'real-shapes':'Everyday objects and geometric shapes',shapes:'Shapes, sides and triangle basics',
 'polygon-sides':'Polygons and number of sides',congruent:'Triangle congruence: SSS, SAS, ASA, AAS, HL',
 similar:'Similar right triangles: corresponding sides',triangles:'Triangle mixed practice',
 circles:'Circle measurements (radius, circumference, area, semicircle perimeter)',
 volumes:'Volumes: prisms, cylinder, cone, sphere and pyramids',
 'equation-stories':'One-, two- and multistep equation stories'
};
const names=['triangle','quadrilateral','pentagon','hexagon','heptagon','octagon','nonagon','decagon','hendecagon','dodecagon'];
const objects=[
 {name:'a round wall clock',shape:'circle',dim:'2D'},
 {name:'a rectangular windowpane',shape:'rectangle',dim:'2D'},
 {name:'a stop sign',shape:'octagon',dim:'2D'},
 {name:'a basketball',shape:'sphere',dim:'3D'},
 {name:'a soup can',shape:'cylinder',dim:'3D'},
 {name:'a six-sided die',shape:'cube',dim:'3D'}
] as const;
const scenes=['In a classroom,','In a kitchen,','On a city street,','In a shop,','At a playground,','In a drawing lesson,','At a museum,','At home,','For a geometry poster,','In a science lesson,'];
class Rng{
 private x:number;
 constructor(seed:number){this.x=(seed>>>0)||0x6d2b79f5}
 next(){let x=this.x;x^=x<<13;x^=x>>>17;x^=x<<5;this.x=x>>>0;return this.x}
 int(lo:number,hi:number){return lo+this.next()%(hi-lo+1)}
}
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
const fixed=(cents:number)=> (cents/100).toFixed(2);
const nameOf=(n:number)=>names[n-3];
function valid(n:number,lo:number,hi:number){if(!Number.isSafeInteger(n)||n<lo||n>hi)throw Error('Invalid wide problem metadata');return n;}
function model(kind:WideKind,z:WideValues):Pick<WideProblem,'question'|'answer'|'steps'>{
 const {a,b,c,d,v}=z;
 [a,b,c,d,v].forEach(n=>valid(n,-1000000,1000000));
 const answer=(question:string,result:string,...steps:string[])=>({question,answer:result,steps});
 switch(kind){
 case 'g2-add':{
  valid(a,10,99);valid(b,1,80);
  return answer('Add '+a+' + '+b+'.',String(a+b),'Add ones, regroup if needed, then add tens.','The sum is '+(a+b)+'.');
 }
 case 'g2-sub':{
  valid(a,20,180);valid(b,1,a);
  return answer('Subtract '+a+' - '+b+'.',String(a-b),'Subtract ones, regroup from tens if needed.','The difference is '+(a-b)+'.');
 }
 case 'g2-place':{
  valid(a,100,999);valid(v,0,2);
  const parts=['hundreds','tens','ones'],digit=[Math.floor(a/100),Math.floor(a/10)%10,a%10][v];
  return answer('In '+a+', what is the '+parts[v]+' digit?',String(digit),'Read the '+parts[v]+' place in '+a+'.','The '+parts[v]+' digit is '+digit+'.');
 }
 case 'g2-time':{
  valid(a,1,11);valid(b,0,59);valid(c,5,50);
  const total=a*60+b+c,h=Math.floor(total/60),m=total%60,clock=String(h)+':'+String(m).padStart(2,'0');
  return answer('A lesson starts at '+a+':'+String(b).padStart(2,'0')+' a.m. and lasts '+c+' minutes. When does it end?',clock+' a.m.',
   'Add '+c+' minutes to the start time.','End time: '+clock+' a.m.');
 }
 case 'g2-money':{
  valid(a,5,75);valid(b,5,75);
  return answer('A pencil costs '+a+' cents and an eraser costs '+b+' cents. How many cents altogether?',String(a+b)+' cents',
   'Add the two prices: '+a+' + '+b+' = '+(a+b)+'.','Use cents for the final answer.');
 }
 case 'g2-shape':case 'real-shape':{
  valid(v,0,5);valid(a,0,9);const o=objects[v];
  return answer(scenes[a]+' what '+o.dim+' geometric shape best describes '+o.name+'?',o.shape,
   'Decide whether the object is described by its flat face or three-dimensional form.','The '+o.name+' is modeled by a '+o.shape+'.');
 }
 case 'g5-mult':{
  valid(a,100,999);valid(b,10,99);
  return answer('Multiply '+a+' × '+b+'.',String(a*b),'Multiply '+a+' by '+(b%10)+' and by '+(Math.floor(b/10)*10)+'.','Add the partial products to get '+(a*b)+'.');
 }
 case 'g5-div':{
  valid(a,10,300);valid(b,2,9);
  return answer('Divide '+(a*b)+' ÷ '+b+'.',String(a),'Find the number that times '+b+' is '+(a*b)+'.','Since '+a+' × '+b+' = '+(a*b)+', the quotient is '+a+'.');
 }
 case 'g5-decimal':{
  valid(a,100,9999);valid(b,50,5000);valid(v,0,1);
  const sum=v===0?a+b:a-b;
  return answer('Calculate '+fixed(a)+(v===0?' + ':' - ')+fixed(b)+'.',fixed(sum),
   'Align the decimal points and work in hundredths.','Answer: '+fixed(sum)+'.');
 }
 case 'g5-fraction':{
  valid(a,1,11);valid(b,2,12);valid(c,1,11);valid(d,2,12);
  if(a>=b||c>=d)throw Error('Fractions must be proper');
  const n=a*d+c*b,den=b*d,g=gcd(n,den),num=n/g,bottom=den/g;
  return answer('Add '+a+'/'+b+' + '+c+'/'+d+'. Write the answer in lowest terms.',bottom===1?String(num):num+'/'+bottom,
   'Common denominator '+den+': '+(a*d)+'/'+den+' + '+(c*b)+'/'+den+' = '+n+'/'+den+'.',
   'Divide numerator and denominator by '+g+' to simplify.');
 }
 case 'g5-volume':case 'vol-prism':{
  valid(a,2,25);valid(b,2,25);valid(c,2,25);const volume=a*b*c;
  return answer('A rectangular prism is '+a+' cm long, '+b+' cm wide and '+c+' cm high. Find its volume.',String(volume)+' cm³',
   'Use V = length × width × height.','V = '+a+' × '+b+' × '+c+' = '+volume+' cm³.');
 }
 case 'g5-order':{
  valid(a,2,12);valid(b,1,30);valid(c,1,30);const v=a*(b+c)+d;
  valid(d,1,30);
  return answer('Evaluate '+a+' × ('+b+' + '+c+') + '+d+'.',String(v),
   'Parentheses first: '+b+' + '+c+' = '+(b+c)+'.','Then '+a+' × '+(b+c)+' + '+d+' = '+v+'.');
 }
 case 'g5-measure':{
  valid(a,1,50);valid(v,0,1);const unit=v===0?'metres':'litres',out=v===0?'centimetres':'millilitres';
  const factor=v===0?100:1000;
  return answer('Convert '+a+' '+unit+' to '+out+'.',String(a*factor)+' '+out,
   'One '+(v===0?'metre = 100 centimetres':'litre = 1000 millilitres')+'.','Multiply '+a+' by '+factor+' = '+a*factor+'.');
 }
 case 'g5-story':{
  valid(a,3,22);valid(b,2,24);valid(c,1,a*b);
  return answer('A teacher has '+a+' packs with '+b+' stickers in each. After giving away '+c+' stickers, how many remain?',String(a*b-c)+' stickers',
   'Multiply to get '+a*b+' total stickers.','Subtract '+c+' donated stickers: '+(a*b-c)+' remain.');
 }
 case 'polygon-sides':{
  valid(a,3,12);valid(v,0,2);
  if(v===0)return answer('How many sides does a '+nameOf(a)+' have?',String(a),'A '+nameOf(a)+' is a polygon with '+a+' straight sides.','Count all '+a+' edges.');
  if(v===1)return answer('What is the name of a polygon with '+a+' straight sides?',nameOf(a),
   'Match the number of sides to the polygon name.','A '+a+'-sided polygon is a '+nameOf(a)+'.');
  return answer('A regular '+nameOf(a)+' is shown. How many vertices does it have?',String(a),
   'In a simple polygon each pair of neighboring sides meets at one vertex.','There are '+a+' vertices.');
 }
 case 'triangle-congruence':{
  valid(v,0,4);
  if(v===0){
   valid(a,4,24);valid(b,4,24);valid(c,2,60);
   if(c<=Math.abs(a-b)||c>=a+b)throw Error('Invalid SSS triangle');
   return answer('Triangle ABC has AB='+a+', BC='+b+', AC='+c+'. Triangle DEF has DE='+a+', EF='+b+', DF='+c+'. State a congruence rule.',
    'Congruent by SSS','AB=DE, BC=EF and AC=DF.','All three corresponding side pairs match: SSS.');
  }
  if(v===1){
   valid(a,3,24);valid(b,3,24);valid(c,25,145);
   return answer('AB='+a+', AC='+b+', angle BAC='+c+'°. DE='+a+', DF='+b+', angle EDF='+c+'°. State a triangle congruence rule.',
    'Congruent by SAS','Two pairs of corresponding sides match.','The equal angles are included between those sides: SAS.');
  }
  if(v===2||v===3){
   valid(a,25,80);valid(b,25,80);valid(c,3,24);
   if(a+b>=175)throw Error('Invalid triangle angles');
   const side=v===2?'AB and DE':'BC and EF',rule=v===2?'ASA':'AAS';
   return answer('Angles A and D are '+a+'°; angles B and E are '+b+'°. Sides '+side+' each measure '+c+'. State a congruence rule.',
    'Congruent by '+rule,'Two corresponding angles match in ABC and DEF.',
    v===2?'The equal side lies between those two angles: ASA.':'The equal side is not included between the two given angles: AAS.');
  }
  valid(a,5,30);valid(b,3,a-1);
  return answer('ABC and DEF are right triangles (right angles at B and E). Hypotenuses AC and DF are '+a+'; legs AB and DE are '+b+'. State a congruence rule.',
   'Congruent by HL','The triangles are right triangles with equal hypotenuses.','One corresponding leg also matches: HL.');
 }
 case 'triangle-similarity':{
  valid(a,0,1);valid(b,1,5);valid(c,2,6);valid(v,0,2);
  const legs=a===0?[3,4,5]:[5,12,13],sm=legs.map(x=>x*b),lg=sm.map(x=>x*c);
  const basic='ABC is right at B with AB='+sm[0]+', BC='+sm[1]+'. DEF is right at E with DE='+lg[0]+'. ';
  if(v===0)return answer(basic+'The triangles are similar with scale factor '+c+' (ABC to DEF). Find EF.',
   String(lg[1]),'Corresponding legs BC and EF scale together.','EF = '+sm[1]+' × '+c+' = '+lg[1]+'.');
  if(v===1)return answer(basic+'The triangles are similar. Find the hypotenuse DF.',
   String(lg[2]),'AC = '+sm[2]+' from the '+legs[0]+'-'+legs[1]+'-'+legs[2]+' right-triangle family.',
   'Scale factor DE / AB = '+lg[0]+'/'+sm[0]+' = '+c+'. So DF = '+sm[2]+' × '+c+' = '+lg[2]+'.');
  return answer(basic+'The corresponding BC='+sm[1]+' and EF='+lg[1]+'. Find the scale factor from ABC to DEF.',
   String(c),'Use the ratio of corresponding sides, EF / BC.','The factor is '+lg[1]+' / '+sm[1]+' = '+c+'.');
 }
 case 'tri-angle':{
  valid(a,25,90);valid(b,25,90);if(a+b>=175)throw Error('Invalid triangle');
  return answer('Two interior angles of a triangle measure '+a+'° and '+b+'°. Find the third angle.',String(180-a-b)+'°',
   'A triangle has 180° of interior angles.','180° - '+a+'° - '+b+'° = '+(180-a-b)+'°.');
 }
 case 'tri-area':{
  valid(a,2,24);valid(b,2,24);
  const base=2*a,area=a*b;
  return answer('A triangle has base '+base+' cm and perpendicular height '+b+' cm. Find the area.',String(area)+' cm²',
   'Use A = base × perpendicular height / 2.','A = '+base+' × '+b+' / 2 = '+area+' cm².');
 }
 case 'circle-radius':{
  valid(a,2,35);return answer('A circle has diameter '+(2*a)+' cm. Find its radius.',a+' cm',
   'The radius is half the diameter.','Radius = '+(2*a)+' / 2 = '+a+' cm.');
 }
 case 'circle-circumference':{
  valid(a,2,35);return answer('A circle has radius '+a+' cm. Find the circumference exactly in terms of π.',(2*a)+'π cm',
   'Use C = 2πr.','C = 2 × '+a+' × π = '+(2*a)+'π cm.');
 }
 case 'circle-area':{
  valid(a,2,35);return answer('A circle has radius '+a+' cm. Find its area exactly in terms of π.',a*a+'π cm²',
   'Use A = πr².','A = '+a+'²π = '+a*a+'π cm².');
 }
 case 'circle-semicircle':{
  valid(a,2,35);return answer('A semicircle has radius '+a+' cm. Find its total perimeter exactly, including the diameter.',
   a+'π + '+2*a+' cm','Half the curved circumference is πr = '+a+'π cm.',
   'Add the straight diameter 2r = '+2*a+' cm, giving '+a+'π + '+2*a+' cm.');
 }
 case 'vol-cylinder':{
  valid(a,2,18);valid(b,2,30);return answer('A cylinder has radius '+a+' cm and perpendicular height '+b+' cm. Find volume exactly in terms of π.',
   a*a*b+'π cm³','Use V = πr²h.','V = π × '+a+'² × '+b+' = '+a*a*b+'π cm³.');
 }
 case 'vol-cone':{
  valid(a,2,18);valid(b,1,12);return answer('A right circular cone has radius '+a+' cm and perpendicular height '+3*b+' cm. Find its volume exactly.',
   a*a*b+'π cm³','Use V = πr²h / 3.','V = π × '+a+'² × '+(3*b)+' / 3 = '+a*a*b+'π cm³.');
 }
 case 'vol-sphere':{
  valid(a,1,8);const radius=3*a,result=4*radius*radius*radius/3;
  return answer('A sphere has radius '+radius+' cm. Find its exact volume in terms of π.',result+'π cm³',
   'Use V = 4πr³ / 3.','V = 4 × '+radius+'³ × π / 3 = '+result+'π cm³.');
 }
 case 'vol-pyramid':{
  valid(a,2,24);valid(b,1,12);return answer('A square pyramid has base side '+a+' cm and perpendicular height '+(3*b)+' cm. Find its volume.',
   a*a*b+' cm³','Base area is '+a+' × '+a+' = '+a*a+' cm².','V = base area × height / 3 = '+a*a+' × '+(3*b)+' / 3 = '+a*a*b+' cm³.');
 }
 case 'vol-tri-pyramid':{
  valid(a,2,18);valid(b,2,18);valid(c,1,12);const base=2*a,alt=b,height=3*c,volume=a*b*c;
  return answer('A triangular pyramid has base triangle base '+base+' cm and its perpendicular triangle altitude '+alt+' cm. The solid perpendicular height is '+height+' cm. Find volume.',
   volume+' cm³','Triangular base area = '+base+' × '+alt+' / 2 = '+a*b+' cm².',
   'Solid volume = '+a*b+' × '+height+' / 3 = '+volume+' cm³.');
 }
 case 'eq-one-step':{
  valid(a,2,70);valid(b,1,50);
  return answer('Mina had some stickers. After receiving '+a+' more, she had '+(a+b)+'. How many did she start with?',
   b+' stickers','Let x be the original amount: x + '+a+' = '+(a+b)+'.','Subtract '+a+' from both sides: x = '+b+'.');
 }
 case 'eq-two-step':{
  valid(a,2,12);valid(b,1,20);valid(c,2,25);
  return answer('A club bought '+a+' identical notebooks plus a '+b+'-dollar delivery fee. The total was '+(a*c+b)+' dollars. How much did each notebook cost?',
   c+' dollars','Model: '+a+'x + '+b+' = '+(a*c+b)+'.','Subtract the fee and divide by '+a+': x = '+c+'.');
 }
 case 'eq-multi':{
  valid(a,2,10);valid(b,2,15);valid(c,1,20);valid(d,2,20);
  return answer('A school ordered '+a+' identical packs. Each pack holds x pencils plus '+b+' bonus pencils. After donating '+c+' pencils, '+(a*(d+b)-c)+' remained. How many standard pencils x were in each pack?',
   d+' pencils','Model: '+a+'(x + '+b+') - '+c+' = '+(a*(d+b)-c)+'.',
   'Add '+c+', divide by '+a+', then subtract '+b+': x = '+d+'.');
 }
 }
 throw Error('Unsupported comprehensive exercise');
}
function candidate(r:Rng,kind:WideKind,level:WideLevel):Omit<WideProblem,'id'>{
 const cap=level==='easy'?7:level==='standard'?13:21;
 let a=0,b=0,c=0,d=0,v=0;
 switch(kind){
 case 'g2-add':a=r.int(15,79);b=r.int(1,cap*3);break;
 case 'g2-sub':a=r.int(30,120);b=r.int(1,a);break;
 case 'g2-place':a=r.int(100,999);v=r.int(0,2);break;
 case 'g2-time':a=r.int(1,10);b=r.int(0,59);c=r.int(5,50);break;
 case 'g2-money':a=r.int(5,75);b=r.int(5,75);break;
 case 'g2-shape':case 'real-shape':a=r.int(0,9);v=r.int(0,5);break;
 case 'g5-mult':a=r.int(110,900);b=r.int(11,70);break;
 case 'g5-div':a=r.int(11,200);b=r.int(2,9);break;
 case 'g5-decimal':a=r.int(700,5000);b=r.int(100,600);v=r.int(0,1);break;
 case 'g5-fraction':b=r.int(2,Math.min(cap,12));a=r.int(1,b-1);d=r.int(2,Math.min(cap+1,12));c=r.int(1,d-1);break;
 case 'g5-volume':case 'vol-prism':a=r.int(2,cap);b=r.int(2,cap);c=r.int(2,cap);break;
 case 'g5-order':a=r.int(2,Math.min(12,cap));b=r.int(1,cap);c=r.int(1,cap);d=r.int(1,cap);break;
 case 'g5-measure':a=r.int(1,Math.min(50,cap*2));v=r.int(0,1);break;
 case 'g5-story':a=r.int(3,cap);b=r.int(2,cap);c=r.int(1,a*b);break;
 case 'polygon-sides':a=r.int(3,12);v=r.int(0,2);break;
 case 'triangle-congruence':
  v=r.int(0,4);
  if(v===0){a=r.int(4,cap+2);b=r.int(4,cap+2);c=r.int(Math.max(2,Math.abs(a-b)+1),a+b-1);}
  else if(v===1){a=r.int(3,cap+2);b=r.int(3,cap+2);c=r.int(35,130);}
  else if(v===2||v===3){a=r.int(30,75);b=r.int(30,75);c=r.int(3,cap+2);}
  else {a=r.int(6,cap+4);b=r.int(3,a-1);}
  break;
 case 'triangle-similarity':a=r.int(0,1);b=r.int(1,Math.min(5,Math.max(2,cap-5)));c=r.int(2,6);v=r.int(0,2);break;
 case 'tri-angle':a=r.int(30,80);b=r.int(30,80);break;
 case 'tri-area':a=r.int(2,Math.min(cap+2,24));b=r.int(2,Math.min(cap+2,24));break;
 case 'circle-radius':case 'circle-circumference':case 'circle-area':case 'circle-semicircle':a=r.int(2,Math.min(cap+7,35));break;
 case 'vol-cylinder':a=r.int(2,Math.min(cap,18));b=r.int(2,Math.min(cap+5,30));break;
 case 'vol-cone':a=r.int(2,Math.min(cap,18));b=r.int(1,Math.min(cap,12));break;
 case 'vol-sphere':a=r.int(1,Math.min(cap,8));break;
 case 'vol-pyramid':a=r.int(2,Math.min(cap,24));b=r.int(1,Math.min(cap,12));break;
 case 'vol-tri-pyramid':a=r.int(2,Math.min(cap,18));b=r.int(2,Math.min(cap,18));c=r.int(1,Math.min(cap,12));break;
 case 'eq-one-step':a=r.int(2,Math.min(cap*3,70));b=r.int(1,Math.min(cap*2,50));break;
 case 'eq-two-step':a=r.int(2,Math.min(cap,12));b=r.int(1,Math.min(cap,20));c=r.int(2,Math.min(cap+3,25));break;
 case 'eq-multi':a=r.int(2,Math.min(cap,10));b=r.int(2,Math.min(cap,15));c=r.int(1,Math.min(cap,20));d=r.int(2,Math.min(cap,20));break;
 }
 const values={a,b,c,d,v};
 return {kind,values,...model(kind,values)};
}
export function verifyWidePack(pack:WidePack){
 if(pack.version!=='wm1'||!Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !WIDE_MODES.includes(pack.mode)||!WIDE_LEVELS.includes(pack.level)||!WIDE_COUNTS.includes(pack.problems.length))
  throw Error('Invalid comprehensive worksheet settings');
 const set=new Set<string>(),family=groups[pack.mode];
 for(let i=0;i<pack.problems.length;i++){
  const p=pack.problems[i];
  if(p.id!=='Q'+(i+1)||p.kind!==family[i%family.length])throw Error('Wrong exercise sequence');
  const expected=model(p.kind,p.values);
  if(p.question!==expected.question||p.answer!==expected.answer||JSON.stringify(p.steps)!==JSON.stringify(expected.steps))throw Error('Unverified worksheet question or answer');
  if(set.has(p.question))throw Error('Duplicate worksheet question');
  set.add(p.question);
 }
}
export function makeWidePack(seed:number,count=8,mode:WideMode='grade5',level:WideLevel='standard'):WidePack{
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!WIDE_COUNTS.includes(count)||
  !WIDE_MODES.includes(mode)||!WIDE_LEVELS.includes(level))throw Error('Invalid worksheet parameters');
 const r=new Rng(seed),family=groups[mode],problems:WideProblem[]=[],seen=new Set<string>();
 for(let tries=0;problems.length<count;tries++){
  if(tries>20000)throw Error('Not enough distinct exercises');
  const p=candidate(r,family[problems.length%family.length],level);
  if(seen.has(p.question))continue;
  seen.add(p.question);problems.push({id:'Q'+(problems.length+1),...p});
 }
 const pack:WidePack={version:'wm1',seed,mode,level,problems};
 verifyWidePack(pack);
 return pack;
}
export function wideDiagram(p:WideProblem):string{
 const kind=p.kind, z=p.values;
 const head='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 116" role="img" aria-label="Original schematic exercise diagram; exact values are in the question" style="width:100%;max-width:320px;height:auto">';
 const end='</svg>',line=(x1:number,y1:number,x2:number,y2:number)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#245b89" stroke-width="2" />',
 text=(x:number,y:number,s:string)=>'<text x="'+x+'" y="'+y+'" font-family="sans-serif" font-size="11" fill="#163958">'+s+'</text>';
 const polygon=(n:number,cx:number,cy:number,r:number)=>{
  const pts=Array.from({length:n},(_,i)=>[cx+Math.cos(-Math.PI/2+2*Math.PI*i/n)*r,cy+Math.sin(-Math.PI/2+2*Math.PI*i/n)*r]);
  return '<polygon points="'+pts.map(p=>p.map(x=>x.toFixed(2)).join(',')).join(' ')+'" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/>';
 };
 if(kind==='polygon-sides')return head+polygon(z.a,130,56,41)+text(170,107,nameOf(z.a)+' · '+z.a+' sides')+end;
 if(kind==='g2-shape'||kind==='real-shape'){
  const o=objects[z.v],shape=o.shape;
  let drawing='';
  if(shape==='circle'||shape==='sphere')drawing='<circle cx="130" cy="56" r="35" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/>'+(shape==='circle'?line(130,56,149,36)+line(130,56,115,47):'<ellipse cx="130" cy="56" rx="18" ry="35" fill="none" stroke="#94b1ca" stroke-width="1"/>');
  if(shape==='rectangle')drawing='<rect x="80" y="19" width="100" height="70" rx="3" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/>'+line(130,19,130,89)+line(80,54,180,54);
  if(shape==='octagon')drawing=polygon(8,130,56,40);
  if(shape==='cube')drawing='<rect x="100" y="34" width="48" height="48" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/>'+line(100,34,117,17)+line(148,34,165,17)+line(165,17,117,17)+line(148,82,165,65)+line(165,65,165,17);
  if(shape==='cylinder')drawing='<rect x="103" y="29" width="54" height="51" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/><ellipse cx="130" cy="29" rx="27" ry="11" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/><path d="M103 80 A27 11 0 0 0 157 80" fill="none" stroke="#245b89" stroke-width="2"/>';
  return head+drawing+text(76,109,o.name)+end;
 }
 if(kind==='triangle-congruence'||kind==='triangle-similarity'||kind==='tri-angle'||kind==='tri-area'){
  let drawing='<polygon points="16,88 76,88 51,19" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/>'+text(7,102,'B')+text(80,102,'C')+text(46,15,'A');
  if(kind==='triangle-congruence'||kind==='triangle-similarity')drawing+='<polygon points="147,88 242,88 203,19" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/>'+text(139,102,'E')+text(244,102,'F')+text(197,15,'D');
  drawing+=text(90,110,kind==='triangle-similarity'?'similar · schematic':'not to scale');
  return head+drawing+end;
 }
 if(kind.startsWith('circle-'))return head+'<circle cx="130" cy="56" r="39" fill="#e7f1fa" stroke="#245b89" stroke-width="2"/>'+line(130,56,169,56)+text(137,50,'r')+end;
 return '';
}
