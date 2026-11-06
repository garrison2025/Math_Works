/** R68 printable true decimal column arithmetic.
 * Exactly aligned decimal points, vector rules, exact student/teacher separation.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyDecimalAddSubPack,type DecimalAddSubPack,type DecimalAddSubQuestion} from './decimal-add-sub.ts';
import type {Paper} from './pdf.ts';
export type DecimalAddSubPdfMode='questions'|'answers'|'steps';
const sizes:Record<Paper,readonly [number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.09,.16,.24),muted=rgb(.35,.43,.52),accent=rgb(.10,.35,.60),rule=rgb(.70,.77,.85);
const safe=(text:string)=>text.replace(/−/g,'-').replace(/[^\x20-\x7E×÷]/g,'');
function drawRight(page:PDFPage,text:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 const printable=safe(text);
 page.drawText(printable,{x:x-font.widthOfTextAtSize(printable,size),y,font,size,color});
}
function wrap(text:string,font:PDFFont,size:number,maxWidth:number):string[]{
 const result:string[]=[],tokens=safe(text).split(/\s+/);let line='';
 for(const word of tokens){
  const trial=line?line+' '+word:word;
  if(font.widthOfTextAtSize(trial,size)<maxWidth){line=trial;continue;}
  if(line){result.push(line);line='';}
  if(font.widthOfTextAtSize(word,size)>=maxWidth)throw Error('Column practice text too wide for PDF');
  line=word;
 }
 if(line)result.push(line);
 return result;
}
export async function createDecimalAddSubPdf(pack:DecimalAddSubPack,mode:DecimalAddSubPdfMode,
 paper:Paper,writingRoom:'standard'|'extra'='standard'):Promise<Uint8Array>{
 verifyDecimalAddSubPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid R68 PDF mode');
 if(!Object.hasOwn(sizes,paper))throw Error('Invalid R68 paper size');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid R68 writing space');
 const pdf=await PDFDocument.create(),[width,height]=sizes[paper],margin=45;
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const mono=await pdf.embedFont(StandardFonts.CourierBold);
 const perPage=mode==='steps'?5:mode==='questions'&&writingRoom==='extra'?6:8;
 const rowHeight=mode==='steps'?109:mode==='questions'&&writingRoom==='extra'?89:73;
 for(let offset=0;offset<pack.questions.length;offset+=perPage){
  const page:PDFPage=pdf.addPage([width,height]),pg=Math.floor(offset/perPage)+1,total=Math.ceil(pack.questions.length/perPage);
  page.drawText('Decimal Addition & Subtraction',{x:margin,y:height-59,font:bold,size:17,color:ink});
  page.drawText((mode==='questions'?'STUDENT WORKSHEET':mode==='answers'?'TEACHER ANSWER KEY':'WORKED SOLUTIONS')+
   '  |  Aligned decimal columns  |  '+pack.operation+'  |  '+pack.precision,
   {x:margin,y:height-82,font:bold,size:8.4,color:accent});
  page.drawText('Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+' problems  |  Regrouping: '+pack.regrouping+
   '  |  '+paper,{x:margin,y:height-102,font:regular,size:8.3,color:muted});
  page.drawText(mode==='questions'?'Name: ______________________________     Date: ______________':
   'Use the same seed, operation, decimal places and regrouping mode to match the student sheet.',
   {x:margin,y:height-123,font:regular,size:8.7,color:muted});
  for(const [j,q] of pack.questions.slice(offset,offset+perPage).entries()){
   const number=offset+j+1,y=height-155-j*rowHeight,operation=q.operation==='addition'?'+':'-';
   const rightX=margin+204;
   page.drawText(number+'. '+safe(q.a+' '+(q.operation==='addition'?'+':'−')+' '+q.b),
    {x:margin,y,font:bold,size:10.1,color:ink});
   // Right alignment of equal fixed decimal places guarantees the decimal
   // separators share exactly one printed x coordinate in both operands.
   drawRight(page,q.a,rightX,y-17,mono,14);
   drawRight(page,q.b,rightX,y-35,mono,14);
   page.drawText(operation,{x:rightX-92,y:y-35,font:bold,size:14,color:ink});
   page.drawLine({start:{x:rightX-101,y:y-42},end:{x:rightX+5,y:y-42},
    color:ink,thickness:1});
   if(mode==='questions'){
    page.drawLine({start:{x:rightX-84,y:y-62},end:{x:rightX+4,y:y-62},
     color:rule,thickness:.7});
    if(writingRoom==='extra')
     page.drawLine({start:{x:margin+215,y:y-70},end:{x:width-margin-8,y:y-70},
      color:rule,thickness:.65});
   }else{
    drawRight(page,q.answer,rightX,y-60,mono,14,accent);
    if(mode==='steps'){
     const lines=q.steps.flatMap((step,k)=>wrap((k+1)+') '+step,regular,8.3,width-margin-(margin+232)));
     if(lines.length>6)throw Error('R68 worked explanation too long for print layout');
     for(const [k,text] of lines.entries())
      page.drawText(text,{x:margin+232,y:y-20-k*12,font:regular,size:8.3,color:muted});
    }
   }
  }
  page.drawText('R68.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+'  |  Page '+pg+'/'+total+
   '  |  Print at Actual size (100%)',
   {x:margin,y:35,font:regular,size:7.1,color:muted});
 }
 pdf.setTitle('Decimal Add and Subtract Column Worksheets - '+mode+' - '+paper+' - seed '+pack.seed+' - R68.1');
 pdf.setCreator('Math Worksheet Studio');
 pdf.setSubject('Exact fixed-point aligned vertical decimal add/sub practice separate from v18 integer generators');
 return pdf.save();
}
