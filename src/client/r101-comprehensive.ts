/** R101 on-device supplemental worksheet builder; supports all three existing HOLD directories. */
import {makeWidePack,wideDiagram,WIDE_COUNTS,WIDE_LEVELS,WIDE_MODES,MODE_LABELS,
 type WidePack,type WideMode,type WideLevel} from '../lib/r101-comprehensive.ts';
import {createWidePdf,type WideEdition,type WidePaper} from '../lib/r101-comprehensive-pdf.ts';
function initialize(root:HTMLElement){
 if(root.dataset.ready)return;root.dataset.ready='true';
 const scopes:Record<string,readonly WideMode[]>={
  grade:['grade2','grade5'],
  geometry:['shapes','real-shapes','polygon-sides','congruent','similar','triangles','circles','volumes'],
  stories:['equation-stories']
 };
 const allowed=scopes[root.dataset.wideScope||'']||[];
 const mode=root.querySelector<HTMLSelectElement>('[data-wide-mode]')!;
 const level=root.querySelector<HTMLSelectElement>('[data-wide-level]')!;
 const count=root.querySelector<HTMLSelectElement>('[data-wide-count]')!;
 const paper=root.querySelector<HTMLSelectElement>('[data-wide-paper]')!;
 const seed=root.querySelector<HTMLInputElement>('[data-wide-seed]')!;
 const list=root.querySelector<HTMLOListElement>('[data-wide-list]')!;
 const title=root.querySelector<HTMLElement>('[data-wide-title]')!;
 const toggle=root.querySelector<HTMLButtonElement>('[data-wide-toggle]')!;
 const status=root.querySelector<HTMLElement>('[data-wide-status]')!;
 const query=new URLSearchParams(window.location.search),params=['wm_seed','wm_mode','wm_level','wm_count','wm_paper'];
 let answersShown=false,pack:WidePack;
 function message(msg:string,isError=false){status.textContent=msg;status.dataset.error=String(isError);}
 function restore(){
  const s=query.get('wm_seed');
  if(s&&/^\d{1,10}$/.test(s)&&Number(s)<=0xffffffff)seed.value=s;
  const m=query.get('wm_mode');if(m&&allowed.includes(m as WideMode)&&WIDE_MODES.includes(m as WideMode))mode.value=m;
  const l=query.get('wm_level');if(l&&WIDE_LEVELS.includes(l as WideLevel))level.value=l;
  const c=query.get('wm_count');if(c&&WIDE_COUNTS.includes(Number(c)))count.value=c;
  const p=query.get('wm_paper');if(p==='Letter'||p==='A4')paper.value=p;
 }
 const make=()=>makeWidePack(Number(seed.value),Number(count.value),mode.value as WideMode,level.value as WideLevel);
 function render(){
  pack=make();list.replaceChildren();title.textContent=MODE_LABELS[pack.mode];
  for(const p of pack.problems){
   const li=document.createElement('li'),q=document.createElement('p');q.textContent=p.question;li.append(q);
   const diagram=wideDiagram(p);
   if(diagram){
    const box=document.createElement('div');box.className='wide-diagram';
    // Numeric/generated SVG from validated original math metadata only.
    box.innerHTML=diagram;li.append(box);
   }
   if(answersShown){
    const answer=document.createElement('p');answer.className='wide-answer';answer.textContent='Answer: '+p.answer;li.append(answer);
    const steps=document.createElement('ol');steps.className='wide-steps';
    for(const item of p.steps){const el=document.createElement('li');el.textContent=item;steps.append(el);}
    li.append(steps);
   }else{
    const work=document.createElement('div');work.className='wide-writing';work.setAttribute('aria-label','Space for written work');li.append(work);
   }
   list.append(li);
  }
  toggle.textContent=answersShown?'Hide answers':'Show worked answers';
  toggle.setAttribute('aria-pressed',String(answersShown));
  message(pack.problems.length+' original '+pack.mode+' practice questions ready (seed '+pack.seed+').');
 }
 function safe(){try{answersShown=false;render();}catch(e){message(e instanceof Error?e.message:'Invalid worksheet settings',true);}}
 restore();
 for(const input of [mode,level,count,seed,paper])input.addEventListener('change',safe);
 toggle.addEventListener('click',()=>{try{answersShown=!answersShown;render();}catch(e){message(e instanceof Error?e.message:'Unable to display answers',true);}});
 root.querySelector<HTMLButtonElement>('[data-wide-new]')!.addEventListener('click',()=>{
  const buf=new Uint32Array(1);crypto.getRandomValues(buf);seed.value=String(buf[0]);safe();
 });
 root.querySelector<HTMLButtonElement>('[data-wide-share]')!.addEventListener('click',async()=>{
  try{
   const p=make(),url=new URL(window.location.pathname,window.location.origin);
   url.searchParams.set('wm_seed',String(p.seed));url.searchParams.set('wm_mode',p.mode);
   url.searchParams.set('wm_level',p.level);url.searchParams.set('wm_count',String(p.problems.length));
   url.searchParams.set('wm_paper',paper.value);
   await navigator.clipboard.writeText(url.toString());message('Worksheet settings link copied; no solutions are embedded in the URL.');
  }catch(e){message(e instanceof Error?'Copy failed: '+e.message:'Copy failed',true);}
 });
 for(const edition of ['questions','answers','steps'] as const){
  const button=root.querySelector<HTMLButtonElement>('[data-wide-download="'+edition+'"]')!;
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    const p=make();message('Generating '+edition+' PDF on this device...');
    const bytes=await createWidePdf(p,edition as WideEdition,paper.value as WidePaper);
    const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='math-works-wm1-'+p.seed+'-'+p.mode+'-'+p.level+'-'+p.problems.length+'-'+paper.value.toLowerCase()+'-'+edition+'.pdf';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    message('Downloaded '+edition+' PDF: '+p.problems.length+' questions, '+paper.value+'.');
   }catch(e){message(e instanceof Error?'PDF failed: '+e.message:'PDF failed',true);}
   finally{button.disabled=false;}
  });
 }
 if(params.some(s=>query.has(s)))window.addEventListener('pageshow',()=>{restore();safe();});
 try{render();}catch(e){message(e instanceof Error?e.message:'Unable to prepare worksheet',true);}
}
document.querySelectorAll<HTMLElement>('[data-wide-workspace]').forEach(initialize);
