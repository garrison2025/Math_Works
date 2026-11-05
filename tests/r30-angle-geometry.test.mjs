import test from 'node:test';
import assert from 'node:assert/strict';
import {angleRayLayout} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {makeWorksheet} from '../src/lib/math.ts';

test('R30: 179 mathematically accurate printed angles stay inside SVG bounds',()=>{
 for(let degrees=1;degrees<=179;degrees++){
  const g=angleRayLayout({kind:'angle',values:[degrees]});
  for(const point of [g.vertex,g.baseline,g.ray,g.label,...g.arc]){
   assert.ok(point[0]>=35&&point[0]<=415);
   assert.ok(point[1]>=20&&point[1]<=200);
  }
  const observed=Math.atan2(g.vertex[1]-g.ray[1],g.ray[0]-g.vertex[0])*180/Math.PI;
  assert.ok(Math.abs(observed-degrees)<1e-10);
  const svg=diagramSVG({kind:'angle',values:[degrees]});
  assert.ok(svg.includes('<polyline points='));
  assert.ok(svg.includes(String(degrees)+'°'));
 }
});
test('R30: uniform PDF scaling preserves angles and printer-safe x coordinates',()=>{
 for(const degrees of [1,15,43,89,90,91,112,135,165,179]){
  const g=angleRayLayout({kind:'angle',values:[degrees]});
  const scale=Math.min(235/450,128/220);
  const pos=([x,y])=>[40+235/2+(x-225)*scale,64+(110-y)*scale];
  const v=pos(g.vertex),b=pos(g.baseline),r=pos(g.ray);
  for(const p of [v,b,r,...g.arc.map(pos)])assert.ok(p[0]>36+5);
  const ax=b[0]-v[0],ay=b[1]-v[1],bx=r[0]-v[0],by=r[1]-v[1];
  const observed=Math.acos(Math.max(-1,Math.min(1,(ax*bx+ay*by)/Math.hypot(ax,ay)/Math.hypot(bx,by))))*180/Math.PI;
  assert.ok(Math.abs(observed-degrees)<1e-8);
 }
});
test('R30: generated angle and complementary/supplementary problems fit 36pt margins',()=>{
 let checked=0;
 for(const topic of ['angle-worksheets','complementary-supplementary-angles-worksheets']){
  for(const difficulty of ['standard','challenge'])for(let seed=200;seed<1200;seed+=23){
   const sheet=makeWorksheet(topic,seed,20,difficulty);
   for(const problem of sheet.problems){
    const g=angleRayLayout(problem.diagramSpec);
    for(const p of [g.vertex,g.ray,g.baseline,...g.arc])assert.ok(p[0]>=35&&p[0]<=415);
    checked++;
   }
  }
 }
 assert.ok(checked>=3000);
});
test('R30: invalid angles fail closed',()=>{
 for(const deg of [0,180,-45,181,NaN,Infinity,45.5])
  assert.throws(()=>angleRayLayout({kind:'angle',values:[deg]}),/Angle diagram requires/);
});
