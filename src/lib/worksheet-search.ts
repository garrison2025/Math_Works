/** Frozen V2 source keywords support finding already-built worksheets only.
 * This is navigation, not new keyword research or new SEO pages.
 * Semrush traffic metrics must not be leaked in the public search JSON.
 */
import {topicOptionsFor} from './topic-options.ts';
import {worksheetSectionFor,type WorksheetSection} from './worksheet-directory.ts';
export type SearchEntry={keyword:string;slug:string;href:string;title:string;section:WorksheetSection};
type Route={slug:string;type:string};
type Correction={keyword:string;sourceRoute:string;status:string;effectiveRoute:string|null;requiredOptions:Record<string,string>};
function parseCsvRow(line:string):string[]{
 const cells:string[]=[];let part='',quoted=false;
 for(let i=0;i<line.length;i++){
  if(line[i]==='"'){
   if(quoted&&line[i+1]==='"'){part+='"';i++}else quoted=!quoted;
  }else if(line[i]===','&&!quoted){cells.push(part);part=''}
  else part+=line[i];
 }
 if(quoted)throw Error('Invalid frozen V2 CSV quoting');
 cells.push(part);return cells;
}
export function buildFrozenV2SearchIndex(
 csv:string,routes:readonly Route[],changes:readonly Correction[],
 titleFor:(slug:string)=>string
):SearchEntry[]{
 const lines=csv.trimEnd().split(/\r?\n/);
 const header='keyword,monthly_volume,semrush_kd,competitor_rank_type,estimated_competitor_visits,source,canonical_candidate';
 if(lines.shift()!==header||lines.length!==488)throw Error('Frozen 488-row V2 keyword source was changed');
 const bySlug=new Map(routes.map(r=>[r.slug,r]));
 if(bySlug.size!==55)throw Error('Original 55 route contract changed');
 const corrected=new Map(changes.map(c=>[c.sourceRoute+'|'+c.keyword,c]));
 const seen=new Set<string>(),entries:SearchEntry[]=[];
 const tick=String.fromCharCode(96);
 for(const line of lines){
  const row=parseCsvRow(line);
  if(row.length!==7)throw Error('Incorrect V2 source field count');
  const [source,,,,,,routeText]=row;
  if(!source.startsWith(tick)||!source.endsWith(tick)||
   !routeText.startsWith(tick+'/')||!routeText.endsWith('/'+tick))
   throw Error('Malformed V2 keyword or canonical destination');
  const keyword=source.slice(1,-1),original=routeText.slice(2,-2);
  if(seen.has(keyword))throw Error('Duplicate V2 keyword '+keyword);
  seen.add(keyword);
  const route=bySlug.get(original);
  if(!route)throw Error('Unknown V2 route '+original);
  if(route.type==='HOLD')continue;
  const change=corrected.get(original+'|'+keyword);
  const slug=change?.status==='corrected'&&change.effectiveRoute?change.effectiveRoute:original;
  if(!bySlug.has(slug)||bySlug.get(slug)?.type==='HOLD')throw Error('HOLD route used in search');
  const params=new URLSearchParams();
  if(change?.status==='corrected'){
   for(const [key,value] of Object.entries(change.requiredOptions)){
    const option=topicOptionsFor(slug).find(o=>o.key===key);
    if(!option?.choices.some(c=>c.value===value))throw Error('Unsupported math option '+key);
    params.set('opt_'+key,value);
   }
  }
  const href='/'+slug+'/' + (params.size?'?gv=18&'+params.toString():'');
  entries.push({keyword,slug,href,title:titleFor(slug),section:worksheetSectionFor(slug)});
 }
 if(seen.size!==488||entries.length!==437)throw Error('Search must contain exactly 437 deployed V2 terms');
 return entries;
}
export function normalizeWorksheetSearch(term:string):string{
 return term.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
export function rankWorksheetMatches(entries:readonly SearchEntry[],query:string,limit=8):SearchEntry[]{
 const q=normalizeWorksheetSearch(query);
 if(q.length<2)return [];
 const words=q.split(' ');
 const scored=entries.map(entry=>{
  const term=normalizeWorksheetSearch(entry.keyword),title=normalizeWorksheetSearch(entry.title);
  const primary=term===q?1000:term.startsWith(q)?800:term.includes(q)?600:
   words.every(word=>term.includes(word))?400:0;
  const fallback=title===q?950:title.startsWith(q)?700:title.includes(q)?500:
   words.every(word=>title.includes(word))?300:0;
  return {entry,score:Math.max(primary,fallback)};
 }).filter(e=>e.score>0);
 scored.sort((a,b)=>b.score-a.score||a.entry.keyword.length-b.entry.keyword.length||
  a.entry.keyword.localeCompare(b.entry.keyword));
 const urls=new Set<string>(),unique:SearchEntry[]=[];
 for(const item of scored){
  if(urls.has(item.entry.href))continue;
  urls.add(item.entry.href);
  unique.push(item.entry);
  if(unique.length>=limit)break;
 }
 return unique;
}
