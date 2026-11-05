import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sampleProblem,makeWorksheet,quartiles,rational,addR,mulR,asText,Rng} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
const routes=JSON.parse(fs.readFileSync(new URL('../src/data/routes.json',import.meta.url)));
const available=routes.filter(r=>r.type!=='HOLD');
test('route contract: 55 unique candidates, four HOLD excluded from generators',()=>{
 assert.equal(routes.length,55);assert.equal(available.length,51);
 assert.equal(new Set(routes.map(x=>x.slug)).size,55);
 assert.equal(routes.filter(x=>x.type==='HOLD').length,4);
 assert.equal(routes.filter(x=>x.type==='CONDITIONAL_HUB').length,8);
});
test('exact rational arithmetic and denominator normalization',()=>{
 assert.equal(asText(addR(rational(1n,2n),rational(1n,3n))),'5/6');
 assert.equal(asText(mulR(rational(2n,3n),rational(3n,4n))),'1/2');
 assert.equal(asText(rational(-4n,-6n)),'2/3');
 assert.equal(asText(rational(0n,10n)),'0');
 assert.throws(()=>rational(4n,0n));
});
test('quartiles use exclusive median-of-halves with observable outliers',()=>{
 const q=quartiles([1,2,3,4,5]);assert.deepEqual([q.q1,q.median,q.q3],[1.5,3,4.5]);
 const o=quartiles([1,2,3,4,5,6,7,30]);assert.equal(o.q1,2.5);assert.equal(o.q3,6.5);assert.deepEqual(o.outliers,[30]);assert.equal(o.upper,7);
});
test('PRNG zero seed mapping and stable unsigned sequence',()=>{
 const a=new Rng(0),b=new Rng(0);assert.deepEqual(Array.from({length:20},()=>a.next()),Array.from({length:20},()=>b.next()));
});
test('all generated topics have nonempty answers, steps and reproducible 8 question sheets',()=>{
 for(const r of available){
  const a=makeWorksheet(r.slug,20261104,8,'standard');const b=makeWorksheet(r.slug,20261104,8,'standard');
  assert.deepEqual(a,b,`deterministic: ${r.slug}`);
  assert.equal(a.problems.length,8);assert.equal(a.answerMap.length,8);
  assert.equal(new Set(a.problems.map(p=>JSON.stringify([p.payload.question,p.diagramSpec??null]))).size,8,`unique questions ${r.slug}`);
  for(let i=0;i<8;i++){const p=a.problems[i];assert.ok(p.payload.question&&p.expectedAnswer&&p.solutionSteps.length,`complete ${r.slug}`);assert.equal(p.id,a.answerMap[i].id);assert.equal(p.expectedAnswer,a.answerMap[i].answer);}
 }
});
test('51 topics x 1000 deterministic seeds: no crashes and problem object invariants',()=>{
 for(const r of available)for(let seed=0;seed<1000;seed++){
  const p=sampleProblem(r.slug,seed,'standard');
  assert.equal(p.topicId,r.slug);assert.equal(p.seed,seed);assert.ok(p.payload.question.length>0);assert.ok(p.expectedAnswer.length>0);assert.ok(p.solutionSteps.length>0);
  assert.ok(p.solutionSteps.every(x=>x.length>0));
 }
});
test('seed diversity across 100 worksheets per topic >= 95% unique',()=>{
 for(const r of available){const fingerprints=new Set();for(let i=0;i<100;i++){const w=makeWorksheet(r.slug,100+i,8);fingerprints.add(w.problems.map(p=>JSON.stringify([p.payload.question,p.diagramSpec??null])).join('|'));}assert.ok(fingerprints.size>=95,`${r.slug}: only ${fingerprints.size} unique`);}
});
test('boundary rejection',()=>{
 assert.throws(()=>makeWorksheet('one-step-equations-worksheets',1,0));
 assert.throws(()=>makeWorksheet('one-step-equations-worksheets',1,41));
 assert.throws(()=>makeWorksheet('one-step-equations-worksheets',-1,8));
 assert.throws(()=>sampleProblem('word-problems-worksheets',1));
});
test('known algebraic and geometry answers by substitution, independent of generated explanation',()=>{
 for(let i=0;i<500;i++){
  const p=sampleProblem('two-step-equations-worksheets',i);
  const match=p.payload.question.match(/^Solve: (-?\d+)x (\+|−) (\d+) = (-?\d+)$/);
  assert.ok(match);const coef=+match[1],sign=match[2]==='+'?1:-1,k=+match[3],rhs=+match[4],x=+p.expectedAnswer.replace('x = ','');
  assert.equal(coef*x+sign*k,rhs);
  const ar=sampleProblem('area-of-triangles-worksheets',i),m=ar.payload.question.match(/base (\d+) and height (\d+)/);
  assert.ok(m);assert.equal(Number(ar.expectedAnswer),Number(m[1])*Number(m[2])/2);
  const f=sampleProblem('adding-unlike-fractions-worksheets',i),v=f.payload.question.match(/(\d+)\/(\d+) \+ (\d+)\/(\d+)/);
  assert.ok(v);const expected=addR(rational(BigInt(v[1]),BigInt(v[2])),rational(BigInt(v[3]),BigInt(v[4])));assert.equal(f.expectedAnswer,asText(expected));
 }
});

