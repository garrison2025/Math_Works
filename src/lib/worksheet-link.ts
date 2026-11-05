export const SHARE_GENERATOR_VERSION='14' as const;
/** Reproducibility link: only public worksheet settings, never student content. */
import {normalizeTopicOptions,topicOptionsFor,type TopicOptions} from './topic-options.ts';
export type LinkSettings = {seed:number;difficulty:'easy'|'standard'|'challenge';quantity:number;paper:'Letter'|'A4';options:TopicOptions};
const counts=new Set([4,8,12,16,20,30,40]);
export function buildWorksheetLink(currentUrl:string,topic:string,settings:LinkSettings):string {
 if(!Number.isInteger(settings.seed)||settings.seed<0||settings.seed>0xffffffff||!counts.has(settings.quantity))throw new Error('Invalid worksheet link settings');
 if(!['easy','standard','challenge'].includes(settings.difficulty)||!['Letter','A4'].includes(settings.paper))throw new Error('Invalid worksheet link settings');
 const options=normalizeTopicOptions(topic,settings.options),url=new URL(currentUrl);url.search='';url.hash='';
 url.searchParams.set('gv',SHARE_GENERATOR_VERSION);url.searchParams.set('seed',String(settings.seed));url.searchParams.set('difficulty',settings.difficulty);
 url.searchParams.set('quantity',String(settings.quantity));url.searchParams.set('paper',settings.paper);
 for(const def of topicOptionsFor(topic))url.searchParams.set(`opt_${def.key}`,options[def.key]);
 return url.toString();
}
export function parseWorksheetLink(currentUrl:string,topic:string):Partial<LinkSettings>{
 const params=new URL(currentUrl).searchParams,settings:Partial<LinkSettings>={};
 const seed=params.get('seed');
 if(seed&&/^\d+$/.test(seed)&&Number(seed)<=0xffffffff)settings.seed=Number(seed);
 const d=params.get('difficulty');if(d==='easy'||d==='standard'||d==='challenge')settings.difficulty=d;
 const q=params.get('quantity');if(q&&/^\d+$/.test(q)&&counts.has(Number(q)))settings.quantity=Number(q);
 const paper=params.get('paper');if(paper==='Letter'||paper==='A4')settings.paper=paper;
 const options:TopicOptions={};for(const def of topicOptionsFor(topic)){
  const value=params.get(`opt_${def.key}`);
  if(value!==null&&def.choices.some(c=>c.value===value))options[def.key]=value;
 }
 settings.options=options;return settings;
}
