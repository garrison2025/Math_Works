/** R72 real fraction strips: every row is the SAME whole width and is
 * divided into N exact equal cells. This is a printable visual model,
 * not a text-only fraction exercise or an unverified grade assertion.
 */
export const FRACTION_STRIPS_VERSION='R72.1' as const;
export type FractionStripSet='basic'|'extended';
export type FractionStripsMode='blank'|'labeled';
export type FractionStripsPack={
 version:typeof FRACTION_STRIPS_VERSION;set:FractionStripSet;
 denominators:readonly number[];mode:FractionStripsMode;
 cells:readonly {denominator:number;labels:readonly string[]}[];
};
const setMap:Readonly<Record<FractionStripSet,readonly number[]>>={
 basic:[1,2,3,4,6,8],extended:[1,2,3,4,5,6,8,10,12]
};
export function makeFractionStrips(set:FractionStripSet='extended',
 mode:FractionStripsMode='blank'):FractionStripsPack{
 if(!Object.hasOwn(setMap,set))throw Error('Invalid strip denominator set');
 if(mode!=='blank'&&mode!=='labeled')throw Error('Invalid fraction strip label mode');
 const denominators=[...setMap[set]];
 return {version:FRACTION_STRIPS_VERSION,set,mode,denominators,
  cells:denominators.map(denominator=>({
   denominator,labels:Array.from({length:denominator},()=>mode==='labeled'?'1/'+denominator:'')
  }))};
}
export function verifyFractionStrips(pack:FractionStripsPack):void{
 if(!pack||pack.version!=='R72.1'||!Object.hasOwn(setMap,pack.set)||
  !['blank','labeled'].includes(pack.mode)||!Array.isArray(pack.denominators)||
  JSON.stringify(pack.denominators)!==JSON.stringify(setMap[pack.set])||
  !Array.isArray(pack.cells)||pack.cells.length!==pack.denominators.length)
  throw Error('Invalid fraction strips pack');
 for(const [row,strip] of pack.cells.entries()){
  const d=pack.denominators[row];
  if(strip.denominator!==d||!Array.isArray(strip.labels)||strip.labels.length!==d||
   strip.labels.some(value=>value!==(pack.mode==='labeled'?'1/'+d:'')))
   throw Error('Malformed strip partition at row '+(row+1));
 }
}
