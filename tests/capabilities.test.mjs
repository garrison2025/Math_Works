import test from 'node:test';
import assert from 'node:assert/strict';
import {hasVerifiedSteps,verifiedStepTopics} from '../src/lib/capabilities.ts';
import routes from '../src/data/routes.json' with {type:'json'};
test('step export is a narrow auditable allowlist, not an implicit promise for every route',()=>{
 const allowed=verifiedStepTopics();
 assert.equal(allowed.length,23);
 assert.ok(allowed.every(slug=>routes.some(r=>r.slug===slug&&(r.type==='CONDITIONAL_TOOL'||(slug==='fractions-worksheets'&&r.type==='CONDITIONAL_HUB')))));
 assert.ok(hasVerifiedSteps('fractions-worksheets'), 'The fractions hub is the one explicitly reviewed worked-steps exception');
 assert.ok(hasVerifiedSteps('two-step-equations-worksheets'));
 assert.ok(hasVerifiedSteps('mean-absolute-deviation-worksheets'));
 assert.ok(!hasVerifiedSteps('box-plots-worksheets'));
 assert.ok(!hasVerifiedSteps('word-problems-worksheets'));
 assert.ok(hasVerifiedSteps('multiplication-worksheets'));
});
