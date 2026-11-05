import type {Diagram} from './math.ts';

/** A two-row x/f(x) table. 0 means the output is hidden; 1 means the input is hidden. */
export function functionTableGeometry(d:Diagram){
 if(d.kind!=='function-table'||d.values.length!==10||!d.values.every(Number.isSafeInteger))throw Error('Invalid function table diagram');
 const [m,b,...rest]=d.values,inputs=rest.slice(0,3),outputs=rest.slice(3,6);
 const position=rest[6],role=rest[7];
 if(m===0||position<0||position>2||![0,1].includes(role)||
  new Set(inputs).size!==3||inputs.some((x,i)=>outputs[i]!==m*x+b))throw Error('Inconsistent function table data');
 return {inputs,outputs,position,missingRole:(role===1?'input':'output') as 'input'|'output'};
}
