/** R80 true dimension-proportional unfolded nets, including a connected net
 * for an L-shaped composite made from two joined rectangular prisms.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyR80Pack,type R80Pack,type R80Problem} from './r80-area-nets-pack.ts';
import {drawRectangularPrismNet} from './mixed-prism-cylinder-pdf.ts';
import {drawTriangularPrismNet,drawSquarePyramidNet,drawTetrahedronNet} from './prism-pyramid-pdf.ts';
import {drawCylinderNet} from './cylinder-pdf.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type R80PdfMode='questions'|'answers'|'steps';
const sizes:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.17,.27),soft=rgb(.38,.44,.52),accent=rgb(.12,.39,.65),rules=rgb(.72,.78,.84);
const display=(s:string)=>s.replaceAll('√3','sqrt(3)').replaceAll('π','pi')
 .replaceAll('²','^2').replaceAll('³','^3').replaceAll('×',' x ').replaceAll('−','-');
const write=(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size:number,color=ink)=>
 page.drawText(display(s),{x,y,font,size,color});
function wrap(s:string,font:PDFFont,size:number,max:number):string[]{
 const words=display(s).split(/\s+/),out:string[]=[];let current='';
 for(const word of words){
  const next=current?current+' '+word:word;
  if(font.widthOfTextAtSize(next,size)<=max){current=next;continue}
  if(current)out.push(current);
  if(font.widthOfTextAtSize(word,size)>max)throw Error('R80 printable token too long');
  current=word;
 }
 if(current)out.push(current);
 return out;
}
type XY=readonly [number,number];
/** Six edges of a true 2-D L-section; two such sections and six side
 * rectangles make a connected unfolded 8-face net. */
