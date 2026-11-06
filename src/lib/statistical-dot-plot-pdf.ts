/** R77 true statistical dot plots, with ten equally spaced numeric ticks
 * and vertically stacked genuine PDF vector dots. Drawing-mode students see
 * only a blank axis, while readers see source frequencies without answers.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyDotPlotPack,type DotPlotPack,type DotPlotProblem} from './statistical-dot-plot.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type DotPlotPdfMode='questions'|'answers'|'steps';
const dimensions:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.17,.27),muted=rgb(.36,.43,.52),accent=rgb(.12,.39,.65),grey=rgb(.72,.78,.85);
const write=(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size:number,color=ink)=>
 page.drawText(s,{x,y,size,font,color});
function wrap(s:string,font:PDFFont,size:number,maxWidth:number):string[]{
 const words=s.split(/\s+/),lines:string[]=[];let line='';
 for(const word of words){
  const attempt=line?line+' '+word:word;
  if(font.widthOfTextAtSize(attempt,size)<=maxWidth){line=attempt;continue;}
  if(line)lines.push(line);
  if(font.widthOfTextAtSize(word,size)>maxWidth)throw Error('Dot plot PDF overlong word');
  line=word;
 }
 if(line)lines.push(line);
 return lines;
}
function plot(page:PDFPage,p:DotPlotProblem,right:number,rowY:number,font:PDFFont,show:boolean){
 const x0=right-215,step=18.5,axisY=rowY-135,dotStep=12.4;
 const x10=x0+9*step;
 page.drawLine({start:{x:x0-9,y:axisY},end:{x:x10+9,y:axisY},color:ink,thickness:1.3});
 for(let i=0;i<10;i++){
  const px=x0+i*step;
  page.drawLine({start:{x:px,y:axisY-4},end:{x:px,y:axisY+4},color:ink,thickness:.8});
  const text=String(i+1);
  write(page,text,px-font.widthOfTextAtSize(text,7.5)/2,axisY-17,font,7.5,ink);
  if(show)for(let k=0;k<p.frequencies[i];k++)
   page.drawCircle({x:px,y:axisY+12.4+k*dotStep,size:3.1,color:accent,
    borderColor:accent,borderWidth:.4});
 }
 write(page,show?'Each dot = 1 observation':'Plot one dot per observation',x0-9,rowY-46,font,7.1,muted);
 write(page,'Data value',x0+57,axisY-32,font,7.1,muted);
}
export async function createDotPlotPdf(pack:DotPlotPack,mode:DotPlotPdfMode,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyDotPlotPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid dot plot PDF mode');
 if(!Object.hasOwn(dimensions,paper))throw Error('Invalid dot plot paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid dot plot writing room');
 const pdf=await PDFDocument.create(),[width,height]=dimensions[paper];
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const left=42,right=width-42,questionWidth=right-left-227,perPage=3,rowHeight=185;
 const pages=Math.ceil(pack.quantity/perPage);
 for(let offset=0;offset<pack.quantity;offset+=perPage){
  const page=pdf.addPage([width,height]),index=offset/perPage+1;
  write(page,'Statistical Frequency Dot Plots',left,height-57,bold,16.5);
  write(page,(mode==='questions'?'STUDENT WORKSHEET':mode==='answers'?'MATCHING ANSWER KEY':'WORKED SOLUTIONS')+
   '  |  '+pack.mode+'  |  R77.1',left,height-80,bold,8.9,accent);
  write(page,'Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+' questions  |  '+paper,
   left,height-104,regular,8.4,muted);
  write(page,mode==='questions'?'Name: _____________________________    Date: __________':
   'Read/draw each graph using exact sample frequencies. One dot means one observation.',
   left,height-125,regular,8.2,muted);
  for(const [i,p] of pack.problems.slice(offset,offset+perPage).entries()){
   const rowY=height-168-i*rowHeight,lines=wrap((offset+i+1)+'. '+p.question,bold,9.1,questionWidth);
   if(lines.length>6)throw Error('R77 prompt too long to print '+p.id);
   lines.forEach((line,j)=>write(page,line,left,rowY-j*12.2,bold,9.1));
   const base=rowY-lines.length*12.2;
   if(mode==='questions'){
    write(page,'Answer:',left+6,base-15,regular,8.1,muted);
    page.drawLine({start:{x:left+50,y:base-18},end:{x:left+questionWidth-2,y:base-18},color:grey,thickness:.7});
    if(writingRoom==='extra')
     page.drawLine({start:{x:left+6,y:base-40},end:{x:left+questionWidth-2,y:base-40},color:grey,thickness:.7});
   }else{
    const answers=wrap('Answer: '+p.answer,bold,8.6,questionWidth-7);
    if(answers.length>4)throw Error('R77 answer too long '+p.id);
    answers.forEach((line,j)=>write(page,line,left+6,base-15-j*11.8,bold,8.6,accent));
    if(mode==='steps'){
     const steps=p.steps.flatMap(step=>wrap(step,regular,7.3,questionWidth-12));
     if(steps.length>8)throw Error('R77 steps too tall '+p.id);
     steps.forEach((line,j)=>write(page,line,left+6,base-22-answers.length*11.8-j*10.5,regular,7.3,muted));
    }
   }
   plot(page,p,right,rowY,mode!=='questions'||p.kind!=='plot');
   if(i<2)page.drawLine({start:{x:left,y:rowY-178},end:{x:right,y:rowY-178},color:grey,thickness:.4});
  }
  write(page,'R77.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+index+'/'+pages+'  |  Print Actual size (100%)',left,42,regular,7.2,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('Statistical frequency dot plots - '+mode+' - '+pack.mode+' - seed '+pack.seed+' - '+paper+' - R77.1');
 pdf.setSubject('True 1..10 frequency-dot diagrams; student data isolated from matching teacher answers');
 return pdf.save();
}
