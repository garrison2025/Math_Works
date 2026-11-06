/** R70 verified task-to-specialist navigation; does not rewrite historical
 * Semrush rows, assert fresh Google ranks, or authorize indexing.
 */
import routing from '../data/seo-routing-r70.json' with {type:'json'};
export type CorrectedTaskLink={slug:string;label:string;description:string};
export function correctedTaskLinksFor(sourceSlug:string):CorrectedTaskLink[]{
 const grouped=new Map<string,CorrectedTaskLink>();
 for(const entry of routing.rows){
  if(entry.sourceRoute!==sourceSlug||entry.status!=='corrected'||!entry.effectiveRoute)continue;
  if(!grouped.has(entry.effectiveRoute)){
   grouped.set(entry.effectiveRoute,{
    slug:entry.effectiveRoute,
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
