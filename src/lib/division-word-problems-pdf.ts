/** R73 actual print-ready division word problem practice.
 * Distinct student, teacher and worked-step PDFs; answers carry story units.
 */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {verifyDivisionStoryPack,type DivisionStoryPack} from './division-word-problems.ts';
import type {Paper} from './pdf.ts';
export type DivisionStoryPdfMode='questions'|'answers'|'steps';
const sizeByPaper:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.11,.17,.26),accent=rgb(.12,.37,.61),muted=rgb(.38,.45,.54),rule=rgb(.70,.77,.85);
function text(page:PDFPage,value:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 page.drawText(value,{x,y,font,size,color});
}
function wrap(value:string,font:PDFFont,size:number,maxWidth:number):string[]{
 const result:string[]=[],words=value.split(/\s+/);let line='';
 for(const word of words){
  const test=line?line+' '+word:word;
  if(font.widthOfTextAtSize(test,size)<=maxWidth){line=test;continue}
  if(line)result.push(line);
  if(font.widthOfTextAtSize(word,size)>maxWidth)throw Error('Division word problem PDF has an overwide word');
  line=word;
 }
 if(line)result.push(line);
 return result;
}
export async function createDivisionStoryPdf(pack:DivisionStoryPack,mode:DivisionStoryPdfMode,
 paper:Paper,writingRoom:'standard'|'extra'='standard'):Promise<Uint8Array>{
 verifyDivisionStoryPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid division story PDF mode');
 if(!Object.hasOwn(sizeByPaper,paper))throw Error('Invalid division story paper');
 if(!['standard','extra'].includes(writingRoom))throw Error('Invalid division story writing room');
 const pdf=await PDFDocument.create(),[width,height]=sizeByPaper[paper],left=42,right=width-42;
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const perPage=mode==='steps'?4:mode==='questions'&&writingRoom==='extra'?4:5;
 const rowHeight=mode==='steps'?143:mode==='questions'&&writingRoom==='extra'?141:115;
 const pages=Math.ceil(pack.quantity/perPage);
 for(let offset=0;offset<pack.quantity;offset+=perPage){
  const page=pdf.addPage([width,height]),number=Math.floor(offset/perPage)+1;
  text(page,'Division Word Problems',left,height-59,bold,18);
  text(page,(mode==='questions'?'STUDENT PRACTICE':mode==='answers'?'MATCHING ANSWER KEY':'WORKED EXPLANATIONS')+
   '  |  '+pack.mode+'  |  exact whole-number division',left,height-82,bold,8.6,accent);
  text(page,'Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+
   ' problems  |  '+paper+'  |  Context determines what to do with leftovers',
   left,height-105,font,8.1,muted);
  text(page,mode==='questions'?'Name: ________________________________     Date: _____________':
   'Answers use story units; check each quotient and remainder before interpreting the situation.',
   left,height-126,font,8.4,muted);
  for(const [j,item] of pack.problems.slice(offset,offset+perPage).entries()){
   const y=height-162-j*rowHeight,index=offset+j+1;
   const questionLines=wrap(index+'. '+item.question,bold,9.9,right-left);
   if(questionLines.length>3)throw Error('Division story prompt exceeds safe row: '+index);
   questionLines.forEach((s,k)=>text(page,s,left,y-13*k,bold,9.9));
   const base=y-questionLines.length*13;
   if(mode==='questions'){
    text(page,'Equation:',left+17,base-13,font,8.5,muted);
    page.drawLine({start:{x:left+76,y:base-17},end:{x:right-12,y:base-17},color:rule,thickness:.72});
    text(page,'Answer in context:',left+17,base-37,font,8.5,muted);
    page.drawLine({start:{x:left+112,y:base-41},end:{x:right-12,y:base-41},color:rule,thickness:.72});
    if(writingRoom==='extra'){
     page.drawLine({start:{x:left+17,y:base-60},end:{x:right-12,y:base-60},color:rule,thickness:.68});
    }
   }else{
    const answers=wrap('Answer: '+item.answer,bold,9.8,right-left-18);
    if(answers.length>2)throw Error('Story answer overlong: '+index);
    answers.forEach((s,k)=>text(page,s,left+16,base-14-k*13,bold,9.8,accent));
    if(mode==='steps'){
     const explanations=item.steps.flatMap((step,k)=>wrap((k+1)+') '+step,font,8.35,right-left-22));
     if(explanations.length>5)throw Error('Worked division story explanations exceed print row '+index);
     explanations.forEach((s,k)=>text(page,s,left+16,base-43-12*k,font,8.35,muted));
    }
   }
  }
  text(page,'R73.1  |  '+mode+'  |  '+paper+'  |  Seed '+pack.seed+
   '  |  Page '+number+'/'+pages+'  |  Print Actual size (100%)',
   left,35,font,7.3,muted);
 }
 pdf.setCreator('Math Worksheet Studio');
 pdf.setTitle('Division Word Problems - '+pack.mode+' - '+mode+' - seed '+pack.seed+' - '+paper+' - R73.1');
 pdf.setSubject('Exact contextual whole-number quotients and remainders; independent from original v18 division facts');
 return pdf.save();
}
