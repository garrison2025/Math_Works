import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../src/data/routes.json' with {type:'json'};
import {makeWorksheet} from '../src/lib/math.ts';
import {checkPracticeAnswer,practiceAnswerFormat,supportsPracticeAnswer} from '../src/lib/practice-answer.ts';
import {checkExactNumber} from '../src/lib/answer-check.ts';

test('R96: distinct math answer formats are checked exactly and locally',()=>{
 const examples=[
  ['angle-worksheets','acute',' ACUTE ','correct'],
  ['angle-worksheets','obtuse','right','incorrect'],
  ['angle-worksheets','acute','3','invalid'],
  ['coordinate-plane-worksheets','II','quadrant II','correct'],
  ['coordinate-plane-worksheets','I','quadrant IV','incorrect'],
  ['lines-rays-segments-worksheets','ray','Ray','correct'],
  ['slope-worksheets','undefined','undefined','correct'],
  ['slope-worksheets','undefined','0','invalid'],
  ['domain-range-worksheets','yes','Yes','correct'],
  ['domain-range-worksheets','no','yes','incorrect'],
  ['systems-equations-worksheets','no solution','no solution','correct'],
  ['systems-equations-worksheets','infinitely many solutions','no solution','incorrect'],
  ['mean-median-mode-range-worksheets','no mode','none','correct'],
  ['box-plots-worksheets','none','none','correct'],
  ['scatter-plot-worksheets','negative','negative trend','correct'],
  ['scatter-plot-worksheets','no clear linear trend','none','correct'],
  ['scatter-plot-worksheets','positive','none','incorrect'],
  ['percentages-worksheets','12.5%','12.50%','correct'],
  ['percentages-worksheets','12.5%','12.51%','incorrect'],
  ['percentages-worksheets','12.5%','12.5','invalid'],
  ['scientific-notation-worksheets','3.25 × 10^-4','3.250 x 10^-4','correct'],
  ['scientific-notation-worksheets','3.25 × 10^-4','3.25*10^-3','incorrect'],
  ['scientific-notation-worksheets','3.25 × 10^-4','325e-6','invalid'],
  ['scientific-notation-worksheets','3.25 × 10^-4','32.5×10^-5','invalid'],
  ['scientific-notation-worksheets','1.2 × 10^8','1.200×10^8','correct'],
  ['inequalities-worksheets','x ≤ -4','x<=−4','correct'],
  ['inequalities-worksheets','x ≤ -4','x< -4','incorrect'],
  ['inequalities-worksheets','x ≥ 2','x>=2','correct'],
  ['inequalities-worksheets','x ≥ 2','2<=x','invalid'],
  ['domain-range-worksheets','{1, 3, 9}','{9,1,3}','correct'],
  ['domain-range-worksheets','{1, 3, 9}','{1,1,3,9}','invalid'],
  ['domain-range-worksheets','{1, 3, 9}','{1, 3, 8}','incorrect'],
  ['mean-median-mode-range-worksheets','2, 5','5,2','correct'],
  ['mean-median-mode-range-worksheets','2, 5','2,5,5','invalid'],
  ['systems-equations-worksheets','x = 3, y = -2','y=-2, x=3','correct'],
  ['systems-equations-worksheets','x = 3, y = -2','x=2, y=-3','incorrect'],
  ['systems-equations-worksheets','x = 3, y = -2','x=3, x=-2','invalid'],
  ['gcf-worksheets','12','24/2','correct'],
  ['gcf-worksheets','12','12+0','invalid']
 ];
 for(const [topic,answer,entered,expected] of examples){
  assert.equal(checkPracticeAnswer(topic,answer,entered),expected,
   topic+' expected '+answer+' submitted '+entered);
 }
});

