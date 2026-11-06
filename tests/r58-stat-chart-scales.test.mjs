/** R58 independent statistics chart geometry checks.
 * Read actual SVG attributes; derive expected graph coordinates and quartiles
 * from the raw question data, not from the renderer's solution helpers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {boxPracticeAxis} from '../src/lib/graph.ts';
import {PDFDocument} from 'pdf-lib';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);
const extract=(svg,re)=>[...svg.matchAll(re)].map(m=>m.slice(1).map(Number));
function independentBox(raw){
 const s=[...raw].sort((a,b)=>a-b);
 const med2=(a,b)=>(a+b)/2;
 const q1=med2(s[1],s[2]),median=med2(s[3],s[4]),q3=med2(s[5],s[6]);
 const iqr=q3-q1,lowerFence=q1-1.5*iqr,upperFence=q3+1.5*iqr;
 const inside=s.filter(n=>n>=lowerFence&&n<=upperFence);
 const outside=s.filter(n=>n<lowerFence||n>upperFence);
 return {q1,median,q3,lower:inside[0],upper:inside.at(-1),outliers:outside};
}

test('R58 scatter graph: 3 trends x 2 tasks x 3 difficulties, 2700 independent axis/point audits',()=>{
 let checked=0;
 for(const trend of ['positive','negative','none'])
 for(const task of ['identify','plot'])
 for(const difficulty of ['easy','standard','challenge'])
 for(let seed=1;seed<=150;seed++){
  const p=sampleProblem('scatter-plot-worksheets',seed,difficulty,{trend,task});
  const pairs=Array.from({length:6},(_,i)=>[p.diagramSpec.values[i*2],p.diagramSpec.values[i*2+1]]);
  const blank=diagramSVG(p.diagramSpec),answer=diagramSVG(p.diagramSpec,true);
  const gridX=extract(blank,/class="scatter-grid-x" data-value="([^"]+)" x1="([^"]+)" y1="26"/g);
  const gridY=extract(blank,/class="scatter-grid-y" data-value="([^"]+)" x1="80" y1="([^"]+)"/g);
  assert.deepEqual(gridX.map(row=>row[0]),[0,1,2,3,4,5,6,7]);
  assert.deepEqual(gridY.map(row=>row[0]),[0,2,4,6,8,10]);
  for(const [value,x] of gridX)near(x,80+315*value/7,'scatter x tick');
  for(const [value,y] of gridY)near(y,176-150*value/10,'scatter y tick');
  const klass=task==='plot'?'scatter-solution-point':'scatter-data-point';
  const pattern=new RegExp('<circle class="'+klass+'" cx="([^"]+)" cy="([^"]+)"','g');
  const displayed=extract(task==='plot'?answer:blank,pattern);
  assert.equal(displayed.length,6);
  pairs.forEach(([x,y],i)=>{
    assert.equal(x,i+1);
    assert.ok(y>=0&&y<=10&&Number.isInteger(y));
    near(displayed[i][0],80+315*x/7,'scatter point x');
    near(displayed[i][1],176-150*y/10,'scatter point y');
  });
  if(task==='plot'){
   assert.equal(extract(blank,/class="scatter-solution-point" cx="([^"]+)" cy="([^"]+)"/g).length,0);
   assert.deepEqual([...p.expectedAnswer.matchAll(/\((\d+), (\d+)\)/g)].map(m=>[+m[1],+m[2]]),pairs);
  }else{
   assert.equal(extract(blank,/class="scatter-data-point" cx="([^"]+)" cy="([^"]+)"/g).length,6);
   const cov=pairs.reduce((sum,[x,y])=>sum+(x-3.5)*(y-pairs.reduce((acc,[,v])=>acc+v,0)/6),0);
   assert.equal(p.expectedAnswer,Math.abs(cov)<1e-9?'no clear linear trend':cov>0?'positive':'negative');
  }
  checked++;
 }
 assert.equal(checked,2700);
});

test('R58 modified box plots: 1200 raw-data oracles and exact SVG tick / median / outlier positions',()=>{
 let outliers=0;
 for(const difficulty of ['easy','standard','challenge'])
 for(let seed=1;seed<=400;seed++){
  const p=sampleProblem('box-plots-worksheets',seed,difficulty,{statistic:'draw'});
  const d=p.diagramSpec,raw=d.values,stats=independentBox(raw);
  const axis=boxPracticeAxis(raw),practice=diagramSVG(d),solution=diagramSVG(d,true);
  assert.equal(p.expectedAnswer,
   `Q1=${stats.q1}, median=${stats.median}, Q3=${stats.q3}; whiskers=${stats.lower} to ${stats.upper}; outliers=${stats.outliers.join(', ')||'none'}`);
  assert.ok(axis.start<=Math.min(...raw)&&axis.end>=Math.max(...raw));
  const ticks=extract(practice,/class="box-axis-tick" data-value="([^"]+)" x1="([^"]+)" y1="103"/g);
  assert.ok(ticks.length>=2,'axis must have readable numeric intervals');
  assert.deepEqual(ticks.map(t=>t[0]),axis.ticks);
  for(let i=0;i<ticks.length;i++){
   const [value,x]=ticks[i];
   near(x,75+300*(value-axis.start)/(axis.end-axis.start),'box tick');
   if(i)near(value-ticks[i-1][0],axis.step,'uniform box intervals');
  }
  assert.doesNotMatch(practice,/class="solution-box"|class="solution-outlier"|class="box-solution-median"/);
  const box=solution.match(/class="solution-box" x="([^"]+)" y="91" width="([^"]+)"/);
  assert.ok(box);
  const pos=v=>75+300*(v-axis.start)/(axis.end-axis.start);
  near(+box[1],pos(stats.q1),'box Q1');
  near(+box[1]+(+box[2]),pos(stats.q3),'box Q3');
  const median=extract(solution,/class="box-solution-median" x1="([^"]+)" y1="91"/g);
  assert.equal(median.length,1);
  near(median[0][0],pos(stats.median),'box median');
  const circles=extract(solution,/class="solution-outlier" cx="([^"]+)" cy="112"/g);
  assert.equal(circles.length,stats.outliers.length);
  circles.forEach(([x],i)=>near(x,pos(stats.outliers[i]),'outlier'));
  outliers+=stats.outliers.length;
 }
 assert.ok(outliers>20,'must exercise real isolated outliers');
});

test('R58 counting dots: every printed value equals the number of unique vector circles',()=>{
 const counts=new Set();
 for(let seed=1;seed<=1200;seed++){
  const p=sampleProblem('number-recognition-worksheets',seed,'standard',{task:'count-dots'});
  const expected=Number(p.expectedAnswer),d=p.diagramSpec;
  assert.equal(d.kind,'dots');
  assert.equal(d.values[0],expected);
  assert.match(p.payload.question,/Count the dots/);
  const dots=extract(diagramSVG(d),/class="counting-dot" cx="([^"]+)" cy="([^"]+)"/g);
  assert.equal(dots.length,expected);
  assert.equal(new Set(dots.map(xy=>xy.join(','))).size,expected);
  dots.forEach(([x,y],i)=>{
    assert.equal(x,85+(i%6)*54);
    assert.equal(y,65+Math.floor(i/6)*64);
  });
  counts.add(expected);
 }
 assert.deepEqual([...counts].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i+1));
});

test('R58 answer/worksheet PDFs retain one-to-one exact statistics outputs on A4 and Letter',async()=>{
 for(const [topic,options] of [
  ['scatter-plot-worksheets',{task:'plot',trend:'negative'}],
  ['box-plots-worksheets',{statistic:'draw'}],
  ['number-recognition-worksheets',{task:'count-dots'}]
 ]){
  const sheet=makeWorksheet(topic,20261106,8,'standard',options);
  assert.deepEqual(sheet.answerMap,sheet.problems.map(p=>({id:p.id,answer:p.expectedAnswer})));
  for(const paper of ['A4','Letter']){
   for(const mode of ['questions','answers']){
    const pdf=await PDFDocument.load(await createWorksheetPdf(sheet,topic,mode,paper));
    assert.ok(pdf.getPageCount()>=1);
    near(pdf.getPage(0).getWidth(),paper==='A4'?595.28:612,'paper width');
    assert.match(pdf.getTitle(),new RegExp(sheet.optionsHash));
   }
  }
 }
});
