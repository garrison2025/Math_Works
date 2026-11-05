import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,quartiles,gcd,rational,addR,mulR,asText} from '../src/lib/math.ts';
import {graphGeometry,scatterGeometry} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
const seeds=300;
const verify=(slug,oracle)=>{for(let seed=0;seed<seeds;seed++){const p=sampleProblem(slug,seed);const expected=oracle(p.payload.question,p);assert.equal(p.expectedAnswer,String(expected),`${slug} seed ${seed}: ${p.payload.question}`)}};
const n=Number;
const re=(q,pat)=>{const m=q.match(pat);assert.ok(m,`Parser failed for ${q}`);return m};
const frac=(a,b)=>asText(rational(BigInt(a),BigInt(b)));

test('300 independent arithmetic oracles per route (14 independent operations)',()=>{
 for(const slug of ['two-digit-multiplication-worksheets','three-digit-by-two-digit-multiplication-worksheets','two-digit-by-one-digit-multiplication-worksheets','multiplication-worksheets','multiplication-tables-worksheets'])verify(slug,q=>{const m=re(q,/^(\d+) × (\d+) =/);return n(m[1])*n(m[2]);});
 verify('addition-worksheets',q=>{const m=re(q,/^(\d+) \+ (\d+) =/);return n(m[1])+n(m[2]);});
 verify('subtraction-worksheets',q=>{const m=re(q,/^(\d+) − (\d+) =/);return n(m[1])-n(m[2]);});
 verify('mixed-addition-subtraction-worksheets',q=>{const m=re(q,/^(\d+) ([+−]) (\d+) =/);return m[2]==='+'?n(m[1])+n(m[3]):n(m[1])-n(m[3]);});
 verify('division-worksheets',q=>{const m=re(q,/^(\d+) ÷ (\d+) =/);assert.equal(n(m[1])%n(m[2]),0);return n(m[1])/n(m[2]);});
 verify('long-division-worksheets',q=>{const m=re(q,/^(\d+) ÷ (\d+) =/);return `${Math.floor(n(m[1])/n(m[2]))} R ${n(m[1])%n(m[2])}`;});
 verify('decimal-multiplication-worksheets',q=>{const m=re(q,/^(\d+\.\d+) × (\d+\.\d+) =/);return Number((Math.round(n(m[1])*100)*Math.round(n(m[2])*100)/10000).toFixed(4));});
 verify('order-of-operations-worksheets',q=>{let m=q.match(/^\((\d+) \+ (\d+)\) × (\d+)/);if(m)return (n(m[1])+n(m[2]))*n(m[3]);m=re(q,/^(\d+) \+ (\d+) × (\d+)/);return n(m[1])+n(m[2])*n(m[3]);});
 verify('integer-operations-worksheets',q=>{let m=q.match(/^(-?\d+) ÷ \((-?\d+)\) =/);if(m)return n(m[1])/n(m[2]);m=re(q,/^(-?\d+) ([+−×]) \((-?\d+)\) =/);return m[2]==='+'?n(m[1])+n(m[3]):m[2]==='−'?n(m[1])-n(m[3]):n(m[1])*n(m[3]);});
 verify('gcf-worksheets',q=>{const m=re(q,/Find the GCF of (\d+) and (\d+)/);return gcd(n(m[1]),n(m[2]));});
});

