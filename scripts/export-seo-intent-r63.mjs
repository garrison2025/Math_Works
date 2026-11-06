/** R63 source-preserving SEO phrase intent triage. No rank or indexing claims. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const data=new URL('../src/data/',import.meta.url);
const load=async name=>JSON.parse(await readFile(new URL(name,data),'utf8'));
const [routes,targets,r62,r63]=await Promise.all([
 load('routes.json'),load('seo-targets.json'),load('seo-intent-review.json'),load('seo-intent-r63.json')
]);
function fields(s){
 const a=[];let value='',quote=false;
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c==='"'){if(quote&&s[i+1]==='"'){value+='"';i++}else quote=!quote}
  else if(c===','&&!quote){a.push(value);value=''}else value+=c;
 }
 a.push(value);return a;
}
const raw=(await readFile(new URL('keyword-evidence.csv',data),'utf8')).trimEnd().split(/\r?\n/);
assert.equal(raw.shift(),'keyword,monthly_volume,semrush_kd,competitor_rank_type,estimated_competitor_visits,source,canonical_candidate');
const ticks=String.fromCharCode(96);
const rows=raw.map(line=>{
 const f=fields(line);assert.equal(f.length,7);
 const [q,vol,kd,rank,visits,source,path]=f;
 assert.ok(q.startsWith(ticks)&&q.endsWith(ticks)&&path.startsWith(ticks+'/')&&path.endsWith('/'+ticks));
 return {keyword:q.slice(1,-1),route:path.slice(2,-2),
  sourceMonthlyVolume:Number(vol),sourceSemrushKD:Number(kd),
  competitorRankType:rank,estimatedCompetitorVisits:Number(visits),source};
});
assert.equal(rows.length,488);
const pathBySlug=new Map(routes.map(r=>[r.slug,r]));
const targetBySlug=new Map(targets.map(r=>[r.slug,r]));
const key=r=>r.slug+'|'+r.keyword;
const flags=[...r62.flagged,...r63.issues];
const originalKeys=new Set(rows.map(r=>r.route+'|'+r.keyword));
const flagByKey=new Map();
const classes={unsupported:0,'wrong-page':0,'needs-review':0};
for(const flag of flags){
 const k=key(flag);
 assert.ok(originalKeys.has(k),'Flag refers to uncollected search term '+k);
 assert.ok(!flagByKey.has(k),'Duplicate SEO triage '+k);
 assert.ok(flag.reason.length>=25&&Object.hasOwn(classes,flag.classification));
 if(flag.suggestedRoute)assert.ok(pathBySlug.get(flag.suggestedRoute)?.type!=='HOLD','Flag reroute not available');
 flagByKey.set(k,flag);classes[flag.classification]++;
}
assert.equal(r62.flagged.length,21);assert.equal(r63.issues.length,124);
assert.equal(flagByKey.size,145);
assert.deepEqual(classes,{unsupported:67,'wrong-page':19,'needs-review':59});
let selected=0;
const records=rows.map(row=>{
 const route=pathBySlug.get(row.route),focus=targetBySlug.get(row.route),flag=flagByKey.get(row.route+'|'+row.keyword);
 assert.ok(route);
 const isPrimary=focus?.primary===row.keyword;
 if(isPrimary){selected++;assert.ok(!flag,'Flagged phrase is a primary SEO heading')}
 return {...row,routeType:route.type,priority:route.priority,isPrimary,
  keywordIntentStatus:flag?'FLAGGED_'+flag.classification.toUpperCase().replaceAll('-','_')
   :route.type==='HOLD'?'HOLD_PAGE_NOT_BUILT'
   :isPrimary?'PRIMARY_FROM_SOURCE_AWAITING_SERP'
   :'SOURCE_MAPPED_NOT_INDIVIDUALLY_VERIFIED',
  suggestedExistingRoute:flag?.suggestedRoute??'',reason:flag?.reason??'',
  currentLiveSerpVerified:false,approvedForIndexing:false};
});
assert.equal(selected,51);
assert.deepEqual(
 [records.filter(r=>r.routeType==='CONDITIONAL_TOOL').length,
  records.filter(r=>r.routeType==='CONDITIONAL_HUB').length,
  records.filter(r=>r.routeType==='HOLD').length],
 [272,165,51]);
const sorted=[...records].sort((a,b)=>{
 const score=s=>s==='FLAGGED_UNSUPPORTED'?0:s==='FLAGGED_WRONG_PAGE'?1:s==='FLAGGED_NEEDS_REVIEW'?2:s==='HOLD_PAGE_NOT_BUILT'?3:4;
 return score(a.keywordIntentStatus)-score(b.keywordIntentStatus)||
  b.sourceMonthlyVolume-a.sourceMonthlyVolume||a.keyword.localeCompare(b.keyword);
});
const cols=['keyword','route','routeType','priority','sourceMonthlyVolume','sourceSemrushKD',
 'competitorRankType','estimatedCompetitorVisits','source','isPrimary',
 'keywordIntentStatus','suggestedExistingRoute','reason','currentLiveSerpVerified','approvedForIndexing'];
const csvValue=v=>{
 const s=String(v??'');
 return /[,"\n\r]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;
};
const out='qa-artifacts/r63-seo-intent-triage';await mkdir(out,{recursive:true});
const saveCsv=async(name,items)=>writeFile(join(out,name),
 cols.join(',')+'\n'+items.map(r=>cols.map(c=>csvValue(r[c])).join(',')).join('\n')+'\n');
await saveCsv('all-488-keywords.csv',sorted);
await saveCsv('145-flagged-review.csv',sorted.filter(r=>r.keywordIntentStatus.startsWith('FLAGGED')));
await saveCsv('19-wrong-page-proposals.csv',sorted.filter(r=>r.keywordIntentStatus==='FLAGGED_WRONG_PAGE'));
const routeMatrix=routes.map(route=>{
 const entries=records.filter(r=>r.route===route.slug),issues=entries.filter(r=>r.keywordIntentStatus.startsWith('FLAGGED'));
 return {route:route.slug,type:route.type,priority:route.priority,
  selectedPrimary:targetBySlug.get(route.slug)?.primary??null,
  sourceMappedKeywords:entries.length,flaggedKeywords:issues.length,
  summedFlaggedSourceVolumeNotTrafficForecast:issues.reduce((n,r)=>n+r.sourceMonthlyVolume,0),
  indexing:'NOT APPROVED',liveSerpReview:'NOT RUN'};
});
await writeFile(join(out,'55-route-matrix.json'),JSON.stringify(routeMatrix,null,2)+'\n');
const summary={schema:'mathworks-r63-seo-readiness/v1',
 sourceKeywordRows:488,activeToolPages:43,activeHubPages:8,heldRoutes:4,
 sourceSelectedPrimaryPhrases:51,
 r62Flags:21,r63AdditionalFlags:124,allFlagged:145,
 classCounts:classes,unflaggedNotVerified:343,
 routeMapping:{specialist:272,hub:165,hold:51},
 caveats:[
  'Original source Semrush values have not been freshly rechecked, and are NOT Google Search Console traffic.',
  'Unflagged terms are not individually live-SERP verified and not automatically approved.',
  'Source keyword volumes are overlapping and not additive attainable search traffic.',
  'Wrong-page suggestions are proposals; no original source row was mutated.',
  'No public indexing: pages.dev remains noindex,nofollow; a purchased domain and explicit approved allowlist are required.',
  'Real classroom printer and teacher QA, exact Cloudflare deployed commit and GSC are separate launch gates.'
 ]};
await writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const notes=[
 '# R63 — keyword intent and publication gate',
 '',
 'The original 488 imported keywords remain unchanged.',
 '145 exact phrases flagged against actual implemented generator capability: 67 unsupported, 19 misrouted, 59 requiring further SERP/functional review.',
 '343 other phrases are NOT individually approved; 51 selected primary source phrases also require live Google SERP checks.',
 '',
 'Files: all-488-keywords.csv, 145-flagged-review.csv, 19-wrong-page-proposals.csv, 55-route-matrix.json, summary.json.',
 'Do not add flagged unsupported queries to page titles, keyword bait or official indexation allowlists.',
 'The 8 hubs and 4 HOLD pages stay excluded; no domain purchase or Cloudflare deploy approval is implied.'
];
await writeFile(join(out,'README.md'),notes.join('\n')+'\n');
console.log('R63 SEO AUDIT PASS: 488 original source rows, 145 flagged (67 unsupported / 19 wrong page / 59 review), 343 not yet reviewed; 0 newly indexable.');
