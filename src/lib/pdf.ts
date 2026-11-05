/** Browser-side vector PDF export: no screenshots, server, external API, or student records. */
import {PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont} from 'pdf-lib';
import {quartiles,type Worksheet, type Problem, type Diagram} from './math.ts';
import {functionTableGeometry} from './function-table.ts';
import {graphGeometry,scatterGeometry,boxPracticeAxis,angleTriangleLayout,intersectingAngleGeometry} from './graph.ts';
import {hasVerifiedSteps} from './capabilities.ts';
import {assertWorksheetIntegrity} from './sheet-integrity.ts';
import {PROTRACTOR_RADIUS_PT,PROTRACTOR_CALIBRATION_PT} from './protractor.ts';
export type PdfMode = 'questions'|'answers'|'steps';
export type Paper = 'Letter'|'A4';
const PAGE_SIZE:Record<Paper,[number,number]>={Letter:[612,792],A4:[595.28,841.89]};
const ink=rgb(.09,.14,.22),sub=rgb(.35,.43,.52),accent=rgb(.105,.39,.65);
export function ascii(text:string){return text.replace(/−/g,'-').replace(/×/g,'x').replace(/÷/g,' divided by ').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/²/g,'^2').replace(/³/g,'^3').replace(/°/g,' deg').replace(/½/g,'1/2').replace(/●/g,'*').replace(/→/g,' -> ').replace(/←/g,' <- ').replace(/↔/g,' <-> ').replace(/–|—/g,'-').replace(/[^\x20-\x7e]/g,'');}
/** Wrap using font metrics rather than character counts; even a long unspaced
 * token is split before it can reach a page margin. */
