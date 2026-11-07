/** R95 independent steps, part D: descriptive statistics and chart coordinates. */
import type {Problem} from './math.ts';
import {matches} from './r95-step-part-a.ts';
const display=(v:number)=>String(Number(v.toFixed(6)));
function sorted(values:number[]):number[]{return [...values].sort((a,b)=>a-b);}
function middle(values:number[]):number{
 const n=values.length;return n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2;
}
function gcd(a:bigint,b:bigint):bigint{while(b){const t=a%b;a=b;b=t;}return a||1n;}
function reducedSum(sum:bigint,count:bigint):string{
 const g=gcd(sum,count),n=sum/g,d=count/g;return d===1n?String(n):n+'/'+d;
}
function data(q:string,re:RegExp):{mode:string,values:number[]}{
 const m=matches(q,re),values=m[2].split(', ').map(Number);
 if(values.some(n=>!Number.isSafeInteger(n)||n<0)||values.join(', ')!==m[2])
  throw Error('Worked-step audit: malformed dataset');
 return {mode:m[1],values};
}
export function expectedRemainingD(p:Problem):string[]|null{
 const q=p.payload.question,d=p.diagramSpec;
 switch(p.topicId){
 case 'mean-median-mode-range-worksheets':{
  const {mode,values}=data(q,/^Find the (mean|median|mode|range) of \[([\d, ]+)\]\.$/);
  if(values.length<5||values.length>9||values.join(',')!==sorted(values).join(','))
   throw Error('Worked-step audit: unordered or invalid statistics sample');
  const total=values.reduce((a,b)=>a+b,0),count=values.length;
  const freq=new Map<number,number>();
  for(const n of values)freq.set(n,(freq.get(n)??0)+1);
  const highest=Math.max(...freq.values());
  const modes=highest===1?[]:[...freq].filter(([,v])=>v===highest).map(([k])=>k).sort((a,b)=>a-b);
  const modeAnswer=modes.length?modes.join(', '):'no mode';
  const mid=middle(values),mean=reducedSum(BigInt(total),BigInt(count));
  const answer=mode==='mean'?mean:mode==='median'?display(mid):mode==='mode'?modeAnswer:String(values.at(-1)!-values[0]);
  const how=mode==='mean'?'Sum '+total+' divided by '+count+' = '+mean+' (exact)':
   mode==='median'?(count%2?'The middle observation is '+display(mid)+'.':
    'The two middle observations are '+values[count/2-1]+' and '+values[count/2]+'; their mean is '+display(mid)+'.'):
   mode==='mode'?(modes.length?'Most frequent ('+highest+' times): '+modeAnswer+'.':
    'Every value appears exactly once, so there is no mode.'):
   'Maximum '+values.at(-1)+' minus minimum '+values[0]+' = '+answer+'.';
  return ['There are '+count+' values, ordered from least to greatest.',how,'Answer: '+answer];
 }
 case 'box-plots-worksheets':{
  const draw=q.match(/^Draw a modified box plot for \[([\d, ]+)\]\. Use median-of-halves and 1\.5×IQR for outliers\.$/);
  const reading=q.match(/^Find (Q1|median|Q3|IQR|outliers) for \[([\d, ]+)\] using median-of-halves\.$/);
  if(!draw&&!reading)throw Error('Worked-step audit: unrecognized box plot task');
  const task=draw?'draw':reading![1],raw=(draw?draw[1]:reading![2]);
  const values=raw.split(', ').map(Number);
  if(values.length!==8||values.some(x=>!Number.isInteger(x)||x<0)||d?.kind!=='box-practice'||
    values.join(',')!==sorted(values).join(',')||d.values.join(',')!==values.join(','))
   throw Error('Worked-step audit: box plot data/diagram mismatch');
  const q1=middle(values.slice(0,4)),median=middle(values),q3=middle(values.slice(4)),iqr=q3-q1;
  const fenceLow=q1-1.5*iqr,fenceHigh=q3+1.5*iqr;
  const inside=values.filter(v=>v>=fenceLow&&v<=fenceHigh);
  if(!inside.length)throw Error('Worked-step audit: all values are outside fences');
  const outliers=values.filter(v=>v<fenceLow||v>fenceHigh),outText=outliers.join(', ')||'none';
  const summary='Q1='+display(q1)+', median='+display(median)+', Q3='+display(q3)+
   '; whiskers='+inside[0]+' to '+inside.at(-1)+'; outliers='+outText;
  const ans=task==='draw'?summary:task==='Q1'?display(q1):task==='Q3'?display(q3):
   task==='median'?display(median):task==='IQR'?display(iqr):outText;
  return ['Q1='+display(q1)+', median='+display(median)+', Q3='+display(q3)+', IQR='+display(iqr),
   'Fences: '+display(fenceLow)+' and '+display(fenceHigh)+'; whiskers: '+inside[0]+' to '+inside.at(-1)+
    '; outliers: '+outText,
   'Answer: '+ans];
 }
 case 'scatter-plot-worksheets':{
  if(d?.kind!=='scatter'||d.values.length!==12)
   throw Error('Worked-step audit: invalid scatter diagram');
  const points:Array<[number,number]>=[];
  for(let i=0;i<d.values.length;i+=2){
   const x=d.values[i],y=d.values[i+1];
   if(x!==1+i/2||!Number.isSafeInteger(y))throw Error('Worked-step audit: scatter coordinate mismatch');
   points.push([x,y]);
  }
  const coordinates=points.map(v=>'('+v[0]+', '+v[1]+')').join(', ');
  if(q.startsWith('Plot these six points on the scatter grid: ')){
   if(q!=='Plot these six points on the scatter grid: '+coordinates+'.'||d.labels?.[0]!=='plot')
    throw Error('Worked-step audit: plot coordinate list and image differ');
   return ['Locate each x-value on the horizontal axis and each y-value on the vertical axis.',
    'Plot all six coordinate pairs; then check each marked point against the list.'];
  }
  if(q!=='Describe the overall linear trend in the scatter plot.'||d.labels?.[0]!=='identify')
   throw Error('Worked-step audit: unrecognized scatter trend prompt');
  const meanY=points.reduce((s,p)=>s+p[1],0)/6;
  const cov=points.reduce((sum,p)=>sum+(p[0]-3.5)*(p[1]-meanY),0);
  const trend=Math.abs(cov)<1e-9?'none':cov>5?'positive':cov< -5?'negative':null;
  if(!trend)throw Error('Worked-step audit: unsupported ambiguous scatter trend');
  return ['Examine all six points from left to right, not just one pair.',
   trend==='none'?'The points do not rise or fall overall in a linear pattern.':
   'The points generally '+(trend==='positive'?'rise':'fall')+' as x increases.'];
 }
 default:return null;
 }
}
