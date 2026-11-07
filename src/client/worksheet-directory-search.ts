import {normalizeWorksheetSearch,rankWorksheetMatches,type SearchEntry} from '../lib/worksheet-search.ts';
type Payload={schema:string;entries:SearchEntry[]};
let searchLoad:Promise<SearchEntry[]>|undefined;
function loadIndex():Promise<SearchEntry[]>{
 if(!searchLoad)searchLoad=fetch('/worksheet-search.json',{cache:'force-cache'})
  .then(async response=>{
   if(!response.ok)throw Error('Worksheet directory keyword list unavailable');
   const value:Payload=await response.json();
   if(value.schema!=='mathworks-r90-v2-worksheet-search/v1'||value.entries.length!==437)
    throw Error('Unexpected frozen worksheet keyword list');
   return value.entries;
  }).catch(error=>{searchLoad=undefined;throw error});
 return searchLoad;
}
export function initWorksheetDirectorySearch(){
 document.querySelectorAll<HTMLElement>('[data-worksheet-directory]').forEach(root=>{
  if(root.dataset.searchReady)return;
  root.dataset.searchReady='true';
  const search=root.querySelector<HTMLElement>('[data-directory-search]')!;
  const form=search.querySelector<HTMLFormElement>('form')!;
  const input=search.querySelector<HTMLInputElement>('[data-directory-query]')!;
  const clear=search.querySelector<HTMLButtonElement>('[data-directory-clear]')!;
  const status=search.querySelector<HTMLElement>('[data-directory-status]')!;
  const matches=search.querySelector<HTMLUListElement>('[data-directory-matches]')!;
  const groups=[...root.querySelectorAll<HTMLElement>('.directory-group')];
  const cards=[...root.querySelectorAll<HTMLAnchorElement>('.directory-card')];
  // Unscripted pages remain a complete usable directory. Search only
  // appears if browser scripting has actually initialized successfully.
  search.hidden=false;
  let request=0;
  const reset=()=>{
   for(const card of cards)card.hidden=false;
   for(const group of groups)group.hidden=false;
   matches.replaceChildren();
   matches.hidden=true;
   clear.hidden=true;
   status.textContent='Browse all '+cards.length+' working worksheet topics, or search by a math skill.';
  };
  const paint=(q:string,records:readonly SearchEntry[],aliasesAvailable:boolean)=>{
   const query=normalizeWorksheetSearch(q);
   const hits=rankWorksheetMatches(records,query,437);
   const paths=new Set(hits.map(x=>x.slug));
   let visible=0;
   for(const card of cards){
    const text=normalizeWorksheetSearch(card.textContent||'');
    const wanted=paths.has(card.dataset.slug||'')||
     (query.split(' ').every(part=>text.includes(part)));
    card.hidden=!wanted;
    if(wanted)visible++;
   }
   for(const group of groups)
    group.hidden=![...group.querySelectorAll<HTMLAnchorElement>('.directory-card')].some(c=>!c.hidden);
   matches.replaceChildren();
   for(const entry of rankWorksheetMatches(records,q,8)){
    const li=document.createElement('li'),link=document.createElement('a');
    const title=document.createElement('strong'),detail=document.createElement('span');
    link.href=entry.href;
    title.textContent=entry.title;
    detail.textContent='Matches: '+entry.keyword;
    link.append(title,detail);li.append(link);matches.append(li);
   }
   matches.hidden=matches.children.length===0;
   status.textContent=aliasesAvailable?
    (visible+' topic'+(visible===1?'':'s')+' shown on this page; '+hits.length+
     ' matching worksheet destination'+(hits.length===1?'':'s')+' across the library.') :
    (visible+' topic'+(visible===1?'':'s')+' match the visible page titles. Keyword suggestions are unavailable.');
  };
  const update=async()=>{
   const version=++request,q=input.value.trim();
   clear.hidden=!q;
   if(normalizeWorksheetSearch(q).length<2){reset();return}
   status.textContent='Finding the matching math worksheet…';
   try{
    const entries=await loadIndex();
    if(version!==request)return;
    paint(q,entries,true);
   }catch{
    if(version!==request)return;
    paint(q,[],false);
   }
  };
  let pendingQuery:Promise<void>=Promise.resolve();
  input.addEventListener('input',()=>{pendingQuery=update()});
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const submitted=input.value;
   // The first HTTP fetch may still be pending on a slow connection.
   // Enter must resolve the exact query rather than silently doing nothing.
   await pendingQuery;
   if(input.value!==submitted)return; // Ignore an outdated submission.
   const first=matches.querySelector<HTMLAnchorElement>('a');
   if(first)window.location.assign(first.href);
  });
  clear.addEventListener('click',()=>{
   input.value='';pendingQuery=update();input.focus();
  });
  reset();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWorksheetDirectorySearch,{once:true});
else initWorksheetDirectorySearch();
