import test from 'node:test';
import assert from 'node:assert/strict';
import {topicOptionDefinitions,topicOptionsFor,normalizeTopicOptions,maxQuantityForTopic} from '../src/lib/topic-options.ts';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
const all=Object.entries(topicOptionDefinitions);
const captures={
 'integer-operations-worksheets': (p,v)=>['addition','subtraction','multiplication','division'].includes(v)?p.payload.question.includes(({addition:' + ',subtraction:' − ',multiplication:' × ',division:' ÷ '})[v]):true,
 'one-step-equations-worksheets': (p,v)=>v==='addition'?/^Solve: x [−+] /.test(p.payload.question):v==='multiplication'?/^Solve: -?\d+x =/.test(p.payload.question):true,
 'two-step-equations-worksheets':(p,v)=>v==='mixed'||(Number(p.payload.question.match(/Solve: (-?\d+)x/)?.[1])>0)===(v==='positive'),
 'inequalities-worksheets':(p,v)=>v==='mixed'||(Number(p.payload.question.match(/Solve: (-?\d+)x/)?.[1])>0)===(v==='positive'),
 'order-of-operations-worksheets':(p,v)=>v==='mixed'||p.payload.question.startsWith('(')===(v==='parentheses'),
 'equivalent-fractions-worksheets':(p,v)=>v==='mixed'||p.payload.question.includes('____/')===(v==='numerator'),
 'fractions-worksheets':(p,v)=>v==='mixed'||p.payload.question.includes(({addition:' + ',subtraction:' − ',multiplication:' × '})[v]),
 'multiplication-tables-worksheets':(p,v)=>v==='mixed'||p.payload.question.startsWith(`${v} × `),
 'long-division-worksheets':(p,v)=>v==='mixed'||Number(p.expectedAnswer.split(' R ')[1])>0===(v==='yes'),
 'mean-median-mode-range-worksheets':(p,v)=>v==='mixed'||p.payload.question.startsWith(`Find the ${v} of`),
 'scatter-plot-worksheets':(p,v)=>v==='mixed'||(v==='identify'?p.payload.question.startsWith('Describe'):v==='plot'?p.payload.question.startsWith('Plot these six points'):p.diagramSpec.labels?.includes('plot')||p.expectedAnswer===(v==='none'?'no clear linear trend':v)),
 'number-line-worksheets':(p,v)=>v==='mixed'||(Number(p.expectedAnswer)>0)===(v==='positive'),
 'coordinate-plane-worksheets':(p,v)=>v==='mixed'||p.expectedAnswer===v,
 'two-digit-by-one-digit-multiplication-worksheets':(p,v)=>{
  if(v==='mixed')return true;
  const [,x,y]=p.payload.question.match(/^(\d+) × (\d+) =/).map(Number);
  const carry=(x%10)*y>=10 || Math.floor(x/10)*y+Math.floor((x%10)*y/10)>=10;
  return carry===(v==='yes');
 },
 'addition-worksheets':(p,v)=>{
  if(v==='mixed')return true;
  const [,x,y]=p.payload.question.match(/^(\d+) \+ (\d+) =/).map(Number);
  const ones=x%10+y%10,tens=Math.floor(x/10)%10+Math.floor(y/10)%10+Math.floor(ones/10),hundreds=Math.floor(x/100)+Math.floor(y/100)+Math.floor(tens/10);
  return (ones>=10||tens>=10||hundreds>=10)===(v==='yes');
 },
 'subtraction-worksheets':(p,v)=>{
  if(v==='mixed')return true;
  const [,x,y]=p.payload.question.match(/^(\d+) − (\d+) =/).map(Number);
  const onesBorrow=x%10<y%10,tensBorrow=Math.floor(x/10)%10-(onesBorrow?1:0)<Math.floor(y/10)%10;
  return (onesBorrow||tensBorrow)===(v==='yes');
 },
 'decimal-multiplication-worksheets':(p,v)=>v==='mixed'||p.payload.question.match(/\d+\.(\d+) × \d+\.(\d+)/)?.slice(1).every(t=>t.length===Number(v)),
 'multiplying-fractions-worksheets':(p,v)=>{
  if(v==='mixed')return true;
  const [,n,d,j,e]=p.payload.question.match(/^(\d+)\/(\d+) × (\d+)\/(\d+)/).map(Number);
  return (n*j < d*e)===(v==='proper');
 },
 'place-value-worksheets':(p,v)=>v==='mixed'||p.payload.question.includes(`the ${v} digit`),
 'decimal-place-value-worksheets':(p,v)=>v==='mixed'||p.payload.question.includes(`the ${v} digit`),
 'percentages-worksheets':(p,v)=>v==='mixed'||(p.payload.question.includes('% into a fraction')===(v==='percent-to-fraction')),
 'scientific-notation-worksheets':(p,v)=>v==='mixed'||(p.payload.question.includes('in standard form')===(v==='to-standard')),
 'functions-worksheets':(p,v)=>v==='mixed'||(p.payload.question.includes('find x.')===(v==='solve-input')),
 'slope-worksheets':(p,v)=>v==='mixed'||(p.expectedAnswer==='undefined')===(v==='vertical'),
 'volume-of-rectangular-prisms-worksheets':(p,v)=>v==='mixed'||(p.payload.question.includes('Find its height')===(v==='missing-height')),
 'box-plots-worksheets':(p,v)=>v==='mixed'||(v==='draw'?p.payload.question.startsWith('Draw a modified box plot'):p.payload.question.startsWith(`Find ${v} for`)),
 'division-worksheets':(p,v)=>v==='mixed'||p.payload.question.match(/÷ (\d+) =/)?.[1]===v,
 'complementary-supplementary-angles-worksheets':(p,v)=>v==='mixed'||p.payload.question.includes(`angle ${v} to`),
 'lines-rays-segments-worksheets':(p,v)=>v==='mixed'||p.expectedAnswer===v,
 'gcf-worksheets':(p,v)=>v==='mixed'||(Number(p.expectedAnswer)===1)===(v==='coprime'),
 'two-digit-multiplication-worksheets':(p,v)=>v==='mixed'||(()=>{const m=p.payload.question.match(/^(\d+) × (\d+)/);return (v==='small')?[Number(m[1]),Number(m[2])].every(x=>x<50):[Number(m[1]),Number(m[2])].every(x=>x>=50)})(),
 'three-digit-by-two-digit-multiplication-worksheets':(p,v)=>v==='mixed'||(Number(p.payload.question.match(/× (\d+)/)?.[1])<50)===(v==='low'),
 'adding-unlike-fractions-worksheets':(p,v)=>v==='mixed'||(()=>{const [n,d]=p.expectedAnswer.split('/').map(Number),value=d?n/d:n;return (value<1)===(v==='proper')})(),
 'area-of-triangles-worksheets':(p,v)=>p.payload.question.includes('Find its perpendicular height')===(v==='missing-height'),
 'area-of-parallelograms-worksheets':(p,v)=>p.payload.question.includes('Find its perpendicular height')===(v==='missing-height'),
 'area-of-trapezoids-worksheets':(p,v)=>p.payload.question.includes('Find its height')===(v==='missing-height'),
 'area-worksheets':(p,v)=>p.payload.question.includes('area of a square')===(v==='square'),
 'triangle-angle-sum-worksheets':(p,v)=>v==='mixed'||(()=>{const angle=Number(p.expectedAnswer.replace('°',''));return v==='acute'?angle<90:v==='right'?angle===90:angle>90})(),
 'pythagorean-worksheets':(p,v)=>v==='mixed'||(()=>{const m=p.payload.question.match(/legs (\d+) and (\d+)/),d=(a,b)=>b?d(b,a%b):a,scale=d(Number(m[1]),Number(m[2]));return v==='small'?scale<=3:scale>=4})(),
 'domain-range-worksheets':(p,v)=>v==='mixed'||(v==='function-test'?p.payload.question.startsWith('Is the relation '):p.payload.question.startsWith(`List the ${v} of`)),
 'angle-worksheets':(p,v)=>v==='mixed'||p.expectedAnswer===v,
 'vertical-angles-worksheets':(p,v)=>p.payload.question.includes('adjacent supplementary')===(v==='adjacent'),
 'mean-absolute-deviation-worksheets':(p,v)=>{const m=p.payload.question.match(/\[([-\d, ]+)\]/);const vals=m[1].split(', ').map(Number);return (vals[1]===vals[2])===(v==='skewed')},
 'multiplication-worksheets':(p,v)=>v==='mixed'||(()=>{const m=p.payload.question.match(/^(\d+) × (\d+)/);return v==='times-tables'?[Number(m[1]),Number(m[2])].every(x=>x<=12):Number(m[1])>=12&&Number(m[2])<=9})(),
 'surface-area-worksheets':(p,v)=>p.payload.question.includes('cube with side')===(v==='cube'),
 'mixed-addition-subtraction-worksheets':(p,v)=>v==='mixed'||p.payload.question.includes(v==='addition'?' + ':' − '),
 'printable-protractor':(p,v)=>v==='mixed'||(Number(p.expectedAnswer.replace('°',''))<90)===(v==='acute'),
 'systems-equations-worksheets':(p,v)=>v==='mixed'||(()=>{const m=p.expectedAnswer.match(/x = (-?\d+), y = (-?\d+)/);return v==='positive'?[Number(m[1]),Number(m[2])].every(x=>x>0):[Number(m[1]),Number(m[2])].every(x=>x<0)})(),
 'function-tables-worksheets':(p,v)=>{const cells=p.payload.question.split(': ').at(-1).split(', ');const i=v==='first'?0:v==='middle'?1:2;return cells[i].includes('____')},
 'number-recognition-worksheets':(p,v)=>v==='mixed'||p.payload.question.startsWith('Count the dots shown below.')===(v==='count-dots'),
 'linear-equations-worksheets':(p,v)=>v==='mixed'||(()=>{const slope=p.diagramSpec.values[0];return v==='positive'?slope>0:v==='negative'?slope<0:slope===0})(),

};
test('topic-option definitions use nonduplicated identifiers and valid defaults',()=>{
 assert.equal(all.length,51);
 for(const [slug,defs] of all){assert.ok(defs.length>=1&&defs.length<=3,slug);assert.equal(new Set(defs.map(d=>d.key)).size,defs.length);for(const d of defs){assert.ok(d.choices.some(x=>x.value===d.defaultValue));assert.equal(new Set(d.choices.map(x=>x.value)).size,d.choices.length);}assert.deepEqual(normalizeTopicOptions(slug),Object.fromEntries(defs.map(d=>[d.key,d.defaultValue])));}
 assert.equal(topicOptionsFor('two-digit-multiplication-worksheets').length,1);
 assert.equal(topicOptionsFor('systems-equations-worksheets').length,2);
 assert.equal(topicOptionsFor('domain-range-worksheets').length,2);
});
test('every special choice changes actual problem semantics across many seeds',()=>{
 for(const [slug,defs] of all){for(const def of defs)for(const item of def.choices){
  const option={[def.key]:item.value};
  for(let seed=1;seed<=100;seed++){
   const p=sampleProblem(slug,seed,'standard',option);
   const fits=slug==='linear-equations-worksheets'&&def.key==='task'
    ?(item.value==='graph'?p.payload.question.startsWith('Graph the line '):p.payload.question.startsWith('For y = '))
    :slug==='systems-equations-worksheets'&&def.key==='method'
    ?(item.value==='simple'?/^Solve: x \+ y =/.test(p.payload.question):item.value==='general'?/^Solve the system: /.test(p.payload.question):p.payload.question.startsWith('Classify and solve the system: ')&&p.expectedAnswer===(item.value==='parallel'?'no solution':'infinitely many solutions'))
    :slug==='domain-range-worksheets'&&def.key==='relation'
    ?(item.value==='function'?((p.payload.question.match(/\(/g)||[]).length===3):((p.payload.question.match(/\(/g)||[]).length===4))
    :captures[slug](p,item.value);
   assert.ok(fits,`${slug} ${def.key}=${item.value} seed ${seed}: ${p.payload.question}`);
  }
  const cap=maxQuantityForTopic(slug,option,'standard');const max=[12,8,4].find(n=>n<=cap)??1;
  const a=makeWorksheet(slug,20261104,max,'standard',option);
  assert.equal(a.problems.length,max);
  assert.deepEqual(a,makeWorksheet(slug,20261104,max,'standard',option));
 }}
});
test('invalid topic options fail closed and different settings have different fingerprints',()=>{
 assert.throws(()=>makeWorksheet('fractions-worksheets',1,8,'standard',{operation:'exponentiation'}));
 assert.throws(()=>makeWorksheet('fractions-worksheets',1,8,'standard',{other:'x'}));
 assert.throws(()=>makeWorksheet('fractions-worksheets',1,8,'standard',{operation:42}));
 assert.throws(()=>makeWorksheet('addition-worksheets',1,8,'standard',{operation:'subtraction'}));
 const a=makeWorksheet('fractions-worksheets',44,8,'standard',{operation:'addition'});
 const b=makeWorksheet('fractions-worksheets',44,8,'standard',{operation:'subtraction'});
 assert.notEqual(a.optionsHash,b.optionsHash);
 assert.notDeepEqual(a.problems,b.problems);
 assert.equal(a.optionsHash,makeWorksheet('fractions-worksheets',44,8,'standard',{operation:'addition'}).optionsHash);
});

test('question counts are limited by the distinct problem domain',()=>{
 assert.equal(maxQuantityForTopic('number-recognition-worksheets'),20);
 assert.equal(maxQuantityForTopic('number-recognition-worksheets',{task:'count-dots'}),12);
 assert.equal(maxQuantityForTopic('two-digit-by-one-digit-multiplication-worksheets',{regrouping:'no'}),20);
 assert.equal(maxQuantityForTopic('pythagorean-worksheets',{},'easy'),16);
 assert.equal(maxQuantityForTopic('number-line-worksheets',{sign:'mixed'}),16);
 assert.equal(maxQuantityForTopic('number-line-worksheets',{sign:'negative'}),9);
 assert.equal(maxQuantityForTopic('multiplication-tables-worksheets',{table:'8'}),12);
 assert.equal(maxQuantityForTopic('division-worksheets',{divisor:'7'}),11);
 assert.equal(maxQuantityForTopic('percentages-worksheets'),40);
 assert.throws(()=>makeWorksheet('number-recognition-worksheets',1,16,'standard',{task:'count-dots'}),/at most 12/);
 assert.throws(()=>makeWorksheet('number-line-worksheets',1,20),/at most 16/);
 assert.throws(()=>makeWorksheet('number-line-worksheets',1,12,'easy',{sign:'positive'}),/at most 9/);
 assert.throws(()=>makeWorksheet('division-worksheets',1,12,'easy',{divisor:'7'}),/at most 11/);
 assert.equal(makeWorksheet('number-line-worksheets',1,16).problems.length,16);
 assert.equal(makeWorksheet('number-recognition-worksheets',1,20).problems.length,20);
});

test('every specialized selector generates full-size worksheets without exhausting unique questions',()=>{
 const quantities=[4,8,12,16,20,30,40];
 for(const [slug,defs] of all)for(const def of defs)for(const choice of def.choices){
  const opts={[def.key]:choice.value};
  for(const difficulty of ['easy','standard','challenge']){
   const max=quantities.filter(n=>n<=maxQuantityForTopic(slug,opts,difficulty)).at(-1);
   for(let seed=1;seed<=50;seed++){
    const result=makeWorksheet(slug,seed,max,difficulty,opts);
    assert.equal(result.problems.length,max,`${slug} ${choice.value} ${difficulty} ${seed}`);
    assert.equal(new Set(result.problems.map(p=>JSON.stringify([p.payload.question,p.diagramSpec??null]))).size,max);
   }
  }
 }
});
