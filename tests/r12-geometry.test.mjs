import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem} from '../src/lib/math.ts';
import {angleTriangleLayout} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
const angle=(a,p,b)=>{
 const u=[a[0]-p[0],a[1]-p[1]],v=[b[0]-p[0],b[1]-p[1]];
 const cosine=(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v));
 return Math.acos(Math.min(1,Math.max(-1,cosine)))*180/Math.PI;
};
test('R12 triangle diagram preserves mathematically exact acute, right and obtuse angles',()=>{
 for(const kind of ['acute','right','obtuse'])for(let seed=0;seed<1000;seed++){
  const p=sampleProblem('triangle-angle-sum-worksheets',seed,'standard',{thirdAngle:kind});
  const d=p.diagramSpec,g=angleTriangleLayout(d),[a,b,c]=g.vertices;
  const actual=[angle(c,a,b),angle(a,b,c),angle(a,c,b)];
  for(let i=0;i<3;i++)assert.ok(Math.abs(actual[i]-d.values[i])<1e-8,'Wrong plotted angle for seed '+seed+' at vertex '+i);
  for(const [x,y] of g.vertices)assert.ok(x>=55&&x<=395&&y>=20&&y<=180,'Triangle spilled out of canvas');
  const svg=diagramSVG(d);
  assert.match(svg,/<polygon points=/);
  assert.ok(svg.includes(String(d.values[0])+'°')&&svg.includes(String(d.values[1])+'°'));
  assert.deepEqual([...svg.matchAll(/>(\d+)°<\/text>/g)].map(v=>Number(v[1])),d.values.slice(0,2));
  assert.match(svg,/>[?]<\/text>/);
 }
});
test('R12 rejects impossible triangle dimensions and angles',()=>{
 for(const values of [[50,60,60],[0,90,90],[1,1,177],[NaN,90,90],[90,90,90]])assert.throws(()=>angleTriangleLayout({kind:'triangle-angles',values}));
});
test('R12 missing heights remain masked in geometric diagrams',()=>{
 for(const topic of ['area-of-triangles-worksheets','area-of-parallelograms-worksheets','area-of-trapezoids-worksheets','volume-of-rectangular-prisms-worksheets']){
  const p=sampleProblem(topic,82,'standard',{task:'missing-height'});
  const svg=diagramSVG(p.diagramSpec);
  if(topic==='volume-of-rectangular-prisms-worksheets'){
   assert.match(svg,/class="prism-dimension prism-height"[^>]*>Height: \?<\/text>/);
   assert.ok(!svg.includes('>Height: '+p.expectedAnswer+'</text>'));
  }else assert.match(svg,/>\?(?: height)?<\/text>/);
  assert.equal(p.diagramSpec.values.length,topic==='area-of-trapezoids-worksheets'||topic==='volume-of-rectangular-prisms-worksheets'?2:1);
 }
});
