/** R95 independent worked-step reconstruction, part B: spatial and visual questions.
 * Visual data are read from the diagram spec, not the generator's solutionSteps.
 */
import type {Problem} from './math.ts';
import {matches} from './r95-step-part-a.ts';

export function expectedRemainingB(p:Problem):string[]|null{
 const q=p.payload.question,d=p.diagramSpec;
 switch(p.topicId){
 case 'slope-worksheets':{
  const m=matches(q,/^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/);
  const [x1,y1,x2,y2]=m.slice(1).map(BigInt);
  if(d?.kind!=='coordinate'||d.values.join(',')!==[x1,y1,x2,y2].join(','))
   throw Error('Worked-step audit: slope diagram does not match source coordinates');
  const dx=x2-x1,dy=y2-y1;
  if(dx!==0n&&dy%dx!==0n)throw Error('Worked-step audit: non-integer slope not supported');
  return ['m = (y2 − y1) / (x2 − x1)',
   dx===0n?'The denominator is zero: the line is vertical and the slope is undefined.':
   'm = ('+y2+'−('+y1+'))/('+x2+'−('+x1+')) = '+dy/dx];
 }
 case 'number-recognition-worksheets':{
  const words=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  if(q==='Count the dots shown below.'){
   const n=d?.kind==='dots'?d.values[0]:null;
   if(!Number.isInteger(n)||n===null||n<1||n>12)throw Error('Worked-step audit: invalid dot count');
   return ['Count each dot once: '+n];
  }
  const m=matches(q,/^Write the numeral for “([a-z]+)”\.$/);
  const n=words.indexOf(m[1])+1;
  if(n===0||d)throw Error('Worked-step audit: invalid number word/diagram');
  return ['The word “'+m[1]+'” represents the number '+n];
 }
 case 'number-line-worksheets':{
  const m=matches(q,/^Mark (-?\d+) on the number line\.$/);
  const n=Number(m[1]);
  if(!Number.isInteger(n)||n< -9||n>9||d?.kind!=='numberline'||d.values[0]!==n)
   throw Error('Worked-step audit: wrong number line target');
  return [n===0?'Zero is the origin':
   (n<0?'Left':'Right')+' of zero for '+(n<0?'negative':'positive')+' numbers'];
 }
 case 'coordinate-plane-worksheets':{
  const m=matches(q,/^Which quadrant contains \((-?\d+), (-?\d+)\)\?$/);
  const x=Number(m[1]),y=Number(m[2]);
  if(x===0||y===0||d?.kind!=='coordinate'||d.values[0]!==x||d.values[1]!==y)
   throw Error('Worked-step audit: quadrant diagram mismatch');
  const quad=x>0?(y>0?'I':'IV'):(y>0?'II':'III');
  return ['x is '+(x>0?'positive':'negative')+' and y is '+(y>0?'positive':'negative'),
    'Quadrant '+quad];
 }
 case 'area-worksheets':{
  const square=q.match(/^Find the area of a square with side (\d+)\.$/);
  if(square){
   const side=BigInt(square[1]);
   if(side<=0n||d?.kind!=='rectangle'||d.values[0]!==Number(side)||d.values[1]!==Number(side))
    throw Error('Worked-step audit: incorrect square');
   return ['Area = side × side = '+side*side+' square units'];
  }
  const m=matches(q,/^Find the area of a (\d+) by (\d+) rectangle\.$/);
  const x=BigInt(m[1]),y=BigInt(m[2]);
  if(x<=0n||y<=0n||d?.kind!=='rectangle'||d.values[0]!==Number(x)||d.values[1]!==Number(y))
   throw Error('Worked-step audit: incorrect rectangle');
  return ['Area = length × width = '+x*y+' square units'];
 }
 case 'surface-area-worksheets':{
  const cube=q.match(/^Find surface area of a cube with side (\d+)\.$/);
  if(cube){
   const side=BigInt(cube[1]);
   if(side<=0n||d?.kind!=='prism'||d.values.some(n=>BigInt(n)!==side))
    throw Error('Worked-step audit: cube diagram mismatch');
   return ['Cube surface area = 6 × side²','Surface area = '+6n*side*side+' square units'];
  }
  const m=matches(q,/^Find surface area of a rectangular prism: (\d+) × (\d+) × (\d+)\.$/);
  const [a,b,c]=m.slice(1).map(BigInt);
  if(a<=0n||b<=0n||c<=0n||d?.kind!=='prism'||d.values.join(',')!==[a,b,c].join(','))
   throw Error('Worked-step audit: prism diagram mismatch');
  return ['SA = 2(lw + lh + wh)','Surface area = '+2n*(a*b+a*c+b*c)+' square units'];
 }
 case 'angle-worksheets':{
  const m=matches(q,/^Classify a (\d+)° angle\.$/);
  const n=Number(m[1]);
  if(n<1||n>=180||d?.kind!=='angle'||d.values[0]!==n)
   throw Error('Worked-step audit: invalid angle diagram');
  return ['Acute <90°, right =90°, obtuse >90° and <180°'];
 }
 case 'lines-rays-segments-worksheets':{
  if(q!=='Identify the pictured figure: line, ray, or segment.'||d?.kind!=='line')
   throw Error('Worked-step audit: missing geometry classification drawing');
  const shape=d.values[0];
  if(shape!==0&&shape!==1&&shape!==2)throw Error('Worked-step audit: invalid line drawing');
  const name=shape===2?'line':shape===1?'ray':'segment';
  return ['A line extends infinitely in both directions; a ray starts at one endpoint; a segment has two endpoints.',
   'The figure is a '+name+'.'];
 }
 case 'printable-protractor':{
  const m=matches(q,/^Locate the (\d+)° mark on a printed protractor\.$/);
  const angle=Number(m[1]);
  if(!Number.isInteger(angle)||angle<0||angle>180||d?.kind!=='protractor'||d.values[0]!==50)
   throw Error('Worked-step audit: invalid digital protractor contract');
  // Checks the instruction wording, NOT the dimensions of a physically printed protractor.
  return ['Read degrees counterclockwise from the right-hand 0° baseline',
   'Print at actual size (100%) and measure the 50 mm verification line.'];
 }
 default:return null;
 }
}
