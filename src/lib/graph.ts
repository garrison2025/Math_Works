/** Mathematical plotting contract shared by vector previews and PDF export.
 * Coordinates are in math units, not pixels; scaling happens only in the renderer. */
import type {Diagram} from './math';
export type XY = [number,number];
/** R30 shared print-safe angle geometry: SVG and PDF must preserve true degrees.
 * Center the vertex so even 179 degree rays stay within the printable region. */
export type AngleRayLayout={vertex:XY;baseline:XY;ray:XY;arc:XY[];label:XY;degrees:number};
export function angleRayLayout(d:Diagram):AngleRayLayout {
 if(d.kind!=='angle'||d.values.length<1||!Number.isInteger(d.values[0])||d.values[0]<=0||d.values[0]>=180)
  throw new Error('Angle diagram requires an integer in 1..179 degrees');
 const degrees=d.values[0],theta=degrees*Math.PI/180;
 const vx=225,vy=165,len=135,baselineLength=145,arcRadius=43;
 const polar=(rad:number,radius:number):XY=>[vx+radius*Math.cos(rad),vy-radius*Math.sin(rad)];
 const steps=Math.max(2,Math.ceil(degrees/5)),arc=Array.from({length:steps+1},(_,i)=>polar(theta*i/steps,arcRadius));
 const label=polar(theta/2,76);
 return {vertex:[vx,vy],baseline:[vx+baselineLength,vy],ray:polar(theta,len),arc,label:[label[0],label[1]-9],degrees};
}


export type GraphGeometry = {boundX:number;boundY:number;points:XY[];segment?:[XY,XY];kind:'coordinate'|'linear-function'};
export function graphGeometry(d:Diagram):GraphGeometry {
 if(d.kind!=='coordinate'&&d.kind!=='linear-function')throw Error('Not a Cartesian graph');
 if(!d.values.every(Number.isFinite))throw Error('Non-finite graph point');
 if(d.kind==='linear-function'){
  if(d.values.length!==4)throw Error('Linear graph requires m,b,x,y');
  const [m,b,x,y]=d.values;
  if(Math.abs(m*x+b-y)>1e-9)throw Error('Graph point is not on the stated line');
  const boundX=Math.max(5,Math.ceil(Math.abs(x)+2));
  const boundY=Math.max(6,Math.ceil(Math.abs(y)+3),Math.ceil(Math.abs(b)+3));
  const xa=m===0?-boundX:Math.max(-boundX,Math.min((-boundY-b)/m,(boundY-b)/m));
  const xb=m===0?boundX:Math.min(boundX,Math.max((-boundY-b)/m,(boundY-b)/m));
  if(xa>xb)throw Error('Graph line outside visible plot');
  // Do not put the requested (x,y) answer point on a practice worksheet.
  return {kind:d.kind,boundX,boundY,points:[],segment:[[xa,m*xa+b],[xb,m*xb+b]]};
 }
 if(d.values.length!==2&&d.values.length!==4)throw Error('Coordinate graph needs one or two points');
 const points:XY[]=d.values.length===2?[[d.values[0],d.values[1]]]:[[d.values[0],d.values[1]],[d.values[2],d.values[3]]];
 const boundX=Math.max(5,Math.ceil(Math.max(...points.map(p=>Math.abs(p[0])))+2));
 const boundY=Math.max(5,Math.ceil(Math.max(...points.map(p=>Math.abs(p[1])))+2));
 return {kind:d.kind,boundX,boundY,points,...(points.length===2?{segment:[points[0],points[1]] as [XY,XY]}:{})};
}

/** Shared scatter scale: ticks mark the actual values, not normalized sample minima. */
export function scatterGeometry(d:Diagram):XY[]{
 if(d.kind!=='scatter'||d.values.length!==12||!d.values.every(Number.isInteger))throw Error('Scatter diagram requires six integer pairs');
 const pairs:XY[]=[];
 for(let i=0;i<d.values.length;i+=2){
  const x=d.values[i],y=d.values[i+1];
  if(x!==i/2+1||y<0||y>10)throw Error('Scatter sample outside labeled 0-7 by 0-10 grid');
  pairs.push([x/7,y/10]);
 }
 return pairs;
}
/** Empty five-number-summary axis. Inputs are observed raw values, never calculated
 * quartiles, whisker endpoints or outlier locations (which would disclose answers). */
export function boxPracticeAxis(values:readonly number[]){
 if(values.length<4||!values.every(v=>Number.isFinite(v)&&Number.isInteger(v)))throw Error('Invalid box-plot sample');
 const min=Math.min(...values),max=Math.max(...values),spread=Math.max(1,max-min);
 const magnitude=10**Math.floor(Math.log10(spread/7));
 const step=[1,2,5,10].map(v=>v*magnitude).find(v=>spread/v<=9)??10*magnitude;
 const start=Math.floor(min/step)*step,end=Math.ceil(max/step)*step;
 const extent=Math.max(step,end-start),ticks:number[]=[];
 for(let v=start;v<=end+step*1e-8;v+=step)ticks.push(Number(v.toFixed(8)));
 return {start,end,step,ticks,position:(value:number)=>(value-start)/extent};
}


