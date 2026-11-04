import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {sampleProblem} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
const routes=JSON.parse(await fs.readFile(new URL('../src/data/routes.json',import.meta.url),'utf8')).filter(x=>x.type!=='HOLD');
await fs.mkdir(new URL('../public/images/worksheets/',import.meta.url),{recursive:true});
function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
for(const route of routes){
 const ex=sampleProblem(route.slug,20261104,'standard');
 const title=route.slug.replaceAll('-',' ').replaceAll(' worksheets','');
 const q=esc(ex.payload.question);let diagram=diagramSVG(ex.diagramSpec).replace(/<svg[^>]*>/,'<svg x="170" y="250" width="520" height="210" viewBox="0 0 450 220">');
 if(route.slug==='printable-protractor')diagram='';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560"><rect width="1000" height="560" fill="#f5f7fa"/><rect x="50" y="36" width="900" height="488" rx="18" fill="white" stroke="#d7e0e9" stroke-width="2"/><text x="92" y="95" fill="#187b68" font-family="sans-serif" font-size="22" font-weight="bold">PRINTABLE MATH WORKSHEETS</text><text x="92" y="144" fill="#172337" font-family="sans-serif" font-size="31" font-weight="bold">${esc(title.replace(/\b\w/g,t=>t.toUpperCase()))}</text><line x1="92" y1="164" x2="908" y2="164" stroke="#d7e0e9" stroke-width="2"/><text x="92" y="216" fill="#172337" font-family="sans-serif" font-size="25">1. ${q.length>58?q.slice(0,55)+'…':q}</text>${diagram}<line x1="92" y1="490" x2="500" y2="490" stroke="#cbd5e1" stroke-width="2"/><text x="730" y="494" font-family="sans-serif" font-size="18" fill="#586778">Name: __________</text></svg>`;
 await fs.writeFile(new URL(`../public/images/worksheets/${route.slug}-sample.svg`,import.meta.url),svg);
 await sharp(Buffer.from(svg)).resize({width:1000}).webp({quality:86}).toFile(new URL(`../public/images/worksheets/${route.slug}-sample.webp`,import.meta.url).pathname);
}
console.log('Generated',routes.length,'verified math-driven preview assets');
