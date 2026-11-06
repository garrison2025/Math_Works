/** R62 shareable, honest SEO inventory. Source Semrush snapshot is not a live
 * ranking/traffic report. A mapping is not a claim that the generator fits
 * every intent in the mapped cluster. Do NOT emit indexable pages here.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';

function parseLine(s){
 const a=[];let v='',q=false;
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==='"'){if(q&&s[i+1]==='"'){v+='"';i++}else q=!q}
  else if(ch===','&&!q){a.push(v);v=''}else v+=ch;
 }
 a.push(v);return a;
}
const raw=await readFile(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
const routes=JSON.parse(await readFile(new URL('../src/data/routes.json',import.meta.url),'utf8'));
const targets=JSON.parse(await readFile(new URL('../src/data/seo-targets.json',import.meta.url),'utf8'));
const review=JSON.parse(await readFile(new URL('../src/data/seo-intent-review.json',import.meta.url),'utf8'));
const routeBySlug=new Map(routes.map(r=>[r.slug,r]));
const primaryBySlug=new Map(targets.map(t=>[t.slug,t]));
const flagged=new Map(review.flagged.map(i=>[i.slug+'|'+i.keyword,i]));
const rows=[];
for(const [index,line] of raw.trimEnd().split(/\r?\n/).slice(1).entries()){
 const columns=parseLine(line);assert.equal(columns.length,7);
 const [quoted,monthly,kd,competitorRank,competitorVisits,source,path]=columns;
 const keyword=quoted.slice(1,-1),slug=path.slice(2,-2);
 const route=routeBySlug.get(slug);
 assert.ok(route,'Unknown route: '+slug);
 const issue=flagged.get(slug+'|'+keyword);
 const primary=primaryBySlug.get(slug)?.primary===keyword;
 rows.push({
  keyword,route:slug,routeType:route.type,priority:route.priority,
  sourceMonthlyVolume:Number(monthly),sourceKD:Number(kd),
  competitorRankType:competitorRank,estimatedCompetitorVisits:Number(competitorVisits),
  source,primarySelected:primary,
  intentStatus:issue?'FLAGGED_'+issue.classification.toUpperCase().replaceAll('-','_')
   :route.type==='HOLD'?'HELD_NOT_IMPLEMENTED'
   :primary?'PRIMARY_SELECTED_FROM_SOURCE_NOT_SERP_REVERIFIED'
   :'SOURCE_MAPPED_INTENT_NOT_INDIVIDUALLY_REVIEWED',
  reviewerNote:issue?.reason??''
 });
}
assert.equal(rows.length,488);
const tally={specialist:0,hub:0,hold:0};
for(const row of rows){
 if(row.routeType==='CONDITIONAL_TOOL')tally.specialist++;
 else if(row.routeType==='CONDITIONAL_HUB')tally.hub++;
 else tally.hold++;
}
assert.deepEqual(tally,{specialist:272,hub:165,hold:51});
assert.equal(flagged.size,21);
assert.equal(rows.filter(r=>r.primarySelected).length,51);
assert.equal(rows.filter(r=>r.intentStatus.startsWith('FLAGGED_')).length,21);
const summary={
 schema:'mathworks-r62-seo-readiness/v1',
 originalKeywordRows:488,sourceMappedSpecialist:272,
 sourceMappedHub:165,sourceMappedHold:51,
 existingSpecialistPages:43,existingHubPages:8,heldRoutes:4,
 sourceBackedPrimaryFocus:51,initialIntentFlags:21,
 flags:{unsupported:10,wrongPage:5,needsReview:6},
 liveIndexablePreviewPages:0,
 sourceCaution:'Monthly volume and KD are snapshot user-provided Semrush values. They are not fresh verified 2026-11-06 figures, current rankings, or GSC visits.',
 intentCaution:'Only 21 specific mismatches have been flagged; 467 unflagged rows are not thereby individually verified or guaranteed useful. A primary query being present in the original CSV alone does not prove its Google SERP fit.',
 launch:'NOT APPROVED: pages.dev remains noindex,nofollow; standalone custom domain, owner SEO release whitelist, physical printing, teacher sign-off, Cloudflare deployed SHA, GSC validation remain separate.',
 generatedFrom:'src/data/keyword-evidence.csv + routes.json + seo-targets.json + seo-intent-review.json'
};
const out='qa-artifacts/r62-seo-readiness';
await mkdir(out,{recursive:true});
const esc=value=>{
 const v=String(value??'');
 return /[,"\r\n]/.test(v)?'"'+v.replaceAll('"','""')+'"':v;
};
const keys=['keyword','route','routeType','priority','sourceMonthlyVolume','sourceKD','competitorRankType','estimatedCompetitorVisits','source','primarySelected','intentStatus','reviewerNote'];
await writeFile(join(out,'keyword-intent-audit.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>esc(r[k])).join(',')).join('\n')+'\n');
await writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const lines=[
 '# R62 SEO readiness: 488 keyword source rows',
 '',
 'Readiness is NOT public launch approval or current Google traffic evidence.',
 '',
 '| Group | Original mapped keywords | Built routes |',
 '| --- | ---: | ---: |',
 '| Specialist generators | 272 | 43 |',
 '| Broad topic hubs (not approved for indexing) | 165 | 8 |',
 '| HOLD intent routes (not built) | 51 | 4 |',
 '',
 '51 primary page phrases are selected strictly from the original source.',
 '21 specifically examined mismatches are flagged (10 unsupported, 5 wrong-page, 6 review).',
 'Other mapped terms require further individual intent audit: unflagged does NOT mean approved.',
 '',
 'Priority: review the flagged mismatches and 8 hubs, verify each actual generator fulfills selected page intent, and only then approve selected tool URLs for a purchased domain.',
 '',
 'Do not activate PUBLIC_INDEXABLE on pages.dev. No teacher signoff, measured printing, verified Cloudflare SHA, GSC ranking or traffic claims.',
 '',
 'See keyword-intent-audit.csv for every source phrase, its original volume/KD, route, classification, and exact mismatch reason.'
];
await writeFile(join(out,'README.md'),lines.join('\n')+'\n');
console.log('R62 SEO report: 488 source phrases, 51 source-backed primary targets, 21 initial intent flags; 272 tool / 165 hub / 51 HOLD mappings; 0 preview URLs indexable.');
