import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../src/data/routes.json' with {type:'json'};
import quality from '../src/data/seo-r114-topic-instructions.json' with {type:'json'};
import {howTo,commonMistakes} from '../src/lib/site.ts';

const GENERIC_HOW_TO=[
 'Choose a difficulty and number of practice questions.',
 'Solve the questions on your printable worksheet.',
 'Use the separate answer key to verify each answer.'
];
const GENERIC_COMMON_MISTAKES=[
 'Not checking the requested unit or answer form.',
 'Skipping the inverse or substitution check when one is available.'
];

test('R114 every published topic has generator-specific instructions and common mistakes',()=>{
 const live=routes.filter(route=>route.type!=='HOLD');
 assert.equal(live.length,51);
 assert.equal(quality.schema,'mathworks-r114-topic-instructions/v1');
 assert.equal(quality.publishedRouteCount,51);
 assert.equal(quality.topicSpecificHowToCount,51);
 assert.equal(quality.topicSpecificCommonMistakesCount,51);
 assert.equal(quality.newIndexableUrls,0);
 for(const route of live){
  const steps=howTo(route.slug),mistakes=commonMistakes(route.slug);
  assert.ok(steps.length>=2,'Missing how-to steps '+route.slug);
  assert.ok(mistakes.length>=2,'Missing common mistakes '+route.slug);
  assert.notDeepEqual(steps,GENERIC_HOW_TO,'Generic how-to fallback remains '+route.slug);
  assert.notDeepEqual(mistakes,GENERIC_COMMON_MISTAKES,'Generic common-mistake fallback remains '+route.slug);
 }
});
