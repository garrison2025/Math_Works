import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {EXTRA_PACK_KEYS,EXTRA_PACK_LINK_VERSION,buildExtraPackLink,parseExtraPackLink} from '../src/lib/extra-pack-link.ts';

const choices=(key,defaultValue,selectedValue,allowed)=>({key,defaultValue,selectedValue,allowed});
const original=buildWorksheetLink('https://math-works.pages.dev/surface-area-worksheets/?old=1#top','surface-area-worksheets',{
 seed:20261107,difficulty:'standard',quantity:8,paper:'A4',options:{},writingRoom:'extra'
});

test('R82 every PDF-only extension selector is explicitly whitelisted and unique',()=>{
 const astro=readFileSync(new URL('../src/components/Workspace.astro',import.meta.url),'utf8');
 const published=[...new Set([...astro.matchAll(/<select\b[^>]*\bdata-([a-z0-9-]+)(?=[\s>])/g)]
  .map(match=>match[1]).filter(key=>key!=='field'&&key!=='option'))].sort();
 assert.equal(EXTRA_PACK_KEYS.length,29);
 assert.deepEqual([...EXTRA_PACK_KEYS].sort(),published,'New PDF-only select must be added to reproducible URL whitelist');
});

test('R82 nondefault modes and base worksheet identity round-trip, without student data',()=>{
 const fields=[
  choices('r80-nets-mode','mixed','square-pyramid',['mixed','square-pyramid','cylinder']),
  choices('r80-composite-mode','mixed','right-step',['mixed','left-step','right-step']),
 ];
 const url=buildExtraPackLink(original,fields);
 const params=new URL(url).searchParams;
 assert.equal(params.get('gv'),'18');
 assert.equal(params.get('xpv'),EXTRA_PACK_LINK_VERSION);
 assert.equal(params.get('xp_r80-nets-mode'),'square-pyramid');
 assert.equal(params.get('xp_r80-composite-mode'),'right-step');
 assert.equal(params.get('seed'),'20261107');
 assert.equal(params.get('room'),'extra');
 assert.ok(!url.includes('student')&&!url.includes('score')&&!url.includes('Name='));
 assert.equal(params.get('old'),null);
 assert.deepEqual(parseExtraPackLink(url,fields),{'r80-nets-mode':'square-pyramid','r80-composite-mode':'right-step'});
 assert.deepEqual(parseWorksheetLink(url,'surface-area-worksheets'),parseWorksheetLink(original,'surface-area-worksheets'));
});

test('R82 default optional choices do not alter stable legacy v18 links',()=>{
 const fields=[choices('equation-kind','decimal','decimal',['decimal','fraction'])];
 assert.equal(buildExtraPackLink(original,fields),original);
 assert.deepEqual(parseExtraPackLink(original,fields),{});
});

test('R82 rejects invalid field/value input, ignores stale versions or cross-route injection',()=>{
 const fields=[choices('r80-nets-mode','mixed','cylinder',['mixed','cylinder'])];
 assert.throws(()=>buildExtraPackLink(original,[choices('not-declared','mixed','cylinder',['mixed','cylinder'])]),/Invalid/);
 assert.throws(()=>buildExtraPackLink(original,[...fields,...fields]),/Invalid or duplicated/);
 assert.throws(()=>buildExtraPackLink(original,[choices('r80-nets-mode','mixed','unexpected',['mixed','cylinder'])]),/Invalid/);
 const bad=original+'&xpv=1&xp_r80-nets-mode=javascript%3Aalert(1)&xp_r80-composite-mode=left-step&xp_unknown=value';
 assert.deepEqual(parseExtraPackLink(bad,fields),{},'Unsupported and malformed values must be ignored');
 const valid=original+'&xpv=1&xp_r80-nets-mode=cylinder';
 assert.deepEqual(parseExtraPackLink(valid,fields),{'r80-nets-mode':'cylinder'});
 assert.deepEqual(parseExtraPackLink(valid.replace('xpv=1','xpv=999'),fields),{});
 assert.deepEqual(parseExtraPackLink(valid,[choices('equation-kind','decimal','decimal',['decimal','fraction'])]),{});
});
