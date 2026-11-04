import type {Worksheet} from './math';
/** Protect against stale/mismatched question and answer keys at the PDF boundary.
 * Structural integrity is not a proof that every mathematical algorithm is correct. */
export function assertWorksheetIntegrity(sheet:Worksheet):void{
 if(!sheet||typeof sheet!=='object'||!Array.isArray(sheet.problems)||!Array.isArray(sheet.answerMap))throw Error('Invalid worksheet data');
 if(!/^[0-9a-f]{8}$/.test(sheet.optionsHash)||!Number.isInteger(sheet.seed)||sheet.seed<0||sheet.seed>0xffffffff)throw Error('Invalid worksheet identifier');
 if(!sheet.topicId||!sheet.generatorVersion||sheet.problems.length<1||sheet.problems.length>40)throw Error('Invalid worksheet metadata');
 if(sheet.answerMap.length!==sheet.problems.length)throw Error('Worksheet answers do not match question count');
 const questions=new Set<string>();
 for(let i=0;i<sheet.problems.length;i++){
  const p=sheet.problems[i],answer=sheet.answerMap[i];
  if(!p||!answer||p.id!==`Q${i+1}`||answer.id!==p.id||p.topicId!==sheet.topicId||!p.payload||typeof p.payload.question!=='string'||!p.payload.question.trim())throw Error(`Invalid worksheet question ${i+1}`);
  if(typeof p.expectedAnswer!=='string'||!p.expectedAnswer.trim()||answer.answer!==p.expectedAnswer)throw Error(`Answer key mismatch at question ${i+1}`);
  if(!Array.isArray(p.solutionSteps)||!p.solutionSteps.length||p.solutionSteps.some(step=>typeof step!=='string'||!step.trim()))throw Error(`Missing solution reasoning at question ${i+1}`);
  if(questions.has(p.payload.question))throw Error(`Duplicate question ${i+1}`);
  questions.add(p.payload.question);
 }
}