export function wrapPdfText(input:string,font:PDFFont,size:number,maxWidth:number):string[]{
 if(!(size>0&&maxWidth>size))throw Error('Invalid PDF text rectangle');
 const words=ascii(input).trim().split(/\s+/).filter(Boolean),lines:string[]=[];
 let line='';
 const fits=(value:string)=>font.widthOfTextAtSize(value,size)<=maxWidth+0.01;
 for(const word of words){
  const candidate=line?`${line} ${word}`:word;
  if(fits(candidate)){line=candidate;continue;}
  if(line){lines.push(line);line='';}
  if(fits(word)){line=word;continue;}
  let segment='';for(const char of word){
   if(segment&&!fits(segment+char)){lines.push(segment);segment='';}
   if(!fits(char))throw Error('PDF column is too narrow for glyph');
   segment+=char;
  }
  line=segment;
 }
 if(line)lines.push(line);
 return lines.length?lines:[''];
}
function plotDiagram(page:PDFPage,d:Diagram,x:number,y:number,w:number,h:number,font:PDFFont,showSolution=false){
 const stroke={color:accent,thickness:1.1};const l=(a:number,b:number,c:number,e:number)=>page.drawLine({start:{x:x+a*w,y:y+b*h},end:{x:x+c*w,y:y+e*h},...stroke});
 const dot=(xx:number,yy:number)=>page.drawCircle({x:x+xx*w,y:y+yy*h,size:3,color:accent});
 const label=(text:string,xx:number,yy:number,size=8)=>{
  page.drawText(ascii(text),{x:x+xx*w,y:y+yy*h,size,font,color:ink});
 };
 if(d.kind==='protractor'){
  // Never shrink the printable instrument: the SVG and PDF both use a 72 mm radius.
  const r=PROTRACTOR_RADIUS_PT,cx=x+w/2,cy=y+45;
  if(w<2*r+20||h<r+66)throw new Error('Protractor page space is too small for calibrated output');
  page.drawLine({start:{x:cx-r,y:cy},end:{x:cx+r,y:cy},color:ink,thickness:1});
  for(let a=0;a<=180;a++){
   const t=a*Math.PI/180,cos=Math.cos(t),sin=Math.sin(t);
   const inner=r-(a%10===0?15:a%5===0?10:5);
   page.drawLine({start:{x:cx+inner*cos,y:cy+inner*sin},end:{x:cx+r*cos,y:cy+r*sin},color:ink,thickness:a%10===0?.8:.35});
   if(a>0){const p=(a-1)*Math.PI/180;page.drawLine({start:{x:cx+r*Math.cos(p),y:cy+r*Math.sin(p)},end:{x:cx+r*cos,y:cy+r*sin},color:ink,thickness:.7});}
   if(a%10===0){const label=String(a),fSize=7,lr=r-27;
    page.drawText(label,{x:cx+lr*cos-font.widthOfTextAtSize(label,fSize)/2,y:cy+lr*sin-2.5,size:fSize,font,color:ink});}
  }
  page.drawCircle({x:cx,y:cy,size:2,borderColor:ink,borderWidth:.7});
  const sx=x+15,sy=y+11,len=PROTRACTOR_CALIBRATION_PT;
  page.drawLine({start:{x:sx,y:sy},end:{x:sx+len,y:sy},color:ink,thickness:1});
  page.drawLine({start:{x:sx,y:sy-3},end:{x:sx,y:sy+3},color:ink,thickness:1});
  page.drawLine({start:{x:sx+len,y:sy-3},end:{x:sx+len,y:sy+3},color:ink,thickness:1});
  page.drawText('50 mm check',{x:sx+len+8,y:sy-3,size:8,font,color:ink});
  page.drawText('Print at Actual size (100%); measure calibration bar.',{x:sx,y:sy+9,size:7,font,color:sub});
  return;
 }
 if(d.kind==='function-table'){
  const g=functionTableGeometry(d),left=x+.07*w,bottom=y+.12*h,cw=.215*w,rh=.38*h;
  page.drawRectangle({x:left,y:bottom,width:cw*4,height:rh*2,color:rgb(1,1,1),borderColor:accent,borderWidth:1.2});
  page.drawRectangle({x:left,y:bottom,width:cw,height:rh*2,color:rgb(.91,.95,.98)});
  for(let c=1;c<4;c++)page.drawLine({start:{x:left+cw*c,y:bottom},end:{x:left+cw*c,y:bottom+rh*2},color:sub,thickness:.6});
  page.drawLine({start:{x:left,y:bottom+rh},end:{x:left+cw*4,y:bottom+rh},color:sub,thickness:.6});
  const centered=(value:string,c:number,row:number)=>{
   const size=10,t=ascii(value),cx=left+(c+.5)*cw;
   page.drawText(t,{x:cx-font.widthOfTextAtSize(t,size)/2,y:bottom+(row+.48)*rh-3,size,font,color:ink});
  };
  centered('x',0,1);centered('f(x)',0,0);
  for(let i=0;i<3;i++){
   centered(!showSolution&&g.missingRole==='input'&&g.position===i?'____':String(g.inputs[i]),i+1,1);
   centered(!showSolution&&g.missingRole==='output'&&g.position===i?'____':String(g.outputs[i]),i+1,0);
  }
  return;
 }
 if(d.kind==='column-multiplication'){
  if(d.values.length!==2||!d.values.every(z=>Number.isSafeInteger(z)&&z>0))throw Error('Invalid multiplication diagram');
  const [top,bottom]=d.values;
  const right=x+w*.72,base=y+h*.64,fontSize=19;
  const rightText=(value:string,offset:number,size=fontSize)=>page.drawText(value,{x:right-font.widthOfTextAtSize(value,size),y:base+offset,size,font,color:ink});
  rightText(String(top),29);rightText(String(bottom),6);
  page.drawText('x',{x:right-80,y:base+6,size:16,font,color:ink});
  page.drawLine({start:{x:right-100,y:base},end:{x:right+10,y:base},color:ink,thickness:1.5});
  page.drawText('ones',{x:x+w*.13,y:base-19,size:8,font,color:sub});
  page.drawLine({start:{x:right-76,y:base-23},end:{x:right+10,y:base-23},color:sub,thickness:.7});
  if(bottom>=10){
   page.drawText('tens',{x:x+w*.13,y:base-37,size:8,font,color:sub});
   page.drawLine({start:{x:right-76,y:base-41},end:{x:right+10,y:base-41},color:sub,thickness:.7});
  }
  page.drawLine({start:{x:right-100,y:base-48},end:{x:right+10,y:base-48},color:ink,thickness:1});
  page.drawText('Answer: ________',{x:x+w*.18,y:base-61,size:9,font,color:sub});
  return;
 }
 if(d.kind==='long-division'){
  if(d.values.length!==2||!d.values.every(z=>Number.isSafeInteger(z)&&z>0))throw Error('Invalid long-division diagram');
  const [dividend,divisor]=d.values,base=y+h*.48;
  page.drawText(String(divisor),{x:x+w*.18,y:base,size:18,font,color:ink});
  page.drawText(String(dividend),{x:x+w*.47,y:base,size:18,font,color:ink});
  page.drawLine({start:{x:x+w*.39,y:base+30},end:{x:x+w*.86,y:base+30},color:ink,thickness:1.7});
  page.drawLine({start:{x:x+w*.39,y:base+30},end:{x:x+w*.39,y:base-8},color:ink,thickness:1.7});
  page.drawText('Quotient: ______',{x:x+w*.18,y:base+47,size:9,font,color:sub});
  page.drawText('Remainder: ______',{x:x+w*.18,y:base-27,size:9,font,color:sub});
  return;
 }
 if(d.kind==='triangle'){
  l(.15,.16,.85,.16);l(.15,.16,.50,.88);l(.50,.88,.85,.16);l(.50,.88,.50,.16);
  label(`${d.values[0]} base`,.38,.03);
  label(`${d.values[1]===undefined?'?':d.values[1]} height`,.53,.53);
  return;
 }
 if(d.kind==='right-triangle'){
  const [a,b,c]=d.values,missingBase=d.labels?.includes('missing-base'),missingVertical=d.labels?.includes('missing-vertical');
  if(missingBase||missingVertical){if(d.values.length!==3||Math.abs(a*a+b*b-c*c)>.000001)throw Error('Invalid missing-leg triangle PDF');}
  const s=Math.min(w*.57/a,h*.67/b),dx=a*s/w,dy=b*s/h;const x0=.16,y0=.14;
  l(x0,y0,x0+dx,y0);l(x0,y0,x0,y0+dy);l(x0+dx,y0,x0,y0+dy);
  l(x0+.03,y0,x0+.03,y0+.06);l(x0+.03,y0+.06,x0,y0+.06);
  const baseLabel=missingBase&&!showSolution?'?':String(a),verticalLabel=missingVertical&&!showSolution?'?':String(b);
  label(baseLabel,x0+dx/2,.02);label(verticalLabel,.035,y0+dy/2);
  label(c===undefined?'?':String(c),x0+dx/2+.12,y0+dy/2+.04);
  return;
 }
 if(d.kind==='triangle-angles'){
  const g=angleTriangleLayout(d);
  const px=(z:number)=>z/450,py=(z:number)=>(220-z)/220;
  const [a,b,c]=g.vertices;
  l(px(a[0]),py(a[1]),px(b[0]),py(b[1]));
  l(px(b[0]),py(b[1]),px(c[0]),py(c[1]));
  l(px(c[0]),py(c[1]),px(a[0]),py(a[1]));
  for(let i=0;i<3;i++){const [tx,ty]=g.labelPositions[i],value=i===2?'?':`${d.values[i]} deg`;const fontSize=8;page.drawText(value,{x:x+px(tx)*w-font.widthOfTextAtSize(value,fontSize)/2,y:y+py(ty)*h,size:fontSize,font,color:ink});}
  return;
 }
 if(d.kind==='rectangle'){
  const square=d.labels?.[0]==='square'||d.values[0]===d.values[1];
  if(square){const side=Math.min(w*.55,h*.62);page.drawRectangle({x:x+(w-side)/2,y:y+(h-side)/2,width:side,height:side,borderColor:accent,borderWidth:1.5});}
  else page.drawRectangle({x:x+w*.2,y:y+h*.2,width:w*.6,height:h*.65,borderColor:accent,borderWidth:1.5});
  label(`${d.values[0]} units`,.43,.08);label(String(d.values[1]),.83,.52);return;
 }
 if(d.kind==='parallelogram'){
  l(.12,.15,.74,.15);l(.74,.15,.89,.88);l(.89,.88,.28,.88);l(.28,.88,.12,.15);l(.28,.15,.28,.88);
  label(String(d.values[0]),.36,.04);label(d.values[1]===undefined?'?':String(d.values[1]),.30,.48);
  return;
 }
 if(d.kind==='trapezoid'){
  l(.1,.15,.9,.15);l(.9,.15,.7,.85);l(.7,.85,.3,.85);l(.3,.85,.1,.15);l(.3,.15,.3,.85);
  label(String(d.values[0]),.44,.04);label(String(d.values[1]),.44,.88);
  label(d.values[2]===undefined?'?':String(d.values[2]),.32,.50);
  return;
 }
 if(d.kind==='prism'){
  if(d.labels?.[0]==='cube'){
   // A cube has a genuinely square front face, not a generic rectangle.
   const side=Math.min(w*.43,h*.58),left=x+w*.29,bottom=y+h*.14,depth=side*.28;
   page.drawRectangle({x:left,y:bottom,width:side,height:side,borderColor:accent,borderWidth:1.4});
   for(const [x1,y1,x2,y2] of [[left,bottom+side,left+depth,bottom+side+depth],[left+side,bottom+side,left+side+depth,bottom+side+depth],[left+side,bottom,left+side+depth,bottom+depth],[left+depth,bottom+side+depth,left+side+depth,bottom+side+depth],[left+side+depth,bottom+depth,left+side+depth,bottom+side+depth]]){
    page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},color:accent,thickness:1.1});
   }
  }else{
   page.drawRectangle({x:x+w*.13,y:y+h*.12,width:w*.6,height:h*.65,borderColor:accent,borderWidth:1.4});
   l(.13,.77,.32,.94);l(.32,.94,.91,.94);l(.91,.94,.73,.77);l(.91,.94,.91,.28);l(.91,.28,.73,.12);
  }
  label(String(d.values[0]),.38,.03);label(String(d.values[1]),.77,.19);
  label(d.values[2]===undefined?'?':String(d.values[2]),.04,.48);
  return;
 }
 if(d.kind==='box-practice'){
  const axis=boxPracticeAxis(d.values),toX=(z:number)=>.10+axis.position(z)*.80;
  l(.07,.48,.94,.48);
  for(const tick of axis.ticks){const px=toX(tick);l(px,.40,px,.57);
   const label=String(tick),fontSize=8;
   page.drawText(label,{x:x+px*w-font.widthOfTextAtSize(label,fontSize)/2,y:y+.64*h,size:fontSize,font,color:ink});
  }
  if(showSolution){
   const q=quartiles(d.values),start=toX(q.q1),end=toX(q.q3);
   l(toX(q.lower),.48,toX(q.upper),.48);
   l(toX(q.lower),.32,toX(q.lower),.64);l(toX(q.upper),.32,toX(q.upper),.64);
   page.drawRectangle({x:x+start*w,y:y+.32*h,width:Math.max(1,(end-start)*w),height:.32*h,borderColor:accent,borderWidth:1.7});
   l(toX(q.median),.32,toX(q.median),.64);
   for(const outlier of q.outliers)page.drawCircle({x:x+toX(outlier)*w,y:y+.48*h,size:3.8,color:rgb(1,1,1),borderColor:rgb(.64,.26,.15),borderWidth:1.5});
  }
  page.drawText(showSolution?'Modified box plot (outliers separate)':'Draw box, median and whiskers',{x:x+.1*w,y:y+.12*h,size:8,font,color:sub});
  return;
 }
 if(d.kind==='numberline'||d.kind==='box'){
  l(.1,.5,.9,.5);
  if(d.kind==='numberline'){
   const n=d.values[0],op=d.labels?.[0],step=Math.max(1,Math.ceil(Math.abs(n)/5)),extent=step*5,px=(z:number)=>.5+(z/extent)*.4;
   for(let i=-5;i<=5;i++){const xx=px(i*step);l(xx,.47,xx,.53);page.drawText(String(i*step),{x:x+xx*w-8,y:y+.65*h,size:7,font,color:ink});}
   // A practice diagram must NEVER disclose the endpoint or ray.
   if(showSolution){
    const xx=x+px(n)*w,yy=y+.5*h,open=op==='<'||op==='>';
    if(op){
     const target=x+(op==='>'||op==='≥'?.9:.1)*w;
     page.drawLine({start:{x:xx,y:yy},end:{x:target,y:yy},color:rgb(.09,.48,.41),thickness:2.8});
     const direction=target>=xx?1:-1;
     page.drawLine({start:{x:target,y:yy},end:{x:target-9*direction,y:yy+4},color:rgb(.09,.48,.41),thickness:2});
     page.drawLine({start:{x:target,y:yy},end:{x:target-9*direction,y:yy-4},color:rgb(.09,.48,.41),thickness:2});
    }
    page.drawCircle({x:xx,y:yy,size:4,color:open?rgb(1,1,1):rgb(.09,.48,.41),borderColor:rgb(.09,.48,.41),borderWidth:1.8});
   }
  }else{
   const vals=d.values,lo=Math.min(...vals),hi=Math.max(...vals),range=hi-lo||1,p=(z:number)=>.1+(z-lo)/range*.8;
   l(p(vals[0]),.5,p(vals[4]),.5);l(p(vals[0]),.36,p(vals[0]),.64);l(p(vals[4]),.36,p(vals[4]),.64);
   page.drawRectangle({x:x+p(vals[1])*w,y:y+.35*h,width:(p(vals[3])-p(vals[1]))*w,height:.3*h,borderColor:accent,borderWidth:1});l(p(vals[2]),.35,p(vals[2]),.65);
   for(const outlier of vals.slice(5))page.drawCircle({x:x+p(outlier)*w,y:y+.5*h,size:3,color:rgb(1,1,1),borderColor:accent,borderWidth:1});
  }return;
 }
 if(d.kind==='scatter'){
  const px=(n:number)=>.14+(n/7)*.8,py=(n:number)=>.15+(n/10)*.75,light=rgb(.87,.91,.95);
  for(let i=0;i<=7;i++){
   page.drawLine({start:{x:x+px(i)*w,y:y+.15*h},end:{x:x+px(i)*w,y:y+.9*h},color:light,thickness:.5});
   const s=String(i);page.drawText(s,{x:x+px(i)*w-2,y:y+.05*h,size:7,font,color:sub});
  }
  for(let i=0;i<=10;i+=2){
   page.drawLine({start:{x:x+.14*w,y:y+py(i)*h},end:{x:x+.94*w,y:y+py(i)*h},color:light,thickness:.5});
   const s=String(i);page.drawText(s,{x:x+.08*w,y:y+py(i)*h-2,size:7,font,color:sub});
  }
  l(.14,.15,.94,.15);l(.14,.15,.14,.9);
  if(!d.labels?.includes('plot')||showSolution)for(const [u,v] of scatterGeometry(d))dot(.14+u*.8,.15+v*.75);
  return;
 }
 if(d.kind==='coordinate'||d.kind==='linear-function'){
  const g=graphGeometry(d),mx=(z:number)=>.5+z/g.boundX*.44,my=(z:number)=>.5+z/g.boundY*.42;
  const drawingTask=d.kind==='linear-function'&&d.labels?.includes('draw');
  const tickX=drawingTask?1:g.boundX<=9?2:g.boundX<=20?5:10;
  const tickY=drawingTask?1:g.boundY<=9?2:g.boundY<=20?5:10;
  const gridColor=rgb(.87,.91,.95);
  for(let i=-g.boundX;i<=g.boundX;i+=tickX)if(i!==0)
   page.drawLine({start:{x:x+mx(i)*w,y:y+.07*h},end:{x:x+mx(i)*w,y:y+.93*h},color:gridColor,thickness:.45});
  for(let i=-g.boundY;i<=g.boundY;i+=tickY)if(i!==0)
   page.drawLine({start:{x:x+.06*w,y:y+my(i)*h},end:{x:x+.94*w,y:y+my(i)*h},color:gridColor,thickness:.45});
  l(.06,.5,.94,.5);l(.5,.07,.5,.93);
  for(let i=-g.boundX;i<=g.boundX;i+=tickX){
   l(mx(i),.48,mx(i),.52);
   if(i!==0){const s=String(i),size=6;page.drawText(s,{x:x+mx(i)*w-font.widthOfTextAtSize(s,size)/2,y:y+.40*h,size,font,color:sub});}
  }
  for(let i=-g.boundY;i<=g.boundY;i+=tickY){
   l(.48,my(i),.52,my(i));
   if(i!==0&&(!drawingTask||i%2===0)){const s=String(i),size=6;page.drawText(s,{x:x+.45*w-font.widthOfTextAtSize(s,size),y:y+my(i)*h-2,size,font,color:sub});}
  }
  if(g.segment&&(!drawingTask||showSolution)){
   const [[x1,y1],[x2,y2]]=g.segment;l(mx(x1),my(y1),mx(x2),my(y2));
   if(drawingTask){const [m,b]=d.values;dot(mx(0),my(b));dot(mx(1),my(m+b));}
  }
  for(const [vx,vy] of g.points){dot(mx(vx),my(vy));page.drawText(`(${vx},${vy})`,{x:x+mx(vx)*w+4,y:y+my(vy)*h+5,size:7,font,color:ink});}
  return;
 }
 if(d.kind==='angle'){l(.25,.15,.9,.15);const a=d.values[0]*Math.PI/180;l(.25,.15,.25+.6*Math.cos(a),.15+.6*Math.sin(a));return;}
 if(d.kind==='intersecting-lines'){
  const g=intersectingAngleGeometry(d),scale=Math.min(w/450,h/220),pt=([ax,ay]:[number,number])=>({x:x+w/2+(ax-225)*scale,y:y+h/2+(110-ay)*scale});
  const draw=([a,b]:[[number,number],[number,number]])=>page.drawLine({start:pt(a),end:pt(b),color:accent,thickness:1.2});
  draw(g.horizontal);draw(g.diagonal);
  for(const arc of [g.givenArc,g.unknownArc])for(let i=1;i<arc.length;i++)draw([arc[i-1],arc[i]]);
  for(const [value,loc] of [[`${g.givenDegrees} deg`,g.givenLabel],['?',g.unknownLabel]] as [string,[number,number]][]){
   const pos=pt(loc),size=8;page.drawText(value,{x:pos.x-font.widthOfTextAtSize(value,size)/2,y:pos.y-3,size,font,color:ink});
  }
  return;
 }
 if(d.kind==='line'){
  l(.1,.5,.9,.5);const n=d.values[0];if(n!==2)dot(.1,.5);if(n===0)dot(.9,.5);
  if(n===1)dot(.65,.5);if(n===2){dot(.28,.5);dot(.72,.5);}
  if(n>=1){l(.86,.55,.9,.5);l(.86,.45,.9,.5);}if(n===2){l(.14,.55,.1,.5);l(.14,.45,.1,.5);}
  const names=d.labels??['A','B'];const p1=n===2?.28:.1,p2=n===2?.72:n===1?.65:.9;
  for(const [name,tx] of [[names[0]??'A',p1],[names[1]??'B',p2]] as [string,number][])page.drawText(ascii(name),{x:x+tx*w-3,y:y+.64*h,size:9,font,color:ink});
  return;
 }
 if(d.kind==='dots'){for(let i=0;i<d.values[0];i++)dot(.15+(i%6)*.13,.3+Math.floor(i/6)*.4);}
}
export async function createWorksheetPdf(sheet:Worksheet,topicName:string,mode:PdfMode,paper:Paper):Promise<Uint8Array>{
 assertWorksheetIntegrity(sheet);
 if(mode==='steps'&&!hasVerifiedSteps(sheet.topicId))throw new Error('Worked steps are not yet verified for this topic');
 const pdf=await PDFDocument.create();const [pw,ph]=PAGE_SIZE[paper];const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const margin=40,bodyW=pw-margin*2,hasDiagrams=sheet.problems.some(p=>!!p.diagramSpec),twoCols=mode==='questions'&&!hasDiagrams;
 let page:PDFPage;let currentY=0;let pageNum=0;
 function newPage(){page=pdf.addPage([pw,ph]);pageNum++;currentY=ph-48;page.drawText(ascii(topicName).slice(0,74),{x:margin,y:currentY,size:15,font:bold,color:ink});currentY-=19;page.drawText(`Math Worksheet Studio | ${mode.toUpperCase()} | ID ${sheet.topicId.slice(0,15)}-${sheet.seed} | v${sheet.generatorVersion} | Config ${sheet.optionsHash} | ${sheet.problems.length} questions`,{x:margin,y:currentY,size:8,font,color:sub});currentY-=12;page.drawLine({start:{x:margin,y:currentY},end:{x:pw-margin,y:currentY},color:accent,thickness:1});currentY-=23;page.drawText('Name: ______________________________      Date: _______________',{x:margin,y:currentY,size:9,font,color:ink});currentY-=23;}
 newPage();
 const colGap=19,colW=twoCols?(bodyW-colGap)/2:bodyW;
 function heightFor(p:Problem){
  const width=twoCols?colW-8:bodyW-10,questions=wrapPdfText(p.payload.question,font,10,width);
  const common=17+questions.length*13;
  if(mode==='questions')return common+(p.diagramSpec?(p.diagramSpec.kind==='protractor'?305:150):0)+18;
  if(mode==='answers')return common+wrapPdfText(`Answer: ${p.expectedAnswer}`,bold,10,bodyW-18).length*12+20+(['numberline','box-practice','function-table'].includes(p.diagramSpec?.kind??'')||(p.diagramSpec?.kind==='linear-function'&&p.diagramSpec.labels?.includes('draw'))||(p.diagramSpec?.kind==='scatter'&&p.diagramSpec.labels?.includes('plot'))||(p.diagramSpec?.kind==='right-triangle'&&p.diagramSpec.labels?.some(s=>s.startsWith('missing-')))?150:0);
  const answerLines=wrapPdfText(p.expectedAnswer,bold,10,bodyW-18).length;
  const stepLines=p.solutionSteps.reduce((total,step,k)=>total+wrapPdfText(`${k+1}) ${step}`,font,9,bodyW-18).length,0);
  return common+13+answerLines*12+stepLines*11+24;
 }
 let rowY=currentY,rowH=0,col=0;
 for(let i=0;i<sheet.problems.length;i++){
  const p=sheet.problems[i],needed=heightFor(p);if(twoCols&&col===2){currentY=rowY-rowH-8;rowY=currentY;rowH=0;col=0;}
  if((twoCols?rowY:currentY)-needed<margin+18){newPage();rowY=currentY;rowH=0;col=0;}
  const xx=margin+(twoCols?col*(colW+colGap):0),yy=twoCols?rowY:currentY;
  let y=yy;page.drawText(`${i+1}.`,{x:xx,y,size:9,font:bold,color:accent});y-=17;
  for(const line of wrapPdfText(p.payload.question,font,10,twoCols?colW-8:bodyW-10)){page.drawText(line,{x:xx,y,size:10,font,color:ink});y-=13;}
  if(mode==='questions'&&p.diagramSpec){const full=p.diagramSpec.kind==='protractor';plotDiagram(page,p.diagramSpec,xx,y-(full?290:136),full?colW-12:Math.min(235,colW-12),full?280:128,font);y-=full?305:150;}
  if(mode==='answers'){for(const line of wrapPdfText(`Answer: ${p.expectedAnswer}`,bold,10,bodyW-18)){page.drawText(line,{x:xx+10,y,size:10,font:bold,color:ink});y-=12;}
   if(p.diagramSpec&&(['numberline','box-practice','function-table'].includes(p.diagramSpec.kind)||(p.diagramSpec.kind==='linear-function'&&p.diagramSpec.labels?.includes('draw'))||(p.diagramSpec.kind==='scatter'&&p.diagramSpec.labels?.includes('plot'))||(p.diagramSpec.kind==='right-triangle'&&p.diagramSpec.labels?.some(s=>s.startsWith('missing-'))))){plotDiagram(page,p.diagramSpec,xx,y-136,Math.min(235,colW-12),128,font,true);y-=150;}
  }
  if(mode==='steps'){page.drawText('Answer:',{x:xx+10,y,size:9,font:bold,color:sub});y-=13;for(const line of wrapPdfText(p.expectedAnswer,bold,10,bodyW-18)){page.drawText(line,{x:xx+10,y,size:10,font:bold,color:ink});y-=12;}for(let k=0;k<p.solutionSteps.length;k++){for(const line of wrapPdfText(`${k+1}) ${p.solutionSteps[k]}`,font,9,bodyW-18)){page.drawText(line,{x:xx+10,y,size:9,font,color:sub});y-=11;}}}
  rowH=Math.max(rowH,needed);if(twoCols)col++;else currentY=yy-needed;
 }
 const pages=pdf.getPages();for(let i=0;i<pages.length;i++){pages[i].drawText(`Sheet ${sheet.seed} | v${sheet.generatorVersion} | Config ${sheet.optionsHash} | ${paper} | Page ${i+1}/${pages.length} | Questions and answers match by sequence.`,{x:margin,y:19,size:7,font,color:sub});}
 pdf.setTitle(`${topicName} - ${mode} - seed ${sheet.seed} - generator v${sheet.generatorVersion} - config ${sheet.optionsHash}`);pdf.setCreator('Math Worksheet Studio');return pdf.save();
}

/** One practical, unmarked 180° instrument on a single Letter/A4 PDF page.
 * Calibration is physical and does not depend on a browser CSS print scale. */
export async function createBlankProtractorPdf(paper:Paper):Promise<Uint8Array>{
 const pdf=await PDFDocument.create();const [w,h]=PAGE_SIZE[paper];const page=pdf.addPage([w,h]);
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 page.drawText('Printable 180 Degree Protractor',{x:40,y:h-62,size:18,font:bold,color:ink});
 page.drawText('Print using Actual size / 100%, not Fit to page.',{x:40,y:h-84,size:10,font,color:sub});
 plotDiagram(page,{kind:'protractor',values:[PROTRACTOR_CALIBRATION_PT]},40,h-440,w-80,280,font);
 page.drawText('Use the 50 mm line to check printer scaling. Accuracy is not guaranteed until measured.',{x:40,y:52,size:8,font,color:sub});
 pdf.setTitle('Calibrated 180 Degree Printable Protractor - 50 mm check');
 pdf.setCreator('Math Worksheet Studio');return pdf.save();
}
