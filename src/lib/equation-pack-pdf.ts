/** R65 opt-in equation-pack vector PDF; independent exact algebra
 * verification runs BEFORE writing students' and teachers' pages.
 */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {rational,addR,divR,mulR,asText,type Rational} from './math.ts';
import {equationValueText,type EquationPack,type EquationNumberType} from './equation-packs.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';

export type EquationPdfMode='questions'|'answers'|'steps';
const sizeByPaper:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const black=rgb(.09,.15,.23),gray=rgb(.34,.42,.51),blue=rgb(.10,.35,.62),rule=rgb(.76,.83,.89);
const neg=(r:Rational)=>rational(-r.n,r.d);
const sub=(a:Rational,b:Rational)=>addR(a,neg(b));
const same=(a:Rational,b:Rational)=>a.n===b.n&&a.d===b.d;
export function parsePackValue(text:string):Rational{
 const v=text.trim();
 const m=v.match(/^(-?\d+)(?:(?:\/([1-9]\d*))|(?:\.(\d{1,4})))?$/);
 if(!m)throw Error('Unrecognized exact equation scalar: '+v);
 if(m[2])return rational(BigInt(m[1]),BigInt(m[2]));
 if(m[3]){
  const sign=m[1].startsWith('-')?-1n:1n;
  const intPart=BigInt(m[1].replace(/^-/,'')),fractionPart=BigInt(m[3]);
  const scale=10n**BigInt(m[3].length);
  return rational(sign*(intPart*scale+fractionPart),scale);
 }
 return rational(BigInt(m[1]));
}
/** Independent of answerMap and question generator. Parses only visible
 * supported algebra, then solves exact rational equations.
 */
