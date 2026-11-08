import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../src/data/routes.json' with {type:'json'};
import {OWNED_SITE,releaseForBuild,publishedPaths,publishedPath} from '../src/lib/publication.ts';
test('main has exactly 57 indexable canonical routes and four held topics excluded',()=>{
 const release=releaseForBuild(routes,'main');
 assert.equal(release.enabled,'true');
 assert.equal(release.site,OWNED_SITE);
 const paths=publishedPaths(release,routes);
 assert.equal(paths.length,57);
 assert.equal(new Set(paths).size,57);
 assert.ok(paths.includes('/worksheets/'));
 for(const item of routes)assert.equal(paths.includes('/'+item.slug+'/'),item.type!=='HOLD');
 assert.ok(!publishedPath('/404/',release,routes));
 assert.ok(!publishedPath('/not-a-real-topic/',release,routes));
});
test('no stale Cloudflare PUBLIC_INDEXABLE false can prevent approved main indexing',()=>{
 assert.equal(publishedPaths(releaseForBuild(routes,'main'),routes).length,57);
});
test('no preview build (or unrecognised branch) becomes publicly indexable',()=>{
 for(const branch of ['','preview','feature/abc','staging','Main','production']){
  const input=releaseForBuild(routes,branch);
  assert.equal(input.enabled,'false',branch);
  assert.deepEqual(publishedPaths(input,routes),[],branch);
 }
});
