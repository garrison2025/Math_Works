/** R99 no-account browser client for reproducible 3D solid-volume worksheets. */
import {makeSolidSet,type SolidSet,type SolidMode,type SolidLevel,SOLID_MODES,SOLID_LEVELS,SOLID_COUNTS} from '../lib/solid-volumes.ts';
import {createSolidPdf,type SolidPaper,type SolidEdition} from '../lib/solid-volumes-pdf.ts';
const validMode=new Set<string>(SOLID_MODES),validLevel=new Set<string>(SOLID_LEVELS);
function init(root:HTMLElement){
 if(root.dataset.ready)return;root.dataset.ready='true';
 const mode=root.querySelector<HTMLSelectElement>('[data-solid-mode]')!;
 const level=root.querySelector<HTMLSelectElement>('[data-solid-level]')!;
 const count=root.querySelector<HTMLSelectElement>('[data-solid-count]')!;
 const paper=root.querySelector<HTMLSelectElement>('[data-solid-paper]')!;
 const seed=root.querySelector<HTMLInputElement>('[data-solid-seed]')!;
 const list=root.querySelector<HTMLOListElement>('[data-solid-list]')!;
 const status=root.querySelector<HTMLElement>('[data-solid-status]')!;
 const toggle=root.querySelector<HTMLButtonElement>('[data-solid-toggle]')!;
 let visible=false,pack:SolidSet;
 const params=new URLSearchParams(window.location.search);
 const keys=['sv_seed','sv_mode','sv_level','sv_count','sv_paper'];
 const hasShare=keys.some(k=>params.has(k));
 function restore(){
  const s=params.get('sv_seed');if(s&&/^\d{1,10}$/.test(s)&&Number(s)<=0xffffffff)seed.value=s;
  const m=params.get('sv_mode');if(m&&validMode.has(m))mode.value=m;
  const l=params.get('sv_level');if(l&&validLevel.has(l))level.value=l;
  const c=params.get('sv_count');if(c&&SOLID_COUNTS.includes(Number(c)))count.value=c;
  const p=params.get('sv_paper');if(p==='A4'||p==='Letter')paper.value=p;
 }
 restore();
 const message=(s:string,error=false)=>{status.textContent=s;status.dataset.error=error?'true':'false'};
 const current=()=>makeSolidSet(Number(seed.value),Number(count.value),mode.value as SolidMode,level.value as SolidLevel);
 function render(){
  pack=current();list.replaceChildren();
  for(const p of pack.problems){
   const li=document.createElement('li'),q=document.createElement('p');
   q.textContent=p.question;li.append(q);
   if(visible){
    const answer=document.createElement('p');answer.className='solid-answer';answer.textContent='Answer: '+p.answer;li.append(answer);
    const steps=document.createElement('ol');steps.className='solid-steps';
    for(const s of p.steps){const item=document.createElement('li');item.textContent=s;steps.append(item)}
    li.append(steps);
   }else{
    const space=document.createElement('div');space.className='solid-writing';
    space.setAttribute('aria-label','Space for your calculation');li.append(space);
   }
   list.append(li);
  }
  toggle.textContent=visible?'Hide answers and steps':'Show answers and steps';
  toggle.setAttribute('aria-pressed',String(visible));
  message(pack.problems.length+' exact solid-volume questions ready. Worksheet seed: '+pack.seed+'.');
 }
 const safe=()=>{try{visible=false;render()}catch(e){message(e instanceof Error?e.message:'Invalid worksheet settings',true)}};
 for(const el of [mode,level,count,paper,seed])el.addEventListener('change',safe);
 toggle.addEventListener('click',()=>{visible=!visible;try{render()}catch(e){message(e instanceof Error?e.message:'Preview unavailable',true)}});
 root.querySelector<HTMLButtonElement>('[data-solid-new]')!.addEventListener('click',()=>{
  const values=new Uint32Array(1);crypto.getRandomValues(values);seed.value=String(values[0]);safe();
 });
 root.querySelector<HTMLButtonElement>('[data-solid-share]')!.addEventListener('click',async()=>{
  try{
   const set=current(),url=new URL(window.location.pathname,window.location.origin);
   url.searchParams.set('sv_seed',String(set.seed));url.searchParams.set('sv_mode',set.mode);
   url.searchParams.set('sv_level',set.level);url.searchParams.set('sv_count',String(set.problems.length));
   url.searchParams.set('sv_paper',paper.value);
   await navigator.clipboard.writeText(url.toString());
   message('Reproducible worksheet settings copied. No answers included in link.');
  }catch(e){message(e instanceof Error?'Could not copy: '+e.message:'Could not copy link',true)}
 });
 for(const edition of ['questions','answers','steps'] as const){
  const button=root.querySelector<HTMLButtonElement>('[data-solid-download="'+edition+'"]')!;
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    const set=current();message('Generating '+edition+' PDF locally...');
    const bytes=await createSolidPdf(set,edition as SolidEdition,paper.value as SolidPaper);
    const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
    const a=document.createElement('a');a.href=url;
    a.download='math-solid-volumes-sv1-'+set.seed+'-'+set.mode+'-'+set.level+'-'+set.problems.length+'-'+paper.value.toLowerCase()+'-'+edition+'.pdf';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    message(edition+' PDF downloaded with '+set.problems.length+' questions ('+paper.value+').');
   }catch(e){message(e instanceof Error?'PDF failed: '+e.message:'PDF generation failed',true)}
   finally{button.disabled=false;}
  });
 }
 if(hasShare)window.addEventListener('pageshow',()=>{
  restore();try{visible=false;render()}catch(e){message(e instanceof Error?e.message:'Link restore failed',true)}
 });
 try{render()}catch(e){message(e instanceof Error?e.message:'Unable to initialize',true)}
}
document.querySelectorAll<HTMLElement>('[data-solid-workspace]').forEach(init);
