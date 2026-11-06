/** R65 opt-in exact decimal/fraction equation generator, independent of v18. */
import {Rng,rational,addR,mulR,asText,type Difficulty,type Rational} from './math.ts';
import type {TopicOptions} from './topic-options.ts';
export type EquationTopic='one-step-equations-worksheets'|'two-step-equations-worksheets';
export type EquationNumberType='decimal'|'fraction';
export const EQUATION_PACK_VERSION='R65.1' as const;
export type EquationQuestion={id:string;question:string;answer:string;steps:readonly string[]};
export type EquationPack={topic:EquationTopic;kind:EquationNumberType;seed:number;
 difficulty:Difficulty;quantity:number;options:TopicOptions;version:typeof EQUATION_PACK_VERSION;
 questions:EquationQuestion[]};
const neg=(r:Rational)=>rational(-r.n,r.d);
const sub=(a:Rational,b:Rational)=>addR(a,neg(b));
const negative=(r:Rational)=>r.n<0n;
const decimalText=(r:Rational):string=>{
 let den=r.d,twos=0,fives=0;
 while(den%2n===0n){den/=2n;twos++}
 while(den%5n===0n){den/=5n;fives++}
 if(den!==1n)throw Error('Unexpected nonterminating decimal');
 const precision=Math.max(twos,fives);
 if(precision>4)throw Error('Decimal precision exceeds printable limit');
 const scale=10n**BigInt(precision),scaled=r.n*(scale/r.d);
 const sign=scaled<0n?'-':'',a=scaled<0n?-scaled:scaled;
 if(precision===0)return sign+String(a);
 const digits=a.toString().padStart(precision+1,'0');
 return sign+(digits.slice(0,-precision)+'.'+digits.slice(-precision)).replace(/0+$/,'').replace(/\.$/,'');
};
export const equationValueText=(r:Rational,kind:EquationNumberType):string=>
 kind==='decimal'?decimalText(r):asText(r);
const signed=(r:Rational,kind:EquationNumberType)=>
 negative(r)?'− '+equationValueText(neg(r),kind):'+ '+equationValueText(r,kind);
const fractional=(rng:Rng,difficulty:Difficulty,nonzero=false):Rational=>{
 const denominator=BigInt(rng.int(2,difficulty==='easy'?6:difficulty==='standard'?9:12));
 const bound=difficulty==='easy'?6:difficulty==='standard'?10:16;
 let numerator=rng.int(-bound,bound);
 if(nonzero&&numerator===0)numerator=rng.pick([-1,1])*rng.int(1,bound);
 return rational(BigInt(numerator),denominator);
};
const decimal=(rng:Rng,difficulty:Difficulty,nonzero=false):Rational=>{
 const bound=difficulty==='easy'?24:difficulty==='standard'?65:115;
 let numerator=rng.int(-bound,bound);
 if(nonzero&&numerator===0)numerator=rng.pick([-1,1])*rng.int(1,bound);
 return rational(BigInt(numerator),10n);
};
function normalize(topic:EquationTopic,input:TopicOptions):TopicOptions{
 const one=topic==='one-step-equations-worksheets';
 const key=one?'operation':'coefficient',choices=one?['mixed','addition','multiplication']:['mixed','positive','negative'];
 if(Object.keys(input).some(x=>x!==key))throw Error('Invalid equation pack setting');
 const value=input[key]??'mixed';
 if(!choices.includes(value))throw Error('Invalid equation pack setting');
 return {[key]:value};
}
export function createEquationPack(topic:EquationTopic,kind:EquationNumberType,
 seed:number,quantity:number,difficulty:Difficulty='standard',input:TopicOptions={}):EquationPack{
 if(topic!=='one-step-equations-worksheets'&&topic!=='two-step-equations-worksheets')
  throw Error('Unsupported equation topic');
 if(kind!=='decimal'&&kind!=='fraction')throw Error('Invalid equation number type');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid equation seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1–40 equation questions');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid equation difficulty');
 const options=normalize(topic,input),rng=new Rng(seed),seen=new Set<string>(),questions:EquationQuestion[]=[];
 const get=kind==='decimal'?decimal:fractional;
 for(let i=0;i<quantity;i++){
  let item:EquationQuestion|undefined;
  for(let trial=0;trial<700;trial++){
   const x=get(rng,difficulty),b=get(rng,difficulty,true),a=get(rng,difficulty,true);
   // Every extension item contains a genuinely noninteger decimal/fraction answer.
   if(x.d===1n)continue;
   const op=topic==='one-step-equations-worksheets'?
    options.operation==='mixed'?rng.pick(['addition','multiplication']):options.operation:'two-step';
   if(op==='multiplication'&&a.n===a.d)continue;
   let coef=a;
   if(op==='two-step'&&options.coefficient!=='mixed'){
    if(options.coefficient==='positive'&&negative(coef))coef=neg(coef);
    if(options.coefficient==='negative'&&!negative(coef))coef=neg(coef);
   }
   const factor=op==='addition'?rational(1n):coef;
   const offset=op==='multiplication'?rational(0n):b;
   const rhs=addR(mulR(factor,x),offset);
   const lhs=op==='addition'?'x '+signed(b,kind):
    op==='multiplication'?equationValueText(coef,kind)+'x':
    equationValueText(coef,kind)+'x '+signed(b,kind);
   const question='Solve: '+lhs+' = '+equationValueText(rhs,kind);
   if(seen.has(question))continue;
   seen.add(question);
   const answer='x = '+equationValueText(x,kind);
   const bt=equationValueText(b,kind),ct=equationValueText(coef,kind),rt=equationValueText(rhs,kind),xt=equationValueText(x,kind);
   const steps=op==='addition'?[
    'Subtract ('+bt+') from both sides.',
    'x = '+rt+' − ('+bt+') = '+xt+'.',
    'Check: '+xt+' + ('+bt+') = '+rt+'.'
   ]:op==='multiplication'?[
    'Divide both sides by ('+ct+').',
    'x = '+rt+' ÷ ('+ct+') = '+xt+'.',
    'Check: '+ct+' × ('+xt+') = '+rt+'.'
   ]:[
    'Subtract ('+bt+') from both sides: '+ct+'x = '+equationValueText(sub(rhs,b),kind)+'.',
    'Divide by ('+ct+'): x = '+xt+'.',
    'Check: '+ct+' × ('+xt+') + ('+bt+') = '+rt+'.'
   ];
   item={id:'Q'+(i+1),question,answer,steps};break;
  }
  if(!item)throw Error('Could not generate unique exact equation problems');
  questions.push(item);
 }
 return {topic,kind,seed,quantity,difficulty,options,version:EQUATION_PACK_VERSION,questions};
}