test('R96: never mark physical/graphic tasks as verified by a text field',()=>{
 for(const [topic,answer] of [
  ['number-line-worksheets','-4'],['printable-protractor','45°'],
  ['linear-equations-worksheets','slope = 2; y-intercept = (0, 3)'],
  ['box-plots-worksheets','Q1=3, median=5, Q3=7; whiskers=1 to 12; outliers=none'],
  ['scatter-plot-worksheets','Coordinates: (1, 2), (2, 4)']
 ]){
  assert.equal(supportsPracticeAnswer(topic,answer),false,topic);
  assert.equal(checkPracticeAnswer(topic,answer,answer),'unsupported',topic);
 }
 assert.equal(checkPracticeAnswer('angle-worksheets','acute','acute;alert(1)'),'invalid');
 assert.equal(checkPracticeAnswer('percentages-worksheets','25%','25% OR 50%'),'invalid');
 assert.equal(checkPracticeAnswer('systems-equations-worksheets','x = 1, y = 2','x=1,y=2;'), 'invalid');
 assert.equal(checkPracticeAnswer('gcf-worksheets','1','1e0'),checkExactNumber('1','1e0'));
});

test('R96: every recognized generated answer checks as correct across active routes and varied seeds',()=>{
 let checked=0,unsupported=0,topicTypes=new Set(),skipped={};
 for(const route of routes.filter(r=>r.type!=='HOLD')){
  for(const difficulty of ['easy','standard','challenge']){
   for(let seed=1;seed<=25;seed++){
    const set=makeWorksheet(route.slug,seed,4,difficulty);
    for(const p of set.problems){
     const k=practiceAnswerFormat(route.slug,p.expectedAnswer);
     if(k.kind==='unsupported'){
      unsupported++;
      skipped[route.slug]=(skipped[route.slug]??0)+1;
      continue;
     }
     assert.ok(k.hint.length>8,route.slug+' missing accessible format instructions');
     const result=checkPracticeAnswer(route.slug,p.expectedAnswer,p.expectedAnswer);
     assert.equal(result,'correct',route.slug+' '+p.payload.question+' answer '+p.expectedAnswer);
     topicTypes.add(k.kind);checked++;
    }
   }
  }
 }
 assert.ok(checked>8500,'Too few typed-answer checks: '+checked);
 for(const expected of ['numeric','enum','percent','scientific','set','mode-list','inequality','xy'])
  assert.ok(topicTypes.has(expected),'No actual generated samples covered '+expected);
 assert.ok(unsupported>0,'Visual tasks must not be incorrectly auto-graded');
 assert.ok((skipped['printable-protractor']??0)>0);
 assert.ok((skipped['number-line-worksheets']??0)>0);
});

test('R96: question-specific variants remain exact and reject off-by-one input',()=>{
 const targeted=[
  ['percentages-worksheets',{direction:'fraction-to-percent'}],
  ['scientific-notation-worksheets',{direction:'to-scientific',significantDigits:'4'}],
  ['inequalities-worksheets',{coefficient:'negative'}],
  ['systems-equations-worksheets',{method:'general'}],
  ['systems-equations-worksheets',{method:'parallel'}],
  ['domain-range-worksheets',{task:'range',relation:'not-function'}],
  ['mean-median-mode-range-worksheets',{statistic:'mode',modePattern:'two'}],
  ['box-plots-worksheets',{statistic:'outliers'}],
  ['scatter-plot-worksheets',{task:'identify',trend:'none'}]
 ];
 let validated=0;
 for(const [topic,options] of targeted){
  for(let seed=5;seed<60;seed++){
   const sheet=makeWorksheet(topic,seed,4,'challenge',options);
   for(const p of sheet.problems){
    const kind=practiceAnswerFormat(topic,p.expectedAnswer).kind;
    if(kind==='unsupported')continue;
    assert.equal(checkPracticeAnswer(topic,p.expectedAnswer,p.expectedAnswer),'correct',topic+' seed='+seed);
    validated++;
   }
  }
 }
 assert.ok(validated>1700,'Not enough targeted generated answer checks');
});
