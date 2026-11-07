/** Full-scope closure: real proportional vector worksheets. No raster
 * placeholders: diagram geometry is calculated from the seeded exact model.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
import {verifyClosurePack,latticeDiagonals,triangularPyramidArea,
 type ClosurePack,type ClosureProblem} from './closure-math.ts';
export type ClosureEdition='questions'|'answers'|'steps';
const sizes:Record<Paper,[number,number]>={A4:[595.28,841.89],Letter:[612,792]};
const ink=rgb(.11,.17,.25),accent=rgb(.12,.38,.66),
 light=rgb(.93,.96,.99),guide=rgb(.69,.75,.83),muted=rgb(.37,.45,.52);
type Pt={x:number;y:number};
function label(page:PDFPage,s:string,x:number,y:number,font:PDFFont,
 size=8,color=ink){page.drawText(s,{x,y,font,size,color});}
function line(page:PDFPage,a:Pt,b:Pt,thickness=1,color=ink){
 page.drawLine({start:a,end:b,thickness,color});
}
function wrap(text:string,font:PDFFont,size:number,width:number){
 const out:string[]=[],words=text.split(/\s+/);let row='';
 for(const word of words){
  const attempt=row?row+' '+word:word;
  if(font.widthOfTextAtSize(attempt,size)<=width){row=attempt;continue;}
  if(row)out.push(row);
  if(font.widthOfTextAtSize(word,size)>width)throw Error('Closure worksheet has overwide PDF token');
  row=word;
 }
 if(row)out.push(row);return out;
}
function drawTriangle(pg:PDFPage,p:ClosureProblem,x:number,y:number,font:PDFFont){
 // a=|BC|, b=|AC|, c=|AB|. Coordinates satisfy all three distances.
 const {a,b,c}=p;
 const ax=0,ay=0,bx=c,by=0,cx=(b*b+c*c-a*a)/(2*c),
  cy=Math.sqrt(Math.max(0,b*b-cx*cx));
 const minX=Math.min(ax,bx,cx),maxX=Math.max(ax,bx,cx);
 const scale=Math.min(156/(maxX-minX),89/cy);
 const left=x+18-minX*scale,bottom=y+34;
 const A={x:left+ax*scale,y:bottom+ay*scale},
 B={x:left+bx*scale,y:bottom+by*scale},C={x:left+cx*scale,y:bottom+cy*scale};
 for(const [u,v] of [[A,B],[B,C],[C,A]])line(pg,u,v,1.3,accent);
 label(pg,'A',A.x-11,A.y-11,font,8);
 label(pg,'B',B.x+4,B.y-11,font,8);
 label(pg,'C',C.x-3,C.y+6,font,8);
 label(pg,'c='+c,(A.x+B.x)/2-12,A.y-13,font,7.1,muted);
 label(pg,'a='+a,(B.x+C.x)/2+5,(B.y+C.y)/2,font,7.1,muted);
 label(pg,'b='+b,(A.x+C.x)/2-25,(A.y+C.y)/2,font,7.1,muted);
 label(pg,'Larger angle = longer opposite side.',x+5,y+10,font,7.3,muted);
}
function drawPolynomial(pg:PDFPage,p:ClosureProblem,x:number,y:number,
 regular:PDFFont,bold:PDFFont,show:boolean){
 const colW=49,left=x+6,top=y+126;
 for(let j=0;j<3;j++){
  const at=left+j*colW;
  pg.drawRectangle({x:at,y:top-78,width:colW,height:79,
   color:j%2===0?light:rgb(1,1,1),borderColor:guide,borderWidth:.6});
 }
 ['x^2','x','1'].forEach((v,i)=>label(pg,v,left+i*colW+15,top-12,bold,9));
 [p.a,p.b,p.c].forEach((v,i)=>label(pg,String(v),left+i*colW+15,top-32,regular,9));
 [p.d,p.e,p.f].forEach((v,i)=>label(pg,String(v),left+i*colW+15,top-50,regular,9));
 const sign=p.kind==='addition'?'+':'-';
 label(pg,sign,left-12,top-50,bold,10,accent);
 const digits=p.kind==='addition'?[p.a+p.d,p.b+p.e,p.c+p.f]:
  [p.a-p.d,p.b-p.e,p.c-p.f];
 digits.forEach((v,i)=>label(pg,show?String(v):'____',left+i*colW+8,top-70,bold,9,show?accent:muted));
 label(pg,'Combine like powers only.',x+8,y+15,regular,7.3,muted);
}
/** Schematic projection: A,B,C visibly IN plane P, D outside.
 * Previously C was 3pt above its plane outline in the actual PDF.
 * Real 3-D coordinates come from the separately verified seeded model.
 */
