/** R100 PDFs: actual A4/Letter student/answer/steps, vector angles around point. */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {verifyFocusPack,pointAngles,type FocusPack,type FocusProblem} from './focus-drills.ts';
export type FocusPaper='A4'|'Letter';
export type FocusEdition='questions'|'answers'|'steps';
const sizes:Record<FocusPaper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.12,.19,.28),muted=rgb(.35,.42,.49),blue=rgb(.09,.36,.60);
const margin=46,line=15;
function safeText(s:string){return s.replaceAll('°',' degrees').replaceAll('×','x');}
function wrap(s:string,font:PDFFont,size:number,width:number):string[]{
 const items=safeText(s).trim().split(/\s+/),out:string[]=[];let current='';
 for(const word of items){
  if(font.widthOfTextAtSize(word,size)>width)throw Error('Long PDF word overflows writing area');
  const next=current?current+' '+word:word;
  if(current&&font.widthOfTextAtSize(next,size)>width){out.push(current);current=word}else current=next;
 }
 if(current)out.push(current);return out;
}
function drawLines(page:PDFPage,font:PDFFont,rows:string[],x:number,y:number,size:number,color=ink){
 for(const s of rows){page.drawText(s,{x,y,size,font,color});y-=line}
 return y;
}
export function drawPointAngles(page:PDFPage,p:FocusProblem,cx:number,cy:number,font:PDFFont){
 const {angles,hidden}=pointAngles(p),radius=66,arc=30;
 const point=(deg:number,length:number)=>({
  x:cx+Math.cos(deg*Math.PI/180)*length,y:cy+Math.sin(deg*Math.PI/180)*length
 });
 let start=90;
 for(let i=0;i<4;i++){
  const end=point(start,radius);
  page.drawLine({start:{x:cx,y:cy},end,thickness:1.2,color:blue});
  // Arc is true angular geometry, made from vector segments (not a bitmap mockup).
  for(let n=0;n<9;n++){
   const first=point(start-angles[i]*n/9,arc),second=point(start-angles[i]*(n+1)/9,arc);
   page.drawLine({start:first,end:second,thickness:.75,color:rgb(.55,.66,.76)});
  }
  const mid=point(start-angles[i]/2,47);
  page.drawText('ABCD'[i]+' '+(i===hidden?'x':angles[i]+' deg'),{
   x:mid.x-19,y:mid.y-3,size:7.3,font,color:ink
  });
  start-=angles[i];
 }
 page.drawCircle({x:cx,y:cy,size:2,color:blue});
 page.drawText('O',{x:cx+5,y:cy-11,size:8,font,color:ink});
}
export async function createFocusPdf(pack:FocusPack,edition:FocusEdition,paper:FocusPaper):Promise<Uint8Array>{
 verifyFocusPack(pack);
 if(!['questions','answers','steps'].includes(edition)||!Object.hasOwn(sizes,paper))throw Error('Invalid focus PDF mode or paper');
 const doc=await PDFDocument.create(),normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const [w,h]=sizes[paper],textWidth=w-2*margin-24,identity='FD1-'+pack.seed+'-'+pack.mode+'-'+pack.level+'-'+pack.problems.length;
 let page:PDFPage,y=0;const pages:PDFPage[]=[];
 const newPage=()=>{
  page=doc.addPage([w,h]);pages.push(page);y=h-53;
  page.drawText('MATH WORKS  /  '+(pack.mode==='point-angles'?'ANGLES AROUND A POINT':'ALGEBRA FOCUS DRILLS'),{
   x:margin,y,size:10.7,font:bold,color:blue});y-=21;
  page.drawText((edition==='questions'?'Student worksheet':edition==='answers'?'Teacher answers':'Worked solutions')+' | '+pack.level+' | '+paper,{x:margin,y,size:9,font:normal,color:muted});y-=17;
  page.drawText('Seed and exact task: '+identity,{x:margin,y,size:8,font:normal,color:muted});y-=18;
  if(edition==='questions'){
   page.drawText('Name: __________________________   Date: ___________________',{x:margin,y,size:9.5,font:normal,color:ink});y-=20;
  }
  page.drawLine({start:{x:margin,y},end:{x:w-margin,y},thickness:.8,color:rgb(.78,.84,.89)});y-=24;
 };
 newPage();
 for(const p of pack.problems){
  const q=wrap(p.question,normal,10.6,textWidth),
   ans=wrap('Answer: '+p.answer,bold,10.2,textWidth),
   steps=edition==='steps'?p.steps.map(s=>wrap(s,normal,9.4,textWidth)):[];
  const diagram=p.kind==='point-angles'?137:0;
  const needed=q.length*line+7+diagram+
   (edition==='questions'?44:edition==='answers'?ans.length*line+16:
    steps.reduce((sum,s)=>sum+s.length*line+3,0)+ans.length*line+16)+14;
  if(needed>h-190)throw Error('Drill too large for printable page');
  if(y-needed<68)newPage();
  page!.drawText(p.id+'.',{x:margin,y,font:bold,size:10.6,color:blue});
  y=drawLines(page!,normal,q,margin+24,y,10.6)-7;
  if(diagram){
   drawPointAngles(page!,p,margin+95,y-70,normal);
   y-=137;
  }
  if(edition==='questions'){
   for(let i=0;i<2;i++){y-=17;page!.drawLine({start:{x:margin+24,y},end:{x:w-margin-5,y},thickness:.65,color:rgb(.77,.83,.88)});}
   y-=10;
  }else if(edition==='answers'){
   y=drawLines(page!,bold,ans,margin+24,y,10.2)-16;
  }else{
   for(const row of steps)y=drawLines(page!,normal,row,margin+24,y,9.4)-3;
   y=drawLines(page!,bold,ans,margin+24,y,10.2)-16;
  }
 }
 pages.forEach((p,i)=>p.drawText('Page '+(i+1)+' of '+pages.length+'   |   '+identity+'   |   '+edition,{
  x:margin,y:42,size:8,font:normal,color:muted}));
 doc.setTitle('Math Works focus drills | '+edition+' | '+identity);
 doc.setSubject('Seeded original algebra and four-sector point-angle math worksheets; answers isolated');
 doc.setCreator('Math Worksheet Studio');doc.setProducer('Math Worksheet Studio | pdf-lib');
 return doc.save({useObjectStreams:false});
}
