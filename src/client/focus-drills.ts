/** R100 browser-only exercise builder for real algebra and 360-degree vector angles. */
import {makeFocusPack,pointAngleSvg,FOCUS_COUNTS,FOCUS_MODES,FOCUS_LEVELS,
 type FocusMode,type FocusLevel,type FocusPack} from '../lib/focus-drills.ts';
import {createFocusPdf,type FocusPaper,type FocusEdition} from '../lib/focus-drills-pdf.ts';
function init(root:HTMLElement){
 if(root.dataset.ready)return;root.dataset.ready='true';
 const scope=root.dataset.focusScope==='angles'?'angles':'algebra';
 const allowed=scope==='angles'?new Set(['point-angles']):new Set(['mixed','literal','multi-step','simplify']);
 const mode=root.querySelector<HTMLSelectElement>('[data-focus-mode]')!;
 const level=root.querySelector<HTMLSelectElement>('[data-focus-level]')!;
 const count=root.querySelector<HTMLSelectElement>('[data-focus-count]')!;
 const paper=root.querySelector<HTMLSelectElement>('[data-focus-paper]')!;
 const seed=root.querySelector<HTMLInputElement>('[data-focus-seed]')!;
 const list=root.querySelector<HTMLOListElement>('[data-focus-list]')!;
 const status=root.querySelector<HTMLElement>('[data-focus-status]')!;
 const toggle=root.querySelector<HTMLButtonElement>('[data-focus-toggle]')!;
 let answersShown=false,pack:FocusPack;
 const params=new URLSearchParams(window.location.search);
 const hasShared=['fd_seed','fd_mode','fd_level','fd_count','fd_paper'].some(s=>params.has(s));
 function restore(){
  const v=params.get('fd_seed');if(v&&/^\d{1,10}$/.test(v)&&Number(v)<=0xffffffff)seed.value=v;
  const m=params.get('fd_mode');if(m&&allowed.has(m)&&FOCUS_MODES.includes(m as FocusMode))mode.value=m;
  const l=params.get('fd_level');if(l&&FOCUS_LEVELS.includes(l as FocusLevel))level.value=l;
  const c=params.get('fd_count');if(c&&FOCUS_COUNTS.includes(Number(c)))count.value=c;
  const p=params.get('fd_paper');if(p==='A4'||p==='Letter')paper.value=p;
 }
 restore();
 const message=(m:string,error=false)=>{status.textContent=m;status.dataset.error=error?'true':'false'};
 const current=()=>makeFocusPack(Number(seed.value),Number(count.value),mode.value as FocusMode,level.value as FocusLevel);
 function render(){
  pack=current();list.replaceChildren();
  for(const p of pack.problems){
   const li=document.createElement('li'),question=document.createElement('p');
   question.textContent=p.question;li.append(question);
   if(p.kind==='point-angles'){
    const diagram=document.createElement('div');diagram.className='focus-diagram';
    // Produced solely by our validated, number-only geometry generator.
    diagram.innerHTML=pointAngleSvg(p);li.append(diagram);
   }
   if(answersShown){
    const answer=document.createElement('p');answer.className='focus-answer';answer.textContent='Answer: '+p.answer;li.append(answer);
    const steps=document.createElement('ol');steps.className='focus-steps';
    for(const line of p.steps){
     const item=document.createElement('li');item.textContent=line;steps.append(item);
    }
    li.append(steps);
   }else{
    const space=document.createElement('div');space.className='focus-writing';space.setAttribute('aria-label','Space to work out a solution');li.append(space);
   }
   list.append(li);
  }
  toggle.textContent=answersShown?'Hide answers and worked steps':'Show answers and worked steps';
  toggle.setAttribute('aria-pressed',String(answersShown));
  message(pack.problems.length+' reproducible '+(scope==='angles'?'point-angle':'algebra')+' problems are ready (seed '+pack.seed+').');
 }
 const safe=()=>{try{answersShown=false;render()}catch(e){message(e instanceof Error?e.message:'Invalid practice settings',true)}};
 for(const el of [mode,level,count,paper,seed])el.addEventListener('change',safe);
 toggle.addEventListener('click',()=>{try{answersShown=!answersShown;render()}catch(e){message(e instanceof Error?e.message:'Preview error',true)}});
 root.querySelector<HTMLButtonElement>('[data-focus-new]')!.addEventListener('click',()=>{
  const words=new Uint32Array(1);crypto.getRandomValues(words);seed.value=String(words[0]);safe();
 });
 root.querySelector<HTMLButtonElement>('[data-focus-share]')!.addEventListener('click',async()=>{
  try{
   const s=current(),url=new URL(window.location.pathname,window.location.origin);
   url.searchParams.set('fd_seed',String(s.seed));url.searchParams.set('fd_mode',s.mode);
   url.searchParams.set('fd_level',s.level);url.searchParams.set('fd_count',String(s.problems.length));
   url.searchParams.set('fd_paper',paper.value);
   await navigator.clipboard.writeText(url.toString());
   message('Reproducible settings link copied. Answers not included.');
  }catch(e){message(e instanceof Error?'Copy failed: '+e.message:'Copy failed',true)}
 });
 for(const edition of ['questions','answers','steps'] as const){
  const button=root.querySelector<HTMLButtonElement>('[data-focus-download="'+edition+'"]')!;
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    const s=current();message('Preparing '+edition+' PDF locally...');
    const bytes=await createFocusPdf(s,edition as FocusEdition,paper.value as FocusPaper);
    const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
    const a=document.createElement('a');a.href=url;
    a.download='math-focus-fd1-'+s.seed+'-'+s.mode+'-'+s.level+'-'+s.problems.length+'-'+paper.value.toLowerCase()+'-'+edition+'.pdf';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    message(edition+' PDF downloaded ('+paper.value+', '+s.problems.length+' questions).');
   }catch(e){message(e instanceof Error?'PDF failed: '+e.message:'PDF failed',true)}
   finally{button.disabled=false;}
  });
 }
 if(hasShared)window.addEventListener('pageshow',()=>{
  restore();try{answersShown=false;render()}catch(e){message(e instanceof Error?e.message:'Unable to load shared worksheet',true)}
 });
 try{render()}catch(e){message(e instanceof Error?e.message:'Unable to start practice',true)}
}
document.querySelectorAll<HTMLElement>('[data-focus-workspace]').forEach(init);
