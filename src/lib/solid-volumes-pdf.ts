/** R99 exact solid volumes: student, answer and independently regenerable worked-step PDFs. */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {verifySolidSet,type SolidSet} from './solid-volumes.ts';
export type SolidEdition='questions'|'answers'|'steps';
export type SolidPaper='Letter'|'A4';
const sizes:Record<SolidPaper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const margin=46,lineHeight=16;
const safe=(s:string)=>s.replaceAll('π',' pi').replaceAll('³','^3').replaceAll('²','^2').replaceAll('×','x');
function wrap(text:string,font:PDFFont,size:number,width:number):string[]{
 const words=safe(text).trim().split(/\s+/);const lines:string[]=[];let line='';
 for(const word of words){
  if(font.widthOfTextAtSize(word,size)>width)throw Error('Volume PDF text token too wide');
  const next=line?line+' '+word:word;
  if(font.widthOfTextAtSize(next,size)>width&&line){lines.push(line);line=word}else line=next;
 }
 if(line)lines.push(line);return lines;
}
function drawLines(p:PDFPage,lines:string[],font:PDFFont,x:number,y:number,size:number,color=rgb(.12,.18,.26)):number{
 for(const s of lines){p.drawText(s,{x,y,font,size,color});y-=lineHeight}
 return y;
}
export async function createSolidPdf(set:SolidSet,edition:SolidEdition,paper:SolidPaper):Promise<Uint8Array>{
 verifySolidSet(set);
 if(!['questions','answers','steps'].includes(edition)||!Object.hasOwn(sizes,paper))throw Error('Invalid solid PDF edition/paper');
 const pdf=await PDFDocument.create(),normal=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const [w,h]=sizes[paper],usable=w-2*margin-24,id='SV1-'+set.seed+'-'+set.mode+'-'+set.level+'-'+set.problems.length;
 const pages:PDFPage[]=[];let page:PDFPage,y=0;
 const newPage=()=>{
  page=pdf.addPage([w,h]);pages.push(page);y=h-52;
  page.drawText('MATH WORKS  /  EXACT SOLID VOLUMES',{x:margin,y,size:11,font:bold,color:rgb(.10,.37,.61)});y-=22;
  page.drawText((edition==='questions'?'Student worksheet':edition==='answers'?'Teacher answer key':'Worked solutions')+' | '+set.level+' | '+paper,
   {x:margin,y,size:9,font:normal,color:rgb(.35,.42,.50)});y-=16;
  page.drawText('Reproducible set: '+id,{x:margin,y,size:8.5,font:normal,color:rgb(.35,.42,.50)});y-=17;
  if(edition==='questions'){
   page.drawText('Name: ______________________   Date: ____________________',{x:margin,y,size:10,font:normal});y-=19;
  }
  page.drawLine({start:{x:margin,y},end:{x:w-margin,y},thickness:.8,color:rgb(.8,.84,.88)});y-=25;
 };
 newPage();
 for(const p of set.problems){
  const q=wrap(p.question,normal,10.8,usable),answer=wrap('Answer: '+p.answer,bold,10.4,usable),
   steps=edition==='steps'?p.steps.map(s=>wrap(s,normal,10,usable)):[];
  const needed=q.length*lineHeight+6+
   (edition==='questions'?2*20+17:edition==='answers'?answer.length*lineHeight+19:
    steps.reduce((n,lines)=>n+lines.length*lineHeight+4,0)+answer.length*lineHeight+16)+12;
  if(needed>h-190)throw Error('A solid volume question exceeds single-page layout');
  if(y-needed<68)newPage();
  page!.drawText(p.id+'.',{x:margin,y,font:bold,size:10.8,color:rgb(.10,.37,.61)});
  y=drawLines(page!,q,normal,margin+24,y,10.8)-6;
  if(edition==='questions'){
   for(let i=0;i<2;i++){
    y-=20;page!.drawLine({start:{x:margin+24,y},end:{x:w-margin-5,y},thickness:.65,color:rgb(.76,.82,.88)});
   }
   y-=17;
  }else if(edition==='answers'){
   y=drawLines(page!,answer,bold,margin+24,y,10.4)-19;
  }else{
   for(const lines of steps)y=drawLines(page!,lines,normal,margin+24,y,10)-4;
   y=drawLines(page!,answer,bold,margin+24,y,10.4)-16;
  }
 }
 pages.forEach((p,i)=>p.drawText('Page '+(i+1)+' of '+pages.length+' | '+id+' | '+edition,
  {x:margin,y:42,size:8,font:normal,color:rgb(.35,.42,.50)}));
 pdf.setTitle('Math Works exact solid volumes | '+edition+' | '+id);
 pdf.setSubject('Exact sphere, cone and pyramid volume practice; π retained symbolically.');
 pdf.setCreator('Math Worksheet Studio');pdf.setProducer('Math Worksheet Studio | pdf-lib');
 return pdf.save({useObjectStreams:false});
}
