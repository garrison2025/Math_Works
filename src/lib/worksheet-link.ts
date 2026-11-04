import {normalizeTopicOptions,topicOptionsFor,type TopicOptions} from './topic-options.ts';
export type LinkSettings={seed:number;difficulty:'easy'|'standard'|'challenge';quantity:number;paper:'Letter'|'A4';options:TopicOptions};
const counts=new Set([4,8,12,16,20,30,40]);
export function buildWorksheetLink(currentUrl:string,topic:string,s:LinkSettings):string{
 if(!Number.isInteger(s.seed)||s.seed<0||s.seed>0xffffffff||!counts.has(s.quantity)||!['easy','standard','challenge'].includes(s.difficulty)||!['Letter','A4'].includes(s.paper))throw Error('Invalid worksheet settings');
 const o=normalizeTopicOptions(topic,s.options),url=new URL(currentUrl);url.search='';url.hash='';
 url.searchParams.set('seed',String(s.seed));url.searchParams.set('difficulty',s.difficulty);url.searchParams.set('quantity',String(s.quantity));url.searchParams.set('paper',s.paper);
 for(const d of topicOptionsFor(topic))url.searchParams.set('opt_'+d.key,o[d.key]);return url.toString();
}
export function parseWorksheetLink(currentUrl:string,topic:string):Partial<LinkSettings>{
 const p=new URL(currentUrl).searchParams,s:Partial<LinkSettings>={},seed=p.get('seed');
 if(seed&&/^\d+$/.test(seed)&&Number(seed)<=0xffffffff)s.seed=Number(seed);
 const d=p.get('difficulty');if(d==='easy'||d==='standard'||d==='challenge')s.difficulty=d;
 const q=p.get('quantity');if(q&&/^\d+$/.test(q)&&counts.has(Number(q)))s.quantity=Number(q);
 const paper=p.get('paper');if(paper==='Letter'||paper==='A4')s.paper=paper;
 const options:TopicOptions={};for(const def of topicOptionsFor(topic)){const value=p.get('opt_'+def.key);if(value!==null&&def.choices.some(c=>c.value===value))options[def.key]=value;}s.options=options;return s;
}