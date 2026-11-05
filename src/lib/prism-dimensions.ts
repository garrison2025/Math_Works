import type {Diagram} from './math.ts';
/** Source of truth for student-visible, non-leaking prism dimension labels. */
export function prismDimensions(d:Diagram){
 if(d.kind!=='prism'||![2,3].includes(d.values.length)||!d.values.every(v=>Number.isSafeInteger(v)&&v>0))
  throw Error('Invalid prism dimensions');
 const [length,width,height]=d.values;
 if(d.labels?.[0]==='cube'){
  if(height===undefined||length!==width||width!==height)
   throw Error('Cube must have three equal, known edge lengths');
  return {kind:'cube' as const,lengthLabel:'Side: '+length,widthLabel:null,heightLabel:null,
   accessibleDescription:'Cube with side length '+length+' units. Schematic, not to scale.'};
 }
 if(d.labels?.length&&d.labels[0]!=='rectangular-prism')throw Error('Unknown prism shape label');
 return {kind:'rectangular-prism' as const,lengthLabel:'Length: '+length,widthLabel:'Width: '+width,
  heightLabel:'Height: '+(height===undefined?'?':height),
  accessibleDescription:'Rectangular prism with length '+length+' units, width '+width+
   ' units and height '+(height===undefined?'unknown':height+' units')+
   '. Schematic, not to scale.'};
}
