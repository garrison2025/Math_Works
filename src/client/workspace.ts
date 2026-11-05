import {makeWorksheet,type Difficulty,type Worksheet,GENERATOR_VERSION} from '../lib/math';
import {diagramSVG} from '../lib/diagram';
import {titleFor} from '../lib/site';
import {createWorksheetPdf,createBlankProtractorPdf,type PdfMode,type Paper} from '../lib/pdf';
import {hasVerifiedSteps} from '../lib/capabilities';
import {normalizeTopicOptions,topicOptionsFor,maxQuantityForTopic,type TopicOptions} from '../lib/topic-options';
import {buildWorksheetLink,parseWorksheetLink} from '../lib/worksheet-link';
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function setup(root:HTMLElement){
 const topic=root.dataset.topic||'';
 const stepsEnabled=hasVerifiedSteps(topic);
 const topicDefs=topicOptionsFor(topic);
 const field=<T extends HTMLElement>(name:string)=>root.querySelector<T>(`[data-field="${name}"]`)!;
 const difficulty=field<HTMLSelectElement>('difficulty'),quantity=field<HTMLSelectElement>('quantity'),paper=field<HTMLSelectElement>('paper'),seedInput=field<HTMLInputElement>('seed');
 const status=root.querySelector<HTMLElement>('[data-status]')!;
 const list=root.querySelector<HTMLElement>('[data-problems]')!;
 const summary=root.querySelector<HTMLElement>('[data-summary]')!;
 const sheetCaption=root.querySelector<HTMLElement>('[data-sheet-caption]')!;
 const sheetFooter=root.querySelector<HTMLElement>('[data-sheet-footer]')!;
 let mode:PdfMode='questions';let worksheet:Worksheet|undefined;
 function inform(message:string,isError=false){status.textContent=message;status.classList.toggle('error',isError);}
 function state(){
  const n=Number(seedInput.value),q=Number(quantity.value);
  if(seedInput.value.trim()===''||!Number.isSafeInteger(n)||n<0||n>0xffffffff)throw new Error('Seed must be a whole number between 0 and 4294967295.');
  const selected:TopicOptions={};
  for(const def of topicDefs){const el=root.querySelector<HTMLSelectElement>(`[data-option="${def.key}"]`);if(el)selected[def.key]=el.value;}
  return {n,q,difficulty:difficulty.value as Difficulty,options:normalizeTopicOptions(topic,selected)};
 }
 function limitQuantity(){
  const selected:TopicOptions={};
  for(const def of topicDefs){const el=root.querySelector<HTMLSelectElement>(`[data-option="${def.key}"]`);if(el)selected[def.key]=el.value;}
  const maximum=maxQuantityForTopic(topic,selected,difficulty.value as Difficulty);
  for(const opt of quantity.options)opt.disabled=Number(opt.value)>maximum;
  if(Number(quantity.value)>maximum){quantity.value=String([...quantity.options].filter(o=>!o.disabled).at(-1)?.value||4);}
 }

 function setExportReady(ready:boolean){
  for(const action of ['worksheet','answers','print','share','steps']){
   const button=root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
   if(button)button.disabled=!ready||(action==='steps'&&!stepsEnabled);
  }
 }
 function render(){if(!worksheet)return;const s=worksheet;const diagram=s.problems.some(p=>!!p.diagramSpec);list.classList.toggle('with-diagrams',diagram);list.innerHTML=s.problems.map((p,i)=>`<div class="problem"><div class="no">${String(i+1).padStart(2,'0')}</div><div class="q">${esc(p.payload.question)}</div>${mode==='questions'&&p.diagramSpec?diagramSVG(p.diagramSpec):''}${mode==='answers'?`<div class="answer-text"><strong>Answer:</strong> ${esc(p.expectedAnswer)}</div>${p.diagramSpec&&(['numberline','box-practice','function-table'].includes(p.diagramSpec.kind)||(p.diagramSpec.kind==='linear-function'&&p.diagramSpec.labels?.includes('draw'))||(p.diagramSpec.kind==='scatter'&&p.diagramSpec.labels?.includes('plot'))||(p.diagramSpec.kind==='right-triangle'&&p.diagramSpec.labels?.some(s=>s.startsWith('missing-'))))?diagramSVG(p.diagramSpec,true):''}`:''}${mode==='steps'?`<div class="answer-text"><strong>Answer:</strong> ${esc(p.expectedAnswer)}</div><ol class="steps">${p.solutionSteps.map(line=>`<li>${esc(line)}</li>`).join('')}</ol>`:''}</div>`).join('');
  summary.textContent=`${s.problems.length} questions · ${difficulty.value} · ${paper.value} · Engine v${s.generatorVersion} · Config ${s.optionsHash}`;sheetCaption.textContent=`${mode==='questions'?'Practice worksheet':mode==='answers'?'Answer key':'Worked solutions'} · Sheet ID ${s.seed}`;sheetFooter.textContent=`${mode.toUpperCase()} · Engine v${s.generatorVersion} · Seed ${s.seed} · Config ${s.optionsHash} · ${s.problems.length} questions`;
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 }
 function rebuild(){try{limitQuantity();const {n,q,difficulty:d,options}=state();worksheet=makeWorksheet(topic,n,q,d,options);render();setExportReady(true);inform(`${q} matching problems generated locally · Seed ${n} · Config ${worksheet.optionsHash}.`);}catch(e){
   worksheet=undefined;setExportReady(false);
   list.classList.remove('with-diagrams');list.innerHTML='<p class="empty">Enter a valid seed and settings to generate a worksheet. Previously shown questions have been cleared.</p>';
   summary.textContent='Worksheet unavailable';sheetCaption.textContent='Check settings before printing';sheetFooter.textContent='No valid worksheet to export';
   inform(e instanceof Error?e.message:'Could not create worksheet.',true);
  }}
 function randomSeed(){const a=new Uint32Array(1);crypto.getRandomValues(a);seedInput.value=String(a[0]);rebuild();}
 difficulty.addEventListener('change',rebuild);quantity.addEventListener('change',rebuild);seedInput.addEventListener('change',rebuild);paper.addEventListener('change',render);
 root.querySelectorAll<HTMLSelectElement>('[data-option]').forEach(el=>el.addEventListener('change',rebuild));
 root.querySelector<HTMLButtonElement>('[data-action="regenerate"]')!.addEventListener('click',randomSeed);
 root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode==='steps'&&!stepsEnabled)return;mode=b.dataset.mode as PdfMode;render();}));
 root.querySelector<HTMLButtonElement>('[data-action="print"]')!.addEventListener('click',async()=>{
  if(!worksheet)rebuild();if(!worksheet)return;
  // Open the tab synchronously with the click so popup blockers do not race
  // the asynchronous pdf-lib render. Unlike window.print(), this uses the SAME
  // paginated, margin-audited vector PDF as the downloaded worksheet.
  const printButton=root.querySelector<HTMLButtonElement>('[data-action="print"]')!;
  const current=worksheet,currentMode=mode,currentPaper=paper.value as Paper;
  const tab=window.open('','_blank');
  if(tab){tab.document.title='Preparing printable worksheet';tab.document.body.textContent='Preparing your printable PDF…';}
  try{
   printButton.disabled=true;inform('Preparing print-ready PDF…');
   const bytes=await createWorksheetPdf(current,titleFor(topic),currentMode,currentPaper);
   const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
   if(tab&&!tab.closed){tab.location.replace(url);inform('Print-ready PDF opened. In the PDF viewer choose Print, Actual size / 100% (especially for protractors).');}
   else {
    // Browser may block new tabs; always preserve access to the exact same PDF.
    const a=document.createElement('a');a.href=url;
    a.download=`${topic}-v${current.generatorVersion}-${currentMode}-${current.seed}-${current.optionsHash}-${currentPaper.toLowerCase()}-print.pdf`;
    document.body.append(a);a.click();a.remove();
    inform('Your browser blocked the print tab, so the print-ready PDF was downloaded instead.');
   }
   setTimeout(()=>URL.revokeObjectURL(url),600000);
  }catch(e){if(tab&&!tab.closed)tab.close();inform(e instanceof Error?`Print-ready PDF failed: ${e.message}`:'Print-ready PDF failed.',true);}
  finally{printButton.disabled=false;}
 });
 const protractorButton=root.querySelector<HTMLButtonElement>('[data-action="protractor"]');
 if(topic==='printable-protractor'&&protractorButton){protractorButton.addEventListener('click',async()=>{
  try{protractorButton.disabled=true;inform('Preparing the physically calibrated 180° protractor PDF…');
   const bytes=await createBlankProtractorPdf(paper.value as Paper);
   const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'}),url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download=`blank-180-degree-protractor-${paper.value.toLowerCase()}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   inform('Blank protractor downloaded. Print at Actual size (100%) and measure the 50 mm line.');
  }catch(e){inform(e instanceof Error?`Protractor PDF failed: ${e.message}`:'Protractor PDF failed.',true)}finally{protractorButton.disabled=false;}
 });}
 for(const name of ['worksheet','answers','steps']as const){const b=root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!;b.addEventListener('click',async()=>{try{if(name==='steps'&&!stepsEnabled)throw new Error('Worked steps are not verified for this topic. Use the answer key.');if(!worksheet)rebuild();if(!worksheet)return; b.disabled=true;inform('Preparing a vector PDF…');const m:PdfMode=name==='worksheet'?'questions':name;const bytes=await createWorksheetPdf(worksheet,titleFor(topic),m,paper.value as Paper);const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${topic}-v${worksheet.generatorVersion}-${m}-${worksheet.seed}-${worksheet.optionsHash}-${paper.value.toLowerCase()}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);inform(`${m==='questions'?'Worksheet':m==='answers'?'Answer key':'Worked steps'} PDF downloaded · Seed ${worksheet.seed} · Config ${worksheet.optionsHash}.`);}catch(e){inform(e instanceof Error?`PDF failed: ${e.message}`:'PDF generation failed.',true);}finally{b.disabled=false;}});}
 root.querySelector<HTMLButtonElement>('[data-action="share"]')?.addEventListener('click',async()=>{
  if(!worksheet)rebuild();if(!worksheet)return;
  const params=state();const url=buildWorksheetLink(window.location.href,topic,{seed:params.n,difficulty:params.difficulty,quantity:params.q,paper:paper.value as Paper,options:params.options});
  try{await navigator.clipboard.writeText(url);inform('Reproducible worksheet link copied. Only your settings are in the URL; no student information.');}
  catch {window.prompt('Copy this worksheet link:',url);inform('Share link prepared; copy it from the dialog.');}
 });
 const loaded=parseWorksheetLink(window.location.href,topic);
 if(loaded.seed!==undefined)seedInput.value=String(loaded.seed);
 if(loaded.difficulty)difficulty.value=loaded.difficulty;
 if(loaded.quantity!==undefined)quantity.value=String(loaded.quantity);
 if(loaded.paper)paper.value=loaded.paper;
 for(const def of topicDefs){const value=loaded.options?.[def.key];const el=root.querySelector<HTMLSelectElement>(`[data-option="${def.key}"]`);if(value&&el)el.value=value;}
 rebuild();
 const params=new URL(window.location.href).searchParams;
 if(params.has('seed') && params.get('gv')!==GENERATOR_VERSION){
  inform('This shared link uses an older or unversioned generator. Its original questions may differ after an update. Copy a fresh link to preserve the current version.',true);
 }
}
export function initWorkspaces(){document.querySelectorAll<HTMLElement>('[data-workspace]').forEach(el=>{if(el.dataset.ready)return;el.dataset.ready='true';setup(el);});}
