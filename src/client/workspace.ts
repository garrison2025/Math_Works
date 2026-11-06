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
import {createDecimalDivisionPack,type DecimalDivisionDivisor,type DecimalDivisionPrecision} from '../lib/decimal-division';
import {createDecimalDivisionPdf} from '../lib/decimal-division-pdf';
import {createDecimalAddSubPack,type DecimalAddSubOperation,type DecimalAddSubPrecision,type DecimalAddSubRegrouping,type DecimalAddSubTopic} from '../lib/decimal-add-sub';
import {createDecimalAddSubPdf} from '../lib/decimal-add-sub-pdf';
import {createFractionDecimalPack,type ConversionDirection,type ConversionPrecision} from '../lib/fraction-decimal-conversion';
import {createFractionDecimalPdf} from '../lib/fraction-decimal-conversion-pdf';
import {createMultDivisionPack,type MultDivisionMode,type AreaFactors,type MultDivisionTopic} from '../lib/multiplication-division-practice';
import {createMultDivisionPdf} from '../lib/multiplication-division-practice-pdf';
import {makeFractionStrips,type FractionStripSet} from '../lib/fraction-strips';
import {createFractionStripsPdf} from '../lib/fraction-strips-pdf';
import {createDivisionStoryPack,type DivisionStoryMode} from '../lib/division-word-problems';
import {createDivisionStoryPdf} from '../lib/division-word-problems-pdf';
import {createInequalityPracticePack,type InequalityPracticeMode} from '../lib/inequality-practice';
import {createCircleAreaPack,type CircleAreaMode} from '../lib/circle-area-practice';
import {createR74PracticePdf} from '../lib/r74-practice-pdf';
import {createTrianglePack,type TriangleMode} from '../lib/triangle-inequality-pack';
import {createCompositePack,type CompositeMode} from '../lib/composite-area-pack';
import {createR75GeometryPdf} from '../lib/r75-geometry-pdf';
import {createCylinderPack,type CylinderMode} from '../lib/cylinder-pack';
import {createCylinderPdf} from '../lib/cylinder-pdf';
import {createDotPlotPack,type DotPlotMode} from '../lib/statistical-dot-plot';
import {createDotPlotPdf} from '../lib/statistical-dot-plot-pdf';
import {createSolidPack,type SolidNetMode} from '../lib/prism-pyramid-pack';
import {createSolidPdf} from '../lib/prism-pyramid-pdf';
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
 // R67 decimal division is an explicit opt-in extension to integer facts.
 // Do not change generator v18, current preview, its answer map or share URL.
 if(topic==='division-worksheets'){
  const divisorSelect=root.querySelector<HTMLSelectElement>('[data-decimal-divisor]');
  const precisionSelect=root.querySelector<HTMLSelectElement>('[data-decimal-precision]');
  for(const mode of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="decimal-division-'+mode+'"]');
   if(!button||!divisorSelect||!precisionSelect)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const params=state(),divisorMode=divisorSelect.value as DecimalDivisionDivisor;
     const precisionMode=precisionSelect.value as DecimalDivisionPrecision;
     inform('Preparing exact decimal division '+mode+' PDF...');
     const pack=createDecimalDivisionPack('division-worksheets',params.n,params.q,params.difficulty,divisorMode,precisionMode);
     const bytes=await createDecimalDivisionPdf(pack,mode,paper.value as Paper,
      writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const link=document.createElement('a');link.href=url;
     link.download='decimal-division-'+mode+'-'+divisorMode+'-'+precisionMode+
      '-seed'+params.n+'-'+params.difficulty+'-'+params.q+'-'+paper.value.toLowerCase()+'-r67.pdf';
     document.body.append(link);link.click();link.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('Exact decimal division '+mode+' PDF downloaded. Repeat the seed and selectors to reproduce; the original integer division worksheet is unchanged.');
    }catch(e){inform(e instanceof Error?'Decimal division PDF failed: '+e.message:'Decimal division PDF failed.',true);}
    finally{button.disabled=false;}
   });
  }
 }

 // R68: opt-in vertically aligned exact decimal addition/subtraction packs.
 // Never mutate the v18 integer generator, original answer map or share link.
 if(topic==='addition-worksheets'||topic==='subtraction-worksheets'||topic==='mixed-addition-subtraction-worksheets'){
  const operationSelect=root.querySelector<HTMLSelectElement>('[data-decimal-add-sub-operation]');
  const placesSelect=root.querySelector<HTMLSelectElement>('[data-decimal-add-sub-places]');
  const regroupSelect=root.querySelector<HTMLSelectElement>('[data-decimal-add-sub-regrouping]');
  for(const output of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="decimal-add-sub-'+output+'"]');
   if(!button||!operationSelect||!placesSelect||!regroupSelect)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const params=state(),operation=operationSelect.value as DecimalAddSubOperation;
     const precision=placesSelect.value as DecimalAddSubPrecision;
     const regrouping=regroupSelect.value as DecimalAddSubRegrouping;
     inform('Preparing exact decimal '+output+' with vertically aligned place values...');
     const pack=createDecimalAddSubPack(topic as DecimalAddSubTopic,params.n,params.q,
      params.difficulty,operation,precision,regrouping);
     const bytes=await createDecimalAddSubPdf(pack,output,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;
     a.download='decimal-column-'+topic+'-'+operation+'-'+precision+'-'+regrouping+'-'+output+
      '-seed'+params.n+'-'+params.difficulty+'-'+params.q+'-'+paper.value.toLowerCase()+'-r68.pdf';
     document.body.append(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('R68 decimal '+output+' PDF downloaded. Same seed and selectors reproduce the same sheet; original integer practice unchanged.');
    }catch(e){
     inform(e instanceof Error?'R68 decimal PDF failed: '+e.message:'R68 decimal PDF failed.',true);
    }finally{button.disabled=false;}
   });
  }
 }

 // R69 opt-in conversion PDF packs. Original v18 fraction arithmetic and
 // its Copy reproducible link remain completely unchanged.
 if(topic==='fractions-worksheets'){
  const directionInput=root.querySelector<HTMLSelectElement>('[data-conversion-direction]');
  const precisionInput=root.querySelector<HTMLSelectElement>('[data-conversion-precision]');
  for(const mode of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="conversion-'+mode+'"]');
   if(!button||!directionInput||!precisionInput)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const params=state(),direction=directionInput.value as ConversionDirection;
     const precision=precisionInput.value as ConversionPrecision;
     inform('Verifying exact fraction/decimal '+mode+' PDF ...');
     const pack=createFractionDecimalPack('fractions-worksheets',params.n,params.q,
      params.difficulty,direction,precision);
     const bytes=await createFractionDecimalPdf(pack,mode,paper.value as Paper,
      writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const download=document.createElement('a');
     download.href=url;download.download='fraction-decimal-conversion-'+mode+'-'+direction+
      '-'+precision+'-seed'+params.n+'-'+params.difficulty+'-'+params.q+
      '-'+paper.value.toLowerCase()+'-r69.pdf';
     document.body.append(download);download.click();download.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('Exact conversion '+mode+' PDF downloaded. Keep the seed, topic, direction and precision to reproduce the set.');
    }catch(e){
     inform(e instanceof Error?'Conversion PDF failed: '+e.message:'Conversion PDF failed.',true);
    }finally{button.disabled=false;}
   });
  }
 }

 // R71 actual fact families, mixed multiplication/division and partitioned
 // area-model PDFs, separately configured to preserve v18 share identity.
 if(topic==='multiplication-worksheets'||topic==='division-worksheets'){
  const modeSelect=root.querySelector<HTMLSelectElement>('[data-multdiv-mode]');
  const factorsSelect=root.querySelector<HTMLSelectElement>('[data-multdiv-factors]');
  for(const mode of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="multdiv-'+mode+'"]');
   if(!button||!modeSelect)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const params=state(),practice=modeSelect.value as MultDivisionMode;
     const factors=(factorsSelect?.value||'mixed') as AreaFactors;
     inform('Verifying and preparing '+practice+' '+mode+' PDF...');
     const pack=createMultDivisionPack(topic as MultDivisionTopic,params.n,params.q,
      params.difficulty,practice,factors);
     const bytes=await createMultDivisionPdf(pack,mode,paper.value as Paper);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const download=document.createElement('a');download.href=url;
     download.download='math-multiply-divide-'+practice+'-'+factors+'-'+mode+
      '-seed'+params.n+'-'+params.difficulty+'-'+params.q+'-'+paper.value.toLowerCase()+'-r71.pdf';
     document.body.append(download);download.click();download.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform(practice+' '+mode+' PDF downloaded. Use the same seed and options to recreate teacher/student sheets. Original v18 worksheet unchanged.');
    }catch(e){
     inform(e instanceof Error?'Multiplication/division PDF failed: '+e.message:'Multiplication/division PDF failed.',true);
    }finally{button.disabled=false;}
   });
  }
 }

 // R72 genuine one-page vector fraction strips: fixed chart, not seeded
 // exercises. Paper type and denominator-set choice control PDF identity.
 if(topic==='fractions-worksheets'){
  const setInput=root.querySelector<HTMLSelectElement>('[data-fraction-strip-set]');
  for(const mode of ['blank','labeled'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="fraction-strip-'+mode+'"]');
   if(!setInput||!button)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const denominatorSet=setInput.value as FractionStripSet;
     inform('Preparing exact unit-fraction '+mode+' strip PDF ...');
     const pack=makeFractionStrips(denominatorSet,mode);
     const bytes=await createFractionStripsPdf(pack,paper.value as Paper);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const download=document.createElement('a');download.href=url;
     download.download='fraction-strips-'+denominatorSet+'-'+mode+'-'+paper.value.toLowerCase()+'-r72.pdf';
     document.body.append(download);download.click();download.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('Printable '+mode+' fraction strips PDF downloaded. This is a fixed reference chart: worksheet seed and number of questions do not affect it.');
    }catch(e){inform(e instanceof Error?'Fraction strips PDF failed: '+e.message:'Fraction strips PDF failed.',true);}
    finally{button.disabled=false;}
   });
  }
 }
 // R73: contextual division word problem sheets; preserve all original v18
 // division-fact generator answers, problem preview and share-link identity.
 if(topic==='division-worksheets'){
  const storyMode=root.querySelector<HTMLSelectElement>('[data-division-story-mode]');
  for(const type of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="division-story-'+type+'"]');
   if(!button||!storyMode)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const stateNow=state(),mode=storyMode.value as DivisionStoryMode;
     inform('Preparing exact division story '+type+' PDF...');
     const pack=createDivisionStoryPack('division-worksheets',stateNow.n,
      stateNow.q,stateNow.difficulty,mode);
     const pdf=await createDivisionStoryPdf(pack,type,paper.value as Paper,
      writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(pdf)],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;
     a.download='division-word-problems-'+mode+'-'+type+'-seed'+stateNow.n+
      '-'+stateNow.difficulty+'-'+stateNow.q+'-'+paper.value.toLowerCase()+'-r73.pdf';
     document.body.append(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('Contextual division '+type+' PDF downloaded. Original division facts are unchanged.');
    }catch(e){inform(e instanceof Error?'Division word problems PDF failed: '+e.message:'Division word problems PDF failed.',true);}
    finally{button.disabled=false;}
   });
  }
 }
 // R74 opt-in inequality translation / compound AND-OR practice.
 if(topic==='inequalities-worksheets'){
  const select=root.querySelector<HTMLSelectElement>('[data-r74-inequality-mode]');
  for(const mode of ['questions','answers','steps'] as const){
   const b=root.querySelector<HTMLButtonElement>('[data-action="r74-inequality-'+mode+'"]');
   if(!b||!select)continue;
   b.addEventListener('click',async()=>{
    b.disabled=true;
    try{
     const s=state(),skill=select.value as InequalityPracticeMode;
     inform('Verifying compound inequality answers and preparing '+mode+' PDF...');
     const pack=createInequalityPracticePack('inequalities-worksheets',s.n,s.q,s.difficulty,skill);
     const pdf=await createR74PracticePdf(pack,mode,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(pdf)],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;
     a.download='inequalities-'+skill+'-'+mode+'-seed'+s.n+'-'+s.difficulty+'-'+s.q+'-'+paper.value.toLowerCase()+'-r74.pdf';
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('R74 '+skill+' '+mode+' PDF downloaded. Original v18 practice is unchanged.');
    }catch(e){inform(e instanceof Error?'Inequality extension PDF failed: '+e.message:'Inequality extension PDF failed.',true);}
    finally{b.disabled=false;}
   });
  }
 }
 // R74 opt-in full-circle, semicircle, quarter-circle and minor sector area.
 if(topic==='area-worksheets'){
  const select=root.querySelector<HTMLSelectElement>('[data-r74-circle-mode]');
  for(const mode of ['questions','answers','steps'] as const){
   const b=root.querySelector<HTMLButtonElement>('[data-action="r74-circle-'+mode+'"]');
   if(!b||!select)continue;
   b.addEventListener('click',async()=>{
    b.disabled=true;
    try{
     const s=state(),skill=select.value as CircleAreaMode;
     inform('Verifying reduced exact pi coefficients and preparing '+mode+' PDF...');
     const pack=createCircleAreaPack('area-worksheets',s.n,s.q,s.difficulty,skill);
     const pdf=await createR74PracticePdf(pack,mode,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(pdf)],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;
     a.download='circle-area-'+skill+'-'+mode+'-seed'+s.n+'-'+s.difficulty+'-'+s.q+'-'+paper.value.toLowerCase()+'-r74.pdf';
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('R74 '+skill+' '+mode+' PDF downloaded. Original rectangle/square practice is unchanged.');
    }catch(e){inform(e instanceof Error?'Circle extension PDF failed: '+e.message:'Circle extension PDF failed.',true);}
    finally{b.disabled=false;}
   });
  }
 }
 // R75 strict triangle geometry side feasibility and exact integer range/count.
 if(topic==='inequalities-worksheets'){
  const selected=root.querySelector<HTMLSelectElement>('[data-r75-triangle-mode]');
  for(const output of ['questions','answers','steps'] as const){
   const b=root.querySelector<HTMLButtonElement>('[data-action="r75-triangle-'+output+'"]');
   if(!b||!selected)continue;
   b.addEventListener('click',async()=>{
    b.disabled=true;
    try{
     const s=state(),mode=selected.value as TriangleMode;
     inform('Verifying triangle side inequalities and preparing '+output+' PDF...');
     const pack=createTrianglePack('inequalities-worksheets',s.n,s.q,s.difficulty,mode);
     const bytes=await createR75GeometryPdf(pack,output,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;
     a.download='triangle-inequality-'+mode+'-'+output+'-seed'+s.n+'-'+s.difficulty+'-'+s.q+'-'+paper.value.toLowerCase()+'-r75.pdf';
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('R75 triangle '+mode+' '+output+' PDF downloaded. Original v18 worksheet and share link unchanged.');
    }catch(e){inform(e instanceof Error?'Triangle theorem PDF failed: '+e.message:'Triangle theorem PDF failed.',true);}
    finally{b.disabled=false;}
   });
  }
 }
 // R75 a genuine L polygon and two mathematically equivalent decomposition methods.
 if(topic==='area-worksheets'){
  const selected=root.querySelector<HTMLSelectElement>('[data-r75-composite-mode]');
  for(const output of ['questions','answers','steps'] as const){
   const b=root.querySelector<HTMLButtonElement>('[data-action="r75-composite-'+output+'"]');
   if(!b||!selected)continue;
   b.addEventListener('click',async()=>{
    b.disabled=true;
    try{
     const s=state(),mode=selected.value as CompositeMode;
     inform('Verifying L-shaped dimensions and preparing '+output+' PDF...');
     const pack=createCompositePack('area-worksheets',s.n,s.q,s.difficulty,mode);
     const bytes=await createR75GeometryPdf(pack,output,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;
     a.download='composite-L-area-'+mode+'-'+output+'-seed'+s.n+'-'+s.difficulty+'-'+s.q+'-'+paper.value.toLowerCase()+'-r75.pdf';
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('R75 composite '+mode+' '+output+' PDF downloaded with matching L geometry and teacher keys.');
    }catch(e){inform(e instanceof Error?'Composite area PDF failed: '+e.message:'Composite area PDF failed.',true);}
    finally{b.disabled=false;}
   });
  }
 }
 // R76: exact closed or lateral cylinder area, volume and combined PDFs.
 if(topic==='surface-area-worksheets'){
  const selected=root.querySelector<HTMLSelectElement>('[data-r76-cylinder-mode]');
  for(const output of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="r76-cylinder-'+output+'"]');
   if(!button||!selected)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const now=state(),mode=selected.value as CylinderMode;
     inform('Checking cylinder dimensions and exact pi formulas for '+output+'...');
     const pack=createCylinderPack('surface-area-worksheets',now.n,now.q,now.difficulty,mode);
     const bytes=await createCylinderPdf(pack,output,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const a=document.createElement('a');
     a.href=url;
     a.download='cylinder-'+mode+'-'+output+'-seed'+now.n+'-'+now.difficulty+'-'+now.q+'-'+paper.value.toLowerCase()+'-r76.pdf';
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('R76 cylinder '+mode+' '+output+' PDF ready with exact pi and proportional net.');
    }catch(e){inform(e instanceof Error?'Cylinder PDF failed: '+e.message:'Cylinder PDF failed.',true);}
    finally{button.disabled=false;}
   });
  }
 }
 // R77 genuine statistical frequency dot plots, separately from number-recognition dots.
 if(topic==='mean-median-mode-range-worksheets'){
  const selected=root.querySelector<HTMLSelectElement>('[data-r77-dotplot-mode]');
  for(const output of ['questions','answers','steps'] as const){
   const b=root.querySelector<HTMLButtonElement>('[data-action="r77-dotplot-'+output+'"]');
   if(!b||!selected)continue;
   b.addEventListener('click',async()=>{
    b.disabled=true;
    try{
     const s=state(),task=selected.value as DotPlotMode;
     inform('Verifying exact observed frequencies and preparing '+output+' dot plot PDF...');
     const pack=createDotPlotPack('mean-median-mode-range-worksheets',s.n,s.q,s.difficulty,task);
     const bytes=await createDotPlotPdf(pack,output,paper.value as Paper,writingRoom.value as WritingRoom);
     const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
     const a=document.createElement('a');a.href=url;
     a.download='statistical-dot-plots-'+task+'-'+output+'-seed'+s.n+'-'+s.difficulty+'-'+s.q+'-'+paper.value.toLowerCase()+'-r77.pdf';
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     inform('R77 statistical dot plot '+task+' '+output+' PDF downloaded. Original statistics and share URL unchanged.');
    }catch(e){inform(e instanceof Error?'Frequency dot plot PDF failed: '+e.message:'Frequency dot plot PDF failed.',true);}
    finally{b.disabled=false;}
   });
  }
 }
 // R78 a true prism/pyramid net PDF skill without modifying original v18 generators.
 if(topic==='surface-area-worksheets'||topic==='volume-of-rectangular-prisms-worksheets'){
  const modeField=root.querySelector<HTMLSelectElement>('[data-r78-solid-mode]');
  for(const output of ['questions','answers','steps'] as const){
   const button=root.querySelector<HTMLButtonElement>('[data-action="r78-solids-'+output+'"]');
   if(!button||!modeField)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
     const s=state(),mode=modeField.value as SolidNetMode;
     inform('Checking prism and pyramid net measurements for '+output+'...');
     const pack=createSolidPack(topic,s.n,s.q,s.difficulty,mode);
     const data=await createSolidPdf(pack,output,paper.value as Paper,writingRoom.value as WritingRoom);
     const href=URL.createObjectURL(new Blob([new Uint8Array(data)],{type:'application/pdf'}));
     const link=document.createElement('a');link.href=href;
     link.download='true-solid-net-'+mode+'-'+output+'-seed'+s.n+'-'+s.difficulty+'-'+s.q+'-'+paper.value.toLowerCase()+'-r78.pdf';
     document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),60000);
     inform('R78 exact '+mode+' '+output+' PDF downloaded. Original v18 worksheet and share URL unchanged.');
    }catch(error){
     inform(error instanceof Error?'Prism/pyramid PDF failed: '+error.message:'Prism/pyramid PDF failed.',true);
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
