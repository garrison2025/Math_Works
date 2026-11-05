/** Independent integer expression interpreter for QA. No production generator imports. */
import assert from 'node:assert/strict';
export function evaluateOrderExpression(question){
 const expression=question.replace(/ = ____$/,'').replaceAll('²','^2')
  .replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');
 const tokens=expression.match(/\d+|[()+\-*/^]/g)??[];
 assert.equal(tokens.join(''),expression.replaceAll(' ','').trim(),`Invalid expression syntax: ${question}`);
 let cursor=0;
 const peek=()=>tokens[cursor];
 const atom=()=>{
  if(peek()==='('){cursor++;const value=addSub();assert.equal(tokens[cursor++],')');return value;}
  const token=tokens[cursor++];assert.match(token??'',/^\d+$/);return BigInt(token);
 };
 const power=()=>{
  let result=atom();
  if(peek()==='^'){cursor++;const exponent=power();assert.ok(exponent>=0n&&exponent<=5n);result=result**exponent;}
  return result;
 };
 const mulDiv=()=>{
  let value=power();
  while(peek()==='*'||peek()==='/'){
   const operator=tokens[cursor++],rhs=power();
   if(operator==='*')value*=rhs;
   else{assert.notEqual(rhs,0n);assert.equal(value%rhs,0n,'Nonintegral generated division');value/=rhs;}
  }
  return value;
 };
 const addSub=()=>{
  let value=mulDiv();
  while(peek()==='+'||peek()==='-'){
   const operator=tokens[cursor++],rhs=mulDiv();
   value=operator==='+'?value+rhs:value-rhs;
  }
  return value;
 };
 const result=addSub();
 assert.equal(cursor,tokens.length,`Unconsumed expression tokens: ${question}`);
 return String(result);
}
