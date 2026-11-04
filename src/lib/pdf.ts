/** Browser-side vector PDF export: no screenshots, server, external API, or student records. */
import {PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont} from 'pdf-lib';
import type {Worksheet, Problem, Diagram} from './math';
import {graphGeometry,scatterGeometry} from './graph.ts';
import {hasVerifiedSteps} from './capabilities.ts';
export type PdfMode = 'questions'|'answers'|'steps';
export type Paper = 'Letter'|'A4';
const PAGE_SIZE:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.09,.14,.22),sub=rgb(.35,.43,.52),accent=rgb(.105,.39,.65);
function ascii(text:string){return text.replace(/−/g,'-').replace(/×/g,'x').replace(/÷/g,'/').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/²/g,'^2').replace(/³/g,'^3').replace(/°/g,' deg').replace(/½/g,'1/2').replace(/●/g,'*').replace(/–|—/g,'-').replace(/[^\x20-\x7e]/g,'');}
function wrap(text:string,maxChars:number){const words=ascii(text).split(/\s+/),lines:string[]=[];let line='';for(const word of words){if((line+' '+word).length>maxChars&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines.length?lines:[''];}
function plotDiagram(page:PDFPage,d:Diagram,x:number,y:number,w:number,h:number,font:PDFFont){
 const stroke={color:accent,thickness:1.1};const l=(a:number,b:number,c:number,e:number)=>page.drawLine({start:{x:x+a*w,y:y+b*h},end:{x:x+c*w,y:y+e*h},...stroke});
 const dot=(xx:number,yy:number)=>page.drawCircle({x:x+xx*w,y:y+yy*h,size:3,color:accent});
 if(d.kind==='protractor'){
  // PDF points are physical: 50mm = 141.7323pt. The calibration bar is independent of page scaling.
  const cx=x+w/2,cy=y+15,r=Math.min(w*.37,h*.76);l(.08,.14,.92,.14);
  for(let a=0;a<=180;a++){const rad=a*Math.PI/180,ri=r*(a%10===0?.84:.93);page.drawLine({start:{x:cx+ri*Math.cos(rad),y:cy+r*.0+ri*Math.sin(rad)},end:{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)},color:ink,thickness:a%10===0?.85:.35});}
  page.drawCircle({x:cx,y:cy,size:2,borderColor:ink,borderWidth:.6});const len=50*72/25.4, sx=x+10,sy=y+3;
  page.drawLine({start:{x:sx,y:sy},end:{x:sx+len,y:sy},color:ink,thickness:.8});
  page.drawLine({start:{x:sx,y:sy-3},end:{x:sx,y:sy+3},color:ink,thickness:.8});
  page.drawLine({start:{x:sx+len,y:sy-3},end:{x:sx+len,y:sy+3},color:ink,thickness:.8});return;
 }
 if(d.kind==='triangle'){l(.15,.12,.85,.12);l(.15,.12,.5,.88);l(.5,.88,.85,.12);l(.5,.88,.5,.12);return;}
 if(d.kind==='right-triangle'){const [a,b]=d.values,s=Math.min(w*.57/a,h*.67/b),dx=a*s/w,dy=b*s/h;const x0=.16,y0=.14;l(x0,y0,x0+dx,y0);l(x0,y0,x0,y0+dy);l(x0+dx,y0,x0,y0+dy);l(x0+.03,y0,x0+.03,y0+.06);l(x0+.03,y0+.06,x0,y0+.06);page.drawText(String(a),{x:x+(x0+dx/2)*w-4,y:y+2,size:8,font,color:ink});page.drawText(String(b),{x:x+(x0-.10)*w,y:y+(y0+dy/2)*h,size:8,font,color:ink});return;}
 if(d.kind==='triangle-angles'){l(.15,.12,.85,.12);l(.15,.12,.5,.88);l(.5,.88,.85,.12);page.drawText(`${d.values[0]} deg`,{x:x+w*.22,y:y+h*.22,size:8,font,color:ink});page.drawText(`${d.values[1]} deg`,{x:x+w*.66,y:y+h*.22,size:8,font,color:ink});page.drawText('?',{x:x+w*.44,y:y+h*.70,size:8,font,color:ink});return;}
 if(d.kind==='rectangle'){page.drawRectangle({x:x+w*.2,y:y+h*.2,width:w*.6,height:h*.65,borderColor:accent,borderWidth:1.5});return;}
 if(d.kind==='parallelogram'){l(.12,.15,.74,.15);l(.74,.15,.89,.88);l(.89,.88,.28,.88);l(.28,.88,.12,.15);return;}
 if(d.kind==='trapezoid'){l(.1,.15,.9,.15);l(.9,.15,.7,.85);l(.7,.85,.3,.85);l(.3,.85,.1,.15);return;}
 if(d.kind==='prism'){page.drawRectangle({x:x+w*.13,y:y+h*.12,width:w*.6,height:h*.65,borderColor:accent,borderWidth:1.4});l(.13,.77,.32,.94);l(.32,.94,.91,.94);l(.91,.94,.73,.77);l(.91,.94,.91,.28);l(.91,.28,.73,.12);return;}
 if(d.kind==='numberline'||d.kind==='box'){
  l(.1,.5,.9,.5);
  if(d.kind==='numberline'){
   const n=d.values[0],op=d.labels?.[0],step=Math.max(1,Math.ceil(Math.abs(n)/5)),extent=step*5,px=(z:number)=>.5+(z/extent)*.4;
   for(let i=-5;i<=5;i++){const xx=px(i*step);l(xx,.47,xx,.53);page.drawText(String(i*step),{x:x+xx*w-8,y:y+.65*h,size:7,font,color:ink});}
   // Leave blank for the student. Neither the endpoint nor direction is disclosed.
   void op; void px;
  }else{
   const vals=d.values,lo=Math.min(...vals),hi=Math.max(...vals),range=hi-lo||1,p=(z:number)=>.1+(z-lo)/range*.8;
   l(p(vals[0]),.5,p(vals[4]),.5);l(p(vals[0]),.36,p(vals[0]),.64);l(p(vals[4]),.36,p(vals[4]),.64);
   page.drawRectangle({x:x+p(vals[1])*w,y:y+.35*h,width:(p(vals[3])-p(vals[1]))*w,height:.3*h,borderColor:accent,borderWidth:1});l(p(vals[2]),.35,p(vals[2]),.65);
   for(const outlier of vals.slice(5))page.drawCircle({x:x+p(outlier)*w,y:y+.5*h,size:3,color:rgb(1,1,1),borderColor:accent,borderWidth:1});
  }return;
 }
 if(d.kind==='scatter'){l(.1,.17,.95,.17);l(.14,.1,.14,.94);for(const [u,v] of scatterGeometry(d))dot(.14+u*.78,.2+v*.69);return;}
 if(d.kind==='coordinate'||d.kind==='linear-function'){
  const g=graphGeometry(d),mx=(z:number)=>.5+z/g.boundX*.44,my=(z:number)=>.5+z/g.boundY*.42;
  l(.06,.5,.94,.5);l(.5,.07,.5,.93);
  const tickX=g.boundX<=9?2:g.boundX<=20?5:10,tickY=g.boundY<=9?2:g.boundY<=20?5:10;
  for(let i=-g.boundX;i<=g.boundX;i+=tickX)l(mx(i),.48,mx(i),.52);
  for(let i=-g.boundY;i<=g.boundY;i+=tickY)l(.48,my(i),.52,my(i));
  if(g.segment){const [[x1,y1],[x2,y2]]=g.segment;l(mx(x1),my(y1),mx(x2),my(y2));}
  for(const [vx,vy] of g.points){dot(mx(vx),my(vy));page.drawText(`(${vx},${vy})`,{x:x+mx(vx)*w+4,y:y+my(vy)*h+5,size:7,font,color:ink});}
  return;
 }
 if(d.kind==='angle'){l(.25,.15,.9,.15);const a=d.values[0]*Math.PI/180;l(.25,.15,.25+.6*Math.cos(a),.15+.6*Math.sin(a));return;}
 if(d.kind==='line'){l(.1,.5,.9,.5);const n=d.values[0];if(n!==2)dot(.1,.5);if(n===0)dot(.9,.5);if(n>=1){l(.86,.55,.9,.5);l(.86,.45,.9,.5);}if(n===2){l(.14,.55,.1,.5);l(.14,.45,.1,.5);}return;}
 if(d.kind==='dots'){for(let i=0;i<d.values[0];i++)dot(.15+(i%6)*.13,.3+Math.floor(i/6)*.4);}
}
export async function createWorksheetPdf(sheet:Worksheet,topicName:string,mode:PdfMode,paper:Paper):Promise<Uint8Array>{
 if(mode==='steps'&&!hasVerifiedSteps(sheet.topicId))throw new Error('Worked steps are not yet verified for this topic');
 const pdf=await PDFDocument.create();const [pw,ph]=PAGE_SIZE[paper];const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const margin=40,bodyW=pw-margin*2,hasDiagrams=sheet.problems.some(p=>!!p.diagramSpec),twoCols=mode==='questions'&&!hasDiagrams;
 let page:PDFPage;let currentY=0;let pageNum=0;
 function newPage(){page=pdf.addPage([pw,ph]);pageNum++;currentY=ph-48;page.drawText(ascii(topicName).slice(0,74),{x:margin,y:currentY,size:15,font:bold,color:ink});currentY-=19;page.drawText(`Math Worksheet Studio | ${mode.toUpperCase()} | ID ${sheet.topicId.slice(0,15)}-${sheet.seed} | ${sheet.problems.length} questions`,{x:margin,y:currentY,size:8,font,color:sub});currentY-=12;page.drawLine({start:{x:margin,y:currentY},end:{x:pw-margin,y:currentY},color:accent,thickness:1});currentY-=23;page.drawText('Name: ______________________________      Date: _______________',{x:margin,y:currentY,size:9,font,color:ink});currentY-=23;}
 newPage();
 const colGap=19,colW=twoCols?(bodyW-colGap)/2:bodyW;
 function heightFor(p:Problem){const questionLines=wrap(p.payload.question,twoCols?35:80);if(mode==='questions')return 27+questionLines.length*13+(p.diagramSpec?150:0)+(twoCols?22:32);if(mode==='answers')return 28+questionLines.length*11+12;return 35+questionLines.length*12+p.solutionSteps.reduce((acc,s)=>acc+Math.max(1,wrap(s,82).length)*11,0)+20;}
 let rowY=currentY,rowH=0,col=0;
 for(let i=0;i<sheet.problems.length;i++){
  const p=sheet.problems[i],needed=heightFor(p);if(twoCols&&col===2){currentY=rowY-rowH-8;rowY=currentY;rowH=0;col=0;}
  if((twoCols?rowY:currentY)-needed<margin+18){newPage();rowY=currentY;rowH=0;col=0;}
  const xx=margin+(twoCols?col*(colW+colGap):0),yy=twoCols?rowY:currentY;
  let y=yy;page.drawText(`${i+1}.`,{x:xx,y,size:9,font:bold,color:accent});y-=17;
  for(const line of wrap(p.payload.question,twoCols?35:80)){page.drawText(line,{x:xx,y,size:10,font,color:ink});y-=13;}
  if(mode==='questions'&&p.diagramSpec){plotDiagram(page,p.diagramSpec,xx,y-136,Math.min(235,colW-12),128,font);y-=150;}
  if(mode==='answers'){for(const line of wrap(`Answer: ${p.expectedAnswer}`,80)){page.drawText(line,{x:xx+10,y,size:10,font:bold,color:ink});y-=12;}}
  if(mode==='steps'){page.drawText('Answer:',{x:xx+10,y,size:9,font:bold,color:sub});y-=13;for(const line of wrap(p.expectedAnswer,80)){page.drawText(line,{x:xx+10,y,size:10,font:bold,color:ink});y-=12;}for(let k=0;k<p.solutionSteps.length;k++){for(const line of wrap(`${k+1}) ${p.solutionSteps[k]}`,78)){page.drawText(line,{x:xx+10,y,size:9,font,color:sub});y-=11;}}}
  rowH=Math.max(rowH,needed);if(twoCols)col++;else currentY=yy-needed;
 }
 const pages=pdf.getPages();for(let i=0;i<pages.length;i++){pages[i].drawText(`Sheet ${sheet.seed} | ${paper} | Page ${i+1}/${pages.length} | Questions and answers match by sequence.`,{x:margin,y:19,size:7,font,color:sub});}
 pdf.setTitle(`${topicName} - ${mode} - seed ${sheet.seed}`);pdf.setCreator('Math Worksheet Studio');return pdf.save();
}
