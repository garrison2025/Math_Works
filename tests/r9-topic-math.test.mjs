import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,rational,addR,asText} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {topicOptionDefinitions,maxQuantityForTopic} from '../src/lib/topic-options.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
const pick=(slug,key,value,seed)=>sampleProblem(slug,seed,'standard',{[key]:value});
const read=(str,regex)=>{const m=str.match(regex);assert.ok(m,`Cannot parse ${str}`);return m;};
const integer=(v)=>Number(v);

// Solve new R9 modes using data printed in the question, not generator-internal answers.
test('missing-height geometry independently computes the answer without giving it away in the SVG',()=>{
 for(let seed=0;seed<300;seed++){
  for(const slug of ['area-of-triangles-worksheets','area-of-parallelograms-worksheets','area-of-trapezoids-worksheets']){
   const p=pick(slug,'task','missing-height',seed),q=p.payload.question;
   let actual;
   if(slug==='area-of-triangles-worksheets'){
    const m=read(q,/triangle has base (\d+) and area (\d+(?:\.\d+)?) square units/);
    actual=2*Number(m[2])/Number(m[1]);
    assert.equal(p.diagramSpec.values.length,1);
   }else if(slug==='area-of-parallelograms-worksheets'){
    const m=read(q,/parallelogram has base (\d+) and area (\d+) square units/);
    actual=Number(m[2])/Number(m[1]);assert.equal(p.diagramSpec.values.length,1);
   }else{
    const m=read(q,/trapezoid has bases (\d+), (\d+) and area (\d+(?:\.\d+)?) square units/);
    actual=2*Number(m[3])/(Number(m[1])+Number(m[2]));assert.equal(p.diagramSpec.values.length,2);
   }
   assert.equal(Number(p.expectedAnswer),actual,slug+' seed '+seed);
   const svg=diagramSVG(p.diagramSpec);
   assert.ok(svg.includes('>?<')||svg.includes('>? height<'),slug+' unknown label missing');
  }
 }
});
test('rectangle, square, and cube surface area obey exact formulas in both modes',()=>{
 for(let seed=0;seed<300;seed++){
  let p=pick('area-worksheets','shape','square',seed);
  let m=read(p.payload.question,/square with side (\d+)/);
  assert.equal(Number(p.expectedAnswer),Number(m[1])**2);
  p=pick('surface-area-worksheets','solid','cube',seed);
  m=read(p.payload.question,/cube with side (\d+)/);
  assert.equal(Number(p.expectedAnswer),6*Number(m[1])**2);
  p=pick('surface-area-worksheets','solid','rectangular-prism',seed);
  m=read(p.payload.question,/prism: (\d+) × (\d+) × (\d+)/);
  const [x,y,z]=m.slice(1).map(Number);assert.ok(x!==y||y!==z);
  assert.equal(Number(p.expectedAnswer),2*(x*y+x*z+y*z));
 }
});
test('different fraction sums always match the indicated type and the independently reduced sum',()=>{
 for(let seed=0;seed<500;seed++)for(const v of ['proper','improper']){
  const p=pick('adding-unlike-fractions-worksheets','sumType',v,seed);
  const m=read(p.payload.question,/(\d+)\/(\d+) \+ (\d+)\/(\d+)/);
  const [a,b,c,d]=m.slice(1).map(BigInt);
  assert.notEqual(b,d);const ans=addR(rational(a,b),rational(c,d));
  assert.equal(p.expectedAnswer,asText(ans));
  assert.equal(ans.n<ans.d,v==='proper');
 }
});
test('domain/range, function table and linear function choices give mathematically correct outputs',()=>{
 for(let seed=0;seed<300;seed++){
  for(const v of ['domain','range']){
   const p=pick('domain-range-worksheets','task',v,seed),pairs=[...p.payload.question.matchAll(/\((\d+),(\d+)\)/g)];
   const result=[...new Set(pairs.map(x=>Number(x[v==='domain'?1:2])))].sort((a,b)=>a-b);
   assert.equal(p.expectedAnswer,`{${result.join(', ')}}`);
  }
  for(const v of ['first','middle','last']){
   const p=pick('function-tables-worksheets','missing',v,seed);
   const m=read(p.payload.question,/f\(x\) = (\d+)x ([+−]) (\d+)\./);
   const coeff=Number(m[1]),inter=(m[2]==='+'?1:-1)*Number(m[3]);
   const vals=p.diagramSpec.values;
   assert.equal(p.diagramSpec.kind,'function-table');
   const i=v==='first'?0:v==='middle'?1:2;
   assert.equal(vals[8],i);
   assert.equal(vals[9],0,'Legacy output mode must keep missing output semantics');
   const input=vals[2+i],result=vals[5+i];
   assert.equal(result,coeff*input+inter);
   assert.equal(p.expectedAnswer,String(result));
   const blank=diagramSVG(p.diagramSpec);
   assert.equal((blank.match(/>____<\/text>/g)||[]).length,1);
  }
  for(const sign of ['positive','negative','zero']){
   const p=pick('linear-equations-worksheets','slope',sign,seed);
   const m=read(p.payload.question,/y = (-?\d+)x ([+−]) (\d+), find y when x = (-?\d+)/);
   const slope=Number(m[1]),inter=(m[2]==='+'?1:-1)*Number(m[3]),x=Number(m[4]);
   assert.equal(Number(p.expectedAnswer),slope*x+inter);
   assert.equal(Math.sign(slope),sign==='positive'?1:sign==='negative'?-1:0);
   assert.equal(p.diagramSpec.values[0],slope);
  }
 }
});
test('angle triangles, supplementary angles and MAD obey exact invariants for every new mode',()=>{
 for(let seed=0;seed<300;seed++){
  for(const kind of ['acute','right','obtuse']){
   const p=pick('triangle-angle-sum-worksheets','thirdAngle',kind,seed);
   const m=read(p.payload.question,/angles are (\d+)° and (\d+)°/);
   const deg=180-Number(m[1])-Number(m[2]);assert.equal(p.expectedAnswer,`${deg}°`);
   assert.equal(kind==='acute'?deg<90:kind==='right'?deg===90:deg>90,true);
   assert.equal(diagramSVG(p.diagramSpec).includes('>?<'),true);
  }
  for(const v of ['vertical','adjacent']){
   const p=pick('vertical-angles-worksheets','task',v,seed);
   const m=read(p.payload.question,/an angle of (\d+)°/);
   assert.equal(p.expectedAnswer,`${v==='vertical'?Number(m[1]):180-Number(m[1])}°`);
  }
  for(const distribution of ['symmetric','skewed']){
   const p=pick('mean-absolute-deviation-worksheets','distribution',distribution,seed);
   const m=read(p.payload.question,/\[([-\d, ]+)\]/),xs=m[1].split(', ').map(Number);
   const size=xs.length,total=xs.reduce((a,b)=>a+b,0);
   const numerator=xs.reduce((a,b)=>a+Math.abs(size*b-total),0);
   assert.equal(p.expectedAnswer,asText(rational(BigInt(numerator),BigInt(size*size))));
  }
 }
});
test('R9 selector state and currently versioned shared links reproduce the same worksheet',()=>{
 assert.equal(Object.keys(topicOptionDefinitions).length,51);
 const samples=[['function-tables-worksheets',{missing:'first',task:'output'}],['surface-area-worksheets',{solid:'cube'}],['triangle-angle-sum-worksheets',{thirdAngle:'obtuse'}],['number-recognition-worksheets',{task:'word-to-numeral'}]];
 for(const [slug,options] of samples){
  const cap=maxQuantityForTopic(slug,options,'standard');const quantity=cap>=8?8:4;
  const settings={seed:1765,difficulty:'standard',quantity,paper:'A4',options};
  const link=buildWorksheetLink(`https://math-works.pages.dev/${slug}/`,slug,settings);
  assert.equal(new URL(link).searchParams.get('gv'),'13');
  const restored=parseWorksheetLink(link,slug);
  assert.deepEqual(restored.options,options);
  const lhs=makeWorksheet(slug,1765,quantity,'standard',options);
  const rhs=makeWorksheet(slug,1765,quantity,'standard',restored.options);
  assert.deepEqual(lhs,rhs);
 }
});
