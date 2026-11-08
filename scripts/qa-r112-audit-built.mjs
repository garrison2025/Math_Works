/** R112: audit the real static HTML generated for production on Cloudflare Pages.
 * The same markup must be visible, indexed and tied to verifiable real sources.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import routes from '../src/data/routes.json' with {type:'json'};
import {publishedPaths,releaseForBuild} from '../src/lib/publication.ts';
import {GEO_REFERENCES} from '../src/lib/geo-reference-links.ts';
import {GEO_GUIDES} from '../src/lib/geo-answer-guides.ts';

const origin='https://mathworksheetstudio.com';
const read=(path)=>readFileSync(join('dist',...path.split('/').filter(Boolean),'index.html'),'utf8');
const published=publishedPaths(releaseForBuild(routes,'main'),routes);
assert.equal(published.length,64,'Do not add speculative indexed pages');

for(const path of published){
 const html=read(path);
 const raw=html.match(/<title>([^<]+)<\/title>/)?.[1]||'';
 const title=raw.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/gi,"'");
 assert.ok(title.length>=40&&title.length<=60,'Title '+path+' has '+title.length+' characters: '+title);
 assert.ok(html.includes('<meta name="author" content="Math Worksheet Studio"'),'Visible brand author meta '+path);
 assert.ok(html.includes('<link rel="canonical" href="'+origin+path+'"'),'Canonical '+path);
 const source=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(source,'JSON-LD '+path);
 const graph=JSON.parse(source)['@graph'];
 const org=graph.find(x=>x['@type']==='Organization');
 const page=graph.find(x=>x['@type']==='WebPage');
 const site=graph.find(x=>x['@type']==='WebSite');
 assert.ok(org&&page&&site,'Named publisher, website and real page '+path);
 assert.equal(org.url,origin+'/');
 assert.equal(org.email,'contact@mathworksheetstudio.com');
 assert.deepEqual(org.sameAs,['https://github.com/garrison2025/Math_Works'],'Only the genuine public repository is linked as official presence');
 assert.equal(site.publisher['@id'],origin+'/#organization');
 assert.equal(page.author['@id'],origin+'/#organization');
 assert.equal(page.publisher['@id'],origin+'/#organization');
 assert.ok(!graph.some(x=>['FAQPage','NewsArticle','Review','AggregateRating'].includes(x['@type'])),'No fake rich schema '+path);
 if(['/about/','/worksheets/',...Object.keys(GEO_REFERENCES).map(s=>'/'+s+'/')].includes(path)){
  assert.equal(page.dateModified,'2026-11-08','Editorial change date '+path);
  assert.match(html,/November 8, 2026/,'Date must be visible '+path);
 }
 const slug=path.split('/').filter(Boolean)[0];
 if(GEO_REFERENCES[slug]){
  const ref=GEO_REFERENCES[slug];
  const resource=graph.find(x=>x['@type']==='LearningResource');
  assert.equal(resource.citation,ref.url,'Source citation must match actual standard '+slug);
  assert.ok(html.includes('href="'+ref.url+'"'),'Reference must be visible to humans '+slug);
  assert.ok(!/government-approved|officially certified/i.test(html),'No fake accreditation '+slug);
 }
}
const home=read('/');
assert.match(home,/data-home-learning-guide/);
assert.match(home,/<table class="geo-home-table"/);
assert.match(home,/Are printable answer keys included\?/);
assert.match(home,/Are the worksheets aligned to every grade standard\?/);
for(const page of ['/about/','/worksheets/'])assert.match(read(page),/Math Worksheet Studio/);
const llms=readFileSync('dist/llms.txt','utf8');
assert.match(llms,/# Math Worksheet Studio/);
assert.match(llms,/https:\/\/mathworksheetstudio\.com\/worksheets\//);
assert.match(llms,/https:\/\/mathworksheetstudio\.com\/about\//);
assert.match(llms,/not certified curriculum coverage/);
for(const slug of Object.keys(GEO_GUIDES))assert.ok(llms.includes(origin+'/'+slug+'/'),'llms.txt discovery link '+slug);
assert.ok(!/we are ranked|guaranteed to be cited|certified teacher approved/i.test(llms));
console.log('R112 AUDIT PASS: 64 titles in 40–60 chars; truthful organization author, source-linked schema, visible dates, answer-first homepage and optional llms.txt.');
