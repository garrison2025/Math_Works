import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';

// Oracle intentionally recomputes median, quartiles, fences and whisker
// endpoints from the problem's printed values without calling the generator's
// quartile function.
function independentBox(values){
 const s=[...values].sort((a,b)=>a-b),mid=(v)=>(v[v.length/2-1]+v[v.length/2])/2;
 const q1=mid(s.slice(0,4)),med=mid(s),q3=mid(s.slice(4)),iqr=q3-q1;
 const inside=s.filter(x=>x>=q1-1.5*iqr&&x<=q3+1.5*iqr);
 const outside=s.filter(x=>x<q1-1.5*iqr||x>q3+1.5*iqr);
 return {q1,med,q3,lower:inside[0],upper:inside.at(-1),outliers:outside};
}

test('R16: 10,000 independent modified-box-plot constructions retain answer correctness and hidden practice plots',()=>{
 let outlierCases=0;
 for(let seed=0;seed<10000;seed++){
  const p=sampleProblem('box-plots-worksheets',seed,'standard',{statistic:'draw'});
  const values=p.diagramSpec?.values;
  assert.equal(values?.length,8);
  assert.match(p.payload.question,/^Draw a modified box plot for \[/);
  const printed=p.payload.question.match(/\[([\d, ]+)\]/)[1].split(', ').map(Number);
  assert.deepEqual(values,printed);
  const b=independentBox(printed);
  if(b.outliers.length)outlierCases++;
  const expected=`Q1=${b.q1}, median=${b.med}, Q3=${b.q3}; whiskers=${b.lower} to ${b.upper}; outliers=${b.outliers.join(', ')||'none'}`;
  assert.equal(p.expectedAnswer,expected,`seed ${seed}`);
  const questions=diagramSVG(p.diagramSpec),solutions=diagramSVG(p.diagramSpec,true);
  assert.doesNotMatch(questions,/solution-box|solution-outlier|Modified box plot \(outliers separate\)/);
  assert.match(solutions,/class="solution-box"/);
  assert.equal((solutions.match(/class="solution-outlier"/g)||[]).length,b.outliers.length);
 }
 assert.ok(outlierCases>50,`Seed coverage contains only ${outlierCases} outlier examples`);
});

test('R16: draw-mode share links and answer keys exactly reproduce the same seeded worksheet',()=>{
 const slug='box-plots-worksheets',options={statistic:'draw'};
 const payload={seed:0xfab52,difficulty:'challenge',paper:'A4',quantity:8,options};
 const link=buildWorksheetLink(`https://math-works.pages.dev/${slug}/`,slug,payload);
 assert.equal(new URL(link).searchParams.get('gv'),'17','v13 sharing must record the new generator version');
 assert.deepEqual(parseWorksheetLink(link,slug),payload);
 const sheet=makeWorksheet(slug,payload.seed,payload.quantity,payload.difficulty,options);
 const repeat=makeWorksheet(slug,payload.seed,payload.quantity,payload.difficulty,options);
 assert.deepEqual(sheet,repeat);
 assert.equal(sheet.problems.length,8);
 assert.ok(sheet.problems.every(p=>p.diagramSpec?.kind==='box-practice'));
 assert.deepEqual(sheet.answerMap,sheet.problems.map(p=>({id:p.id,answer:p.expectedAnswer})));
});
