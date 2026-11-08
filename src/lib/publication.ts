/** R107 owner approval: production main publishes the actual 51 math topic URLs. */
import type {PublishInputs,TopicEntry} from './indexation';
import {releasePaths} from './indexation';
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
 return core.length?[...core.slice(0,5),'/worksheets/',...core.slice(5)]:[];
}
export function publishedPath(path:string,config:PublishInputs,topics:readonly TopicEntry[]):boolean{
 return publishedPaths(config,topics).includes(path);
}
