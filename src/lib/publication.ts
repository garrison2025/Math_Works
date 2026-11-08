/** R107 owner approval: production main publishes 51 math topics, 5 subject guides and 2 verified original mixed-generator pages. */
import type {PublishInputs,TopicEntry} from './indexation.ts';
import {releasePaths} from './indexation.ts';
export const OWNED_SITE='https://mathworksheetstudio.com';
export function releaseForBuild(topics:readonly TopicEntry[],branch:string):PublishInputs {
 const main=branch==='main';
 return {
  site:OWNED_SITE, enabled:main?'true':'false',branch:branch||'local-preview',
  routes:main?topics.filter(t=>t.type==='CONDITIONAL_TOOL').map(t=>t.slug).join(','):'',
  hubs:main?topics.filter(t=>t.type==='CONDITIONAL_HUB').map(t=>t.slug).join(','):''
 };
}
export function publishedPaths(config:PublishInputs,topics:readonly TopicEntry[]):string[] {
 const core=releasePaths(config,topics);
 // The worksheet directory is a meaningful sixth public utility page.
 const additional=[
  '/arithmetic/','/fractions/','/algebra/','/geometry/','/data-statistics/',
  // Both pages now have independently verified original generators and focused teaching text.
  '/word-problems-worksheets/','/worksheets-by-grade/'
 ];
 return core.length?[...core.slice(0,5),'/worksheets/',...additional,...core.slice(5)]:[];
}
export function publishedPath(path:string,config:PublishInputs,topics:readonly TopicEntry[]):boolean{
 return publishedPaths(config,topics).includes(path);
}
