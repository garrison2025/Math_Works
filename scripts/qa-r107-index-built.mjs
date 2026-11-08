/** R108 build-time SEO authority: 64 self-canonical URLs, unique snippets and actual social images. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const origin='https://mathworksheetstudio.com',dist='dist';
const routes=JSON.parse(readFileSync('src/data/routes.json','utf8'));
assert.equal(routes.length,55);
const active=routes.filter(r=>r.type!=='HOLD').map(r=>'/'+r.slug+'/');
const promoted=['/word-problems-worksheets/','/worksheets-by-grade/'];
const categories=['/arithmetic/','/fractions/','/algebra/','/geometry/','/data-statistics/'];
const support=['/','/worksheets/','/about/','/contact/','/privacy/','/terms/'];
const live=[...support,...categories,...promoted,...active],held=['/algebra-general-worksheets/','/geometry-general-worksheets/'];
assert.equal(live.length,64);assert.equal(new Set(live).size,64);
const file=p=>p==='/'?join(dist,'index.html'):join(dist,p.slice(1),'index.html');
const read=p=>readFileSync(file(p),'utf8');
const meta=(h,n)=>h.match(new RegExp('<meta\\s+name="'+n+'"\\s+content="([^"]*)"', 'i'))?.[1]||'';
const og=(h,n)=>h.match(new RegExp('<meta\\s+property="'+n+'"\\s+content="([^"]*)"', 'i'))?.[1]||'';
const titles=new Set(),descs=new Set();const report={schema:'r108-comprehensive-seo/v1',base:origin,pages:[],errors:[]};
for(const p of live){
 const html=read(p);
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||'';
 const description=meta(html,'description'),canon=origin+p;
 assert.equal(meta(html,'robots'),'index,follow,max-image-preview:large','robots '+p);
 assert.ok(html.includes('<link rel="canonical" href="'+canon+'"'),'canonical '+p);
 assert.ok(title.length>=22&&title.length<=67,'Title: '+p+' '+title.length);
 assert.ok(description.length>=75&&description.length<=165,'Description: '+p+' '+description.length);
 assert.ok(!titles.has(title),'Repeated title '+title);
 assert.ok(!descs.has(description),'Repeated description '+description);
 titles.add(title);descs.add(description);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'Single H1 '+p);
 assert.equal(og(html,'og:url'),canon,'OpenGraph URL '+p);
 assert.equal(og(html,'og:title'),title,'OpenGraph title '+p);
 assert.ok(og(html,'og:image').startsWith(origin+'/images/worksheets/'),'OpenGraph image '+p);
 assert.equal(meta(html,'twitter:card'),'summary_large_image','Twitter Card '+p);
 assert.ok(meta(html,'twitter:image').startsWith(origin+'/images/worksheets/'),'Twitter image '+p);
 const img=og(html,'og:image').replace(origin+'/','');
 assert.ok(existsSync(join(dist,img)),'Missing OG image '+img);
 const json=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(json,'Missing JSONLD '+p);
 const graph=JSON.parse(json)['@graph'];
 const website=graph.find(x=>x['@type']==='WebSite');
 assert.ok(website,'WebSite schema '+p);
 assert.equal(website.name,'Math Worksheet Studio','Consistent brand entity '+p);
 assert.match(website.description,/51 topic-specific math worksheet generators/,'Brand differentiation schema '+p);
 assert.ok(graph.some(x=>x['@type']==='WebPage'),'WebPage schema '+p);
 if(active.includes(p)||promoted.includes(p))assert.ok(graph.some(x=>x['@type']==='WebApplication'),'Real tool schema '+p);
 if(active.includes(p))assert.ok(graph.some(x=>x['@type']==='LearningResource'),'Worksheet resource schema '+p);
 if(categories.includes(p))assert.match(html,/How to choose the right practice sheet/,'Original guide '+p);
 if(active.includes(p))assert.ok(html.includes('fixed-seed')||html.includes('Fixed-seed')||html.includes('Worked example'),'Real teaching example '+p);
 report.pages.push({path:p,titleLength:title.length,descriptionLength:description.length,ogImage:img});
}
const contrasted=active.filter(p=>read(p).includes('data-seo-skill-contrast'));
assert.equal(contrasted.length,24,'Exactly 24 focused original contrast explanations');
for(const p of active){
 const html=read(p);
 assert.match(html,/class="sample-img"[^>]*loading="lazy"[^>]*decoding="async"/,'Below-the-fold sample image deferred '+p);
 assert.match(html,/class="sample-img"[^>]*width="1000"[^>]*height="560"/,'Image dimensions prevent layout shift '+p);
}
for(const p of held){
 const html=read(p);
 assert.equal(meta(html,'robots'),'noindex,follow','Navigation HOLD directive '+p);
 assert.ok(!/rel="canonical"/i.test(html),'Navigation HOLD canonical '+p);
}
for(const p of ['/404/']){
 const html=existsSync(file(p))?read(p):readFileSync(join(dist,'404.html'),'utf8');
 assert.equal(meta(html,'robots'),'noindex,nofollow');
}
const sitemap=readFileSync(join(dist,'sitemap.xml'),'utf8');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
assert.equal(locs.length,64,'Exact sitemap total');
assert.deepEqual(new Set(locs),new Set(live.map(p=>origin+p)),'Exact sitemap membership');
assert.match(readFileSync(join(dist,'robots.txt'),'utf8'),/Sitemap: https:\/\/mathworksheetstudio\.com\/sitemap\.xml/);
const redirects=readFileSync(join(dist,'_redirects'),'utf8');
for(const line of ['/algebra-general-worksheets /algebra/ 301','/algebra-general-worksheets/ /algebra/ 301','/geometry-general-worksheets /geometry/ 301','/geometry-general-worksheets/ /geometry/ 301'])assert.ok(redirects.split('\n').includes(line),'Missing Cloudflare redirect '+line);
assert.match(read('/algebra/'),/Build advanced algebra worksheets/,'Algebra focus generator preserved');
assert.match(read('/geometry/'),/Printable angles around a point worksheets/,'Geometry angle generator preserved');
assert.match(read('/geometry/'),/Printable sphere, cone and pyramid volume practice/,'Geometry volume generator preserved');
const stale=read('/surface-area-worksheets/');
assert.ok(!stale.includes('The preview website remains excluded from indexing'),'Stale release content');
report.summary={published:64,existingWorksheets:51,subjectDirectories:5,promotedWorkingPages:2,legacyRedirectSources:2,notFoundNoindex:1,status:'PASS'};
mkdirSync('qa-artifacts/r108-seo',{recursive:true});
writeFileSync('qa-artifacts/r108-seo/report.json',JSON.stringify(report,null,2)+'\n');
console.log('R108 SEO PASS: '+live.length+' unique canonical titles, descriptions and OG images; 2 legacy subject URLs redirect to canonical hubs.');
