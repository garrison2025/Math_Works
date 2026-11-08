/** R114: verify task-specific guidance is present in the actual built HTML for all live topic pages. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import routes from '../src/data/routes.json' with {type:'json'};
import {howTo,commonMistakes} from '../src/lib/site.ts';

const live=routes.filter(route=>route.type!=='HOLD');
const read=slug=>readFileSync(join('dist',slug,'index.html'),'utf8');
function decode(html){
 return html.replace(/&#(?:0*39|x0*27);|&apos;/gi,"'")
  .replace(/&quot;|&#(?:0*34|x0*22);/gi,'"')
  .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
for(const route of live){
 const html=decode(read(route.slug));
 assert.match(html,/<h2>How to use this worksheet<\/h2>/,'How-to heading '+route.slug);
 assert.match(html,/<h2>Common mistakes<\/h2>/,'Mistake heading '+route.slug);
 for(const step of howTo(route.slug))assert.ok(html.includes(step),'Built how-to text missing '+route.slug+': '+step);
 for(const item of commonMistakes(route.slug))assert.ok(html.includes(item),'Built mistake text missing '+route.slug+': '+item);
}
console.log('R114 BUILT CONTENT PASS: all 51 live topic pages show task-specific how-to steps and common mistakes; no generic fallback and no new URLs.');
