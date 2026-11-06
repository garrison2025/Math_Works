/** R62: evidence-backed primary search intent, not a claim that every
 * originally supplied search term matches an implemented worksheet.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import routes from '../src/data/routes.json' with {type:'json'};
import targets from '../src/data/seo-targets.json' with {type:'json'};
import review from '../src/data/seo-intent-review.json' with {type:'json'};
import {topicOptionsFor} from '../src/lib/topic-options.ts';
import {releasePaths} from '../src/lib/indexation.ts';

function parseCsvLine(s){
 const result=[];let word='',quoted=false;
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==='"'){if(quoted&&s[i+1]==='"'){word+='"';i++}else quoted=!quoted}
  else if(ch===','&&!quoted){result.push(word);word=''}
  else word+=ch;
 }
 result.push(word);
 return result;
}
const source=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
const evidence=source.trimEnd().split(/\r?\n/).slice(1).map(line=>{
 const row=parseCsvLine(line);
 assert.equal(row.length,7,'Keyword evidence row invalid');
 return {keyword:row[0].slice(1,-1),volume:Number(row[1]),
  kd:Number(row[2]),slug:row[6].slice(2,-2)};
});
test('R62 every live page uses one original Semrush-source primary keyword and correct route',()=>{
 const live=routes.filter(r=>r.type!=='HOLD');
 assert.equal(live.length,51);
 assert.equal(targets.length,51);
 const seen=new Set();
 for(const focus of targets){
  assert.ok(!seen.has(focus.slug),'Duplicate target');
  seen.add(focus.slug);
  const route=live.find(x=>x.slug===focus.slug);
  assert.ok(route,'Unbuilt or held route cannot be target');
  const row=evidence.find(x=>x.slug===focus.slug&&x.keyword===focus.primary);
  assert.ok(row,'Invented keyword: '+focus.slug+' / '+focus.primary);
  assert.equal(focus.sourceMonthlyVolume,row.volume,'Volume changed from source');
  assert.equal(focus.sourceSemrushKD,row.kd,'Difficulty changed from source');
  assert.ok(row.kd<=29);
  assert.doesNotThrow(()=>topicOptionsFor(route.slug));
 }
 assert.equal(seen.size,live.length);
 assert.equal(live.filter(r=>r.type==='CONDITIONAL_TOOL').length,43);
 assert.equal(live.filter(r=>r.type==='CONDITIONAL_HUB').length,8);
});
test('R62 partial intent mismatch review prevents unsupported wording from becoming primary',()=>{
 assert.equal(evidence.length,488);
 assert.equal(review.status,'INITIAL_PARTIAL_AUDIT');
 assert.equal(review.flagged.length,21);
 const seen=new Set();
 for(const issue of review.flagged){
  assert.ok(['unsupported','wrong-page','needs-review'].includes(issue.classification));
  assert.ok(issue.reason.length>=25);
  assert.ok(evidence.some(r=>r.slug===issue.slug&&r.keyword===issue.keyword),
   'Flagged phrase missing from exact source: '+issue.keyword);
  const key=issue.slug+'|'+issue.keyword;
  assert.ok(!seen.has(key));seen.add(key);
  assert.ok(!targets.some(t=>t.slug===issue.slug&&t.primary===issue.keyword),
   'Known bad intent promoted to primary');
 }
 for(const [slug,keyword] of [
  ['area-worksheets','area of a circle worksheet'],
  ['surface-area-worksheets','surface area of a cylinder worksheet'],
  ['division-worksheets','decimal division worksheet'],
  ['mixed-addition-subtraction-worksheets','polynomial addition and subtraction worksheet']
 ])assert.ok(review.flagged.some(x=>x.slug===slug&&x.keyword===keyword&&x.classification==='unsupported'));
});
test('R62 no index approval is granted by keyword data or GEO markup',()=>{
 const inputs={site:'https://math-works.pages.dev',enabled:'true',
  routes:targets.map(x=>x.slug).join(','),branch:'main'};
 assert.deepEqual(releasePaths(inputs,routes),[]);
 assert.deepEqual(releasePaths({...inputs,site:'https://example.org',enabled:'false'},routes),[]);
 const valid=releasePaths({...inputs,site:'https://independent-math.example.net'},routes);
 assert.equal(valid.filter(path=>path.endsWith('-worksheets/')).length,
  routes.filter(r=>r.type==='CONDITIONAL_TOOL'&&r.slug.endsWith('-worksheets')).length);
 assert.ok(!valid.includes('/area-worksheets/'),'Hub not indexed without independent review');
 assert.ok(!valid.includes('/word-problems-worksheets/'),'HOLD route not indexable');
});
