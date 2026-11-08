/** R101 exact Astro dist Chromium / Firefox browser QA for every supplemental mode. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream,existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {join,resolve,extname,sep} from 'node:path';
import {chromium,firefox} from 'playwright-core';
import {PDFDocument} from 'pdf-lib';
const choice=process.argv[2];
if(choice!=='chromium'&&choice!=='firefox')throw Error('Usage: node scripts/r101-browser-qa.mjs chromium|firefox');
const directory=resolve('dist'),out=resolve('qa-artifacts/r101-browser/'+choice);
if(!existsSync(join(directory,'index.html')))throw Error('R101 must test built exact Astro dist');
mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
const server=createServer((req,res)=>{
 try{
  const path=new URL(req.url||'/','http://localhost').pathname;
  let file=resolve(directory,'.'+decodeURIComponent(path));
  if(file!==directory&&!file.startsWith(directory+sep)){res.writeHead(403);res.end();return;}
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const executables=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const binary=executables.find(existsSync);
const browserType=choice==='chromium'?chromium:firefox;
let browser;const evidence=[];
try{
 if(choice==='chromium'&&!binary)throw Error('Chrome executable missing');
 browser=await browserType.launch(choice==='chromium'?{executablePath:binary,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}:{headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.setDefaultTimeout(15000);
 const open=async(slug)=>{
  const res=await page.goto(base+'/'+slug+'/',{waitUntil:'networkidle',timeout:30000});
  assert.equal(res?.status(),200,'Missing R101 browser route '+slug);
  assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
  assert.equal(await page.locator('link[rel=canonical]').count(),0,'Unapproved preview canonical');
  assert.equal(await page.locator('[data-wide-workspace]').count(),1);
  const size=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(size.body<=size.viewport+3,'Mobile horizontal overflow '+slug+' '+JSON.stringify(size));
 };
 const scenarios=[
  ['worksheets-by-grade','grade2'],['worksheets-by-grade','grade5'],
  ['geometry-general-worksheets','real-shapes'],['geometry-general-worksheets','shapes'],
  ['geometry-general-worksheets','polygon-sides'],['geometry-general-worksheets','congruent'],
  ['geometry-general-worksheets','similar'],['geometry-general-worksheets','triangles'],
  ['geometry-general-worksheets','circles'],['geometry-general-worksheets','volumes'],
  ['word-problems-worksheets','equation-stories']
 ];
 for(const [route,mode] of scenarios){
  await open(route);
  await page.locator('[data-wide-mode]').selectOption(mode);
  await page.locator('[data-wide-paper]').selectOption(mode==='grade2'?'A4':'Letter');
  await page.locator('[data-wide-count]').selectOption('16');
  assert.equal(await page.locator('[data-wide-list] > li').count(),16);
  const start=await page.locator('[data-wide-list] > li > p:first-child').allTextContents();
  assert.equal(start.length,16);
  assert.ok(start.every(x=>x.trim().length>=10),'Blank or unexpectedly short question preview');
  assert.equal(await page.locator('.wide-answer').count(),0,'Answer leak before reveal');
  await page.locator('[data-wide-toggle]').click();
  assert.equal(await page.locator('.wide-answer').count(),16);
  assert.equal(await page.locator('.wide-steps').count(),16);
  await page.locator('[data-wide-toggle]').click();
  assert.equal(await page.locator('.wide-answer').count(),0,'Answer leak after hide');
  assert.deepEqual(await page.locator('[data-wide-list] > li > p:first-child').allTextContents(),start,'Toggling changed seeded questions');
  const editions=mode==='grade2'||mode==='congruent'||mode==='similar'||mode==='equation-stories'?['questions','answers','steps']:['questions'];
  for(const edition of editions){
   const waiting=page.waitForEvent('download',{timeout:60000});
   await page.locator('[data-wide-download="'+edition+'"]').click();
   const dl=await waiting,filename=dl.suggestedFilename();
   assert.ok(filename.includes('-'+mode+'-')&&filename.endsWith('-'+edition+'.pdf'),filename);
   const dest=join(out,filename);await dl.saveAs(dest);
   const pdf=await PDFDocument.load(readFileSync(dest));
   assert.ok(pdf.getPageCount()>=1);
   assert.ok(Math.abs(pdf.getPage(0).getWidth()-(mode==='grade2'?595.28:612))<.15);
   assert.ok((pdf.getTitle()||'').includes('WM1-20261108-'+mode+'-standard-16'));
   assert.ok((pdf.getTitle()||'').includes(edition));
  }
  await page.locator('[data-wide-seed]').fill('314159');
  await page.locator('[data-wide-seed]').dispatchEvent('change');
  assert.notDeepEqual(await page.locator('[data-wide-list] > li > p:first-child').allTextContents(),start,'New seed did not change questions');
  evidence.push({route,mode,questions:16,pdfEditions:editions.length,paper:mode==='grade2'?'A4':'Letter',viewport:390});
 }
 await open('geometry-general-worksheets');
 await page.locator('[data-wide-mode]').selectOption('polygon-sides');
 assert.equal(await page.locator('.wide-diagram svg').count(),8,'Expected vector polygon diagrams');
 const before=await page.locator('[data-wide-list] > li > p:first-child').allTextContents();
 await page.goto(base+'/geometry-general-worksheets/?wm_seed=20261108&wm_mode=polygon-sides&wm_count=8&wm_level=standard&wm_paper=A4',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-wide-mode]').inputValue(),'polygon-sides');
 assert.deepEqual(await page.locator('[data-wide-list] > li > p:first-child').allTextContents(),before);
 await page.setViewportSize({width:1280,height:900});
 const desktop=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth}));
 assert.ok(desktop.body<=desktop.viewport+3,'R101 desktop overflow');
 await page.screenshot({path:join(out,'r101-geometry-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:join(out,'r101-geometry-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[],'R101 browser JavaScript errors');
 writeFileSync(join(out,'summary.json'),JSON.stringify({result:'PASS',browser:choice,scenarios:evidence,errorCount:0,noindex:true,desktopMobile:true},null,2)+'\n');
 console.log('R101 '+choice+' PASS: '+evidence.length+' real mode scenarios, multi-edition PDF downloads, 390px/1280px, deterministic URL replay, noindex');
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
