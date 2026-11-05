/** Offline Astro build audit: validates the generated noindex preview, routes, and static samples.
 * Complements but never replaces a live browser or teacher/print correctness review. */
import {readFileSync,statSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {SKILL_RELATIONS} from '../src/lib/intent-relations.ts';

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
