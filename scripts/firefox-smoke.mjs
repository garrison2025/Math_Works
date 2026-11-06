/** Firefox cross-browser QA on the exact static bundle built by Astro.
 * No external API or student data. Runs in GitHub Actions via Playwright Firefox.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream,existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {join,resolve,extname,sep} from 'node:path';
import {firefox} from 'playwright-core';
import {PDFDocument} from 'pdf-lib';

const root=resolve('dist'),out=resolve('qa-artifacts/firefox');
if(!existsSync(join(root,'index.html')))throw Error('Run npm run build before Firefox QA');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain'};
const server=createServer((req,res)=>{
 try{
  const pathURL=new URL(req.url??'/', 'http://localhost');
  let file=resolve(root,'.'+decodeURIComponent(pathURL.pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});
  createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const address=`http://127.0.0.1:${server.address().port}`;
let browser;const checks=[];
try{
 browser=await firefox.launch({headless:true});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const open=async url=>page.goto(`${address}/${url}/`,{waitUntil:'networkidle'});
 await open('systems-equations-worksheets');
 assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 assert.equal(await page.locator('.problem').count(),8);
 await page.locator('[data-option="method"]').selectOption('general');
 await page.locator('[data-option="solutions"]').selectOption('negative');
 const q=await page.locator('.problem .q').first().innerText();
 assert.match(q,/^Solve the system: -?\d+x [±+−] \d+y =/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const qa=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="worksheet"]').click();
 const dl=await qa,filepath=join(out,dl.suggestedFilename());
 await dl.saveAs(filepath);const pdf=await PDFDocument.load(readFileSync(filepath));
 assert.ok(pdf.getPageCount()>=1);assert.ok(Math.abs(pdf.getPage(0).getWidth()-595.28)<0.1);
 assert.match(pdf.getTitle()??'',/generator v18/);
 checks.push({name:'general elimination systems and Firefox A4 PDF',status:'pass',pdf:dl.suggestedFilename()});

 await page.locator('[data-option="method"]').selectOption('parallel');
 await page.locator('[data-mode="answers"]').click();
 assert.match((await page.locator('.problem .answer-text').first().innerText()).trim(),/Answer:\s*no solution$/);
 await page.locator('[data-option="method"]').selectOption('coincident');
 assert.match((await page.locator('.problem .answer-text').first().innerText()).trim(),/Answer:\s*infinitely many solutions$/);
 await page.locator('[data-mode="questions"]').click();
 checks.push({name:'parallel and coincident systems in Firefox',status:'pass'});
 await open('order-of-operations-worksheets');
 await page.locator('[data-option="skill"]').selectOption('division');
 await page.locator('[data-option="grouping"]').selectOption('parentheses');
 assert.match(await page.locator('.problem .q').first().innerText(),/^\(\d+ \+ \d+\) ÷ \d+ × \d+ = ____$/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const r26Download=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="worksheet"]').click();
 const r26File=await r26Download;
 const r26Path=join(out,r26File.suggestedFilename());await r26File.saveAs(r26Path);
 const r26PDF=await PDFDocument.load(readFileSync(r26Path));
 assert.match(r26PDF.getTitle()??'',/generator v18/);
 assert.ok(Math.abs(r26PDF.getPage(0).getWidth()-595.28)<0.1);
 checks.push({name:'R26 Firefox exact division and grouped expressions A4 PDF',status:'pass'});

 await open('long-division-worksheets');
 await page.locator('[data-option="divisorDigits"]').selectOption('two');
 await page.locator('[data-option="dividendDigits"]').selectOption('four');
 await page.locator('[data-option="remainder"]').selectOption('no');
 const example=await page.locator('.problem .q').first().innerText();
 const divisionMatch=example.match(/^(\d+) ÷ (\d+) = ____/);
 assert.ok(divisionMatch&&divisionMatch[1].length===4&&Number(divisionMatch[2])>=11);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const longEvent=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="worksheet"]').click();
 const longFile=await longEvent;
 const longPath=join(out,longFile.suggestedFilename());await longFile.saveAs(longPath);
 const longPdf=await PDFDocument.load(readFileSync(longPath));
 assert.ok(longPdf.getTitle()?.includes('generator v18'));
 assert.ok(Math.abs(longPdf.getPage(0).getWidth()-595.28)<0.1);
 checks.push({name:'R27 Firefox long division two-digit divisors, four-digit dividends and A4 PDF',status:'pass'});


 await open('domain-range-worksheets');
 await page.locator('[data-option="relation"]').selectOption('not-function');
 await page.locator('[data-option="task"]').selectOption('function-test');
 assert.equal((await page.locator('.problem .q').first().innerText()).includes('a function?'),true);
 await page.locator('[data-mode="answers"]').click();
 assert.match((await page.locator('.problem .answer-text').first().innerText()).trim(),/Answer:\s*no$/);
 await page.locator('[data-mode="questions"]').click();
 await page.locator('[data-option="task"]').selectOption('range');
 const prompt=await page.locator('.problem .q').first().innerText();
 assert.equal([...prompt.matchAll(/\((-?\d+),(-?\d+)\)/g)].length,4);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),0);
 checks.push({name:'non-function relations and masked practice answers',status:'pass'});
 await open('percentages-worksheets');
 await page.locator('[data-option="direction"]').selectOption('percent-change');
 assert.match(await page.locator('.problem .q').first().innerText(),/^Find the percentage (increase|decrease) from \d+ to \d+\.$/);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').click();
 await page.locator('[data-option="direction"]').selectOption('percent-of-number');
 assert.match(await page.locator('.problem .q').first().innerText(),/^Find \d+% of \d+\.$/);
 const pctDownload=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="worksheet"]').click();
 const pct=await pctDownload,pctPath=join(out,pct.suggestedFilename());
 await pct.saveAs(pctPath);
 const pctDoc=await PDFDocument.load(readFileSync(pctPath));
 assert.ok(pctDoc.getTitle()?.includes('v18'));
 assert.ok(pctDoc.getPageCount()>=1);
 checks.push({name:'R23 Firefox percent change, exact percent of amount, worksheet PDF',status:'pass'});
 await open('scientific-notation-worksheets');
 await page.locator('[data-option="direction"]').selectOption('to-scientific');
 await page.locator('[data-option="exponentSign"]').selectOption('negative');
 await page.locator('[data-option="significantDigits"]').selectOption('3');
 assert.match(await page.locator('.problem .q').first().innerText(),/Write 0\.0+\d+ in scientific notation/);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').click();
 checks.push({name:'R25 Firefox exact negative scientific notation and answer masking',status:'pass'});
 await open('fractions-worksheets');
 await page.locator('[data-option="operation"]').selectOption('division');
 await page.locator('[data-option="denominators"]').selectOption('unlike');
 assert.match(await page.locator('.problem .q').first().innerText(),/^\d+\/\d+ ÷ \d+\/\d+ = ____$/);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').click();
 const fracDownload=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="steps"]').click();
 const fracDl=await fracDownload,fracPath=join(out,fracDl.suggestedFilename());
 await fracDl.saveAs(fracPath);
 const fracPdf=await PDFDocument.load(readFileSync(fracPath));
 assert.match(fracPdf.getTitle()??'',/generator v18/);
 checks.push({name:'R24 Firefox fraction division with unlike denominators and steps PDF',status:'pass'});
 await open('linear-equations-worksheets');
 await page.locator('[data-option="task"]').selectOption('graph');
 assert.equal(await page.locator('.solution-linear-line').count(),0);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.solution-linear-line').count(),8);
 checks.push({name:'linear graph practice masked and answer revealed in Firefox',status:'pass'});
 await page.locator('[data-mode="questions"]').click();
 await open('scatter-plot-worksheets');
 await page.locator('[data-option="task"]').selectOption('plot');
 assert.equal(await page.locator('.scatter-solution-point').count(),0);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.scatter-solution-point').count(),48);
 checks.push({name:'R18 Firefox scatter plot practice hides points and answer plots all six',status:'pass'});
 await page.locator('[data-mode="questions"]').click();
 await open('pythagorean-worksheets');
 await page.locator('[data-option="task"]').selectOption('missing-leg');
 assert.match(await page.locator('.diagram-vector').first().innerHTML(),/>\? units<\/text>/);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 assert.ok((await page.locator('.problem .diagram-vector').first().innerHTML()).includes('units'));
 checks.push({name:'R19 Firefox Pythagorean missing-leg answer-blind practice and revealed answers',status:'pass'});
 await page.locator('[data-mode="questions"]').click();
 await open('function-tables-worksheets');
 await page.locator('[data-option="task"]').selectOption('input');
 await page.locator('[data-option="missing"]').selectOption('last');
 const fnQ=await page.locator('.problem .diagram-vector').first().innerHTML();
 assert.equal((fnQ.match(/>____<\/text>/g)||[]).length,1);
 await page.locator('[data-mode="answers"]').click();
 const fnA=await page.locator('.problem .diagram-vector').first().innerHTML();
 assert.ok(!fnA.includes('>____</text>'));
 checks.push({name:'R20 Firefox function-table inverse input blank and completed answer cell',status:'pass'});
 await page.locator('[data-mode="questions"]').click();
 await open('mean-median-mode-range-worksheets');
 await page.locator('[data-option="statistic"]').selectOption('mode');
 await page.locator('[data-option="modePattern"]').selectOption('none');
 await page.locator('[data-mode="answers"]').click();
 assert.match(await page.locator('.problem .answer-text').first().innerText(),/no mode/);
 await page.locator('[data-option="modePattern"]').selectOption('two');
 assert.match(await page.locator('.problem .answer-text').first().innerText(),/Answer:.*\d+, \d+/);
 checks.push({name:'R21 bimodal and no-mode statistics in Firefox',status:'pass'});
 await page.locator('[data-mode="questions"]').click();
 await open('mean-absolute-deviation-worksheets');
 await page.locator('[data-option="distribution"]').selectOption('skewed');
 await page.locator('[data-option="size"]').selectOption('6');
 const madText=await page.locator('.problem .q').first().innerText();
 assert.equal(madText.match(/\[([\d, ]+)\]/)?.[1]?.split(', ').length,6);
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 checks.push({name:'R22 fractional MAD and six-value sample selector in Firefox',status:'pass'});
 await open('decimal-place-value-worksheets');
 await page.locator('[data-option="place"]').selectOption('thousandths');
 await page.locator('[data-option="task"]').selectOption('round');
 assert.match(await page.locator('.problem .q').first().innerText(),/^Round \d+\.\d{4} to the nearest thousandths\.$/);
 await page.locator('[data-field="paper"]').selectOption('A4');
 const decimalR28Download=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="answers"]').click();
 const decimalR28=await decimalR28Download,decimalR28File=join(out,decimalR28.suggestedFilename());
 await decimalR28.saveAs(decimalR28File);
 const roundDoc=await PDFDocument.load(readFileSync(decimalR28File));
 assert.ok(roundDoc.getTitle()?.includes('generator v18'));
 assert.ok(Math.abs(roundDoc.getPage(0).getWidth()-595.28)<.1);
 checks.push({name:'R28 Firefox exact thousandths rounding and A4 answer PDF',status:'pass'});

 await open('linear-equations-worksheets');
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'networkidle'});
 const geometry=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth-innerWidth,
  preview:document.querySelector('.preview-panel')?.getBoundingClientRect().y,
  controls:document.querySelector('.settings')?.getBoundingClientRect().y
 }));
 assert.ok(geometry.overflow<=2,`Firefox mobile horizontal overflow: ${geometry.overflow}px`);
 assert.ok(geometry.preview<geometry.controls,'Preview must precede settings on mobile');
 await page.screenshot({path:join(out,'firefox-mobile-390.png'),fullPage:true});
 checks.push({name:'390px mobile viewport and visual evidence',status:'pass'});
 // R45: Firefox must honor the exclusive trapezoid setting in browser output.
 await open('area-of-trapezoids-worksheets');
 await page.locator('[data-option="baseRelation"]').selectOption('unequal');
 const exclusive=await page.locator('.problem .q').allInnerTexts();
 assert.equal(exclusive.length,8);
 assert.ok(exclusive.every(q=>{
  const m=q.match(/bases (\d+), (\d+)/);return m&&m[1]!==m[2];
 }),'Firefox exclusive trapezoid setting failed');
 checks.push({name:'R45 Firefox opt-in exclusive trapezoid definition generates unequal bases',status:'pass'});
 // R53: Firefox shows five independent work rows for four-digit division.
 await open('long-division-worksheets');
 await page.locator('[data-option="dividendDigits"]').selectOption('four');
 const r53Figure=page.locator('svg.long-division-vector').first();
 assert.equal([...(await r53Figure.locator('.division-work-guides').getAttribute('d')).matchAll(/M178 \d+H360/g)].length,5);
 checks.push({name:'R53 Firefox five-row long division writing workspace',status:'pass'});
 // R54 Firefox verifies opt-in pencil space in actual A4 worksheet PDF.
 await open('addition-worksheets');
 await page.locator('[data-field="paper"]').selectOption('A4');
 const r54Before=await page.locator('.problem .q').allInnerTexts();
 await page.locator('[data-field="writing-room"]').selectOption('extra');
 assert.deepEqual(await page.locator('.problem .q').allInnerTexts(),r54Before);
 const r54Event=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="worksheet"]').click();
 const r54Download=await r54Event;
 assert.match(r54Download.suggestedFilename(),/extra-room\.pdf$/);
 const r54Path=join(out,r54Download.suggestedFilename());
 await r54Download.saveAs(r54Path);
 const r54Pdf=await PDFDocument.load(readFileSync(r54Path));
 assert.equal(r54Pdf.getPageCount()>=1,true);
 assert.ok(Math.abs(r54Pdf.getPage(0).getWidth()-595.28)<.1);
 assert.match(r54Pdf.getTitle()??'',/extra writing room/);
 checks.push({name:'R54 Firefox extra writing room A4 vector PDF and unchanged questions',status:'pass'});
 // R57 Firefox Cartesian graphs include one explicitly marked origin.
 await open('coordinate-plane-worksheets');
 const r57Figure=page.locator('.problem svg.diagram-vector').first();
 assert.equal(await r57Figure.locator('.cartesian-origin').textContent(),'0');
 assert.ok((await r57Figure.locator('.cartesian-grid-x').count())%2===1);
 checks.push({name:'R57 Firefox Cartesian origin tick zero and centered scale',status:'pass'});
 // R56 Firefox checks that missing height remains a question mark.
 await open('volume-of-rectangular-prisms-worksheets');
 await page.locator('[data-option="task"]').selectOption('missing-height');
 const r56Svg=page.locator('.problem svg.diagram-vector').first();
 assert.equal(await r56Svg.locator('.prism-height').textContent(),'Height: ?');
 assert.match(await r56Svg.getAttribute('aria-label'),/height unknown/);
 checks.push({name:'R56 Firefox accessible 3D labels preserve the missing-height task',status:'pass'});
 // R52: independent Firefox check that the local-only physical ruler prompt
 // downloads a one-page Letter vector PDF; no measurement is auto-observed.
 await open('addition-worksheets');
 await page.locator('[data-print-calibration] summary').click();
 await page.locator('[data-field="paper"]').selectOption('Letter');
 const scaleEvent=page.waitForEvent('download',{timeout:45000});
 await page.locator('[data-action="calibration"]').click();
 const scaleDl=await scaleEvent;
 const scalePath=join(out,scaleDl.suggestedFilename());await scaleDl.saveAs(scalePath);
 const scalePdf=await PDFDocument.load(readFileSync(scalePath));
 assert.equal(scalePdf.getPageCount(),1);
 assert.ok(Math.abs(scalePdf.getPage(0).getWidth()-612)<.1);
 await page.locator('[data-calibration-axis="horizontal"]').fill('100');
 await page.locator('[data-calibration-axis="vertical"]').fill('100');
 await page.locator('[data-action="check-calibration"]').click();
 assert.match(await page.locator('[data-calibration-result]').innerText(),/user-reported screening result/);
 checks.push({name:'R52 Firefox Letter actual-size printer PDF and self-reported ruler checker',status:'pass'});
 // R64 Firefox: independent chart download buttons and separate complete key.
 await open('multiplication-tables-worksheets');
 assert.equal(await page.locator('[data-action="multiplication-grid-blank"]').count(),1);
 assert.equal(await page.locator('[data-action="multiplication-grid-key"]').count(),1);
 await page.locator('[data-field="paper"]').selectOption('A4');
 for(const mode of ['blank','key']){
  const event=page.waitForEvent('download',{timeout:45000});
  await page.locator('[data-action="multiplication-grid-'+mode+'"]').click();
  const dl=await event;
  const target=join(out,dl.suggestedFilename());
  await dl.saveAs(target);
  const pdf=await PDFDocument.load(readFileSync(target));
  assert.equal(pdf.getPageCount(),1);
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-595.28)<.1);
  assert.match(pdf.getTitle()??'',mode==='blank'?/Blank Worksheet/:/Answer Key/);
 }
 await page.screenshot({path:join(out,'r64-firefox-chart-a4.png'),fullPage:true});
 checks.push({name:'R64 Firefox blank 1-12 multiplication chart and 144-product answer PDF, A4',status:'pass'});

 // R42: independently verify the JS-disabled SSR fallback on four different
 // mathematics categories in Firefox, not only in Chromium.
 const fallback=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const staticPage=await fallback.newPage();
 const firefoxStaticTopics=[
  'addition-worksheets','two-step-equations-worksheets',
  'pythagorean-worksheets','box-plots-worksheets'
 ];
 for(const slug of firefoxStaticTopics){
  const response=await staticPage.goto(`${address}/${slug}/`,{waitUntil:'load'});
  assert.equal(response?.status(),200,`Firefox no-JS route failed: ${slug}`);
  assert.equal(await staticPage.locator('.problem .q').count(),8,`Firefox no-JS question fallback failed: ${slug}`);
  assert.equal(await staticPage.locator('.sample-img').count(),1,`Firefox no-JS sample image missing: ${slug}`);
  assert.equal(await staticPage.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 }
 await staticPage.screenshot({path:join(out,'r42-firefox-nojs-static.png'),fullPage:true});
 await fallback.close();
 checks.push({name:'R42 Firefox four categories work without JavaScript at 390px',status:'pass'});
 assert.deepEqual(errors,[],'Firefox uncaught JavaScript errors');
 writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS',checks,errors},null,2));
 console.log(`FIREFOX QA PASS: ${checks.length} checks`);
 await context.close();
}catch(error){writeFileSync(join(out,'report.json'),JSON.stringify({status:'FAIL',checks,error:String(error?.stack??error)},null,2));throw error;}
finally{if(browser)await browser.close();await new Promise(done=>server.close(done));}
