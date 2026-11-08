import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import routes from '../src/data/routes.json' with {type:'json'};
import targets from '../src/data/seo-targets.json' with {type:'json'};
import {TOPIC_SEO} from '../src/data/topic-seo.ts';
import {hasVerifiedSteps} from '../src/lib/capabilities.ts';
import {OWNED_SITE,releaseForBuild,publishedPaths} from '../src/lib/publication.ts';
function parseCSV(input){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<input.length;i++){const c=input[i],next=input[i+1];
  if(quoted){if(c==='"'&&next==='"'){value+='"';i++;}else if(c==='"')quoted=false;else value+=c;}
  else if(c==='"')quoted=true;else if(c===','){row.push(value);value='';}
  else if(c==='\n'){row.push(value);rows.push(row);row=[];value='';}
  else if(c!=='\r')value+=c;
 }
 if(value||row.length){row.push(value);rows.push(row);}return rows;
}
const stripTicks=value=>String(value||'').replace(new RegExp('^'+String.fromCharCode(96)+'|'+String.fromCharCode(96)+'$','g'),'');
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('one canonical algebra and geometry hub consolidates the old URLs',()=>{
 const paths=publishedPaths(releaseForBuild(routes,'main'),routes);
 assert.equal(paths.length,64);assert.ok(paths.includes('/algebra/')&&paths.includes('/geometry/'));
 assert.ok(!paths.includes('/algebra-general-worksheets/')&&!paths.includes('/geometry-general-worksheets/'));
 const redirects=read('../public/_redirects');
 for(const line of ['/algebra-general-worksheets /algebra/ 301','/algebra-general-worksheets/ /algebra/ 301','/geometry-general-worksheets /geometry/ 301','/geometry-general-worksheets/ /geometry/ 301'])
  assert.ok(redirects.split('\n').includes(line),'Missing redirect '+line);
 assert.equal(OWNED_SITE,'https://mathworksheetstudio.com');
});
test('canonical subject pages retain the original advanced interactive generators',()=>{
 const algebra=read('../src/pages/algebra/index.astro'),geometry=read('../src/pages/geometry/index.astro');
 assert.match(algebra,/FocusDrills scope="algebra"/);assert.match(algebra,/formula rearrangement/);assert.match(algebra,/expression simplification/);
 assert.match(geometry,/SolidVolumes/);assert.match(geometry,/FocusDrills scope="angles"/);assert.match(geometry,/R101Comprehensive scope="geometry"/);
 assert.match(geometry,/Triangle congruence/);assert.match(geometry,/circle measurements/);
});
test('homepage and library navigation use only the canonical subject hubs',()=>{
 for(const path of ['../src/pages/index.astro','../src/components/WorksheetDirectory.astro']){
  const source=read(path);assert.match(source,/href="\/algebra\/"/);assert.match(source,/href="\/geometry\/"/);
  assert.doesNotMatch(source,/algebra-general-worksheets|geometry-general-worksheets/);
 }
});
test('grade guide fragments resolve to real canonical subject sections',()=>{
 const grade=read('../src/pages/worksheets-by-grade/index.astro');
 const algebra=read('../src/components/FocusDrills.astro');
 const geometry=read('../src/pages/geometry/index.astro');
 assert.match(grade,/href="\/algebra\/#algebra-focus-lab"/);
 assert.match(grade,/href="\/geometry\/#point-angle-lab"/);
 assert.match(algebra,/id=\{anchor\}/);
 assert.match(algebra,/const anchor=isAngles\?'angle-drill':'algebra-focus-lab'/);
 assert.match(geometry,/id="point-angle-lab"/);
});
test('all 51 primary keyword metrics match the exact original CSV rows',()=>{
 const rows=parseCSV(read('../src/data/keyword-evidence.csv')),columns=Object.fromEntries(rows[0].map((n,i)=>[n,i]));
 const evidence=rows.slice(1).map(row=>({keyword:stripTicks(row[columns.keyword]),volume:Number(row[columns.monthly_volume]),kd:Number(row[columns.semrush_kd]),slug:stripTicks(row[columns.canonical_candidate]).replace(/^\/|\/$/g,'')}));
 assert.equal(targets.length,51);
 for(const target of targets){const source=evidence.find(row=>row.slug===target.slug&&row.keyword===target.primary),route=routes.find(row=>row.slug===target.slug);
  assert.ok(source,'No exact source row '+target.slug);assert.equal(target.sourceMonthlyVolume,source.volume,target.slug+' target volume');
  assert.equal(target.sourceSemrushKD,source.kd,target.slug+' target KD');assert.equal(route.volume,source.volume,target.slug+' route volume');assert.equal(route.kd,source.kd,target.slug+' route KD');
 }
});
test('topic snippets never promise a worked-step PDF where none is verified',()=>{
 assert.equal(Object.keys(TOPIC_SEO).length,51);
 for(const [slug,seo] of Object.entries(TOPIC_SEO))if(/worked[- ]steps?|worked solutions|solution steps/i.test(seo.description))assert.ok(hasVerifiedSteps(slug),'Unverified steps '+slug);
 const home=read('../src/pages/index.astro');assert.match(home,/worked steps are available on supported topics/i);assert.match(home,/without an account/i);assert.match(home,/A4 or US Letter/i);assert.doesNotMatch(home,/verified worked steps\./i);
});
