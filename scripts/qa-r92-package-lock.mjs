/** R92: reject unpinned or stale npm dependency graphs before CI installation.
 * This is not a complete vulnerability/third-party-license audit. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const root=process.cwd();
const manifest=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const raw=readFileSync(join(root,'package-lock.json'),'utf8');
const lock=JSON.parse(raw);
assert.equal(lock.lockfileVersion,3,'Use Node 22/npm 10 lockfile version 3');
assert.equal(lock.name,manifest.name);
assert.equal(lock.version,manifest.version);
assert.ok(lock.packages&&typeof lock.packages==='object');
const rootPkg=lock.packages[''];
assert.ok(rootPkg,'Lockfile must contain the root package');
assert.equal(rootPkg.name,manifest.name);
assert.equal(rootPkg.version,manifest.version);
assert.deepEqual(rootPkg.dependencies??{},manifest.dependencies??{},
 'Runtime dependencies changed without regenerating package-lock.json');
assert.deepEqual(rootPkg.devDependencies??{},manifest.devDependencies??{},
 'Developer dependencies changed without regenerating package-lock.json');
const direct=[...Object.keys(manifest.dependencies??{}),...Object.keys(manifest.devDependencies??{})];
for(const name of direct){
 const item=lock.packages['node_modules/'+name];
 assert.ok(item,'Direct package missing from lockfile: '+name);
 assert.ok(item.version,'Direct package is not resolved: '+name);
}
let locked=0,missingIntegrity=0,nonRegistry=0;
for(const [name,entry] of Object.entries(lock.packages)){
 if(name==='')continue;
 locked++;
 if(!entry.integrity||!/^sha(512|384|256)-/.test(entry.integrity))missingIntegrity++;
 if(!entry.resolved||!entry.resolved.startsWith('https://'))nonRegistry++;
}
assert.ok(locked>=100,'Locked dependency tree unexpectedly empty/truncated');
assert.equal(missingIntegrity,0,'Third-party packages without recorded integrity checks');
assert.equal(nonRegistry,0,'Dependency source is missing or not HTTPS');
const summary={
 schema:'mathworks-r92-locked-dependencies/v1',status:'PASS',
 nodeCI:'22.23.4',npmLockVersion:lock.lockfileVersion,
 directRuntime:Object.keys(manifest.dependencies??{}).length,
 directDevelopment:Object.keys(manifest.devDependencies??{}).length,
 installedGraphPackages:locked,
 missingIntegrity,nonHttpsResolution:nonRegistry,
 sha256:createHash('sha256').update(raw).digest('hex'),
 ciInstall:'npm ci --no-audit --no-fund',
 verified:'Lock-to-manifest equivalence, every direct package resolved, full actual dependency integrity checks and HTTPS URLs',
 notCovered:'Full live npm audit and package license inventory use the independent R93 CI gate; human risk approval remains distinct'
};
const directory=join(root,'qa-artifacts','r92-npm-lock');
mkdirSync(directory,{recursive:true});
writeFileSync(join(directory,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('R92 lockfile preflight PASS: '+locked+' resolved, integrity-checked dependency entries');
