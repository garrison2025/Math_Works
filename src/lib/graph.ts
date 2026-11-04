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
  return {kind:d.kind,boundX,boundY,points:[[x,y]],segment:[[xa,m*xa+b],[xb,m*xb+b]]};
 }
 if(d.values.length!==2&&d.values.length!==4)throw Error('Coordinate graph needs one or two points');
 const points:XY[]=d.values.length===2?[[d.values[0],d.values[1]]]:[[d.values[0],d.values[1]],[d.values[2],d.values[3]]];
 const boundX=Math.max(5,Math.ceil(Math.max(...points.map(p=>Math.abs(p[0])))+2));
 const boundY=Math.max(5,Math.ceil(Math.max(...points.map(p=>Math.abs(p[1])))+2));
 return {kind:d.kind,boundX,boundY,points,...(points.length===2?{segment:[points[0],points[1]] as [XY,XY]}:{})};
}
