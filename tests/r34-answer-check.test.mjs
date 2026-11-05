import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExactNumber,checkExactNumber,supportsExactNumber} from '../src/lib/answer-check.ts';
test('R34 numeric equivalence is exact, bounded and safe',()=>{
 for(const [expected,entered,result] of [
  ['1/2','2/4','correct'],['1/2','0.5','correct'],['-1.5','-3/2','correct'],
  ['10.000','10','correct'],['5000','5,000','correct'],['3/4','4/3','incorrect'],
  ['3/4','1/0','invalid'],['12','1+11','invalid'],['yes','yes','unsupported'],
  ['5','5; alert(1)','invalid'],['1/2','0.50','correct'],['0','-0','correct'],
  ['7','  7  ','correct'],['2','2.1','incorrect'],['6','6/3','incorrect']
 ])assert.equal(checkExactNumber(expected,entered),result,`${expected}, ${entered}`);
 assert.equal(parseExactNumber('9'.repeat(100)),undefined);
 assert.equal(supportsExactNumber('3/4'),true);
 assert.equal(supportsExactNumber('x = 3'),false);
 assert.equal(supportsExactNumber('25%'),false);
});
test('R34 huge ratios and decimal precision have no floating-point fallback',()=>{
 assert.equal(checkExactNumber('9'.repeat(30)+'/'+'3'.repeat(30),'3'), 'correct');
 assert.equal(checkExactNumber('0.1','0.10000000000000001'),'incorrect');
 assert.equal(checkExactNumber('1','1e0'),'invalid');
});
