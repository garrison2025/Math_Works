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
  assert.equal(r.status,200,'Missing path '+route.slug);
  assert.equal(meta(r.text,'math-works-build-sha'),sha,'Wrong SHA '+route.slug);
  assert.equal(meta(r.text,'robots'),'noindex,nofollow','Unauthorized indexing '+route.slug);
  if(route.type==='HOLD')assert.ok(!/<link[^>]*rel="canonical"/i.test(r.text),'HOLD canonical leak '+route.slug);
 }}));
 result.verified.push('55/55 original paths return 200 + matched SHA + noindex');
 const [home,contact,privacy,robots,sitemap,preview]=await Promise.all([
  get(base+'/'),get(base+'/contact/'),get(base+'/privacy/'),
  get(base+'/robots.txt'),get(base+'/sitemap.xml'),get('https://math-works.pages.dev/')
 ]);
 for(const [name,r] of Object.entries({home,contact,privacy,preview})){
  assert.equal(r.status,200,name+' HTTP');
  assert.equal(meta(r.text,'math-works-build-sha'),sha,name+' SHA mismatch');
  assert.equal(meta(r.text,'robots'),'noindex,nofollow',name+' SEO gate');
  assert.ok(!/<link[^>]*rel="canonical"/i.test(r.text),name+' unapproved canonical');
 }
 assert.match(contact.text,/mailto:contact@mathworksheetstudio\.com/);
 assert.match(privacy.text,/mailto:contact@mathworksheetstudio\.com/);
 assert.equal(robots.status,200);assert.match(robots.text,/User-agent: \*/);
 assert.equal(sitemap.status,200);assert.ok(!/<loc\b/i.test(sitemap.text),'Sitemap should remain empty');
 result.verified.push('Contact email, privacy link, preview protection and empty sitemap');
 try{const www=await get('https://www.mathworksheetstudio.com/');
  if(www.url!==base+'/')result.warnings.push('www apex 301 not independently verified: '+www.url);
 }catch(e){result.warnings.push('www is not yet verified or routable: '+String(e).slice(0,120));}
 result.status='PASS';console.log('R106 custom-domain and email readiness PASS: 55 paths, SHA, noindex, empty sitemap');
}
try{await verify()}catch(error){result.status='FAIL';result.errors=[String(error?.stack||error)];console.error(error);process.exitCode=1;}
finally{writeFileSync(out+'/evidence.json',JSON.stringify(result,null,2)+'\n');}
