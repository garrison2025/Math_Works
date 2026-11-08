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
assert.match(llms,/# Math Worksheet Studio/,'llms.txt must begin with a Markdown H1');
assert.match(llms,/^## Main pages$/m,'llms.txt must use readable Markdown sections');
assert.match(llms,/not certified curriculum coverage/);
assert.match(llms,/random seed/);

// AI-readability audit: every URL must be an actual Markdown hyperlink, not a bare URL.
const markdownLinks=[...llms.matchAll(/^\s*-\s+\[([^\]]+)\]\((https:\/\/[^)\s]+)\)(?::\s*(.*))?$/gm)];
const allUrls=[...llms.matchAll(/https:\/\/[^\s)]+/g)].map(match=>match[0]);
const linkedUrls=markdownLinks.map(match=>match[2]);
assert.ok(markdownLinks.length>=30,'llms.txt must expose at least 30 curated Markdown links; found '+markdownLinks.length);
assert.equal(allUrls.length,markdownLinks.length,'Every URL in llms.txt must be wrapped in Markdown link syntax');
assert.deepEqual([...allUrls].sort(),[...linkedUrls].sort(),'No bare or unrecognized URLs may remain in llms.txt');
assert.equal(new Set(linkedUrls).size,linkedUrls.length,'llms.txt links must be unique');

const approvedPaths=new Set(published);
for(const [,label,href] of markdownLinks){
 assert.ok(label.trim().length>0,'Every llms.txt link needs a descriptive label');
 const url=new URL(href);
 assert.equal(url.protocol,'https:','Only HTTPS links are allowed');
 if(url.origin===origin){
  assert.ok(approvedPaths.has(url.pathname),'llms.txt must only link to approved canonical pages: '+href);
 }else{
  assert.equal(href,'https://github.com/garrison2025/Math_Works','Unexpected external link in llms.txt: '+href);
 }
}
for(const slug of Object.keys(GEO_GUIDES)){
 assert.ok(new Set(linkedUrls).has(origin+'/'+slug+'/'),'GEO guide must be linked with Markdown syntax in llms.txt: '+slug);
}
assert.ok(linkedUrls.includes(origin+'/worksheets/'),'Worksheet directory must be a Markdown link');
assert.ok(linkedUrls.includes(origin+'/about/'),'About and accuracy policy must be a Markdown link');
assert.ok(!/we are ranked|guaranteed to be cited|certified teacher approved/i.test(llms));
console.log('R112 AUDIT PASS: 64 approved canonical URLs; llms.txt has H1, Markdown sections, 30+ unique HTTPS Markdown links, all 20 GEO guides linked, no bare URLs, and no unsupported authority or citation claims.');
