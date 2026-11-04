import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';

// Independent oracle: rederive quartiles and 1.5 IQR fences from printed data.
const independentBox=(data)=>{
 const s=[...data].sort((a,b)=>a-b),mid=v=>(v[v.length/2-1]+v[v.length/2])/2;
 const q1=mid(s.slice(0,4)),med=mid(s),q3=mid(s.slice(4)),iqr=q3-q1;
 const inside=s.filter(v=>v>=q1-1.5*iqr&&v<=q3+1.5*iqr);
 const outside=s.filter(v=>v<q1-1.5*iqr||v>q3+1.5*iqr);
 return {q1,med,q3,lower:inside[0],upper:inside.at(-1),outliers:outside};
};

test('R16: 10k constructed box plots independently validate quartiles, whiskers, outliers and nonleaking diagrams',()=>{
 let outlierCases=0;
 for(let seed=0;seed<10000;seed++){
  const p=sampleProblem('box-plots-worksheets',seed,'standard',{statistic:'draw'});
  assert.equal(p.diagramSpec?.kind,'box-practice');
  const data=p.payload.question.match(/\[([\d, ]+)\]/)[1].split(', ').map(Number);
  assert.deepEqual(p.diagramSpec.values,data);
  const b=independentBox(data); if(b.outliers.length)outlierCases++;
  const ans='Q1='+b.q1+', median='+b.med+', Q3='+b.q3+'; whiskers='+b.lower+' to '+b.upper+'; outliers='+(b.outliers.join(', ')||'none');
  assert.equal(p.expectedAnswer,ans,'seed '+seed);
  const practice=diagramSVG(p.diagramSpec),answer=diagramSVG(p.diagramSpec,true);
  assert.doesNotMatch(practice,/solution-box|solution-outlier|Modified box plot \(outliers separate\)/);
  assert.match(answer,/class="solution-box"/);
  assert.equal((answer.match(/class="solution-outlier"/g)||[]).length,b.outliers.length);
 }
 assert.ok(outlierCases>50);
});

test('R16: share links preserve box-plot drawing settings and exact answer maps',()=>{
 const slug='box-plots-worksheets',options={statistic:'draw'};
 const payload={seed:20261105,quantity:8,difficulty:'challenge',paper:'A4',options};
 const url=buildWorksheetLink('https://math-works.pages.dev/box-plots-worksheets/',slug,payload);
 assert.equal(new URL(url).searchParams.get('gv'),'7');
 assert.deepEqual(parseWorksheetLink(url,slug),payload);
 const a=makeWorksheet(slug,payload.seed,payload.quantity,payload.difficulty,options);
 const b=makeWorksheet(slug,payload.seed,payload.quantity,payload.difficulty,options);
 assert.deepEqual(a,b);assert.equal(a.problems.length,8);
 assert.deepEqual(a.answerMap,a.problems.map(p=>({id:p.id,answer:p.expectedAnswer})));
});
