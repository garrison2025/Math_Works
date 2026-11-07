/** R86 vector coordinate grid at an identical physical x/y unit scale.
 * Blank plotting grids and marked teacher curves share the same seeded math.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
import {verifyGraphPack,GRAPH_GRID_EXTENT,graphToPaper,lineAt,parabolaAt,
 type GraphPack,type GraphProblem} from './r86-function-graphs.ts';
export type GraphEdition='questions'|'answers'|'steps';
const sizes:Record<Paper,readonly [number,number]>={A4:[595.28,841.89],Letter:[612,792]};
const ink=rgb(.11,.17,.26),curve=rgb(.12,.38,.68),reference=rgb(.72,.75,.80),
 fine=rgb(.84,.89,.92),muted=rgb(.38,.44,.52);
const label=(pg:PDFPage,s:string,x:number,y:number,font:PDFFont,size=8,color=ink)=>
 pg.drawText(s,{x,y,size,font,color});
function wrap(s:string,font:PDFFont,sz:number,max:number):string[]{
 const out:string[]=[],words=s.split(/\s+/);let line='';
 for(const word of words){
  const next=line?line+' '+word:word;
  if(font.widthOfTextAtSize(next,sz)<=max){line=next;continue;}
  if(line)out.push(line);
  if(font.widthOfTextAtSize(word,sz)>max)throw Error('Overwide R86 graph PDF statement');
  line=word;
 }if(line)out.push(line);
 return out;
}
function plotCurve(pg:PDFPage,f:(x:number)=>number,
 start:number,step:number,color:ReturnType<typeof rgb>,thickness=1.6){
 let prev:{x:number;y:number}|undefined;
 // One common scale both axes; clipping samples is only for visual plotting.
 for(let i=0;i<=1200;i++){
  const x=-GRAPH_GRID_EXTENT+i*.01,y=f(x),inside=y>=-6&&y<=6;
  const current=inside?graphToPaper(x,y,start,step,step):undefined;
  if(prev&&current)pg.drawLine({start:prev,end:current,color,thickness});
  prev=current;
 }
}
function coordinateGrid(pg:PDFPage,p:GraphProblem,left:number,top:number,
 student:boolean,regular:PDFFont,bold:PDFFont){
 const unit=13.75,start=left+284,bottom=top-240,span=12*unit;
 pg.drawRectangle({x:start,y:bottom,width:span,height:span,
  borderColor:fine,borderWidth:.8});
 for(let i=-6;i<=6;i++){
  const v=(i+6)*unit;
  pg.drawLine({start:{x:start+v,y:bottom},end:{x:start+v,y:bottom+span},
   color:i===0?ink:fine,thickness:i===0?1.3:.4});
  pg.drawLine({start:{x:start,y:bottom+v},end:{x:start+span,y:bottom+v},
   color:i===0?ink:fine,thickness:i===0?1.3:.4});
  if(i%2===0&&i!==0){
   const n=String(i),w=regular.widthOfTextAtSize(n,6.3);
   label(pg,n,start+v-w/2,bottom-11,regular,6.3,muted);
   label(pg,n,start-11-regular.widthOfTextAtSize(n,6.3),
    bottom+v-2,regular,6.3,muted);
  }
 }
 label(pg,'0',start+6*unit-9,bottom+6*unit-10,regular,6.5,muted);
 label(pg,'x',start+span+5,bottom+6*unit-1,bold,8);
 label(pg,'y',start+6*unit+4,bottom+span+5,bold,8);
 if(p.kind==='quadratic-transform'){
  plotCurve(pg,x=>x*x,start,unit,reference,1);
  label(pg,'thin gray: y = x^2',start+12,bottom+span+11,regular,7,muted);
 }
 if(p.kind==='read-graph'||!student){
  if(p.kind==='quadratic-transform')
   plotCurve(pg,x=>parabolaAt(p.a,p.h,p.k,x),start,unit,curve,1.9);
  else plotCurve(pg,x=>lineAt(p.m,p.b,x),start,unit,curve,1.9);
 }
 if(!student){
  for(const point of p.plottedPoints){
   const at=graphToPaper(point.x,point.y,start,bottom,unit);
   pg.drawCircle({x:at.x,y:at.y,size:2.9,color:curve});
  }
  if(p.kind==='quadratic-transform'){
   const vertex=graphToPaper(p.h,p.k,start,bottom,unit);
   pg.drawLine({start:{x:vertex.x,y:bottom},end:{x:vertex.x,y:bottom+span},
    color:curve,thickness:.55,dashArray:[3,3],opacity:.6});
  }
 }
}
export async function createGraphPdf(pack:GraphPack,edition:GraphEdition,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyGraphPack(pack);
 if(!['questions','answers','steps'].includes(edition)||!Object.hasOwn(sizes,paper)||
  !['standard','extra'].includes(writingRoom))throw Error('Invalid graph PDF settings');
 const pdf=await PDFDocument.create(),[width,height]=sizes[paper],left=44,right=width-44;
 const regular=await pdf.embedFont(StandardFonts.Helvetica),
  bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const count=Math.ceil(pack.quantity/2);
 for(let offset=0;offset<pack.quantity;offset+=2){
  const pg=pdf.addPage([width,height]),pageNumber=Math.floor(offset/2)+1;
  label(pg,'Graph Functions & Quadratic Transformations',left,height-53,bold,15);
  label(pg,(edition==='questions'?'STUDENT GRAPH SHEET':edition==='answers'?'TEACHER GRAPH KEY':'WORKED GRAPH EXPLANATIONS')+
   '   |   '+pack.mode+'   |   '+paper,left,height-74,bold,8.7,curve);
  label(pg,'R86.1  |  Seed '+pack.seed+'  |  '+pack.difficulty+
   '  |  '+pack.quantity+' problems  |  Same scale on x and y',
   left,height-93,regular,8,muted);
  label(pg,edition==='questions'?'Name: _____________________________     Date: ___________':
   'Teacher file: same seed, questions, coordinates and accurately scaled graph.',
   left,height-114,regular,8,muted);
  for(const [index,p] of pack.problems.slice(offset,offset+2).entries()){
   const top=height-150-index*300,question=wrap(p.id+'. '+p.question,bold,9.2,245);
   if(question.length>4)throw Error('R86 graph question wraps beyond card');
   question.forEach((line,j)=>label(pg,line,left,top-j*12,bold,9.2));
   if(edition==='questions'){
    label(pg,'Response:',left+10,top-106,regular,8.5,muted);
    pg.drawLine({start:{x:left+70,y:top-109},end:{x:left+240,y:top-109},
     color:reference,thickness:.8});
    if(writingRoom==='extra')for(let i=0;i<2;i++)
     pg.drawLine({start:{x:left+12,y:top-147-i*24},
      end:{x:left+230,y:top-147-i*24},color:fine,thickness:.75});
   }else{
    const rows=wrap('Answer: '+p.answer,bold,8.5,240);
    if(rows.length>3)throw Error('R86 answer wraps beyond key column');
    rows.forEach((line,j)=>label(pg,line,left+10,top-92-j*11,bold,8.5,curve));
   }
   if(edition==='steps'){
    for(const [i,line] of p.steps.entries()){
     const rows=wrap((i+1)+'. '+line,regular,7.5,240);
     if(rows.length>3)throw Error('R86 worked step text overflows');
     rows.forEach((str,j)=>label(pg,str,left+8,top-148-i*34-j*10,
      regular,7.5,i===2?curve:muted));
    }
   }
   coordinateGrid(pg,p,left,top,edition==='questions',regular,bold);
   if(index===0)pg.drawLine({start:{x:left,y:top-278},end:{x:right,y:top-278},
    color:fine,thickness:.6});
  }
  label(pg,'R86 actual vector graph  |  '+edition+'  |  '+paper+
   '  |  Seed '+pack.seed+'  |  '+pageNumber+'/'+count+
   '  |  Print at Actual Size',left,35,regular,7.1,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('R86 '+pack.mode+' '+edition+' '+paper+' seed '+pack.seed);
 pdf.setSubject('Mathematically scaled linear function graphs and quadratic transformations with exact coordinate keys');
 return pdf.save();
}
