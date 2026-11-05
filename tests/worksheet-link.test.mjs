import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {normalizeTopicOptions,topicOptionDefinitions} from '../src/lib/topic-options.ts';
import {makeWorksheet} from '../src/lib/math.ts';
test('share links round-trip every active worksheet topic option',()=>{
 for(const [topic,setting] of [
  ['integer-operations-worksheets',{operation:'division'}],
  ['two-step-equations-worksheets',{coefficient:'negative'}],
  ['multiplication-tables-worksheets',{table:'7'}],
  ['equivalent-fractions-worksheets',{missing:'denominator'}],
  ['coordinate-plane-worksheets',{quadrant:'IV'}],
  ['mean-median-mode-range-worksheets',{statistic:'median'}],
  ['addition-worksheets',{}]
 ]){
  const expected={seed:425776,quantity:8,difficulty:'challenge',paper:'A4',options:normalizeTopicOptions(topic,setting)};
  const link=buildWorksheetLink(`https://math-works.pages.dev/${topic}/?old=1#preview`,topic,expected);
  assert.ok(!link.includes('old=1')&&!link.includes('#preview'));
  assert.ok(link.includes('gv=15'),'generator version absent from share link');
  assert.ok(!link.includes('student')&&!link.includes('Name='));
  const received=parseWorksheetLink(link,topic);
  assert.deepEqual(received,expected);
  assert.deepEqual(makeWorksheet(topic,expected.seed,expected.quantity,expected.difficulty,expected.options),makeWorksheet(topic,received.seed,received.quantity,received.difficulty,received.options));
 }
});
test('malformed link configuration fails closed without throwing',()=>{
 const bad='https://math-works.pages.dev/two-step-equations-worksheets/?seed=-1&difficulty=super&quantity=999&paper=A0&opt_coefficient=zero&opt_malicious=yes';
 assert.deepEqual(parseWorksheetLink(bad,'two-step-equations-worksheets'),{options:{}});
 assert.throws(()=>buildWorksheetLink('https://math-works.pages.dev/','two-step-equations-worksheets',{seed:-1,quantity:8,difficulty:'standard',paper:'Letter',options:{}}));
});

test('all 51 specialized selectors round-trip each permitted choice without losing PDF identity',()=>{
 for(const [topic,defs] of Object.entries(topicOptionDefinitions))for(const def of defs)for(const choice of def.choices){
  const options=normalizeTopicOptions(topic,{[def.key]:choice.value});
  const expected={seed:0x1234abcd,difficulty:'standard',quantity:8,paper:'Letter',options};
  const link=buildWorksheetLink(`https://math-works.pages.dev/${topic}/`,topic,expected);
  const restored=parseWorksheetLink(link,topic);
  assert.deepEqual(restored,expected,`${topic}: ${choice.value}`);
  const before=makeWorksheet(topic,expected.seed,expected.quantity,expected.difficulty,expected.options);
  const after=makeWorksheet(topic,restored.seed,restored.quantity,restored.difficulty,restored.options);
  assert.equal(before.optionsHash,after.optionsHash);
  assert.deepEqual(before.answerMap,after.answerMap);
 }
});
