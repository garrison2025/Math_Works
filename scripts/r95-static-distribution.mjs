/** R95: inspect the ACTUAL Cloudflare Pages static publish directory for
 * native/sharp binaries. Does not issue a legal opinion or license release.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync,lstatSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,relative,extname} from 'node:path';

const root=process.cwd(),dist=join(root,'dist'),out=join(root,'qa-artifacts/r95-static-distribution');
assert.ok(existsSync(join(dist,'index.html')),'R95: built Cloudflare dist/index.html required');
const entries=[];
function walk(dir){
 for(const name of readdirSync(dir).sort()){
  const file=join(dir,name),stat=lstatSync(file);
  assert.ok(!stat.isSymbolicLink(),'R95: symlink not permitted in deployment: '+file);
  if(stat.isDirectory()){walk(file);continue;}
  if(!stat.isFile())throw Error('R95: unexpected build output type: '+file);
  const path=relative(dist,file).replaceAll('\\','/');
  const bytes=readFileSync(file),sha256=createHash('sha256').update(bytes).digest('hex');
  entries.push({path,bytes:bytes.length,sha256,extension:extname(path).toLowerCase()});
 }
}
walk(dist);
assert.ok(entries.length>60,'R95: deployed asset footprint unexpectedly small');
const suspicious=entries.filter(row=>/(^|\/)(?:node_modules|@img|sharp-libvips)(?:\/|$)/i.test(row.path)||
 /\.(?:node|so|dylib|dll|exe|wasm|a|lib)$/i.test(row.path));
const lock=JSON.parse(readFileSync(join(root,'package-lock.json'),'utf8'));
const manualLicense=Object.entries(lock.packages).filter(([path,row])=>path&&
 /(?:AGPL|LGPL|GPL|SSPL|UNKNOWN|UNDECLARED)/i.test(row.license??'UNDECLARED')).map(([path,row])=>({
  package:path.replace(/^node_modules\//,''),version:row.version,
  license:row.license??'UNDECLARED',development:!!row.dev,optional:!!row.optional
}));
const assetPaths=entries.map(x=>x.path);
const result={
 schema:'mathworks-r95-static-dist-license-scope/v1',
 generatedAt:new Date().toISOString(),
 deployedDirectory:'dist',assetCount:entries.length,
 totalBytes:entries.reduce((s,x)=>s+x.bytes,0),
 htmlPages:entries.filter(x=>x.extension==='.html').length,
 sharpOrNativeBinaryCandidates:suspicious,
 packageLicenseFlags:manualLicense,
 staticOnlyTechnicalCheck:suspicious.length===0,
 legalReviewStatus:'PENDING HUMAN LICENSE REVIEW',
 findingsAreNotLegalClearance:true,
 notes:[
  'This checks only dist/ served by Cloudflare Pages. It does not inspect other releases, source archives, third-party installer distribution or cloud-host legal obligations.',
  'LGPL/mixed license review requires actual license texts, notices, distribution facts and human approval.',
  'Generated WebP images are not evidence by themselves that the native Sharp/libvips binary is distributed.',
  'No teacher, physical printer, real screen-reader, domain or search-index authorization is implied.'
 ],
 files:entries
};
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log('R95 Cloudflare static distribution audit',JSON.stringify({
 assets:entries.length,htmlPages:result.htmlPages,totalBytes:result.totalBytes,
 suspiciousFiles:suspicious.length,flaggedPackageRecords:manualLicense.length,
 humanLegalSigned:false
}));
assert.equal(suspicious.length,0,
 'R95: suspicious native or Sharp/libvips runtime found in public deployment');
assert.ok(manualLicense.every(item=>item.development&&item.optional),
 'R95: flagged runtime licenses changed; perform new human legal review');
