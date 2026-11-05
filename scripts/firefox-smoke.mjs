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
 assert.match(pdf.getTitle()??'',/generator v10/);
 checks.push({name:'general elimination systems and Firefox A4 PDF',status:'pass',pdf:dl.suggestedFilename()});
 await page.locator('[data-option="method"]').selectOption('parallel');
 await page.locator('[data-mode="answers"]').click();
 assert.match((await page.locator('.problem .answer-text').first().innerText()).trim(),/Answer:\s*no solution$/);
 await page.locator('[data-option="method"]').selectOption('coincident');
 assert.match((await page.locator('.problem .answer-text').first().innerText()).trim(),/Answer:\s*infinitely many solutions$/);
 await page.locator('[data-mode="questions"]').click();
 checks.push({name:'parallel and coincident systems in Firefox',status:'pass'});
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
 assert.deepEqual(errors,[],'Firefox uncaught JavaScript errors');
 writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS',checks,errors},null,2));
 console.log(`FIREFOX QA PASS: ${checks.length} checks`);
 await context.close();
}catch(error){writeFileSync(join(out,'report.json'),JSON.stringify({status:'FAIL',checks,error:String(error?.stack??error)},null,2));throw error;}
finally{if(browser)await browser.close();await new Promise(done=>server.close(done));}
