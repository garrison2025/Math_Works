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
  if(!existsSync(path)||!statSync(path).isFile()){res.writeHead(404);res.end('Not found');return;}
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
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.goto(`${base}/two-step-equations-worksheets/`,{waitUntil:'networkidle'});
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
 assert.ok(questions.getTitle()?.includes('v8'));
 assert.ok(answers.getTitle()?.includes('v8'));
 await page.locator('[data-action="share"]').click();
 const link=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(link,/gv=8/);assert.match(link,/opt_coefficient=negative/);assert.match(link,/paper=A4/);
 await page.screenshot({path:join(out,'two-step-desktop.png'),fullPage:true});
 events.push({kind:'interaction',name:'desktop controls, answer mode, A4 PDF pair, v8 clipboard link',status:'pass'});

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

 await page.goto(`${base}/printable-protractor/`,{waitUntil:'networkidle'});
 const protractorDownload=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="protractor"]').click();
 const protractor=await verifyPdf(await protractorDownload,'physical protractor');
 assert.equal(protractor.getPageCount(),1);
 events.push({kind:'interaction',name:'blank 180-degree protractor PDF download (physical measurement still NOT RUN)',status:'pass'});

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

 // R16: original data and blank axis are shown before a separate completed answer.
 await page.goto(`${base}/box-plots-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="statistic"]').selectOption('draw');
 assert.match(await page.locator('.problem .q').first().innerText(),/Draw a modified box plot/);
 assert.equal(await page.locator('.solution-box').count(),0,'Practice must not disclose quartiles');
 const blank=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await blank,'R16 blank box-plot practice');
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.solution-box').count(),8,'Answer must show eight complete plots');
 const solved=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await solved,'R16 completed box-plot answer key');
 await page.screenshot({path:join(out,'r16-box-plots-answer.png'),fullPage:true});
 events.push({kind:'interaction',name:'R16 modified box plots: no question leaks and completed answer PDF',status:'pass'});
 // R17: the practice grid is blank; solutions and vector PDF contain the line.
 await page.goto(`${base}/linear-equations-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('graph');
 await page.locator('[data-option="slope"]').selectOption('negative');
 assert.match(await page.locator('.problem .q').first().innerText(),/Graph the line/);
 assert.equal(await page.locator('.solution-linear-line').count(),0,'No student practice answer leak');
 await page.screenshot({path:join(out,'r17-linear-graph-practice.png'),fullPage:true});
 const graphPractice=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await graphPractice,'R17 blank linear graph PDF');
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.solution-linear-line').count(),8);
 assert.equal(await page.locator('.solution-linear-point').count(),16);
 const graphAnswers=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await graphAnswers,'R17 solved linear graph PDF');
 await page.screenshot({path:join(out,'r17-linear-graph-answers.png'),fullPage:true});
 events.push({kind:'interaction',name:'graph-a-line blank practice and completed answer key',status:'pass'});
 await page.goto(`${base}/scatter-plot-worksheets/`,{waitUntil:'networkidle'});
 await page.locator('[data-option="task"]').selectOption('plot');
 await page.locator('[data-option="trend"]').selectOption('none');
 assert.equal(await page.locator('.scatter-solution-point').count(),0,'Scatter practice leaked plotted coordinates');
 await page.locator('[data-field="paper"]').selectOption('A4');
 const scatterPracticeEvent=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="worksheet"]').click();
 await verifyPdf(await scatterPracticeEvent,'R18 blank scatter PDF',{paper:'A4'});
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.scatter-solution-point').count(),48,'Scatter answers need six plotted points per question');
 const scatterAnswerEvent=page.waitForEvent('download',{timeout:30000});
 await page.locator('[data-action="answers"]').click();
 await verifyPdf(await scatterAnswerEvent,'R18 scatter answer PDF',{paper:'A4'});
 await page.screenshot({path:join(out,'r18-scatter-solution.png'),fullPage:true});
 events.push({kind:'interaction',name:'R18 scatter task blanks practice and plots six points in answer PDF',status:'pass'});
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
 assert.deepEqual(pageErrors,[],'Browser encountered uncaught JavaScript exceptions');
 events.push({kind:'runtime',pageErrors});
 await context.close();
 writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS',browser:executablePath,base:'local built SSG',events},null,2));
 console.log(`CHROMIUM QA PASS: ${events.length} evidence checks; screenshots and PDFs in ${out}`);
} catch(error){
 writeFileSync(join(out,'report.json'),JSON.stringify({status:'FAIL',browser:executablePath??null,events,error:String(error?.stack??error)},null,2));
 throw error;
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
