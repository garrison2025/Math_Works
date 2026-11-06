/** R71 true vector worksheet PDFs for mixed multiplication/division facts,
 * inverse fact families, and labelled split-rectangle area multiplication.
 */
import {PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import {verifyMultDivisionPack,type MultDivisionPack,type MultDivisionQuestion} from './multiplication-division-practice.ts';
import type {Paper} from './pdf.ts';
export type MultDivisionPdfMode='questions'|'answers'|'steps';
const sizes:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.10,.17,.25),accent=rgb(.10,.34,.62),muted=rgb(.36,.45,.55),rule=rgb(.70,.79,.86);
function text(page:PDFPage,value:string,x:number,y:number,font:PDFFont,size:number,color=ink){
 page.drawText(value,{x,y,font,size,color});
}
function areaGrid(page:PDFPage,q:MultDivisionQuestion,x:number,y:number,font:PDFFont,
 showAnswer:boolean){
 if(!q.area)throw Error('Area diagram missing');
 const rows=q.area.rows,cols=q.area.columns;
 const width=186,height=54,cellWidth=width/cols.length,cellHeight=height/rows.length;
 page.drawRectangle({x,y,width,height,borderColor:ink,borderWidth:1.3});
 for(let j=1;j<cols.length;j++)page.drawLine({
  start:{x:x+j*cellWidth,y},end:{x:x+j*cellWidth,y:y+height},color:ink,thickness:1});
 for(let i=1;i<rows.length;i++)page.drawLine({
  start:{x,y:y+i*cellHeight},end:{x:x+width,y:y+i*cellHeight},color:ink,thickness:1});
 for(const [c,value] of cols.entries()){
  const label=String(value);
  text(page,label,x+(c+.5)*cellWidth-font.widthOfTextAtSize(label,8)/2,y+height+8,font,8);
 }
 for(const [r,value] of rows.entries()){
  const middle=y+height-(r+.5)*cellHeight;
  text(page,String(value),x-30,middle-2,font,8);
  if(!showAnswer)continue;
  for(const [c,product] of q.area.cells[r].entries()){
   const result=String(product);
   text(page,result,x+(c+.5)*cellWidth-font.widthOfTextAtSize(result,9)/2,middle-3,font,9,accent);
  }
 }
}
function wrap(value:string,font:PDFFont,size:number,max:number){
 const rows:string[]=[],words=value.split(/\s+/);let line='';
 for(const word of words){
  const candidate=line?line+' '+word:word;
  if(font.widthOfTextAtSize(candidate,size)<=max){line=candidate;continue}
  if(line)rows.push(line);
  if(font.widthOfTextAtSize(word,size)>max)throw Error('R71 PDF text exceeds safe width');
  line=word;
 }
 if(line)rows.push(line);
 return rows;
}
export async function createMultDivisionPdf(pack:MultDivisionPack,mode:MultDivisionPdfMode,
 paper:Paper):Promise<Uint8Array>{
 verifyMultDivisionPack(pack);
 if(!['questions','answers','steps'].includes(mode))throw Error('Invalid multiplication/division PDF mode');
 if(!Object.hasOwn(sizes,paper))throw Error('Invalid A4/Letter paper size');
 const pdf=await PDFDocument.create(),[width,height]=sizes[paper],margin=43;
 const font=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const perPage=pack.mode==='mixed-facts'?8:5;
 const rowHeight=pack.mode==='mixed-facts'?69:112;
 const total=Math.ceil(pack.quantity/perPage);
 for(let start=0;start<pack.questions.length;start+=perPage){
  const page=pdf.addPage([width,height]),pageIndex=Math.floor(start/perPage)+1;
  text(page,'Multiplication & Division Practice',margin,height-58,bold,17);
  text(page,(mode==='questions'?'STUDENT WORKSHEET':mode==='answers'?'TEACHER ANSWERS':'WORKED STEPS')+
   '  |  '+pack.mode+'  |  '+pack.areaFactors,margin,height-81,bold,9,accent);
  text(page,'Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+
   ' problems  |  '+paper+'  |  exact whole-number answers',
   margin,height-101,font,8.5,muted);
  text(page,mode==='questions'?'Name: _______________________________     Date: ______________':
   'Use the matching seed, task and factor-size settings from the student PDF.',
   margin,height-124,font,8.6,muted);
  for(const [j,q] of pack.questions.slice(start,start+perPage).entries()){
   const y=height-159-j*rowHeight,index=start+j+1;
   const questionLines=wrap(index+'. '+q.question,bold,9.8,width-margin*2);
   questionLines.forEach((line,i)=>text(page,line,margin,y-i*12,bold,9.8));
   if(pack.mode==='mixed-facts'){
    if(mode==='questions'){
     page.drawLine({start:{x:margin+22,y:y-36},end:{x:width-margin-18,y:y-36},
      color:rule,thickness:.75});
    }else{
     text(page,'Answer: '+q.answer,margin+18,y-23,bold,10,accent);
     if(mode==='steps')q.steps.forEach((line,k)=>{
      text(page,line,margin+18,y-37-k*12,font,8.4,muted);
     });
    }
   }else if(pack.mode==='fact-family'){
    if(mode==='questions'){
     for(let k=0;k<4;k++){
      page.drawLine({start:{x:margin+24,y:y-26-k*18},
       end:{x:width-margin-20,y:y-26-k*18},color:rule,thickness:.8});
     }
    }else{
     q.facts.forEach((fact,k)=>text(page,(k+1)+') '+fact,margin+20,y-24-k*18,font,9.8,k===0?accent:ink));
     if(mode==='steps'){
      // Print the inverse-operation teacher note separately from the four
      // identities; use the reserved right-hand section, not over the facts.
      text(page,'Inverse check:',margin+250,y-24,bold,8.2,accent);
      text(page,q.a+' × '+q.b+' = '+q.product,margin+250,y-40,font,8.2,muted);
      text(page,q.product+' ÷ '+q.a+' = '+q.b,margin+250,y-54,font,8.2,muted);
     }
    }
   }else{
    const diagramX=margin+183,diagramY=y-85;
    areaGrid(page,q,diagramX,diagramY,font,mode!=='questions');
    if(mode==='questions'){
     text(page,'Total area / product: __________',margin+22,y-84,font,8.8,muted);
    }else{
     text(page,'Answer: '+q.answer,margin+22,y-84,bold,9.8,accent);
     if(mode==='steps'){
      const partials=q.area!.cells.flat();
      text(page,'Add the partial areas:',margin+22,y-42,bold,8.2,muted);
      const expression=partials.join(' + ');
      text(page,expression,margin+22,y-56,font,8.2,muted);
      text(page,'= '+q.answer,margin+22,y-70,font,8.2,accent);
     }
    }
   }
  }
  if(pack.mode==='area-model')
   text(page,'Partition diagram is schematic (not to scale). Numbers indicate exact partial products.',
    margin,58,font,7.8,muted);
  text(page,'R71.1  |  '+mode+'  |  Seed '+pack.seed+'  |  '+paper+
   '  |  Page '+pageIndex+'/'+total+'  |  Print at 100%',
   margin,35,font,7.2,muted);
 }
 pdf.setTitle('Multiplication and Division '+pack.mode+' - '+mode+' - '+paper+' - seed '+pack.seed+' - R71.1');
 pdf.setSubject('Real vector fact-family and area-model multiplication practice; independent of original integer generator v18');
 pdf.setCreator('Math Worksheet Studio');
 return pdf.save();
}
