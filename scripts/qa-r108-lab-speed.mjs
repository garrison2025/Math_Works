/**
 * R108 reproducible local Chromium mobile lab baseline.
 * Measures navigation, paints, layout shifts and requests on the actual static
 * Astro build. NOT Google PageSpeed, CrUX field CWV, or real-user INP.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve('dist'),dir=resolve('qa-artifacts/r108-seo');
mkdirSync(dir,{recursive:true});
assert.ok(existsSync(join(root,'index.html')),'Build Astro in production mode first');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer((req,res)=>{
 try{
  const pathname=new URL(req.url||'/','http://127.0.0.1').pathname;
  let f=resolve(root,'.'+decodeURIComponent(pathname));
  if(f!==root&&!f.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');
  if(!existsSync(f)||!statSync(f).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':mime[extname(f)]||'application/octet-stream','cache-control':'public, max-age=300'});
  createReadStream(f).pipe(res);
 }catch(e){res.writeHead(400);res.end(String(e));}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
const report={schema:'R108-lab-chromium-2026-11-08',source:'local Astro production dist; cold mobile Chromium',note:'Lab measurements only: NOT CrUX field data, PSI Lighthouse score or Google ranking factors',emulation:{width:390,height:844,deviceScaleFactor:2,cpuSlowdown:4,latencyMs:120,downloadMbps:1.6},pages:[],errors:[]};
let browser;
try{
 assert.ok(chrome,'Chrome executable required');
 browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const path of ['/','/worksheets/','/fractions/','/two-step-equations-worksheets/']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();let failed=0;
  page.on('pageerror',e=>report.errors.push(path+': '+e.message));
  page.on('requestfailed',()=>{failed++});
  await page.addInitScript(()=>{
   window.__r108Vitals={lcp:0,cls:0,longTasks:0};
   try{
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.__r108Vitals.lcp=e.startTime;})
      .observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__r108Vitals.cls+=e.value;})
      .observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.__r108Vitals.longTasks++;})
      .observe({type:'longtask',buffered:true});
   }catch{}
  });
  const cdps=await ctx.newCDPSession(page);
  await cdps.send('Network.enable');
  await cdps.send('Network.emulateNetworkConditions',{offline:false,latency:120,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8});
  await cdps.send('Emulation.setCPUThrottlingRate',{rate:4});
  const result=await page.goto(base+path,{waitUntil:'networkidle',timeout:60000});
  assert.equal(result?.status(),200,path+' HTTP status');
  await page.waitForTimeout(420);
  const m=await page.evaluate(()=>{
   const paints=performance.getEntriesByType('paint'),nav=performance.getEntriesByType('navigation')[0],
    resources=performance.getEntriesByType('resource'),v=window.__r108Vitals||{};
   const fcp=paints.find(e=>e.name==='first-contentful-paint');
   return {
    title:document.title,
    headings:document.querySelectorAll('h1').length,
    docWidth:document.documentElement.scrollWidth,
    fcpMs:fcp?Math.round(fcp.startTime):null,
    lcpMs:v.lcp?Math.round(v.lcp):null,
    cls:Number((v.cls||0).toFixed(4)),
    domContentLoadedMs:nav?Math.round(nav.domContentLoadedEventEnd):null,
    loadMs:nav?Math.round(nav.loadEventEnd):null,
    resourceCount:resources.length,
    resourceEncodedBytes:Math.round(resources.reduce((n,e)=>n+(e.encodedBodySize||0),0)),
    longTaskCount:v.longTasks||0
   };
  });
  assert.equal(m.headings,1,'One H1 '+path);
  assert.ok(m.docWidth<=393,'No mobile overflow '+path);
  assert.ok(typeof m.fcpMs==='number','FCP missing '+path);
  assert.ok(failed===0,'Failed network requests '+path+': '+failed);
  report.pages.push({path,...m,requestFailures:failed});
  await ctx.close();
 }
 assert.deepEqual(report.errors,[],'Uncaught errors');
 report.status='PASS';
 console.log('R108 LAB BASELINE PASS: '+report.pages.map(x=>x.path+' FCP '+x.fcpMs+'ms, LCP '+x.lcpMs+'ms, CLS '+x.cls).join('; '));
}catch(e){report.status='FAIL';report.errors.push(String(e?.stack||e));console.error('R108 lab QA failed',e);process.exitCode=1;}
finally{
 writeFileSync(join(dir,'chromium-mobile-lab.json'),JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
