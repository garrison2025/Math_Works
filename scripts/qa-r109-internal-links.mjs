/** R109 built-site crawlable-link audit: check every published URL, fragment and inbound link. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,extname} from 'node:path';
const origin='https://mathworksheetstudio.com',dist='dist';
const routes=JSON.parse(readFileSync('src/data/routes.json','utf8'));
const active=routes.filter(r=>r.type!=='HOLD').map(r=>'/'+r.slug+'/');
const live=['/','/worksheets/','/about/','/contact/','/privacy/','/terms/','/arithmetic/','/fractions/','/algebra/','/geometry/','/data-statistics/','/word-problems-worksheets/','/worksheets-by-grade/',...active];
const legacy=new Set(['/algebra-general-worksheets','/algebra-general-worksheets/','/geometry-general-worksheets','/geometry-general-worksheets/']);
const htmlPath=path=>path==='/'?join(dist,'index.html'):join(dist,path.replace(/^\/|\/$/g,''),'index.html');
const read=path=>readFileSync(htmlPath(path),'utf8');
const idsOf=html=>new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const inbound=new Map(live.map(path=>[path,0]));
const failures=[],counts={pages:0,anchors:0,internal:0,fragments:0,external:0};
const cache=new Map(live.map(path=>[path,read(path)]));
assert.match(cache.get('/geometry/'),/<section\\b[^>]*id="point-angle-lab"[^>]*data-focus-workspace\\b/,'Geometry deep link must target the interactive angle generator');
assert.match(cache.get('/algebra/'),/<section\\b[^>]*id="algebra-focus-lab"[^>]*data-focus-workspace\\b/,'Algebra deep link must target the interactive focus generator');
for(const source of live){
 const html=cache.get(source),sourceIds=idsOf(html);counts.pages++;
 for(const m of html.matchAll(/<a\b[^>]*>/gi)){
  const tag=m[0],href=tag.match(/\bhref="([^"]*)"/i)?.[1];
  if(!href)continue;counts.anchors++;
  const clean=href.replace(/&amp;/g,'&').trim();
  if(!clean||clean==='#')continue;
  if(clean.startsWith('mailto:')||clean.startsWith('tel:')||clean.startsWith('javascript:'))continue;
  if(clean.startsWith('#')){
   let id;try{id=decodeURIComponent(clean.slice(1));}catch{id=clean.slice(1);}
   if(id&&!sourceIds.has(id))failures.push(source+' -> missing fragment #'+id);
   else if(id)counts.fragments++;
   continue;
  }
  let url;try{url=new URL(clean,origin);}catch{failures.push(source+' -> malformed href '+clean);continue;}
  if(url.origin!==origin){counts.external++;continue;}
  const path=url.pathname;
  if(legacy.has(path)){failures.push(source+' still links to legacy redirect '+path);continue;}
  const route=live.includes(path)?path:(path.endsWith('/')?path:path+'/');
  const ext=extname(path);
  const target=ext?join(dist,path.replace(/^\//,'')):htmlPath(route);
  if(!existsSync(target)){failures.push(source+' -> missing internal target '+path);continue;}
  counts.internal++;
  if(live.includes(route)&&source!==route)inbound.set(route,(inbound.get(route)||0)+1);
  if(url.hash&&!ext){
   let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{id=url.hash.slice(1);}
   const targetHtml=cache.get(route)||read(route);
   if(id&&!idsOf(targetHtml).has(id))failures.push(source+' -> '+path+' missing target fragment #'+id);
   else if(id)counts.fragments++;
  }
 }
}
const orphan=[...inbound].filter(([path,n])=>n===0).map(([path])=>path);
assert.deepEqual(failures,[],'Broken internal links or anchors');
assert.deepEqual(orphan,[],'Published URLs with no incoming internal navigation');
console.log('R109 INTERNAL LINK PASS: '+counts.pages+' pages, '+counts.internal+' internal links, '+counts.fragments+' valid fragments, no legacy links, no orphaned published pages.');
