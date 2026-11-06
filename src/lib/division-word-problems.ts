/** R73 exact, context-sensitive division word problems.
 * Separate from 51 deterministic v18 worksheet generators. Each story
 * explicitly identifies whether a remainder is left over, discarded, or
 * requires one additional container. No fictitious grade certification.
 */
import {Rng,type Difficulty} from './math.ts';
export const DIVISION_STORY_VERSION='R73.1' as const;
export type DivisionStoryMode='mixed'|'equal-sharing'|'full-groups'|'round-up'|'leftovers';
export type DivisionStoryType=Exclude<DivisionStoryMode,'mixed'>;
export type DivisionStoryProblem={
 id:string;type:DivisionStoryType;dividend:number;divisor:number;quotient:number;
 remainder:number;context:number;question:string;answer:string;
 steps:readonly [string,string,string];
};
export type DivisionStoryPack={
 topic:'division-worksheets';version:typeof DIVISION_STORY_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;mode:DivisionStoryMode;
 problems:DivisionStoryProblem[];
};
const choices:readonly DivisionStoryType[]=['equal-sharing','full-groups','round-up','leftovers'];
type Story={question:string;answer:string;meaning:string};
function story(type:DivisionStoryType,dividend:number,divisor:number,quotient:number,
 remainder:number,context:number):Story{
 if(type==='equal-sharing'){
  return context%2===0?{
   question:'A teacher shares '+dividend+' pencils equally among '+divisor+' classrooms. How many pencils does each classroom receive?',
   answer:quotient+' pencils per classroom',
   meaning:'Every classroom receives '+quotient+' pencils; none are left over.'
  }:{
   question:'A library divides '+dividend+' bookmarks equally among '+divisor+' reading clubs. How many bookmarks does each club get?',
   answer:quotient+' bookmarks per club',
   meaning:'Each of the '+divisor+' reading clubs receives exactly '+quotient+' bookmarks.'
  };
 }
 if(type==='full-groups'){
  return context%2===0?{
   question:'A school has '+dividend+' pencils and puts '+divisor+' pencils in each full box. How many full boxes can it pack, and how many pencils remain?',
   answer:quotient+' full boxes and '+remainder+' pencils left over',
   meaning:'Only '+quotient+' full boxes can be packed; '+remainder+' pencils remain.'
  }:{
   question:'A gardener has '+dividend+' seeds and puts '+divisor+' seeds into each complete packet. How many full packets are made, and how many seeds are left?',
   answer:quotient+' full packets and '+remainder+' seeds left over',
   meaning:'The remaining '+remainder+' seeds do not fill another packet; '+quotient+' packets are complete.'
  };
 }
 if(type==='round-up'){
  return context%2===0?{
   question:'There are '+dividend+' students travelling together. Each minibus seats '+divisor+' students. How many minibuses are needed to seat everyone?',
   answer:(quotient+1)+' minibuses',
   meaning:'The leftover '+remainder+' students still need seats, so one additional minibus is required.'
  }:{
   question:'A group must move '+dividend+' students. Each shuttle has '+divisor+' seats. How many shuttles are needed so nobody is left behind?',
   answer:(quotient+1)+' shuttles',
   meaning:'Even the remaining '+remainder+' students require one extra shuttle; use '+(quotient+1)+' in total.'
  };
 }
 if(type==='leftovers'){
  return context%2===0?{
   question:'A craft club has '+dividend+' stickers and uses '+divisor+' stickers per finished card. After making as many complete cards as possible, how many stickers remain?',
   answer:remainder+' stickers left over',
   meaning:'The quotient counts completed cards, but the question asks only for the '+remainder+' leftover stickers.'
  }:{
   question:'A baker has '+dividend+' cherries and places '+divisor+' cherries on each complete cake. After finishing as many cakes as possible, how many cherries remain?',
   answer:remainder+' cherries left over',
   meaning:'After '+quotient+' whole cakes, '+remainder+' cherries are left; report the remainder, not the quotient.'
  };
 }
 throw Error('Unrecognized division story context');
}
export function createDivisionStoryPack(topic:DivisionStoryPack['topic'],seed:number,
 quantity:number,difficulty:Difficulty='standard',mode:DivisionStoryMode='mixed'):DivisionStoryPack{
 if(topic!=='division-worksheets')throw Error('Division story pack can be used only on the division worksheet route');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid unsigned 32-bit division story seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Select 1–40 division word problems');
 if(!['easy','standard','challenge'].includes(difficulty))throw Error('Invalid story difficulty');
 if(!['mixed',...choices].includes(mode))throw Error('Invalid story mode');
 const rng=new Rng(seed),used=new Set<string>(),problems:DivisionStoryProblem[];
 const shift=rng.int(0,3);problems=[];
 for(let i=0;i<quantity;i++){
  const kind:DivisionStoryType=mode==='mixed'?choices[(i+shift)%choices.length]:mode;
  let problem:DivisionStoryProblem|undefined;
  for(let trial=0;trial<2000;trial++){
   const divisor=rng.int(2,9);
   const quotient=rng.int(difficulty==='easy'?5:difficulty==='standard'?7:13,
    difficulty==='easy'?15:difficulty==='standard'?45:90);
   const remainder=kind==='equal-sharing'?0:rng.int(1,divisor-1);
   const dividend=quotient*divisor+remainder;
   const context=rng.int(0,1);
   const text=story(kind,dividend,divisor,quotient,remainder,context);
   if(used.has(text.question))continue;
   used.add(text.question);
   problem={id:'Q'+(i+1),type:kind,dividend,divisor,quotient,remainder,context,
    question:text.question,answer:text.answer,
    steps:[
     'Divide '+dividend+' by '+divisor+': '+quotient+' remainder '+remainder+'.',
     'Check: '+divisor+' × '+quotient+' + '+remainder+' = '+dividend+'.',
     text.meaning
    ]};
   break;
  }
  if(!problem)throw Error('Could not produce enough distinct division stories');
  problems.push(problem);
 }
 return {topic,version:DIVISION_STORY_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyDivisionStoryPack(pack:DivisionStoryPack):void{
 if(!pack||pack.version!=='R73.1'||pack.topic!=='division-worksheets'||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||
  !['mixed',...choices].includes(pack.mode)||!Array.isArray(pack.problems)||
  pack.problems.length!==pack.quantity)throw Error('Invalid division word-problem pack');
 const known=new Set<string>();
 for(const [i,p] of pack.problems.entries()){
  if(p.id!=='Q'+(i+1)||!choices.includes(p.type)||
   !Number.isSafeInteger(p.dividend)||!Number.isSafeInteger(p.divisor)||
   !Number.isSafeInteger(p.quotient)||!Number.isSafeInteger(p.remainder)||
   !Number.isInteger(p.context)||p.context<0||p.context>1||
   p.divisor<2||p.divisor>9||p.quotient<3||p.dividend!==p.quotient*p.divisor+p.remainder||
   p.remainder<0||p.remainder>=p.divisor||
   (p.type==='equal-sharing'&&p.remainder!==0)||
   (p.type!=='equal-sharing'&&p.remainder===0)||
   (pack.mode!=='mixed'&&pack.mode!==p.type))
   throw Error('Invalid exact division story arithmetic '+(i+1));
  const expected=story(p.type,p.dividend,p.divisor,p.quotient,p.remainder,p.context);
  const steps=[
   'Divide '+p.dividend+' by '+p.divisor+': '+p.quotient+' remainder '+p.remainder+'.',
   'Check: '+p.divisor+' × '+p.quotient+' + '+p.remainder+' = '+p.dividend+'.',
   expected.meaning
  ];
  if(p.question!==expected.question||p.answer!==expected.answer||
   JSON.stringify(p.steps)!==JSON.stringify(steps)||known.has(p.question))
   throw Error('Division story wording, interpreted answer or step mismatch '+(i+1));
  known.add(p.question);
 }
}
