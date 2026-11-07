/**
 * R96 strict, local-only self-checking for real worksheet answer types.
 *
 * This module never reads a solutionSteps line and never evaluates input as code.
 * A typed grammar is selected by the trusted generated topic and expected answer.
 * Drawing and physical marking tasks are intentionally NOT auto-graded.
 */
import {checkExactNumber,parseExactNumber,supportsExactNumber,type AnswerCheck} from './answer-check.ts';

type Kind='numeric'|'enum'|'percent'|'scientific'|'set'|'mode-list'|'inequality'|'xy'|'unsupported';
type TopicAnswer={kind:Kind;hint:string};
const enumOptions:Readonly<Record<string,readonly string[]>>={
 'angle-worksheets':['acute','right','obtuse'],
 'coordinate-plane-worksheets':['I','II','III','IV'],
 'lines-rays-segments-worksheets':['line','ray','segment'],
 'slope-worksheets':['undefined'],
 'domain-range-worksheets':['yes','no'],
 'systems-equations-worksheets':['no solution','infinitely many solutions'],
 'mean-median-mode-range-worksheets':['no mode'],
 'box-plots-worksheets':['none'],
 'scatter-plot-worksheets':['positive','negative','no clear linear trend']
};
const en=(s:string)=>s.trim().replace(/\s+/g,' ').toLowerCase();
const normalizeEnum=(topic:string,s:string)=>{
 const raw=en(s);
 if(topic==='coordinate-plane-worksheets')return raw.replace(/^quadrant\s+/,'').toUpperCase();
 if(topic==='scatter-plot-worksheets')return raw==='none'?'no clear linear trend':raw.replace(/\s+(?:linear\s+)?trend$/,'');
 if(topic==='mean-median-mode-range-worksheets'&&raw==='none')return 'no mode';
 return raw;
};
const scientific=/^([+-]?[1-9](?:\.\d+)?)\s*(?:×|x|\*)\s*10\^([+-]?\d{1,2})$/;
const percent=/^[+-]?\d+(?:\.\d+)?%$/;
const inequality=/^x\s*(≤|≥|<=|>=|<|>)\s*([+-]?\d+(?:\.\d+)?)$/;
const pair=/^(x|y)\s*=\s*([+-]?\d+)\s*,\s*(x|y)\s*=\s*([+-]?\d+)$/i;
const list=/^[+-]?\d+(?:\s*,\s*[+-]?\d+)+$/;
const set=/^\{\s*[+-]?\d+(?:\s*,\s*[+-]?\d+)*\s*\}$/;
const normalizeOp=(op:string)=>op==='<='?'≤':op==='>='?'≥':op;
const clean=(s:string)=>s.trim().replace(/−/g,'-');
function parseList(s:string,braced:boolean):string[]|undefined{
 const raw=clean(s);
 if(!(braced?set:list).test(raw))return;
 const tokens=(braced?raw.slice(1,-1):raw).split(/\s*,\s*/);
 const numbers=tokens.map(n=>BigInt(n));
 if(new Set(numbers.map(String)).size!==numbers.length)return;
 return numbers.map(String).sort((a,b)=>{
  const x=BigInt(a),y=BigInt(b);return x<y?-1:x>y?1:0;
 });
}
function parseXY(s:string):[string,string]|undefined{
 const m=clean(s).match(pair);
 if(!m||m[1].toLowerCase()===m[3].toLowerCase())return;
 const x=m[1].toLowerCase()==='x'?m[2]:m[4];
 const y=m[1].toLowerCase()==='y'?m[2]:m[4];
 return [String(BigInt(x)),String(BigInt(y))];
}
function scientificValue(s:string):{n:bigint;d:bigint}|undefined{
 const m=clean(s).match(scientific);if(!m)return;
 const exponent=Number(m[2]);
 // Only canonical coefficients and bounded, printable powers of ten.
 if(exponent< -8||exponent>8)return;
 const coeff=parseExactNumber(m[1]);if(!coeff)return;
 if(coeff.n<coeff.d||coeff.n>=coeff.d*10n)return;
 const power=10n**BigInt(Math.abs(exponent));
 return exponent>=0?{n:coeff.n*power,d:coeff.d}:{n:coeff.n,d:coeff.d*power};
}
function normalizedScientificCheck(expected:string,submitted:string):AnswerCheck{
 const target=scientificValue(expected);
 if(!target)return 'unsupported';
 const actual=scientificValue(submitted);
 if(!actual)return 'invalid';
 return actual.n*target.d===target.n*actual.d?'correct':'incorrect';
}
export function practiceAnswerFormat(topic:string,expected:string):TopicAnswer{
 // Marking a paper number line or a physical protractor cannot be verified from
 // text alone even when its model answer happens to be numeric.
 if(topic==='number-line-worksheets'||topic==='printable-protractor')
  return {kind:'unsupported',hint:'Drawing or physical marking must be checked on the worksheet.'};
 if(supportsExactNumber(expected))
  return {kind:'numeric',hint:'Integer, decimal or fraction (e.g. 3/4)'};
 if(topic==='percentages-worksheets'&&percent.test(expected))
  return {kind:'percent',hint:'Percentage including % (e.g. 25%)'};
 if(topic==='scientific-notation-worksheets'&&scientific.test(expected))
  return {kind:'scientific',hint:'Scientific notation (e.g. 1.2 × 10^3)'};
 if(topic==='systems-equations-worksheets'&&parseXY(expected))
  return {kind:'xy',hint:'Both values (e.g. x = 2, y = -3)'};
 if(topic==='inequalities-worksheets'&&inequality.test(expected))
  return {kind:'inequality',hint:'Inequality (e.g. x ≥ 3)'};
 if(topic==='domain-range-worksheets'&&parseList(expected,true))
  return {kind:'set',hint:'Distinct values in braces (e.g. {1, 3, 5})'};
 if(['mean-median-mode-range-worksheets','box-plots-worksheets'].includes(topic)&&parseList(expected,false))
  return {kind:'mode-list',hint:'Comma-separated distinct values (e.g. 2, 5)'};
 if(enumOptions[topic]?.some(option=>normalizeEnum(topic,option)===normalizeEnum(topic,expected)))
  return {kind:'enum',hint:topic==='coordinate-plane-worksheets'?'Quadrant (I, II, III or IV)':
   topic==='angle-worksheets'?'Angle type (acute, right or obtuse)':
   topic==='lines-rays-segments-worksheets'?'Line, ray or segment':
   topic==='scatter-plot-worksheets'?'Trend: positive, negative or no clear linear trend':
   'Short written answer (e.g. yes, no, undefined)'};
 return {kind:'unsupported',hint:'This task requires visual or teacher review.'};
}
export const supportsPracticeAnswer=(topic:string,expected:string):boolean=>
 practiceAnswerFormat(topic,expected).kind!=='unsupported';