export function compositeCrossSection(p:Pick<R80Problem,
 'baseLength'|'stepLength'|'lowHeight'|'upperHeight'|'orientation'>):XY[]{
 const {baseLength:L,stepLength:T,lowHeight:H,upperHeight:J,orientation:o}=p;
 if(!(L>T&&T>=2&&H>=2&&J>=2)||!['left','right'].includes(o))
  throw Error('Not a valid 2-block composite cross-section');
 return o==='left'?[[0,0],[L,0],[L,H],[T,H],[T,H+J],[0,H+J]]:
 [[0,0],[L,0],[L,H+J],[L-T,H+J],[L-T,H],[0,H]];
}
export function drawCompositeLNet(page:PDFPage,p:R80Problem,right:number,rowY:number,font:PDFFont):void{
 if(p.kind!=='joined-L-prisms'||p.skill!=='composite')throw Error('Not an L prism');
 const poly=compositeCrossSection(p),{baseLength:L,lowHeight:H,upperHeight:J,depth:D}=p;
 const edges=poly.map((pt,i)=>Math.hypot(poly[(i+1)%6][0]-pt[0],poly[(i+1)%6][1]-pt[1]));
 const perimeter=edges.reduce((a,b)=>a+b,0);
 if(Math.abs(perimeter-2*(L+H+J))>1e-8)throw Error('Invalid L shape perimeter');
 const s=Math.min(180/perimeter,108/(D+2*(H+J)),4.1);
 const x0=right-208,y0=rowY-148,low=y0+(H+J)*s,high=low+D*s;
 const xx=[x0];for(const e of edges)xx.push(xx.at(-1)!+e*s);
 const line=(a:XY,b:XY)=>page.drawLine({start:{x:a[0],y:a[1]},
  end:{x:b[0],y:b[1]},color:ink,thickness:1.06});
 for(const x of xx)line([x,low],[x,high]);
 line([xx[0],low],[xx[6],low]);line([xx[0],high],[xx[6],high]);
 for(const [anchor,sign] of [[high,1],[low,-1]] as const)
  for(let i=1;i<6;i++){
   const a=poly[i],b=poly[(i+1)%6];
   line([x0+a[0]*s,anchor+sign*a[1]*s],
        [x0+b[0]*s,anchor+sign*b[1]*s]);
  }
 write(page,'B='+L+' T='+p.stepLength+' D='+D+' H1='+H+' H2='+J,
  x0,rowY-166,font,7.0,soft);
 write(page,'2 L-faces + 6 rectangles',x0,rowY-177,font,6.6,soft);
}
function drawNet(page:PDFPage,p:R80Problem,right:number,rowY:number,font:PDFFont){
 switch(p.kind){
  case 'rectangular-prism':return drawRectangularPrismNet(page,p,right,rowY,font);
  case 'triangular-prism':return drawTriangularPrismNet(page,p,right,rowY,font);
  case 'cylinder':return drawCylinderNet(page,p,right,rowY,font);
  case 'square-pyramid':return drawSquarePyramidNet(page,p,right,rowY,font);
  case 'regular-tetrahedron':return drawTetrahedronNet(page,p,right,rowY,font);
  case 'joined-L-prisms':return drawCompositeLNet(page,p,right,rowY,font);
  default:throw Error('R80 missing real net');
 }
}
export async function createR80Pdf(pack:R80Pack,mode:R80PdfMode,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyR80Pack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid R80 PDF mode');
 if(!Object.hasOwn(sizes,paper))throw Error('Invalid R80 paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid R80 writing room');
 const [w,h]=sizes[paper],pdf=await PDFDocument.create();
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const left=42,right=w-42,textWidth=right-left-218,pages=Math.ceil(pack.quantity/3);
 for(let offset=0;offset<pack.quantity;offset+=3){
  const page=pdf.addPage([w,h]),index=1+offset/3;
  write(page,pack.skill==='nets'?'Find Surface Area from Real Nets':'Composite L-Shaped Solid Surface Area',
   left,h-57,bold,pack.skill==='nets'?15.5:15);
  write(page,(mode==='questions'?'STUDENT QUESTIONS':mode==='answers'?'MATCHING ANSWER KEY':'WORKED SOLUTIONS')+
   '  |  '+pack.skill+'  |  '+pack.mode+'  |  R80.1',left,h-80,bold,8.2,accent);
  write(page,'Seed '+pack.seed+'   |   '+pack.difficulty+'   |   '+pack.quantity+
   ' questions   |   '+paper,left,h-104,regular,8.2,soft);
  write(page,mode==='questions'?'Name: __________________________    Date: ______________':
   'True proportional net faces with matching original-seed teacher answers.',
   left,h-125,regular,8.0,soft);
  for(const [i,p] of pack.problems.slice(offset,offset+3).entries()){
   const rowY=h-168-i*185;
   const question=wrap((offset+i+1)+'. '+p.question,bold,8.4,textWidth);
   if(question.length>7)throw Error('R80 question overflows print row '+p.id);
   question.forEach((line,j)=>write(page,line,left,rowY-11.6*j,bold,8.4));
   const baseline=rowY-11.6*question.length;
   if(mode==='questions'){
    write(page,'Answer:',left+8,baseline-16,regular,8.0,soft);
    page.drawLine({start:{x:left+57,y:baseline-19},end:{x:left+textWidth-4,y:baseline-19},
     thickness:.7,color:rules});
    if(writingRoom==='extra')page.drawLine({start:{x:left+8,y:baseline-43},
     end:{x:left+textWidth-4,y:baseline-43},thickness:.7,color:rules});
   }else{
    const answers=wrap('Answer: '+p.answer,bold,9,textWidth-12);
    if(answers.length>3)throw Error('R80 answer overflows print row '+p.id);
    answers.forEach((line,j)=>write(page,line,left+8,baseline-15-12*j,bold,9,accent));
    if(mode==='steps'){
     const instructions=p.steps.flatMap(step=>wrap(step,regular,7.4,textWidth-14));
     if(instructions.length>9)throw Error('R80 long worked steps '+p.id);
     instructions.forEach((line,j)=>
      write(page,line,left+8,baseline-28-12*answers.length-10.3*j,regular,7.4,soft));
    }
   }
   drawNet(page,p,right,rowY,regular);
   if(i<2)page.drawLine({start:{x:left,y:rowY-180},
    end:{x:right,y:rowY-180},thickness:.36,color:rules});
  }
  write(page,'R80.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+index+'/'+pages+'  |  Print at 100% Actual Size',left,42,regular,7,soft);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('R80 real surface area nets - '+pack.skill+' - '+pack.mode+' - '+mode+
  ' - seed '+pack.seed+' - '+paper);
 pdf.setSubject('True dimension-proportional solid-face nets, joined two-block L-prisms and checkable total area');
 return pdf.save();
}
