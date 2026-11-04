/** Mathematical plotting contract shared by vector previews and PDF export.
 * Coordinates are in math units, not pixels; scaling happens only in the renderer. */
import type {Diagram} from './math';
export type XY = [number,number];
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

/** Return normalized scatter coordinates, preserving the sign of correlation
 * while keeping every point within both SVG and PDF plotting rectangles. */
export function scatterGeometry(d:Diagram):XY[]{
 if(d.kind!=='scatter'||d.values.length<4||d.values.length%2||!d.values.every(Number.isFinite))throw Error('Invalid scatter data');
 const points:XY[]=[];for(let i=0;i<d.values.length;i+=2)points.push([d.values[i],d.values[i+1]]);
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const spanX=maxX-minX||1,spanY=maxY-minY||1;
 return points.map(([x,y])=>[(x-minX)/spanX,(y-minY)/spanY]);
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
