import type {APIRoute} from 'astro';
import routes from '../data/routes.json';
import {releaseForBuild,publishedPaths} from '../lib/publication';
export const GET:APIRoute=()=>{
 const input=releaseForBuild(routes,process.env.CF_PAGES_BRANCH||'');
 const site=input.site;
 const paths=publishedPaths(input,routes);
 const body=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>${site+p}</loc></url>`).join('')}</urlset>`;
 return new Response(body,{headers:{'Content-Type':'application/xml;charset=utf-8'}});
};