export function solvePackQuestion(question:string):Rational{
 const token='-?\\d+(?:\\.\\d{1,4}|\\/\\d+)?';
 const re=new RegExp('^Solve: (('+token+')?x)(?: ([+−]) ('+token+'))? = ('+token+')$');
 const m=question.match(re);
 if(!m)throw Error('Unrecognized equation in pack: '+question);
 const a=m[2]?parsePackValue(m[2]):rational(1n);
 const b=m[3]?parsePackValue((m[3]==='−'?'-':'')+m[4]):rational(0n);
 const c=parsePackValue(m[5]);
 if(a.n===0n)throw Error('Equation coefficient zero');
 return divR(sub(c,b),a);
}
export function verifyEquationPack(pack:EquationPack):void{
 if(pack.version!=='R65.1'||!['decimal','fraction'].includes(pack.kind)||
  !['one-step-equations-worksheets','two-step-equations-worksheets'].includes(pack.topic)||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||
  pack.questions.length!==pack.quantity)throw Error('Invalid equation pack metadata');
 const seen=new Set<string>();
 for(let i=0;i<pack.questions.length;i++){
  const row=pack.questions[i];
  if(row.id!=='Q'+(i+1)||seen.has(row.question)||
     row.steps.length!==3||row.steps.some(s=>!s.trim()))throw Error('Equation pack row mismatch '+(i+1));
  seen.add(row.question);
  const solved=solvePackQuestion(row.question);
  const expected='x = '+equationValueText(solved,pack.kind);
  if(row.answer!==expected)throw Error('Equation pack independent answer mismatch at '+(i+1));
  // This is a separate PDF-grade gate, not a claim that it audits
  // every word of the pedagogical explanation.
  if(!row.steps[2].startsWith('Check: ')||!row.steps[1].includes(equationValueText(solved,pack.kind)))
   throw Error('Missing solution-check steps at '+(i+1));
 }
}
function wrap(text:string,font:PDFFont,fontSize:number,width:number):string[]{
 const safe=text.replace(/−/g,'-').replace(/×/g,'x').replace(/÷/g,'/').replace(/[^\x20-\x7E]/g,'');
 const parts=safe.split(/\s+/).filter(Boolean),lines:string[]=[];
 let current='';
 for(const part of parts){
  const next=current?current+' '+part:part;
  if(font.widthOfTextAtSize(next,fontSize)<width){current=next;continue}
  if(current){lines.push(current);current=''}
  if(font.widthOfTextAtSize(part,fontSize)>width)
   throw Error('Equation PDF word too long for page width');
  current=part;
 }
 if(current)lines.push(current);
 return lines;
}
export async function createEquationPackPdf(pack:EquationPack,mode:EquationPdfMode,paper:Paper,writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyEquationPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid equation PDF mode');
 if(!Object.hasOwn(sizeByPaper,paper))throw Error('Invalid equation PDF paper');
 if(writingRoom!=='standard'&&writingRoom!=='extra')throw Error('Invalid equation writing room');
 const pdf=await PDFDocument.create(),[width,height]=sizeByPaper[paper];
 const normal=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const margin=44,bottom=78;
 let page:PDFPage,y=0;
 const topic=pack.topic.startsWith('one')?'One-Step':'Two-Step';
 const heading=(pack.kind==='decimal'?'Decimal':'Fraction')+' '+topic+' Equations';
 const makePage=()=>{
  page=pdf.addPage([width,height]);
  y=height-58;
  page.drawText(heading,{x:margin,y,size:17,font:bold,color:black});y-=26;
  page.drawText('R65 exact equation practice | '+(mode==='questions'?'STUDENT':mode==='answers'?'ANSWER KEY':'WORKED STEPS'),
   {x:margin,y,size:10,font:bold,color:blue});y-=21;
  const op=pack.topic.startsWith('one')?'operation':'coefficient';
  page.drawText('Seed '+pack.seed+' | '+pack.difficulty+' | '+pack.quantity+' questions | '+op+': '+pack.options[op],
   {x:margin,y,size:8.5,font:normal,color:gray});y-=20;
  page.drawText(mode==='questions'?'Name: ________________________       Date: _______________':
   'Match each question number to the student practice sheet.',
   {x:margin,y,size:9,font:normal,color:black});y-=31;
 };
 makePage();
 for(const [index,item] of pack.questions.entries()){
  const qlines=wrap((index+1)+'. '+item.question,normal,10.5,width-2*margin);
  const answerLines=mode==='questions'?[]:wrap('Answer: '+item.answer,bold,10,width-2*margin-18);
  const stepLines=mode!=='steps'?[]:item.steps.flatMap((step,j)=>
   wrap((j+1)+') '+step,normal,9,width-2*margin-18));
  const lines=mode==='questions'?(writingRoom==='extra'?3:2):0;
  // Match the real pen-line spacing exactly; avoid a one-question orphan page.
  const needed=mode==='questions'?qlines.length*15+lines*20+20:
   qlines.length*15+answerLines.length*14+stepLines.length*13+27;
  if(y-needed<bottom)makePage();
  for(const line of qlines){page.drawText(line,{x:margin,y,size:10.5,font:normal,color:black});y-=15}
  if(mode==='questions'){
   for(let k=0;k<lines;k++){
    page.drawLine({start:{x:margin+16,y:y-15-k*20},end:{x:width-margin-8,y:y-15-k*20},
     color:rule,thickness:.7});
   }
   y-=lines*20+12;
  }else{
   for(const line of answerLines){
    page.drawText(line,{x:margin+14,y,size:10,font:bold,color:blue});y-=14;
   }
   if(mode==='steps')for(const line of stepLines){
    page.drawText(line,{x:margin+14,y,size:9,font:normal,color:gray});y-=13;
   }
   y-=22;
  }
 }
 for(const [index,p] of pdf.getPages().entries()){
  const footer='Pack '+pack.version+' | '+pack.kind+' | seed '+pack.seed+' | '+paper+' | '+mode+
   ' | Page '+(index+1)+'/'+pdf.getPageCount()+' | Answers match this exact pack';
  p.drawText(footer,{x:margin,y:42,font:normal,size:7,color:gray});
 }
 pdf.setTitle(heading+' - '+mode+' - seed '+pack.seed+' - version '+pack.version+' - '+paper);
 pdf.setSubject('Exact opt-in '+pack.kind+' equation pack; separate from the original integer generator v18');
 pdf.setCreator('Math Worksheet Studio');
 return pdf.save();
}