export function checkPracticeAnswer(topic:string,expected:string,submitted:string):AnswerCheck{
 const fmt=practiceAnswerFormat(topic,expected),input=clean(submitted);
 if(fmt.kind==='unsupported')return 'unsupported';
 if(fmt.kind==='numeric')return checkExactNumber(expected,input);
 if(!input||input.length>100)return 'invalid';
 if(fmt.kind==='enum'){
  const options=enumOptions[topic]??[];
  const normalized=normalizeEnum(topic,input);
  if(!options.some(x=>normalizeEnum(topic,x)===normalized))return 'invalid';
  return normalized===normalizeEnum(topic,expected)?'correct':'incorrect';
 }
 if(fmt.kind==='percent'){
  if(!percent.test(input))return 'invalid';
  return checkExactNumber(expected.slice(0,-1),input.slice(0,-1));
 }
 if(fmt.kind==='scientific')return normalizedScientificCheck(expected,input);
 if(fmt.kind==='xy'){
  const a=parseXY(expected),b=parseXY(input);
  if(!b||!a)return 'invalid';
  return a[0]===b[0]&&a[1]===b[1]?'correct':'incorrect';
 }
 if(fmt.kind==='inequality'){
  const a=clean(expected).match(inequality),b=input.match(inequality);
  if(!b||!a)return 'invalid';
  return normalizeOp(a[1])===normalizeOp(b[1])&&
   checkExactNumber(a[2],b[2])==='correct'?'correct':'incorrect';
 }
 if(fmt.kind==='set'||fmt.kind==='mode-list'){
  const a=parseList(expected,fmt.kind==='set'),b=parseList(input,fmt.kind==='set');
  if(!a||!b)return 'invalid';
  return a.join(',')===b.join(',')?'correct':'incorrect';
 }
 return 'unsupported';
}
