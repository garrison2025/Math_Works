/** R84.1 authentic vector arrays and uniformly scaled jump diagrams.
 * Student files contain blank answer space; teacher answers and steps are
 * separate PDFs with the same seed, values and drawings.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {verifyMultiplicationModelPack,type MultiplicationModelPack,type MultiplicationModelProblem} from './multiplication-models.ts';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
export type MultiplicationModelPdfMode='questions'|'answers'|'steps';
const sizes:Record<Paper,readonly [number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.12,.18,.26),blue=rgb(.12,.36,.63),muted=rgb(.37,.44,.53),pale=rgb(.75,.81,.86);
const draw=(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size:number,color=ink)=>
 page.drawText(s,{x,y,size,font,color});
function wrap(s:string,font:PDFFont,size:number,max:number){
 const result:string[]=[],words=s.split(/\s+/);let line='';
 for(const w of words){
  const next=line?line+' '+w:w;
  if(font.widthOfTextAtSize(next,size)<=max){line=next;continue;}
  if(line)result.push(line);
  if(font.widthOfTextAtSize(w,size)>max)throw Error('R84 printable token overflows width');
  line=w;
 }
 if(line)result.push(line);
 return result;
}
function dotArray(page:PDFPage,p:MultiplicationModelProblem,left:number,top:number){
 const x=left+302,topY=top-70,gap=10.5,r=2.65;
 for(let row=0;row<p.groups;row++)for(let col=0;col<p.size;col++)
  page.drawCircle({x:x+col*gap,y:topY-row*gap,size:r,color:ink});
 draw(page,p.groups+' rows  /  '+p.size+' in each row',left+274,top-207,
  fonts.regular,8,muted);
}
// The diagram uses one common linear x-scale: every jump has the same
// physical width, proportional to its identical numerical size.
function numberLine(page:PDFPage,p:MultiplicationModelProblem,
 left:number,right:number,top:number,teacher:boolean){
 const y=top-127,x0=left+31,x1=right-21,width=x1-x0;
 const delta=width/p.groups;
 page.drawLine({start:{x:x0-9,y},end:{x:x1+8,y},color:ink,thickness:1.1});
 page.drawLine({start:{x:x1+8,y},end:{x:x1+1,y:y+3.4},color:ink,thickness:1.1});
 page.drawLine({start:{x:x1+8,y},end:{x:x1+1,y:y-3.4},color:ink,thickness:1.1});
 for(let hop=0;hop<=p.groups;hop++){
  const x=x0+hop*delta;
  page.drawLine({start:{x,y:y-5},end:{x,y:y+5},color:ink,thickness:.85});
  if(hop===0||hop===p.groups||teacher){
   const label=hop===0?'0':teacher?String(hop*p.size):hop===p.groups?'?':'';
   if(label){const w=fonts.regular.widthOfTextAtSize(label,8);
    draw(page,label,x-w/2,y-18,fonts.regular,8,hop===p.groups&&teacher?blue:ink);}
  }
  if(hop===p.groups)break;
  const end=x+delta;
  const h=12;
  for(let j=0;j<8;j++){
   const theta1=Math.PI*j/8,theta2=Math.PI*(j+1)/8;
   const xA=x+delta*j/8,xB=x+delta*(j+1)/8;
   page.drawLine({start:{x:xA,y:y+9+h*Math.sin(theta1)},
    end:{x:xB,y:y+9+h*Math.sin(theta2)},color:blue,thickness:1.05});
  }
  page.drawLine({start:{x:end-3,y:y+12},end:{x:end,y:y+9},color:blue,thickness:1});
  page.drawLine({start:{x:end-3,y:y+6},end:{x:end,y:y+9},color:blue,thickness:1});
 }
 draw(page,p.groups+' equal jumps, '+p.size+' units per jump',left+26,top-183,
  fonts.regular,8.3,muted);
}
let fonts:{regular:PDFFont;bold:PDFFont};
export async function createMultiplicationModelPdf(pack:MultiplicationModelPack,
 mode:MultiplicationModelPdfMode,paper:Paper,writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyMultiplicationModelPack(pack);
 if(!['questions','answers','steps'].includes(mode)||!Object.hasOwn(sizes,paper)||
  !['standard','extra'].includes(writingRoom))throw Error('Invalid multiplication model PDF settings');
 const pdf=await PDFDocument.create();
 fonts={regular:await pdf.embedFont(StandardFonts.Helvetica),bold:await pdf.embedFont(StandardFonts.HelveticaBold)};
 const [width,height]=sizes[paper],left=44,right=width-44,total=Math.ceil(pack.quantity/2);
 for(let start=0;start<pack.quantity;start+=2){
  const page=pdf.addPage([width,height]),pageNumber=Math.floor(start/2)+1;
  draw(page,'Multiplication: Visual Models & Stories',left,height-56,fonts.bold,16);
  draw(page,(mode==='questions'?'STUDENT WORKSHEET':mode==='answers'?'TEACHER ANSWERS':'WORKED STEPS')+
   '   |   '+pack.mode+'   |   '+paper,left,height-80,fonts.bold,9,blue);
  draw(page,'Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+
   ' problems  |  '+pack.version+'  |  Exact whole-number results',
   left,height-100,fonts.regular,8.0,muted);
  draw(page,mode==='questions'?'Name: ______________________________     Date: _____________':
   'The teacher file uses the same seed, practice mode and questions as the student file.',
   left,height-121,fonts.regular,8,muted);
  for(const [i,p] of pack.problems.slice(start,start+2).entries()){
   const top=height-156-i*300,index=start+i+1;
   const question=wrap(index+'. '+p.question,fonts.bold,10,width-2*left-8);
   if(question.length>3)throw Error('R84 problem statement cannot fit on page');
   question.forEach((line,j)=>draw(page,line,left,top-14*j,fonts.bold,10));
   if(mode==='questions'){
    draw(page,'Answer:',left+10,top-55,fonts.regular,9,muted);
    page.drawLine({start:{x:left+64,y:top-58},end:{x:left+240,y:top-58},color:pale,thickness:.85});
   }else{
    draw(page,'Answer: '+p.answer,left+10,top-55,fonts.bold,10,blue);
   }
   if(p.kind==='arrays')dotArray(page,p,left,top);
   else if(p.kind==='number-line')numberLine(page,p,left,right,top,mode!=='questions');
   else if(mode==='questions'){
    for(let row=0;row<(writingRoom==='extra'?4:3);row++)
     page.drawLine({start:{x:left+22,y:top-97-row*26},end:{x:right-12,y:top-97-row*26},
      color:pale,thickness:.8});
   }
   if(mode==='steps'){
    p.steps.forEach((step,j)=>{
     const lines=wrap((j+1)+'. '+step,fonts.regular,8.25,right-left-25);
     if(lines.length>2)throw Error('R84 step overflows row');
     lines.forEach((line,k)=>draw(page,line,left+12,top-223-j*15-k*10,
      fonts.regular,8.25,j===1?blue:muted));
    });
   }else if(mode==='questions'&&p.kind!=='stories'&&writingRoom==='extra'){
    page.drawLine({start:{x:left+16,y:top-240},end:{x:right-14,y:top-240},
     color:pale,thickness:.8});
   }
   if(i===0)page.drawLine({start:{x:left,y:top-270},end:{x:right,y:top-270},
    color:pale,thickness:.5});
  }
  draw(page,pack.version+'  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+pageNumber+'/'+total+'  |  Print at Actual Size (100%)',
   left,36,fonts.regular,7.3,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('R84 visual multiplication '+pack.mode+' - '+mode+' - '+paper+' - seed '+pack.seed);
 pdf.setSubject('Exact whole number arrays, uniformly scaled number-line jumps and contextual multiplication stories');
 return pdf.save();
}
