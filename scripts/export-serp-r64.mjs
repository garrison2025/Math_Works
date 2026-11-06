/** R64: transparent limited real competitor-page evidence and feature-gap status.
 * This does NOT scrape or claim ranked positions in a US Google SERP.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root=new URL('../src/data/',import.meta.url);
const get=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
const [observations,targets,history,capabilities]=await Promise.all([
 get('serp-observations-r64.json'),get('seo-targets.json'),
 get('seo-intent-r63.json'),get('seo-r64-resolutions.json')
]);
assert.equal(observations.schema,'mathworks-r64-observation/v1');
assert.equal(observations.observations.length,8);
assert.equal(capabilities.resolvedFromR63.length,7);
const selected=new Map(targets.map(t=>[t.slug,t.primary]));
const checked=new Set();
for(const row of observations.observations){
 assert.equal(selected.get(row.slug),row.primary,'Targeted phrase was not in owner primary evidence');
 assert.ok(!checked.has(row.slug),'Duplicate sampled route: '+row.slug);
 checked.add(row.slug);
 const url=new URL(row.competitorUrl);
 assert.equal(url.protocol,'https:');
 assert.ok(url.hostname!=='math-works.pages.dev');
 assert.ok(row.observed.length>65&&row.ourFeature.length>65&&row.gap.length>65);
 assert.ok(['HIGH','MEDIUM','LOW'].includes(row.priority));
}
for(const line of capabilities.resolvedFromR63){
 assert.ok(history.issues.some(issue=>issue.slug===capabilities.sourcePage &&
  issue.keyword===line.keyword&&issue.classification==='needs-review'));
 assert.equal(line.liveSERPConfirmed,false);assert.equal(line.approvedForIndexing,false);
}
const output='qa-artifacts/r64-live-competitor-readiness';await mkdir(output,{recursive:true});
const cols=['slug','primary','competitorUrl','observed','ourFeature','gap','priority','decision'];
const esc=s=>/[,"\r\n]/.test(String(s??''))?'"'+String(s).replaceAll('"','""')+'"':String(s??'');
await writeFile(join(output,'8-public-competitor-comparisons.csv'),cols.join(',')+'\n'+
 observations.observations.map(row=>cols.map(c=>esc(row[c])).join(',')).join('\n')+'\n');
await writeFile(join(output,'7-chart-keyword-status.json'),JSON.stringify(capabilities,null,2)+'\n');
await writeFile(join(output,'scope.json'),JSON.stringify({
 schema:'mathworks-r64-validation/v1',sampleSize:observations.observations.length,
 inspectedPublicCompetitorPages:8,currentUSGoogleRankPositionData:0,
 keywordSourceSnapshot:'User-provided historic Semrush input; not refreshed',
 newFeature:'One-page blank and completed multiplication 1-12 chart PDF, A4/Letter',
 originalHistoricalFlagsStillPreserved:true,
 resolvedCapabilityFlags:7,liveSERPApproved:0,newlyIndexablePages:0,
 caveat:'Public competitor content does NOT establish Google US SERP rank, difficulty, traffic or rich-result eligibility.'
},null,2)+'\n');
let md='# R64 public competitor page observations\n\n';
md+='Eight exact US-English worksheet topics were compared with named public competitor pages on 2026-11-06. These are page-content findings, NOT a Google US ranking extraction.\n\n';
for(const row of observations.observations){
 md+='## '+row.slug+' — '+row.primary+'\n\n';
 md+='Competitor: '+row.competitorUrl+'\n\n';
 md+='Observed: '+row.observed+'\n\n';
 md+='Our built feature: '+row.ourFeature+'\n\n';
 md+='Still missing or requires checking: '+row.gap+'\n\n';
 md+='Priority: '+row.priority+'. Decision: '+row.decision+'.\n\n';
}
md+='Seven old R63 times-table chart-intent flags have a newly implemented capability, but actual search intent and teacher physical printing are not certified. All other R63 records stay open and the preview stays noindex.\n';
await writeFile(join(output,'README.md'),md);
console.log('R64 PAGE EVIDENCE AUDIT PASS: 8 named competitor pages, 7 implemented chart-related capability gaps, 0 confirmed US SERP ranks or newly indexed URLs');
