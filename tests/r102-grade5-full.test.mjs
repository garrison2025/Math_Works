/** R102 independent 26-standard, 34-kind Grade 5 sampler verification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWidePack,verifyWidePack,wideDiagram} from '../src/lib/r101-comprehensive.ts';
import {createWidePdf,wideDiagramHeight} from '../src/lib/r101-comprehensive-pdf.ts';
import {GRADE5_FULL_KINDS,GRADE5_FULL_COUNTS,GRADE5_STANDARDS,GRADE5_STANDARD_IDS} from '../src/lib/r102-grade5-full.ts';

function rational(n,d){
  assert.ok(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d>0);
  let a=Math.abs(n),b=d;
  while(b){const t=a%b;a=b;b=t;}
  return d/a===1?String(n/a):n/a+'/'+d/a;
}
function independentlyCheck(p){
  const {a,b,c,d,v}=p.values;
  let expected;
  switch(p.kind){
    case 'g5s-oa-eval':expected=String(a*(b-c)+d);break;
    case 'g5s-oa-expression':expected=a+' × '+b+' + '+c;break;
    case 'g5s-oa-pattern':expected='('+(a*c)+', '+(b*c)+')';break;
    case 'g5s-nbt-place':expected='10 times';break;
    case 'g5s-nbt-power':{
      const precision=v===0?Math.max(0,2-b):b+2;
      const n=v===0?a*(10**b):a,den=v===0?100:100*(10**b);
      const str=(n/den).toFixed(precision);
      expected=precision===0?str:str.replace(/0+$/,'').replace(/\.$/,'');
      break;
    }
    case 'g5s-nbt-expand':expected=a+' × 1 + '+b+' × 0.1 + '+c+' × 0.01 + '+d+' × 0.001';break;
    case 'g5s-nbt-compare':expected=a<b?'<':a>b?'>':'=';break;
    case 'g5s-nbt-round':{
      const unit=10**(3-v);expected=(Math.floor((a+unit/2)/unit)*unit/1000).toFixed(v);break;
    }
    case 'g5s-nbt-mult':expected=String(a*b);break;
    case 'g5s-nbt-div':expected=String(b);assert.ok(p.question.includes(String(a*b)));break;
    case 'g5s-nbt-dec-add':expected=((a+b)/100).toFixed(2);break;
    case 'g5s-nbt-dec-sub':expected=((a-b)/100).toFixed(2);break;
    case 'g5s-nbt-dec-mul':expected=(a*b/10000).toFixed(4).replace(/0+$/,'').replace(/\.$/,'');break;
    case 'g5s-nbt-dec-div':expected=String(b);break;
    case 'g5s-nf-add':case 'g5s-nf-story':expected=rational(a*d+b*c,b*d)+(p.kind.endsWith('story')?' metres':'');break;
    case 'g5s-nf-sub':expected=rational(a*d-b*c,b*d);assert.ok(a*d>=b*c);break;
    case 'g5s-nf-share':expected=rational(a,b);break;
    case 'g5s-nf-mul':case 'g5s-nf-area':expected=rational(a*c,b*d)+(p.kind.endsWith('area')?' m²':'');break;
    case 'g5s-nf-scale':expected=c>b?'greater':'less';assert.notEqual(b,c);break;
    case 'g5s-nf-mixed':expected=rational((a*c+b)*d,c)+' metres';break;
    case 'g5s-nf-unit-div':expected=rational(1,a*b)+' cup';break;
    case 'g5s-nf-whole-div':expected=a*b+' servings';break;
    case 'g5s-md-convert':expected=(a*100+b)+' cm';break;
    case 'g5s-md-lineplot':expected=rational(a+2*b+3*c+4*d,8)+' inches';break;
    case 'g5s-md-unitcube':expected=a*b+' cm³';break;
    case 'g5s-md-countcubes':expected=a*b*c+' in³';break;
    case 'g5s-md-prism':expected=a*b*c+' cm³';break;
    case 'g5s-md-additive':expected=a*b*(c+d)+' cm³';break;
    case 'g5s-g-read':expected='('+a+', '+b+')';break;
    case 'g5s-g-plot':expected=a+' right, '+b+' up';break;
    case 'g5s-g-hierarchy':expected=v===4?'No':'Yes';break;
    case 'g5s-g-classify':expected=['square','rectangle','parallelogram','rhombus','trapezoid'][v];break;
    default:assert.fail('Missing independent Grade 5 oracle for '+p.kind);
  }
  assert.equal(p.answer,expected,'Grade 5 arithmetic oracle mismatch: '+p.kind+' '+p.question);
  assert.ok(p.steps.length>=2&&p.steps.every(s=>s.length>=12),'Missing meaningful worked steps: '+p.kind);
  const image=wideDiagram(p);
  if(wideDiagramHeight(p)){
    assert.match(image,/^<svg /,'Diagram missing for '+p.kind);
    assert.ok(!image.includes('<script'));
    if(p.kind==='g5s-g-plot')assert.ok(!image.includes('<circle'),'Blank point-plot grid leaked the answer');
    if(p.kind==='g5s-g-read')assert.ok(image.includes('<circle'),'Read-coordinate worksheet requires visible point');
  }else assert.equal(image,'');
}

test('R102: 34 independently generated family templates cover exactly 26 documented Grade 5 CCSS content standards',()=>{
  assert.equal(new Set(GRADE5_FULL_KINDS).size,34);
  assert.deepEqual(new Set(Object.keys(GRADE5_STANDARDS)),new Set(GRADE5_FULL_KINDS));
  assert.deepEqual(new Set(Object.values(GRADE5_STANDARDS)),new Set(GRADE5_STANDARD_IDS));
  assert.deepEqual([...GRADE5_FULL_COUNTS],[40,48]);
});

test('R102: 840 generated sample sets are deterministic, distinct, math-checked and standards complete',()=>{
  let total=0;
  for(const count of GRADE5_FULL_COUNTS){
   for(const level of ['easy','standard','challenge']){
    for(const seed of [0,1,2,42,314159,20261108,4294967295]){
      const pack=makeWidePack(seed,count,'grade5-full',level);
      verifyWidePack(pack);
      assert.deepEqual(pack,makeWidePack(seed,count,'grade5-full',level));
      assert.equal(pack.problems.length,count);
      assert.equal(new Set(pack.problems.map(p=>p.question)).size,count);
      assert.deepEqual(new Set(pack.problems.slice(0,34).map(p=>p.kind)),new Set(GRADE5_FULL_KINDS));
      assert.deepEqual(new Set(pack.problems.map(p=>GRADE5_STANDARDS[p.kind])),new Set(GRADE5_STANDARD_IDS));
      for(const p of pack.problems){independentlyCheck(p);total++;}
    }
   }
  }
  assert.equal(total,(40+48)*3*7);
});
test('R102: bad inputs, spoofed answer and missing standards cannot pass validation or reach PDF',async()=>{
  for(const [seed,count,level] of [[-1,40,'easy'],[0,24,'easy'],[1,49,'standard'],[1,40,'extreme']])
    assert.throws(()=>makeWidePack(seed,count,'grade5-full',level));
  const valid=makeWidePack(20261108,40,'grade5-full','standard');
  for(const change of [
    p=>{p.problems[0].answer='NOT THE RIGHT ANSWER';},
    p=>{p.problems[0].steps=['Invented steps','Invalid facts'];},
    p=>{p.problems[0].kind='g5s-nf-add';},
    p=>{p.problems.pop();},
    p=>{p.problems[33].kind='g5s-md-prism';},
    p=>{p.problems[0].values.a=1000000;}
  ]){
    const forged=structuredClone(valid);change(forged);
    assert.throws(()=>verifyWidePack(forged));
    await assert.rejects(createWidePdf(forged,'questions','Letter'));
  }
});
test('R102: 24 real student/teacher/steps PDFs in both paper sizes have correct identity and no empty pages',async()=>{
  let generated=0;
  for(const count of GRADE5_FULL_COUNTS){
    for(const paper of ['Letter','A4']){
      for(const edition of ['questions','answers','steps']){
        for(const seed of [0,20261108]){
          const pack=makeWidePack(seed,count,'grade5-full','challenge');
          const bytes=await createWidePdf(pack,edition,paper);
          const pdf=await PDFDocument.load(bytes);
          assert.ok(bytes.byteLength>3500);
          assert.ok(pdf.getPageCount()>=3);
          const title=pdf.getTitle()||'';
          assert.ok(title.includes('WM1-'+seed+'-grade5-full-challenge-'+count));
          assert.ok(title.includes(edition));
          for(const page of pdf.getPages()){
            assert.ok(Math.abs(page.getWidth()-(paper==='Letter'?612:595.28))<.12);
            assert.ok(Math.abs(page.getHeight()-(paper==='Letter'?792:841.89))<.12);
          }
          generated++;
        }
      }
    }
  }
  assert.equal(generated,24);
});
