/** R85: source-backed visual/word/number-format practice separate from v18. */
import {Rng,type Difficulty} from './math.ts';
import {createDivisionStoryPack,type DivisionStoryMode} from './division-word-problems.ts';

export const R85_VERSION='R85.1' as const;
export type R85Topic='fractions'|'addition-pictures'|'place-value'|'division-equations';
export type R85FractionMode='pictures'|'mixed-to-improper'|'divide-stories';
export type R85AdditionMode='small'|'standard';
export type R85ChartMode='fill-chart'|'find-digit';
export type R85Mode=R85FractionMode|R85AdditionMode|R85ChartMode|DivisionStoryMode;
export type R85Problem={
 id:string;topic:R85Topic;mode:string;a:number;b:number;c:number;
 prompt:string;answer:string;steps:[string,string,string];
 storyType?:string;remainder?:number;
};
export type R85Pack={
 version:typeof R85_VERSION;topic:R85Topic;seed:number;quantity:number;
 difficulty:Difficulty;mode:string;problems:R85Problem[];
};
export const R85_MODES={
 fractions:['pictures','mixed-to-improper','divide-stories'],
 'addition-pictures':['small','standard'],
 'place-value':['fill-chart','find-digit'],
 'division-equations':['mixed','equal-sharing','full-groups','round-up','leftovers']
} as const;
export const R85_ROUTES={
 fractions:'fractions-worksheets',
 'addition-pictures':'addition-worksheets',
 'place-value':'place-value-worksheets',
 'division-equations':'division-worksheets'
} as const;
const validDifficulty=(s:string)=>['easy','standard','challenge'].includes(s);
function fractionText(n:number,d:number){
 const w=Math.floor(n/d),r=n%d;
 return w?String(w)+(r?' '+r+'/'+d:''):r+'/'+d;
}
const storyContexts=[
 (all:string,unit:string)=>'A craft club has '+all+' meters of ribbon. Each badge needs '+unit+' meter. How many complete badges can be made?',
 (all:string,unit:string)=>'A chef has '+all+' liters of juice. Each cup holds '+unit+' liter. How many full cups can be poured?',
 (all:string,unit:string)=>'A school has '+all+' meters of string. Each tag needs '+unit+' meter. How many tags can be made?'
];
const placeNames=['millions','hundred thousands','ten thousands','thousands','hundreds','tens','ones'] as const;
function derive(topic:R85Topic,mode:string,a:number,b:number,c:number,storyType?:string,remainder=0){
 let prompt:string,answer:string,steps:[string,string,string];
 if(topic==='fractions'){
  if(mode==='pictures'){
   prompt='Look at the equal parts shaded in the bar. What fraction of the whole is shaded?';
   answer=b+'/'+a;
   steps=['The whole bar is divided into '+a+' equal parts.',
    b+' of the '+a+' parts are shaded.','The fraction shaded is '+b+'/'+a+'.'];
  }else if(mode==='mixed-to-improper'){
   prompt='Change '+a+' '+c+'/'+b+' to an improper fraction.';
   const n=a*b+c;
   answer=n+'/'+b;
   steps=['Each whole has '+b+' equal parts.','Whole parts: '+a+' x '+b+' = '+(a*b)+'.',
    'Add '+c+' parts: '+(a*b)+' + '+c+' = '+n+'; answer '+n+'/'+b+'.'];
  }else if(mode==='divide-stories'){
   const total=fractionText(b,a),unit='1/'+a;
   prompt=storyContexts[c](total,unit);
   answer=String(b);
   steps=['Write the division: ('+total+') / ('+unit+').',
    'Dividing by 1/'+a+' is multiplying by '+a+'.',
    'The total '+b+'/'+a+' divided by 1/'+a+' is '+b+' whole portions.'];
  }else throw Error('Invalid R85 fraction mode');
 }else if(topic==='addition-pictures'){
  prompt='Count the objects in both groups. How many objects are there altogether?';
  answer=String(a+b);
  steps=['Count '+a+' objects in the first pictured group.',
   'Count '+b+' objects in the second pictured group.',
   'Add '+a+' + '+b+' = '+(a+b)+' objects altogether.'];
 }else if(topic==='place-value'){
  const number=String(a),place=placeNames[b];
  if(mode==='fill-chart'){
   prompt='Write '+number.replace(/\B(?=(\d{3})+(?!\d))/g,',')+' in the millions-to-ones place-value chart.';
   answer=number.split('').join(' | ');
   steps=['A 7-digit number has the millions place through the ones place.',
    'Put one digit into each of the seven columns from left to right.',
    'Digits from millions to ones: '+answer+'.'];
  }else if(mode==='find-digit'){
   prompt='In '+number.replace(/\B(?=(\d{3})+(?!\d))/g,',')+', which digit is in the '+place+' place?';
   answer=number[b];
   steps=['Read the number from millions through ones.',
    'Locate the '+place+' column of the seven-place chart.',
    'The digit in the '+place+' column is '+number[b]+'.'];
  }else throw Error('Invalid R85 chart mode');
 }else if(topic==='division-equations'){
  if(!storyType)throw Error('Division equation lacks original story type');
  const full=b?Math.floor(a/b):0,rem=remainder,eq=a+' / '+b+' = '+full+(rem?' R '+rem:'');
  // The shared R73 source ensures real interpretation for groups/rounding/remainders.
  prompt='Write a division equation, then answer the question: '+(c===0?
   'A teacher shares '+a+' pencils equally among '+b+' classrooms. How many pencils does each classroom receive?':'');
  // caller replaces prompt, answer and steps with actual verified R73 text.
  answer=eq;steps=['Write the division: '+eq+'.',
   'Verify: '+b+' x '+full+' + '+rem+' = '+a+'.',
   'Use the context to interpret the quotient and remainder.'];
 }else throw Error('Unknown R85 practice topic');
 return {prompt,answer,steps};
}
export function createR85Pack(topic:R85Topic,seed:number,quantity:number,
 difficulty:Difficulty='standard',mode?:string):R85Pack{
 if(!Object.hasOwn(R85_MODES,topic))throw Error('Unknown R85 practice topic');
 const options=R85_MODES[topic] as readonly string[],which=mode??options[0];
 if(!options.includes(which)||!validDifficulty(difficulty))throw Error('Invalid R85 practice settings');
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid unsigned 32-bit seed');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('R85 worksheets allow 1-40 questions');
 const problems:R85Problem[]=[];
 if(topic==='division-equations'){
  const source=createDivisionStoryPack('division-worksheets',seed,quantity,difficulty,which as DivisionStoryMode);
  for(const p of source.problems){
   const eq=p.dividend+' / '+p.divisor+' = '+p.quotient+(p.remainder?' R '+p.remainder:'');
   problems.push({id:p.id,topic,mode:which,a:p.dividend,b:p.divisor,c:p.context,
    prompt:'Write a division equation, then answer: '+p.question,
    answer:eq+'; '+p.answer,storyType:p.type,remainder:p.remainder,
    steps:['Equation: '+eq+'.',
     'Check: '+p.divisor+' x '+p.quotient+' + '+p.remainder+' = '+p.dividend+'.',
     'Interpret: '+p.steps[2]]});
  }
 }else{
  const rng=new Rng(seed),seen=new Set<string>();
  for(let i=0;i<quantity;i++){
   let p:R85Problem|undefined;
   for(let attempt=0;attempt<2000;attempt++){
    let a=0,b=0,c=0;
    if(topic==='fractions'){
     if(which==='pictures'){a=rng.int(2,12);b=rng.int(1,a-1);}
     else if(which==='mixed-to-improper'){
      a=rng.int(1,difficulty==='easy'?5:9);b=rng.int(2,12);c=rng.int(1,b-1);
     }else{a=rng.int(3,9);b=rng.int(2,Math.min(12,a+6));c=rng.int(0,2);
      if(b%a===0)continue;}
    }else if(topic==='addition-pictures'){
     const max=which==='small'?6:difficulty==='challenge'?16:12;
     a=rng.int(1,max);b=rng.int(1,max);c=rng.int(0,2);
    }else{
     a=rng.int(1000000,9999999);b=rng.int(0,6);
    }
    const signature=[topic,which,a,b,c].join('|');
    if(seen.has(signature))continue;
    seen.add(signature);
    const details=derive(topic,which,a,b,c);
    p={id:'Q'+(i+1),topic,mode:which,a,b,c,...details};
    break;
   }
   if(!p)throw Error('Not enough distinct R85 practice problems');
   problems.push(p);
  }
 }
 return {version:R85_VERSION,topic,seed,quantity,difficulty,mode:which,problems};
}
export function verifyR85Pack(pack:R85Pack):void{
 if(!pack||!Object.hasOwn(R85_MODES,pack.topic)||!Array.isArray(pack.problems))
  throw Error('Invalid R85 practice data');
 const expected=createR85Pack(pack.topic,pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))throw Error('R85 math, story or seed provenance mismatch');
 for(const p of pack.problems){
  if(p.topic==='fractions'&&p.mode==='pictures' &&!(p.a>p.b&&p.b>=1))throw Error('Invalid shaded fraction');
  if(p.topic==='fractions'&&p.mode==='mixed-to-improper' &&
   p.answer!==(p.a*p.b+p.c)+'/'+p.b)throw Error('Invalid improper fraction conversion');
  if(p.topic==='fractions'&&p.mode==='divide-stories'&&
   (!p.answer||Number(p.answer)!==p.b||p.b%p.a===0))throw Error('Invalid fraction story quotient');
  if(p.topic==='addition-pictures'&&Number(p.answer)!==p.a+p.b)throw Error('Invalid picture sum');
  if(p.topic==='place-value'&&(p.a<1000000||p.a>9999999))throw Error('Invalid place-value chart number');
  if(p.topic==='division-equations'&&
   (!(p.b>0)||p.a!==p.b*Math.floor(p.a/p.b)+(p.remainder??0)))
   throw Error('Invalid quotient/remainder equation');
 }
}
