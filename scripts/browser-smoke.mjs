/** R11 Chromium browser QA against the exact Astro SSG bundle produced by CI.
 * Runs locally in GitHub Actions using preinstalled Chrome and playwright-core.
 * No hosted account, API, paid service, or real site mutation is required.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {resolve, join, extname, sep} from 'node:path';
import {chromium} from 'playwright-core';
import {PDFDocument} from 'pdf-lib';

const site=resolve('dist'),out=resolve('qa-artifacts/browser');
if(!existsSync(join(site,'index.html')))throw Error('Build dist/ before running browser QA');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain'};
const server=createServer((req,res)=>{
 try {
  const url=new URL(req.url??'/', 'http://localhost'),requested=decodeURIComponent(url.pathname);
  let path=resolve(site,`.${requested}`);
  if(path!==site&&!path.startsWith(site+sep)){res.writeHead(403);res.end();return;}
  if(existsSync(path)&&statSync(path).isDirectory())path=join(path,'index.html');
  if(!existsSync(path)||!statSync(path).isFile()){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});createReadStream(join(site,'404.html')).pipe(res);return;}
  res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-store'});
  createReadStream(path).pipe(res);
 }catch(error){res.writeHead(400);res.end('Invalid path');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,base=`http://127.0.0.1:${port}`;
const chromeCandidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=chromeCandidates.find(existsSync);
let browser;
const events=[];
async function verifyPdf(download,label,{paper='Letter'}={}){
 const filename=download.suggestedFilename();
 assert.match(filename,/\.pdf$/i,`${label} did not save a PDF`);
 const target=join(out,filename);
 await download.saveAs(target);
 const bytes=readFileSync(target);
 assert.ok(bytes.length>900,`${label} generated an unexpectedly small PDF`);
 const parsed=await PDFDocument.load(bytes);
 assert.ok(parsed.getPageCount()>0,`${label} generated a zero-page PDF`);
 const expectedWidth=paper==='A4'?595.28:612;
 assert.ok(Math.abs(parsed.getPage(0).getWidth()-expectedWidth)<0.1,`${label} paper size incorrect`);
 events.push({kind:'download',label,filename,pages:parsed.getPageCount(),bytes:bytes.length});
 return parsed;
}
try {
 if(!executablePath)throw Error('Chromium/Google Chrome not found on runner; browser QA cannot be marked PASS');
 browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 // Use an isolated context: expected 404 responses must not pollute the asset-error monitor.
 const missingContext=await browser.newContext({viewport:{width:390,height:844}});
 const missingPage=await missingContext.newPage();
 for(const missing of ['word-problems-worksheets','geometry-general-worksheets','not-a-real-worksheet-r81']){
  const response=await missingPage.goto(base+'/'+missing+'/',{waitUntil:'load'});
  assert.equal(response?.status(),404,'Missing/HOLD must return HTTP 404, never homepage 200: '+missing);
  assert.match(await missingPage.locator('h1').innerText(),/worksheet page isn.t available/i);
  assert.equal(await missingPage.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
  assert.equal(await missingPage.locator('link[rel="canonical"]').count(),0);
  assert.equal(await missingPage.locator('[data-workspace]').count(),0);
 }
 await missingPage.screenshot({path:join(out,'r81-404-mobile.png'),fullPage:true});
 await missingContext.close();
 events.push({kind:'404',status:'pass',scope:'two HOLD routes and arbitrary unknown path return distinct HTTP 404 HTML'});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900},permissions:['clipboard-read','clipboard-write']});
 // R42: request-level privacy evidence, including failed local assets. Collect
 // before the very first navigation, not after page loading has finished.
 const httpRequests=[],offsiteRequests=[],badResponses=[];
 context.on('request',request=>{
  if(!/^https?:\/\//i.test(request.url()))return;
  const target=new URL(request.url());
  const item={url:request.url(),method:request.method(),resourceType:request.resourceType()};
  httpRequests.push(item);
  if(target.origin!==base)offsiteRequests.push(item);
 });
 context.on('response',response=>{
  if(response.status()>=400)badResponses.push({url:response.url(),status:response.status()});
 });
 const page=await context.newPage();
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.goto(`${base}/two-step-equations-worksheets/`,{waitUntil:'networkidle'});
 // R36: keyboard users can bypass the repeated masthead; reduced-motion is effective.
 await page.keyboard.press('Tab');
 assert.equal(await page.locator(':focus').getAttribute('href'),'#main-content');
 await page.emulateMedia({reducedMotion:'reduce'});
 const reducedDuration=await page.locator('.btn').first().evaluate(el=>getComputedStyle(el).transitionDuration);
 assert.ok(parseFloat(reducedDuration)<=.001,`Reduced motion not honored: ${reducedDuration}`);
 await page.emulateMedia({reducedMotion:'no-preference'});
 assert.equal(await page.title(),'Two Step Equations Worksheets – Free Printable PDF & Answer Key | Math Worksheet Studio');
 assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 assert.equal(await page.locator('[data-workspace]').count(),1);
 assert.equal(await page.locator('.problem').count(),8);
 const before=await page.locator('.problem .q').first().innerText();
 await page.locator('[data-option="coefficient"]').selectOption('negative');
 const after=await page.locator('.problem .q').first().innerText();
 assert.notEqual(after,before,'Coefficient selection did not regenerate visible questions');
 assert.match(after,/Solve:\s*-[2-5]x/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 assert.match(await page.locator('[data-summary]').innerText(),/A4/);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),0);
 const sheetDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const questions=await verifyPdf(await sheetDownload,'two-step questions',{paper:'A4'});
 const answerDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 const answers=await verifyPdf(await answerDownload,'two-step answers',{paper:'A4'});
 assert.ok(questions.getTitle()?.includes('v18'));
 assert.ok(answers.getTitle()?.includes('v18'));
 await page.locator('[data-action="share"]').click();
 const link=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(link,/gv=18/);assert.match(link,/opt_coefficient=negative/);assert.match(link,/paper=A4/);
 await page.screenshot({path:join(out,'two-step-desktop.png'),fullPage:true});
 events.push({kind:'interaction',name:'desktop controls, answer mode, A4 PDF pair, v18 clipboard link',status:'pass'});
 // R36: prove that print-preview actually opens the already audited PDF renderer,
 // not an independently paginated HTML print layout, and respects answer/A4 mode.
 await page.locator('[data-mode="answers"]').click();
 await page.evaluate(()=>{
  window.__mathR36PrintBlob='';
  window.open=()=>({closed:false,document:{title:'',body:{textContent:''}},location:{replace(url){window.__mathR36PrintBlob=url;}}});
 });
 await page.locator('[data-action="print"]').click();
 await page.waitForFunction(()=>Boolean(window.__mathR36PrintBlob),{timeout:30000});
 const printBytes=Uint8Array.from(await page.evaluate(async()=>{
  const response=await fetch(window.__mathR36PrintBlob);
  if(!response.ok)throw Error('Print-ready PDF blob inaccessible');
  return [...new Uint8Array(await response.arrayBuffer())];
 }));
 const printDoc=await PDFDocument.load(printBytes);
 assert.equal(printDoc.getPage(0).getWidth(),595.28);
 assert.match(printDoc.getTitle()??'',/ - answers - seed /);
 assert.ok(printDoc.getTitle()?.includes('generator v18'));
 await page.locator('[data-mode="questions"]').click();
 events.push({kind:'interaction',name:'R36 print mode uses actual vector PDF, answers view and A4 paper',status:'pass'});
 // R34: local-only answer checker grades exact scalar numbers and resets on regeneration.
 await page.goto(`${base}/addition-worksheets/`,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-action="practice"]').isVisible(),true);
 await page.locator('[data-mode="answers"]').click();
 const firstPracticeAnswer=(await page.locator('.problem .answer-text').first().innerText()).replace(/^Answer:\s*/,'').trim();
 assert.match(firstPracticeAnswer,/^-?\d+(?:\.\d+)?$/);
 await page.locator('[data-mode="questions"]').click();
 await page.locator('[data-action="practice"]').click();
 assert.equal(await page.locator('[data-practice-input]').count(),8);
 await page.locator('[data-practice-input="0"]').fill(firstPracticeAnswer);
 await page.locator('[data-practice-input="1"]').fill('99999999999');
 await page.locator('[data-action="check-practice"]').click();
 assert.match(await page.locator('[data-practice-summary]').innerText(),/1 correct \/ 2 attempted \/ 8 total/);
 assert.equal(await page.locator('[data-practice-feedback="0"]').innerText(),'Correct');
 await page.locator('[data-action="clear-practice"]').click();
 assert.equal(await page.locator('[data-practice-input="0"]').inputValue(),'');
 await page.locator('[data-practice-input="0"]').fill('1/2');
 await page.locator('[data-action="regenerate"]').click();
 assert.equal(await page.locator('[data-practice-input="0"]').inputValue(),'');
 events.push({kind:'interaction',name:'R34 exact answer entry, feedback and reset',status:'pass'});
 // R26: four-operation precedence and powers use the same real downloadable PDF.
 await page.goto(`${base}/order-of-operations-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="skill"]').selectOption('powers');
 await page.locator('[data-option="grouping"]').selectOption('parentheses');
 const orderPrompt=await page.locator('.problem .q').first().innerText();
 assert.match(orderPrompt,/^\(\d+ \+ \d+\)² − \d+ = ____$/);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),0);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const orderD=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const orderPDF=await verifyPdf(await orderD,'R26 exponent precedence',{paper:'A4'});
 assert.match(orderPDF.getTitle()??'',/v18/);
 await page.locator('[data-action="share"]').click();
 const orderLink=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(orderLink,/opt_skill=powers/);assert.match(orderLink,/opt_grouping=parentheses/);
 await page.locator('[data-option="skill"]').selectOption('division');
 await page.locator('[data-option="grouping"]').selectOption('no-parentheses');
 assert.match(await page.locator('.problem .q').first().innerText(),/ ÷ /);
 events.push({kind:'interaction',name:'R26 exponent / division controls, masked answers and A4 worksheet PDF',status:'pass'});


 // R23: percentage-of-amount and percent-change tasks must be distinct and keep matching PDF identity.
 await page.goto(`${base}/percentages-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="direction"]').selectOption('percent-of-number');
 const percentOfQ=await page.locator('.problem .q').first().innerText();
 assert.match(percentOfQ,/^Find \d+% of \d+\.$/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const percentQDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const percentQuestions=await verifyPdf(await percentQDownload,'R23 percent-of-number questions',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 const percentADownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 const percentAnswers=await verifyPdf(await percentADownload,'R23 percent-of-number answers',{paper:'A4'});
 assert.ok(percentQuestions.getTitle()?.includes('v18')&&percentAnswers.getTitle()?.includes('v18'));
 await page.locator('[data-option="direction"]').selectOption('percent-change');
 assert.match(await page.locator('.problem .q').first().innerText(),/^Find the percentage (increase|decrease) from \d+ to \d+\.$/);
 await page.locator('[data-mode="questions"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),0);
 await page.locator('[data-action="share"]').click();
 const pctLink=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(pctLink,/gv=18/);assert.match(pctLink,/opt_direction=percent-change/);
 events.push({kind:'interaction',name:'R23 percentage of number and percent change options, A4 practice/answer PDFs, versioned share link',status:'pass'});

 // R25: negative exponents must survive from page controls to A4 PDF and link.
 await page.goto(`${base}/scientific-notation-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="direction"]').selectOption('to-standard');
 await page.locator('[data-option="exponentSign"]').selectOption('negative');
 await page.locator('[data-option="significantDigits"]').selectOption('4');
 const notationQ=await page.locator('.problem .q').first().innerText();
 assert.match(notationQ,/10\^-\d+ in standard form/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const notationDl=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const notationPdf=await verifyPdf(await notationDl,'R25 scientific notation negative-exponent practice',{paper:'A4'});
 assert.match(notationPdf.getTitle()??'',/v18/);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-action="share"]').click();
 const notationLink=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(notationLink,/opt_exponentSign=negative/);
 assert.match(notationLink,/opt_significantDigits=4/);
 events.push({kind:'interaction',name:'R25 negative scientific exponents, four significant figures, A4 practice PDF and sharing',status:'pass'});

 // R45: the exclusive trapezoid option must affect real browser questions,
 // survive a share-link round trip, and generate a real downloadable PDF.
 await page.goto(`${base}/area-of-trapezoids-worksheets/`,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-option="baseRelation"]').inputValue(),'inclusive');
 assert.equal(await page.locator('section[aria-label="Trapezoid definition choices"]').count(),1);
 const defaultText=await page.locator('.problem .q').allInnerTexts();
 await page.locator('[data-option="baseRelation"]').selectOption('unequal');
 const exclusiveTexts=await page.locator('.problem .q').allInnerTexts();
 assert.equal(exclusiveTexts.length,8);
 for(const question of exclusiveTexts){
  const m=question.match(/bases (\d+), (\d+)/);
  assert.ok(m,`Unparseable exclusive trapezoid problem: ${question}`);
  assert.notEqual(m[1],m[2],`Exclusive setting generated equal bases: ${question}`);
 }
 await page.locator('[data-action="share"]').click();
 const exclusiveLink=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(exclusiveLink,/opt_baseRelation=unequal/);
 const exclusiveDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await exclusiveDownload,'R45 unequal trapezoid bases PDF');
 await page.goto(exclusiveLink,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-option="baseRelation"]').inputValue(),'unequal');
 assert.deepEqual(await page.locator('.problem .q').allInnerTexts(),exclusiveTexts,
  'Share-link round trip changed the exclusive trapezoid questions');
 assert.equal(defaultText.length,8);
 events.push({kind:'interaction',name:'R45 inclusive/exclusive trapezoid curriculum selector, 8 browser questions, share link, real PDF',status:'pass'});
 // R39: the plain-text question remains readable and display fractions are stacked.
 await page.goto(`${base}/adding-unlike-fractions-worksheets/`,{waitUntil:'networkidle'});
 assert.match(await page.locator('.problem .q').first().innerText(),/\d+\/\d+ \+ \d+\/\d+/);
 assert.equal(await page.locator('.stacked-equation').count(),8);
 assert.equal(await page.locator('.stacked-frac').count(),16);
 assert.equal(await page.locator('.stacked-equation').first().getAttribute('aria-hidden'),'true');
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.stacked-equation').count(),0,'answer mode must hide decorative duplicates');
 events.push({kind:'interaction',name:'R39 full original fraction text and styled stacked fractions',status:'pass'});
 // R24: exact fraction division and unlike-denominator subtraction with steps PDF.
 await page.goto(`${base}/fractions-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="operation"]').selectOption('division');
 await page.locator('[data-option="denominators"]').selectOption('unlike');
 assert.match(await page.locator('.problem .q').first().innerText(),/^\d+\/\d+ ÷ \d+\/\d+ = ____$/);
 assert.equal(await page.locator('[data-mode="steps"]').count(),1);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const fracQDl=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const fracQ=await verifyPdf(await fracQDl,'R24 fraction division questions',{paper:'A4'});
 const fracADl=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 const fracA=await verifyPdf(await fracADl,'R24 fraction division answers',{paper:'A4'});
 const fracSDl=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="steps"]').click();
 const fracS=await verifyPdf(await fracSDl,'R24 fraction division worked steps',{paper:'A4'});
 assert.ok([fracQ,fracA,fracS].every(doc=>doc.getTitle()?.includes('v18')));
 await page.locator('[data-action="share"]').click();
 const fracLink=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(fracLink,/gv=18/);assert.match(fracLink,/opt_operation=division/);assert.match(fracLink,/opt_denominators=unlike/);
 await page.locator('[data-option="operation"]').selectOption('subtraction');
 assert.match(await page.locator('.problem .q').first().innerText(),/^\d+\/\d+ − \d+\/\d+ = ____$/);
 events.push({kind:'interaction',name:'R24 fraction division/subtraction, A4 question/answer/steps PDFs and versioned sharing',status:'pass'});

 // R20: a missing INPUT must be blank in practice, but completed in both SVG and PDF answer keys.
 await page.goto(`${base}/function-tables-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('input');
 await page.locator('[data-option="missing"]').selectOption('first');
 assert.match(await page.locator('.problem .q').first().innerText(),/missing input/);
 let firstTable=await page.locator('.problem svg').first().innerHTML();
 assert.equal((firstTable.match(/>____<\/text>/g)||[]).length,1);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const tableQuestionDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const tableQuestionPdf=await verifyPdf(await tableQuestionDownload,'R20 function-table missing-input questions',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 const solvedTable=await page.locator('.problem svg').first().innerHTML();
 assert.ok(solvedTable.includes('f(x)'));
 assert.ok(!solvedTable.includes('>____</text>'));
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 const tableAnswerDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 const tableAnswerPdf=await verifyPdf(await tableAnswerDownload,'R20 function-table missing-input answers',{paper:'A4'});
 assert.ok(tableQuestionPdf.getTitle()?.includes('v18')&&tableAnswerPdf.getTitle()?.includes('v18'));
 events.push({kind:'interaction',name:'R20 inverse function table blank-cell SVG, completed answer SVG and paired PDF',status:'pass'});

 // Browser-only regression: the SVG is the ONLY dot count, not a second visual copy.
 await page.goto(`${base}/number-recognition-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('count-dots');
 await page.locator('[data-field="quantity"]').selectOption('8');
 const dots=await page.locator('.problem').evaluateAll(items=>items.map(el=>({question:el.querySelector('.q')?.textContent??'',count:el.querySelectorAll('svg circle').length})));
 await page.locator('[data-mode="answers"]').click();
 const counts=await page.locator('.problem .answer-text').allInnerTexts();
 assert.equal(dots.length,8);assert.equal(counts.length,8);
 dots.forEach((d,i)=>{assert.equal(d.question,'Count the dots shown below.');assert.ok(d.count>=1&&d.count<=12);assert.equal(d.count,Number(counts[i].replace(/[^0-9]/g,'')));});
 events.push({kind:'interaction',name:'number recognition counted dot glyphs match answer key',status:'pass'});

 await page.goto(`${base}/long-division-worksheets/`,{waitUntil:'networkidle'});
 assert.ok(await page.locator('.diagram-vector').count()>0);
 assert.ok((await page.locator('.diagram-vector').first().innerHTML()).includes('remainder: ______'));
 events.push({kind:'interaction',name:'long division printable answer-blind bracket',status:'pass'});

 await page.locator('[data-option="divisorDigits"]').selectOption('two');
 await page.locator('[data-option="dividendDigits"]').selectOption('four');
 await page.locator('[data-option="remainder"]').selectOption('yes');
 const firstLong=await page.locator('.problem .q').first().innerText();
 const matchLong=firstLong.match(/^(\d+) ÷ (\d+) = ____/);
 assert.ok(matchLong&&matchLong[1].length===4&&Number(matchLong[2])>=11);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const longDownload=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="worksheet"]').click();
 const longPractice=await verifyPdf(await longDownload,'R27 two-digit long division A4 questions',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 const longAnswersEvent=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="answers"]').click();
 const longAnswers=await verifyPdf(await longAnswersEvent,'R27 long division A4 answers',{paper:'A4'});
 assert.ok(longPractice.getTitle()?.includes('v18')&&longAnswers.getTitle()?.includes('v18'));
 await page.locator('[data-mode="questions"]').click();
 events.push({kind:'interaction',name:'R27 two-digit divisor/four-digit dividend/remainder options and paired A4 PDFs',status:'pass'});


 // R19: Pythagorean missing-leg questions show only known sides; answer SVG restores the unknown.
 await page.goto(`${base}/pythagorean-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('missing-leg');
 const unknown=await page.locator('.problem .q').first().innerText();
 assert.match(unknown,/Find the other leg/);
 assert.match(await page.locator('.diagram-vector').first().innerHTML(),/>\? units<\/text>/);
 const r19Questions=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await r19Questions,'R19 missing-leg practice');
 await page.locator('[data-mode="answers"]').click();
 assert.ok(await page.locator('.problem .answer-text').count()===8);
 assert.match(await page.locator('.problem .diagram-vector').first().innerHTML(),/units/);
 const r19Answers=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await r19Answers,'R19 missing-leg answer key');
 events.push({kind:'interaction',name:'R19 missing-leg SVG masking and paired PDF download',status:'pass'});

 await page.goto(`${base}/printable-protractor/`,{waitUntil:'networkidle'});
 const protractorDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="protractor"]').click();
 const protractor=await verifyPdf(await protractorDownload,'physical protractor');
 assert.equal(protractor.getPageCount(),1);
 events.push({kind:'interaction',name:'blank 180-degree protractor PDF download (physical measurement still NOT RUN)',status:'pass'});

 // R52: common physical printer check is exposed even on normal worksheets,
 // and its self-reported scale comparison never claims actual printer control.
 await page.goto(`${base}/one-step-equations-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-print-calibration] summary').click();
 await page.locator('[data-field="paper"]').selectOption('A4');
 const scalePdf=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="calibration"]').click();
 const scaleDownload=await scalePdf;
 assert.match(scaleDownload.suggestedFilename(),/printer-calibration-a4.pdf$/);
 const scaleDoc=await verifyPdf(scaleDownload,'R52 one-page A4 actual-size scale PDF',{paper:'A4'});
 assert.equal(scaleDoc.getPageCount(),1);
 assert.ok(Math.abs(scaleDoc.getPage(0).getWidth()-595.28)<0.1);
 assert.match(scaleDoc.getTitle()??'',/printer calibration/);
 await page.locator('[data-calibration-axis="horizontal"]').fill('100.3');
 await page.locator('[data-calibration-axis="vertical"]').fill('99.5');
 await page.locator('[data-action="check-calibration"]').click();
 assert.match(await page.locator('[data-calibration-result]').innerText(),/within \+\/- 1 mm/i);
 await page.locator('[data-calibration-axis="horizontal"]').fill('96');
 await page.locator('[data-action="check-calibration"]').click();
 assert.match(await page.locator('[data-calibration-result]').innerText(),/outside \+\/- 1 mm/i);
 await page.locator('[data-calibration-axis="vertical"]').fill('');
 await page.locator('[data-action="check-calibration"]').click();
 assert.match(await page.locator('[data-calibration-result]').innerText(),/Enter physical ruler measurements/i);
 events.push({kind:'interaction',name:'R52 printer calibration A4 PDF and self-entered horizontal/vertical scale checks (no real printer used)',status:'pass'});
 // R53: 4/5 blank intermediate-work rows must appear for actual 3/4-digit
 // dividends, and their PDF must remain printable with no revealed answer.
 await page.goto(`${base}/long-division-worksheets/`,{waitUntil:'networkidle'});
 for(const [digits,rows] of [['three',4],['four',5]]){
  await page.locator('[data-option="dividendDigits"]').selectOption(digits);
  await page.locator('[data-option="divisorDigits"]').selectOption('two');
  const diagram=page.locator('.problem svg.long-division-vector').first();
  assert.equal(await diagram.count(),1);
  const guides=await diagram.locator('.division-work-guides').getAttribute('d');
  assert.equal([...guides.matchAll(/M178 \d+H360/g)].length,rows,
   `R53 ${digits}-digit long division missing pencil rows`);
  assert.equal(await diagram.getAttribute('viewBox'),'0 0 450 270');
 }
 const r53Event=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const r53Doc=await verifyPdf(await r53Event,'R53 long division with five pencil rows');
 assert.ok(r53Doc.getPageCount()>0);
 events.push({kind:'interaction',name:'R53 3/4 digit long division adaptive SVG guide rows and printable PDF',status:'pass'});
 // R54 opt-in pencil room must not regenerate or change student questions.
 await page.goto(`${base}/two-step-equations-worksheets/`,{waitUntil:'networkidle'});
 const r54Questions=await page.locator('.problem .q').allInnerTexts();
 await page.locator('[data-field="writing-room"]').selectOption('extra');
 assert.match(await page.locator('[data-summary]').innerText(),/Extra writing room \(PDF only\)/);
 assert.deepEqual(await page.locator('.problem .q').allInnerTexts(),r54Questions);
 const r54Event=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const r54Download=await r54Event;
 assert.match(r54Download.suggestedFilename(),/extra-room\.pdf$/);
 const r54ExtraPdf=await verifyPdf(r54Download,'R54 extra ruled practice');
 assert.match(r54ExtraPdf.getTitle()??'',/extra writing room/i);
 await page.locator('[data-action="share"]').click();
 const r54Share=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(r54Share,/room=extra/);
 await page.locator('[data-field="writing-room"]').selectOption('standard');
 assert.deepEqual(await page.locator('.problem .q').allInnerTexts(),r54Questions);
 const r54StdEvent=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const r54StdDownload=await r54StdEvent;
 assert.doesNotMatch(r54StdDownload.suggestedFilename(),/extra-room/);
 const r54StdPdf=await verifyPdf(r54StdDownload,'R54 unchanged default practice');
 assert.doesNotMatch(r54StdPdf.getTitle()??'',/extra writing room/i);
 await page.goto(r54Share,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-field="writing-room"]').inputValue(),'extra');
 assert.deepEqual(await page.locator('.problem .q').allInnerTexts(),r54Questions);
 events.push({kind:'interaction',name:'R54 extra writing room PDF, share settings and unchanged questions',status:'pass'});
 // R57 Cartesian ticks must be symmetrical around the one labeled origin.
 await page.goto(`${base}/coordinate-plane-worksheets/`,{waitUntil:'networkidle'});
 const r57Chart=page.locator('.problem svg.diagram-vector').first();
 assert.equal(await r57Chart.locator('.cartesian-origin').textContent(),'0');
 const r57Grid=await r57Chart.locator('.cartesian-grid-x').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('x1'))));
 assert.ok(r57Grid.length>=5&&r57Grid.length%2===1);
 for(let k=0;k<r57Grid.length;k++)assert.ok(Math.abs(r57Grid[k]+r57Grid.at(-1-k)-450)<.0001);
 assert.equal(r57Grid.filter(x=>Math.abs(x-225)<.0001).length,1);
 const r57CoordsBefore=await page.locator('.problem .q').allInnerTexts();
 const r57Download=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const r57Printed=await verifyPdf(await r57Download,'R57 centered-coordinate grid PDF');
 assert.ok(r57Printed.getPageCount()>0);
 assert.deepEqual(await page.locator('.problem .q').allInnerTexts(),r57CoordsBefore);
 await page.goto(`${base}/linear-equations-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('graph');
 assert.equal(await page.locator('.problem svg .cartesian-origin').first().textContent(),'0');
 assert.equal(await page.locator('.problem svg .solution-linear-line').count(),0);
 events.push({kind:'interaction',name:'R57 centered coordinate axes with zero mark and unchanged solution-free graphing PDFs',status:'pass'});
 // R56: new labeled 3D edges must preserve the unknown height in preview
 // and in the browser-generated question PDF.
 await page.goto(`${base}/volume-of-rectangular-prisms-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('missing-height');
 const r56Prism=page.locator('.problem svg.diagram-vector').first();
 assert.equal(await r56Prism.locator('.prism-length').count(),1);
 assert.equal(await r56Prism.locator('.prism-width').count(),1);
 assert.equal(await r56Prism.locator('.prism-height').textContent(),'Height: ?');
 assert.match(await r56Prism.getAttribute('aria-label'),/height unknown/);
 assert.match(await r56Prism.locator('.prism-scale-note').textContent(),/not to scale/);
 const r56DownloadEvent=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const r56Doc=await verifyPdf(await r56DownloadEvent,'R56 missing-height prism PDF');
 assert.ok(r56Doc.getPageCount()>=1);
 await page.goto(`${base}/surface-area-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="solid"]').selectOption('cube');
 const r56Cube=page.locator('.problem svg.diagram-vector').first();
 assert.match(await r56Cube.locator('.prism-length').textContent(),/^Side: \d+$/);
 assert.equal(await r56Cube.locator('.prism-width').count(),0);
 assert.equal(await r56Cube.locator('.prism-height').count(),0);
 events.push({kind:'interaction',name:'R56 accessible prism L/W/H vs cube-side labels, masked height and actual PDF',status:'pass'});
 // R12 browser regression: true interior-angle geometry and masked missing-height PDF.
 await page.goto(`${base}/triangle-angle-sum-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="thirdAngle"]').selectOption('obtuse');
 const firstAngle=await page.locator('.problem').first().evaluate(el=>({
  question:el.querySelector('.q')?.textContent??'',
  labels:[...el.querySelectorAll('svg text')].map(e=>e.textContent??''),
  polygon:el.querySelector('svg polygon')?.getAttribute('points')??''
 }));
 const nums=firstAngle.question.match(/angles are (\d+)° and (\d+)°/);
 assert.ok(nums,'Angle worksheet did not show two known values');
 assert.ok(firstAngle.labels.includes(`${nums[1]}°`)&&firstAngle.labels.includes(`${nums[2]}°`));
 assert.ok(firstAngle.labels.includes('?'),'Missing triangle angle is not masked');
 assert.equal(firstAngle.polygon.split(' ').length,3,'Triangle vertices missing');
 const triangleDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await triangleDownload,'true-angle triangle practice');
 await page.screenshot({path:join(out,'triangle-angles-true-geometry.png'),fullPage:true});
 events.push({kind:'interaction',name:'real-angle triangle SVG, unknown angle masking and PDF download',status:'pass'});
 await page.goto(`${base}/area-of-trapezoids-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('missing-height');
 const missingHeight=await page.locator('.diagram-vector').first().innerHTML();
 assert.ok(missingHeight.includes('>?</text>'),'Unknown trapezoid height was not masked');
 const heightDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await heightDownload,'trapezoid missing-height practice');
 await page.screenshot({path:join(out,'trapezoid-missing-height.png'),fullPage:true});
 events.push({kind:'interaction',name:'missing-height trapezoid is answer-blind in SVG and PDF',status:'pass'});

 // R13: real geometric diagrams and their corresponding PDF export links.
 await page.goto(`${base}/vertical-angles-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('adjacent');
 const crossing=page.locator('.diagram-vector').first();
 assert.equal(await crossing.locator('polyline').count(),2,'Intersecting lines need both angle arcs');
 assert.ok((await crossing.innerHTML()).includes('>?<'),'Target angle must be hidden as question mark');
 const verticalDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await verticalDownload,'R13 adjacent crossing angles');
 await page.screenshot({path:join(out,'r13-vertical-angles.png'),fullPage:true});
 events.push({kind:'interaction',name:'real intersecting lines render and export a vector PDF',status:'pass'});
 await page.goto(`${base}/area-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="shape"]').selectOption('square');
 const square=page.locator('.diagram-vector rect').first();
 assert.equal(await square.getAttribute('width'),await square.getAttribute('height'),'Area square preview must be geometrically square');
 await page.screenshot({path:join(out,'r13-area-square.png'),fullPage:true});
 events.push({kind:'interaction',name:'square shape retains equal vector sides',status:'pass'});
 await page.goto(`${base}/lines-rays-segments-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="figure"]').selectOption('ray');
 const figure=page.locator('.diagram-vector').first();
 assert.ok((await figure.innerHTML()).includes('<circle'),'Ray endpoint missing');
 assert.match(await page.locator('.problem .q').first().innerText(),/Identify the pictured figure/);
 const lineDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await lineDownload,'R13 labeled ray');
 await page.screenshot({path:join(out,'r13-labeled-ray.png'),fullPage:true});
 events.push({kind:'interaction',name:'line/ray/segment diagrams assessed visually, not text clues',status:'pass'});

 // R16: students see a blank statistical axis; only the answer preview reveals the constructed plot.
 await page.goto(`${base}/box-plots-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="statistic"]').selectOption('draw');
 assert.match(await page.locator('.problem .q').first().innerText(),/Draw a modified box plot/);
 assert.equal(await page.locator('.solution-box').count(),0,'Practice mode must not reveal quartiles');
 const blankDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await blankDownload,'R16 blank box-plot practice');
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.solution-box').count(),8,'Answer preview should show one complete plot for each task');
 const solvedDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await solvedDownload,'R16 completed box-plot answer key');
 await page.screenshot({path:join(out,'r16-box-plots-answer.png'),fullPage:true});
 events.push({kind:'interaction',name:'modified box-plot construction hides practice answers and renders completed answer PDF',status:'pass'});

 // R17: graph practice is blank; answer preview and downloaded PDF contain the completed line.
 await page.goto(`${base}/linear-equations-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('graph');
 await page.locator('[data-option="slope"]').selectOption('negative');
 assert.match(await page.locator('.problem .q').first().innerText(),/Graph the line/);
 assert.equal(await page.locator('.solution-linear-line').count(),0,'Student grid must remain blank');
 await page.screenshot({path:join(out,'r17-linear-graph-blank-practice.png'),fullPage:true});
 const graphPractice=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await graphPractice,'R17 blank linear-graph PDF');
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.solution-linear-line').count(),8,'Answer key needs a completed graph for each question');
 assert.equal(await page.locator('.solution-linear-point').count(),16,'Two solution points are needed per graph');
 const graphAnswers=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await graphAnswers,'R17 solved linear-graph PDF');
 await page.screenshot({path:join(out,'r17-linear-graph-answers.png'),fullPage:true});
 events.push({kind:'interaction',name:'graph-a-line mode blank practice and completed answer key',status:'pass'});

 await page.goto(`${base}/scatter-plot-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('plot');
 await page.locator('[data-option="trend"]').selectOption('none');
 assert.equal(await page.locator('.scatter-solution-point').count(),0,'Scatter practice leaked plotted coordinates');
 await page.locator('[data-field="paper"]').selectOption('A4');
 const scatterQuestionDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await scatterQuestionDownload,'R18 blank scatter PDF',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.scatter-solution-point').count(),8*6,'Scatter answer keys should plot six points per exercise');
 const scatterAnswerDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await scatterAnswerDownload,'R18 plotted scatter PDF',{paper:'A4'});
 await page.screenshot({path:join(out,'r18-scatter-solution.png'),fullPage:true});
 events.push({kind:'interaction',name:'R18 scatter practice is blank, answer graphs reveal points, A4 PDFs download',status:'pass'});

 // R21: check two modes and no-mode in real Chromium, with paired A4 PDFs.
 await page.goto(`${base}/mean-median-mode-range-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="statistic"]').selectOption('mode');
 await page.locator('[data-option="modePattern"]').selectOption('two');
 assert.equal(await page.locator('.problem').count(),8);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const statsPracticeDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await statsPracticeDownload,'R21 bimodal practice',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 assert.match(await page.locator('.problem .answer-text').first().innerText(),/Answer:.*\d+, \d+/);
 const statsAnswerDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await statsAnswerDownload,'R21 bimodal answers',{paper:'A4'});
 await page.locator('[data-option="modePattern"]').selectOption('none');
 await page.locator('[data-mode="answers"]').click();
 assert.match(await page.locator('.problem .answer-text').first().innerText(),/no mode/);
 events.push({kind:'interaction',name:'R21 single/two/none mode controls and paired A4 PDF downloads',status:'pass'});

 // R22: exact-fraction mean absolute deviation with a chosen 8-value sample.
 await page.goto(`${base}/mean-absolute-deviation-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="distribution"]').selectOption('skewed');
 await page.locator('[data-option="size"]').selectOption('8');
 assert.equal(await page.locator('.problem').count(),8);
 const madQuestion=await page.locator('.problem .q').first().innerText();
 const madItems=madQuestion.match(/\[([\d, ]+)\]/)?.[1]?.split(', ');
 assert.equal(madItems?.length,8,'Selected size did not generate eight observations');
 await page.locator('[data-field="paper"]').selectOption('A4');
 const madQuestionDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const madQ=await verifyPdf(await madQuestionDownload,'R22 skewed MAD practice',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 const madAnswerDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 const madA=await verifyPdf(await madAnswerDownload,'R22 skewed MAD answers',{paper:'A4'});
 assert.ok(madQ.getTitle()?.includes('v18')&&madA.getTitle()?.includes('v18'));
 assert.ok(await page.locator('[data-action="steps"]').isEnabled(),'Verified MAD steps PDF should be available');
 const madStepsDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="steps"]').click();
 const madS=await verifyPdf(await madStepsDownload,'R22 exact MAD worked solutions',{paper:'A4'});
 assert.ok(madS.getTitle()?.includes('steps'));
 await page.screenshot({path:join(out,'r22-eight-value-mad-answers.png'),fullPage:true});
 events.push({kind:'interaction',name:'R22 eight-observation skewed MAD and paired A4 PDF downloads',status:'pass'});

 // R28: real whole-number billions and exact decimal-rounding workflows.
 await page.goto(`${base}/place-value-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="place"]').selectOption('billions');
 await page.locator('[data-option="task"]').selectOption('value');
 assert.match(await page.locator('.problem .q').first().innerText(),/value of the billions digit in [\d,]+\?/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const wholePractice=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const wholeQ=await verifyPdf(await wholePractice,'R28 billions place practice',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 const wholeAnswer=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 const wholeA=await verifyPdf(await wholeAnswer,'R28 billions place answer key',{paper:'A4'});
 assert.ok(wholeQ.getTitle()?.includes('v18')&&wholeA.getTitle()?.includes('v18'));
 await page.locator('[data-action="share"]').click();
 const wholeLink=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(wholeLink,/gv=18/);assert.match(wholeLink,/opt_place=billions/);assert.match(wholeLink,/opt_task=value/);
 events.push({kind:'interaction',name:'R28 billion-digit place value and A4 worksheet/answer downloads',status:'pass'});

 await page.goto(`${base}/decimal-place-value-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="place"]').selectOption('thousandths');
 await page.locator('[data-option="task"]').selectOption('round');
 assert.match(await page.locator('.problem .q').first().innerText(),/^Round \d+\.\d{4} to the nearest thousandths\.$/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const decimalPractice=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await decimalPractice,'R28 four-place rounding worksheet',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 const roundingAnswer=await page.locator('.problem .answer-text').first().innerText();
 assert.match(roundingAnswer,/\d+\.\d{3}/,'Answer should preserve requested decimal precision');
 const decimalAnswer=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await decimalAnswer,'R28 four-place rounding answers',{paper:'A4'});
 await page.screenshot({path:join(out,'r28-decimal-rounding.png'),fullPage:true});
 events.push({kind:'interaction',name:'R28 four-place decimals and precise A4 rounding answer PDF',status:'pass'});

 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}/two-step-equations-worksheets/`,{waitUntil:'networkidle'});
 const coords=await page.evaluate(()=>({preview:document.querySelector('.preview-panel')?.getBoundingClientRect().y,settings:document.querySelector('.settings')?.getBoundingClientRect().y,overflow:document.documentElement.scrollWidth-window.innerWidth}));
 assert.ok(coords.preview<coords.settings,'Mobile preview does not appear before controls');
 assert.ok(coords.overflow<=2,`Mobile horizontal overflow ${coords.overflow}px`);
 assert.ok(await page.locator('.mobile-jump').isVisible());
 await page.screenshot({path:join(out,'two-step-mobile-390.png'),fullPage:true});
 events.push({kind:'interaction',name:'390px mobile preview order, no horizontal scroll',status:'pass'});
 for(const width of [360,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(`${base}/two-step-equations-worksheets/`,{waitUntil:'networkidle'});
  const boxes=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-window.innerWidth,
   preview:document.querySelector('.preview-panel')?.getBoundingClientRect().toJSON(),
   settings:document.querySelector('.settings')?.getBoundingClientRect().toJSON()
  }));
  assert.ok(boxes.overflow<=2,`${width}px viewport has ${boxes.overflow}px horizontal overflow`);
  if(width<=630)assert.ok(boxes.preview.y<boxes.settings.y,`${width}px preview priority broken`);
  if(width>=961)assert.ok(boxes.settings.x<boxes.preview.x,`${width}px desktop columns broken`);
  if(width===360)await page.screenshot({path:join(out,'two-step-mobile-360.png'),fullPage:true});
  events.push({kind:'responsive',width,overflow:boxes.overflow,status:'pass'});
 }
 // R42: verify all live teaching pages remain useful with JavaScript switched
 // off. Astro's build-time preview must not depend on client hydration.
 const routes=JSON.parse(readFileSync(resolve('src/data/routes.json'),'utf8'))
  .filter(route=>route.type!=='HOLD');
 assert.equal(routes.length,51,'Full-catalog no-JavaScript QA must cover 51 tools');
 const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const staticPage=await noJs.newPage();
 const screenshots=new Set([
  'addition-worksheets','two-step-equations-worksheets',
  'fractions-worksheets','pythagorean-worksheets',
  'box-plots-worksheets'
 ]);
 const staticChecks=[];
 for(const route of routes){
  const response=await staticPage.goto(`${base}/${route.slug}/`,{waitUntil:'load'});
  assert.equal(response?.status(),200,`JS-off page HTTP error: ${route.slug}`);
  assert.equal(await staticPage.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
  assert.equal(await staticPage.locator('h1').count(),1,`Missing server-rendered H1: ${route.slug}`);
  assert.equal(await staticPage.locator('.problem .q').count(),8,`Missing server-rendered exercises: ${route.slug}`);
  assert.equal(await staticPage.locator('.sample-img').count(),1,`Missing original fixed-seed image: ${route.slug}`);
  const img=await staticPage.locator('.sample-img').getAttribute('src');
  assert.equal(img,`/images/worksheets/${route.slug}-sample.webp`);
  const imageResponse=await staticPage.request.get(`${base}${img}`);
  assert.equal(imageResponse.status(),200,`JS-off preview image failed: ${route.slug}`);
  assert.ok((await imageResponse.body()).length>1000,`JS-off preview image empty: ${route.slug}`);
  assert.ok((await staticPage.locator('section[aria-label="Worked example and common mistakes"]').innerText()).length>90,
   `JS-off educational explanation missing: ${route.slug}`);
  assert.equal(await staticPage.locator('.problem .answer-text').count(),0,
   `JS-off answers leaked on practice sheet: ${route.slug}`);
  if(screenshots.has(route.slug))
   await staticPage.screenshot({path:join(out,`r42-nojs-${route.slug}.png`),fullPage:true});
  staticChecks.push(route.slug);
 }
 await noJs.close();
 // R64: verify the live SSG buttons download four true printable 1-12
 // chart PDFs without mutating the original randomized fact-drill engine.
 await page.goto(base+'/multiplication-tables-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r64-chart-guide]').count(),1);
 assert.equal(await page.locator('[data-action="multiplication-grid-blank"]').count(),1);
 assert.equal(await page.locator('[data-action="multiplication-grid-key"]').count(),1);
 assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 for(const paper of ['Letter','A4']){
  await page.locator('[data-field="paper"]').selectOption(paper);
  for(const mode of ['blank','key']){
   const event=page.waitForEvent('download',{timeout:30000});
   await page.locator('[data-action="multiplication-grid-'+mode+'"]').click();
   const doc=await verifyPdf(await event,'R64 multiplication chart '+paper+' '+mode,{paper});
   assert.match(doc.getTitle()??'',/Multiplication Table 1-12/);
   assert.match(doc.getTitle()??'',mode==='blank'?/Blank Worksheet/:/Answer Key/);
  }
 }
 const randomDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const randomDoc=await verifyPdf(await randomDownload,'R64 original times-table fact drill',{paper:'A4'});
 assert.match(randomDoc.getTitle()??'',/generator v18/);
 await page.screenshot({path:join(out,'r64-multiplication-chart-desktop.png'),fullPage:true});
 events.push({kind:'interaction',name:'R64 four blank/filled chart PDFs plus original seed-preserving worksheet',status:'pass'});
 await page.goto(base+'/one-step-equations-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-action^="multiplication-grid-"]').count(),0,'Chart controls leaked to unrelated topics');

 // R65 browser evidence: opt-in decimal/fraction equation packs use the
 // EXACT current seed/options, without changing the v18 integer preview.
 for(const topic of ['one-step-equations-worksheets','two-step-equations-worksheets']){
  await page.goto(base+'/'+topic+'/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-r65-equation-pack]').count(),1);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
  await page.locator('[data-field="paper"]').selectOption('A4');
  const oldQuestion=await page.locator('.problem .q').first().innerText();
  if(topic.startsWith('one'))await page.locator('[data-option="operation"]').selectOption('multiplication');
  else await page.locator('[data-option="coefficient"]').selectOption('negative');
  const integerPreview=await page.locator('.problem .q').first().innerText();
  assert.ok(integerPreview.length>5);
  for(const kind of ['decimal','fraction']){
   await page.locator('[data-equation-kind]').selectOption(kind);
   for(const mode of ['questions','answers','steps']){
    const event=page.waitForEvent('download',{timeout:30000});
    await page.locator('[data-action="equation-pack-'+mode+'"]').click();
    const result=await verifyPdf(await event,'R65 '+topic+' '+kind+' '+mode,{paper:'A4'});
    assert.match(result.getTitle()??'',/R65.1/);
    assert.match(result.getTitle()??'',new RegExp(kind==='decimal'?'Decimal':'Fraction'));
    assert.match(result.getSubject()??'',/separate from the original integer generator v18/);
   }
   assert.equal(await page.locator('.problem .q').first().innerText(),integerPreview,
    'Separate equation extension altered the original integer worksheet');
  }
  assert.notEqual(oldQuestion.length,0);
  events.push({kind:'interaction',name:'R65 '+topic+' both exact decimal/fraction PDF triplets, A4 and untouched v18',status:'pass'});
 }
 await page.goto(base+'/multiplication-tables-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-equation-kind]').count(),0,
  'Equation extension controls leaked to unrelated worksheet topic');
 // R66: browser-test both real fraction number-line routes and both task types.
 // The opt-in student/answer PDFs must not mutate the baseline v18 preview.
 for(const topic of ['number-line-worksheets','fractions-worksheets']){
  await page.goto(base+'/'+topic+'/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-r66-fraction-number-line]').count(),1);
  assert.equal(await page.locator('[data-r66-fraction-guide]').count(),1);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
  const firstQuestion=await page.locator('.problem .q').first().innerText();
  await page.locator('[data-field="paper"]').selectOption('A4');
  for(const task of ['identify','plot'])for(const range of ['zero-one','zero-two']){
   await page.locator('[data-fraction-line-task]').selectOption(task);
   await page.locator('[data-fraction-line-range]').selectOption(range);
   for(const mode of ['questions','answers']){
    const event=page.waitForEvent('download',{timeout:30000});
    await page.locator('[data-action="fraction-line-'+mode+'"]').click();
    const doc=await verifyPdf(await event,'R66 fraction line '+topic+' '+task+' '+range+' '+mode,{paper:'A4'});
    assert.match(doc.getTitle()??'',/R66.1/);
    assert.match(doc.getTitle()??'',new RegExp(mode));
   }
  }
  assert.equal(await page.locator('.problem .q').first().innerText(),firstQuestion,
   'R66 exact fraction-line extension mutated the original worksheet');
  await page.screenshot({path:join(out,'r66-fraction-line-'+topic+'-desktop.png'),fullPage:true});
  events.push({kind:'interaction',name:'R66 '+topic+' 8 fraction diagrams PDF pairs, no main-sheet mutation',status:'pass'});
 }
 await page.goto(base+'/two-step-equations-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r66-fraction-number-line]').count(),0,
  'R66 fraction-line extension leaked to unrelated equation page');
 // R67 real browser downloads: isolate each three-PDF batch in a
 // fresh browser context. Chrome can block excessive rapid automatic
 // downloads from a single same-origin tab, even after JS a.click succeeds.
 // A clean context is stronger than relaxing the browser download gate.
 const divisionPage=await page.goto(base+'/division-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r67-decimal-division]').count(),1);
 assert.equal(await page.locator('[data-r67-decimal-guide]').count(),1);
 assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 const integerBaseline=await page.locator('.problem .q').first().innerText();
 for(const divisorType of ['whole','decimal'])for(const precision of ['tenths','hundredths']){
  const isolated=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const decimalPage=await isolated.newPage();
   decimalPage.on('pageerror',error=>pageErrors.push('R67 '+divisorType+' '+precision+': '+error.message));
   await decimalPage.goto(base+'/division-worksheets/',{waitUntil:'networkidle'});
   await decimalPage.locator('[data-field="paper"]').selectOption('A4');
   await decimalPage.locator('[data-decimal-divisor]').selectOption(divisorType);
   await decimalPage.locator('[data-decimal-precision]').selectOption(precision);
   const before=await decimalPage.locator('.problem .q').first().innerText();
   assert.equal(before,integerBaseline);
   for(const mode of ['questions','answers','steps']){
    const download=decimalPage.waitForEvent('download',{timeout:18000});
    await decimalPage.locator('[data-action="decimal-division-'+mode+'"]').click();
    let got;
    try{got=await download}
    catch(e){
     const state=await decimalPage.locator('[data-status]').innerText();
     throw new Error('R67 '+divisorType+' '+precision+' '+mode+' download failed; UI status: '+state+'; '+String(e));
    }
    const pdf=await verifyPdf(got,'R67 decimal division '+divisorType+' '+precision+' '+mode,{paper:'A4'});
    assert.match(pdf.getTitle()??'',/R67.1/);
    assert.match(pdf.getTitle()??'',new RegExp(mode));
    assert.match(pdf.getSubject()??'',/independent of integer generator v18/);
   }
   assert.equal(await decimalPage.locator('.problem .q').first().innerText(),before);
   if(divisorType==='decimal'&&precision==='hundredths')
    await decimalPage.screenshot({path:join(out,'r67-decimal-division-ui.png'),fullPage:true});
  }finally{await isolated.close()}
 }
 events.push({kind:'interaction',name:'R67 isolated batches verify 12 decimal division PDF downloads and original v18 integer sheet',status:'pass'});
 await page.goto(base+'/fractions-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r67-decimal-division]').count(),0,
  'R67 decimal division options leaked into unrelated fractions worksheet');
 
 // R68 authentic column-add/sub PDF download flows in isolated
 // Chromium contexts (avoid Chrome's same-tab automatic multiple-download cap).
 for(const scenario of [
  {topic:'addition-worksheets',operation:'addition',precision:'tenths',regrouping:'no',paper:'A4'},
  {topic:'subtraction-worksheets',operation:'mixed',precision:'hundredths',regrouping:'yes',paper:'Letter'},
  {topic:'mixed-addition-subtraction-worksheets',operation:'mixed',precision:'hundredths',regrouping:'mixed',paper:'A4'}
 ]){
  const isolated=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const decimalPage=await isolated.newPage();
   decimalPage.on('pageerror',e=>pageErrors.push('R68 '+scenario.topic+': '+e.message));
   await decimalPage.goto(base+'/'+scenario.topic+'/',{waitUntil:'networkidle'});
   assert.equal(await decimalPage.locator('[data-r68-decimal-add-sub]').count(),1);
   assert.equal(await decimalPage.locator('[data-r68-decimal-guide]').count(),1);
   assert.equal(await decimalPage.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const original=await decimalPage.locator('.problem .q').first().innerText();
   await decimalPage.locator('[data-field="paper"]').selectOption(scenario.paper);
   await decimalPage.locator('[data-decimal-add-sub-operation]').selectOption(scenario.operation);
   await decimalPage.locator('[data-decimal-add-sub-places]').selectOption(scenario.precision);
   await decimalPage.locator('[data-decimal-add-sub-regrouping]').selectOption(scenario.regrouping);
   for(const mode of ['questions','answers','steps']){
    const event=decimalPage.waitForEvent('download',{timeout:20000});
    await decimalPage.locator('[data-action="decimal-add-sub-'+mode+'"]').click();
    let downloaded;
    try{downloaded=await event}
    catch(e){
     const status=await decimalPage.locator('[data-status]').innerText();
     throw new Error('R68 '+scenario.topic+' '+mode+' download failure: '+status+' / '+String(e));
    }
    const pdf=await verifyPdf(downloaded,'R68 '+scenario.topic+' '+mode,{paper:scenario.paper});
    assert.match(pdf.getTitle()??'',/R68\.1/);
    assert.match(pdf.getTitle()??'',new RegExp(mode));
    assert.match(pdf.getSubject()??'',/separate from v18 integer generators/);
   }
   assert.equal(await decimalPage.locator('.problem .q').first().innerText(),original,
    'R68 decimal pack changed the main integer worksheet');
   if(scenario.topic==='subtraction-worksheets')
    await decimalPage.screenshot({path:join(out,'r68-column-decimal-subtraction-ui.png'),fullPage:true});
  }finally{await isolated.close()}
 }
 events.push({kind:'interaction',name:'R68 three decimal column routes and nine actual browser PDF downloads',status:'pass'});
 await page.goto(base+'/division-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r68-decimal-add-sub]').count(),0,
  'R68 add/sub controls leaked to unrelated decimal division page');
 
 // R69 fraction ↔ decimal conversion: actual browser-initiated PDFs from
 // each conversion direction and precision; isolate automatic download batches.
 for(const example of [
  {direction:'fraction-to-decimal',precision:'tenths',paper:'A4'},
  {direction:'decimal-to-fraction',precision:'thousandths',paper:'Letter'},
  {direction:'mixed',precision:'mixed',paper:'A4'}
 ]){
  const isolated=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const p=await isolated.newPage();
   p.on('pageerror',e=>pageErrors.push('R69 conversion '+example.direction+': '+e.message));
   await p.goto(base+'/fractions-worksheets/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r69-conversion]').count(),1);
   assert.equal(await p.locator('[data-r69-conversion-guide]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const integerOriginal=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption(example.paper);
   await p.locator('[data-conversion-direction]').selectOption(example.direction);
   await p.locator('[data-conversion-precision]').selectOption(example.precision);
   for(const mode of ['questions','answers','steps']){
    const download=p.waitForEvent('download',{timeout:20000});
    await p.locator('[data-action="conversion-'+mode+'"]').click();
    let dl;
    try{dl=await download}
    catch(e){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R69 '+example.direction+' '+example.precision+' '+mode+' export failed: '+status+'; '+String(e));
    }
    const pdf=await verifyPdf(dl,'R69 fraction decimal '+example.direction+' '+mode,{paper:example.paper});
    assert.match(pdf.getTitle()??'',/R69\.1/);
    assert.match(pdf.getTitle()??'',new RegExp(mode));
    assert.match(pdf.getSubject()??'',/separate from v18 worksheet generators/);
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),integerOriginal);
   if(example.direction==='mixed')
    await p.screenshot({path:join(out,'r69-fraction-decimal-mixed-ui.png'),fullPage:true});
  }finally{await isolated.close()}
 }
 events.push({kind:'interaction',name:'R69 exact fraction decimal downloads across three browser modes preserving v18',status:'pass'});
 await page.goto(base+'/addition-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r69-conversion]').count(),0,
  'Fraction decimal conversion panel leaked to unrelated addition topic');

 // R70 real rendered route corrections: links must lead to implemented
 // specialist generators rather than historically misclassified hubs.
 for(const pair of [
  ['volume-of-rectangular-prisms-worksheets','surface-area-worksheets'],
  ['two-digit-multiplication-worksheets','two-digit-by-one-digit-multiplication-worksheets'],
  ['functions-worksheets','domain-range-worksheets'],
  ['multiplying-fractions-worksheets','fractions-worksheets']
 ]){
  await page.goto(base+'/'+pair[0]+'/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
  assert.equal(await page.locator('[data-r70-route-corrections]').count(),1);
  assert.ok(await page.locator('[data-r70-route-corrections] a[href="/'+pair[1]+'/"]').count());
 }
 // R71 each mode downloads three ACTUAL PDF files through isolated
 // Playwright contexts to avoid Chrome's multi-download suppression.
 for(const input of [
  {topic:'multiplication-worksheets',mode:'mixed-facts',factors:'mixed',paper:'A4'},
  {topic:'multiplication-worksheets',mode:'fact-family',factors:'mixed',paper:'Letter'},
  {topic:'multiplication-worksheets',mode:'area-model',factors:'two-by-two',paper:'A4'},
  {topic:'division-worksheets',mode:'fact-family',factors:'mixed',paper:'Letter'}
 ]){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',err=>pageErrors.push('R71 '+input.mode+' '+err.message));
   await p.goto(base+'/'+input.topic+'/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r71-multdiv-pack]').count(),1);
   assert.equal(await p.locator('[data-r71-multdiv-guide]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const original=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption(input.paper);
   await p.locator('[data-multdiv-mode]').selectOption(input.mode);
   if(input.topic==='multiplication-worksheets')
    await p.locator('[data-multdiv-factors]').selectOption(input.factors);
   for(const mode of ['questions','answers','steps']){
    const event=p.waitForEvent('download',{timeout:25000});
    await p.locator('[data-action="multdiv-'+mode+'"]').click();
    let download;
    try{download=await event}
    catch(err){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R71 '+input.mode+'/'+mode+' failed: '+status+'; '+String(err));
    }
    const document=await verifyPdf(download,'R71 '+input.mode+' '+mode,{paper:input.paper});
    assert.match(document.getTitle()??'',/R71\.1/);
    assert.match(document.getTitle()??'',new RegExp(mode));
    assert.match(document.getSubject()??'',/independent of original integer generator v18/);
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),original);
   if(input.mode==='area-model')
    await p.screenshot({path:join(out,'r71-area-model-multiplication-preview.png'),fullPage:true});
  }finally{await ctx.close();}
 }
 await page.goto(base+'/one-step-equations-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r71-multdiv-pack]').count(),0,'R71 mode leaked to unrelated topic');
 events.push({kind:'interaction',name:'R70 4 exact corrected source links; R71 12 actual PDF downloads from 3 modes and 2 pages',status:'pass'});

 // R72 actual printable fraction strip chart downloads and immutable v18
 // fraction arithmetic, in isolated Chromium contexts.
 for(const set of ['basic','extended']){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',e=>pageErrors.push('R72 fraction strip '+set+': '+e.message));
   await p.goto(base+'/fractions-worksheets/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r72-fraction-strips]').count(),1);
   assert.equal(await p.locator('[data-r72-fraction-strips-guide]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const original=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-fraction-strip-set]').selectOption(set);
   for(const mode of ['blank','labeled']){
    const event=p.waitForEvent('download',{timeout:22000});
    await p.locator('[data-action="fraction-strip-'+mode+'"]').click();
    let dl;
    try{dl=await event}
    catch(e){const status=await p.locator('[data-status]').innerText();
     throw new Error('R72 '+set+' '+mode+' browser download missing: '+status+'; '+String(e));}
    const doc=await verifyPdf(dl,'R72 fraction strips '+set+' '+mode,{paper:'A4'});
    assert.equal(doc.getPageCount(),1);
    assert.match(doc.getTitle()??'',/R72\.1/);
    assert.match(doc.getTitle()??'',new RegExp(mode));
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),original);
   if(set==='extended')
    await p.screenshot({path:join(out,'r72-blank-fraction-strips-controls.png'),fullPage:true});
  }finally{await ctx.close()}
 }
 events.push({kind:'interaction',name:'R72 four actual A4 fraction strip PDF downloads from blank/labelled charts',status:'pass'});

 // R73 interpret the remainder correctly in actual browser student/teacher PDFs.
 // One isolated context per story type prevents automated-download throttling.
 for(const selected of ['mixed','equal-sharing','full-groups','round-up','leftovers']){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',e=>pageErrors.push('R73 '+selected+': '+e.message));
   await p.goto(base+'/division-worksheets/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r73-division-stories]').count(),1);
   assert.equal(await p.locator('[data-r73-division-stories-guide]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const original=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-division-story-mode]').selectOption(selected);
   for(const mode of ['questions','answers','steps']){
    const event=p.waitForEvent('download',{timeout:25000});
    await p.locator('[data-action="division-story-'+mode+'"]').click();
    let dl;
    try{dl=await event}
    catch(e){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R73 '+selected+'/'+mode+' download error: '+status+'; '+String(e));
    }
    const pdf=await verifyPdf(dl,'R73 division word '+selected+' '+mode,{paper:'A4'});
    assert.match(pdf.getTitle()??'',/R73\.1/);
    assert.match(pdf.getTitle()??'',new RegExp(mode));
    assert.match(pdf.getSubject()??'',/independent from original v18 division facts/);
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),original);
   if(selected==='mixed')await p.screenshot({path:join(out,'r73-division-word-problems-ui.png'),fullPage:true});
  }finally{await ctx.close()}
 }
 events.push({kind:'interaction',name:'R73 five division story modes: 15 real student/key/steps PDFs, no v18 mutation',status:'pass'});
 await page.goto(base+'/fractions-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r73-division-stories]').count(),0,
  'Division story selectors leaked to the fractions page');

 // R74 actual Chromium downloads: translation, compound AND/OR, circular sectors and inverse radius.
 for(const trial of [
  {topic:'inequalities-worksheets',kind:'inequality',mode:'translate'},
  {topic:'inequalities-worksheets',kind:'inequality',mode:'and'},
  {topic:'inequalities-worksheets',kind:'inequality',mode:'or'},
  {topic:'area-worksheets',kind:'circle',mode:'sector'},
  {topic:'area-worksheets',kind:'circle',mode:'missing-radius'}
 ]){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',e=>pageErrors.push('R74 '+trial.mode+': '+e.message));
   await p.goto(base+'/'+trial.topic+'/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r74-'+(trial.kind==='inequality'?'inequalities':'circle-area')+']').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const old=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-r74-'+trial.kind+'-mode]').selectOption(trial.mode);
   for(const output of ['questions','answers','steps']){
    const pending=p.waitForEvent('download',{timeout:35000});
    await p.locator('[data-action="r74-'+trial.kind+'-'+output+'"]').click();
    let dl;
    try{dl=await pending}catch(e){const status=await p.locator('[data-status]').innerText();
     throw new Error('R74 '+trial.mode+'/'+output+' download missing: '+status+'; '+String(e));}
    const doc=await verifyPdf(dl,'R74 '+trial.mode+' '+output,{paper:'A4'});
    assert.match(doc.getTitle()??'',/R74\.1/);
    assert.match(doc.getTitle()??'',new RegExp(output));
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),old);
   if(trial.mode==='sector'||trial.mode==='and')
    await p.screenshot({path:join(out,'r74-'+trial.mode+'-controls.png'),fullPage:true});
  }finally{await ctx.close()}
 }
 events.push({kind:'interaction',name:'R74 15 actual Chromium inequality and circle PDF downloads, v18 preserved',status:'pass'});
 // R75 actual independent triangle/compound geometry controls and student/teacher downloads.
 for(const trial of [
  {topic:'inequalities-worksheets',kind:'triangle',skill:'possible'},
  {topic:'inequalities-worksheets',kind:'triangle',skill:'missing-side'},
  {topic:'inequalities-worksheets',kind:'triangle',skill:'integer-count'},
  {topic:'area-worksheets',kind:'composite',skill:'subtract'},
  {topic:'area-worksheets',kind:'composite',skill:'split'}
 ]){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',e=>pageErrors.push('R75 '+trial.skill+': '+e.message));
   await p.goto(base+'/'+trial.topic+'/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r75-'+trial.kind+']').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const initial=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-r75-'+trial.kind+'-mode]').selectOption(trial.skill);
   for(const output of ['questions','answers','steps']){
    const awaiting=p.waitForEvent('download',{timeout:35000});
    await p.locator('[data-action="r75-'+trial.kind+'-'+output+'"]').click();
    let dl;
    try{dl=await awaiting}catch(e){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R75 '+trial.skill+'/'+output+' download missing: '+status+'; '+String(e));
    }
    const doc=await verifyPdf(dl,'R75 '+trial.skill+' '+output,{paper:'A4'});
    assert.match(doc.getTitle()??'',/R75\.1/);
    assert.match(doc.getTitle()??'',new RegExp(output));
    assert.equal(doc.getPageCount(),3);
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),initial);
   if(trial.skill==='possible'||trial.skill==='subtract')
    await p.screenshot({path:join(out,'r75-'+trial.skill+'-controls.png'),fullPage:true});
  }finally{await ctx.close()}
 }
 events.push({kind:'interaction',name:'R75 15 actual A4 triangle theorem and L-area student/key/step downloads; v18 unchanged',status:'pass'});
 // R76 actual user download coverage: exact cylinder total/lateral and paired volume.
 for(const skill of ['total-surface','lateral-surface','surface-and-volume']){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:850}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',e=>pageErrors.push('R76 cylinder '+skill+': '+e.message));
   await p.goto(base+'/surface-area-worksheets/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r76-cylinder]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const original=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-r76-cylinder-mode]').selectOption(skill);
   for(const output of ['questions','answers','steps']){
    const awaiting=p.waitForEvent('download',{timeout:40000});
    await p.locator('[data-action="r76-cylinder-'+output+'"]').click();
    let dl;try{dl=await awaiting}catch(e){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R76 '+skill+'/'+output+' '+status+'; '+e);
    }
    const pdf=await verifyPdf(dl,'R76 cylinder '+skill+' '+output,{paper:'A4'});
    assert.equal(pdf.getPageCount(),3);
    assert.match(pdf.getTitle()??'',/R76\.1/);
    assert.match(pdf.getTitle()??'',new RegExp(output));
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),original);
   if(skill==='surface-and-volume')
    await p.screenshot({path:join(out,'r76-cylinder-student-controls.png'),fullPage:true});
  }finally{await ctx.close();}
 }
 events.push({kind:'interaction',name:'R76 nine actual A4 cylinder net student, key, steps downloads with original prism worksheets untouched',status:'pass'});
 // R77 real statistical frequency dot plot browser downloads (not counting pictures).
 for(const skill of ['plot','frequency','mode','median','range']){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:850}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',e=>pageErrors.push('R77 statistical '+skill+': '+e.message));
   await p.goto(base+'/mean-median-mode-range-worksheets/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r77-frequency-dotplot]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const initial=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-r77-dotplot-mode]').selectOption(skill);
   for(const output of ['questions','answers','steps']){
    const awaiting=p.waitForEvent('download',{timeout:45000});
    await p.locator('[data-action="r77-dotplot-'+output+'"]').click();
    let dl;try{dl=await awaiting}catch(e){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R77 '+skill+'/'+output+' '+status+'; '+String(e));
    }
    const pdf=await verifyPdf(dl,'R77 '+skill+' '+output,{paper:'A4'});
    assert.equal(pdf.getPageCount(),3);
    assert.match(pdf.getTitle()??'',/R77\.1/);
    assert.match(pdf.getTitle()??'',new RegExp(output));
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),initial);
   if(skill==='plot')
    await p.screenshot({path:join(out,'r77-real-statistical-dotplot-panel.png'),fullPage:true});
  }finally{await ctx.close();}
 }
 events.push({kind:'interaction',name:'R77 15 actual statistical frequency dot plot A4 downloads, original statistics unaffected',status:'pass'});
 // R78 actual proportional solid-net student, key and worked PDFs on both existing routes.
 for(const trial of [
  {topic:'volume-of-rectangular-prisms-worksheets',skill:'triangular-prism-volume'},
  {topic:'surface-area-worksheets',skill:'triangular-prism-surface'},
  {topic:'surface-area-worksheets',skill:'square-pyramid-surface'},
  {topic:'surface-area-worksheets',skill:'regular-tetrahedron-surface'}
 ]){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:850}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',error=>pageErrors.push('R78 '+trial.skill+': '+error.message));
   await p.goto(base+'/'+trial.topic+'/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r78-solids]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const original=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-r78-solid-mode]').selectOption(trial.skill);
   for(const output of ['questions','answers','steps']){
    const pending=p.waitForEvent('download',{timeout:40000});
    await p.locator('[data-action="r78-solids-'+output+'"]').click();
    let dl;
    try{dl=await pending}catch(error){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R78 '+trial.skill+' '+output+' download: '+status+' / '+String(error));
    }
    const pdf=await verifyPdf(dl,'R78 '+trial.skill+' '+output,{paper:'A4'});
    assert.equal(pdf.getPageCount(),3);
    assert.match(pdf.getTitle()??'',/R78\.1/);
    assert.match(pdf.getTitle()??'',new RegExp(output));
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),original);
   if(trial.skill==='square-pyramid-surface')
    await p.screenshot({path:join(out,'r78-pyramid-net-controls.png'),fullPage:true});
  }finally{await ctx.close()}
 }
 events.push({kind:'interaction',name:'R78 12 genuine A4 PDF prism/pyramid net downloads with v18 worksheets preserved',status:'pass'});
 // R79 actual mixed one-PDF downloads on both original geometry routes.
 for(const topic of ['volume-of-rectangular-prisms-worksheets','surface-area-worksheets']){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:850}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',error=>pageErrors.push('R79 '+topic+': '+error.message));
   await p.goto(base+'/'+topic+'/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r79-mixed-solid]').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const original=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   await p.locator('[data-r79-mixed-solid-mode]').selectOption('mixed');
   for(const output of ['questions','answers','steps']){
    const pending=p.waitForEvent('download',{timeout:50000});
    await p.locator('[data-action="r79-mixed-solid-'+output+'"]').click();
    let download;
    try{download=await pending}catch(error){
     const status=await p.locator('[data-status]').innerText();
     throw new Error('R79 '+topic+'/'+output+' '+status+' '+String(error));
    }
    const pdf=await verifyPdf(download,'R79 '+topic+' '+output,{paper:'A4'});
    assert.equal(pdf.getPageCount(),3);
    assert.match(pdf.getTitle()??'',/R79\.1/);
    assert.match(pdf.getTitle()??'',new RegExp(output));
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),original);
   if(topic==='surface-area-worksheets')
    await p.screenshot({path:join(out,'r79-real-mixed-solid-workbook.png'),fullPage:true});
  }finally{await ctx.close()}
 }
 events.push({kind:'interaction',name:'R79 6 true mixed prism/cylinder A4 student, key, steps downloads and v18 unaffected',status:'pass'});
 // R80 actual student, teacher and worked downloads for BOTH real surface net modules.
 for(const kind of ['nets','composite']){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:850}});
  try{
   const p=await ctx.newPage();
   p.on('pageerror',e=>pageErrors.push('R80 '+kind+': '+e.message));
   await p.goto(base+'/surface-area-worksheets/',{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-r80-'+kind+']').count(),1);
   assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
   const old=await p.locator('.problem .q').first().innerText();
   await p.locator('[data-field="paper"]').selectOption('A4');
   assert.equal(await p.locator('[data-r80-'+kind+'-mode]').count(),1,'R80 skill selector must exist');
   await p.locator('[data-r80-'+kind+'-mode]').selectOption('mixed');
   for(const edition of ['questions','answers','steps']){
    const pending=p.waitForEvent('download',{timeout:50000});
    await p.locator('[data-action="r80-'+kind+'-'+edition+'"]').click();
    let dl;try{dl=await pending}catch(error){
     throw new Error('R80 '+kind+' '+edition+': '+await p.locator('[data-status]').innerText()+'; '+String(error));
    }
    const pdf=await verifyPdf(dl,'R80 '+kind+' '+edition,{paper:'A4'});
    assert.equal(pdf.getPageCount(),4);
    assert.match(pdf.getTitle()??'',/R80/);
    assert.match(pdf.getTitle()??'',new RegExp(edition));
   }
   assert.equal(await p.locator('.problem .q').first().innerText(),old);
   if(kind==='composite')await p.screenshot({path:join(out,'r80-real-composite-net-download-panel.png'),fullPage:true});
  }finally{await ctx.close();}
 }
 events.push({kind:'interaction',name:'R80 six true 4-page net/composite A4 teacher and student PDFs, original surface area unchanged',status:'pass'});
 // R84 Chromium: 4 isolated sessions, 3 real PDFs per session.
 // Chromium limits automatic multi-file downloads within a single tab;
 // these are separate teacher activities, not 12 automated downloads per tab.
 await page.goto(base+'/multiplication-worksheets/',{waitUntil:'networkidle'});
 const r84Original=await page.locator('.problem .q').first().innerText();
 const r84Selector=page.locator('[data-r84-multiplication-mode]');
 assert.equal(await r84Selector.count(),1);
 assert.equal(await page.locator('[data-r84-multiplication-models] [data-action="share-extra"]').count(),1);
 for(const task of ['mixed','arrays','number-line','stories']){
  const r84Context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
  try{
   const r84Page=await r84Context.newPage();
   await r84Page.goto(base+'/multiplication-worksheets/',{waitUntil:'networkidle'});
   await r84Page.locator('[data-field="paper"]').selectOption('A4');
   await r84Page.locator('[data-r84-multiplication-mode]').selectOption(task);
   for(const edition of ['questions','answers','steps']){
    const pending=r84Page.waitForEvent('download',{timeout:45000});
    await r84Page.locator('[data-action="r84-multiplication-'+edition+'"]').click();
    let file;
    try{file=await pending;}catch(error){
     const message=await r84Page.locator('[data-status]').innerText();
     throw new Error('R84 isolated download '+task+' / '+edition+' failed: '+message+'; '+String(error));
    }
    const filename=file.suggestedFilename();
    assert.ok(filename.includes('multiplication-visual-'+task+'-'+edition+'-seed'),filename);
    assert.ok(filename.endsWith('-r84.pdf'),filename);
    const doc=await verifyPdf(file,'R84 '+task+' '+edition,{paper:'A4'});
    assert.equal(doc.getPageCount(),4);
    assert.match(doc.getTitle()??'',/R84/);
   }
   assert.equal(await r84Page.locator('.problem .q').first().innerText(),r84Original);
  }finally{await r84Context.close();}
 }
 await r84Selector.selectOption('number-line');
 await page.locator('[data-r84-multiplication-models] [data-action="share-extra"]').click();
 const r84Url=await page.evaluate(()=>navigator.clipboard.readText());
 assert.equal(new URL(r84Url).searchParams.get('xp_r84-multiplication-mode'),'number-line');
 await page.goto(r84Url,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r84-multiplication-mode]').inputValue(),'number-line');
 assert.equal(await page.locator('.problem .q').first().innerText(),r84Original);
 assert.match(await page.locator('[data-status]').innerText(),/Restored 1 optional PDF setting/);
 events.push({kind:'interaction',name:'R84 isolated Chromium sessions: 12 PDFs and link restore, stable base v18',status:'pass'});
 // R82 share-link regressions: original v18 identity remains intact.
 const extensionShareChecks=[
  {route:'two-step-equations-worksheets',selections:[['equation-kind','fraction']],pdfAction:'equation-pack-questions',filename:/fraction.*questions.*\.pdf$/i},
  {route:'fractions-worksheets',selections:[['fraction-line-task','plot'],['fraction-line-range','zero-two']],pdfAction:'fraction-line-questions',filename:/fraction-number-line.*plot.*zero-two.*questions.*\.pdf$/i},
  {route:'addition-worksheets',selections:[['decimal-add-sub-places','hundredths'],['decimal-add-sub-regrouping','yes']],pdfAction:'decimal-add-sub-questions',filename:/decimal.*questions.*\.pdf$/i},
  {route:'surface-area-worksheets',selections:[['r80-nets-mode','square-pyramid'],['r80-composite-mode','right-step']],pdfAction:'r80-nets-questions',filename:/surface-area-nets-square-pyramid-questions.*\.pdf$/i}
 ];
 for(const spec of extensionShareChecks){
  await page.goto(base+'/'+spec.route+'/',{waitUntil:'networkidle'});
  const oldQuestion=await page.locator('.problem .q').first().innerText();
  for(const [key,value] of spec.selections)await page.locator('[data-'+key+']').selectOption(value);
  await page.locator('[data-action="share"]').click();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  const copiedUrl=new URL(copied);
  assert.equal(copiedUrl.origin,base);
  assert.equal(copiedUrl.pathname,'/'+spec.route+'/');
  assert.equal(copiedUrl.searchParams.get('gv'),'18');
  assert.equal(copiedUrl.searchParams.get('xpv'),'1');
  for(const [key,value] of spec.selections)assert.equal(copiedUrl.searchParams.get('xp_'+key),value);
  assert.ok(!copied.toLowerCase().includes('student'), 'No student response should appear in copied URLs');
  await page.goto(copied,{waitUntil:'networkidle'});
  assert.equal(await page.locator('.problem .q').first().innerText(),oldQuestion);
  for(const [key,value] of spec.selections)assert.equal(await page.locator('[data-'+key+']').inputValue(),value);
  const download=page.waitForEvent('download',{timeout:50000});
  await page.locator('[data-action="'+spec.pdfAction+'"]').click();
  const exported=await download;
  assert.match(exported.suggestedFilename(),spec.filename,spec.route+' extension PDF mode filename');
  await verifyPdf(exported,'R82 restored '+spec.route);
 }
 await page.goto(base+'/surface-area-worksheets/?gv=18&seed=20261104&difficulty=standard&quantity=8&paper=Letter&xpv=1&xp_r80-nets-mode=not-a-real-option&xp_equation-kind=fraction',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r80-nets-mode]').inputValue(),'mixed','Invalid extra options should be ignored');
 events.push({kind:'interaction',name:'R82 four extension share links restore 8 selected options with actual matching PDF downloads; injection rejected',status:'pass'});
 // R83: verify each extra PDF panel has a share shortcut near the download
 // buttons. The shortcut shares selected pack choices, not student answers.
 await page.goto(base+'/surface-area-worksheets/',{waitUntil:'networkidle'});
 const r83Nets=page.locator('[data-r80-nets] [data-action="share-extra"]');
 const r83Composite=page.locator('[data-r80-composite] [data-action="share-extra"]');
 assert.equal(await r83Nets.count(),1);
 assert.equal(await r83Composite.count(),1);
 assert.equal(await page.locator('[data-print-calibration] [data-action="share-extra"]').count(),0,'Printer scale panel must not receive a pack share action');
 await page.locator('[data-r80-nets-mode]').selectOption('regular-tetrahedron');
 await page.locator('[data-r80-composite-mode]').selectOption('left-step');
 await r83Nets.click();
 const r83Share=await page.evaluate(()=>navigator.clipboard.readText());
 assert.equal(new URL(r83Share).searchParams.get('xp_r80-nets-mode'),'regular-tetrahedron');
 assert.equal(new URL(r83Share).searchParams.get('xp_r80-composite-mode'),'left-step');
 assert.match(await page.locator('[data-status]').innerText(),/Copied reproducible worksheet and extra PDF settings/);
 await page.goto(r83Share,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r80-nets-mode]').inputValue(),'regular-tetrahedron');
 assert.equal(await page.locator('[data-r80-composite-mode]').inputValue(),'left-step');
 assert.match(await page.locator('[data-status]').innerText(),/Restored 2 optional PDF settings/);
 const r83Pdf=page.waitForEvent('download',{timeout:50000});
 await page.locator('[data-action="r80-nets-questions"]').click();
 const r83DL=await r83Pdf;
 assert.match(r83DL.suggestedFilename(),/surface-area-nets-regular-tetrahedron-questions.*\.pdf$/i);
 await verifyPdf(r83DL,'R83 contextual net PDF');
 await page.goto(base+'/two-step-equations-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-r65-equation-pack] [data-action="share-extra"]').count(),1);
 await page.locator('[data-equation-kind]').selectOption('fraction');
 await page.locator('[data-r65-equation-pack] [data-action="share-extra"]').click();
 const r83EquationLink=await page.evaluate(()=>navigator.clipboard.readText());
 assert.equal(new URL(r83EquationLink).searchParams.get('xp_equation-kind'),'fraction');
 await page.goto(r83EquationLink,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-equation-kind]').inputValue(),'fraction');
 assert.match(await page.locator('[data-status]').innerText(),/Restored 1 optional PDF setting/);
 events.push({kind:'interaction',name:'R83 contextual share buttons in two distant optional PDF panels: copy, reload, restore, and exact geometry PDF download',status:'pass'});
 // The opt-in answer checker, seed changes and PDF export must not send any
 // student response, score, generator seed or configuration over HTTP.
 await page.goto(`${base}/addition-worksheets/`,{waitUntil:'networkidle'});
 const beforeInteractiveRequests=httpRequests.length;
 await page.locator('[data-action="regenerate"]').click();
 await page.locator('[data-action="practice"]').click();
 await page.locator('[data-practice-input="0"]').fill('13/17');
 await page.locator('[data-action="check-practice"]').click();
 const privacyPdf=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 const privacyDownload=await privacyPdf;
 assert.match(privacyDownload.suggestedFilename(),/\.pdf$/i);
 assert.equal(httpRequests.length,beforeInteractiveRequests,
  'A local-only generate/check/export interaction unexpectedly issued HTTP requests');
 assert.deepEqual(offsiteRequests,[],'Third-party requests violate the initial-release privacy disclosure');
 assert.deepEqual(badResponses,[],'Missing or failed local assets');
 const r42={status:'PASS',scope:'Chromium built SSG only; not production network',
  disabledJavaScriptRoutes:staticChecks.length,screenshots:[...screenshots],
  totalLocalHttpRequests:httpRequests.length,thirdPartyRequests:offsiteRequests.length,
  interactionHttpRequests:httpRequests.length-beforeInteractiveRequests,
  failedHttpResponses:badResponses.length,
  privacyClaim:'Seed generation, exact grading and PDF export produced zero HTTP requests after page load'};
 writeFileSync(join(out,'r42-release-browser-preflight.json'),JSON.stringify(r42,null,2));
 events.push({kind:'release-preflight',...r42});
 assert.deepEqual(pageErrors,[],'Browser encountered uncaught JavaScript exceptions');
 events.push({kind:'runtime',pageErrors});
 await context.close();
 writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS',browser:executablePath,base:'local built SSG',events},null,2));
 console.log(`CHROMIUM QA PASS: ${events.length} evidence checks; screenshots and PDFs in ${out}`);
} catch(error){
 writeFileSync(join(out,'report.json'),JSON.stringify({status:'FAIL',browser:executablePath??null,events,error:String(error?.stack??error)},null,2));
 throw error;
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