test('300 independent rational, percentages and notation oracles per route',()=>{
 verify('equivalent-fractions-worksheets',q=>{
  let m=q.match(/^(\d+)\/(\d+) = ____\/(\d+)/);
  if(m){assert.equal(n(m[3])%n(m[2]),0);return n(m[1])*n(m[3])/n(m[2]);}
  m=re(q,/^(\d+)\/(\d+) = (\d+)\/____/);
  assert.equal(n(m[3])%n(m[1]),0);return n(m[2])*n(m[3])/n(m[1]);
 });
 verify('adding-unlike-fractions-worksheets',q=>{const m=re(q,/^(\d+)\/(\d+) \+ (\d+)\/(\d+)/);assert.notEqual(m[2],m[4]);return asText(addR(rational(BigInt(m[1]),BigInt(m[2])),rational(BigInt(m[3]),BigInt(m[4]))));});
 verify('multiplying-fractions-worksheets',q=>{const m=re(q,/^(\d+)\/(\d+) × (\d+)\/(\d+)/);return asText(mulR(rational(BigInt(m[1]),BigInt(m[2])),rational(BigInt(m[3]),BigInt(m[4]))));});
 verify('fractions-worksheets',q=>{const m=re(q,/^(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+)/);const a=rational(BigInt(m[1]),BigInt(m[2])),b=rational(BigInt(m[4]),BigInt(m[5]));return asText(m[3]==='+'?addR(a,b):m[3]==='−'?addR(a,rational(-b.n,b.d)):m[3]==='×'?mulR(a,b):rational(a.n*b.d,a.d*b.n));});
 verify('percentages-worksheets',q=>{
  let m=q.match(/^Convert (\d+)\/(\d+) into a percentage/);
  if(m)return `${Number((n(m[1])/n(m[2])*100).toFixed(6))}%`;
  m=q.match(/^Convert (\d+(?:\.\d+)?)% into a fraction in simplest form/);
  if(m){const digits=m[1].split('.')[1]?.length||0,scale=10**digits;
   return frac(Math.round(n(m[1])*scale),100*scale);}
  m=q.match(/^Find (\d+)% of (\d+)\.$/);
  if(m){const hundredths=n(m[1])*n(m[2]);return String(Number((hundredths/100).toFixed(2)));}
  m=re(q,/^Find the percentage (increase|decrease) from (\d+) to (\d+)\.$/);
  const start=n(m[2]),end=n(m[3]);assert.ok(start>0);
  assert.equal(m[1],end>start?'increase':'decrease');
  return `${Math.abs(end-start)*100/start}%`;
 });
 verify('scientific-notation-worksheets',q=>{
  let m=q.match(/^Write (\d+(?:\.\d+)?) in scientific notation/);
  if(m){const value=n(m[1]);let exponent=Math.floor(Math.log10(value));const mantissa=Number((value/10**exponent).toFixed(8));return `${mantissa} × 10^${exponent}`;}
  m=re(q,/^Write (\d+(?:\.\d+)?) × 10\^(-?\d+) in standard form/);
  return String(Number((n(m[1])*10**n(m[2])).toFixed(6)));
 });
});

test('300 independent algebra and graph oracles per route',()=>{
 verify('two-step-equations-worksheets',q=>{const m=re(q,/^Solve: (-?\d+)x ([+−]) (\d+) = (-?\d+)/);const b=m[2]==='+'?n(m[3]):-n(m[3]);return `x = ${(n(m[4])-b)/n(m[1])}`;});
 verify('one-step-equations-worksheets',q=>{let m=q.match(/^Solve: x ([+−]) (\d+) = (-?\d+)/);if(m)return `x = ${n(m[3])-(m[1]==='+'?n(m[2]):-n(m[2]))}`;m=re(q,/^Solve: (-?\d+)x = (-?\d+)/);return `x = ${n(m[2])/n(m[1])}`;});
 verify('inequalities-worksheets',q=>{const m=re(q,/^Solve: (-?\d+)x ([+−]) (\d+) ([<≤]) (-?\d+)/);const b=m[2]==='+'?n(m[3]):-n(m[3]),a=n(m[1]);const op=a<0?(m[4]==='<'?'>':'≥'):m[4];return `x ${op} ${(n(m[5])-b)/a}`;});
 verify('systems-equations-worksheets',q=>{const m=re(q,/^Solve: x \+ y = (-?\d+); x − y = (-?\d+)/);return `x = ${(n(m[1])+n(m[2]))/2}, y = ${(n(m[1])-n(m[2]))/2}`;});
 for(const slug of ['functions-worksheets','linear-equations-worksheets'])verify(slug,(q,p)=>{
  const inverse=q.match(/If f\(x\) = (-?\d+)x ([+−]) (\d+) and f\(x\) = (-?\d+), find x/);
  if(inverse){const intercept=inverse[2]==='+'?n(inverse[3]):-n(inverse[3]);return (n(inverse[4])-intercept)/n(inverse[1]);}
  const m=slug==='functions-worksheets'?re(q,/If f\(x\) = (-?\d+)x ([+−]) (\d+), find f\((-?\d+)\)/):re(q,/For y = (-?\d+)x ([+−]) (\d+), find y when x = (-?\d+)/);
  const y=n(m[1])*n(m[4])+(m[2]==='+'?n(m[3]):-n(m[3]));
  if(slug==='linear-equations-worksheets'){
    const d=p.diagramSpec;assert.equal(d.kind,'linear-function');assert.deepEqual(d.values,[n(m[1]),m[2]==='+'?n(m[3]):-n(m[3]),n(m[4]),y]);
    const g=graphGeometry(d);assert.deepEqual(g.points,[], 'practice graph must not label the requested answer');
    assert.ok(g.segment[0][0]<=n(m[4])&&g.segment[1][0]>=n(m[4]));
  }
  return y;
 });
 verify('slope-worksheets',(q,p)=>{const m=re(q,/slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/);const [x1,y1,x2,y2]=m.slice(1).map(n);const g=graphGeometry(p.diagramSpec);assert.deepEqual(g.points,[[x1,y1],[x2,y2]]);return x1===x2?'undefined':String((y2-y1)/(x2-x1));});
 verify('coordinate-plane-worksheets',(q,p)=>{const m=re(q,/contains \((-?\d+), (-?\d+)\)/);const [x,y]=m.slice(1).map(n);assert.deepEqual(graphGeometry(p.diagramSpec).points,[[x,y]]);return x>0?(y>0?'I':'IV'):(y>0?'II':'III');});
});

