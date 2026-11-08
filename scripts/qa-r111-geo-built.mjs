/** R111: generated HTML, not Astro source, is the GEO source of truth. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {GEO_GUIDES} from '../src/lib/geo-answer-guides.ts';

const read=path=>readFileSync(join('dist',path.replace(/^\/|\/$/g,''),'index.html'),'utf8');
const source='https://mathworksheetstudio.com';
let answers=0;
for(const [slug,guide] of Object.entries(GEO_GUIDES)){
 const path='/'+slug+'/';
 const html=read(path);
 // Astro safely escapes apostrophes and ampersands in text nodes.
 const readable=html.replace(/&#(?:0*39|x0*27);|&apos;/gi,"'")
  .replace(/&quot;|&#(?:0*34|x0*22);/gi,'"').replace(/&amp;/g,'&')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 assert.match(html,/data-geo-answers\b/,'Visible answer section '+slug);
 assert.ok(html.includes('<link rel="canonical" href="'+source+path+'"'),'Preserve canonical '+slug);
 assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large"/,'Indexability '+slug);
 for(const item of guide.answers){
  assert.ok(readable.includes(item.question),'Missing visible question '+slug+': '+item.question);
  assert.ok(readable.includes(item.answer),'Missing visible answer '+slug+': '+item.question);
  answers++;
 }
 assert.ok(html.includes('href="'+guide.related.href+'"'),'Missing related practice '+slug);
 const schema=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||'';
 assert.ok(schema,'Missing existing schema '+slug);
 assert.ok(!schema.includes('"FAQPage"'),'No unsupported FAQ rich-results claim '+slug);
}
const about=read('/about/'),library=read('/worksheets/');
assert.match(about,/Which details can be independently checked/);
assert.match(about,/What to report if an answer appears wrong/);
assert.match(library,/data-geo-library-guide/);
assert.match(library,/Which printable math worksheet should I use/);
console.log('R111 GEO BUILT PASS: '+Object.keys(GEO_GUIDES).length+' focused pages, '+answers+' verified visible question/answer pairs, library decision guidance, and evidence methodology. No new indexed URLs.');
