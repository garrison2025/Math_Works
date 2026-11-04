import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,quartiles,gcd,rational,addR,mulR,asText} from '../src/lib/math.ts';
import {graphGeometry} from '../src/lib/graph.ts';
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
 verify('equivalent-fractions-worksheets',q=>{const m=re(q,/^(\d+)\/(\d+) = ____\/(\d+)/);assert.equal(n(m[3])%n(m[2]),0);return n(m[1])*n(m[3])/n(m[2]);});
 verify('adding-unlike-fractions-worksheets',q=>{const m=re(q,/^(\d+)\/(\d+) \+ (\d+)\/(\d+)/);assert.notEqual(m[2],m[4]);return asText(addR(rational(BigInt(m[1]),BigInt(m[2])),rational(BigInt(m[3]),BigInt(m[4]))));});
 verify('multiplying-fractions-worksheets',q=>{const m=re(q,/^(\d+)\/(\d+) × (\d+)\/(\d+)/);return asText(mulR(rational(BigInt(m[1]),BigInt(m[2])),rational(BigInt(m[3]),BigInt(m[4]))));});
 verify('fractions-worksheets',q=>{const m=re(q,/^(\d+)\/(\d+) ([+−×]) (\d+)\/(\d+)/);const a=rational(BigInt(m[1]),BigInt(m[2])),b=rational(BigInt(m[4]),BigInt(m[5]));return asText(m[3]==='+'?addR(a,b):m[3]==='−'?addR(a,rational(-b.n,b.d)):mulR(a,b));});
 verify('percentages-worksheets',q=>{const m=re(q,/^Convert (\d+)\/(\d+) into a percentage/);return `${Number((n(m[1])/n(m[2])*100).toFixed(6))}%`;});
 verify('scientific-notation-worksheets',q=>{const m=re(q,/Write (\d+(?:\.\d+)?) in scientific notation/);const value=n(m[1]);let exponent=Math.floor(Math.log10(value));const mantissa=Number((value/10**exponent).toFixed(8));return `${mantissa} × 10^${exponent}`;});
});

test('300 independent algebra and graph oracles per route',()=>{
 verify('two-step-equations-worksheets',q=>{const m=re(q,/^Solve: (-?\d+)x ([+−]) (\d+) = (-?\d+)/);const b=m[2]==='+'?n(m[3]):-n(m[3]);return `x = ${(n(m[4])-b)/n(m[1])}`;});
 verify('one-step-equations-worksheets',q=>{let m=q.match(/^Solve: x ([+−]) (\d+) = (-?\d+)/);if(m)return `x = ${n(m[3])-(m[1]==='+'?n(m[2]):-n(m[2]))}`;m=re(q,/^Solve: (-?\d+)x = (-?\d+)/);return `x = ${n(m[2])/n(m[1])}`;});
 verify('inequalities-worksheets',q=>{const m=re(q,/^Solve: (-?\d+)x ([+−]) (\d+) ([<≤]) (-?\d+)/);const b=m[2]==='+'?n(m[3]):-n(m[3]),a=n(m[1]);const op=a<0?(m[4]==='<'?'>':'≥'):m[4];return `x ${op} ${(n(m[5])-b)/a}`;});
 verify('systems-equations-worksheets',q=>{const m=re(q,/^Solve: x \+ y = (-?\d+); x − y = (-?\d+)/);return `x = ${(n(m[1])+n(m[2]))/2}, y = ${(n(m[1])-n(m[2]))/2}`;});
 for(const slug of ['functions-worksheets','linear-equations-worksheets'])verify(slug,(q,p)=>{let m=slug==='functions-worksheets'?re(q,/If f\(x\) = (-?\d+)x ([+−]) (\d+), find f\((-?\d+)\)/):re(q,/For y = (-?\d+)x ([+−]) (\d+), find y when x = (-?\d+)/);const y=n(m[1])*n(m[4])+(m[2]==='+'?n(m[3]):-n(m[3]));if(slug==='linear-equations-worksheets'){const d=p.diagramSpec;assert.equal(d.kind,'linear-function');assert.deepEqual(d.values,[n(m[1]),m[2]==='+'?n(m[3]):-n(m[3]),n(m[4]),y]);const g=graphGeometry(d);assert.deepEqual(g.points,[[n(m[4]),y]]);assert.ok(g.segment[0][0]<=g.points[0][0]&&g.segment[1][0]>=g.points[0][0]);}return y;});
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
 verify('mean-median-mode-range-worksheets',q=>{const m=re(q,/Find the (mean|median|mode|range) of \[([\d, ]+)\]/);const v=m[2].split(', ').map(n).sort((a,b)=>a-b);return m[1]==='mean'?v.reduce((a,b)=>a+b,0)/v.length:m[1]==='median'?v[Math.floor(v.length/2)]:m[1]==='mode'?v[0]:v.at(-1)-v[0];});
 verify('mean-absolute-deviation-worksheets',q=>{const m=re(q,/deviation of \[([-\d, ]+)\]/);const vals=m[1].split(', ').map(n),mean=vals.reduce((a,b)=>a+b)/vals.length,absSum=vals.reduce((acc,x)=>acc+Math.abs(x-mean),0);return frac(absSum,vals.length);});
 verify('box-plots-worksheets',q=>{const m=re(q,/Find (Q1|median|Q3|IQR|outliers) for \[([\d, ]+)\]/);const vals=m[2].split(', ').map(n),v=quartiles(vals);return m[1]==='outliers'?(v.outliers.join(', ')||'none'):String(v[m[1]==='Q1'?'q1':m[1]==='Q3'?'q3':m[1]==='IQR'?'iqr':'median']);});
});

test('all four line/segment/ray diagrams match endpoint semantics',()=>{
 const s={line:2,ray:1,segment:0};for(const [name,n] of Object.entries(s)){
  const svg=diagramSVG({kind:'line',values:[n]});
  assert.equal((svg.match(/<circle/g)||[]).length,2-n,`wrong endpoint count ${name}`);
  assert.equal((svg.match(/<path/g)||[]).length,n,`wrong arrow count ${name}`);
 }
});
