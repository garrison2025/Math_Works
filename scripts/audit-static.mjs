/** Offline Astro build audit: validates the generated noindex preview, routes, and static samples.
 * Complements but never replaces a live browser or teacher/print correctness review. */
import {readFileSync,statSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {SKILL_RELATIONS,SEO_INTENT_CONTRASTS} from '../src/lib/intent-relations.ts';

const root = new URL('../',import.meta.url).pathname;
const routes = JSON.parse(readFileSync(join(root,'src/data/routes.json'),'utf8'));
const dist = join(root,'dist');
const seen = new Set();
const check = (slug) => {
  const htmlPath=join(dist,slug,'index.html');
  assert.ok(existsSync(htmlPath), `Missing page: ${slug}`);
  const html=readFileSync(htmlPath,'utf8');
  assert.match(html,/<title>[^<]{8,}<\/title>/i, `Missing title: ${slug}`);
  assert.match(html,/<h1[\s>]/i, `Missing H1: ${slug}`);
  assert.match(html,/<meta\s+name="description"/i,`Missing description: ${slug}`);
  assert.match(html,/name="robots"\s+content="noindex,nofollow"/i,`Preview incorrectly indexable: ${slug}`);
  assert.doesNotMatch(html,/<link\s+rel="canonical"/i,`Preview canonical leak: ${slug}`);
  assert.doesNotMatch(html,/<meta\s+property="og:url"/i,`Preview OG URL leak: ${slug}`);
  assert.doesNotMatch(html,/<script type="application\/ld\+json"/i,`Preview schema leak: ${slug}`);
  if(slug){
    const image=join(dist,'images','worksheets',`${slug}-sample.webp`);
    assert.ok(existsSync(image) && statSync(image).size>1000, `Missing/empty static WebP: ${slug}`);
    assert.match(html,/class="sample-img"/,`Missing visible static image for ${slug}`);
  }
};
check('');
// A real 404.html disables Cloudflare Pages SPA fallback for absent/HOLD paths.
const notFoundFile=join(dist,'404.html');
assert.ok(existsSync(notFoundFile),'Missing custom 404.html: Cloudflare would otherwise serve the homepage for unknown paths');
const notFound=readFileSync(notFoundFile,'utf8');
assert.match(notFound,/<h1[^>]*>This worksheet page isn.t available\.<\/h1>/i);
assert.match(notFound,/name="robots"\s+content="noindex,nofollow"/i);
assert.doesNotMatch(notFound,/<link\s+rel="canonical"/i);
assert.doesNotMatch(notFound,/data-workspace|class="problems-grid"/i);
for(const route of routes){
 assert.ok(!seen.has(route.slug),`Duplicate route: ${route.slug}`);seen.add(route.slug);
 if(route.type==='HOLD')assert.ok(!existsSync(join(dist,route.slug,'index.html')),`HOLD page published: ${route.slug}`);
 else check(route.slug);
}
for(const path of ['robots.txt','about/index.html','privacy/index.html','contact/index.html','sitemap.xml']) assert.ok(existsSync(join(dist,path)),`Missing supporting file: ${path}`);
console.log(`STATIC AUDIT PASS: ${routes.filter(r=>r.type!=='HOLD').length} preview topics, unique routes, 51 WebP assets, noindex metadata, support pages.`);

/** R41 source-to-built-site SEO intent audit: never release guessed keywords. */
function parseCsvLine(line){
 const fields=[];let word='',quoted=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(c==='"'){if(quoted&&line[i+1]==='"'){word+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){fields.push(word);word='';}
  else word+=c;
 }
 assert.ok(!quoted,'Unterminated CSV quoted value');
 fields.push(word);
 return fields;
}
const csvLines=readFileSync(join(root,'src/data/keyword-evidence.csv'),'utf8')
 .trimEnd().split(/\r?\n/);
assert.equal(csvLines.shift(),'keyword,monthly_volume,semrush_kd,competitor_rank_type,estimated_competitor_visits,source,canonical_candidate');
assert.equal(csvLines.length,488,'Original 488 keyword mappings were silently dropped/added');
const byRoute=new Map(routes.map(route=>[route.slug,route]));
const keywordSeen=new Set();const routeHits=new Set();
let publishedMapping=0,heldMapping=0;
for(const [i,line] of csvLines.entries()){
 const parts=parseCsvLine(line);
 assert.equal(parts.length,7,`Keyword row ${i+2} has invalid CSV shape`);
 const [rawKeyword,volume,kd,rank,visits,source,rawTarget]=parts;
 assert.ok(rawKeyword.startsWith('`')&&rawKeyword.endsWith('`'),`Row ${i+2}: missing keyword`);
 const keyword=rawKeyword.slice(1,-1).trim().toLowerCase();
 assert.ok(keyword&&!keywordSeen.has(keyword),`Row ${i+2}: duplicate/blank keyword ${keyword}`);
 keywordSeen.add(keyword);
 assert.ok(Number.isInteger(Number(volume))&&Number(volume)>0,`Row ${i+2}: invalid search volume`);
 assert.ok(Number.isInteger(Number(kd))&&Number(kd)>=0&&Number(kd)<=29,`Row ${i+2}: KD outside approved range`);
 assert.ok(rank&&Number.isFinite(Number(visits))&&source.includes('https://'),`Row ${i+2}: missing competitor evidence`);
 const target=rawTarget.replace(/^`|`$/g,'');
 assert.match(target,/^\/[a-z0-9-]+\/$/,`Row ${i+2}: unsafe canonical target`);
 const slug=target.slice(1,-1),route=byRoute.get(slug);
 assert.ok(route,`Row ${i+2}: mapping to unknown route ${target}`);
 routeHits.add(slug);
 if(route.type==='HOLD'){
  heldMapping++;
  assert.ok(!existsSync(join(dist,slug,'index.html')),`HOLD mapped keyword has published page: ${slug}`);
 }else{
  publishedMapping++;
  assert.ok(existsSync(join(dist,slug,'index.html')),`Mapped keyword has no static tool page: ${slug}`);
 }
}
assert.equal(routeHits.size,55,'Not all V2 intent routes are represented by the source keyword mapping');
assert.equal(publishedMapping,437,'Source keyword-to-live-route mapping count changed');
assert.equal(heldMapping,51,'Source keyword HOLD count changed');

assert.equal(SKILL_RELATIONS.length,24,'V2 source parent-child audit must include all 24 pairs');
let checkedLinks=0;
for(const {parent,child,difference} of SKILL_RELATIONS){
 assert.ok(difference&&byRoute.has(parent)&&byRoute.has(child));
 for(const [from,to] of [[parent,child],[child,parent]]){
  const html=readFileSync(join(dist,from,'index.html'),'utf8');
  const fragment=html.split('class="skill-route-section"')[1]?.split('</section>')[0];
  assert.ok(fragment,`Missing task-comparison block for ${from}`);
  assert.ok(fragment.includes(`href="/${to}/"`),`Missing reciprocal comparison link ${from} -> ${to}`);
  checkedLinks++;
 }
}
assert.equal(checkedLinks,48);
console.log(`R41 STATIC SEO AUDIT PASS: 488 source keywords -> 55 mapped routes (437 live, 51 HOLD), 24 intent relationships, 48 rendered reciprocal links, noindex preserved.`);

/** R62: selected intent must match the original evidence exactly, while
 * known unsupported searches stay out of visible specialist SEO claims.
 */
const targets=JSON.parse(readFileSync(join(root,'src/data/seo-targets.json'),'utf8'));
const intentReview=JSON.parse(readFileSync(join(root,'src/data/seo-intent-review.json'),'utf8'));
const rows=csvLines.map(row=>{
 const [raw,vol,kd,,,source,rawPath]=parseCsvLine(row);
 return {keyword:raw.slice(1,-1).toLowerCase(),volume:Number(vol),
  kd:Number(kd),source,path:rawPath.replace(/^`|`$/g,'')};
});
const evidenceBySlug=new Map();
for(const row of rows){
 const slug=row.path.slice(1,-1);
 const lookup=evidenceBySlug.get(slug)??new Map();
 lookup.set(row.keyword,row);evidenceBySlug.set(slug,lookup);
}
assert.equal(targets.length,51,'R62 focus must cover all 51 live generators');
assert.equal(intentReview.schema,'mathworks-seo-intent-review/v1');
assert.equal(intentReview.status,'INITIAL_PARTIAL_AUDIT');
assert.equal(intentReview.flagged.length,21,'R62 initial mismatch list changed without review');
const flagged=new Set();
for(const issue of intentReview.flagged){
 assert.ok(issue.slug&&issue.keyword&&issue.reason.length>=25);
 assert.ok(['unsupported','wrong-page','needs-review'].includes(issue.classification));
 const key=issue.slug+':'+issue.keyword;
 assert.ok(!flagged.has(key),'Duplicate flagged query: '+key);flagged.add(key);
 assert.ok(evidenceBySlug.get(issue.slug)?.has(issue.keyword),
  'Flagged query not in original source: '+key);
}
const selected=new Set();
let specialists=0,hubs=0;
for(const target of targets){
 const route=byRoute.get(target.slug),key=target.slug+':'+target.primary;
 assert.ok(route&&route.type!=='HOLD','R62 target is not a built generator: '+key);
 assert.ok(!selected.has(target.slug),'R62 duplicate primary intent: '+key);
 selected.add(target.slug);
 const evidence=evidenceBySlug.get(target.slug)?.get(target.primary);
 assert.ok(evidence,'Primary keyword is not exact source evidence: '+key);
 assert.equal(target.sourceMonthlyVolume,evidence.volume,'Keyword volume drift: '+key);
 assert.equal(target.sourceSemrushKD,evidence.kd,'Keyword KD drift: '+key);
 assert.ok(!flagged.has(key),'Unsupported query promoted as primary: '+key);
 const html=readFileSync(join(dist,target.slug,'index.html'),'utf8');
 if(route.type==='CONDITIONAL_TOOL'){
  specialists++;
  assert.ok(html.includes('data-seo-focus'),'Missing specialist practice section: '+key);
  const block=html.split('data-seo-focus')[1]?.split('</section>')[0]??'';
  const actual=target.primary[0].toUpperCase()+target.primary.slice(1);
  assert.ok(block.includes(actual),'Specialist SEO heading changed: '+key);
  assert.ok(block.includes('Separate student questions'),'Print scope absent: '+key);
  for(const issue of intentReview.flagged.filter(issue=>issue.slug===route.slug))
   assert.ok(!block.toLowerCase().includes(issue.keyword),
    'Unsupported query in specialist content: '+issue.keyword);
 }else{
  hubs++;
  assert.ok(html.includes('data-seo-hub'),'Broad hub lacks navigation and scope: '+key);
  assert.ok(!html.includes('data-seo-focus'),'Broad hub claims specialist scope: '+key);
 }
}
assert.equal(selected.size,51);assert.equal(specialists,43);assert.equal(hubs,8);
console.log('R62 SEO INTENT AUDIT PASS: 51 original-source primary queries, 43 specialist and 8 hub pages; 21 flagged mismatches are not promoted. Noindex preview maintained.');


/** R63 source and rendered-site cross-check. 124 new exact-phrase flags are
 * additive to R62's 21; neither unflagged keywords nor other hub pages
 * gain any silent indexation approval.
 */
const secondTriage=JSON.parse(readFileSync(join(root,'src/data/seo-intent-r63.json'),'utf8'));
assert.equal(secondTriage.schema,'mathworks-r63-intent-triage/v1');
assert.equal(secondTriage.issues.length,124);
const allIssues=[...intentReview.flagged,...secondTriage.issues];
const allKeys=new Set();
const issueStats={unsupported:0,'wrong-page':0,'needs-review':0};
for(const issue of allIssues){
 const key=issue.slug+':'+issue.keyword;
 assert.ok(!allKeys.has(key),'R63 duplicate flagged search phrase: '+key);
 allKeys.add(key);
 assert.ok(evidenceBySlug.get(issue.slug)?.has(issue.keyword),'Flagged phrase absent from original CSV: '+key);
 assert.ok(Object.hasOwn(issueStats,issue.classification));
 issueStats[issue.classification]++;
 if(issue.suggestedRoute){
  assert.ok(byRoute.has(issue.suggestedRoute),'R63 recommendation points to a nonexistent route');
  assert.notEqual(byRoute.get(issue.suggestedRoute).type,'HOLD','R63 recommended an unbuilt destination');
 }
 const primary=targets.find(t=>t.slug===issue.slug);
 assert.notEqual(primary?.primary,issue.keyword,'R63 flagged incompatible query as SEO primary: '+key);
 const route=byRoute.get(issue.slug);
 if(route.type==='CONDITIONAL_TOOL'){
  const html=readFileSync(join(dist,issue.slug,'index.html'),'utf8');
  const block=html.split('data-seo-focus')[1]?.split('</section>')[0]??'';
  assert.ok(!block.toLowerCase().includes(issue.keyword.toLowerCase()),
   'R63 unsupported/misrouted term leaked into specialist SEO copy: '+key);
 }
}
assert.equal(allKeys.size,145);
assert.deepEqual(issueStats,{unsupported:67,'wrong-page':19,'needs-review':59});
assert.equal(488-allKeys.size,343,'R63 unflagged does not mean verified; source inventory changed');
assert.equal(SEO_INTENT_CONTRASTS.length,6);
for(const {parent,child} of SEO_INTENT_CONTRASTS){
 for(const [from,to] of [[parent,child],[child,parent]]){
  const html=readFileSync(join(dist,from,'index.html'),'utf8');
  const fragment=html.split('class="skill-route-section"')[1]?.split('</section>')[0];
  assert.ok(fragment?.includes('href="/'+to+'/"'),
   'R63 missing reciprocal live alternative for '+from+' -> '+to);
 }
}
console.log('R63 STATIC SEO PASS: 145 exact flagged phrases; 67 unsupported, 19 misrouted and 59 SERP-review terms. All six new task comparisons render bidirectionally, and 51 primary SEO sections remain source-backed. No index release.');
