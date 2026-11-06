/** R74: independent English-to-inequality and compound AND/OR practice.
 * Retains the original v18 inequality generator, worksheet seed and share URL.
 */
import {Rng,type Difficulty} from './math.ts';
export const INEQUALITY_EXTENSION_VERSION='R74.1' as const;
export type InequalityPracticeMode='mixed'|'translate'|'and'|'or';
export type InequalityKind=Exclude<InequalityPracticeMode,'mixed'>;
export type InequalityGraph={kind:'left'|'right'|'between'|'outside';lower:number;upper:number;closedLeft:boolean;closedRight:boolean};
export type InequalityPracticeProblem={
 id:string;kind:InequalityKind;context:number;bound:number;constant:number;
 lower:number;upper:number;closedLeft:boolean;closedRight:boolean;
 question:string;answer:string;steps:readonly [string,string];graph:InequalityGraph;
};
export type InequalityPracticePack={
 topic:'inequalities-worksheets';version:typeof INEQUALITY_EXTENSION_VERSION;seed:number;
 quantity:number;difficulty:Difficulty;mode:InequalityPracticeMode;
 problems:InequalityPracticeProblem[];
};
const kinds:readonly InequalityKind[]=['translate','and','or'];
const compare=(closed:boolean,side:'left'|'right',kind:'and'|'or')=>
 kind==='and'?(side==='left'?(closed?'≤':'<'):(closed?'≤':'<')):
 (closed?'≤':'<');
function materialize(p:Omit<InequalityPracticeProblem,'question'|'answer'|'steps'|'graph'>):InequalityPracticeProblem{
 const {kind,context,bound,constant,lower,upper,closedLeft,closedRight}=p;
 let question='',answer='',steps:[string,string],graph:InequalityGraph;
 if(kind==='translate'){
  let symbol='',why='';
  if(context===0){
   const total=bound+constant;
   question='A number x increased by '+constant+' is at most '+total+'. Write an inequality.';
   symbol='x + '+constant+' ≤ '+total;
   why='Increased by means add; at most means ≤.';
   graph={kind:'left',lower:bound,upper:bound,closedLeft:true,closedRight:false};
  }else if(context===1){
   const total=bound-constant;
   question='A number x decreased by '+constant+' is at least '+total+'. Write an inequality.';
   symbol='x - '+constant+' ≥ '+total;
   why='Decreased by means subtract; at least means ≥.';
   graph={kind:'right',lower:bound,upper:bound,closedLeft:false,closedRight:true};
  }else if(context===2){
   const total=constant*bound;
   question=constant+' times a number x is less than '+total+'. Write an inequality.';
   symbol=constant+'x < '+total;
   why='Times means multiply; less than means < (not ≤).';
   graph={kind:'left',lower:bound,upper:bound,closedLeft:false,closedRight:false};
  }else if(context===3&&bound%constant===0){
   const total=bound/constant;
   question='A number x divided by '+constant+' is greater than '+total+'. Write an inequality.';
   symbol='x / '+constant+' > '+total;
   why='Divided by means divide; greater than means > (not ≥).';
   graph={kind:'right',lower:bound,upper:bound,closedLeft:false,closedRight:false};
  }else throw Error('Invalid inequality translation context');
  answer=symbol;
  steps=[why,'Since '+constant+' is positive, solving gives '+(graph.kind==='left'?'x '+(graph.closedLeft?'≤':'<'):'x '+(graph.closedRight?'≥':'>'))+' '+bound+'.'];
 }else{
  if(lower>=upper)throw Error('Compound inequality endpoints must be increasing');
  if(kind==='and'){
   question='A number x is '+(closedLeft?'at least ':'greater than ')+lower+
    ' and '+(closedRight?'at most ':'less than ')+upper+'. Write and graph the compound inequality.';
   answer=lower+' '+compare(closedLeft,'left','and')+' x '+compare(closedRight,'right','and')+' '+upper;
   steps=['AND means both conditions must hold at once.',
    'Shade between '+lower+' and '+upper+'; '+(closedLeft?'include':'exclude')+' '+lower+' and '+(closedRight?'include':'exclude')+' '+upper+'.'];
   graph={kind:'between',lower,upper,closedLeft,closedRight};
  }else{
   question='A number x is '+(closedLeft?'at most ':'less than ')+lower+
    ' or '+(closedRight?'at least ':'greater than ')+upper+'. Write and graph the compound inequality.';
   answer='x '+(closedLeft?'≤':'<')+' '+lower+' or x '+(closedRight?'≥':'>')+' '+upper;
   steps=['OR means either condition is enough.',
    'Shade left of '+lower+' and right of '+upper+'; '+(closedLeft?'include':'exclude')+' '+lower+' and '+(closedRight?'include':'exclude')+' '+upper+'.'];
   graph={kind:'outside',lower,upper,closedLeft,closedRight};
  }
 }
 return {...p,question,answer,steps,graph};
}
export function createInequalityPracticePack(topic:InequalityPracticePack['topic'],seed:number,
 quantity:number,difficulty:Difficulty='standard',mode:InequalityPracticeMode='mixed'):InequalityPracticePack{
 if(topic!=='inequalities-worksheets')throw Error('Inequality extension route mismatch');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid inequality seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1–40 inequality questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid inequality difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid inequality practice mode');
 const rng=new Rng(seed),problems:InequalityPracticeProblem[]=[],used=new Set<string>();
 const shift=rng.int(0,2);
 for(let i=0;i<quantity;i++){
  const kind:InequalityKind=mode==='mixed'?kinds[(i+shift)%3]:mode;
  let found:InequalityPracticeProblem|undefined;
  for(let tries=0;tries<2000;tries++){
   const context=kind==='translate'?rng.int(0,3):0;
   const constant=rng.int(2,difficulty==='easy'?5:difficulty==='standard'?8:12);
   let bound=rng.int(difficulty==='easy'?-10:difficulty==='standard'?-20:-40,
    difficulty==='easy'?10:difficulty==='standard'?20:40);
   if(context===3)bound*=constant;
   const lower=rng.int(-15,difficulty==='challenge'?0:5);
   const upper=lower+rng.int(2,difficulty==='easy'?12:difficulty==='standard'?20:40);
   const closedLeft=rng.int(0,1)===1,closedRight=rng.int(0,1)===1;
   const candidate=materialize({id:'Q'+(i+1),kind,context,bound,constant,
    lower,upper,closedLeft,closedRight});
   if(used.has(candidate.question))continue;
   used.add(candidate.question);found=candidate;break;
  }
  if(!found)throw Error('Unable to generate distinct inequality questions');
  problems.push(found);
 }
 return {topic,version:INEQUALITY_EXTENSION_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyInequalityPracticePack(pack:InequalityPracticePack):void{
 if(!pack||pack.topic!=='inequalities-worksheets'||pack.version!==INEQUALITY_EXTENSION_VERSION||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid inequality pack metadata');
 const expected=createInequalityPracticePack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))throw Error('Invalid inequality math, text, endpoint or answer');
 for(const p of pack.problems){
  if(p.kind==='and'&&!(p.graph.lower<p.graph.upper))throw Error('Invalid AND bounds');
  if(p.kind==='or'&&!(p.graph.lower<p.graph.upper))throw Error('Invalid OR bounds');
  if(p.kind==='translate'&&p.graph.lower!==p.graph.upper)throw Error('Incorrect translation solution bound');
 }
}
