import type {Diagram} from './math';
import {graphGeometry,scatterGeometry} from './graph.ts';
import {PROTRACTOR_RADIUS_MM,PROTRACTOR_CALIBRATION_MM} from './protractor.ts';
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
/** Vector graphics are generated from the same diagramSpec as the answer object. */
export function diagramSVG(d?:Diagram):string{
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
  case 'triangle':parts=poly('120,155 330,155 225,40')+line(225,40,225,155)+text(225,182,`${v[0]} base`)+text(267,108,`${v[1]===undefined?'?':v[1]} height`)+(v.length>=3?text(133,88,`${v[2]} hyp.`):'');break;
  case 'right-triangle':{const [a,b]=v,s=Math.min(210/a,110/b),xx=120+a*s,yy=160-b*s;parts=poly(`120,160 ${xx},160 120,${yy}`)+line(120,160,135,160)+line(135,160,135,145)+line(135,145,120,145)+text((120+xx)/2,188,`${a} units`)+text(79,(160+yy)/2,`${b} units`);break}
  case 'triangle-angles':parts=poly('120,155 330,155 225,40')+text(166,146,`${v[0]}°`)+text(285,146,`${v[1]}°`)+text(225,79,'?')+text(225,205,'Diagram not to scale');break;
  case 'rectangle':parts=`<rect x="130" y="45" width="190" height="110" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/>`+text(225,178,`${v[0]} units`)+text(345,105,`${v[1]}`);break;
  case 'parallelogram':parts=poly('130,155 310,155 350,48 170,48')+line(170,48,170,155)+text(225,179,`${v[0]}`)+text(151,111,v[1]===undefined?'?':`${v[1]}`);break;
  case 'trapezoid':parts=poly('100,155 360,155 300,49 160,49')+text(230,179,`${v[0]}`)+text(230,40,`${v[1]}`)+text(375,111,v[2]===undefined?'?':`${v[2]}`);break;
  case 'prism':parts=`<rect x="100" y="72" width="190" height="100" fill="#e9f2f9" stroke="#1b64a5" stroke-width="3"/><path d="M100 72 L149 35 H339 V135 L290 172 M290 72 L339 35 M339 135 H149 V35" fill="none" stroke="#1b64a5" stroke-width="3"/>`+text(195,191,`${v[0]}`)+text(310,160,`${v[1]}`)+text(88,120,v[2]===undefined?'?':`${v[2]}`);break;
  case 'numberline':{
   const n=v[0],op=d.labels?.[0],step=Math.max(1,Math.ceil(Math.abs(n)/5)),extent=step*5,px=(z:number)=>225+z/extent*170;
   parts=line(55,105,395,105)+`<path d="M55 105l9 -6v12zM395 105l-9 -6v12z" fill="#1b64a5"/>`;
   for(let i=-5;i<=5;i++){const z=i*step,x=px(z);parts+=line(x,99,x,111)+text(x,137,String(z))}
   // Practice sheets show an unmarked number line. The answer is in the key.
   // This applies to both placement and inequality tasks.
   void op;
   break}
  case 'coordinate':
  case 'linear-function':{
   const g=graphGeometry(d),cx=225,cy=110,bw=172,bh=85;
   const px=(z:number)=>cx+(z/g.boundX)*bw,py=(z:number)=>cy-(z/g.boundY)*bh;
   const tickX=g.boundX<=9?2:g.boundX<=20?5:10,tickY=g.boundY<=9?2:g.boundY<=20?5:10;
   for(let x=-g.boundX;x<=g.boundX;x+=tickX){const xx=px(x);parts+=`<line x1="${xx}" y1="25" x2="${xx}" y2="195" stroke="#e1e8ee" stroke-width="1"/>`;if(x!==0)parts+=text(xx,208,String(x));}
   for(let y=-g.boundY;y<=g.boundY;y+=tickY){const yy=py(y);parts+=`<line x1="53" y1="${yy}" x2="397" y2="${yy}" stroke="#e1e8ee" stroke-width="1"/>`;if(y!==0)parts+=text(43,yy+5,String(y));}
   parts+=line(53,cy,397,cy)+line(cx,25,cx,195)+text(410,cy-8,'x')+text(cx+12,17,'y');
   if(g.segment){const [[x1,y1],[x2,y2]]=g.segment;parts+=`<line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" stroke="#187b68" stroke-width="3"/>`;}
   for(const [x,y] of g.points){parts+=`<circle cx="${px(x)}" cy="${py(y)}" r="5" fill="#187b68" stroke="#fff" stroke-width="2"/>`+text(Math.min(399,px(x)+25),Math.max(18,py(y)-10),`(${x},${y})`);}
   break}
  case 'angle':{const deg=v[0],t=deg*Math.PI/180;parts=line(170,165,380,165)+line(170,165,170+155*Math.cos(t),165-155*Math.sin(t))+`<path d="M220 165 A50 50 0 0 0 ${170+50*Math.cos(t)} ${165-50*Math.sin(t)}" fill="none" stroke="#187b68" stroke-width="2"/>`+text(245,187,`${deg}°`);break}
  case 'line':{const n=v[0];parts=line(80,110,365,110)+(n!==2?`<circle cx="80" cy="110" r="5" fill="#172337"/>`:'')+(n===0?`<circle cx="365" cy="110" r="5" fill="#172337"/>`:'')+(n>=1?`<path d="M374 110l-15 -8v16z" fill="#1b64a5"/>`:'')+(n===2?`<path d="M71 110l15 -8v16z" fill="#1b64a5"/>`:'');break}
  case 'scatter':{const pts=scatterGeometry(d);parts=line(75,175,400,175)+line(75,175,75,20);for(const [u,z] of pts){const x=85+u*300,y=160-z*125;parts+=`<circle cx="${x}" cy="${y}" r="6" fill="#187b68"/>`;}break}
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
