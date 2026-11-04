import {makeWorksheet,type Difficulty,type Worksheet} from '../lib/math';
import {diagramSVG} from '../lib/diagram';
import {titleFor} from '../lib/site';
import {createWorksheetPdf,type PdfMode,type Paper} from '../lib/pdf';
import {hasVerifiedSteps} from '../lib/capabilities';
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function setup(root:HTMLElement){
 const topic=root.dataset.topic||'';
 const stepsEnabled=hasVerifiedSteps(topic);
 const field=<T extends HTMLElement>(name:string)=>root.querySelector<T>(`[data-field="${name}"]`)!;
 const difficulty=field<HTMLSelectElement>('difficulty'),quantity=field<HTMLSelectElement>('quantity'),paper=field<HTMLSelectElement>('paper'),seedInput=field<HTMLInputElement>('seed');
 const status=root.querySelector<HTMLElement>('[data-status]')!;
 const list=root.querySelector<HTMLElement>('[data-problems]')!;
 const summary=root.querySelector<HTMLElement>('[data-summary]')!;
 const sheetCaption=root.querySelector<HTMLElement>('[data-sheet-caption]')!;
 const sheetFooter=root.querySelector<HTMLElement>('[data-sheet-footer]')!;
 let mode:PdfMode='questions';let worksheet:Worksheet|undefined;
 function inform(message:string,isError=false){status.textContent=message;status.classList.toggle('error',isError);}
 function state(){const n=Number(seedInput.value),q=Number(quantity.value);if(!Number.isSafeInteger(n)||n<0||n>0xffffffff)throw new Error('Seed must be a whole number between 0 and 4294967295.');return {n,q,difficulty:difficulty.value as Difficulty};}
 function render(){if(!worksheet)return;const s=worksheet;const diagram=s.problems.some(p=>!!p.diagramSpec);list.classList.toggle('with-diagrams',diagram);list.innerHTML=s.problems.map((p,i)=>`<div class="problem"><div class="no">${String(i+1).padStart(2,'0')}</div><div class="q">${esc(p.payload.question)}</div>${mode==='questions'&&p.diagramSpec?diagramSVG(p.diagramSpec):''}${mode==='answers'?`<div class="answer-text"><strong>Answer:</strong> ${esc(p.expectedAnswer)}</div>`:''}${mode==='steps'?`<div class="answer-text"><strong>Answer:</strong> ${esc(p.expectedAnswer)}</div><ol class="steps">${p.solutionSteps.map(line=>`<li>${esc(line)}</li>`).join('')}</ol>`:''}</div>`).join('');
  summary.textContent=`${s.problems.length} questions · ${difficulty.value} · ${paper.value}`;sheetCaption.textContent=`${mode==='questions'?'Practice worksheet':mode==='answers'?'Answer key':'Worked solutions'} · Sheet ID ${s.seed}`;sheetFooter.textContent=`${mode.toUpperCase()} · Seed ${s.seed} · ${s.problems.length} questions`;
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 }
 function rebuild(){try{const {n,q,difficulty:d}=state();worksheet=makeWorksheet(topic,n,q,d);render();inform(`${q} matching problems generated locally · Seed ${n}.`);}catch(e){worksheet=undefined;inform(e instanceof Error?e.message:'Could not create worksheet.',true);}}
 function randomSeed(){const a=new Uint32Array(1);crypto.getRandomValues(a);seedInput.value=String(a[0]);rebuild();}
 difficulty.addEventListener('change',rebuild);quantity.addEventListener('change',rebuild);seedInput.addEventListener('change',rebuild);paper.addEventListener('change',render);
 root.querySelector<HTMLButtonElement>('[data-action="regenerate"]')!.addEventListener('click',randomSeed);
 root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode==='steps'&&!stepsEnabled)return;mode=b.dataset.mode as PdfMode;render();}));
 root.querySelector<HTMLButtonElement>('[data-action="print"]')!.addEventListener('click',()=>{
  rebuild();if(!worksheet)return;
  let pageRule=document.getElementById('worksheet-print-page') as HTMLStyleElement|null;
  if(!pageRule){pageRule=document.createElement('style');pageRule.id='worksheet-print-page';document.head.append(pageRule);}
  pageRule.textContent=`@page { size: ${paper.value==='A4'?'A4':'letter'}; margin: 12.7mm; }`;
  inform('Print dialog opened. Use Actual size / 100% for the protractor.');window.print();
 });
 for(const name of ['worksheet','answers','steps']as const){const b=root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!;b.addEventListener('click',async()=>{try{if(name==='steps'&&!stepsEnabled)throw new Error('Worked steps are not verified for this topic. Use the answer key.');if(!worksheet)rebuild();if(!worksheet)return; b.disabled=true;inform('Preparing a vector PDF…');const m:PdfMode=name==='worksheet'?'questions':name;const bytes=await createWorksheetPdf(worksheet,titleFor(topic),m,paper.value as Paper);const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${topic}-${m}-${worksheet.seed}-${paper.value.toLowerCase()}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);inform(`${m==='questions'?'Worksheet':m==='answers'?'Answer key':'Worked steps'} PDF downloaded · Seed ${worksheet.seed}.`);}catch(e){inform(e instanceof Error?`PDF failed: ${e.message}`:'PDF generation failed.',true);}finally{b.disabled=false;}});}
 const url=new URL(window.location.href);const s=url.searchParams.get('seed');if(s&&/^\d+$/.test(s))seedInput.value=s;rebuild();
}
export function initWorkspaces(){document.querySelectorAll<HTMLElement>('[data-workspace]').forEach(el=>{if(el.dataset.ready)return;el.dataset.ready='true';setup(el);});}
