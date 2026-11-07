/** R86 genuine function-graph tasks. Reproducible optional PDF-only packs
 * never alter the 51 original v18 worksheet generators or indexable routes.
 */
import {Rng,type Difficulty} from './math.ts';
export const R86_GRAPH_VERSION='R86.1' as const;
export type GraphKind='linear-graph'|'read-graph'|'quadratic-transform';
export type GraphMode='mixed'|GraphKind;
export type GraphPoint={x:number;y:number};
export type GraphProblem={
 id:string;kind:GraphKind;m:number;b:number;a:number;h:number;k:number;
 probeX:number;question:string;answer:string;steps:readonly [string,string,string];
 plottedPoints:GraphPoint[];
};
export type GraphPack={
 topic:'functions-worksheets';version:typeof R86_GRAPH_VERSION;
 seed:number;quantity:number;difficulty:Difficulty;mode:GraphMode;
 problems:GraphProblem[];
};
const kinds:readonly GraphKind[]=['linear-graph','read-graph','quadratic-transform'];
export const GRAPH_MODES:readonly GraphMode[]=['mixed',...kinds];
function randomSlope(rng:Rng,difficulty:Difficulty){
 const options=difficulty==='easy'?[-1,1]:difficulty==='standard'?[-2,-1,1,2]:[-3,-2,-1,1,2,3];
 return options[rng.int(0,options.length-1)];
}
function quadraticCoefficient(rng:Rng,difficulty:Difficulty){
 const options=difficulty==='easy'?[1]:difficulty==='standard'?[-1,1]:[-2,-1,1,2];
 return options[rng.int(0,options.length-1)];
}
export function lineAt(m:number,b:number,x:number){return m*x+b;}
export function parabolaAt(a:number,h:number,k:number,x:number){return a*(x-h)*(x-h)+k;}
function signed(n:number){return n>0?' + '+n:n<0?' - '+Math.abs(n):'';}
function lineEquation(m:number,b:number){
 return 'y = '+(m===1?'x':m===-1?'-x':m+'x')+signed(b);
}
function parabolaEquation(a:number,h:number,k:number){
 const ax=a===1?'':a===-1?'-':String(a);
 return 'y = '+ax+'(x'+(h===0?'':h>0?' - '+h:' + '+Math.abs(h))+')^2'+signed(k);
}
export function makeGraphQuestion(kind:GraphKind,m:number,b:number,a:number,h:number,k:number,probeX:number):
 Pick<GraphProblem,'question'|'answer'|'steps'|'plottedPoints'>{
 if(kind==='linear-graph'){
  const points=[-probeX,0,probeX].map(x=>({x,y:lineAt(m,b,x)}));
  const coords=points.map(p=>'('+p.x+','+p.y+')').join(', ');
  return {
   question:'Plot '+lineEquation(m,b)+' using x = -'+probeX+', 0, '+probeX+
    '. Find the y-intercept.',
   answer:'Points '+coords+'; y-intercept (0,'+b+').',
   steps:['Substitute each specified x into '+lineEquation(m,b)+'.',
    'Plot the points '+coords+' on equal-unit axes; draw the line.',
    'The line crosses the y-axis at (0,'+b+').'],
   plottedPoints:points
  };
 }
 if(kind==='read-graph'){
  const value=lineAt(m,b,probeX),points=[{x:probeX,y:value},{x:0,y:b}];
  return {
   question:'Read the shown straight-line graph: find f('+probeX+') and the y-intercept.',
   answer:'f('+probeX+') = '+value+'; y-intercept (0,'+b+').',
   steps:['Locate x = '+probeX+'; follow the graph to its y-value.',
    'At x = '+probeX+', the line has y = '+value+'.',
    'At x = 0, the graph crosses the y-axis at (0,'+b+').'],
   plottedPoints:points
  };
 }
 if(kind==='quadratic-transform'){
  const points=[h-1,h,h+1].map(x=>({x,y:parabolaAt(a,h,k,x)}));
  const orientation=a>0?'up':'down',stretch=Math.abs(a)===1?'same width':'narrower';
  const shiftH=h>0?'right '+h:h<0?'left '+Math.abs(h):'no horizontal shift';
  const shiftK=k>0?'up '+k:k<0?'down '+Math.abs(k):'no vertical shift';
  return{
   question:'Graph '+parabolaEquation(a,h,k)+
    '. State the vertex, symmetry axis and opening.',
   answer:'Vertex ('+h+','+k+'); axis x = '+h+
    '; opens '+orientation+'; '+stretch+'.',
   steps:['From parent y = x^2, move '+shiftH+' and '+shiftK+'.',
    'Use coefficient '+a+' for '+(a<0?'reflection and ':'')+
     (Math.abs(a)===2?'vertical stretch by 2.':'unit vertical scale.'),
    'Vertex ('+h+','+k+'), symmetry x = '+h+', opening '+orientation+'.'],
   plottedPoints:points
  };
 }
 throw Error('Unsupported graph kind');
}
export function createGraphPack(seed:number,quantity:number,
 difficulty:Difficulty='standard',mode:GraphMode='mixed'):GraphPack{
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Graph seed must be unsigned 32-bit integer');
 if(!Number.isInteger(quantity)||quantity<1||quantity>40)throw Error('Choose 1–40 graph problems');
 if(!['easy','standard','challenge'].includes(difficulty)||!GRAPH_MODES.includes(mode))
  throw Error('Invalid graph practice configuration');
 const rng=new Rng(seed),used=new Set<string>(),problems:GraphProblem[]=[];
 for(let i=0;i<quantity;i++){
  const kind=mode==='mixed'?kinds[i%3]:mode;let p:GraphProblem|undefined;
  for(let attempt=0;attempt<2500;attempt++){
   const m=kind==='quadratic-transform'?0:randomSlope(rng,difficulty);
   const b=kind==='quadratic-transform'?0:rng.int(-3,3);
   const a=kind==='quadratic-transform'?quadraticCoefficient(rng,difficulty):0;
   const h=kind==='quadratic-transform'?rng.int(-3,3):0;
   const k=kind==='quadratic-transform'?rng.int(-3,3):0;
   const probeX=kind==='quadratic-transform'?0:rng.int(1,3);
   if(kind==='quadratic-transform'&&a===1&&h===0&&k===0)continue;
   // All student reference coordinates must fall on the SAME -6..6 grid.
   if(kind!=='quadratic-transform'&&
    Math.abs(m)*probeX+Math.abs(b)>6)continue;
   const key=[kind,m,b,a,h,k,probeX].join('|');
   if(used.has(key))continue;used.add(key);
   const q=makeGraphQuestion(kind,m,b,a,h,k,probeX);
   if(q.plottedPoints.some(point=>Math.abs(point.x)>6||Math.abs(point.y)>6))
    throw Error('Graph reference point escaped the labelled coordinate system');
   p={id:'Q'+(i+1),kind,m,b,a,h,k,probeX,...q};
   break;
  }
  if(!p)throw Error('Could not generate distinct and fully visible graph problems');
  problems.push(p);
 }
 return {topic:'functions-worksheets',version:R86_GRAPH_VERSION,seed,quantity,difficulty,mode,problems};
}
export function verifyGraphPack(pack:GraphPack):void{
 if(!pack||pack.topic!=='functions-worksheets'||pack.version!==R86_GRAPH_VERSION||
  !Array.isArray(pack.problems))throw Error('Invalid R86 graph pack');
 const expected=createGraphPack(pack.seed,pack.quantity,pack.difficulty,pack.mode);
 if(JSON.stringify(pack)!==JSON.stringify(expected))
  throw Error('R86 graph identity, coordinates, function values, key or steps mismatch');
}
export const GRAPH_GRID_EXTENT=6 as const;
export function graphToPaper(x:number,y:number,left:number,bottom:number,unit:number):GraphPoint{
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(left)||
  !Number.isFinite(bottom)||!Number.isFinite(unit)||unit<=0)throw Error('Invalid graph coordinates');
 return {x:left+(x+6)*unit,y:bottom+(y+6)*unit};
}