/** Triangle interior angles to exact coordinate geometry, fitted at uniform scale. */
export type AngleTriangleLayout = {vertices:[XY,XY,XY];labelPositions:[XY,XY,XY]};
export function angleTriangleLayout(d:Diagram):AngleTriangleLayout {
 if(d.kind!=='triangle-angles'||d.values.length!==3||!d.values.every(z=>Number.isInteger(z)&&z>0)||d.values.reduce((a,b)=>a+b,0)!==180)throw Error('Invalid interior-angle triangle');
 const [left,right,top]=d.values.map(z=>z*Math.PI/180);
 const apex:XY=[Math.sin(right)*Math.cos(left)/Math.sin(top),Math.sin(right)*Math.sin(left)/Math.sin(top)];
 if(!apex.every(Number.isFinite)||apex[1]<=0)throw Error('Degenerate triangle');
 const raw:XY[]=[[0,0],[1,0],apex];
 const minX=Math.min(...raw.map(p=>p[0])),maxX=Math.max(...raw.map(p=>p[0]));
 const height=apex[1],scale=Math.min(300/(maxX-minX),130/height);
 const centerX=225-(minX+maxX)*scale/2;
 const plot=(p:XY):XY=>[centerX+p[0]*scale,165-p[1]*scale];
 const vertices=raw.map(plot) as [XY,XY,XY];
 const labelPositions=vertices.map((v,i)=>{
  const other=vertices.filter((_,k)=>k!==i);
  return [v[0]*.62+(other[0][0]+other[1][0])*.19,v[1]*.62+(other[0][1]+other[1][1])*.19] as XY;
 }) as [XY,XY,XY];
 return {vertices,labelPositions};
}

/** Shared SVG/PDF geometry for two actually intersecting straight lines. */
export type IntersectingAngleGeometry = {
 center:XY;horizontal:[XY,XY];diagonal:[XY,XY];
 givenArc:XY[];unknownArc:XY[];givenLabel:XY;unknownLabel:XY;
 givenDegrees:number;unknownDegrees:number;task:'vertical'|'adjacent';
};
export function intersectingAngleGeometry(d:Diagram):IntersectingAngleGeometry {
 if(d.kind!=='intersecting-lines'||d.values.length!==2||
    !Number.isInteger(d.values[0])||d.values[0]<1||d.values[0]>179||
    !(d.values[1]===0||d.values[1]===1))throw Error('Invalid intersecting-line problem');
 const degrees=d.values[0],adjacent=d.values[1]===1,center:XY=[225,110];
 const at=(angle:number,r:number):XY=>[
  center[0]+r*Math.cos(angle*Math.PI/180),
  center[1]-r*Math.sin(angle*Math.PI/180)
 ];
 const arc=(first:number,last:number)=>{
  const steps=Math.max(2,Math.ceil((last-first)/5)+1);
  return Array.from({length:steps},(_,i)=>at(first+(last-first)*i/(steps-1),32));
 };
 const from=adjacent?degrees:180,to=adjacent?180:180+degrees;
 return {
  center,horizontal:[[70,110],[380,110]],diagonal:[at(degrees+180,97),at(degrees,97)],
  givenArc:arc(0,degrees),unknownArc:arc(from,to),
  givenLabel:at(degrees/2,70),unknownLabel:at((from+to)/2,70),
  givenDegrees:degrees,unknownDegrees:adjacent?180-degrees:degrees,task:adjacent?'adjacent':'vertical'
 };
}

/** R44 common SVG/PDF schematic layout for an area-of-trapezoid prompt.
 * Width ordering reflects the given parallel bases, including a wider TOP
 * base. A legibility floor prevents tiny two-unit edges from disappearing
 * on a printable sheet; dimensions are therefore explicitly NOT TO SCALE.
 * Existing deterministic question/answer engine inputs are unchanged.
 */
export type TrapezoidLayout={
 bottomLeft:number;bottomRight:number;topLeft:number;topRight:number;
 topY:number;bottomY:number;altitudeX:number;bottomWidth:number;topWidth:number;
};
export function trapezoidLayout(d:Diagram):TrapezoidLayout{
 if(d.kind!=='trapezoid'||(d.values.length!==2&&d.values.length!==3)||
  !d.values.every(v=>Number.isFinite(v)&&v>0))
  throw Error('Trapezoid diagram requires two positive parallel bases and optional height');
 const [bottom,top]=d.values;
 const biggest=Math.max(bottom,top),maxWidth=.76,minWidth=.18;
 const bottomWidth=Math.max(minWidth,maxWidth*bottom/biggest);
 const topWidth=Math.max(minWidth,maxWidth*top/biggest);
 const bottomLeft=(1-bottomWidth)/2,topLeft=(1-topWidth)/2;
 const bottomRight=1-bottomLeft,topRight=1-topLeft;
 const altitudeX=Math.max(bottomLeft,topLeft);
 const topY=.23,bottomY=.72;
 return {bottomLeft,bottomRight,topLeft,topRight,
  topY,bottomY,altitudeX,bottomWidth,topWidth};
}
