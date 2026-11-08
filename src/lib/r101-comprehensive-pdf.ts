/** R101 genuine student, teacher-key and worked-solution PDFs in A4 / Letter. */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {verifyWidePack,type WidePack,type WideProblem} from './r101-comprehensive.ts';
export type WidePaper='A4'|'Letter';
export type WideEdition='questions'|'answers'|'steps';
const sizes:Record<WidePaper,[number,number]>={A4:[595.28,841.89],Letter:[612,792]};
const ink=rgb(.12,.2,.3),blue=rgb(.08,.33,.55),muted=rgb(.36,.44,.51),edge=rgb(.75,.83,.89);
const margin=45,rowHeight=15;
const safe=(s:string)=>s.replaceAll('π','pi ').replaceAll('×','x').replaceAll('÷','/').replaceAll('°',' degrees').replaceAll('³','^3').replaceAll('²','^2').replaceAll('−','-').replaceAll('–','-');
function wrap(s:string,font:PDFFont,size:number,width:number):string[]{
 const words=safe(s).trim().split(/\s+/),lines:string[]=[];let row='';
 for(const word of words){
  if(font.widthOfTextAtSize(word,size)>width)throw Error('PDF word too long');
  const candidate=row?row+' '+word:word;
  if(row&&font.widthOfTextAtSize(candidate,size)>width){lines.push(row);row=word;}else row=candidate;
 }
 if(row)lines.push(row);return lines;
}
function linesAt(page:PDFPage,font:PDFFont,rows:string[],x:number,y:number,size:number,col=ink):number{
 for(const txt of rows){page.drawText(txt,{x,y,font,size,color:col});y-=rowHeight;}
 return y;
}
function line(page:PDFPage,x:number,y:number,a:number,b:number){
 page.drawLine({start:{x,y},end:{x:a,y:b},thickness:1.2,color:blue});
}
function polygon(page:PDFPage,n:number,cx:number,cy:number,r:number){
 const pts=Array.from({length:n},(_,i)=>({
  x:cx+Math.cos(Math.PI/2+2*Math.PI*i/n)*r,
  y:cy+Math.sin(Math.PI/2+2*Math.PI*i/n)*r
 }));
 for(let i=0;i<n;i++)line(page,pts[i].x,pts[i].y,pts[(i+1)%n].x,pts[(i+1)%n].y);
}
function triangle(page:PDFPage,x:number,y:number,scale:number){
 const points=[[x,y],[x+55*scale,y],[x+34*scale,y+53*scale]];
 for(let j=0;j<3;j++)line(page,points[j][0],points[j][1],points[(j+1)%3][0],points[(j+1)%3][1]);
}
export function wideDiagramHeight(p:WideProblem):number{
 return ['polygon-sides','g2-shape','real-shape','triangle-congruence','triangle-similarity','tri-angle','tri-area'].includes(p.kind)||p.kind.startsWith('circle-')?105:0;
}
/** Purpose-drawn vector, not extracted raster or a false-to-scale proof diagram. */
export function drawWideDiagram(page:PDFPage,p:WideProblem,x:number,y:number,font:PDFFont){
 const k=p.kind,z=p.values,center=x+105,mid=y-50;
 if(k==='polygon-sides'){
  polygon(page,z.a,center,mid,36);
  page.drawText(z.a+'-sided polygon',{x:x+160,y:y-91,size:8,font,color:muted});
  return;
 }
 if(k==='g2-shape'||k==='real-shape'){
  if(z.v===0||z.v===3){page.drawCircle({x:center,y:mid,size:33,borderColor:blue,borderWidth:1.4});if(z.v===0){line(page,center,mid,center+17,mid+12);line(page,center,mid,center-8,mid+18);}}
  if(z.v===1){page.drawRectangle({x:center-47,y:mid-30,width:94,height:61,borderColor:blue,borderWidth:1.4});line(page,center,mid-30,center,mid+31);line(page,center-47,mid,center+47,mid);}
  if(z.v===2)polygon(page,8,center,mid,37);
  if(z.v===4){page.drawRectangle({x:center-27,y:mid-28,width:54,height:55,borderColor:blue,borderWidth:1.4});page.drawEllipse({x:center,y:mid+27,xScale:27,yScale:10,borderColor:blue,borderWidth:1.4});page.drawEllipse({x:center,y:mid-28,xScale:27,yScale:9,borderColor:blue,borderWidth:1});}
  if(z.v===5){page.drawRectangle({x:center-27,y:mid-27,width:54,height:54,borderColor:blue,borderWidth:1.4});line(page,center-27,mid+27,center-12,mid+43);line(page,center+27,mid+27,center+42,mid+43);line(page,center-12,mid+43,center+42,mid+43);}
  page.drawText('Original everyday-object outline (schematic)',{x,y:y-95,size:7.5,font,color:muted});
  return;
 }
 if(k.startsWith('circle-')){
  page.drawCircle({x:center,y:mid,size:36,borderColor:blue,borderWidth:1.4});
  line(page,center,mid,center+36,mid);page.drawText('r',{x:center+12,y:mid+5,size:10,font,color:ink});
  return;
 }
 if(k.startsWith('tri-')||k==='triangle-congruence'||k==='triangle-similarity'){
  triangle(page,x+10,y-85,1);
  page.drawText('A',{x:x+40,y:y-24,size:9,font,color:ink});
  page.drawText('B',{x:x+3,y:y-94,size:9,font,color:ink});
  page.drawText('C',{x:x+68,y:y-94,size:9,font,color:ink});
  if(k==='triangle-congruence'||k==='triangle-similarity'){
   triangle(page,x+147,y-85,1.15);
   page.drawText('D',{x:x+181,y:y-18,size:9,font,color:ink});
   page.drawText('E',{x:x+140,y:y-94,size:9,font,color:ink});
   page.drawText('F',{x:x+219,y:y-94,size:9,font,color:ink});
  }
  page.drawText('Schematic only: not to scale; use the written measurements.',{x,y:y-99,size:7.1,font,color:muted});
 }
}
export async function createWidePdf(pack:WidePack,edition:WideEdition,paper:WidePaper):Promise<Uint8Array>{
 verifyWidePack(pack);
 if(!['questions','answers','steps'].includes(edition)||!Object.hasOwn(sizes,paper))throw Error('Invalid edition or paper');
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),
 [w,h]=sizes[paper],width=w-2*margin-26,identity='WM1-'+pack.seed+'-'+pack.mode+'-'+pack.level+'-'+pack.problems.length;
 let page:PDFPage,y=0;const pages:PDFPage[]=[];
 const createPage=()=>{
  page=pdf.addPage([w,h]);pages.push(page);y=h-50;
  page.drawText('MATH WORKS / SUPPLEMENTAL MATH PRACTICE',{x:margin,y,size:10.5,font:bold,color:blue});y-=21;
  page.drawText((edition==='questions'?'Student questions':edition==='answers'?'Answer key':'Worked solutions')+' | '+pack.mode+' | '+paper,{x:margin,y,size:9,font,color:muted});y-=17;
  page.drawText('Reproducible question set: '+identity,{x:margin,y,size:8,font,color:muted});y-=19;
  if(edition==='questions'){page.drawText('Name: _______________________  Date: ______________',{x:margin,y,size:9,font,color:ink});y-=22;}
  page.drawLine({start:{x:margin,y},end:{x:w-margin,y},thickness:.8,color:edge});y-=23;
 };
 createPage();
 for(const problem of pack.problems){
  const q=wrap(problem.question,font,10.3,width),
   ans=wrap('Answer: '+problem.answer,bold,10,width),
   steps=edition==='steps'?problem.steps.map(s=>wrap(s,font,9.2,width)):[];
  const diagram=wideDiagramHeight(problem);
  const details=edition==='questions'?47:edition==='answers'?ans.length*rowHeight+13:
   steps.reduce((n,s)=>n+s.length*rowHeight+3,0)+ans.length*rowHeight+13;
  const needed=q.length*rowHeight+9+diagram+details+15;
  if(needed>h-180)throw Error('One math problem cannot fit the selected paper');
  if(y-needed<62)createPage();
  page.drawText(problem.id+'.',{x:margin,y,size:10.3,font:bold,color:blue});
  y=linesAt(page,font,q,margin+25,y,10.3)-9;
  if(diagram){drawWideDiagram(page,problem,margin+28,y,font);y-=diagram;}
  if(edition==='questions'){
   for(let k=0;k<2;k++){y-=17;page.drawLine({start:{x:margin+25,y},end:{x:w-margin-5,y},thickness:.6,color:edge});}
   y-=13;
  }else if(edition==='answers')y=linesAt(page,bold,ans,margin+25,y,10)-13;
  else{
   for(const s of steps)y=linesAt(page,font,s,margin+25,y,9.2)-3;
   y=linesAt(page,bold,ans,margin+25,y,10)-13;
  }
 }
 pages.forEach((pg,i)=>pg.drawText('Page '+(i+1)+' / '+pages.length+' | '+identity+' | '+edition,{x:margin,y:40,size:7.8,font,color:muted}));
 pdf.setTitle('Math Works WM1 '+edition+' '+identity);
 pdf.setSubject('Original reproducible math exercises; student and teacher documents are isolated');
 pdf.setCreator('Math Worksheet Studio');
 return pdf.save({useObjectStreams:false});
}
