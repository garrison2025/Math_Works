/** R80 up-to-date, source-preserving report across R62–R80. Distinguish
 * actual implemented skills from provisional route suggestions and SERP review.
 * This is an audit, not a keyword list for automatic search indexing.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const base=new URL('../src/data/',import.meta.url);
const file=async name=>JSON.parse(await readFile(new URL(name,base),'utf8'));
const [routes,r62,r63,r70,...caps]=await Promise.all([
 'routes.json','seo-intent-review.json','seo-intent-r63.json','seo-routing-r70.json',
 'seo-r66-fraction-line-capability.json','seo-r67-decimal-division-capability.json',
 'seo-r68-decimal-add-sub-capability.json','seo-r69-fraction-decimal-capability.json',
 'seo-r71-mult-div-capability.json','seo-r72-fraction-strips-capability.json',
 'seo-r73-division-stories-capability.json',
 'seo-r74-math-capability.json',
 'seo-r75-geometry-capability.json',
 'seo-r76-cylinder-capability.json',
 'seo-r78-solids-capability.json',
 'seo-r79-mixed-solids-capability.json',
 'seo-r80-nets-composite-capability.json'
].map(file));
const raw=(await readFile(new URL('keyword-evidence.csv',base),'utf8')).trimEnd().split(/\r?\n/);
assert.equal(raw.shift(),'keyword,monthly_volume,semrush_kd,competitor_rank_type,estimated_competitor_visits,source,canonical_candidate');
const quote=String.fromCharCode(96);
function parse(s){
 const out=[];let value='',inQuotes=false;
 for(let i=0;i<s.length;i++){
  if(s[i]==='"'){if(inQuotes&&s[i+1]==='"'){value+='"';i++;}else inQuotes=!inQuotes;}
  else if(s[i]===','&&!inQuotes){out.push(value);value='';}
  else value+=s[i];
 }out.push(value);return out;
}
const rows=raw.map(line=>{
 const cells=parse(line);assert.equal(cells.length,7);
 const [q,vol,kd,rank,visits,source,path]=cells;
 assert.ok(q.startsWith(quote)&&q.endsWith(quote)&&path.startsWith(quote+'/')&&path.endsWith('/'+quote));
 return {keyword:q.slice(1,-1),originalRoute:path.slice(2,-2),sourceMonthlyVolume:Number(vol),
  sourceSemrushKD:Number(kd),originalCompetitorSource:source,
  originalCompetitorRankType:rank,estimatedCompetitorVisits:Number(visits)};
});
assert.equal(rows.length,488);
const key=(route,keyword)=>route+'|'+keyword;
const sourceKeys=new Set(rows.map(r=>key(r.originalRoute,r.keyword)));
assert.equal(sourceKeys.size,488);
const routeMap=new Map(routes.map(r=>[r.slug,r]));
const flagged=[...r62.flagged,...r63.issues];
const issues=new Map(flagged.map(x=>[key(x.slug,x.keyword),x]));
assert.equal(flagged.length,145);assert.equal(issues.size,145);
const moves=new Map(r70.rows.map(x=>[key(x.sourceRoute,x.keyword),x]));
assert.equal(moves.size,19);
const implemented=new Map();
for(const [i,cap] of caps.entries()){
 const list=[...(cap.keywordCapabilityUpdates||[]),...(cap.originalKeywordIntentGaps||[])];
 for(const item of list){
  const keyword=item.keyword;
  const f=flagged.filter(f=>f.keyword===keyword);
  assert.equal(f.length,1,'Capability must correspond to exactly one historical issue: '+keyword);
  assert.equal(f[0].classification,'unsupported','Cannot call unflagged phrase a solved issue');
  const k=key(f[0].slug,keyword);
  assert.ok(sourceKeys.has(k),'Capability is not in original owner CSV: '+keyword);
  assert.ok(!implemented.has(k),'Duplicate implemented keyword '+keyword);
  implemented.set(k,{featureVersion:['R66','R67','R68','R69','R71','R72','R73','R74','R75','R76','R78','R79','R80'][i],
   actualRoute:item.actualPage||cap.actualRoute||cap.supportedRoute||f[0].slug});
 }
}
assert.equal(implemented.size,45,'Expected exactly 45 source-backed implemented keyword skills through R80');
const statuses={
 implementedNewFeature:0,correctedToExistingGenerator:0,ambiguousRoutingHeld:0,
 unsupportedFeature:0,requiresReview:0,notIndividuallyReviewed:0
};
const report=rows.map(row=>{
 const k=key(row.originalRoute,row.keyword),flag=issues.get(k),change=moves.get(k),cap=implemented.get(k);
 let status;
 if(cap)status='implementedNewFeature';
 else if(change?.status==='corrected')status='correctedToExistingGenerator';
 else if(change?.status==='needs-serp')status='ambiguousRoutingHeld';
 else if(flag?.classification==='unsupported')status='unsupportedFeature';
 else if(flag?.classification==='needs-review')status='requiresReview';
 else if(!flag)status='notIndividuallyReviewed';
 else throw Error('Unhandled flagged source '+k);
 statuses[status]++;
 const dest=change?.status==='corrected'?change.effectiveRoute:
  cap?.actualRoute||row.originalRoute;
 assert.ok(routeMap.has(dest),'Unlisted destination '+dest);
 return {...row,effectiveRoute:dest,
  currentStatus:status,actualFeature:cap?.featureVersion||'',
  issueNote:change?.reason||flag?.reason||'',
  indexation:'NOT_APPROVED'};
});
assert.deepEqual(statuses,{
 implementedNewFeature:45,correctedToExistingGenerator:15,
 ambiguousRoutingHeld:4,unsupportedFeature:22,
 requiresReview:59,notIndividuallyReviewed:343
});
const remaining=report.filter(r=>['ambiguousRoutingHeld','unsupportedFeature','requiresReview'].includes(r.currentStatus));
assert.equal(remaining.length,85);
function csvCell(v){
 const s=String(v??'');
 return /[,"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
}
function toCSV(fileRows,fields){
 return fields.join(',')+'\n'+fileRows.map(row=>fields.map(k=>csvCell(row[k])).join(',')).join('\n')+'\n';
}
const dir='qa-artifacts/r80-488-keyword-current-coverage';
await mkdir(dir,{recursive:true});
const columns=['keyword','originalRoute','effectiveRoute','sourceMonthlyVolume',
 'sourceSemrushKD','currentStatus','actualFeature','indexation','issueNote','originalCompetitorSource'];
await writeFile(join(dir,'all-488-current-intent-and-route-status.csv'),toCSV(report,columns));
await writeFile(join(dir,'85-remaining-flagged-keywords.csv'),toCSV(remaining,columns));
const summary={
 schema:'mathworks-r80-current-keyword-coverage/v1',asOf:'2026-11-07',
 originalOwnerKeywords:488,sourceFileModified:false,historicalFlags:145,
 newlySupportedNarrowKeywords:45,correctedToImplementedExistingRoutes:15,
 unsupportedRemaining:22,ambiguousRoutingHeld:4,stillRequiresReview:59,
 historicalFlagsRemaining:85,otherKeywordsNotIndividuallySerpVerified:343,
 originalV18GeneratorsStill51:true,approvedForGoogleIndexation:0,
 statuses,importantLimitations:[
  'Original user-provided Semrush Volume and KD are older snapshots, not refreshed 2026 Google US data.',
  'Do not sum overlapping keyword volumes into a site traffic forecast.',
  'A corrected functional route does not guarantee live SERP intent match.',
  'An implemented new feature only resolves a narrowly audited historical task; no index approval or rankings are implied.',
  '343 other rows have not been individually certified as correct search intent.',
  'Cloudflare pages.dev preview remains noindex,nofollow; launch needs domain, GSC, printer, teacher and explicit allowlist.'
 ]};
await writeFile(join(dir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
await writeFile(join(dir,'README.md'),'# Current exact keyword coverage — R80\n\n'+
 'Source preserved: 488 owner-supplied keyword rows, 145 earlier semantic flags. '+
 'R66–R80 now implement 45 specifically flagged missing search tasks; 15 wrong routes point to matching existing tools, '+
 '4 are deliberately held because the search meaning is ambiguous. '+
 '85 flags remain (22 unsupported functionality, 59 review, 4 ambiguous routing). '+
 '343 other keywords are not independently Google US SERP reviewed; no page is approved for indexing.\n');
console.log('R80 keyword audit PASS: 488 source rows, 45 implemented gaps, 15 corrected routes, 85 issues remaining. Preview still noindex.');
