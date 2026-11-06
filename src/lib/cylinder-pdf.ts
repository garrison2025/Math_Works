/** R76: true proportionally unfolded cylinder net: one rectangle with
 * width equal to circumference 2*pi*r, height h, and two radius-r disks.
 * A net is a mathematical representation, not a perspective rendering.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyCylinderPack,type CylinderPack,type CylinderProblem} from './cylinder-pack.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type CylinderPdfMode='questions'|'answers'|'steps';
const dimensions:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.17,.27),muted=rgb(.34,.43,.53),accent=rgb(.12,.37,.62),guide=rgb(.73,.80,.84);
const ascii=(s:string)=>s.replaceAll('π','pi').replaceAll('²','^2').replaceAll('³','^3').replaceAll('×',' x ').replaceAll('−','-');
const write=(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size:number,color=ink)=>
 page.drawText(ascii(s),{x,y,font,size,color});
function wrap(s:string,font:PDFFont,size:number,max:number):string[]{
 const words=ascii(s).split(/\s+/),out:string[]=[];let line='';
 for(const word of words){
  const test=line?line+' '+word:word;
  if(font.widthOfTextAtSize(test,size)<=max){line=test;continue;}
  if(line)out.push(line);
  if(font.widthOfTextAtSize(word,size)>max)throw Error('Cylinder PDF token too wide');
  line=word;
 }
 if(line)out.push(line);
 return out;
}
function net(page:PDFPage,p:CylinderProblem,right:number,y:number,font:PDFFont){
 const r=p.radius,h=p.height;
 const s=Math.min(129/(2*Math.PI*r),95/(h+4*r),3);
 const width=2*Math.PI*r*s,top=2*r*s+h*s;
 const x0=right-176,y0=y-145;
 const base=y0+2*r*s,roof=y0+top;
 const x1=x0+width,cx=x0+width/2;
 // Four exact flat lateral-rectangle sides, no notional 3-D curve.
 for(const [a,b] of [
  [[x0,base],[x1,base]],[[x1,base],[x1,roof]],
  [[x1,roof],[x0,roof]],[[x0,roof],[x0,base]]
 ] as const)
  page.drawLine({start:{x:a[0],y:a[1]},end:{x:b[0],y:b[1]},thickness:1.12,color:ink});
 const rad=r*s;
 page.drawCircle({x:cx,y:y0+rad,size:rad,color:rgb(1,1,1),borderColor:accent,borderWidth:1.04});
 page.drawCircle({x:cx,y:roof+rad,size:rad,color:rgb(1,1,1),borderColor:accent,borderWidth:1.04});
 page.drawLine({start:{x:cx,y:roof+rad},end:{x:cx+rad,y:roof+rad},thickness:.75,color:muted});
 write(page,'r='+r+' '+p.unit,cx+rad+3,roof+rad-3,font,7.2,muted);
 write(page,'h='+h+' '+p.unit,x1+4,base+(roof-base)/2,font,7.3,muted);
 write(page,'C=2pi*r',x0,base-11,font,6.8,muted);
 write(page,'NET (2 disks + side)',x0,y-166,font,6.6,muted);
}
export async function createCylinderPdf(pack:CylinderPack,mode:CylinderPdfMode,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyCylinderPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid cylinder PDF mode');
 if(!Object.hasOwn(dimensions,paper))throw Error('Invalid cylinder paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid cylinder writing room');
 const [pageWidth,pageHeight]=dimensions[paper],pdf=await PDFDocument.create();
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const left=42,right=pageWidth-42,textWidth=right-left-202,perPage=3,rowHeight=185;
 const totalPages=Math.ceil(pack.quantity/perPage);
 for(let offset=0;offset<pack.quantity;offset+=perPage){
  const page=pdf.addPage([pageWidth,pageHeight]),index=1+offset/perPage;
  write(page,'Cylinder Surface Area and Volume',left,pageHeight-57,bold,16);
  write(page,(mode==='questions'?'STUDENT WORKSHEET':mode==='answers'?'TEACHER ANSWER KEY':'WORKED SOLUTIONS')+
   '   |   '+pack.mode+'   |   R76.1',left,pageHeight-79,bold,8.8,accent);
  write(page,'Seed '+pack.seed+'   |   '+pack.difficulty+'   |   '+pack.quantity+' questions   |   '+paper,
   left,pageHeight-103,regular,8.4,muted);
  write(page,mode==='questions'?'Name: __________________________    Date: ______________':
   'The teacher solutions correspond exactly to the matching student PDF.',
   left,pageHeight-124,regular,8.4,muted);
  for(const [i,p] of pack.problems.slice(offset,offset+perPage).entries()){
   const y=pageHeight-168-i*rowHeight,question=wrap((offset+i+1)+'. '+p.question,bold,9.3,textWidth);
   if(question.length>5)throw Error('Cylinder question overflows print row '+(offset+i+1));
   question.forEach((s,j)=>write(page,s,left,y-12.6*j,bold,9.3));
   const base=y-question.length*12.6;
   if(mode==='questions'){
    write(page,'Answer:',left+10,base-16,regular,8.2,muted);
    page.drawLine({start:{x:left+57,y:base-19},end:{x:left+textWidth-4,y:base-19},color:guide,thickness:.8});
    if(writingRoom==='extra')
     page.drawLine({start:{x:left+10,y:base-44},end:{x:left+textWidth-4,y:base-44},color:guide,thickness:.8});
   }else{
    const answers=wrap('Answer: '+p.answer,bold,9.2,textWidth-12);
    answers.forEach((s,j)=>write(page,s,left+10,base-17-12*j,bold,9.2,accent));
    if(mode==='steps'){
     const lines=p.steps.flatMap(step=>wrap(step,regular,7.8,textWidth-12));
     if(lines.length>10)throw Error('Cylinder worked steps overflow '+(offset+i+1));
     lines.forEach((s,j)=>write(page,s,left+10,base-29-answers.length*12-j*10.5,regular,7.8,muted));
    }
   }
   net(page,p,right,y,regular);
   if(i<2)page.drawLine({start:{x:left,y:y-178},end:{x:right,y:y-178},color:guide,thickness:.4});
  }
  write(page,'R76.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+index+'/'+totalPages+'  |  Print Actual size (100%)',left,42,regular,7.2,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('Cylinder exact math - '+mode+' - '+pack.mode+' - seed '+pack.seed+' - '+paper+' - R76.1');
 pdf.setSubject('Correct two-base cylinder net and exact pi surface area and volume; student answers isolated');
 return pdf.save();
}
