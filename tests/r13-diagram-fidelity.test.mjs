import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {intersectingAngleGeometry} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
const angle=(a,p,b)=>{
 const u=[a[0]-p[0],a[1]-p[1]],v=[b[0]-p[0],b[1]-p[1]];
 return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)))))*180/Math.PI;
};
test('R13 3000 crossing diagrams preserve given, opposite and supplementary angles',()=>{
 for(let seed=0;seed<1500;seed++)for(const mode of ['vertical','adjacent']){
  const p=sampleProblem('vertical-angles-worksheets',seed,'standard',{task:mode}),d=p.diagramSpec;
  assert.equal(d.kind,'intersecting-lines');
  const g=intersectingAngleGeometry(d),c=g.center,[left,right]=g.horizontal,[lower,upper]=g.diagonal;
  const given=angle(upper,c,right),opposite=angle(left,c,lower),adjacent=angle(upper,c,left);
  assert.ok(Math.abs(given-d.values[0])<1e-8);
  assert.ok(Math.abs(opposite-given)<1e-8);
  assert.ok(Math.abs(adjacent+given-180)<1e-8);
  assert.equal(p.expectedAnswer,String(Math.round(mode==='vertical'?given:180-given))+'°');
  assert.equal(g.task,mode);
  const svg=diagramSVG(d);
  assert.match(svg,/<polyline/);
  assert.match(svg,/>\?<\/text>/);
  assert.equal((svg.match(/>\d+°<\/text>/g)||[]).length,1);
 }
});
test('R13 squares and cubes are genuinely equal-sided in rendered SVG geometry',()=>{
 for(let seed=0;seed<200;seed++){
  for(const [topic,option] of [['area-worksheets',{shape:'square'}],['surface-area-worksheets',{solid:'cube'}]]){
   const p=sampleProblem(topic,seed,'standard',option),svg=diagramSVG(p.diagramSpec);
   const rect=svg.match(/<rect x="[^"]+" y="[^"]+" width="(\d+)" height="(\d+)"/);
   assert.ok(rect);assert.equal(rect[1],rect[2],topic+' seed '+seed);
  }
 }
});
test('R13 lines, rays and segments require visual reasoning, with distinct labels',()=>{
 for(const figure of ['line','ray','segment']){
  for(let seed=0;seed<300;seed++){
   const p=sampleProblem('lines-rays-segments-worksheets',seed,'standard',{figure});
   const svg=diagramSVG(p.diagramSpec);
   assert.equal(p.expectedAnswer,figure);
   assert.match(p.payload.question,/Identify the pictured figure/);
   assert.equal((svg.match(/<path/g)||[]).length,figure==='line'?2:figure==='ray'?1:0);
   assert.equal((svg.match(/<circle/g)||[]).length,2);
   assert.equal(p.diagramSpec.labels.length,2);
  }
  assert.equal(makeWorksheet('lines-rays-segments-worksheets',317,40,'standard',{figure}).problems.length,40);
 }
});