test('unlike-fraction generator never produces equal denominators in 5000 seeds',()=>{
 for(let i=0;i<5000;i++){
  const p=sampleProblem('adding-unlike-fractions-worksheets',i);
  const m=p.payload.question.match(/(\d+)\/(\d+) \+ (\d+)\/(\d+)/);
  assert.ok(m);
  assert.notEqual(m[2],m[4],`seed ${i}: equal denominators`);
  const oracle=addR(rational(BigInt(m[1]),BigInt(m[2])),rational(BigInt(m[3]),BigInt(m[4])));
  assert.equal(p.expectedAnswer,asText(oracle));
 }
});
test('number line uses a dynamic scale for every generated endpoint',()=>{
 for(const topic of ['number-line-worksheets','inequalities-worksheets'])for(let i=0;i<2000;i++){
  const d=sampleProblem(topic,i).diagramSpec;
  assert.equal(d.kind,'numberline');
  const svg=diagramSVG(d);
  assert.ok(!svg.includes('<circle cx='),`practice sheet must not include solved endpoint: ${topic} ${i}`);
  assert.ok(!svg.includes('Point:'),`fallback hides endpoint: ${topic} ${i}`);
  assert.ok(!svg.includes('NaN')&&!svg.includes('Infinity'));
 }
});
test('boxplot vector shows whisker range and each outlier as separate marker',()=>{
 const sample={kind:'box',values:[1,2.5,4.5,6.5,7,30]};
 const svg=diagramSVG(sample);
 assert.ok(svg.includes('Whiskers exclude outliers'));
 assert.equal((svg.match(/<circle/g)||[]).length,1);
 assert.ok(svg.includes('stroke="#a44127"'));
 const q=quartiles([1,2,3,4,5,6,7,30]);
 assert.deepEqual([q.lower,q.upper,...q.outliers],[1,7,30]);
});

