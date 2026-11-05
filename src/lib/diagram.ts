import {quartiles,type Diagram} from './math.ts';
import {graphGeometry,scatterGeometry,boxPracticeAxis,angleTriangleLayout,intersectingAngleGeometry} from './graph.ts';
import {functionTableGeometry} from './function-table.ts';
import {PROTRACTOR_RADIUS_MM,PROTRACTOR_CALIBRATION_MM} from './protractor.ts';
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
/** Vector graphics are generated from the same diagramSpec as the answer object. */
export function diagramSVG(d?:Diagram,showSolution=false):string{
 if(!d)return '';
 const v=d.values;
 if(d.kind==='protractor'){
  const ticks=Array.from({length:181},(_,angle)=>{const radians=angle*Math.PI/180,x=90+PROTRACTOR_RADIUS_MM*Math.cos(radians),y=86-PROTRACTOR_RADIUS_MM*Math.sin(radians),long=angle%10===0,inner=long?61:angle%5===0?65:69; const x2=90+inner*Math.cos(radians),y2=86-inner*Math.sin(radians);return `<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#172337" stroke-width="${long?.65:.3}"/>${angle%30===0?`<text x="${(90+52*Math.cos(radians)).toFixed(2)}" y="${(86-52*Math.sin(radians)).toFixed(2)}" font-size="4" text-anchor="middle">${angle}</text>`:''}`}).join('');
  return `<svg class="protractor-vector" role="img" aria-label="Actual-size printable 180 degree protractor with a 50 millimeter calibration line" xmlns="http://www.w3.org/2000/svg" width="180mm" height="105mm" viewBox="0 0 180 105"><rect x="0.5" y="0.5" width="179" height="104" fill="white" stroke="#b4bdc9"/><path d="M18 86 A72 72 0 0 1 162 86" fill="none" stroke="#172337" stroke-width=".8"/><path d="M18 86H162" stroke="#172337" stroke-width=".7"/>${ticks}<circle cx="90" cy="86" r="2" fill="none" stroke="#172337"/><path d="M15 96H${15+PROTRACTOR_CALIBRATION_MM}M15 93v6M${15+PROTRACTOR_CALIBRATION_MM} 93v6" stroke="#172337" stroke-width=".6"/><text x="40" y="92" text-anchor="middle" font-size="3.8">50 mm check</text><text x="140" y="96" font-size="3.2" text-anchor="middle">Print at 100% scale</text></svg>`
 }
 let parts='';
 const line=(x1:number,y1:number,x2:number,y2:number)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1b64a5" stroke-width="3" stroke-linecap="round"/>`;
 const text=(x:number,y:number,s:string)=>`<text x="${x}" y="${y}" fill="#172337" font-size="17" text-anchor="middle">${esc(s)}</text>`;
 const poly=(points:string)=>`<polygon points="${points}" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/>`;
 switch(d.kind){
  case 'function-table':{
   const g=functionTableGeometry(d),left=46,top=43,cellW=90,cellH=66;
   parts=`<rect x="${left}" y="${top}" width="${cellW*4}" height="${cellH*2}" rx="8" fill="white" stroke="#1b64a5" stroke-width="2"/><rect x="${left}" y="${top}" width="${cellW}" height="${cellH*2}" rx="8" fill="#e9f2f9"/>`;
   for(let i=1;i<4;i++)parts+=`<path d="M${left+i*cellW} ${top}V${top+cellH*2}" stroke="#9aadc0" stroke-width="1.6"/>`;
   parts+=`<path d="M${left} ${top+cellH}H${left+4*cellW}" stroke="#9aadc0" stroke-width="1.6"/>`;
   const render=(value:string,c:number,row:number)=>`<text x="${left+(c+.5)*cellW}" y="${top+(row+.64)*cellH}" font-size="23" font-family="ui-monospace,Consolas,monospace" font-weight="600" fill="#172337" text-anchor="middle">${esc(value)}</text>`;
   parts+=render('x',0,0)+render('f(x)',0,1);
   for(let i=0;i<3;i++){
    const hideX=!showSolution&&g.missingRole==='input'&&g.position===i;
    const hideY=!showSolution&&g.missingRole==='output'&&g.position===i;
    parts+=render(hideX?'____':String(g.inputs[i]),i+1,0);
    parts+=render(hideY?'____':String(g.outputs[i]),i+1,1);
   }
   break;
  }
  case 'column-multiplication':{
   if(v.length!==2||!v.every(z=>Number.isSafeInteger(z)&&z>0))throw Error('Invalid multiplication diagram');
   const top=String(v[0]),bottom=String(v[1]);
   // Draw a genuine place-value setup, but never expose a partial product or final answer.
   const firstRow=`<text x="169" y="122" font-size="14">ones</text><path d="M222 127H304" stroke="#62738a" stroke-width="1"/>`;
   const secondRow=bottom.length>1?`<text x="169" y="149" font-size="14">tens</text><path d="M222 154H304" stroke="#62738a" stroke-width="1"/>`:'';
   parts=`<g font-family="ui-monospace, SFMono-Regular, Consolas, monospace" fill="#172337" text-anchor="end"><text x="285" y="49" font-size="34">${esc(top)}</text><text x="285" y="85" font-size="34">${esc(bottom)}</text><text x="189" y="85" font-size="30">×</text></g><path d="M175 98H304" stroke="#172337" stroke-width="2.6"/>${firstRow}${secondRow}<path d="M175 172H304" stroke="#172337" stroke-width="1.8"/><g fill="#62738a" font-family="ui-monospace, Consolas, monospace" font-size="17"><text x="185" y="201">Answer:</text><path d="M264 203H348" stroke="#62738a" stroke-width="1"/></g>`;
   break}
  case 'long-division':{
   if(v.length!==2||!v.every(z=>Number.isSafeInteger(z)&&z>0))throw Error('Invalid division diagram');
   const [dividend,divisor]=v;
   parts=`<g font-family="ui-monospace, SFMono-Regular, Consolas, monospace" fill="#172337" font-size="32"><text x="133" y="111" text-anchor="end">${divisor}</text><text x="178" y="111">${dividend}</text></g><path d="M151 72H344 M151 72V130" fill="none" stroke="#172337" stroke-width="2.8"/><g fill="#62738a" font-size="17"><text x="205" y="54">quotient: ______</text><text x="170" y="163">remainder: ______</text></g>`;
   break}
  case 'triangle':parts=poly('120,155 330,155 225,40')+line(225,40,225,155)+text(225,182,`${v[0]} base`)+text(267,108,`${v[1]===undefined?'?':v[1]} height`)+(v.length>=3?text(133,88,`${v[2]} hyp.`):'');break;
  case 'right-triangle':{
   const [a,b,c]=v,missingBase=d.labels?.includes('missing-base'),missingVertical=d.labels?.includes('missing-vertical');
   if(missingBase||missingVertical){if(v.length!==3||Math.abs(a*a+b*b-c*c)>.000001)throw Error('Invalid missing-leg right triangle');}
   const s=Math.min(210/a,110/b),xx=120+a*s,yy=160-b*s;
   const baseLabel=missingBase&&!showSolution?'?':String(a),verticalLabel=missingVertical&&!showSolution?'?':String(b);
   parts=poly(`120,160 ${xx},160 120,${yy}`)+line(120,160,135,160)+line(135,160,135,145)+line(135,145,120,145)
    +text((120+xx)/2,188,`${baseLabel} units`)+text(79,(160+yy)/2,`${verticalLabel} units`)
    +text((120+xx)/2+33,(160+yy)/2,`${c===undefined?'?':c} units`);
   break;
  }
  case 'triangle-angles':{
   const g=angleTriangleLayout(d),coords=g.vertices.map(p=>p.map(x=>x.toFixed(3)).join(',')).join(' ');
   parts=poly(coords)+g.labelPositions.map(([x,y],i)=>text(x,y+5,i===2?'?':`${v[i]}°`)).join('');
   break;
  }
  case 'rectangle':{
   const square=d.labels?.[0]==='square'||v[0]===v[1];
   parts=(square?`<rect x="165" y="50" width="120" height="120" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/>`:`<rect x="130" y="45" width="190" height="110" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/>`)
    +text(225,square?192:178,`${v[0]} units`)+text(square?310:345,105,`${v[1]}`);
   break}

  case 'parallelogram':parts=poly('130,155 310,155 350,48 170,48')+line(170,48,170,155)+text(225,179,`${v[0]}`)+text(151,111,v[1]===undefined?'?':`${v[1]}`);break;
  case 'trapezoid':parts=poly('100,155 360,155 300,49 160,49')+text(230,179,`${v[0]}`)+text(230,40,`${v[1]}`)+text(375,111,v[2]===undefined?'?':`${v[2]}`);break;
  case 'prism':{
   const cube=d.labels?.[0]==='cube';
   parts=(cube?`<rect x="129" y="59" width="116" height="116" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/><path d="M129 59 L177 21 H293 V137 L245 175 M245 59 L293 21" fill="none" stroke="#1b64a5" stroke-width="3"/>`:`<rect x="100" y="72" width="190" height="100" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/><path d="M100 72 L149 35 H339 V135 L290 172 M290 72 L339 35" fill="none" stroke="#1b64a5" stroke-width="3"/>`)
   +text(cube?190:195,191,`${v[0]}`)+text(cube?267:310,160,`${v[1]}`)+text(cube?111:88,120,v[2]===undefined?'?':`${v[2]}`);
   break}

  case 'numberline':{
   const n=v[0],op=d.labels?.[0],step=Math.max(1,Math.ceil(Math.abs(n)/5)),extent=step*5,px=(z:number)=>225+z/extent*170;
   parts=line(55,105,395,105)+`<path d="M55 105l9 -6v12zM395 105l-9 -6v12z" fill="#1b64a5"/>`;
   for(let i=-5;i<=5;i++){const z=i*step,x=px(z);parts+=line(x,99,x,111)+text(x,137,String(z))}
   // The practice grid must be blank. Only the answer key may show the
   // solution marker or the inequality ray, derived from the same math input.
   if(showSolution){
    const xx=px(n),open=op==='<'||op==='>';
    if(op){
     const right=op==='>'||op==='≥',target=right?392:58;
     parts+=`<line class="solution-ray" x1="${xx}" y1="105" x2="${target}" y2="105" stroke="#187b68" stroke-width="5" stroke-linecap="round"/>`;
     parts+=right?`<path d="M394 105l-12 -8v16z" fill="#187b68"/>`:`<path d="M56 105l12 -8v16z" fill="#187b68"/>`;
    }
    parts+=`<circle class="solution-marker" cx="${xx}" cy="105" r="6" fill="${open?'white':'#187b68'}" stroke="#187b68" stroke-width="3"/>`;
   }
   break}
  case 'coordinate':
  case 'linear-function':{
   const g=graphGeometry(d),cx=225,cy=110,bw=172,bh=85;
   const px=(z:number)=>cx+(z/g.boundX)*bw,py=(z:number)=>cy-(z/g.boundY)*bh;
   const drawingTask=d.kind==='linear-function'&&d.labels?.includes('draw');
   const tickX=drawingTask?1:g.boundX<=9?2:g.boundX<=20?5:10;
   const tickY=drawingTask?1:g.boundY<=9?2:g.boundY<=20?5:10;
   for(let x=-g.boundX;x<=g.boundX;x+=tickX){const xx=px(x);parts+=`<line x1="${xx}" y1="25" x2="${xx}" y2="195" stroke="#e1e8ee" stroke-width="1"/>`;if(x!==0)parts+=text(xx,208,String(x));}
   for(let y=-g.boundY;y<=g.boundY;y+=tickY){const yy=py(y);parts+=`<line x1="53" y1="${yy}" x2="397" y2="${yy}" stroke="#e1e8ee" stroke-width="1"/>`;if(y!==0&&(!drawingTask||y%2===0))parts+=text(43,yy+5,String(y));}
   parts+=line(53,cy,397,cy)+line(cx,25,cx,195)+text(410,cy-8,'x')+text(cx+12,17,'y');
   if(g.segment&&(!drawingTask||showSolution)){
    const [[x1,y1],[x2,y2]]=g.segment;
    parts+=`<line ${drawingTask?'class="solution-linear-line" ':''}x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" stroke="#187b68" stroke-width="3"/>`;
    if(drawingTask){
     const [m,b]=d.values;
     for(const [vx,vy] of [[0,b],[1,m+b]])parts+=`<circle class="solution-linear-point" cx="${px(vx)}" cy="${py(vy)}" r="5" fill="#187b68"/>`;
    }
   }
   for(const [x,y] of g.points){parts+=`<circle cx="${px(x)}" cy="${py(y)}" r="5" fill="#187b68" stroke="#fff" stroke-width="2"/>`+text(Math.min(399,px(x)+25),Math.max(18,py(y)-10),`(${x},${y})`);}
   break}
  case 'angle':{const deg=v[0],t=deg*Math.PI/180;parts=line(170,165,380,165)+line(170,165,170+155*Math.cos(t),165-155*Math.sin(t))+`<path d="M220 165 A50 50 0 0 0 ${170+50*Math.cos(t)} ${165-50*Math.sin(t)}" fill="none" stroke="#187b68" stroke-width="2"/>`+text(245,187,`${deg}°`);break}
  case 'intersecting-lines':{
   const g=intersectingAngleGeometry(d),segment=([a,b]:[number[],number[]])=>line(a[0],a[1],b[0],b[1]);
   const arc=(points:number[][])=>`<polyline points="${points.map(([x,y])=>`${x.toFixed(3)},${y.toFixed(3)}`).join(' ')}" fill="none" stroke="#187b68" stroke-width="2.4"/>`;
   parts=segment(g.horizontal)+segment(g.diagonal)+arc(g.givenArc)+arc(g.unknownArc)
    +text(g.givenLabel[0],g.givenLabel[1]+5,`${g.givenDegrees}°`)
    +text(g.unknownLabel[0],g.unknownLabel[1]+5,'?');
   break}
  case 'line':{
   const n=v[0],left=d.labels?.[0]??'A',right=d.labels?.[1]??'B';
   parts=line(80,110,365,110);
   if(n!==2)parts+=`<circle cx="80" cy="110" r="5" fill="#172337"/>`;
   if(n===0)parts+=`<circle cx="365" cy="110" r="5" fill="#172337"/>`;
   if(n>=1)parts+=`<path d="M374 110l-15 -8v16z" fill="#1b64a5"/>`;
   if(n===2)parts+=`<path d="M71 110l15 -8v16z" fill="#1b64a5"/>`;
   if(n===1)parts+=`<circle cx="269" cy="110" r="5" fill="#172337"/>`;
   if(n===2)parts+=`<circle cx="145" cy="110" r="5" fill="#172337"/><circle cx="300" cy="110" r="5" fill="#172337"/>`;
   parts+=text(n===2?145:80,90,left)+text(n===2?300:n===1?269:365,90,right);
   break}
  case 'scatter':{
   const px=(n:number)=>80+(n/7)*315,py=(n:number)=>176-(n/10)*150;
   for(let i=0;i<=7;i++){parts+=`<line x1="${px(i)}" y1="26" x2="${px(i)}" y2="176" stroke="#e1e8ee" stroke-width="1"/>`+text(px(i),199,String(i));}
   for(let j=0;j<=10;j+=2){parts+=`<line x1="80" y1="${py(j)}" x2="395" y2="${py(j)}" stroke="#e1e8ee" stroke-width="1"/>`+text(59,py(j)+5,String(j));}
   parts+=line(80,176,398,176)+line(80,176,80,23)+text(412,177,'x')+text(82,19,'y');
   if(!d.labels?.includes('plot')||showSolution){
    for(const [u,z] of scatterGeometry(d)){
     parts+=`<circle class="${d.labels?.includes('plot')?'scatter-solution-point':'scatter-data-point'}" cx="${80+u*315}" cy="${176-z*150}" r="5" fill="#187b68"/>`;
    }
   }
   break;
  }
  case 'box-practice':{
   const axis=boxPracticeAxis(v),toX=(value:number)=>75+300*axis.position(value);
   parts=line(65,112,395,112)+`<path d="M65 112l9 -6v12zM395 112l-9 -6v12z" fill="#1b64a5"/>`;
   for(const tick of axis.ticks){const x=toX(tick);parts+=line(x,103,x,121)+text(x,146,String(tick));}
   if(showSolution){
    const q=quartiles(v),x1=toX(q.q1),x2=toX(q.q3);
    parts+=line(toX(q.lower),112,toX(q.upper),112)+line(toX(q.lower),94,toX(q.lower),130)+line(toX(q.upper),94,toX(q.upper),130);
    parts+=`<rect class="solution-box" x="${x1}" y="91" width="${Math.max(1,x2-x1)}" height="42" fill="#e9f2f9" stroke="#187b68" stroke-width="3"/>`;
    parts+=line(toX(q.median),91,toX(q.median),133);
    for(const outlier of q.outliers)parts+=`<circle class="solution-outlier" cx="${toX(outlier)}" cy="112" r="6" fill="white" stroke="#a44127" stroke-width="3"/>`;
   }
   parts+=text(225,184,showSolution?'Modified box plot (outliers separate)':'Draw the box, median and whiskers after solving');
   break}
  case 'box':{
   const all=[...v],lo=Math.min(...all),hi=Math.max(...all),range=Math.max(1,hi-lo),sx=(n:number)=>80+(n-lo)/range*310;
   parts=line(65,120,395,120)+`<rect x="${sx(v[1])}" y="90" width="${Math.max(1,sx(v[3])-sx(v[1]))}" height="60" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/>`;
   parts+=line(sx(v[2]),90,sx(v[2]),150)+line(sx(v[0]),95,sx(v[0]),145)+line(sx(v[4]),95,sx(v[4]),145);
   for(const outlier of v.slice(5))parts+=`<circle cx="${sx(outlier)}" cy="120" r="6" fill="white" stroke="#a44127" stroke-width="3"/>`;
   parts+=text(225,185,'Whiskers exclude outliers');break}
  case 'dots':{parts=Array.from({length:v[0]},(_,i)=>`<circle cx="${85+(i%6)*54}" cy="${65+Math.floor(i/6)*64}" r="16" fill="#187b68"/>`).join('');break}
  default:return '';
 }
 return `<svg class="diagram-vector" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Worksheet ${esc(d.kind)} diagram" viewBox="0 0 450 220" width="450" height="220">${parts}</svg>`;
}