test('300 independent geometry and statistics oracles per route',()=>{
 verify('pythagorean-worksheets',q=>{const m=re(q,/legs (\d+) and (\d+)/);return Math.sqrt(n(m[1])**2+n(m[2])**2);});
 verify('area-of-triangles-worksheets',q=>{const m=re(q,/base (\d+) and height (\d+)/);return n(m[1])*n(m[2])/2;});
 verify('area-of-parallelograms-worksheets',q=>{const m=re(q,/base (\d+) and perpendicular height (\d+)/);return n(m[1])*n(m[2]);});
 verify('area-of-trapezoids-worksheets',q=>{const m=re(q,/bases (\d+), (\d+) and height (\d+)/);return (n(m[1])+n(m[2]))*n(m[3])/2;});
 verify('area-worksheets',q=>{const m=re(q,/area of a (\d+) by (\d+) rectangle/);return n(m[1])*n(m[2]);});
 verify('surface-area-worksheets',q=>{const m=re(q,/prism: (\d+) × (\d+) × (\d+)/);const [a,b,c]=m.slice(1).map(n);return 2*(a*b+a*c+b*c);});
 verify('volume-of-rectangular-prisms-worksheets',q=>{let m=q.match(/volume (\d+) cubic units, length (\d+) and width (\d+)/);if(m)return n(m[1])/(n(m[2])*n(m[3]));m=re(q,/prism (\d+) × (\d+) × (\d+)/);return n(m[1])*n(m[2])*n(m[3]);});
 verify('triangle-angle-sum-worksheets',(q,p)=>{const m=re(q,/angles are (\d+)° and (\d+)°/);const ans=180-n(m[1])-n(m[2]);assert.equal(p.diagramSpec.kind,'triangle-angles');assert.deepEqual(p.diagramSpec.values,[n(m[1]),n(m[2]),ans]);return `${ans}°`;});
 verify('complementary-supplementary-angles-worksheets',q=>{const m=re(q,/angle (complementary|supplementary) to (\d+)°/);return `${(m[1]==='complementary'?90:180)-n(m[2])}°`;});
 verify('vertical-angles-worksheets',q=>{const m=re(q,/angle of (\d+)°/);return `${m[1]}°`;});
 verify('angle-worksheets',q=>{const m=re(q,/Classify a (\d+)°/);return n(m[1])<90?'acute':n(m[1])===90?'right':'obtuse';});
 verify('mean-median-mode-range-worksheets',q=>{const m=re(q,/Find the (mean|median|mode|range) of \[([\d, ]+)\]/);const v=m[2].split(', ').map(n).sort((a,b)=>a-b),total=v.reduce((a,b)=>a+b,0);if(m[1]==='mean')return frac(total,v.length);if(m[1]==='median')return (v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2);if(m[1]==='range')return v.at(-1)-v[0];const f=new Map();for(const x of v)f.set(x,(f.get(x)??0)+1);const high=Math.max(...f.values());return high===1?'no mode':[...f].filter(([,c])=>c===high).map(([x])=>x).sort((a,b)=>a-b).join(', ');});
 verify('mean-absolute-deviation-worksheets',q=>{const m=re(q,/deviation of \[([-\d, ]+)\]/);const vals=m[1].split(', ').map(n),count=vals.length,total=vals.reduce((a,b)=>a+b,0);return frac(vals.reduce((acc,x)=>acc+Math.abs(count*x-total),0),count*count);});
 verify('box-plots-worksheets',q=>{const m=re(q,/Find (Q1|median|Q3|IQR|outliers) for \[([\d, ]+)\]/);const vals=m[2].split(', ').map(n),v=quartiles(vals);return m[1]==='outliers'?(v.outliers.join(', ')||'none'):String(v[m[1]==='Q1'?'q1':m[1]==='Q3'?'q3':m[1]==='IQR'?'iqr':'median']);});
});