export function closurePlaneDiagramGeometry(x:number,y:number){
 if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid plane diagram origin');
 const A={x:x+40,y:y+48},B={x:x+148,y:y+48},C={x:x+63,y:y+82},
  D={x:x+40,y:y+126};
 const corners=[{x:x+8,y:y+25},{x:x+162,y:y+25},
  {x:x+183,y:y+102},{x:x+35,y:y+102}];
 return {A,B,C,D,corners};
}
function drawPlane(pg:PDFPage,p:ClosureProblem,x:number,y:number,
 font:PDFFont,show:boolean){
 // Perspective projection is explicitly labelled schematic; z=0 is exact,
 // no invented metric lengths or angles in this picture.
 const {A,B,C,D,corners}=closurePlaneDiagramGeometry(x,y);
 // PDF-native line operators use PDF coordinates directly.
 // drawSvgPath flips Y in pdf-lib; it must never be used here.
 for(let i=0;i<corners.length;i++)
  line(pg,corners[i],corners[(i+1)%corners.length],.85,guide);
 for(const [u,v] of [[A,B],[A,C],[A,D]]){
  line(pg,u,v,1.25,u===A&&v===D?accent:ink);
 }
 for(const [name,pt] of [['A',A],['B',B],['C',C],['D',D]] as const){
  pg.drawCircle({x:pt.x,y:pt.y,size:2.5,color:name==='D'?accent:ink});
  label(pg,name,pt.x+5,pt.y+4,font,8.5);
 }
 label(pg,'Plane P: z=0',x+65,y+18,font,8.2,muted);
 label(pg,show?'A, B, C in P; D above':'3-D schematic (not to scale)',x+5,y+6,font,7.2,muted);
}
function drawLattice(pg:PDFPage,p:ClosureProblem,x:number,y:number,
 regular:PDFFont,bold:PDFFont,show:boolean){
 const l=latticeDiagonals(p.a,p.b),cell=52,gridX=x+30,gridY=y+28;
 for(let row=0;row<2;row++)for(let col=0;col<2;col++){
  const px=gridX+col*cell,py=gridY+(1-row)*cell;
  pg.drawRectangle({x:px,y:py,width:cell,height:cell,borderColor:ink,borderWidth:.8});
  line(pg,{x:px,y:py},{x:px+cell,y:py+cell},.8,guide);
  if(show){
   const prod=l.products[row*2+col];
   label(pg,String(Math.floor(prod/10)),px+11,py+cell-14,bold,9,accent);
   label(pg,String(prod%10),px+cell-16,py+11,bold,9,accent);
  }
 }
 [l.at,l.ao].forEach((v,i)=>label(pg,String(v),gridX+24+i*cell,gridY+2*cell+9,bold,11));
 [l.bt,l.bo].forEach((v,i)=>label(pg,String(v),gridX-15,gridY+2*cell-29-i*cell,bold,11));
 label(pg,'2 digits x 2 digits',x+23,y+15,regular,7.5,muted);
 if(show)label(pg,'Product '+l.combined,x+20,y+3,bold,8,accent);
}
function drawPyramid(pg:PDFPage,p:ClosureProblem,x:number,y:number,
 regular:PDFFont,bold:PDFFont){
 // Orthogonal base O=(0,0), A=(a,0), B=(0,b); apex at (0,0,h) in
 // 3D. Three flaps are exact 2D congruent copies of the lateral faces.
 const {a,b,h}=p,c=Math.hypot(a,b),slant=Math.hypot(h,a*b/c);
 const O={x:0,y:0},A={x:a,y:0},B={x:0,y:b};
 const U={x:0,y:-h},V={x:-h,y:0};
 const foot={x:a*b*b/(c*c),y:a*a*b/(c*c)};
 const W={x:foot.x+(b/c)*slant,y:foot.y+(a/c)*slant};
 const vertices=[O,A,B,U,V,W],minX=Math.min(...vertices.map(q=>q.x)),
  maxX=Math.max(...vertices.map(q=>q.x)),
  minY=Math.min(...vertices.map(q=>q.y)),maxY=Math.max(...vertices.map(q=>q.y));
 const scale=Math.min(160/(maxX-minX),117/(maxY-minY));
 const trans=(q:Pt)=>({x:x+15+(q.x-minX)*scale,y:y+28+(q.y-minY)*scale});
 const o=trans(O),aa=trans(A),bb=trans(B),u=trans(U),v=trans(V),w=trans(W);
 // Draw the real three sides of the base via PDF-native coordinates,
 // so all four unfolded faces are physically on the same page.
 for(const [p1,p2] of [[o,aa],[aa,bb],[bb,o]] as [Pt,Pt][])
  line(pg,p1,p2,1.1,accent);
 for(const [q,r] of [[o,u],[aa,u],[o,v],[bb,v],[aa,w],[bb,w]] as [Pt,Pt][])
  line(pg,q,r,1.05,ink);
 label(pg,'a='+a,(o.x+aa.x)/2-8,o.y+5,regular,7.3);
 label(pg,'b='+b,o.x-18,(o.y+bb.y)/2,regular,7.3);
 label(pg,'h='+h,u.x+3,(u.y+o.y)/2,regular,7.3);
 label(pg,'TRUE 4-face unfolded net',x+5,y+12,bold,7.1,muted);
}
function drawing(pg:PDFPage,p:ClosureProblem,x:number,y:number,
 regular:PDFFont,bold:PDFFont,show:boolean){
 if(p.topic==='angle-worksheets')drawTriangle(pg,p,x,y,regular);
 else if(p.topic==='mixed-addition-subtraction-worksheets')
  drawPolynomial(pg,p,x,y,regular,bold,show);
 else if(p.topic==='lines-rays-segments-worksheets')
  drawPlane(pg,p,x,y,regular,show);
 else if(p.topic==='multiplication-worksheets')
  drawLattice(pg,p,x,y,regular,bold,show);
 else drawPyramid(pg,p,x,y,regular,bold);
}
const titles:Record<ClosurePack['topic'],string>={
 'angle-worksheets':'Triangle Sides and Opposite Angles',
 'mixed-addition-subtraction-worksheets':'Polynomial Addition and Subtraction',
 'lines-rays-segments-worksheets':'Points, Lines and Planes',
 'multiplication-worksheets':'Diagonal Lattice Multiplication',
 'surface-area-worksheets':'General Right Triangular Pyramid Surface Area'
};
export async function createClosurePdf(pack:ClosurePack,edition:ClosureEdition,
 paper:Paper,writingRoom:WritingRoom='standard'){
 verifyClosurePack(pack);
 if(!['questions','answers','steps'].includes(edition)||!Object.hasOwn(sizes,paper)||
  !['standard','extra'].includes(writingRoom))
  throw Error('Invalid closure PDF settings');
 const doc=await PDFDocument.create(),[width,height]=sizes[paper],left=43,right=width-43;
 const regular=await doc.embedFont(StandardFonts.Helvetica),
  bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const pages=Math.ceil(pack.quantity/2);
 for(let offset=0;offset<pack.quantity;offset+=2){
  const pg=doc.addPage([width,height]),pageNo=Math.floor(offset/2)+1;
  label(pg,titles[pack.topic],left,height-54,bold,14.5);
  label(pg,(edition==='questions'?'STUDENT PRACTICE':edition==='answers'?'TEACHER ANSWER KEY':'WORKED EXPLANATIONS')
   +'  |  '+pack.mode+'  |  '+paper,left,height-75,bold,8.3,accent);
  label(pg,'Seed '+pack.seed+' | '+pack.quantity+' exercises | '+pack.difficulty+
   ' | Exact seeded model | Print 100%',left,height-94,regular,7.8,muted);
  label(pg,edition==='questions'?'Name: ________________________   Date: _______________':
   'Independent teacher edition uses identical tasks and diagrams.',
   left,height-115,regular,8,muted);
  for(const [i,p] of pack.problems.slice(offset,offset+2).entries()){
   const top=height-151-i*300;
   const question=wrap(p.id+'. '+p.question,bold,9,268);
   if(question.length>5)throw Error('Closure PDF text overflows question region');
   question.forEach((row,j)=>label(pg,row,left,top-j*12,bold,9));
   if(edition!=='questions'){
    const answer=wrap('Answer: '+p.answer,bold,8.4,267);
    if(answer.length>3)throw Error('Closure teacher answer exceeds left gutter');
    answer.forEach((row,j)=>label(pg,row,left+6,top-89-j*10,bold,8.4,accent));
   }else{
    label(pg,'Answer: _____________________________',left+6,top-104,regular,8.6,muted);
    if(writingRoom==='extra')
     line(pg,{x:left+5,y:top-134},{x:left+250,y:top-134},.65,guide);
   }
   if(edition==='steps'){
    for(const [stepIndex,text] of p.steps.entries()){
     const rows=wrap((stepIndex+1)+'. '+text,regular,7.3,264);
     if(rows.length>4)throw Error('Closure explanation exceeds writing region');
     rows.forEach((row,j)=>label(pg,row,left+7,top-157-stepIndex*31-j*8,
      regular,7.3,stepIndex===2?accent:muted));
    }
   }
   drawing(pg,p,width-230,top-233,regular,bold,edition!=='questions');
   if(i===0)line(pg,{x:left,y:top-274},{x:right,y:top-274},.6,guide);
  }
  label(pg,'Math Worksheet Studio | '+edition+' | '+paper+' | Seed '+pack.seed+
   ' | '+pageNo+'/'+pages,left,42,regular,7.4,muted);
 }
 doc.setCreator('Math Worksheet Studio');
 doc.setTitle('Closure '+pack.topic+' '+pack.mode+' '+edition+' '+paper+' seed '+pack.seed);
 doc.setSubject('Original mathematical diagrams, matching student/teacher answers and exact reasoning');
 return doc.save();
}
