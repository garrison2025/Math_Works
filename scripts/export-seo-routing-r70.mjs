/** R70 owner-source-preserving 488-keyword effective routing audit.
 * Suggested routes are validated from implemented skills; not SERP verified.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const root=new URL('../src/data/',import.meta.url);
const load=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
const [routes,remaps,r62,r63,...extensions]=await Promise.all([
 'routes.json','seo-routing-r70.json','seo-intent-review.json','seo-intent-r63.json',
 'seo-r66-fraction-line-capability.json','seo-r67-decimal-division-capability.json',
 'seo-r68-decimal-add-sub-capability.json','seo-r69-fraction-decimal-capability.json'].map(load));
const lines=(await readFile(new URL('keyword-evidence.csv',root),'utf8')).trimEnd().split(/\r?\n/);
assert.equal(lines.shift(),'keyword,monthly_volume,semrush_kd,competitor_rank_type,estimated_competitor_visits,source,canonical_candidate');
function parseCSV(s){
 const out=[];let item='',quoted=false;
 for(let i=0;i<s.length;i++){const x=s[i];
  if(x==='"'){if(quoted&&s[i+1]==='"'){item+='"';i++}else quoted=!quoted;}
  else if(x===','&&!quoted){out.push(item);item='';}
  else item+=x;
 }out.push(item);return out;
}
const ticks=String.fromCharCode(96);
const rows=lines.map((line,i)=>{
 const f=parseCSV(line);assert.equal(f.length,7,'Owner CSV fields '+(i+2));
 const [key,volume,kd,rank,visits,source,route]=f;
 assert.ok(key.startsWith(ticks)&&key.endsWith(ticks)&&route.startsWith(ticks+'/')&&route.endsWith('/'+ticks));
 return {keyword:key.slice(1,-1),sourceMonthlyVolume:Number(volume),sourceSemrushKD:Number(kd),
  ownerOriginalRoute:route.slice(2,-2),sourceCompetitorRank:rank,sourceCompetitorVisits:Number(visits),
  sourceCompetitor:source};
});
assert.equal(rows.length,488);
const keys=new Set(rows.map(x=>x.ownerOriginalRoute+'|'+x.keyword));
assert.equal(keys.size,488);
const routeBySlug=new Map(routes.map(x=>[x.slug,x]));
const allFlags=[...r62.flagged,...r63.issues];
assert.equal(allFlags.length,145);
const flagged=new Map(allFlags.map(x=>[x.slug+'|'+x.keyword,x]));
assert.equal(flagged.size,145);
const remapByKey=new Map(remaps.rows.map(x=>[x.sourceRoute+'|'+x.keyword,x]));
assert.equal(remapByKey.size,19);
assert.equal(remaps.rows.filter(x=>x.status==='corrected').length,15);
assert.equal(remaps.rows.filter(x=>x.status==='needs-serp').length,4);
for(const correction of remaps.rows){
 const key=correction.sourceRoute+'|'+correction.keyword,flag=flagged.get(key);
 assert.ok(keys.has(key)&&flag?.classification==='wrong-page','Source mismatch '+key);
 if(correction.status==='corrected'){
  assert.ok(correction.effectiveRoute!==correction.sourceRoute);
  assert.ok(routeBySlug.get(correction.effectiveRoute)?.type!=='HOLD');
 }else assert.equal(correction.effectiveRoute,null);
}
const capabilities=new Set(extensions.flatMap(x=>[
 ...(x.keywordCapabilityUpdates||[]).map(y=>y.keyword),
 ...(x.originalKeywordIntentGaps||[]).map(y=>y.keyword)
]));
assert.equal(capabilities.size,13,'Exactly 13 previously unsupported source keywords got actual R66-R69 capabilities');
const classified=rows.map(row=>{
 const key=row.ownerOriginalRoute+'|'+row.keyword,flag=flagged.get(key),change=remapByKey.get(key);
 const feature=capabilities.has(row.keyword);
 assert.ok(!feature||flag?.classification==='unsupported');
 const state=change?change.status==='corrected'?'corrected-target':'requires-serp-before-routing':
  feature?'implemented-new-capability':
  flag?flag.classification==='unsupported'?'not-supported':
   flag.classification==='wrong-page'?'wrong-page-unresolved':'requires-serp-or-implementation-review':
  'not-individually-reviewed';
 return {...row,effectiveRoute:change?.effectiveRoute||row.ownerOriginalRoute,
  intentStatus:state,issueReason:change?.reason||flag?.reason||'',
  indexingStatus:routeBySlug.get(change?.effectiveRoute||row.ownerOriginalRoute)?.type==='CONDITIONAL_TOOL'?
   'CONDITIONAL_NOT_APPROVED':'NOT_APPROVED'};
});
const statuses=classified.reduce((acc,x)=>(acc[x.intentStatus]=(acc[x.intentStatus]||0)+1,acc),{});
assert.equal(statuses['corrected-target'],15);
assert.equal(statuses['requires-serp-before-routing'],4);
assert.equal(statuses['implemented-new-capability'],13);
assert.equal(statuses['not-supported'],54);
assert.equal(statuses['requires-serp-or-implementation-review'],59);
assert.equal(statuses['not-individually-reviewed'],343);
assert.equal(classified.length,488);
const output='qa-artifacts/r70-corrected-keyword-routing';
await mkdir(output,{recursive:true});
function csvCell(s){const t=String(s??'');return /[,"\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t;}
const headers=['keyword','sourceMonthlyVolume','sourceSemrushKD','ownerOriginalRoute','effectiveRoute','intentStatus','indexingStatus','issueReason','sourceCompetitor'];
await writeFile(join(output,'all-488-effective-routing.csv'),
 [headers.join(','),...classified.map(x=>headers.map(k=>csvCell(x[k])).join(','))].join('\n')+'\n');
await writeFile(join(output,'19-reviewed-misroutes.json'),JSON.stringify(remaps.rows,null,2)+'\n');
await writeFile(join(output,'117-remaining-flagged-intents.json'),JSON.stringify(classified.filter(x=>
 ['not-supported','requires-serp-or-implementation-review','requires-serp-before-routing'].includes(x.intentStatus)),null,2)+'\n');
const summary={
 schema:'r70-evidence-aware-routing-audit/v1',date:'2026-11-06',
 originalRows:488,ownerOriginalCSVModified:false,
 flagsHistorically:145,correctedToImplementedRoutes:15,ambiguousHeldForSerp:4,
 narrowNewFeaturesImplementedR66R69:13,remainingFlaggedIssues:117,
 stillUnsupported:54,needsSearchIntentReview:59,ambiguousBeforeRouting:4,
 unflaggedStillNotIndividuallyVerified:343,notApprovedForIndexing:488,
 statuses,nonClaims:[
  'This does not update source Semrush Volume/KD, original canonical candidates or Google US SERP ranks.',
  'Corrected paths reflect actual generator skills and do not guarantee Google intent fit.',
  'No change to production indexation: all preview pages remain noindex,nofollow.'
 ]};
await writeFile(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
await writeFile(join(output,'README.md'),
 '# R70 488-keyword corrective routing audit\n\n'+
 'The original user-supplied keyword-evidence.csv is preserved. 19 source route mismatches are reviewed: '+
 '15 have an implemented specialist destination; 4 remain intentionally ambiguous pending real Google US SERP review. '+
 '13 independently implemented R66–R69 keyword skills are marked narrowly resolved. '+
 '117 historical issue flags still need work (54 unsupported, 59 to review, 4 ambiguous). '+
 'The 343 other keywords are not individually approved or SERP verified. Indexing remains off.\n');
console.log('R70 PASS: 488 exact user-sourced keywords; 15 corrected to implemented routes, 4 ambiguous held, 13 functional resolutions; 117 flagged issues remain.');
