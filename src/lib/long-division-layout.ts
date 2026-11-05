/** R53: student writing space only, not a change to generated questions.
 * Three-digit dividends get four ruled rows; four-digit dividends get five.
 */
export function longDivisionPracticeRows(values:readonly number[]):number{
 if(values.length!==2||!values.every(n=>Number.isSafeInteger(n)&&n>0))
  throw Error('Invalid long-division diagram operands');
 const [dividend,divisor]=values;
 const digits=String(dividend).length;
 if((digits!==3&&digits!==4)||divisor<2||divisor>=dividend)
  throw Error('Long-division writing workspace requires 3/4-digit dividend and smaller divisor');
 return digits+1;
}
export function longDivisionDiagramHeight(values:readonly number[]):number{
 return 18*longDivisionPracticeRows(values)+115;
}
