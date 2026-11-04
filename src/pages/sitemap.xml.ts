import type {APIRoute} from 'astro';
import routes from '../data/routes.json';
export const GET:APIRoute=()=>{
 const site=(import.meta.env.PUBLIC_SITE_URL||'').replace(/\/$/,'');
 const canIndex=import.meta.env.PUBLIC_INDEXABLE==='true'&&Boolean(site)&&!site.includes('.pages.dev')&&!site.includes('example.com');
 const paths=canIndex?['/','/about/','/contact/','/privacy/',...routes.filter(r=>r.type!=='HOLD').map(r=>`/${r.slug}/`)]:[];
 const body=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>${site+p}</loc></url>`).join('')}</urlset>`;
 return new Response(body,{headers:{'Content-Type':'application/xml;charset=utf-8'}});
};