import {PROTRACTOR_RADIUS_MM,PROTRACTOR_CALIBRATION_MM,PROTRACTOR_RADIUS_PT,PROTRACTOR_CALIBRATION_PT,POINTS_PER_MM} from '../src/lib/protractor.ts';
test('protractor SVG 0-degree and 180-degree endpoint captions sit above the baseline',()=>{
 const svg=diagramSVG({kind:'protractor',values:[50]});
 assert.match(svg,/<text x=\"142\.00\" y=\"81\.00\"[^>]*>0<\/text>/);
 assert.match(svg,/<text x=\"38\.00\" y=\"81\.00\"[^>]*>180<\/text>/);
});
test('protractor physical geometry contract is exactly 72 mm radius and 50 mm ruler',()=>{
 assert.equal(PROTRACTOR_RADIUS_MM,72);assert.equal(PROTRACTOR_CALIBRATION_MM,50);
 assert.ok(Math.abs(PROTRACTOR_RADIUS_PT/POINTS_PER_MM-72)<1e-10);
 assert.ok(Math.abs(PROTRACTOR_CALIBRATION_PT/POINTS_PER_MM-50)<1e-10);
});

test('R11 printable column multiplication preserves the long-form working area without printing answers',()=>{
 for(const topic of [
  'two-digit-multiplication-worksheets',
  'two-digit-by-one-digit-multiplication-worksheets',
  'three-digit-by-two-digit-multiplication-worksheets'
 ])for(let seed=0;seed<200;seed++){
  const problem=sampleProblem(topic,seed);
  assert.equal(problem.diagramSpec?.kind,'column-multiplication',`${topic} seed=${seed}`);
  const [a,b]=problem.diagramSpec.values;
  assert.ok(a>=10&&b>=1);
  assert.equal(Number(problem.expectedAnswer),a*b);
  const svg=diagramSVG(problem.diagramSpec);
  assert.ok(svg.includes('Answer:'));
  if(b>=10)assert.ok(svg.includes('tens'));
  assert.ok(svg.includes('font-family='));
  assert.ok(!svg.includes(`<text>${problem.expectedAnswer}</text>`));
  assert.ok(!svg.includes('NaN')&&!svg.includes('Infinity'));
 }
});

test('R11 long division worksheet uses the actual dividend and divisor in an unsolved bracket',()=>{
 for(let seed=0;seed<200;seed++){
  const problem=sampleProblem('long-division-worksheets',seed);
  assert.equal(problem.diagramSpec?.kind,'long-division');
  const [dividend,divisor]=problem.diagramSpec.values;
  const found=problem.expectedAnswer.match(/^(\d+) R (\d+)$/);
  assert.ok(found);
  assert.equal(dividend,divisor*Number(found[1])+Number(found[2]));
  assert.ok(Number(found[2])<divisor);
  const svg=diagramSVG(problem.diagramSpec);
  assert.ok(svg.includes('remainder: ______'));
  assert.ok(svg.includes('quotient: ______'));
  assert.ok(!svg.includes('NaN'));
 }
});

test('R11 number recognition never doubles the displayed dots',()=>{
 for(let seed=0;seed<100;seed++){
  const p=sampleProblem('number-recognition-worksheets',seed,'standard',{task:'count-dots'});
  assert.equal(p.payload.question,'Count the dots shown below.');
  assert.equal(p.diagramSpec?.kind,'dots');
  const svg=diagramSVG(p.diagramSpec);
  assert.equal((svg.match(/<circle\s/g)||[]).length,Number(p.expectedAnswer),`seed ${seed}`);
  assert.ok(!p.payload.question.includes('●'));
 }
});

test('R11 integrity treats identical visible text with different mathematical diagrams as distinct questions',async()=>{
 const {assertWorksheetIntegrity}=await import('../src/lib/sheet-integrity.ts');
 const set=makeWorksheet('number-recognition-worksheets',20261104,12,'standard',{task:'count-dots'});
 assert.equal(new Set(set.problems.map(p=>p.payload.question)).size,1);
 assert.equal(new Set(set.problems.map(p=>p.diagramSpec.values[0])).size,12);
 assert.doesNotThrow(()=>assertWorksheetIntegrity(set));
 // Reusing a visual diagram in another item is a genuine duplicate even when the text is unchanged.
 const forged=structuredClone(set);
 forged.problems[1].diagramSpec=structuredClone(forged.problems[0].diagramSpec);
 assert.throws(()=>assertWorksheetIntegrity(forged),/Duplicate question/);
});
