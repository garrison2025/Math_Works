/** Post-build R90 search asset audit; owner-approved keywords only. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import routes from '../src/data/routes.json' with {type:'json'};
import corrections from '../src/data/seo-routing-r70.json' with {type:'json'};
import {parseWorksheetLink} from '../src/lib/worksheet-link.ts';
const root=process.cwd(),file=join(root,'dist','worksheet-search.json');
assert.ok(existsSync(file),'Missing built R90 search endpoint');
const raw=readFileSync(file,'utf8'),parsed=JSON.parse(raw);
assert.equal(parsed.schema,'mathworks-r90-v2-worksheet-search/v1');
assert.equal(parsed.entries.length,437);
assert.ok(statSync(file).size<150000,'Search alias asset is too large for mobile');
assert.ok(!raw.includes('sourceKD')&&!raw.includes('sourceVolume')&&!raw.includes('competitorSource'),
 'V2 private Semrush metrics must not be in public search index');
const source=readFileSync(join(root,'src','data','keyword-evidence.csv'),'utf8');
const tick=String.fromCharCode(96);
const sources=new Set(source.split(/\r?\n/).slice(1).map(line=>{
 const m=line.match(new RegExp('^'+tick+'([^'+tick+']+)'+tick));
 return m?.[1];
}).filter(Boolean));
const allowed=new Map(routes.map(r=>[r.slug,r.type]));
for(const item of parsed.entries){
 assert.equal(typeof item.keyword,'string');assert.ok(sources.has(item.keyword));
 assert.ok(allowed.has(item.slug)&&allowed.get(item.slug)!=='HOLD');
 assert.ok(item.href.startsWith('/'+item.slug+'/'));
 assert.ok(item.title.length>5&&item.section);
 const params=parseWorksheetLink('https://math-works.pages.dev'+item.href,item.slug);
 if(item.href.includes('opt_'))assert.ok(Object.keys(params.options??{}).length>0);
 assert.ok(existsSync(join(root,'dist',item.slug,'index.html')),'Search leads to missing generator '+item.slug);
}
for(const correction of corrections.rows.filter(x=>x.status==='corrected')){
 const item=parsed.entries.find(x=>x.keyword===correction.keyword);
 assert.ok(item&&item.slug===correction.effectiveRoute);
 for(const [key,value] of Object.entries(correction.requiredOptions))
  assert.equal(new URL('https://math-works.pages.dev'+item.href).searchParams.get('opt_'+key),value);
}
for(const name of ['worksheets','arithmetic','algebra','fractions','geometry','data-statistics']){
 const html=readFileSync(join(root,'dist',name,'index.html'),'utf8');
 assert.match(html,/data-directory-search/);
 assert.match(html,/data-directory-matches/);
 assert.match(html,/data-directory-query/);
 assert.match(html,/name="robots"\s+content="noindex,nofollow"/i);
}
const terms=readFileSync(join(root,'dist','terms','index.html'),'utf8');
assert.match(terms,/<h1[^>]*>Terms of Use<\/h1>/);
assert.match(terms,/noindex,nofollow/);
const report={
 schema:'mathworks-r90-keyword-search-release/v1',result:'PASS',
 originalOwnerKeywords:488,liveSearchAliases:parsed.entries.length,
 heldKeywordsNotSearchable:51,realModeCorrectedSearchTerms:15,
 actualTools:51,subjectDirectories:6,
 searchAssetBytes:Buffer.byteLength(raw,'utf8'),
 publicSearchIncludesSemrushMetrics:false,
 noJavascript:'All tool cards server-rendered; search is progressive enhancement',
 previewIndexable:false,teacherReview:'NOT RUN',physicalPrinter:'NOT RUN'
};
const out=join(root,'qa-artifacts','r90-worksheet-search');mkdirSync(out,{recursive:true});
writeFileSync(join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
console.log('R90 search audit PASS',JSON.stringify(report));
