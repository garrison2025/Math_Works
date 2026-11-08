/** Real Cloudflare production-mode static Astro bundle: exact 57 owned-domain canonicals. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const origin='https://mathworksheetstudio.com',root='dist';
const routes=JSON.parse(readFileSync('src/data/routes.json','utf8'));
const active=routes.filter(r=>r.type!=='HOLD'),held=routes.filter(r=>r.type==='HOLD');
assert.equal(routes.length,55);assert.equal(active.length,51);assert.equal(held.length,4);
const support=['/','/worksheets/','/about/','/contact/','/privacy/','/terms/'];
const live=[...support,...active.map(r=>'/'+r.slug+'/')];
const file=p=>p==='/'?join(root,'index.html'):join(root,p.slice(1),'index.html');
const read=p=>readFileSync(file(p),'utf8');
const robots=(h)=>h.match(/<meta\s+name="robots"\s+content="([^"]*)"/)?.[1]||'';
for(const p of live){
 const html=read(p);
 assert.equal(robots(html),'index,follow,max-image-preview:large','Wrong robots at '+p);
 assert.ok(html.includes('<link rel="canonical" href="'+origin+p+'"'),'Missing owned-domain canonical '+p);
 assert.ok(html.includes('<script type="application/ld+json"'),'Missing structured data '+p);
}
for(const r of held){
 const p='/'+r.slug+'/',html=read(p);
 assert.equal(robots(html),'noindex,nofollow','HOLD mistakenly released '+p);
 assert.ok(!/rel="canonical"/i.test(html),'HOLD canonical leak '+p);
}
assert.equal(robots(readFileSync(join(root,'404.html'),'utf8')),'noindex,nofollow');
const sitemap=readFileSync(join(root,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(urls.length,57);
assert.deepEqual(new Set(urls),new Set(live.map(x=>origin+x)));
assert.equal(new Set(urls).size,57);
const txt=readFileSync(join(root,'robots.txt'),'utf8');
assert.match(txt,/Sitemap: https:\/\/mathworksheetstudio\.com\/sitemap\.xml/);
mkdirSync('qa-artifacts/r107-index',{recursive:true});
writeFileSync('qa-artifacts/r107-index/summary.json',JSON.stringify({mode:'simulated main build',status:'PASS',canonical:origin,indexable:57,activeTopics:51,holdNoindex:4,notFoundNoindex:1,allSelfCanonical:true,sitemapCount:urls.length},null,2)+'\n');
console.log('R107 PASSED: 57 public canonical pages and exact sitemap; four HOLD pages and 404 are noindex.');
