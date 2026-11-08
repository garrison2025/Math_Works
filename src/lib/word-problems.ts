/** R98 original online-only arithmetic word problems.
 * A distinct generator: existing 51 v18 worksheet algorithms and old shared URLs are unchanged.
 * Source V2 word-problems intent remains HOLD for public indexing pending separate owner review.
 */
export type StoryMode='proportions'|'area'|'multiplication'|'division';
export type StoryChoice=StoryMode|'mixed';
export type StoryLevel='easy'|'standard'|'challenge';
export type StoryValues={a:number;b:number;c:number};
export type StoryProblem={id:string;mode:StoryMode;question:string;answer:string;steps:string[];values:StoryValues;units:string};
export type StorySet={version:'wp1';seed:number;mode:StoryChoice;level:StoryLevel;questions:StoryProblem[]};
export const STORY_CHOICES:readonly StoryChoice[]=['mixed','proportions','area','multiplication','division'];
export const STORY_LEVELS:readonly StoryLevel[]=['easy','standard','challenge'];
const MODES:readonly StoryMode[]=['proportions','area','multiplication','division'];
class Rng{
 private value:number;
 constructor(seed:number){this.value=seed===0?0x6d2b79f5:seed>>>0;}
 next(){let v=this.value;v^=v<<13;v^=v>>>17;v^=v<<5;this.value=v>>>0;return this.value}
 int(min:number,max:number){return min+this.next()%(max-min+1)}
 pick<T>(arr:readonly T[]):T{return arr[this.int(0,arr.length-1)]}
}
function limit(level:StoryLevel):[number,number]{
 return level==='easy'?[2,9]:level==='standard'?[3,16]:[7,28];
}
function problem(rng:Rng,mode:StoryMode,level:StoryLevel):Omit<StoryProblem,'id'>{
 const [lo,hi]=limit(level),a=rng.int(lo,hi),b=rng.int(2,level==='challenge'?14:10);
 if(mode==='proportions'){
  const c=rng.int(2,level==='challenge'?18:12);
  const total=a*b,needed=a*c;
  return {
   mode,values:{a,b,c},units:'cups',
   question:`A community kitchen uses ${total} cups of rice for ${b} identical meal batches. At the same rate, how many cups are needed for ${c} batches?`,
   answer:`${needed} cups`,
   steps:[`Unit rate: ${total} / ${b} = ${a} cups per batch.`,`For ${c} batches: ${a} x ${c} = ${needed} cups.`]
  };
 }
 if(mode==='area'){
  const area=a*b;
  return {
   mode,values:{a,b,c:0},units:'square feet',
   question:`A rectangular school garden is ${a} feet long and ${b} feet wide. What area of soil does it cover in square feet?`,
   answer:`${area} square feet`,
   steps:[`Area of a rectangle = length x width.`,`${a} x ${b} = ${area} square feet.`]
  };
 }
 if(mode==='multiplication'){
  const count=a*b;
  return {
   mode,values:{a,b,c:0},units:'markers',
   question:`An art teacher puts ${a} markers in each box. If there are ${b} boxes, how many markers are there altogether?`,
   answer:`${count} markers`,
   steps:[`Each of ${b} equal boxes has ${a} markers.`,`${b} x ${a} = ${count} markers.`]
  };
 }
 const total=a*b;
 return {
  mode,values:{a,b,c:0},units:'pencils',
  question:`A school shares ${total} pencils equally among ${b} students, with none left over. How many pencils does each student receive?`,
  answer:`${a} pencils`,
  steps:[`Equal sharing means divide the ${total} pencils by ${b} students.`,`${total} / ${b} = ${a} pencils per student.`]
 };
}
export function expectedStoryAnswer(p:Pick<StoryProblem,'mode'|'values'|'units'>):string{
 const {a,b,c}=p.values;
 if(![a,b,c].every(Number.isSafeInteger)||a<=0||b<=0||c<0)throw Error('Invalid story operands');
 const units=({proportions:'cups',area:'square feet',multiplication:'markers',division:'pencils'} as const)[p.mode];
 if(!units||p.units!==units)throw Error('Wrong unit for story type');
 const result=p.mode==='proportions'?a*c:p.mode==='area'||p.mode==='multiplication'?a*b:a;
 return `${result} ${units}`;
}
export function verifyStorySet(set:StorySet):void{
 if(set.version!=='wp1'||!Number.isInteger(set.seed)||set.seed<0||set.seed>0xffffffff||!STORY_CHOICES.includes(set.mode)||!STORY_LEVELS.includes(set.level))throw Error('Invalid story sheet settings');
 if(set.questions.length<4||set.questions.length>40||![4,8,12,16,20,30,40].includes(set.questions.length))throw Error('Invalid story count');
 const seen=new Set<string>();
 for(let i=0;i<set.questions.length;i++){
  const p=set.questions[i];
  if(p.id!==`Q${i+1}`||!MODES.includes(p.mode)||set.mode!=='mixed'&&set.mode!==p.mode||!p.question?.trim()||p.steps.length!==2)throw Error('Invalid story shape');
  if(p.answer!==expectedStoryAnswer(p))throw Error('Story arithmetic or units mismatch');
  const key=p.question;
  if(seen.has(key))throw Error('Duplicate word problem');
  seen.add(key);
  // Independent question-field comparison: answer values must be visible in the narrative.
  if(!p.question.includes(String(p.values.b)))throw Error('Story numbers do not agree with question');
  const v=p.values;
  if(p.mode==='proportions'&&(!p.question.includes(String(v.a*v.b))||!p.question.includes(String(v.c))))throw Error('Proportion prompt mismatch');
  if(p.mode==='division'&&!p.question.includes(String(v.a*v.b)))throw Error('Division prompt mismatch');
  if(!p.steps.at(-1)?.includes(p.units))throw Error('Missing final answer units in steps');
 }
}
export function makeStorySet(seed:number,count:number=8,mode:StoryChoice='mixed',level:StoryLevel='standard'):StorySet{
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!STORY_CHOICES.includes(mode)||!STORY_LEVELS.includes(level)||![4,8,12,16,20,30,40].includes(count))throw Error('Invalid story options');
 const rng=new Rng(seed),questions:StoryProblem[]=[],seen=new Set<string>();
 let trials=0;
 while(questions.length<count){
  if(++trials>10000)throw Error('Unable to create enough distinct stories');
  const selected=mode==='mixed'?MODES[questions.length%MODES.length]:mode;
  const candidate=problem(rng,selected,level);
  if(seen.has(candidate.question))continue;
  seen.add(candidate.question);
  questions.push({id:`Q${questions.length+1}`,...candidate});
 }
 const set:StorySet={version:'wp1',seed,mode,level,questions};
 verifyStorySet(set);
 return set;
}
