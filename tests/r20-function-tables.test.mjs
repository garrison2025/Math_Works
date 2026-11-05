import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,GENERATOR_VERSION} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {functionTableGeometry} from '../src/lib/function-table.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';

const topic='function-tables-worksheets';
test('R20: 18,000 independent forward and inverse table calculations',()=>{
 for(const task of ['output','input','mixed'])for(const difficulty of ['easy','standard','challenge'])for(let seed=1;seed<=2000;seed++){
  const p=sampleProblem(topic,seed,difficulty,{task});
  assert.equal(p.diagramSpec?.kind,'function-table');
  const d=p.diagramSpec,g=functionTableGeometry(d),[m,b]=d.values;
  assert.equal(new Set(g.inputs).size,3);
  for(let i=0;i<3;i++)assert.equal(g.outputs[i],m*g.inputs[i]+b);
  assert.equal(Number(p.expectedAnswer),g.missingRole==='input'?g.inputs[g.position]:g.outputs[g.position]);
  if(task!=='mixed')assert.equal(g.missingRole,task);
 }
});
test('R20: practice SVG leaves exactly the required cell blank, answer SVG completes it',()=>{
 for(const task of ['output','input'])for(const missing of ['first','middle','last']){
  const p=sampleProblem(topic,20261105,'standard',{task,missing});
  const q=diagramSVG(p.diagramSpec),a=diagramSVG(p.diagramSpec,true);
  assert.equal((q.match(/>____<\/text>/g)||[]).length,1);
  assert.equal((a.match(/>____<\/text>/g)||[]).length,0);
  assert.ok(!q.includes('solution-cell-answer'));
  assert.match(p.payload.question,new RegExp(`missing ${task}`));
  const g=functionTableGeometry(p.diagramSpec);
  assert.equal(g.position,{first:0,middle:1,last:2}[missing]);
  assert.equal(g.missingRole,task);
 }
});
test('R20: URLs roundtrip position and input/output mode with matching answers',()=>{
 assert.equal(GENERATOR_VERSION,'15');
 for(const task of ['input','output','mixed'])for(const missing of ['first','middle','last']){
  const options={task,missing},sheet=makeWorksheet(topic,120932,16,'challenge',options);
  const url=buildWorksheetLink('https://math-works.pages.dev/function-tables-worksheets/',topic,{seed:sheet.seed,difficulty:'challenge',quantity:16,paper:'A4',options});
  const parsed=parseWorksheetLink(url,topic);
  assert.equal(new URL(url).searchParams.get('gv'),'15');
  assert.deepEqual(parsed.options,options);
  assert.deepEqual(makeWorksheet(topic,parsed.seed,parsed.quantity,parsed.difficulty,parsed.options),sheet);
  assert.equal(new Set(sheet.problems.map(p=>p.payload.question)).size,16);
 }
});
test('R20: invalid or inconsistent table diagrams cannot be rendered',()=>{
 const p=sampleProblem(topic,17);
 const incorrect={...p.diagramSpec,values:[...p.diagramSpec.values]};incorrect.values[5]+=1;
 assert.throws(()=>functionTableGeometry(incorrect),/Inconsistent/);
 assert.throws(()=>diagramSVG(incorrect),/Inconsistent/);
});
