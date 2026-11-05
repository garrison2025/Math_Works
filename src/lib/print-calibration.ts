/** R52 entirely local checker for USER-ENTERED physical ruler readings.
 * This does not observe any printer or guarantee clinical/engineering accuracy.
 */
export const PRINT_SCALE_TARGET_MM=100;
export const PRINT_SCALE_TOLERANCE_MM=1;
export type PrintScaleResult={status:'invalid'|'within-tolerance'|'adjust';message:string};
export function checkPrintScale(horizontal:string,vertical:string):PrintScaleResult{
 const read=(raw:string)=>{
  const value=raw.trim();
  if(!/^(?:\d{1,3})(?:\.\d{1,2})?$/.test(value))return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>0&&n<=200?n:null;
 };
 const h=read(horizontal),v=read(vertical);
 if(h===null||v===null)return {status:'invalid',
  message:'Enter physical ruler measurements in millimetres for BOTH 100 mm bars (for example, 99.8 and 100.2). Nothing is stored or uploaded.'};
 const hError=h-PRINT_SCALE_TARGET_MM,vError=v-PRINT_SCALE_TARGET_MM;
 if(Math.abs(hError)<=PRINT_SCALE_TOLERANCE_MM&&Math.abs(vError)<=PRINT_SCALE_TOLERANCE_MM)
  return {status:'within-tolerance',
   message:`Your entered readings: horizontal ${h} mm, vertical ${v} mm. Both are within +/- 1 mm of the 100 mm targets. This is a user-reported screening result, NOT independent verification of your printer. Also check whether the paper is cropped.`};
 return {status:'adjust',
  message:`Your entered readings: horizontal ${h} mm, vertical ${v} mm. At least one is outside +/- 1 mm. Select the correct paper size and Actual size / 100% (disable Fit/Shrink), then print and remeasure.`};
}
