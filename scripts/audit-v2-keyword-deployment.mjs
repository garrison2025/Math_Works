/** R89 frozen V2 keyword -> deployed page audit. NO SERP or KD re-research. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync,mkdirSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import routes from '../src/data/routes.json' with {type:'json'};
import targets from '../src/data/seo-targets.json' with {type:'json'};
import corrections from '../src/data/seo-routing-r70.json' with {type:'json'};
import {topicOptionsFor} from '../src/lib/topic-options.ts';
import {correctedTaskLinksFor} from '../src/lib/seo-routing-r70.ts';
import {WORKSHEET_SECTIONS,worksheetSectionFor} from '../src/lib/worksheet-directory.ts';
import {R98_PREVIEW_ONLY_HOLD_PAGES,isR98PreviewHold} from '../src/lib/preview-pages.ts';

function parseCsvRow(text){
 const values=[];let value='',quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}
  else if(ch===','&&!quoted){values.push(value);value=''}
  else value+=ch;
 }
 if(quoted)throw Error('Unbalanced CSV quotation');
 values.push(value);return values;
}
const lineSet=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').trimEnd().split(/\r?\n/);
assert.equal(lineSet.shift(),'keyword,monthly_volume,semrush_kd,competitor_rank_type,estimated_competitor_visits,source,canonical_candidate');
assert.equal(lineSet.length,488,'Source V2 must retain exactly 488 records');
const tick=String.fromCharCode(96);
const routeMap=new Map(routes.map(x=>[x.slug,x]));
const targetMap=new Map(targets.map(x=>[x.slug,x]));
const changes=new Map(corrections.rows.map(x=>[x.sourceRoute+'|'+x.keyword,x]));
assert.equal(routeMap.size,55);
assert.equal(targetMap.size,51);
assert.equal(corrections.rows.filter(x=>x.status==='corrected').length,15);
const dist=join(process.cwd(),'dist');
const htmlCache=new Map();
function pageHtml(slug){
 if(!htmlCache.has(slug)){
  const p=join(dist,slug,'index.html');
  assert.ok(existsSync(p),'Missing actual SSG generator '+slug);
  const html=readFileSync(p,'utf8');
  assert.match(html,/<title>[^<]{8,}<\/title>/i);
  assert.match(html,/<h1[\s>]/i);
  assert.match(html,/name="description"/i);
  assert.match(html,/name="robots"\s+content="noindex,nofollow"/i,'Preview is not allowed in Google');
  assert.doesNotMatch(html,/<link\s+rel="canonical"/i);
  assert.match(html,/data-workspace/,'No working generator was rendered');
  assert.match(html,/class="sample-img"/,'Missing real static preview element');
  const sample=join(dist,'images','worksheets',slug+'-sample.webp');
  assert.ok(existsSync(sample)&&statSync(sample).size>1000,'Missing static preview '+slug);
  htmlCache.set(slug,html);
 }
 return htmlCache.get(slug);
}
const seen=new Set(),routeCounts=new Map(),records=[];
for(const [index,line] of lineSet.entries()){
 const row=parseCsvRow(line);
 assert.equal(row.length,7,'Source CSV fields changed at '+(index+1));
 const [rawKeyword,volume,kd,ranking,visits,competitor,rawRoute]=row;
 assert.ok(rawKeyword.startsWith(tick)&&rawKeyword.endsWith(tick));
 assert.ok(rawRoute.startsWith(tick+'/')&&rawRoute.endsWith('/'+tick));
 const keyword=rawKeyword.slice(1,-1),originalRoute=rawRoute.slice(2,-2);
 assert.ok(!seen.has(keyword),'Duplicate keyword '+keyword);seen.add(keyword);
 const original=routeMap.get(originalRoute);
 assert.ok(original,'Unmapped V2 route '+originalRoute);
 assert.ok(Number.isInteger(+volume)&&+volume>=0);
 assert.ok(Number.isInteger(+kd)&&+kd>=0&&+kd<=29);
 assert.ok(Number.isFinite(+visits)&&+visits>=0);
 assert.ok(competitor.includes('Math-Drills:')||competitor.includes('MathWorksheets4Kids:'));
 routeCounts.set(originalRoute,(routeCounts.get(originalRoute)||0)+1);
 const correction=changes.get(originalRoute+'|'+keyword);
 const changed=correction?.status==='corrected';
 const effectiveRoute=changed?correction.effectiveRoute:originalRoute;
 const effective=routeMap.get(effectiveRoute);
 assert.ok(effective,'Corrected task route not in V2 '+effectiveRoute);
 if(original.type==='HOLD'){
  assert.ok(!changed,'V2 HOLD unexpectedly promoted');
  assert.ok(isR98PreviewHold(originalRoute),'Unreviewed or non-listed HOLD has been built: '+originalRoute);
  const hold=readFileSync(join(dist,originalRoute,'index.html'),'utf8');
  assert.match(hold,/<h1[\s>]/i,'Built preview lacks an informative heading');
  assert.match(hold,/name="robots"\s+content="noindex,nofollow"/i,'An unapproved HOLD preview became indexable');
  assert.doesNotMatch(hold,/<link\s+rel="canonical"/i,'HOLD preview leaked a public canonical');
  assert.doesNotMatch(hold,/<script type="application\/ld\+json"/i,'HOLD preview leaked schema');
 }else{
  const html=pageHtml(effectiveRoute);
  assert.ok(html.includes('data-seo-'+(effective.type==='CONDITIONAL_HUB'?'hub':'focus')));
  if(changed){
   const matching=correctedTaskLinksFor(originalRoute).find(l=>l.slug===effectiveRoute&&
    Object.entries(correction.requiredOptions).every(([key,value])=>
      new URL('https://math.example'+l.href).searchParams.get('opt_'+key)===value));
   assert.ok(matching,'Source navigation lost real selected option for '+keyword);
   for(const [key,value] of Object.entries(correction.requiredOptions)){
    const option=topicOptionsFor(effectiveRoute).find(o=>o.key===key);
    assert.ok(option&&option.choices.some(c=>c.value===value),'Unsupported selector for '+keyword);
   }
   const from=pageHtml(originalRoute);
   assert.ok(from.includes('data-r70-route-corrections'),'Missing corrected task links on source page');
   if(Object.keys(correction.requiredOptions).length)
    for(const [key,value] of Object.entries(correction.requiredOptions))
     assert.ok(from.includes('opt_'+key+'='+value),'Source link not passing '+key+'='+value);
  }
 }
 records.push({row:index+1,keyword,sourceVolume:+volume,sourceKD:+kd,
  competitorRankType:ranking,sourceCompetitor:competitor,estimatedCompetitorVisits:+visits,
  sourceRoute:originalRoute,effectiveRoute,requiredOptions:changed?correction.requiredOptions:{},
  routeType:effective.type,
  section:effective.type==='HOLD'?null:worksheetSectionFor(effectiveRoute),
  deployment:original.type==='HOLD'?'V2_HOLD_PREVIEW_ONLY':changed?'BUILT_CORRECTED_TASK':'BUILT_AS_PLANNED',
  searchIndexApproved:false});
}
assert.equal(seen.size,488);
assert.equal(routeCounts.size,55);
assert.equal(records.filter(x=>x.deployment==='V2_HOLD_PREVIEW_ONLY').length,51);
assert.equal(records.filter(x=>x.deployment==='BUILT_CORRECTED_TASK').length,15);
assert.equal(records.filter(x=>x.deployment!=='V2_HOLD_PREVIEW_ONLY').length,437);
for(const route of routes){
 if(route.type==='HOLD'){
  assert.ok(!targetMap.has(route.slug));
 }else{
  assert.ok(targetMap.has(route.slug),'Missing selected primary keyword '+route.slug);
  assert.ok(records.some(x=>x.keyword===targetMap.get(route.slug).primary&&x.sourceRoute===route.slug),
    'Source primary keyword differs from V2 evidence '+route.slug);
  const html=pageHtml(route.slug);
  assert.ok(html.includes('data-seo-'+(route.type==='CONDITIONAL_HUB'?'hub':'focus')),
   'Topic HTML mismatches V2 index policy');
 }
}
assert.equal(htmlCache.size,51);
const groups={};
for(const section of WORKSHEET_SECTIONS){
 const pathname=join(dist,section.slug,'index.html');
 assert.ok(existsSync(pathname),'Missing V2 subject library '+section.slug);
 const html=readFileSync(pathname,'utf8');
 assert.match(html,/name="robots"\s+content="noindex,nofollow"/i);
 const members=routes.filter(r=>r.type!=='HOLD'&&worksheetSectionFor(r.slug)===section.slug);
 assert.ok(members.length>0);
 for(const member of members)assert.ok(html.includes('/'+member.slug+'/'),'Missing directory topic '+member.slug);
 groups[section.slug]=members.length;
}
const all=readFileSync(join(dist,'worksheets','index.html'),'utf8');
assert.match(all,/name="robots"\s+content="noindex,nofollow"/i);
for(const route of routes)if(route.type!=='HOLD')
 assert.ok(all.includes('/'+route.slug+'/'),'Missing V2 master directory topic '+route.slug);
else assert.ok(all.includes('/'+route.slug+'/'),'R98 standalone noindex guide missing from directory '+route.slug);

const directory=join(process.cwd(),'qa-artifacts','r89-v2-keyword-deployment');
mkdirSync(directory,{recursive:true});
const status={
 schema:'mathworks-r89-owner-v2-keyword-deployment/v1',
 plan:'Frozen owner-provided V2.0: 488 keywords and 55 route intents',
 newSerpResearch:false,updatedSearchVolumeOrKD:false,
 originalKeywordRows:488,plannedRouteIntents:55,workingPages:51,
 supplementalPreviewPages:R98_PREVIEW_ONLY_HOLD_PAGES.length,
 mappedToWorkingPages:437,heldKeywordRows:51,heldRoutes:4,
 correctedTaskLinksWithExactOptions:15,
 subjectDirectories:['worksheets',...WORKSHEET_SECTIONS.map(s=>s.slug)],
 subjectCounts:groups,approvedIndexPages:0,
 teacherReview:'OWNER-WAIVED_NOT_CERTIFIED',physicalPrint:'OWNER-WAIVED_NOT_CERTIFIED',
 previewRobots:'noindex,nofollow',result:'PASS'
};
writeFileSync(join(directory,'summary.json'),JSON.stringify(status,null,2)+'\n');
writeFileSync(join(directory,'keyword-landing-matrix.json'),JSON.stringify(records,null,2)+'\n');
const columns=['row','keyword','sourceVolume','sourceKD','sourceRoute','effectiveRoute','routeType','section','deployment'];
const cell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
writeFileSync(join(directory,'keyword-landing-matrix.csv'),
 [columns.join(','),...records.map(row=>columns.map(c=>cell(row[c])).join(','))].join('\n')+'\n');
console.log('R89 PASS: 488 frozen keywords; 437 on 51 v18 generators; 51 historically HOLD rows remain unapproved but 4 distinct supplemental preview routes are built; all noindex.');
