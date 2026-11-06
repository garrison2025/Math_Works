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
 const max=range==='zero-one'?1:2,rng=new Rng(seed);
 // Build the complete exact domain once, shuffle with the deterministic RNG
 // and prefer smaller denominators for Easy/Standard. High question counts
 // still work because remaining denominator families fill the rest.
 const candidates:{denominator:number;numerator:number;order:number}[]=[];
 for(const denominator of FRACTION_LINE_DENOMINATORS){
  for(let numerator=1;numerator<max*denominator;numerator++){
   if(max===2&&numerator===denominator)continue;
   candidates.push({denominator,numerator,order:rng.next()});
  }
 }
 const priority=(denominator:number)=>difficulty==='easy'?(denominator<=6?0:1):
  difficulty==='standard'?(denominator<=8?0:1):0;
 candidates.sort((x,y)=>priority(x.denominator)-priority(y.denominator)||x.order-y.order);
 if(quantity>candidates.length)throw Error('Not enough distinct fraction-line questions');
 const questions:FractionLineQuestion[]=[];
 for(let i=0;i<quantity;i++){
  const {denominator,numerator}=candidates[i],answer=numerator+'/'+denominator;
  const reducedAnswer=asText(rational(BigInt(numerator),BigInt(denominator)));
  questions.push({id:'Q'+(i+1),denominator,numerator,max,task,
   prompt:task==='identify'?'Write the fraction marked by the dot.':'Plot '+answer+' on the number line.',
   answer,reducedAnswer});
 }
 return {topic,version:FRACTION_LINE_VERSION,seed,quantity,difficulty,task,range,questions};
}
