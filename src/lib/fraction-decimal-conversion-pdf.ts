/** R69 opt-in fraction/decimal conversion PDFs, validated before rendering.
 * Printer-friendly true numerator/division bar/denominator graphics.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyFractionDecimalPack,type ConversionPack,type ConversionQuestion} from './fraction-decimal-conversion.ts';
import type {Paper} from './pdf.ts';
export type ConversionPdfMode='questions'|'answers'|'steps';
const sizes:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.09,.16,.24),muted=rgb(.34,.43,.52),accent=rgb(.12,.35,.60),pencil=rgb(.72,.79,.86);
function print(page:PDFPage,text:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 page.drawText(text,{x,y,font,size,color});
}
function fraction(page:PDFPage,numerator:number,denominator:number,x:number,y:number,font:PDFFont){
 const top=String(numerator),bottom=String(denominator),size=12.5;
 const breadth=Math.max(font.widthOfTextAtSize(top,size),font.widthOfTextAtSize(bottom,size))+13;
 const center=x+breadth/2;
 print(page,top,center-font.widthOfTextAtSize(top,size)/2,y+6,font,size);
 page.drawLine({start:{x,y},end:{x:x+breadth,y},color:ink,thickness:1.2});
 print(page,bottom,center-font.widthOfTextAtSize(bottom,size)/2,y-17,font,size);
 return breadth;
}
function wrap(text:string,font:PDFFont,size:number,limit:number){
 const words=text.split(/\s+/),rows:string[]=[];let line='';
 for(const word of words){
  const candidate=line?line+' '+word:word;
  if(font.widthOfTextAtSize(candidate,size)<limit){line=candidate;continue;}
  if(line)rows.push(line);
  if(font.widthOfTextAtSize(word,size)>=limit)throw Error('R69 printed step too wide for page');
  line=word;
 }
 if(line)rows.push(line);
 return rows;
}
export async function createFractionDecimalPdf(pack:ConversionPack,mode:ConversionPdfMode,
 paper:Paper,writingRoom:'standard'|'extra'='standard'):Promise<Uint8Array>{
 verifyFractionDecimalPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid fraction-decimal PDF mode');
 if(!Object.hasOwn(sizes,paper))throw Error('Invalid fraction-decimal PDF paper size');
 if(writingRoom!=='standard'&&writingRoom!=='extra')throw Error('Invalid fraction-decimal writing room');
 const pdf=await PDFDocument.create(),[width,height]=sizes[paper];
 const regular=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const margin=43,perPage=mode==='steps'?4:writingRoom==='extra'&&mode==='questions'?6:8;
 const rowHeight=mode==='steps'?140:writingRoom==='extra'&&mode==='questions'?91:76;
 for(let offset=0;offset<pack.questions.length;offset+=perPage){
  const page=pdf.addPage([width,height]),current=Math.floor(offset/perPage)+1,
   total=Math.ceil(pack.questions.length/perPage);
  print(page,'Fractions & Decimals - Exact Conversions',margin,height-57,bold,16.4);
  print(page,(mode==='questions'?'STUDENT PRACTICE':mode==='answers'?'TEACHER ANSWER KEY':'WORKED STEPS')+
   '  |  '+pack.direction+'  |  '+pack.precision,margin,height-80,bold,8.5,accent);
  print(page,'Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+
   ' exercises  |  '+paper+'  |  Terminating decimals only',
   margin,height-102,regular,8.2,muted);
  print(page,mode==='questions'?'Name: _________________________________    Date: _____________':
   'Exact answers correspond to the same seeded student worksheet.',margin,height-127,regular,9,muted);
  for(const [i,q] of pack.questions.slice(offset,offset+perPage).entries()){
   const n=offset+i+1,y=height-158-i*rowHeight;
   print(page,n+'. '+q.question,margin,y,bold,10.3);
   let x=margin+47;
   if(q.kind==='fraction-to-decimal'){
    const breadth=fraction(page,q.numerator,q.denominator,x,y-28,bold);
    x+=breadth+28;
   }else{
    print(page,q.decimal,x,y-31,bold,13);
    x+=118;
   }
   print(page,'=',x,y-31,bold,13);
   if(mode==='questions'){
    page.drawLine({start:{x:x+25,y:y-34},end:{x:x+230,y:y-34},color:pencil,thickness:.85});
    if(writingRoom==='extra')
     page.drawLine({start:{x:x+25,y:y-64},end:{x:x+230,y:y-64},color:pencil,thickness:.70});
   }else{
    print(page,'Answer: '+q.answer,x+25,y-31,bold,11,accent);
    if(mode==='steps'){
     const explanations=q.steps.flatMap((step,k)=>wrap((k+1)+') '+step,regular,8.7,width-margin*2-26));
     if(explanations.length>5)throw Error('R69 worked conversion exceeds single row');
     for(const [k,step] of explanations.entries())
      print(page,step,margin+17,y-67-k*13,regular,8.7,muted);
    }
   }
  }
  print(page,'R69.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+current+'/'+total+'  |  Print Actual size (100%)',
   margin,35,regular,7.2,muted);
 }
 pdf.setTitle('Fractions to Decimals and Decimals to Fractions - '+mode+' - '+paper+' - seed '+pack.seed+' - R69.1');
 pdf.setCreator('Math Worksheet Studio');
 pdf.setSubject('Exact terminating rational-to-decimal conversion; separate from v18 worksheet generators');
 return pdf.save();
}
