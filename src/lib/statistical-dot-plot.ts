/** R77: genuinely statistical frequency dot plots, NOT count-the-pictures.
 * Reproducible integer observations 1..10, stacks record frequencies and
 * reading or plotting tasks use an actual fixed labelled data scale.
 */
import {Rng,type Difficulty} from './math.ts';
export const DOT_PLOT_VERSION='R77.1' as const;
export type DotPlotMode='mixed'|'plot'|'frequency'|'mode'|'median'|'range';
export type DotPlotKind=Exclude<DotPlotMode,'mixed'>;
export type DotPlotProblem={
 id:string;kind:DotPlotKind;observations:number[];frequencies:number[];
 targetValue:number;question:string;answer:string;steps:readonly [string,string,string];
};
export type DotPlotPack={
 topic:'mean-median-mode-range-worksheets';version:typeof DOT_PLOT_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;mode:DotPlotMode;problems:DotPlotProblem[];
};
const kinds:readonly DotPlotKind[]=['plot','frequency','mode','median','range'];
function materialize(id:string,kind:DotPlotKind,values:readonly number[],targetValue:number):DotPlotProblem{
 if(!kinds.includes(kind)||values.length<8||values.length>16||
  values.some(v=>!Number.isSafeInteger(v)||v<1||v>10)||
  !Number.isSafeInteger(targetValue)||targetValue<1||targetValue>10)
  throw Error('Invalid statistical dot plot observations or target');
 const observations=[...values].sort((a,b)=>a-b);
 const frequencies=Array.from({length:10},(_,i)=>observations.filter(v=>v===i+1).length);
 if(Math.max(...frequencies)>5||Math.max(...frequencies)<2)
  throw Error('Dot plot requires at least one repeat and no stack above 5');
 const top=Math.max(...frequencies);
 const modes=frequencies.flatMap((n,i)=>n===top?[i+1]:[]);
 const mid=observations.length%2?
  observations[Math.floor(observations.length/2)]:
  (observations[observations.length/2-1]+observations[observations.length/2])/2;
 const range=observations.at(-1)!-observations[0];
 let question='',answer='',steps:readonly [string,string,string];
 if(kind==='plot'){
  question='Draw a frequency dot plot for these observations: ['+observations.join(', ')+']. Put one dot per observation above values 1 through 10.';
  answer='Dots: '+frequencies.map((n,i)=>(i+1)+':'+n).join(', ');
  steps=['First write the count for each data value from 1 through 10.',
   'Frequency counts: '+frequencies.map((n,i)=>(i+1)+'='+n).join(', ')+'.',
   'Place '+observations.length+' dots in vertical stacks; each dot represents one observation.'];
 }else if(kind==='frequency'){
  question='Read the frequency dot plot. How many observations have the value '+targetValue+'?';
  answer=String(frequencies[targetValue-1]);
  steps=['Find the column labelled '+targetValue+' on the horizontal value axis.',
   'Count its stacked dots, one dot for each observation.',
   'Frequency of '+targetValue+' = '+frequencies[targetValue-1]+'.'];
 }else if(kind==='mode'){
  question='Read the frequency dot plot. What is the mode (or all modes if tied)?';
  answer=modes.join(', ');
  steps=['The mode is the data value with the greatest frequency.',
   'The tallest stack contains '+top+' dots.',
   'Mode'+(modes.length>1?'s':'')+': '+modes.join(', ')+'.'];
 }else if(kind==='median'){
  question='Read the frequency dot plot. What is the median value?';
  answer=String(mid);
  steps=['Count all '+observations.length+' dots and order observations by value.',
   'The middle '+(observations.length%2?'position is '+((observations.length+1)/2):
    'positions are '+observations.length/2+' and '+(observations.length/2+1))+'.',
   'Median = '+mid+'.'];
 }else{
  question='Read the frequency dot plot. What is the range of these observations?';
  answer=String(range);
  steps=['The smallest observed value is '+observations[0]+'.',
   'The largest observed value is '+observations.at(-1)+'.',
   'Range = '+observations.at(-1)+' - '+observations[0]+' = '+range+'.'];
 }
 return {id,kind,observations,frequencies,targetValue,question,answer,steps};
}
export function createDotPlotPack(topic:DotPlotPack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:DotPlotMode='mixed'):DotPlotPack{
 if(topic!=='mean-median-mode-range-worksheets')throw Error('Dot plot worksheet route mismatch');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid statistical dot plot seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1-40 dot plot questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid dot plot difficulty');
 if(!['mixed',...kinds].includes(mode))throw Error('Invalid dot plot mode');
 const rng=new Rng(seed),shift=rng.int(0,kinds.length-1),used=new Set<string>(),problems:DotPlotProblem[]=[];
 for(let i=0;i<quantity;i++){
  const kind=mode==='mixed'?kinds[(i+shift)%kinds.length]:mode;
  let chosen:DotPlotProblem|undefined;
  for(let attempts=0;attempts<2500;attempts++){
   const count=rng.int(8,difficulty==='easy'?11:difficulty==='standard'?14:16);
   const values=Array.from({length:count},()=>rng.int(1,10));
   const freq=Array.from({length:10},(_,j)=>values.filter(v=>v===j+1).length);
   if(Math.max(...freq)>5||Math.max(...freq)<2)continue;
   const targetValue=rng.int(1,10);
   const p=materialize('Q'+(i+1),kind,values,targetValue);
   const key=kind+'|'+p.observations.join(',')+(kind==='frequency'?'|'+targetValue:'');
   if(used.has(key))continue;
   used.add(key);chosen=p;break;
  }
  if(!chosen)throw Error('Unable to produce unique statistical dot plot questions');
  problems.push(chosen);
 }
 return {topic,version:DOT_PLOT_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyDotPlotPack(pack:DotPlotPack):void{
 if(!pack||pack.topic!=='mean-median-mode-range-worksheets'||pack.version!==DOT_PLOT_VERSION||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||!['mixed',...kinds].includes(pack.mode)||
  !Array.isArray(pack.problems)||pack.problems.length!==pack.quantity)
  throw Error('Invalid statistical dot plot metadata');
 const expected=createDotPlotPack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))
  throw Error('Statistical dot plot observations, frequencies, labels or answers do not match seed');
}
