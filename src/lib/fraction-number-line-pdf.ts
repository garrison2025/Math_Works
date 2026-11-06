/** R66 independently validated printable fraction number lines.
 * Every dot/tick is a vector shape with known rational geometry.
 */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {asText,rational} from './math.ts';
import {fractionLinePosition,FRACTION_LINE_DENOMINATORS,
 type FractionLinePack,type FractionLineQuestion} from './fraction-number-lines.ts';
import type {Paper} from './pdf.ts';
export type FractionLinePdfMode='questions'|'answers';
const sizes:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.16,.24),muted=rgb(.36,.43,.52),blue=rgb(.10,.34,.62),line=rgb(.18,.25,.34);
export function verifyFractionLinePack(pack:FractionLinePack):void{
 if(!pack||pack.version!=='R66.1'||(pack.topic!=='number-line-worksheets'&&pack.topic!=='fractions-worksheets')||
  !Number.isSafeInteger(pack.seed)||pack.seed<0||pack.seed>0xffffffff||
  !Number.isSafeInteger(pack.quantity)||pack.quantity<1||pack.quantity>40||
  !['easy','standard','challenge'].includes(pack.difficulty)||
  !['identify','plot'].includes(pack.task)||
  !['zero-one','zero-two'].includes(pack.range)||
  !Array.isArray(pack.questions)||pack.questions.length!==pack.quantity)
  throw Error('Invalid fraction number-line pack metadata');
 const signatures=new Set<string>(),max=pack.range==='zero-one'?1:2;
 for(const [i,q] of pack.questions.entries()){
  if(q.id!=='Q'+(i+1)||q.task!==pack.task||q.max!==max||
   !FRACTION_LINE_DENOMINATORS.includes(q.denominator)||
   !Number.isInteger(q.numerator)||q.numerator<=0||
   q.numerator>=q.denominator*max||(max===2&&q.numerator===q.denominator))
   throw Error('Invalid fraction number-line row '+(i+1));
  fractionLinePosition(q.numerator,q.denominator,max);
  const expected=q.numerator+'/'+q.denominator;
  if(q.answer!==expected||
   q.reducedAnswer!==asText(rational(BigInt(q.numerator),BigInt(q.denominator)))||
   q.prompt!==(pack.task==='identify'?'Write the fraction marked by the dot.':'Plot '+expected+' on the number line.'))
   throw Error('Fraction line question/answer mismatch at '+(i+1));
  if(signatures.has(expected))throw Error('Duplicate fraction line problem '+(i+1));
  signatures.add(expected);
 }
}
function label(page:PDFPage,text:string,x:number,y:number,font:PDFFont,size=9,color=ink){
 page.drawText(text,{x,y,font,size,color});
}
export async function createFractionLinePdf(pack:FractionLinePack,mode:FractionLinePdfMode,paper:Paper):Promise<Uint8Array>{
 verifyFractionLinePack(pack);
 if(mode!=='questions'&&mode!=='answers')throw Error('Invalid fraction number-line PDF mode');
 if(!Object.hasOwn(sizes,paper))throw Error('Invalid paper type');
 const pdf=await PDFDocument.create(),[width,height]=sizes[paper];
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const margin=44,perPage=8,plotStart=76,plotEnd=width-76,plotWidth=plotEnd-plotStart;
 const title='Fractions on a Number Line',max=pack.range==='zero-one'?1:2;
 for(let start=0;start<pack.quantity;start+=perPage){
  const page=pdf.addPage([width,height]),pageIndex=Math.floor(start/perPage)+1;
  label(page,title,margin,height-59,bold,18);
  label(page,(pack.task==='identify'?'NAME THE POINT':'PLOT THE FRACTION')+
   '  |  '+(max===1?'0 to 1':'0 to 2')+'  |  '+(mode==='questions'?'STUDENT':'ANSWER KEY'),
   margin,height-83,bold,9,blue);
  label(page,'Seed '+pack.seed+'  |  '+pack.difficulty+
   '  |  '+pack.quantity+' questions  |  Vector print '+paper,
   margin,height-103,regular,8,muted);
  label(page,mode==='questions'?'Name: _______________________________    Date: ______________':
   'Dots are at exact rational tick positions; reduce equivalent fractions when useful.',
   margin,height-126,regular,9,muted);
  for(const [offset,q] of pack.questions.slice(start,start+perPage).entries()){
   // Reserve a full 76 pt task row: student/teacher notation must not
   // collide with the next problem number even on the shorter Letter page.
   const y=height-147-offset*76,qIndex=start+offset+1,axisY=y-25;
   label(page,qIndex+'. '+q.prompt,margin,y,bold,10,ink);
   page.drawLine({start:{x:plotStart,y:axisY},end:{x:plotEnd,y:axisY},
    thickness:1.05,color:line});
   const intervals=q.denominator*max;
   for(let tick=0;tick<=intervals;tick++){
    const x=plotStart+(tick/intervals)*plotWidth;
    page.drawLine({start:{x,y:axisY-5.5},end:{x,y:axisY+5.5},
     thickness:tick%q.denominator===0?1.35:.82,color:line});
   }
   label(page,'0',plotStart-3,axisY-19,regular,8,ink);
   for(let unit=1;unit<=max;unit++){
    const x=plotStart+(unit/max)*plotWidth;
    label(page,String(unit),x-3,axisY-19,regular,8,ink);
   }
   if(pack.task==='identify'||mode==='answers'){
    const dotX=plotStart+fractionLinePosition(q.numerator,q.denominator,max)*plotWidth;
    page.drawCircle({x:dotX,y:axisY,size:4.5,color:blue,borderColor:ink,borderWidth:.5});
   }
   if(mode==='answers'){
    label(page,'Answer '+qIndex+': '+q.answer+
     (q.answer===q.reducedAnswer?'':' = '+q.reducedAnswer),
     plotStart,axisY-35,bold,9,blue);
   }else if(pack.task==='identify'){
    label(page,'Fraction: _______________',plotStart,axisY-35,regular,9,muted);
   }else{
    label(page,'Put one clear dot directly on the correct tick.',plotStart,axisY-35,regular,8,muted);
   }
  }
  label(page,'Math Worksheet Studio  |  R66.1  |  Page '+pageIndex+'/'+Math.ceil(pack.quantity/perPage)+
   '  |  '+mode+'  |  '+pack.seed,
   margin,36,regular,7,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle(title+' - '+pack.task+' - '+mode+' - seed '+pack.seed+' - '+paper+' - R66.1');
 pdf.setSubject('Exact fraction ticks; opt-in extension separate from 51 seeded v18 generators');
 return pdf.save();
}
