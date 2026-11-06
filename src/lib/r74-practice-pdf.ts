/** R74 reusable printable math extension PDF renderer.
 * Strict pack revalidation before all PDF writes. Distinct student, teacher and
 * worked-step sheets, true vector lines/circles and no student answer leakage.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyInequalityPracticePack,type InequalityPracticePack,type InequalityGraph} from './inequality-practice.ts';
import {verifyCircleAreaPack,type CircleAreaPack,type CircleAreaProblem} from './circle-area-practice.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type R74PdfMode='questions'|'answers'|'steps';
type Pack=InequalityPracticePack|CircleAreaPack;
const pageSizes:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.11,.17,.26),muted=rgb(.34,.40,.49),blue=rgb(.12,.36,.58),grey=rgb(.73,.78,.85);
const pdfText=(s:string)=>s.replaceAll('≤','<=').replaceAll('≥','>=').replaceAll('π','pi').replaceAll('θ','theta').replaceAll('²','^2').replaceAll('°',' degrees').replaceAll('×',' x ').replaceAll('−','-');
function drawText(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 page.drawText(pdfText(s),{x,y,font,size,color});
}
function wrap(s:string,font:PDFFont,size:number,width:number):string[]{
 const result:string[]=[],words=pdfText(s).split(/\s+/);let line='';
 for(const word of words){
  const next=line?line+' '+word:word;
  if(font.widthOfTextAtSize(next,size)<=width){line=next;continue;}
  if(line)result.push(line);
  if(font.widthOfTextAtSize(word,size)>width)throw Error('Overlong math PDF token');
  line=word;
 }
 if(line)result.push(line);
 return result;
}
function drawGraph(page:PDFPage,g:InequalityGraph,left:number,right:number,y:number,show:boolean,font:PDFFont){
 const low=Math.min(g.lower,g.upper),high=Math.max(g.lower,g.upper);
 const min=low-4,max=high+4,unit=(right-left)/(max-min),at=(v:number)=>left+(v-min)*unit;
 page.drawLine({start:{x:left,y},end:{x:right,y},color:ink,thickness:1});
 for(const [x,sign] of [[left,-1],[right,1]] as const){
  page.drawLine({start:{x,y},end:{x:x-sign*5,y:y+3},color:ink,thickness:1});
  page.drawLine({start:{x,y},end:{x:x-sign*5,y:y-3},color:ink,thickness:1});
 }
 const tickStep=Math.max(1,Math.ceil((max-min)/11));
 for(let v=Math.ceil(min/tickStep)*tickStep;v<=max;v+=tickStep){
  const x=at(v);
  if(x<left+5||x>right-5)continue;
  page.drawLine({start:{x,y:y-4},end:{x,y:y+4},color:muted,thickness:.6});
  drawText(page,String(v),x-font.widthOfTextAtSize(String(v),7)/2,y-15,font,7,muted);
 }
 if(!show)return;
 const stroke=(a:number,b:number)=>{
  page.drawLine({start:{x:a,y},end:{x:b,y},color:blue,thickness:3.2});
 };
 const dot=(value:number,closed:boolean)=>{
  page.drawCircle({x:at(value),y,size:4.2,color:closed?blue:rgb(1,1,1),
   borderColor:blue,borderWidth:1.4});
 };
 if(g.kind==='between'){stroke(at(g.lower),at(g.upper));dot(g.lower,g.closedLeft);dot(g.upper,g.closedRight);}
 if(g.kind==='outside'){
  stroke(left+7,at(g.lower));stroke(at(g.upper),right-7);
  dot(g.lower,g.closedLeft);dot(g.upper,g.closedRight);
 }
 if(g.kind==='left'){stroke(left+7,at(g.upper));dot(g.upper,g.closedLeft);}
 if(g.kind==='right'){stroke(at(g.lower),right-7);dot(g.lower,g.closedRight);}
}
function drawCircleDiagram(page:PDFPage,p:CircleAreaProblem,x:number,y:number,font:PDFFont){
 const radius=31,angle=p.kind==='semicircle'?180:p.kind==='quarter-circle'?90:p.kind==='sector'?p.degrees:360;
 page.drawCircle({x,y,size:radius,color:rgb(1,1,1),borderColor:ink,borderWidth:1.1});
 const line=(t:number)=>{
  const a=t*Math.PI/180;
  page.drawLine({start:{x,y},end:{x:x+radius*Math.cos(a),y:y+radius*Math.sin(a)},
   thickness:1.2,color:ink});
 };
 if(p.kind==='diameter'){
  page.drawLine({start:{x:x-radius,y},end:{x:x+radius,y},thickness:1,color:ink});
 }else if(p.kind!=='missing-radius'){
  line(0);
  if(angle!==360)line(angle);
 }
 if(angle!==360){
  // Angles are represented with actual trigonometric vector segments, not a
  // decorative wedge; this works for 30, 45, 60, 72, 90, 120, 135, 150, 180.
  const arc=radius*.48,steps=Math.ceil(angle/8);
  for(let i=0;i<steps;i++){
   const a=angle*i/steps*Math.PI/180,b=angle*(i+1)/steps*Math.PI/180;
   page.drawLine({start:{x:x+arc*Math.cos(a),y:y+arc*Math.sin(a)},
    end:{x:x+arc*Math.cos(b),y:y+arc*Math.sin(b)},color:blue,thickness:1});
  }
  drawText(page,angle+' deg',x-radius+1,y-radius-12,font,7.3,muted);
 }
 drawText(page,p.kind==='diameter'?'d='+p.radius*2:p.kind==='missing-radius'?'r=?':'r='+p.radius,
  x-radius,y+radius+8,font,7.8,muted);
}
export async function createR74PracticePdf(pack:Pack,mode:R74PdfMode,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 if(!pack||!['inequalities-worksheets','area-worksheets'].includes(pack.topic))
  throw Error('Invalid R74 worksheet route');
 if(pack.topic==='inequalities-worksheets')verifyInequalityPracticePack(pack);
 else verifyCircleAreaPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid R74 PDF mode');
 if(!Object.hasOwn(pageSizes,paper))throw Error('Invalid R74 paper size');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid R74 writing room');
 const pdf=await PDFDocument.create(),[width,height]=pageSizes[paper];
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const left=42,right=width-42,perPage=4,rowHeight=145,total=Math.ceil(pack.quantity/perPage);
 const heading=pack.topic==='inequalities-worksheets'?'Inequality Language and Compound Sets':'Circle and Sector Areas';
 for(let offset=0;offset<pack.quantity;offset+=perPage){
  const page=pdf.addPage([width,height]),pageNo=offset/perPage+1;
  drawText(page,heading,left,height-58,bold,17);
  drawText(page,(mode==='questions'?'STUDENT PRACTICE':mode==='answers'?'MATCHING TEACHER ANSWERS':'WORKED SOLUTIONS')+
   '   |   '+pack.mode+'   |   R74.1',left,height-81,bold,9,blue);
  drawText(page,'Seed '+pack.seed+'   |   '+pack.difficulty+'   |   '+pack.quantity+' questions   |   '+paper,
   left,height-103,regular,8.5,muted);
  drawText(page,mode==='questions'?'Name: _____________________________    Date: ______________':
   'Student and teacher files use the same seed, question order, and exact math.',
   left,height-125,regular,8.3,muted);
  for(const [j,p] of pack.problems.slice(offset,offset+perPage).entries()){
   const y=height-169-j*rowHeight,n=offset+j+1;
   const lines=wrap(n+'. '+p.question,bold,10,right-left);
   if(lines.length>2)throw Error('R74 question exceeds the safe two-line row');
   lines.forEach((line,k)=>drawText(page,line,left,y-k*13,bold,10));
   const baseline=y-13*lines.length;
   if(mode==='questions'){
    drawText(page,'Write your answer:',left+15,baseline-15,regular,8.5,muted);
    page.drawLine({start:{x:left+105,y:baseline-18},end:{x:right-10,y:baseline-18},color:grey,thickness:.72});
    if(writingRoom==='extra')
     page.drawLine({start:{x:left+15,y:baseline-39},end:{x:right-10,y:baseline-39},color:grey,thickness:.72});
   }else{
    const a=wrap('Answer: '+p.answer,bold,10,right-left-15);
    if(a.length>2)throw Error('R74 key answer exceeds two lines');
    a.forEach((line,k)=>drawText(page,line,left+15,baseline-14-13*k,bold,10,blue));
    if(mode==='steps'){
     const steps=p.steps.flatMap(s=>wrap(s,regular,8,right-left-130));
     if(steps.length>5)throw Error('R74 worked math steps overflow row '+n);
     steps.forEach((line,k)=>drawText(page,line,left+15,baseline-32-k*11,regular,8,muted));
    }
   }
   if(pack.topic==='inequalities-worksheets'){
    const q=pack.problems[offset+j];
    if(q.kind!=='translate'||mode!=='questions')
     drawGraph(page,q.graph,left+29,right-29,y-113,mode!=='questions',regular);
   }else{
    const circle=pack.problems[offset+j];
    drawCircleDiagram(page,circle,right-56,y-94,regular);
   }
   if(j<3)page.drawLine({start:{x:left,y:y-137},end:{x:right,y:y-137},color:grey,thickness:.4});
  }
  drawText(page,'R74.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+pageNo+'/'+total+'  |  Print Actual size (100%)',
   left,35,regular,7.3,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle(heading+' - '+mode+' - '+pack.mode+' - seed '+pack.seed+' - '+paper+' - R74.1');
 pdf.setSubject('Exact math practice; verified original generated worksheet unchanged');
 return pdf.save();
}
