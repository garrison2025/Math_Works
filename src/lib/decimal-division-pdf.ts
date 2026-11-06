/** R67 printable decimal division PDF packs, independent of the v18
 * worksheet renderer. PDF export validates every exact quotient and step.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyDecimalDivisionPack,type DecimalDivisionPack} from './decimal-division.ts';
import type {Paper} from './pdf.ts';
export type DecimalDivisionPdfMode='questions'|'answers'|'steps';
const paperSize:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.09,.15,.24),blue=rgb(.11,.35,.62),muted=rgb(.35,.43,.52),rule=rgb(.76,.82,.88);
function wrapped(value:string,font:PDFFont,size:number,maxWidth:number):string[]{
 const words=value.split(/\s+/),lines:string[]=[];let row='';
 for(const word of words){
  const next=row?row+' '+word:word;
  if(font.widthOfTextAtSize(next,size)<maxWidth){row=next;continue}
  if(row)lines.push(row);
  if(font.widthOfTextAtSize(word,size)>=maxWidth)throw Error('Decimal division PDF has an overwide word');
  row=word;
 }
 if(row)lines.push(row);
 return lines;
}
export async function createDecimalDivisionPdf(pack:DecimalDivisionPack,mode:DecimalDivisionPdfMode,paper:Paper,
 writingRoom:'standard'|'extra'='standard'):Promise<Uint8Array>{
 verifyDecimalDivisionPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid decimal division PDF mode');
 if(!Object.hasOwn(paperSize,paper))throw Error('Invalid decimal division paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid decimal division writing room');
 const pdf=await PDFDocument.create(),[width,height]=paperSize[paper];
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const totalRows=mode==='steps'?5:mode==='questions'&&writingRoom==='extra'?6:8;
 const totalPages=Math.ceil(pack.questions.length/totalRows);
 for(let pageNumber=0;pageNumber<totalPages;pageNumber++){
  const page:PDFPage=pdf.addPage([width,height]),left=46,right=width-46;
  page.drawText('Decimal Division Worksheets',{x:left,y:height-59,font:bold,size:17,color:ink});
  page.drawText((mode==='questions'?'STUDENT PRACTICE':mode==='answers'?'MATCHING ANSWER KEY':'WORKED SOLUTIONS')+
   '  |  Whole or decimal divisors  |  Terminating answers',
   {x:left,y:height-83,font:bold,size:9,color:blue});
  page.drawText('Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.divisorMode+
   ' divisors  |  '+pack.precisionMode+' quotient precision  |  '+paper,
   {x:left,y:height-103,font:regular,size:8.4,color:muted});
  page.drawText(mode==='questions'?'Name: ______________________________    Date: _______________':
   'Answers match the same seed, difficulty, divisor type and decimal precision.',
   {x:left,y:height-126,font:regular,size:9,color:muted});
  const first=pageNumber*totalRows,last=Math.min(pack.questions.length,first+totalRows);
  const rowHeight=mode==='steps'?106:mode==='questions'&&writingRoom==='extra'?88:70;
  for(let i=first;i<last;i++){
   const q=pack.questions[i],row=i-first,y=height-161-row*rowHeight;
   const question=(i+1)+'. '+q.question;
   for(const [k,text] of wrapped(question,bold,10.5,right-left).entries())
    page.drawText(text,{x:left,y:y-k*13,font:bold,size:10.5,color:ink});
   if(mode==='questions'){
    const lines=writingRoom==='extra'?3:2;
    for(let k=0;k<lines;k++){
     const lY=y-22-k*19;
     page.drawLine({start:{x:left+18,y:lY},end:{x:right-8,y:lY},color:rule,thickness:.72});
    }
   }else{
    page.drawText('Answer: '+q.answer,
     {x:left+17,y:y-19,size:10,font:bold,color:blue});
    if(mode==='steps'){
     const lines=q.steps.flatMap((step,k)=>wrapped((k+1)+') '+step,regular,8.6,right-left-22));
     if(lines.length>5)throw Error('R67 PDF worked solution exceeded its row');
     for(const [k,text] of lines.entries()){
      page.drawText(text,{x:left+17,y:y-34-k*12,size:8.6,font:regular,color:muted});
     }
    }
   }
  }
  page.drawText('R67.1  |  '+mode+'  |  Seed '+pack.seed+'  |  '+paper+
   '  |  Page '+(pageNumber+1)+'/'+totalPages,
   {x:left,y:36,font:regular,size:7.5,color:muted});
 }
 pdf.setTitle('Decimal Division Worksheets - '+mode+' - seed '+pack.seed+' - '+paper+' - R67.1');
 pdf.setCreator('Math Worksheet Studio');
 pdf.setSubject('Exact terminating decimal division; independent of integer generator v18');
 return pdf.save();
}
