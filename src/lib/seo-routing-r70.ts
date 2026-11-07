/** Navigation to the correct V2 worksheet task and preselected exercise options.
 * Historical Semrush evidence is unchanged. Not an indexing authorization.
 */
import routing from '../data/seo-routing-r70.json' with {type:'json'};
import {topicOptionsFor} from './topic-options.ts';
export type CorrectedTaskLink={slug:string;href:string;label:string;description:string};
export function correctedTaskLinksFor(sourceSlug:string):CorrectedTaskLink[]{
 const grouped=new Map<string,CorrectedTaskLink>();
 for(const entry of routing.rows){
  if(entry.sourceRoute!==sourceSlug||entry.status!=='corrected'||!entry.effectiveRoute)continue;
  const defs=topicOptionsFor(entry.effectiveRoute);
  const selected=new URLSearchParams();
  for(const [key,value] of Object.entries(entry.requiredOptions)){
   const opt=defs.find(d=>d.key===key);
   if(!opt||!opt.choices.some(c=>c.value===value))
    throw Error('Incorrect historical keyword option: '+entry.keyword+' / '+key+'='+value);
   selected.set('opt_'+key,value);
  }
  const href='/'+entry.effectiveRoute+'/'+
   (selected.size?'?gv=18&'+selected.toString():'');
  // One link per genuinely different task, not one duplicate per keyword variant.
  if(!grouped.has(href)){
   grouped.set(href,{
    slug:entry.effectiveRoute,href,
    label:entry.effectiveRoute.replace(/-worksheets$/,'').replace(/-/g,' '),
    description:entry.reason
   });
  }
 }
 return [...grouped.values()];
}
export function historicalIntentState(sourceSlug:string,keyword:string){
 return routing.rows.find(entry=>entry.sourceRoute===sourceSlug&&entry.keyword===keyword)??null;
}
