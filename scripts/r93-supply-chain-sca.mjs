/** R93 reproducible package SCA + SPDX disclosure inventory.
 * Uses npm's live advisory API only in CI, reports actual findings; never
 * labels a skipped/failed audit as a zero-vulnerability result.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=join(root,'qa-artifacts/r93-supply-chain');
mkdirSync(out,{recursive:true});
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const lock=JSON.parse(readFileSync(join(root,'package-lock.json'),'utf8'));
assert.equal(lock.lockfileVersion,3);
assert.deepEqual(lock.packages[''].dependencies,pkg.dependencies);
assert.deepEqual(lock.packages[''].devDependencies,pkg.devDependencies);
function audit(scope,args){
 const result=spawnSync('npm',['audit','--json',...args],{
  encoding:'utf8',timeout:150000,maxBuffer:32*1024*1024,env:{...process.env,CI:'true'}
 });
 let json;
 try{json=JSON.parse(result.stdout)}catch{json=null}
 const valid=json&&typeof json==='object'&&json.metadata&&json.metadata.vulnerabilities;
 const counts=valid?json.metadata.vulnerabilities:{};
 const summary={
  scope,complete:!!valid,exitCode:result.status,
  registryError:valid?null:String(result.error??result.stderr).slice(0,1200),
  counts:{
   info:Number(counts.info??0),low:Number(counts.low??0),
   moderate:Number(counts.moderate??0),high:Number(counts.high??0),
   critical:Number(counts.critical??0),total:Number(counts.total??0)
  },
  packages:valid?Object.entries(json.vulnerabilities??{}).map(([name,v])=>({
   package:name,severity:v.severity,isDirect:v.isDirect,
   via:(v.via??[]).map(x=>typeof x==='string'?x:{
    name:x.name,source:x.source,title:x.title,url:x.url,severity:x.severity,
    range:x.range
   }),
   fixAvailable:v.fixAvailable
  })):[]
 };
 writeFileSync(join(out,'npm-audit-'+scope+'.json'),JSON.stringify(summary,null,2)+'\n');
 return summary;
}
const production=audit('production',['--omit=dev']);
const all=audit('all',[]);
const licenseEntries=[];
for(const [name,locked] of Object.entries(lock.packages).filter(([key])=>key!=='')){
 const license=locked.license??null;
 const fileRoot=join(root,name);
 let installed=null,licenseFile=null;
 try{
  const found=JSON.parse(readFileSync(join(fileRoot,'package.json'),'utf8'));
  installed=found.license??found.licenses??null;
  const fileNames=readdirSync(fileRoot);
  licenseFile=fileNames.find(k=>/^(LICEN[CS]E|COPYING|NOTICE)([._-]|$)/i.test(k))??null;
 }catch{}
 licenseEntries.push({
  package:name.replace(/^node_modules\//,''),version:locked.version,
  license:license??installed??'UNDECLARED',installed:existsSync(fileRoot),
  licenseFile:licenseFile??'NOT PRESENT IN INSTALLED COPY',
  optional:!!locked.optional,dev:!!locked.dev,
  resolved:locked.resolved??null
 });
}
licenseEntries.sort((a,b)=>a.package.localeCompare(b.package));
const undeclared=licenseEntries.filter(x=>x.license==='UNDECLARED');
const manualReview=licenseEntries.filter(x=>/GPL|AGPL|LGPL|SSPL|UNKNOWN|UNDECLARED/i.test(x.license));
const report={
 schema:'mathworks-r93-dependency-sca/v1',
 generatedAt:new Date().toISOString(),
 lockfileSha256:createHash('sha256').update(readFileSync('package-lock.json')).digest('hex'),
 totalLockedThirdParty:licenseEntries.length,
 declaredLicenseCount:licenseEntries.length-undeclared.length,
 undeclaredLicenses:undeclared.map(x=>x.package),
 copyleftOrManualReview:manualReview.map(x=>({name:x.package,license:x.license,dev:x.dev,optional:x.optional})),
 production,all,
 advisoriesVerified:production.complete&&all.complete,
 productionHighOrCritical:production.counts.high+production.counts.critical,
 userSignedOffLicenses:false,
 securityConclusions:
  !production.complete||!all.complete?'AUDIT_UNAVAILABLE':
  production.counts.high+production.counts.critical?'PRODUCTION_HIGH_OR_CRITICAL_FINDINGS':
  'NO_HIGH_OR_CRITICAL_PRODUCTION_ADVISORIES_AT_AUDIT_TIME',
 licensedSoftwareDisclaimer:
  'Machine-collected package metadata; not a substitute for human SPDX/copyright review, redistribution NOTICE compliance or professional legal advice.'
};
writeFileSync(join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(join(out,'third-party-license-inventory.json'),JSON.stringify(licenseEntries,null,2)+'\n');
const cols=['package','version','license','installed','licenseFile','dev','optional','resolved'];
const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
writeFileSync(join(out,'third-party-license-inventory.csv'),
 [cols.join(','),...licenseEntries.map(row=>cols.map(k=>cell(row[k])).join(','))].join('\n')+'\n');
console.log('R93 live npm audit + locked licenses',JSON.stringify({
 advisoriesVerified:report.advisoriesVerified,
 production:production.counts,all:all.counts,
 lockedPackages:licenseEntries.length,undeclared:undeclared.length,
 licenseReview:manualReview.length
}));
assert.equal(licenseEntries.length,385,'Locked dependency graph unexpectedly changed');
assert.ok(production.complete&&all.complete,
 'Live npm audit could not be completed; do not claim security PASS');
assert.equal(production.counts.critical,0,
 'Critical production dependency vulnerabilities are release blockers');
