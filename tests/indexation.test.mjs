import test from 'node:test';
import assert from 'node:assert/strict';
import {releasePaths,isIndexablePath} from '../src/lib/indexation.ts';
import {readFileSync} from 'node:fs';
const topics=JSON.parse(readFileSync(new URL('../src/data/routes.json',import.meta.url)));
const tool=topics.find(t=>t.type==='CONDITIONAL_TOOL').slug;
const hub=topics.find(t=>t.type==='CONDITIONAL_HUB').slug;
const hold=topics.find(t=>t.type==='HOLD').slug;
const base={site:'https://mathclassroom.org',enabled:'true',routes:`${tool},${hub},${hold}`,branch:'main'};
test('default preview, sample domains and feature branch never become indexable',()=>{
 for(const scenario of [{...base,enabled:'false'}, {...base,site:'https://mathclassroom.pages.dev'}, {...base,site:'https://example.com'}, {...base,site:'http://mathclassroom.org'}, {...base,site:'https://mathclassroom.org:8080'}, {...base,branch:'feature/foo'}, {...base,routes:''}]){
  assert.deepEqual(releasePaths(scenario,topics),[],JSON.stringify(scenario));
 }
});
test('release only explicitly approved specialized topics; no hubs or HOLD',()=>{
 const paths=releasePaths(base,topics);
 assert.ok(paths.includes('/'));
 assert.ok(paths.includes(`/${tool}/`));
 assert.ok(!paths.includes(`/${hub}/`));
 assert.ok(!paths.includes(`/${hold}/`));
 assert.ok(isIndexablePath(`/${tool}/`,base,topics));
 assert.ok(!isIndexablePath(`/${hub}/`,base,topics));
 assert.ok(paths.includes("/terms/"));
 assert.equal(paths.length,6);
});
