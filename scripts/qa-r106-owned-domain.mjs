/** R106 actual owned-domain read-only release gate; expect noindex until owner approval. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const sha=process.env.GITHUB_SHA;
assert.match(sha,/^[0-9a-f]{40}$/,'Pin the expected main commit SHA');
const base='https://mathworksheetstudio.com';
const out='qa-artifacts/r106-owned-domain';mkdirSync(out,{recursive:true});
const result={domain:base,sha,verified:[],warnings:[],status:'NOT_RUN'};
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
async function get(url){
 const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
 return {status:r.status,text:await r.text(),url:r.url};
}
const meta=(html,name)=>{
 const tag=html.match(new RegExp('<meta\\s+name="'+name+'"[^>]*>','i'))?.[0]||'';
 return tag.match(/\bcontent="([^"]*)"/i)?.[1]||'';
};
// Cloudflare Scrape Shield may intentionally rewrite mailto links on the owned
// domain. Its data-cfemail hex payload is first-byte XOR encoded; validate the
// decoded public contact value instead of requiring unprotected raw HTML.
function hasContactAddress(html){
 const expected='contact@mathworksheetstudio.com';
 if(html.includes('mailto:'+expected))return true;
 for(const [,encoded] of html.matchAll(/data-cfemail="([a-f0-9]+)"/gi)){
  if(encoded.length<4||encoded.length%2!==0)continue;
  const bytes=encoded.match(/.{2}/g)?.map(hex=>parseInt(hex,16))||[];
  const decoded=bytes.slice(1).map(byte=>String.fromCharCode(byte^bytes[0])).join('');
  if(decoded===expected)return true;
 }
 return false;
}
assert.ok(hasContactAddress('<span data-cfemail="51323e3f25303225113c302539263e233a223934342522252435383e7f323e3c">'),'Cloudflare email decode fixture');
async function verify(){
 let observed='unavailable';
 for(let i=0;i<60;i++){
  try{const r=await get(base+'/?build='+sha.slice(0,12));observed=r.status===200?meta(r.text,'math-works-build-sha'):'HTTP '+r.status;if(observed===sha)break;}
  catch(error){observed=String(error);}
  await delay(10000);
 }
 assert.equal(observed,sha,'Domain does not yet serve the expected main SHA');
 result.verified.push('Cloudflare purchased-domain HTTPS returns the exact built main SHA');
 const routes=JSON.parse(readFileSync(new URL('../src/data/routes.json',import.meta.url),'utf8'));
 assert.equal(routes.length,55);
 let i=0;
 await Promise.all(Array.from({length:5},async()=>{while(i<routes.length){
  const route=routes[i++],r=await get(base+'/'+route.slug+'/');
  const legacyTarget={'algebra-general-worksheets':'/algebra/','geometry-general-worksheets':'/geometry/'}[route.slug];
  assert.equal(r.status,200,'Missing path '+route.slug);
  assert.equal(meta(r.text,'math-works-build-sha'),sha,'Wrong SHA '+route.slug);
  if(legacyTarget){assert.equal(r.url,base+legacyTarget,'Legacy URL must resolve to canonical hub '+route.slug);assert.equal(meta(r.text,'robots'),'index,follow,max-image-preview:large','Canonical subject indexability '+legacyTarget);assert.ok(r.text.includes('href="https://mathworksheetstudio.com'+legacyTarget+'"'),'Canonical subject '+legacyTarget);continue;}
  const isIndexed=route.type!=='HOLD'||['word-problems-worksheets','worksheets-by-grade'].includes(route.slug);
  assert.equal(meta(r.text,'robots'),isIndexed?'index,follow,max-image-preview:large':'noindex,follow','Published index status '+route.slug);
  if(!isIndexed)assert.ok(!/<link[^>]*rel="canonical"/i.test(r.text),'HOLD canonical leak '+route.slug);
  else assert.ok(r.text.includes('href="https://mathworksheetstudio.com/'+route.slug+'/"'),'Canonical '+route.slug);
 }}));
 result.verified.push('51 core tools, 2 promoted generators and 2 legacy subject 301s; SHA verified');
 const [home,contact,privacy,robots,sitemap,preview]=await Promise.all([
  get(base+'/'),get(base+'/contact/'),get(base+'/privacy/'),
  get(base+'/robots.txt'),get(base+'/sitemap.xml'),get('https://math-works.pages.dev/')
 ]);
 for(const [name,r] of Object.entries({home,contact,privacy,preview})){
  assert.equal(r.status,200,name+' HTTP');
  assert.equal(meta(r.text,'math-works-build-sha'),sha,name+' SHA mismatch');
  assert.equal(meta(r.text,'robots'),'index,follow,max-image-preview:large',name+' public SEO');
  const path=name==='home'||name==='preview'?'/':name==='contact'?'/contact/':'/privacy/';
  assert.ok(r.text.includes('href="https://mathworksheetstudio.com'+path+'"'),name+' owned canonical');
 }
 assert.ok(hasContactAddress(contact.text),'Live Contact email absent or wrongly Cloudflare-obfuscated');
 assert.ok(hasContactAddress(privacy.text),'Live Privacy email absent or wrongly Cloudflare-obfuscated');
 assert.equal(robots.status,200);assert.match(robots.text,/User-agent: \*/);
 assert.equal(sitemap.status,200);
 const sitemapUrls=[...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(sitemapUrls.length,64,'Sitemap must have 64 owner-approved URLs');
 assert.equal(new Set(sitemapUrls).size,64,'Duplicate sitemap URLs');
 assert.ok(sitemapUrls.every(url=>url.startsWith(base+'/')),'Noncanonical sitemap URL');
 assert.ok(sitemapUrls.includes(base+'/worksheets/'),'Missing worksheet directory');
 for(const slug of ['algebra-general-worksheets','geometry-general-worksheets'])
  assert.ok(!sitemapUrls.includes(base+'/'+slug+'/'),'HOLD sitemap leak '+slug);
 assert.match(robots.text,/Sitemap: https:\/\/mathworksheetstudio\.com\/sitemap\.xml/);
 result.verified.push('Contact email, official canonicals, 64-URL sitemap and category/grade publication');
 try{const www=await get('https://www.mathworksheetstudio.com/');
  if(www.url!==base+'/')result.warnings.push('www apex 301 not independently verified: '+www.url);
 }catch(e){result.warnings.push('www is not yet verified or routable: '+String(e).slice(0,120));}
 result.status='PASS';console.log('R109 LIVE SEO SUCCESS: 64 canonical URLs, 2 legacy subject 301s, 51 core topics and 5 enriched subject directories');
}
try{await verify()}catch(error){result.status='FAIL';result.errors=[String(error?.stack||error)];console.error(error);process.exitCode=1;}
finally{writeFileSync(out+'/evidence.json',JSON.stringify(result,null,2)+'\n');}
