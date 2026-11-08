/** R98 original word-story PDF editions, rendered locally with pdf-lib. */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {verifyStorySet,type StorySet} from './word-problems.ts';
export type StoryPdfEdition='questions'|'answers'|'steps';
export type StoryPaper='Letter'|'A4';
const sizes:Record<StoryPaper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.11,.17,.24),muted=rgb(.36,.42,.5),blue=rgb(.10,.37,.61);
const fontSize=11,lineHeight=16,margin=46;
function wrap(text:string,font:PDFFont,size:number,maxWidth:number):string[]{
 const lines:string[]=[];let line='';
 for(const word of text.trim().split(/\s+/)){
  if(font.widthOfTextAtSize(word,size)>maxWidth)throw Error('Story PDF token exceeds text width');
  const next=line?line+' '+word:word;
  if(font.widthOfTextAtSize(next,size)>maxWidth&&line){lines.push(line);line=word;}else line=next;
 }
 if(line)lines.push(line);
 return lines;
}
function drawBlock(page:PDFPage,font:PDFFont,text:string,x:number,y:number,maxWidth:number,size=fontSize,color=ink):number{
 for(const line of wrap(text,font,size,maxWidth)){
  page.drawText(line,{x,y,size,font,color});y-=lineHeight;
 }
 return y;
}
export async function createStoryPdf(set:StorySet,edition:StoryPdfEdition,paper:StoryPaper):Promise<Uint8Array>{
 verifyStorySet(set);
 if(!['questions','answers','steps'].includes(edition)||!Object.hasOwn(sizes,paper))throw Error('Invalid story PDF format');
 const doc=await PDFDocument.create();
 const regular=await doc.embedFont(StandardFonts.Helvetica);
 const bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const [w,h]=sizes[paper],maxWidth=w-2*margin;
 let page:PDFPage|undefined,y=0;
 const pages:PDFPage[]=[];
 const identity=`WP1-${set.seed}-${set.mode}-${set.level}-${set.questions.length}`;
 const startPage=()=>{
  page=doc.addPage([w,h]);pages.push(page);y=h-52;
  page.drawText('MATH WORKS  /  WORD PROBLEMS',{x:margin,y,size:11.5,font:bold,color:blue});y-=22;
  page.drawText(`${edition==='questions'?'Student worksheet':edition==='answers'?'Teacher answer key':'Worked solutions'}  |  ${set.level}  |  ${paper}`,{x:margin,y,size:9,font:regular,color:muted});y-=16;
  page.drawText(`Reproducible set: ${identity}`,{x:margin,y,size:8.3,font:regular,color:muted});y-=17;
  if(edition==='questions'){
   page.drawText('Name: _______________________   Date: ___________________',{x:margin,y,size:10,font:regular,color:ink});y-=19;
  }
  page.drawLine({start:{x:margin,y},end:{x:w-margin,y},thickness:.8,color:rgb(.80,.84,.88)});y-=25;
 };
 startPage();
 for(const p of set.questions){
  const questionLines=wrap(p.question,regular,fontSize,maxWidth-25);
  const answerRows=edition==='questions'?0:wrap('Answer: '+p.answer,bold,10.5,maxWidth-25).length;
  const stepRows=edition==='steps'?p.steps.reduce((sum,s)=>sum+wrap(s,regular,10,maxWidth-25).length,0):0;
  // Compute the actual Y advance for each block, including the paragraph gaps
  // and a safety buffer. Especially on worked-step pages, never rely on
  // (lineHeight-1) estimates that could overlap the PDF footer.
  const bodyAdvance=questionLines.length*lineHeight+6+
   (edition==='questions'?2*20+17:edition==='answers'?answerRows*lineHeight+19:
    stepRows*lineHeight+p.steps.length*4+answerRows*lineHeight+16);
  const needed=bodyAdvance+12;
  if(needed>h-180)throw Error('A word problem cannot fit on one PDF page');
  if(y-needed<64)startPage();
  page!.drawText(p.id+'.',{x:margin,y,size:11,font:bold,color:blue});
  y=drawBlock(page!,regular,p.question,margin+25,y,maxWidth-25)-6;
  if(edition==='questions'){
   for(let n=0;n<2;n++){
    y-=20;
    page!.drawLine({start:{x:margin+25,y},end:{x:w-margin-3,y},thickness:.65,color:rgb(.76,.82,.88)});
   }
   y-=17;
  }else if(edition==='answers'){
   y=drawBlock(page!,bold,'Answer: '+p.answer,margin+25,y,maxWidth-25,10.5)-19;
  }else{
   for(const s of p.steps){
    y=drawBlock(page!,regular,s,margin+25,y,maxWidth-25,10)-4;
   }
   y=drawBlock(page!,bold,'Answer: '+p.answer,margin+25,y,maxWidth-25,10.5)-16;
  }
 }
 pages.forEach((p,i)=>{
  const foot=`Page ${i+1} of ${pages.length}   |   ${identity}   |   ${edition}`;
  p.drawText(foot,{x:margin,y:29,size:8,font:regular,color:muted});
 });
 doc.setTitle(`Math Works word problems | ${edition} | ${identity}`);
 doc.setSubject('Original, exact, seeded word problems. Matching student, teacher and solution editions.');
 doc.setCreator('Math Worksheet Studio');
 doc.setProducer('Math Worksheet Studio | pdf-lib');
 return doc.save({useObjectStreams:false});
}
