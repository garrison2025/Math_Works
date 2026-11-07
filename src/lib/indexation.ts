/** Explicit, fail-closed indexation approval. A built topic URL is not automatically a released URL. */
export type PublishInputs = {site:string;enabled:string;routes:string;branch?:string};
export type TopicEntry = {slug:string;type:string};
const trim=(s:string)=>s.replace(/\/+$/,'');
export function releasePaths(input:PublishInputs,topics:readonly TopicEntry[]):string[] {
 if(input.enabled!=='true')return [];
 if(input.branch && input.branch!=='main')return [];
 let site:URL;
 try {site=new URL(input.site)}catch{return []}
 if(site.protocol!=='https:' || site.username || site.password || site.port || site.pathname!=='/' || site.search || site.hash)return [];
 const host=site.hostname.toLowerCase();
 if(host==='localhost'||host==='example.com'||host.endsWith('.example.com')||host.endsWith('.pages.dev')||host.endsWith('.test')||!host.includes('.'))return [];
 const approved=new Set(input.routes.split(',').map(s=>s.trim()).filter(Boolean));
 const paths=topics.filter(t=>t.type==='CONDITIONAL_TOOL' && approved.has(t.slug)).map(t=>`/${t.slug}/`);
 // Do not publish an empty public-facing site. Hubs and HOLDs need separate owner QA approval.
 return paths.length ? ['/','/about/','/contact/','/privacy/','/terms/',...paths] : [];
}
export function isIndexablePath(path:string,input:PublishInputs,topics:readonly TopicEntry[]):boolean {
 return releasePaths(input,topics).includes(path);
}
export function absoluteSite(input:PublishInputs):string {return trim(input.site)}
