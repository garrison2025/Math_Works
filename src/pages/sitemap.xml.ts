import type {APIRoute} from 'astro';
import routes from '../data/routes.json';
import {releasePaths,absoluteSite} from '../lib/indexation';
export const GET:APIRoute=()=>{
 const input={site:import.meta.env.PUBLIC_SITE_URL||'',enabled:import.meta.env.PUBLIC_INDEXABLE||'',routes:import.meta.env.PUBLIC_INDEXABLE_ROUTES||'',hubs:import.meta.env.PUBLIC_INDEXABLE_HUB_ROUTES||'',branch:process.env.CF_PAGES_BRANCH||''};
 const site=absoluteSite(input);
 const paths=releasePaths(input,routes);
 const body=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>${site+p}</loc></url>`).join('')}</urlset>`;
 return new Response(body,{headers:{'Content-Type':'application/xml;charset=utf-8'}});
};
