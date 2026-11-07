/** R85 print-ready vector visual packs. Student, answer and steps
 * editions share a verified deterministic manifest. No raster placeholders.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import type {Paper} from './pdf.ts';
import type {WritingRoom} from './writing-room.ts';
import {verifyR85Pack,R85_VERSION,type R85Pack,type R85Problem,type R85Topic} from './r85-targeted-packs.ts';
export type R85Edition='questions'|'answers'|'steps';
const sizes:Record<Paper,readonly [number,number]>={A4:[595.28,841.89],Letter:[612,792]};
const dark=rgb(.11,.17,.26),accent=rgb(.11,.36,.63),muted=rgb(.38,.45,.53),
 grid=rgb(.68,.75,.82),shade=rgb(.75,.87,.96),light=rgb(.95,.98,1);
const title:Record<R85Topic,string>={
 fractions:'Fraction Pictures, Conversions & Division Stories',
 'addition-pictures':'Picture Addition: Count and Add',
 'place-value':'Place Value Through Millions',
 'division-equations':'Division Stories: Write the Equation'
};
const label=(page:PDFPage,s:string,x:number,y:number,font:PDFFont,size=9,color=dark)=>
 page.drawText(s,{x,y,font,size,color});
function wrap(s:string,font:PDFFont,sz:number,max:number){
 const words=s.split(/\s+/),out:string[]=[];let row='';
 for(const w of words){
  const next=row?row+' '+w:w;
  if(font.widthOfTextAtSize(next,sz)<=max){row=next;continue;}
  if(row)out.push(row);
  if(font.widthOfTextAtSize(w,sz)>max)throw Error('R85 PDF has overwide text');
  row=w;
 }
 if(row)out.push(row);
 return out;
}
function pictureBar(page:PDFPage,p:R85Problem,left:number,top:number,font:PDFFont){
 const x=left+24,y=top-151,width=420,step=width/p.a;
 for(let i=0;i<p.a;i++)page.drawRectangle({x:x+i*step,y,width:step,height:34,
  color:i<p.b?shade:light,borderColor:dark,borderWidth:.85});
 label(page,'Each part is 1/'+p.a+' of the same whole.',x,top-166,font,8,muted);
}
function pictureAdd(page:PDFPage,p:R85Problem,left:number,top:number,regular:PDFFont,bold:PDFFont){
 for(let side=0;side<2;side++){
  const n=side===0?p.a:p.b,x=left+(side===0?42:285),start=top-102;
  for(let i=0;i<n;i++){
   const xx=x+(i%5)*17,yy=start-Math.floor(i/5)*16;
   if(p.c===1)page.drawRectangle({x:xx-4,y:yy-4,width:8,height:8,color:accent});
   else page.drawCircle({x:xx,y:yy,size:4.25,
     color:p.c===0?accent:light,borderColor:accent,borderWidth:1.1});
  }
 }
 label(page,'Group A',left+44,top-161,regular,8,muted);
 label(page,'+',left+230,top-131,bold,16,accent);
 label(page,'Group B',left+289,top-161,regular,8,muted);
}
const headers=[
 ['Millions'],['Hundred','thousands'],['Ten','thousands'],['Thousands'],
 ['Hundreds'],['Tens'],['Ones']
];
function chart(page:PDFPage,p:R85Problem,left:number,top:number,font:PDFFont,bold:PDFFont,
 showDigits:boolean){
 const x=left+7,w=496/7,y=top-164,h=85;
 for(let i=0;i<7;i++){
  page.drawRectangle({x:x+i*w,y,width:w,height:h,color:i%2?light:rgb(1,1,1),
   borderColor:grid,borderWidth:.7});
  const words=headers[i];
  words.forEach((word,j)=>{
   const size=7,width=bold.widthOfTextAtSize(word,size);
   label(page,word,x+i*w+(w-width)/2,y+61-j*10,bold,size,muted);
  });
  if(showDigits){
   const digit=String(p.a)[i],sz=15,dw=bold.widthOfTextAtSize(digit,sz);
   label(page,digit,x+i*w+(w-dw)/2,y+18,bold,sz,
    p.mode==='find-digit'&&i===p.b?accent:dark);
  }else{
   page.drawLine({start:{x:x+i*w+17,y:y+18},end:{x:x+(i+1)*w-17,y:y+18},
    color:grid,thickness:1});
  }
 }
}

function drawDiagram(page:PDFPage,p:R85Problem,left:number,top:number,edition:R85Edition,regular:PDFFont,bold:PDFFont){
 if(p.topic==='fractions'&&p.mode==='pictures')pictureBar(page,p,left,top,regular);
 if(p.topic==='addition-pictures')pictureAdd(page,p,left,top,regular,bold);
 if(p.topic==='place-value')chart(page,p,left,top,regular,bold,edition!=='questions');
}
export async function createR85Pdf(pack:R85Pack,edition:R85Edition,paper:Paper,
 writingRoom:WritingRoom='standard'):Promise<Uint8Array>{
 verifyR85Pack(pack);
 if(!['questions','answers','steps'].includes(edition)||!Object.hasOwn(sizes,paper)||
  !['standard','extra'].includes(writingRoom))throw Error('Invalid R85 export options');
 const doc=await PDFDocument.create(),[width,height]=sizes[paper],left=43,right=width-43;
 const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);

 const total=Math.ceil(pack.quantity/2);
 for(let offset=0;offset<pack.quantity;offset+=2){
  const page=doc.addPage([width,height]),pageNumber=Math.floor(offset/2)+1;
  label(page,title[pack.topic],left,height-54,bold,15);
  label(page,(edition==='questions'?'STUDENT WORKSHEET':edition==='answers'?'TEACHER ANSWERS':'WORKED EXPLANATIONS')+
   '  |  '+pack.mode+'  |  '+paper,left,height-76,bold,8.8,accent);
  label(page,'Seed '+pack.seed+'  |  '+pack.difficulty+'  |  '+pack.quantity+
   ' tasks  |  '+R85_VERSION+'  |  Print Actual Size',left,height-96,regular,8,muted);
  label(page,edition==='questions'?'Name: __________________________  Date: __________':
   'Teacher edition: same exact task, seed and drawing as the student PDF.',
   left,height-117,regular,8,muted);
  for(const [j,p] of pack.problems.slice(offset,offset+2).entries()){
   const top=height-153-j*301;
   const question=wrap(p.id+'. '+p.prompt,bold,9.5,right-left-7);
   if(question.length>4)throw Error('R85 question needs more than four printed lines');
   question.forEach((s,k)=>label(page,s,left,top-k*12,bold,9.5));
   if(edition==='questions'){
    label(page,'Answer:',left+11,top-74,regular,8,muted);
    page.drawLine({start:{x:left+66,y:top-77},end:{x:left+220,y:top-77},
     color:grid,thickness:.7});
   }else{
    const answer=wrap('Answer: '+p.answer,bold,9,right-left-10);
    if(answer.length>2)throw Error('R85 teacher answer too long for printable box');
    answer.forEach((s,k)=>label(page,s,left+11,top-73-k*11,bold,9,accent));
   }
   drawDiagram(page,p,left,top,edition,regular,bold);
   if(edition==='questions'){
    if(p.topic==='division-equations'){
     label(page,'Equation: __________ / __________ = __________',left+15,top-164,regular,9,muted);
     label(page,'Final answer and units: _________________________________',
      left+15,top-194,regular,9,muted);
    }else if(p.topic==='fractions'&&p.mode!=='pictures'){
     label(page,'Show the calculation: ________________________________',
      left+15,top-168,regular,9,muted);
    }
    if(writingRoom==='extra'&&p.topic!=='place-value')page.drawLine({
     start:{x:left+18,y:top-222},end:{x:right-12,y:top-222},color:grid,thickness:.6});
   }else if(edition==='steps'){
    p.steps.forEach((step,k)=>{
     const rows=wrap((k+1)+'. '+step,regular,8.15,right-left-27);
     if(rows.length>2)throw Error('R85 explanation overflows step line');
     rows.forEach((txt,n)=>label(page,txt,left+12,top-214-k*22-n*9,
      regular,8.15,k===1?accent:muted));
    });
   }
   if(j===0)page.drawLine({start:{x:left,y:top-277},end:{x:right,y:top-277},
    thickness:.55,color:grid});
  }
  label(page,'R85  |  '+pack.topic+'  |  '+edition+'  |  Seed '+pack.seed+
   '  |  '+paper+'  |  '+pageNumber+'/'+total,left,35,regular,7.6,muted);
 }
 doc.setCreator('Math Worksheet Studio');
 doc.setTitle('R85 '+pack.topic+' '+pack.mode+' '+edition+' '+paper+' seed '+pack.seed);
 doc.setSubject('Exact vector picture addition, fraction models, division equations and place-value charts');
 return doc.save();
}
const R85_VERSION_STRING='R85.1';
