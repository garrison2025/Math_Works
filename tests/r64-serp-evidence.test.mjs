import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import targets from '../src/data/seo-targets.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import r64 from '../src/data/serp-observations-r64.json' with {type:'json'};
import capabilities from '../src/data/seo-r64-resolutions.json' with {type:'json'};
import {releasePaths} from '../src/lib/indexation.ts';
import routes from '../src/data/routes.json' with {type:'json'};

test('R64 eight real named public competitor pages are scoped to existing 8 source-backed topic queries',()=>{
 assert.equal(r64.schema,'mathworks-r64-observation/v1');
 assert.equal(r64.observations.length,8);
 const byRoute=new Map(targets.map(t=>[t.slug,t]));
 const seen=new Set(),urls=new Set();
 for(const row of r64.observations){
  assert.equal(row.primary,byRoute.get(row.slug)?.primary);
  assert.ok(!seen.has(row.slug));seen.add(row.slug);
  assert.ok(!urls.has(row.competitorUrl));urls.add(row.competitorUrl);
  assert.equal(new URL(row.competitorUrl).protocol,'https:');
  assert.ok(row.ourFeature.length>65&&row.observed.length>65&&row.gap.length>65);
  assert.ok(['HIGH','MEDIUM','LOW'].includes(row.priority));
 }
 assert.ok(!r64.researchScope.includes('rank export success'),'Must not fake a geography-locked Google ranking export');
});
test('R64 seven chart query capability reclassifications preserve exact R63 historical flags, but never grant indexability',()=>{
 assert.equal(capabilities.schema,'mathworks-r64-resolved-capability/v1');
 assert.equal(capabilities.resolvedFromR63.length,7);
 const historical=new Map(r63.issues.map(i=>[i.slug+'|'+i.keyword,i]));
 const seen=new Set();
 for(const row of capabilities.resolvedFromR63){
  assert.ok(!seen.has(row.keyword));seen.add(row.keyword);
  assert.equal(historical.get('multiplication-tables-worksheets|'+row.keyword)?.classification,'needs-review');
  assert.equal(row.newCapabilityState,'EXACT_1_TO_12_GRID_FEATURE_IMPLEMENTED');
  assert.equal(row.approvedForIndexing,false);
  assert.equal(row.liveSERPConfirmed,false);
 }
 assert.ok(!seen.has('multiplication table to 100'),'Do not imply a 1–100 chart feature');
 const site={site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'};
 assert.deepEqual(releasePaths(site,routes),[]);
});
test('R64 1–12 chart feature is included on exactly its intended built subject page',()=>{
 const source=readFileSync(new URL('../src/components/Workspace.astro',import.meta.url),'utf8');
 assert.match(source,/slug==='multiplication-tables-worksheets'.+data-action="multiplication-grid-blank"/);
 assert.match(source,/data-action="multiplication-grid-key"/);
 assert.ok(source.includes('not change the seed'));
});
