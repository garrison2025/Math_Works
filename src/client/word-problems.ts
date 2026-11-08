/** Word problems preview, controls and client-only PDF download. No accounts or score tracking. */
import {makeStorySet,type StorySet,type StoryChoice,type StoryLevel} from '../lib/word-problems.ts';
import {createStoryPdf,type StoryPaper,type StoryPdfEdition} from '../lib/word-problems-pdf.ts';
const choices=new Set(['mixed','proportions','area','multiplication','division','one-step','decimals']);
const levels=new Set(['easy','standard','challenge']);
const counts=new Set([4,8,12,16,20,30,40]);
function init(root:HTMLElement){
 if(root.dataset.ready)return;root.dataset.ready='true';
 const mode=root.querySelector<HTMLSelectElement>('[data-story-mode]')!;
 const level=root.querySelector<HTMLSelectElement>('[data-story-level]')!;
 const quantity=root.querySelector<HTMLSelectElement>('[data-story-count]')!;
 const paper=root.querySelector<HTMLSelectElement>('[data-story-paper]')!;
 const seed=root.querySelector<HTMLInputElement>('[data-story-seed]')!;
 const list=root.querySelector<HTMLOListElement>('[data-story-list]')!;
 const status=root.querySelector<HTMLElement>('[data-story-status]')!;
 const toggle=root.querySelector<HTMLButtonElement>('[data-story-toggle]')!;
 let keyVisible=false,pack:StorySet;
 const message=(m:string,error=false)=>{status.textContent=m;status.dataset.error=error?'true':'false'};
 // Browsers can restore cached select state *after* a deferred script initializes.
 // Shared settings take priority over session form restoration, including on
 // same-path query navigation and back/forward cache pageshow.
 const params=new URLSearchParams(window.location.search);
 const hasSharedSettings=['wp_seed','wp_mode','wp_level','wp_count','wp_paper'].some(k=>params.has(k));
 const restoreSettings=()=>{
  const seeded=params.get('wp_seed');
  if(seeded&&/^\d{1,10}$/.test(seeded)&&Number(seeded)<=0xffffffff)seed.value=seeded;
  const selected=params.get('wp_mode');if(selected&&choices.has(selected))mode.value=selected;
  const selectedLevel=params.get('wp_level');if(selectedLevel&&levels.has(selectedLevel))level.value=selectedLevel;
  const count=params.get('wp_count');if(count&&counts.has(Number(count)))quantity.value=count;
  const targetPaper=params.get('wp_paper');if(targetPaper==='Letter'||targetPaper==='A4')paper.value=targetPaper;
 };
 restoreSettings();
 function current(){
  return makeStorySet(Number(seed.value),Number(quantity.value),mode.value as StoryChoice,level.value as StoryLevel);
 }
 function render(){
  pack=current();list.replaceChildren();
  for(const problem of pack.questions){
   const li=document.createElement('li'),q=document.createElement('p');
   q.textContent=problem.question;li.append(q);
   if(keyVisible){
    const answer=document.createElement('p');answer.className='story-solution';
    answer.textContent='Answer: '+problem.answer;li.append(answer);
    const ol=document.createElement('ol');ol.className='story-steps';
    for(const step of problem.steps){const line=document.createElement('li');line.textContent=step;ol.append(line);}
    li.append(ol);
   }else{
    const line=document.createElement('div');line.className='story-pencil-line';
    line.setAttribute('aria-label','Space to solve the problem on paper');li.append(line);
   }
   list.append(li);
  }
  toggle.textContent=keyVisible?'Hide answers and worked steps':'Show answers and worked steps';
  toggle.setAttribute('aria-pressed',String(keyVisible));
  message(`${pack.questions.length} original word problems ready. Matching PDFs use seed ${pack.seed}.`);
 }
 function safeRender(){try{keyVisible=false;render()}catch(e){message(e instanceof Error?e.message:'Invalid settings',true)}}
 for(const el of [mode,level,quantity,paper])el.addEventListener('change',safeRender);
 seed.addEventListener('change',safeRender);
 toggle.addEventListener('click',()=>{
  try{keyVisible=!keyVisible;render()}catch(e){message(e instanceof Error?e.message:'Unable to update',true)}
 });
 root.querySelector<HTMLButtonElement>('[data-story-new]')!.addEventListener('click',()=>{
  const n=new Uint32Array(1);crypto.getRandomValues(n);seed.value=String(n[0]);safeRender();
 });
 root.querySelector<HTMLButtonElement>('[data-story-share]')!.addEventListener('click',async()=>{
  try{
   const s=current();
   const url=new URL(window.location.pathname,window.location.origin);
   url.searchParams.set('wp_seed',String(s.seed));
   url.searchParams.set('wp_mode',s.mode);
   url.searchParams.set('wp_level',s.level);
   url.searchParams.set('wp_count',String(s.questions.length));
   url.searchParams.set('wp_paper',paper.value);
   await navigator.clipboard.writeText(url.toString());
   message('Reproducible settings URL copied. Student answers are not included.');
  }catch(e){message(e instanceof Error?'Copy failed: '+e.message:'Copy failed',true)}
 });
 for(const edition of ['questions','answers','steps'] as const){
  const button=root.querySelector<HTMLButtonElement>(`[data-story-download="${edition}"]`)!;
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    const s=current();
    message('Generating '+edition+' PDF in this browser...');
    const bytes=await createStoryPdf(s,edition,paper.value as StoryPaper);
    const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
    const a=document.createElement('a');a.href=url;
    a.download=`math-word-problems-wp1-${s.seed}-${s.mode}-${s.level}-${s.questions.length}-${paper.value.toLowerCase()}-${edition}.pdf`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    message(`Downloaded matching ${edition} PDF (${s.questions.length} questions, ${paper.value}).`);
   }catch(e){message(e instanceof Error?'PDF failed: '+e.message:'PDF generation failed',true)}
   finally{button.disabled=false;}
  });
 }
 // pageshow occurs after browser session-history form restoration; always
 // reapply a valid shared URL and render its reproducible problems there.
 if(hasSharedSettings)window.addEventListener('pageshow',()=>{
  restoreSettings();
  try{keyVisible=false;render()}catch(e){message(e instanceof Error?e.message:'Unable to restore shared worksheet',true)}
 });
 try{render()}catch(e){message(e instanceof Error?e.message:'Unable to initialize stories',true)}
}
export function initWordProblemWorkspaces(){
 document.querySelectorAll<HTMLElement>('[data-story-workspace]').forEach(init);
}
initWordProblemWorkspaces();