test('all four line/segment/ray diagrams match endpoint semantics',()=>{
 const s={line:2,ray:1,segment:0};for(const [name,n] of Object.entries(s)){
  const svg=diagramSVG({kind:'line',values:[n]});
  assert.equal((svg.match(/<circle/g)||[]).length,2,`Each named geometric object must show exactly two labeled points: ${name}`);
  assert.equal((svg.match(/<path/g)||[]).length,n,`wrong arrow count ${name}`);
 }
});


test('question-only diagrams do not reveal the unknown answer',()=>{
 for(let seed=0;seed<1000;seed++){
  const p=sampleProblem('pythagorean-worksheets',seed);
  assert.equal(p.diagramSpec.kind,'right-triangle');
  assert.equal(p.diagramSpec.values.length,2);
  const svg=diagramSVG(p.diagramSpec);
  assert.ok(svg.includes('units'));
  assert.ok(!svg.includes('hyp.'),`hypotenuse answer leaked: ${seed}`);
  const a=sampleProblem('triangle-angle-sum-worksheets',seed);
  assert.equal(a.diagramSpec.kind,'triangle-angles');
  const shape=diagramSVG(a.diagramSpec);
  assert.ok(shape.includes('>?<'),`unknown angle leaked: ${seed}`);
  assert.equal((shape.match(/°<\/text>/g)||[]).length,2,'only the two supplied angles may be labeled');
  const v=sampleProblem('volume-of-rectangular-prisms-worksheets',seed);
  if(v.payload.question.includes('Find its height')){
   assert.equal(v.diagramSpec.values.length,2);
   assert.ok(diagramSVG(v.diagramSpec).includes('>?<'),`missing height leaked: ${seed}`);
  }
  const g=sampleProblem('linear-equations-worksheets',seed);
  assert.equal(graphGeometry(g.diagramSpec).points.length,0);
 }
});

test('scatter plots preserve correlation direction and stay inside plot bounds',()=>{
 for(let seed=0;seed<2000;seed++){
  const p=sampleProblem('scatter-plot-worksheets',seed);
  const pts=scatterGeometry(p.diagramSpec);
  assert.equal(pts.length,6);
  assert.ok(pts.every(([x,y])=>x>=0&&x<=1&&y>=0&&y<=1));
  const raw=p.diagramSpec.values.filter((_,i)=>i%2===1);
  const covariance=raw.reduce((acc,y,i)=>acc+(i+1-3.5)*y,0);
  const actual=Math.abs(covariance)<1e-9?'no clear linear trend':covariance>0?'positive':'negative';
  assert.equal(p.expectedAnswer,actual);
  const svg=diagramSVG(p.diagramSpec);
  assert.equal((svg.match(/<circle/g)||[]).length,6);
 }
});
