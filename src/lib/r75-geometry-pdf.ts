/** R75 vector PDF teaching artefacts: real side-length rods and an actual
 * L polygon cut out of a bounding rectangle, not decorative rectangles.
 * Teacher keys and worked explanations are isolated from student PDFs.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyTrianglePack,type TrianglePack,type TriangleProblem} from './triangle-inequality-pack.ts';
import {verifyCompositePack,type CompositePack,type CompositeProblem} from './composite-area-pack.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type R75PdfMode='questions'|'answers'|'steps';
export type R75Pack=TrianglePack|CompositePack;
const sizeByPaper:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.17,.26),muted=rgb(.38,.43,.53),accent=rgb(.12,.36,.60),guide=rgb(.66,.75,.83);
const ascii=(s:string)=>s.replaceAll('²','^2').replaceAll('×',' x ').replaceAll('≤','<=').replaceAll('≥','>=');
function write(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 page.drawText(ascii(s),{x,y,font,size,color});
}
function wrap(s:string,font:PDFFont,size:number,width:number):string[]{
 const words=ascii(s).split(/\s+/),out:string[]=[];let line='';
 for(const w of words){
  const test=line?line+' '+w:w;
  if(font.widthOfTextAtSize(test,size)<=width){line=test;continue;}
  if(line)out.push(line);
  if(font.widthOfTextAtSize(w,size)>width)throw Error('R75 PDF token exceeds print-safe left column');
  line=w;
 }
 if(line)out.push(line);
 return out;
}
function drawTriangleBars(page:PDFPage,p:TriangleProblem,right:number,y:number,font:PDFFont){
 const left=right-181,span=108;
 const values=p.kind==='possible'?[['a',p.a],['b',p.b],['c',p.c]] as const:
  [['a',p.a],['b',p.b]] as const;
 const scale=span/Math.max(p.a,p.b,p.c||0);
 for(const [i,[name,length]] of values.entries()){
  const yy=y-61-28*i,extent=scale*length;
  page.drawLine({start:{x:left,y:yy},end:{x:left+extent,y:yy},color:accent,thickness:2.4});
  page.drawLine({start:{x:left,y:yy-4},end:{x:left,y:yy+4},color:ink,thickness:1});
  page.drawLine({start:{x:left+extent,y:yy-4},end:{x:left+extent,y:yy+4},color:ink,thickness:1});
  write(page,name+'='+length+' '+p.unit,left+extent+7,yy-2.8,font,7.6,muted);
 }
 write(page,'Segments shown to scale',left,y-145,font,7.0,muted);
}
function drawLShape(page:PDFPage,p:CompositeProblem,right:number,y:number,font:PDFFont){
 const W=p.outerWidth,H=p.outerHeight,w=p.cutWidth,h=p.cutHeight;
 const x0=right-169,y0=y-131,scale=Math.min(127/W,75/H);
 const at=(x:number,yy:number)=>({x:x0+scale*x,y:y0+scale*yy});
 const outline=[[0,0],[W,0],[W,H-h],[W-w,H-h],[W-w,H],[0,H],[0,0]] as const;
 for(let i=0;i<outline.length-1;i++)
  page.drawLine({start:at(...outline[i]),end:at(...outline[i+1]),thickness:1.4,color:ink});
 const reference=[
  [[W,H-h],[W,H]],[[W-w,H],[W,H]]
 ] as const;
 for(const [a,b] of reference)
  page.drawLine({start:at(...a),end:at(...b),thickness:.65,color:guide,dashArray:[3,2]});
 if(p.kind==='split')
  page.drawLine({start:at(W-w,0),end:at(W-w,H-h),thickness:.72,color:accent,dashArray:[3,2]});
 const top=at(0,H),far=at(W,H),notch=at(W,H-h),cut=at(W-w,H);
 const base=at(W/2,0);
 write(page,'W='+W,base.x-12,y0-16,font,7.5,muted);
 write(page,'H='+H,x0-32,y0+scale*H/2,font,7.5,muted);
 write(page,'w='+w,(cut.x+far.x)/2-9,top.y+7,font,7.1,muted);
 write(page,'h='+h,far.x+5,(far.y+notch.y)/2,font,7.1,muted);
 write(page,p.unit,x0,y0-28,font,7.0,muted);
}
export async function createR75GeometryPdf(pack:R75Pack,mode:R75PdfMode,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 if(!pack||!['inequalities-worksheets','area-worksheets'].includes(pack.topic))
  throw Error('Invalid R75 geometry topic');
 if(pack.topic==='inequalities-worksheets')verifyTrianglePack(pack);
 else verifyCompositePack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid R75 mode');
 if(!Object.hasOwn(sizeByPaper,paper))throw Error('Invalid R75 paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid R75 writing room');
 const pdf=await PDFDocument.create(),[width,height]=sizeByPaper[paper];
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const left=42,right=width-42,graphicWidth=203,textWidth=right-left-graphicWidth;
 const perPage=3,rowHeight=184,total=Math.ceil(pack.quantity/perPage);
 const heading=pack.topic==='inequalities-worksheets'?'Triangle Inequality Theorem':'L-Shaped Composite Area';
 for(let offset=0;offset<pack.quantity;offset+=perPage){
  const page=pdf.addPage([width,height]),pageNo=1+offset/perPage;
  write(page,heading,left,height-57,bold,17);
  write(page,(mode==='questions'?'STUDENT PRACTICE':mode==='answers'?'TEACHER ANSWER KEY':'WORKED SOLUTIONS')+
   '  |  '+pack.mode+'  |  R75.1',left,height-79,bold,9,accent);
  write(page,'Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+' questions  |  '+paper,
   left,height-103,regular,8.3,muted);
  write(page,mode==='questions'?'Name: _________________________    Date: __________':
   'Exact dimensions and steps correspond to the matching student question PDF.',
   left,height-123,regular,8.3,muted);
  for(const [i,p] of pack.problems.slice(offset,offset+perPage).entries()){
   const y=height-162-i*rowHeight,index=offset+i+1;
   const prompt=wrap(index+'. '+p.question,bold,9.2,textWidth);
   if(prompt.length>4)throw Error('R75 question overflow '+index+' ('+prompt.length+' lines)');
   prompt.forEach((line,k)=>write(page,line,left,y-12.5*k,bold,9.2));
   const base=y-12.5*prompt.length;
   if(mode==='questions'){
    write(page,'Answer:',left+10,base-17,regular,8.4,muted);
    page.drawLine({start:{x:left+59,y:base-20},end:{x:left+textWidth-3,y:base-20},thickness:.75,color:guide});
    if(writingRoom==='extra')
     page.drawLine({start:{x:left+12,y:base-45},end:{x:left+textWidth-3,y:base-45},thickness:.7,color:guide});
   }else{
    for(const [j,line] of wrap('Answer: '+p.answer,bold,9.3,textWidth-4).entries())
     write(page,line,left+10,base-17-12*j,bold,9.3,accent);
    if(mode==='steps'){
     const stepRows=p.steps.flatMap(step=>wrap(step,regular,7.8,textWidth-12));
     if(stepRows.length>9)throw Error('R75 worked steps exceed row '+index);
     stepRows.forEach((line,k)=>write(page,line,left+10,base-42-11*k,regular,7.8,muted));
    }
   }
   if(pack.topic==='inequalities-worksheets')drawTriangleBars(page,p,right,y,regular);
   else drawLShape(page,p,right,y,regular);
   if(i<2)page.drawLine({start:{x:left,y:y-171},end:{x:right,y:y-171},thickness:.38,color:guide});
  }
  write(page,'R75.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+'  |  Page '+
   pageNo+'/'+total+'  |  Print Actual size (100%)',left,42,regular,7.2,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle(heading+' - '+mode+' - '+pack.mode+' - seed '+pack.seed+' - '+paper+' - R75.1');
 pdf.setSubject('Exact triangle inequality and non-overlapping composite area; student answers omitted');
 return pdf.save();
}