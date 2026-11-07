import type {APIRoute} from 'astro';
import csv from '../data/keyword-evidence.csv?raw';
import routes from '../data/routes.json';
import changes from '../data/seo-routing-r70.json';
import {titleFor} from '../lib/site';
import {buildFrozenV2SearchIndex} from '../lib/worksheet-search';
export const prerender=true;
export const GET:APIRoute=()=>{
 const entries=buildFrozenV2SearchIndex(csv,routes,changes.rows,titleFor);
 return new Response(JSON.stringify({schema:'mathworks-r90-v2-worksheet-search/v1',entries}),{
  headers:{
   'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'public, max-age=3600',
   'X-Robots-Tag':'noindex, nofollow'
  }
 });
};
