import {makeWorksheet,type Difficulty,type Worksheet,GENERATOR_VERSION} from '../lib/math';
import {diagramSVG} from '../lib/diagram';
import {titleFor} from '../lib/site';
import {createWorksheetPdf,createBlankProtractorPdf,createPrinterCalibrationPdf,type PdfMode,type Paper} from '../lib/pdf';
import {checkPrintScale} from '../lib/print-calibration';
import {createMultiplicationGridPdf,type MultiplicationGridMode} from '../lib/multiplication-grid';
import {createEquationPack,type EquationTopic,type EquationNumberType} from '../lib/equation-packs';
import {createEquationPackPdf,type EquationPdfMode} from '../lib/equation-pack-pdf';
import {createFractionLinePack,type FractionLineTask,type FractionLineRange} from '../lib/fraction-number-lines';
import {createFractionLinePdf} from '../lib/fraction-number-line-pdf';
import type {WritingRoom} from '../lib/writing-room';
import {hasVerifiedSteps} from '../lib/capabilities';
import {normalizeTopicOptions,topicOptionsFor,maxQuantityForTopic,type TopicOptions} from '../lib/topic-options';
import {buildWorksheetLink,parseWorksheetLink} from '../lib/worksheet-link';
import {checkExactNumber,supportsExactNumber} from '../lib/answer-check';
import {fractionLayoutFor,fractionMarkup} from '../lib/fraction-layout';
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function setup(root:HTMLElement){
 const topic=root.dataset.topic||'';
 const stepsEnabled=hasVerifiedSteps(topic);
 const topicDefs=topicOptionsFor(topic);
 const field=<T extends HTMLElement>(name:string)=>root.querySelector<T>(`[data-field="${name}"]`)!;
 const difficulty=field<HTMLSelectElement>('difficulty'),quantity=field<HTMLSelectElement>('quantity'),paper=field<HTMLSelectElement>('paper'),writingRoom=field<HTMLSelectElement>('writing-room'),seedInput=field<HTMLInputElement>('seed');
 const status=root.querySelector<HTMLElement>('[data-status]')!;
 const list=root.querySelector<HTMLElement>('[data-problems]')!;
 const summary=root.querySelector<HTMLElement>('[data-summary]')!;
 const sheetCaption=root.querySelector<HTMLElement>('[data-sheet-caption]')!;
 const sheetFooter=root.querySelector<HTMLElement>('[data-sheet-footer]')!;
 let mode:PdfMode='questions';let worksheet:Worksheet|undefined;let practiceMode=false;
 function canPractice(){return !!worksheet&&topic!=='decimal-place-value-worksheets'&&worksheet.problems.every(p=>supportsExactNumber(p.expectedAnswer));}
 function updatePracticeUI(){
  const available=canPractice(),button=root.querySelector<HTMLButtonElement>('[data-action="practice"]')!;
  if(!available)practiceMode=false;
  button.hidden=!available;button.setAttribute('aria-pressed',String(practiceMode&&mode==='questions'));
  const controls=root.querySelector<HTMLElement>('[data-practice-actions]')!;
  controls.hidden=!(available&&practiceMode&&mode==='questions');
  if(!controls.hidden)root.querySelector<HTMLElement>('[data-practice-summary]')!.textContent='Enter answers; nothing is saved or sent.';
 }
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
 function render(){if(!worksheet)return;const s=worksheet;const diagram=s.problems.some(p=>!!p.diagramSpec);list.classList.toggle('with-diagrams',diagram);list.innerHTML=s.problems.map((p,i)=>`<div class="problem"><div class="no">${String(i+1).padStart(2,'0')}</div><div class="q">${esc(p.payload.question)}</div>${mode==='questions'?fractionMarkup(fractionLayoutFor(topic,p.payload.question)):''}${mode==='questions'&&p.diagramSpec?diagramSVG(p.diagramSpec):''}${mode==='answers'?`<div class="answer-text"><strong>Answer:</strong> ${esc(p.expectedAnswer)}</div>${p.diagramSpec&&(['numberline','box-practice','function-table'].includes(p.diagramSpec.kind)||(p.diagramSpec.kind==='linear-function'&&p.diagramSpec.labels?.includes('draw'))||(p.diagramSpec.kind==='scatter'&&p.diagramSpec.labels?.includes('plot'))||(p.diagramSpec.kind==='right-triangle'&&p.diagramSpec.labels?.some(s=>s.startsWith('missing-'))))?diagramSVG(p.diagramSpec,true):''}`:''}${mode==='steps'?`<div class="answer-text"><strong>Answer:</strong> ${esc(p.expectedAnswer)}</div><ol class="steps">${p.solutionSteps.map(line=>`<li>${esc(line)}</li>`).join('')}</ol>`:''}</div>`).join('');
  if(practiceMode&&mode==='questions'&&canPractice()){
   const cards=list.querySelectorAll<HTMLElement>('.problem');
   s.problems.forEach((_,i)=>{
    const wrap=document.createElement('div');wrap.className='practice-answer';
    const label=document.createElement('label');label.textContent='Your answer';label.htmlFor=`practice-answer-${i}`;
    const input=document.createElement('input');input.type='text';input.id=label.htmlFor;input.autocomplete='off';
    input.inputMode='decimal';input.maxLength=64;input.placeholder='e.g. 3/4';input.dataset.practiceInput=String(i);
    const feedback=document.createElement('small');feedback.dataset.practiceFeedback=String(i);feedback.setAttribute('role','status');
    wrap.append(label,input,feedback);cards[i]?.append(wrap);
   });
  }
  summary.textContent=`${s.problems.length} questions · ${difficulty.value} · ${paper.value}${writingRoom.value==='extra'?' · Extra writing room (PDF only)':''} · Engine v${s.generatorVersion} · Config ${s.optionsHash}`;sheetCaption.textContent=`${mode==='questions'?'Practice worksheet':mode==='answers'?'Answer key':'Worked solutions'} · Sheet ID ${s.seed}`;sheetFooter.textContent=`${mode.toUpperCase()} · Engine v${s.generatorVersion} · Seed ${s.seed} · Config ${s.optionsHash} · ${s.problems.length} questions`;
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  updatePracticeUI();
 }
 function rebuild(){try{limitQuantity();const {n,q,difficulty:d,options}=state();worksheet=makeWorksheet(topic,n,q,d,options);render();setExportReady(true);inform(`${q} matching problems generated locally · Seed ${n} · Config ${worksheet.optionsHash}.`);}catch(e){
   worksheet=undefined;setExportReady(false);
   list.classList.remove('with-diagrams');list.innerHTML='<p class="empty">Enter a valid seed and settings to generate a worksheet. Previously shown questions have been cleared.</p>';
   summary.textContent='Worksheet unavailable';sheetCaption.textContent='Check settings before printing';sheetFooter.textContent='No valid worksheet to export';
   inform(e instanceof Error?e.message:'Could not create worksheet.',true);updatePracticeUI();
  }}
 function randomSeed(){const a=new Uint32Array(1);crypto.getRandomValues(a);seedInput.value=String(a[0]);rebuild();}
 difficulty.addEventListener('change',rebuild);quantity.addEventListener('change',rebuild);seedInput.addEventListener('change',rebuild);paper.addEventListener('change',render);writingRoom.addEventListener('change',render);
 root.querySelectorAll<HTMLSelectElement>('[data-option]').forEach(el=>el.addEventListener('change',rebuild));
 root.querySelector<HTMLButtonElement>('[data-action="regenerate"]')!.addEventListener('click',randomSeed);
 root.querySelector<HTMLButtonElement>('[data-action="practice"]')!.addEventListener('click',()=>{
  if(!canPractice())return;
  practiceMode=!practiceMode;mode='questions';render();
  if(practiceMode)root.querySelector<HTMLInputElement>('[data-practice-input="0"]')?.focus();
 });
 root.querySelector<HTMLButtonElement>('[data-action="check-practice"]')!.addEventListener('click',()=>{
  if(!worksheet||!practiceMode||mode!=='questions'||!canPractice())return;
  let attempted=0,correct=0;
  for(const input of root.querySelectorAll<HTMLInputElement>('[data-practice-input]')){
   const i=Number(input.dataset.practiceInput),value=input.value.trim();
   const feedback=root.querySelector<HTMLElement>(`[data-practice-feedback="${i}"]`)!;
   if(!value){feedback.textContent='Not answered';input.removeAttribute('aria-invalid');continue;}
   attempted++;
   const result=checkExactNumber(worksheet.problems[i].expectedAnswer,value);
   if(result==='correct'){correct++;feedback.textContent='Correct';input.setAttribute('aria-invalid','false');}
   else if(result==='invalid'){feedback.textContent='Use a number, decimal or fraction (such as 3/4).';input.setAttribute('aria-invalid','true');}
   else{feedback.textContent='Not quite — try again.';input.setAttribute('aria-invalid','true');}
  }
  root.querySelector<HTMLElement>('[data-practice-summary]')!.textContent=`${correct} correct / ${attempted} attempted / ${worksheet.problems.length} total. No answers or scores are sent to a server.`;
 });
 root.querySelector<HTMLButtonElement>('[data-action="clear-practice"]')!.addEventListener('click',()=>{
  for(const input of root.querySelectorAll<HTMLInputElement>('[data-practice-input]')){input.value='';input.removeAttribute('aria-invalid');}
  for(const feedback of root.querySelectorAll<HTMLElement>('[data-practice-feedback]'))feedback.textContent='';
  root.querySelector<HTMLElement>('[data-practice-summary]')!.textContent='Responses cleared from this page.';
  root.querySelector<HTMLInputElement>('[data-practice-input="0"]')?.focus();
 });
 root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode==='steps'&&!stepsEnabled)return;mode=b.dataset.mode as PdfMode;render();}));
 root.querySelector<HTMLButtonElement>('[data-action="print"]')!.addEventListener('click',async()=>{
  if(!worksheet)rebuild();if(!worksheet)return;
  // Open the tab synchronously with the click so popup blockers do not race
  // the asynchronous pdf-lib render. Unlike window.print(), this uses the SAME
  // paginated, margin-audited vector PDF as the downloaded worksheet.
  const printButton=root.querySelector<HTMLButtonElement>('[data-action="print"]')!;
  const current=worksheet,currentMode=mode,currentPaper=paper.value as Paper,currentRoom=writingRoom.value as WritingRoom;
  const tab=window.open('','_blank');
  if(tab){tab.document.title='Preparing printable worksheet';tab.document.body.textContent='Preparing your printable PDF…';}
  try{
   printButton.disabled=true;inform('Preparing print-ready PDF…');
   const bytes=await createWorksheetPdf(current,titleFor(topic),currentMode,currentPaper,currentRoom);
   const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
   if(tab&&!tab.closed){tab.location.replace(url);inform('Print-ready PDF opened. In the PDF viewer choose Print, Actual size / 100% (especially for protractors).');}
   else {
    // Browser may block new tabs; always preserve access to the exact same PDF.
    const a=document.createElement('a');a.href=url;
    a.download=`${topic}-v${current.generatorVersion}-${currentMode}-${current.seed}-${current.optionsHash}-${currentPaper.toLowerCase()}${currentMode==='questions'&&currentRoom==='extra'?'-extra-room':''}-print.pdf`;
    document.body.append(a);a.click();a.remove();
    inform('Your browser blocked the print tab, so the print-ready PDF was downloaded instead.');
   }
   setTimeout(()=>URL.revokeObjectURL(url),600000);
  }catch(e){if(tab&&!tab.closed)tab.close();inform(e instanceof Error?`Print-ready PDF failed: ${e.message}`:'Print-ready PDF failed.',true);}
  finally{printButton.disabled=false;}
 });
 const calibrationButton=root.querySelector<HTMLButtonElement>('[data-action="calibration"]')!;
 calibrationButton.addEventListener('click',async()=>{
  const targetPaper=paper.value as Paper;
  try{
   calibrationButton.disabled=true;inform('Creating a one-page vector printer scale check…');
   const bytes=await createPrinterCalibrationPdf(targetPaper);
   const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=`math-worksheet-printer-calibration-${targetPaper.toLowerCase()}.pdf`;
   document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   inform('Printer calibration PDF downloaded. Print at 100% on '+targetPaper+' paper, measure both 100 mm bars, then enter the readings below.');
  }catch(e){inform(e instanceof Error?`Calibration PDF failed: ${e.message}`:'Calibration PDF failed.',true);}
  finally{calibrationButton.disabled=false;}
 });
 root.querySelector<HTMLButtonElement>('[data-action="check-calibration"]')!.addEventListener('click',()=>{
  const h=root.querySelector<HTMLInputElement>('[data-calibration-axis="horizontal"]')!.value;
  const v=root.querySelector<HTMLInputElement>('[data-calibration-axis="vertical"]')!.value;
  const result=checkPrintScale(h,v);
  const output=root.querySelector<HTMLElement>('[data-calibration-result]')!;
  output.textContent=result.message;
  output.classList.toggle('calibration-warning',result.status!=='within-tolerance');
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

 // R64 separate printable 12x12 grid: no seed, no generated problem set,
 // no teacher answer-leak on the blank chart.
 if(topic==='multiplication-tables-worksheets')for(const mode of ['blank','key'] as const){
  const button=root.querySelector<HTMLButtonElement>('[data-action="multiplication-grid-'+mode+'"]');
  if(!button)continue;
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    inform(mode==='blank'?'Preparing a blank 1-12 chart...':'Preparing the complete 1-12 chart key...');
    const bytes=await createMultiplicationGridPdf(paper.value as Paper,mode as MultiplicationGridMode);
    const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
    const a=document.createElement('a');
    a.href=url;a.download='multiplication-table-1-12-'+mode+'-'+paper.value.toLowerCase()+'.pdf';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    inform('Downloaded '+(mode==='blank'?'blank 1-12 multiplication chart':'1-12 multiplication answer chart')+'. It is independent of your randomized practice worksheet.');
   }catch(e){
    inform(e instanceof Error?'Chart PDF failed: '+e.message:'Chart PDF failed.',true);
   }finally{button.disabled=false;}
  });
 }

 // R65 opt-in exact algebra extension. The original v18 integer worksheet
 // and share URL are left untouched: selected pack kind is an explicit
 // separate download configuration, never quietly mixed into live preview.
 if(topic==='one-step-equations-worksheets'||topic==='two-step-equations-worksheets'){
  const kindInput=root.querySelector<HTMLSelectElement>('[data-equation-kind]');
  for(const downloadMode of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="equation-pack-'+downloadMode+'"]');
   if(!button||!kindInput)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const parameters=state();
     const kind=kindInput.value as EquationNumberType;
     inform('Verifying and preparing '+kind+' equation '+downloadMode+' PDF...');
     const pack=createEquationPack(topic as EquationTopic,kind,parameters.n,parameters.q,parameters.difficulty,parameters.options);
     const bytes=await createEquationPackPdf(pack,downloadMode as EquationPdfMode,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const filename=topic+'-'+kind+'-'+downloadMode+'-seed'+parameters.n+'-'+parameters.difficulty+
      '-'+parameters.q+'-'+Object.values(parameters.options).join('-')+'-'+paper.value.toLowerCase()+'-r65.pdf';
     const a=document.createElement('a');a.href=url;a.download=filename;
     document.body.append(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('Exact '+kind+' '+downloadMode+' equation pack downloaded. Same seed, number type, difficulty, question count and equation form reproduce the same pack. Original v18 worksheet unchanged.');
    }catch(e){
     inform(e instanceof Error?'Equation pack failed: '+e.message:'Equation pack failed.',true);
    }finally{button.disabled=false;}
   });
  }
 }
 // R66 exact fraction number-line pack is opt-in and independent of v18.
 // The same seed, question count, difficulty and separate selectors reproduce it.
 if(topic==='number-line-worksheets'||topic==='fractions-worksheets'){
  const taskInput=root.querySelector<HTMLSelectElement>('[data-fraction-line-task]');
  const rangeInput=root.querySelector<HTMLSelectElement>('[data-fraction-line-range]');
  for(const mode of ['questions','answers'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="fraction-line-'+mode+'"]');
   if(!button||!taskInput||!rangeInput)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const settings=state(),task=taskInput.value as FractionLineTask;
     const range=rangeInput.value as FractionLineRange;
     inform('Preparing vector fraction number-line '+mode+'...');
     const pack=createFractionLinePack(topic,settings.n,settings.q,settings.difficulty,task,range);
     const bytes=await createFractionLinePdf(pack,mode,paper.value as Paper);
     const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'}),url=URL.createObjectURL(blob);
     const a=document.createElement('a');a.href=url;
     a.download='fraction-number-line-'+topic+'-'+task+'-'+range+'-'+mode+'-seed'+settings.n+
      '-'+settings.difficulty+'-'+settings.q+'-'+paper.value.toLowerCase()+'-r66.pdf';
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('Fraction number-line '+mode+' downloaded. No changes to your original integer/fraction worksheet.');
    }catch(e){
     inform(e instanceof Error?'Fraction line PDF failed: '+e.message:'Fraction line PDF failed.',true);
    }finally{button.disabled=false;}
   });
  }
 }
 for(const name of ['worksheet','answers','steps']as const){const b=root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!;b.addEventListener('click',async()=>{try{if(name==='steps'&&!stepsEnabled)throw new Error('Worked steps are not verified for this topic. Use the answer key.');if(!worksheet)rebuild();if(!worksheet)return; b.disabled=true;inform('Preparing a vector PDF…');const m:PdfMode=name==='worksheet'?'questions':name;const bytes=await createWorksheetPdf(worksheet,titleFor(topic),m,paper.value as Paper,writingRoom.value as WritingRoom);const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${topic}-v${worksheet.generatorVersion}-${m}-${worksheet.seed}-${worksheet.optionsHash}-${paper.value.toLowerCase()}${m==='questions'&&writingRoom.value==='extra'?'-extra-room':''}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);inform(`${m==='questions'?'Worksheet':m==='answers'?'Answer key':'Worked steps'} PDF downloaded${m==='questions'&&writingRoom.value==='extra'?' with extra pencil lines':''} · Seed ${worksheet.seed} · Config ${worksheet.optionsHash}.`);}catch(e){inform(e instanceof Error?`PDF failed: ${e.message}`:'PDF generation failed.',true);}finally{b.disabled=false;}});}
 root.querySelector<HTMLButtonElement>('[data-action="share"]')?.addEventListener('click',async()=>{
  if(!worksheet)rebuild();if(!worksheet)return;
  const params=state();const url=buildWorksheetLink(window.location.href,topic,{seed:params.n,difficulty:params.difficulty,quantity:params.q,paper:paper.value as Paper,options:params.options,writingRoom:writingRoom.value==='extra'?'extra':undefined});
  try{await navigator.clipboard.writeText(url);inform('Reproducible worksheet link copied. Only your settings are in the URL; no student information.');}
  catch {window.prompt('Copy this worksheet link:',url);inform('Share link prepared; copy it from the dialog.');}
 });
 const loaded=parseWorksheetLink(window.location.href,topic);
 if(loaded.seed!==undefined)seedInput.value=String(loaded.seed);
 if(loaded.difficulty)difficulty.value=loaded.difficulty;
 if(loaded.quantity!==undefined)quantity.value=String(loaded.quantity);
 if(loaded.paper)paper.value=loaded.paper;
 if(loaded.writingRoom)writingRoom.value=loaded.writingRoom;
 for(const def of topicDefs){const value=loaded.options?.[def.key];const el=root.querySelector<HTMLSelectElement>(`[data-option="${def.key}"]`);if(value&&el)el.value=value;}
 rebuild();
 const params=new URL(window.location.href).searchParams;
 if(params.has('seed') && params.get('gv')!==GENERATOR_VERSION){
  inform('This shared link uses an older or unversioned generator. Its original questions may differ after an update. Copy a fresh link to preserve the current version.',true);
 }
}
export function initWorkspaces(){document.querySelectorAll<HTMLElement>('[data-workspace]').forEach(el=>{if(el.dataset.ready)return;el.dataset.ready='true';setup(el);});}
