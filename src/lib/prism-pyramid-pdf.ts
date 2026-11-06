/** R78 true *unfolded* nets: a right triangular prism, a right square
 * pyramid and a regular tetrahedron. All edges share one dimension scale.
 * No foreshortened perspective drawings masquerade as measured geometry.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifySolidPack,type SolidPack,type SolidProblem} from './prism-pyramid-pack.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type SolidPdfMode='questions'|'answers'|'steps';
const sizes:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.17,.26),soft=rgb(.38,.45,.53),accent=rgb(.12,.37,.63),guide=rgb(.72,.78,.84);
const clean=(s:string)=>s.replaceAll('√3','sqrt(3)').replaceAll('²','^2').replaceAll('³','^3')
 .replaceAll('×',' x ').replaceAll('−','-').replaceAll('π','pi');
function write(page:PDFPage,text:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 page.drawText(clean(text),{x,y,font,size,color});
}
function wrap(s:string,font:PDFFont,size:number,width:number):string[]{
 const words=clean(s).split(/\s+/),lines:string[]=[];let line='';
 for(const word of words){
  const attempt=line?line+' '+word:word;
  if(font.widthOfTextAtSize(attempt,size)<=width){line=attempt;continue;}
  if(line)lines.push(line);
  if(font.widthOfTextAtSize(word,size)>width)throw Error('Long unbreakable solid geometry text');
  line=word;
 }
 if(line)lines.push(line);
 return lines;
}
type Pt={x:number;y:number};
function stroke(page:PDFPage,a:Pt,b:Pt,width=1.05,dim=false){
 page.drawLine({start:a,end:b,thickness:width,color:dim?accent:ink,
  ...(dim?{dashArray:[3,2]}:{})});
}
export function drawTriangularPrismNet(page:PDFPage,p:Pick<SolidProblem,'a'|'b'|'c'|'length'>,right:number,rowY:number,font:PDFFont){
 const {a,b,c,length:L}=p;
 const scale=Math.min(184/(a+b+c),112/(L+2*b),4);
 const x0=right-208,y0=rowY-147;
 const xA=x0+b*scale,xB=xA+a*scale,xC=xB+c*scale;
 const low=y0+b*scale,high=low+L*scale;
 // The three adjacent lateral rectangles have widths b,a,c and
 // common physical prism height L; their total area is (a+b+c)*L.
 for(const x of [x0,xA,xB,xC])stroke(page,{x,y:low},{x,y:high});
 stroke(page,{x:x0,y:low},{x:xC,y:low});
 stroke(page,{x:x0,y:high},{x:xC,y:high});
 // Exactly two congruent right triangular bases of legs a,b.
 // The horizontal a-edge touches the central rectangle.
 for(const [apex,atY] of [[{x:xA,y:high+b*scale},high],
                         [{x:xA,y:low-b*scale},low]] as const){
  stroke(page,{x:xA,y:atY},apex);
  stroke(page,apex,{x:xB,y:atY});
 }
 write(page,'b='+b,x0+2,low+(high-low)/2,font,7.1,soft);
 write(page,'a='+a,xA+2,low+(high-low)/2,font,7.1,soft);
 write(page,'c='+c,xB+2,low+(high-low)/2,font,7.1,soft);
 write(page,'L='+L,right-203,rowY-165,font,7.1,soft);
 write(page,'Two bases + 3 rectangles',right-202,rowY-178,font,6.6,soft);
}
function squareNet(page:PDFPage,p:SolidProblem,right:number,rowY:number,font:PDFFont){
 const {side:s,slant:l}=p;
 const scale=Math.min(172/(s+2*l),111/(s+2*l),5);
 const x0=right-206,y0=rowY-147;
 const xA=x0+l*scale,xB=xA+s*scale;
 const yA=y0+l*scale,yB=yA+s*scale;
 const edges=[
  [{x:xA,y:yA},{x:xB,y:yA}], [{x:xB,y:yA},{x:xB,y:yB}],
  [{x:xB,y:yB},{x:xA,y:yB}], [{x:xA,y:yB},{x:xA,y:yA}]
 ] as const;
 edges.forEach(([u,v])=>stroke(page,u,v));
 const apexes=[
  {x:(xA+xB)/2,y:yA-l*scale},
  {x:xB+l*scale,y:(yA+yB)/2},
  {x:(xA+xB)/2,y:yB+l*scale},
  {x:xA-l*scale,y:(yA+yB)/2}
 ];
 for(let i=0;i<4;i++){
  stroke(page,edges[i][0],apexes[i]);stroke(page,edges[i][1],apexes[i]);
 }
 // Dashed vertical (within top triangle) is perpendicular *face slant*
 // height l, not the apex-to-base-plane vertical altitude.
 stroke(page,{x:(xA+xB)/2,y:yB},apexes[2],.7,true);
 write(page,'s='+s,xA+2,yA+2,font,7.2,soft);
 write(page,'l='+l,xB+3,yB+(l*scale)/2,font,7.2,soft);
 write(page,'1 square + 4 triangles',right-201,rowY-177,font,6.7,soft);
}
function tetraNet(page:PDFPage,p:SolidProblem,right:number,rowY:number,font:PDFFont){
 const side=p.side,h=side*Math.sqrt(3)/2;
 const scale=Math.min(172/(2*side),111/(2*h),5);
 const x0=right-204,y0=rowY-149;
 const pt=(x:number,y:number):Pt=>({x:x0+(x+side/2)*scale,y:y0+(y+h)*scale});
 const A:[number,number]=[0,0],B:[number,number]=[side,0],C:[number,number]=[side/2,h];
 const plus=(u:readonly number[],v:readonly number[],w:readonly number[]):[number,number]=>
  [u[0]+v[0]-w[0],u[1]+v[1]-w[1]];
 const AB=plus(A,B,C),BC=plus(B,C,A),CA=plus(C,A,B);
 for(const [u,v] of [[A,B],[B,C],[C,A],[A,AB],[B,AB],[B,BC],[C,BC],[C,CA],[A,CA]] as const)
  stroke(page,pt(...u),pt(...v));
 write(page,'s='+side,x0+2,rowY-176,font,7.3,soft);
 write(page,'4 equal-sided faces',right-202,rowY-165,font,6.7,soft);
}
export async function createSolidPdf(pack:SolidPack,mode:SolidPdfMode,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifySolidPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid solid PDF mode');
 if(!Object.hasOwn(sizes,paper))throw Error('Invalid solid paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid solid writing room');
 const [width,height]=sizes[paper],pdf=await PDFDocument.create();
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const left=42,right=width-42,textWidth=right-left-216;
 const pages=Math.ceil(pack.quantity/3);
 for(let offset=0;offset<pack.quantity;offset+=3){
  const page=pdf.addPage([width,height]),pageIndex=1+offset/3;
  write(page,'Triangular Prisms and Pyramid Nets',left,height-57,bold,16);
  write(page,(mode==='questions'?'STUDENT PRACTICE':mode==='answers'?'TEACHER ANSWER KEY':'WORKED SOLUTIONS')+
   '  |  '+pack.mode+'  |  R78.1',left,height-79,bold,8.5,accent);
  write(page,'Seed '+pack.seed+'   |   '+pack.difficulty+'   |   '+pack.quantity+' problems   |   '+paper,
   left,height-103,font,8.2,soft);
  write(page,mode==='questions'?'Name: _________________________    Date: ______________':
   'All diagram lengths are proportional; match the original student seed and task.',
   left,height-123,font,8.2,soft);
  for(const [j,p] of pack.problems.slice(offset,offset+3).entries()){
   const rowY=height-168-j*185,index=offset+j+1;
   const questions=wrap(index+'. '+p.question,bold,8.8,textWidth);
   if(questions.length>6)throw Error('Solid problem prompt exceeds printable text region '+index);
   questions.forEach((line,k)=>write(page,line,left,rowY-12*k,bold,8.8));
   const base=rowY-12*questions.length;
   if(mode==='questions'){
    write(page,'Answer:',left+8,base-16,font,8.0,soft);
    page.drawLine({start:{x:left+57,y:base-19},end:{x:left+textWidth-5,y:base-19},
     color:guide,thickness:.75});
    if(writingRoom==='extra')
     page.drawLine({start:{x:left+8,y:base-42},end:{x:left+textWidth-5,y:base-42},
      color:guide,thickness:.7});
   }else{
    const answers=wrap('Answer: '+p.answer,bold,9.2,textWidth-12);
    if(answers.length>3)throw Error('Solid solution answer overflows row '+index);
    answers.forEach((line,k)=>write(page,line,left+8,base-16-12*k,bold,9.2,accent));
    if(mode==='steps'){
     const instructions=p.steps.flatMap(step=>wrap(step,font,7.5,textWidth-13));
     if(instructions.length>9)throw Error('Solid steps too long for one row '+index);
     instructions.forEach((line,k)=>write(page,line,left+8,
      base-28-12*answers.length-10.5*k,font,7.5,soft));
    }
   }
   if(p.kind.startsWith('triangular-prism'))drawTriangularPrismNet(page,p,right,rowY,font);
   else if(p.kind==='square-pyramid-surface')squareNet(page,p,right,rowY,font);
   else tetraNet(page,p,right,rowY,font);
   if(j<2)page.drawLine({start:{x:left,y:rowY-181},end:{x:right,y:rowY-181},
    color:guide,thickness:.35});
  }
  write(page,'R78.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+pageIndex+'/'+pages+'  |  Print 100% Actual size',left,42,font,7.1,soft);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('Exact prism and pyramid nets - '+mode+' - '+pack.mode+' - seed '+pack.seed+' - '+paper+' - R78.1');
 pdf.setSubject('Actual proportional triangle prism, square pyramid, regular tetrahedron vector nets and exact separate student/teacher answers');
 return pdf.save();
}
