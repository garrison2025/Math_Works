/** R66: printable fraction number-line questions, deliberately independent
 * of the established v18 integer number-line and fraction generators.
 * Exact numerator/denominator positions; no floating-point math for answers.
 */
import {Rng,rational,asText,type Difficulty} from './math.ts';
export type FractionLineTask='identify'|'plot';
export type FractionLineRange='zero-one'|'zero-two';
export const FRACTION_LINE_VERSION='R66.1' as const;
export const FRACTION_LINE_DENOMINATORS=Object.freeze([2,3,4,5,6,8,10,12]);
export type FractionLineQuestion={
 id:string;denominator:number;numerator:number;max:number;task:FractionLineTask;
 prompt:string;answer:string;reducedAnswer:string;
};
export type FractionLinePack={
 topic:'number-line-worksheets'|'fractions-worksheets';
 version:typeof FRACTION_LINE_VERSION;seed:number;quantity:number;
 difficulty:Difficulty;task:FractionLineTask;range:FractionLineRange;
 questions:FractionLineQuestion[];
};
export function fractionLinePosition(numerator:number,denominator:number,max:number):number{
 if(!Number.isSafeInteger(numerator)||!Number.isSafeInteger(denominator)||
  !Number.isSafeInteger(max)||denominator<2||denominator>12||
  !FRACTION_LINE_DENOMINATORS.includes(denominator)||
  (max!==1&&max!==2)||numerator<=0||numerator>=max*denominator||
  numerator===denominator&&max===2)throw Error('Invalid fraction number-line location');
 return numerator/(max*denominator);
}
export function createFractionLinePack(topic:FractionLinePack['topic'],seed:number,quantity:number,
 difficulty:Difficulty='standard',task:FractionLineTask='identify',
 range:FractionLineRange='zero-one'):FractionLinePack{
 if(topic!=='number-line-worksheets'&&topic!=='fractions-worksheets')throw Error('Unknown fraction line route');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid fraction-line seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Fraction-line pack supports 1–40 questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid fraction-line difficulty');
 if(task!=='identify'&&task!=='plot')throw Error('Invalid fraction-line task');
 if(range!=='zero-one'&&range!=='zero-two')throw Error('Invalid fraction-line range');
 const max=range==='zero-one'?1:2,rng=new Rng(seed),seen=new Set<string>();
 const available=difficulty==='easy'?[2,3,4,5,6]:
  difficulty==='standard'?[2,3,4,5,6,8]:
  [...FRACTION_LINE_DENOMINATORS];
 const possible=available.reduce((sum,d)=>sum+(max===1?d-1:2*d-2),0);
 if(quantity>possible)throw Error('Select at most '+possible+' distinct fraction number-line questions for these settings');
 const questions:FractionLineQuestion[]=[];
 for(let i=0;i<quantity;i++){
  let item:FractionLineQuestion|undefined;
  for(let trial=0;trial<800;trial++){
   const denominator=rng.pick(available),numerator=rng.int(1,max*denominator-1);
   if(max===2&&numerator===denominator)continue;
   const signature=numerator+'/'+denominator;
   if(seen.has(signature))continue;
   seen.add(signature);
   const answer=signature,reducedAnswer=asText(rational(BigInt(numerator),BigInt(denominator)));
   item={id:'Q'+(i+1),denominator,numerator,max,task,
    prompt:task==='identify'?'Write the fraction marked by the dot.':'Plot '+answer+' on the number line.',
    answer,reducedAnswer};
   break;
  }
  if(!item)throw Error('Could not create distinct fraction number-line problems');
  questions.push(item);
 }
 return {topic,version:FRACTION_LINE_VERSION,seed,quantity,difficulty,task,range,questions};
}
