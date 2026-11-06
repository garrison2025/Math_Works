/** R79 actual mixed prism/cylinder worksheet, *one* PDF per edition.
 * R76 cylinder and R78 triangular prism true vector net renderers are reused
 * without modifying their original scale or drawing algorithm.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyMixedSolidPack,type MixedSolidPack,type MixedSolidProblem} from './mixed-prism-cylinder-pack.ts';
import {drawCylinderNet} from './cylinder-pdf.ts';
import {drawTriangularPrismNet} from './prism-pyramid-pdf.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type MixedSolidPdfMode='questions'|'answers'|'steps';
const papers:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.17,.26),soft=rgb(.36,.44,.51),blue=rgb(.12,.38,.63),guide=rgb(.72,.78,.84);
function plain(text:string):string{
 return text.replaceAll('π','pi').replaceAll('²','^2').replaceAll('³','^3').replaceAll('×',' x ').replaceAll('−','-');
}
function write(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 page.drawText(plain(s),{x,y,font,size,color});
}
function wrap(s:string,font:PDFFont,size:number,maxWidth:number):string[]{
 const words=plain(s).split(/\s+/),lines:string[]=[];let cur='';
 for(const word of words){
  const next=cur?cur+' '+word:word;
  if(font.widthOfTextAtSize(next,size)<=maxWidth){cur=next;continue;}
  if(cur)lines.push(cur);
  if(font.widthOfTextAtSize(word,size)>maxWidth)throw Error('Mixed geometry line token exceeds page');
  cur=word;
 }
 if(cur)lines.push(cur);
 return lines;
}
export function drawRectangularPrismNet(page:PDFPage,p:Pick<MixedSolidProblem,'l'|'w'|'h'>,right:number,rowY:number,font:PDFFont){
 const {l,w,h}=p;
 const s=Math.min(184/(2*l+2*w),112/(h+2*w),4.2);
 const x0=right-208,y0=rowY-147;
 const xx=[x0,x0+w*s,x0+(w+l)*s,x0+(2*w+l)*s,x0+(2*w+2*l)*s];
 const low=y0+w*s,high=low+h*s;
 const edge=(a:[number,number],b:[number,number])=>
  page.drawLine({start:{x:a[0],y:a[1]},end:{x:b[0],y:b[1]},thickness:1.05,color:ink});
 for(const x of xx)edge([x,low],[x,high]);
 edge([xx[0],low],[xx[4],low]);edge([xx[0],high],[xx[4],high]);
 // Both congruent l x w faces attach to the center width-l rectangle.
 for(const [a,b] of [[low-w*s,low],[high,high+w*s]] as const){
  edge([xx[1],a],[xx[1],b]);edge([xx[2],a],[xx[2],b]);
  edge([xx[1],a===low-w*s?a:b],[xx[2],a===low-w*s?a:b]);
 }
 write(page,'l='+l,xx[1]+2,low+h*s/2,font,7.1,soft);
 write(page,'w='+w,xx[0]+2,low+h*s/2,font,7.1,soft);
 write(page,'h='+h,right-205,rowY-165,font,7.1,soft);
 write(page,'2 bases + 4 sides',right-205,rowY-178,font,6.6,soft);
}
export async function createMixedSolidPdf(pack:MixedSolidPack,mode:MixedSolidPdfMode,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyMixedSolidPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid mixed solid PDF mode');
 if(!Object.hasOwn(papers,paper))throw Error('Invalid mixed solid paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid mixed solid writing room');
 const [width,height]=papers[paper],pdf=await PDFDocument.create();
 const normal=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const left=42,right=width-42,available=right-left-216,rows=3,totalPages=Math.ceil(pack.quantity/rows);
 for(let offset=0;offset<pack.quantity;offset+=rows){
  const page=pdf.addPage([width,height]),index=1+offset/rows;
  write(page,'Mixed Prisms and Cylinders',left,height-57,bold,16);
  write(page,(mode==='questions'?'STUDENT PRACTICE':mode==='answers'?'MATCHING ANSWER KEY':'WORKED SOLUTIONS')+
   '  |  '+pack.task+'  |  '+pack.mode+'  |  R79.1',left,height-80,bold,8.3,blue);
  write(page,'Seed '+pack.seed+'   |   '+pack.difficulty+'   |   '+pack.quantity+
   ' questions   |   '+paper,left,height-104,normal,8.3,soft);
  write(page,mode==='questions'?'Name: ____________________________    Date: ___________':
   'Each diagram has dimension-proportional net faces and exact matching solutions.',
   left,height-126,normal,8.1,soft);
  for(const [j,p] of pack.problems.slice(offset,offset+rows).entries()){
   const y=height-168-j*185;
   const lines=wrap((offset+j+1)+'. '+p.question,bold,8.8,available);
   if(lines.length>6)throw Error('Mixed prism/cylinder question overflows print row '+p.id);
   lines.forEach((s,k)=>write(page,s,left,y-12*k,bold,8.8));
   const base=y-lines.length*12;
   if(mode==='questions'){
    write(page,'Answer:',left+8,base-16,normal,8,soft);
    page.drawLine({start:{x:left+56,y:base-19},end:{x:left+available-5,y:base-19},
     color:guide,thickness:.7});
    if(writingRoom==='extra')page.drawLine({start:{x:left+8,y:base-42},
     end:{x:left+available-5,y:base-42},color:guide,thickness:.7});
   }else{
    const answers=wrap('Answer: '+p.answer,bold,9.1,available-14);
    if(answers.length>3)throw Error('Mixed solid teacher answer too tall');
    answers.forEach((s,k)=>write(page,s,left+8,base-16-12*k,bold,9.1,blue));
    if(mode==='steps'){
     const steps=p.steps.flatMap(step=>wrap(step,normal,7.5,available-12));
     if(steps.length>9)throw Error('Mixed solid worked steps exceed print row '+p.id);
     steps.forEach((s,k)=>write(page,s,left+8,base-28-12*answers.length-10.5*k,normal,7.5,soft));
    }
   }
   if(p.kind==='rectangular-prism')drawRectangularPrismNet(page,p,right,y,normal);
   else if(p.kind==='triangular-prism')drawTriangularPrismNet(page,p,right,y,normal);
   else drawCylinderNet(page,p,right,y,normal);
   if(j<2)page.drawLine({start:{x:left,y:y-180},end:{x:right,y:y-180},
    color:guide,thickness:.38});
  }
  write(page,'R79.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+index+'/'+totalPages+'  |  Print Actual size / 100%',left,42,normal,7.2,soft);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('Mixed right prisms and cylinders - '+pack.task+' - '+pack.mode+' - '+mode+' - seed '+pack.seed+' - '+paper+' - R79.1');
 pdf.setSubject('One physical worksheet mixing three true prism/cylinder nets with exact square, cubic and pi math and isolated teacher keys');
 return pdf.save();
}
