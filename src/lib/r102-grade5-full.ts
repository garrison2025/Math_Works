/**
 * R102: self-contained, standards-mapped Grade 5 question families.
 * Scope: 26 content standards of the published US CCSS Grade 5 framework,
 * not state-specific curricula or a guarantee of student mastery.
 * Original grade 2, mixed grade 5, 51 v18 routes and 488 SEO rows are untouched.
 */
export const GRADE5_FULL_KINDS=[
 'g5s-oa-eval','g5s-oa-expression','g5s-oa-pattern',
 'g5s-nbt-place','g5s-nbt-power','g5s-nbt-expand','g5s-nbt-compare','g5s-nbt-round','g5s-nbt-mult','g5s-nbt-div','g5s-nbt-dec-add','g5s-nbt-dec-sub','g5s-nbt-dec-mul','g5s-nbt-dec-div',
 'g5s-nf-add','g5s-nf-sub','g5s-nf-story','g5s-nf-share','g5s-nf-mul','g5s-nf-area','g5s-nf-scale','g5s-nf-mixed','g5s-nf-unit-div','g5s-nf-whole-div',
 'g5s-md-convert','g5s-md-lineplot','g5s-md-unitcube','g5s-md-countcubes','g5s-md-prism','g5s-md-additive',
 'g5s-g-read','g5s-g-plot','g5s-g-hierarchy','g5s-g-classify'
] as const;
export type Grade5FullKind=typeof GRADE5_FULL_KINDS[number];
export const GRADE5_FULL_COUNTS=[40,48] as const;
export const GRADE5_STANDARDS={
 'g5s-oa-eval':'5.OA.A.1','g5s-oa-expression':'5.OA.A.2','g5s-oa-pattern':'5.OA.B.3',
 'g5s-nbt-place':'5.NBT.A.1','g5s-nbt-power':'5.NBT.A.2','g5s-nbt-expand':'5.NBT.A.3','g5s-nbt-compare':'5.NBT.A.3',
 'g5s-nbt-round':'5.NBT.A.4','g5s-nbt-mult':'5.NBT.B.5','g5s-nbt-div':'5.NBT.B.6',
 'g5s-nbt-dec-add':'5.NBT.B.7','g5s-nbt-dec-sub':'5.NBT.B.7','g5s-nbt-dec-mul':'5.NBT.B.7','g5s-nbt-dec-div':'5.NBT.B.7',
 'g5s-nf-add':'5.NF.A.1','g5s-nf-sub':'5.NF.A.1','g5s-nf-story':'5.NF.A.2','g5s-nf-share':'5.NF.B.3',
 'g5s-nf-mul':'5.NF.B.4','g5s-nf-area':'5.NF.B.4','g5s-nf-scale':'5.NF.B.5','g5s-nf-mixed':'5.NF.B.6',
 'g5s-nf-unit-div':'5.NF.B.7','g5s-nf-whole-div':'5.NF.B.7',
 'g5s-md-convert':'5.MD.A.1','g5s-md-lineplot':'5.MD.B.2','g5s-md-unitcube':'5.MD.C.3',
 'g5s-md-countcubes':'5.MD.C.4','g5s-md-prism':'5.MD.C.5','g5s-md-additive':'5.MD.C.5',
 'g5s-g-read':'5.G.A.1','g5s-g-plot':'5.G.A.2','g5s-g-hierarchy':'5.G.B.3','g5s-g-classify':'5.G.B.4'
} as const satisfies Record<Grade5FullKind,string>;
export const GRADE5_STANDARD_IDS=[
 '5.OA.A.1','5.OA.A.2','5.OA.B.3',
 '5.NBT.A.1','5.NBT.A.2','5.NBT.A.3','5.NBT.A.4','5.NBT.B.5','5.NBT.B.6','5.NBT.B.7',
 '5.NF.A.1','5.NF.A.2','5.NF.B.3','5.NF.B.4','5.NF.B.5','5.NF.B.6','5.NF.B.7',
 '5.MD.A.1','5.MD.B.2','5.MD.C.3','5.MD.C.4','5.MD.C.5',
 '5.G.A.1','5.G.A.2','5.G.B.3','5.G.B.4'
] as const;
type Values={a:number;b:number;c:number;d:number;v:number};
type Model={question:string;answer:string;steps:string[]};
type Rng={int(lo:number,hi:number):number};
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a);
function frac(n:number,d:number):string{
 if(d<=0||!Number.isSafeInteger(n)||!Number.isSafeInteger(d))throw Error('Invalid exact fraction');
 const g=gcd(n,d);return d/g===1?String(n/g):(n/g)+'/'+(d/g);
}
const cents=(v:number)=> (v/100).toFixed(2);
const fixed4=(v:number)=> (v/10000).toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
function requireValue(ok:boolean){if(!ok)throw Error('Invalid Grade 5 question values');}
const result=(question:string,answer:string,...steps:string[]):Model=>({question,answer,steps});
export function grade5FullModel(kind:Grade5FullKind,z:Values):Model{
 const {a,b,c,d,v}=z;
 for(const n of [a,b,c,d,v])requireValue(Number.isSafeInteger(n)&&n>=0&&n<=99999);
 switch(kind){
 case 'g5s-oa-eval':{
  requireValue(a>=2&&a<=14&&b>=c&&c>=1&&d>=1&&d<=8);
  const inner=b-c;
  return result('Evaluate ['+a+' × ('+b+' − '+c+')] + '+d+'.',a*inner+d+'',
   'First evaluate parentheses: '+b+' − '+c+' = '+inner+'.',
   'Then multiply '+a+' × '+inner+' and add '+d+' to get '+(a*inner+d)+'.');
 }
 case 'g5s-oa-expression':
  requireValue(a>=2&&b>=2&&c>=1);
  return result('A teacher opens '+a+' boxes of '+b+' pencils each and adds '+c+' extra pencils. Write a numerical expression without evaluating it.',
   a+' × '+b+' + '+c,'The boxes contribute '+a+' groups of '+b+'.','Add '+c+' extra pencils after multiplying the groups.');
 case 'g5s-oa-pattern':
  requireValue(a>=2&&b===2*a&&c>=1&&c<=9);
  return result('Pattern X starts at 0 and adds '+a+' each step; pattern Y starts at 0 and adds '+b+' each step. What ordered pair (X,Y) is plotted at step '+c+'?',
   '('+(a*c)+', '+(b*c)+')','At step '+c+', X = '+a+' × '+c+' = '+(a*c)+' and Y = '+b+' × '+c+' = '+(b*c)+'.',
   'Plot ('+(a*c)+', '+(b*c)+'); each Y value is twice X.');
 case 'g5s-nbt-place':
  requireValue(a>=1&&a<=9);
  return result('In '+a+'00 and '+a+'0, the digit '+a+' appears in the hundreds and tens places. How many times larger is its value in '+a+'00?',
   '10 times','The first value is '+(a*100)+'; the second is '+(a*10)+'.',
   (a*100)+' ÷ '+(a*10)+' = 10.');
 case 'g5s-nbt-power':{
  requireValue(a>=101&&a<=999&&b>=1&&b<=2&&v<=1);
  const val=(a/100).toFixed(2),power=10**b;
  // Fixed-point arithmetic: numerator and denominator are exact base-10 integers.
  const numerator=v===0?a*power:a,denominator=v===0?100:100*power;
  const places=v===0?Math.max(0,2-b):2+b;
  const quotient=(numerator/denominator).toFixed(places).replace(/\\.?0+$/,'');
  return result('Calculate '+val+(v===0?' × ':' ÷ ')+'10^'+b+'.',quotient,
   'A power of ten moves the decimal point '+b+' place(s) '+(v===0?'right':'left')+'.',
   'The exact result is '+quotient+'.');
 }
 case 'g5s-nbt-expand':
  requireValue(a>=1&&a<=9&&b<=9&&c<=9&&d<=9);
  return result('Write '+a+'.'+b+c+d+' in expanded decimal form using place values.',
   a+' × 1 + '+b+' × 0.1 + '+c+' × 0.01 + '+d+' × 0.001',
   'The digits are ones, tenths, hundredths and thousandths.',
   'Multiply each digit by its place value and add.');
 case 'g5s-nbt-compare':
  requireValue(a>=1&&b>=1&&a<=9999&&b<=9999);
  return result('Compare '+(a/1000).toFixed(3)+' and '+(b/1000).toFixed(3)+'. Enter <, > or =.',
   a<b?'<':a>b?'>':'=',
   'Align both numbers to thousandths.',
   'Compare '+a+' thousandths and '+b+' thousandths.');
 case 'g5s-nbt-round':{
  requireValue(a>=1000&&a<=9999&&v<=2);
  const digitUnit=10**(3-v),rounded=Math.floor((a+digitUnit/2)/digitUnit)*digitUnit;
  return result('Round '+(a/1000).toFixed(3)+' to the nearest '+(['whole number','tenth','hundredth'][v])+'.',
   (rounded/1000).toFixed(v),'Inspect the digit immediately to the right of the rounding place.',
   'Round that place up when the next digit is at least 5; result '+(rounded/1000).toFixed(v)+'.');
 }
 case 'g5s-nbt-mult':
  requireValue(a>=100&&a<=999&&b>=10&&b<=99);
  return result('Multiply '+a+' × '+b+' using whole-number place value.',String(a*b),
   'Multiply by '+(b%10)+' and '+(Math.floor(b/10)*10)+' separately.',
   'Add the partial products to obtain '+a*b+'.');
 case 'g5s-nbt-div':
  requireValue(a>=11&&a<=99&&b>=12&&b<=99&&a*b<=9999);
  return result('Find '+a*b+' ÷ '+a+' (a two-digit divisor).',String(b),
   'Use multiplication to check the quotient: '+a+' × '+b+' = '+a*b+'.',
   'Therefore the exact whole-number quotient is '+b+'.');
 case 'g5s-nbt-dec-add':
 case 'g5s-nbt-dec-sub':
  requireValue(a>=10&&a<=999&&b>=1&&b<=a);
  return result('Calculate '+cents(a)+(kind.endsWith('add')?' + ':' − ')+cents(b)+'.',
   cents(kind.endsWith('add')?a+b:a-b),
   'Align decimal points; both operands are in hundredths.',
   'Compute '+a+(kind.endsWith('add')?' + ':' − ')+b+' hundredths, then return to decimal units.');
 case 'g5s-nbt-dec-mul':
  requireValue(a>=10&&a<=999&&b>=10&&b<=99);
  return result('Calculate '+cents(a)+' × '+cents(b)+'. Give the exact decimal product.',fixed4(a*b),
   'Multiply the whole-number hundredth counts: '+a+' × '+b+' = '+a*b+'.',
   'Both inputs have two decimal places, so place four digits after the decimal before removing trailing zeros.');
 case 'g5s-nbt-dec-div':
  requireValue(a>=10&&a<=99&&b>=2&&b<=80&&a*b<=9999);
  return result('Calculate '+cents(a*b)+' ÷ '+cents(a)+'.',String(b),
   'Multiply both dividend and divisor by 100 to remove decimals.',
   'Then '+a*b+' ÷ '+a+' = '+b+'.');
 case 'g5s-nf-add':
 case 'g5s-nf-sub':
 case 'g5s-nf-story':{
  requireValue(a>=1&&b>=2&&c>=1&&d>=2&&a<b&&c<d);
  const subtraction=kind==='g5s-nf-sub';
  requireValue(!subtraction||a*d>=b*c);
  const n=a*d+(subtraction?-1:1)*b*c,den=b*d;
  const answer=frac(n,den);
  if(kind==='g5s-nf-story')return result('A project uses '+a+'/'+b+' metre of red ribbon and '+c+'/'+d+' metre of blue ribbon. How many metres altogether?',
   answer+' metres','Find a common denominator '+den+' for the two ribbon lengths.',
   'Add '+(a*d)+'/'+den+' and '+(b*c)+'/'+den+'; simplify to '+answer+' metres.');
  return result((subtraction?'Subtract ':'Add ')+a+'/'+b+(subtraction?' − ':' + ')+c+'/'+d+'. Simplify the answer.',
   answer,'Use common denominator '+den+'; the equivalent numerators are '+(a*d)+' and '+(b*c)+'.',
   'Combine and reduce '+n+'/'+den+' = '+answer+'.');
 }
 case 'g5s-nf-share':
  requireValue(a>=2&&b>=3);
  return result('Share '+a+' identical pizzas equally among '+b+' people. What fraction of a pizza does each person receive?',
   frac(a,b),'Equal sharing is division: '+a+' ÷ '+b+' = '+a+'/'+b+'.',
   'Reduce the fraction to '+frac(a,b)+'.');
 case 'g5s-nf-mul':
 case 'g5s-nf-area':
  requireValue(a>=1&&b>=2&&c>=1&&d>=2&&a<b&&c<d);
  return result(kind==='g5s-nf-area'?'A rectangular mat measures '+a+'/'+b+' metre by '+c+'/'+d+' metre. Find its exact area.':
   'Multiply '+a+'/'+b+' × '+c+'/'+d+'. Simplify.',
   frac(a*c,b*d)+(kind==='g5s-nf-area'?' m²':''),
   'Multiply numerators '+a+' × '+c+' = '+a*c+' and denominators '+b+' × '+d+' = '+b*d+'.',
   'Reduce '+a*c+'/'+b*d+' to '+frac(a*c,b*d)+(kind==='g5s-nf-area'?' square metres.':'.'));
 case 'g5s-nf-scale':
  requireValue(a>=2&&b>=2&&c>=1&&c<=b+5&&b!==c);
  return result('Without evaluating the product, compare '+a+' × ('+c+'/'+b+') with '+a+'. Is the product greater or less?',
   c>b?'greater':'less','A factor greater than 1 enlarges a positive number; a factor below 1 reduces it.',
   c+'/'+b+(c>b?' is greater than 1, so the product increases.':' is less than 1, so the product decreases.'));
 case 'g5s-nf-mixed':{
  requireValue(a>=1&&a<=5&&b>=1&&c>=2&&b<c&&d>=2);
  const answer=frac((a*c+b)*d,c);
  return result('One craft kit uses '+a+' '+b+'/'+c+' metres of string. How many metres do '+d+' kits use?',
   answer+' metres','Convert the mixed number to '+(a*c+b)+'/'+c+'.',
   'Multiply by '+d+': '+((a*c+b)*d)+'/'+c+' = '+answer+' metres.');
 }
 case 'g5s-nf-unit-div':
  requireValue(a>=2&&b>=2);
  return result('A '+1+'/'+a+'-cup portion is split equally among '+b+' people. How many cups per person?',
   frac(1,a*b)+' cup','Divide the unit fraction by '+b+' equal shares.',
   '(1/'+a+') ÷ '+b+' = 1/'+(a*b)+' cup.');
 case 'g5s-nf-whole-div':
  requireValue(a>=2&&b>=1);
  return result('How many 1/'+a+'-cup servings fit in '+b+' cups?',String(a*b)+' servings',
   'Dividing by 1/'+a+' counts '+a+' equal servings per cup.',
   b+' × '+a+' = '+a*b+' servings.');
 case 'g5s-md-convert':
  requireValue(a>=1&&a<=50&&b>=1&&b<=99);
  return result('A ribbon is '+a+' metres and '+b+' centimetres long. Find its total length in centimetres.',
   String(100*a+b)+' cm','Each metre contains 100 centimetres: '+a+' m = '+100*a+' cm.',
   'Add the leftover '+b+' cm to get '+(100*a+b)+' cm.');
 case 'g5s-md-lineplot':{
  requireValue(a>=1&&a<=4&&b>=1&&b<=4&&c>=1&&c<=4&&d>=1&&d<=4);
  const eighths=a+2*b+3*c+4*d,ans=frac(eighths,8);
  return result('The line plot shows '+(a+b+c+d)+' ribbon pieces, measured in inches. What is their combined length? Read the X marks above 1/8, 1/4, 3/8 and 1/2.',
   ans+' inches','Convert measurements to eighths: 1/4=2/8, 3/8=3/8, 1/2=4/8.',
   'Add '+a+' + 2 × '+b+' + 3 × '+c+' + 4 × '+d+' = '+eighths+' eighths; simplify to '+ans+' inches.');
 }
 case 'g5s-md-unitcube':
  requireValue(a>=1&&b>=1);
  return result('One unit cube measures 1 cm on every edge. A model contains '+a+' rows of '+b+' such cubes with no gaps. What is the model volume?',
   a*b+' cm³','One 1-cm × 1-cm × 1-cm unit cube has volume 1 cm³.',
   'Count '+a+' × '+b+' = '+a*b+' cubes, giving '+a*b+' cm³.');
 case 'g5s-md-countcubes':
  requireValue(a>=2&&b>=2&&c>=2);
  return result('A block contains '+a+' layers, with '+b+' rows of '+c+' one-cubic-inch cubes in each layer. How many cubic inches?',
   a*b*c+' in³','Each layer has '+b+' × '+c+' = '+b*c+' unit cubes.',
   a+' equal layers contain '+a*b*c+' cubes, so volume is '+a*b*c+' in³.');
 case 'g5s-md-prism':
  requireValue(a>=2&&b>=2&&c>=2);
  return result('Find the volume of a rectangular prism measuring '+a+' cm by '+b+' cm by '+c+' cm.',
   a*b*c+' cm³','Use volume = base area × height.',
   a+' × '+b+' × '+c+' = '+a*b*c+' cm³.');
 case 'g5s-md-additive':
  requireValue(a>=2&&b>=2&&c>=1&&d>=1);
  return result('Two non-overlapping right rectangular prisms form a solid. Both have base '+a+' cm by '+b+' cm; their heights are '+c+' cm and '+d+' cm. Find total volume.',
   a*b*(c+d)+' cm³','Volume is additive for non-overlapping solids.',
   'Volumes: '+(a*b*c)+' + '+(a*b*d)+' = '+(a*b*(c+d))+' cm³.');
 case 'g5s-g-read':
  requireValue(a>=1&&a<=9&&b>=1&&b<=9);
  return result('Read point P on the first-quadrant coordinate grid. What ordered pair (x, y) does it represent?',
   '('+a+', '+b+')','First read the horizontal x-coordinate: '+a+'.',
   'Then read the vertical y-coordinate: '+b+'; P = ('+a+', '+b+').');
 case 'g5s-g-plot':
  requireValue(a>=1&&a<=9&&b>=1&&b<=9);
  return result('Plot P = ('+a+', '+b+') on the blank first-quadrant grid. Describe the move from the origin.',
   a+' right, '+b+' up','Start at the origin (0, 0).',
   'Move '+a+' along the x-axis, then '+b+' along the y-axis; label P.');
 case 'g5s-g-hierarchy':{
  requireValue(v<=4);
  const pairs:[string,string,boolean][]=[
   ['square','rectangle',true],['rectangle','parallelogram',true],['square','rhombus',true],
   ['rhombus','parallelogram',true],['rectangle','square',false]
  ];const [sub,sup,yes]=pairs[v];
  return result('In the hierarchy of quadrilaterals, is every '+sub+' a '+sup+'? Answer yes or no.',
   yes?'Yes':'No','Use definitions: rectangles have four right angles; rhombi have four equal sides.',
   yes?'Every '+sub+' has the defining properties of a '+sup+'.':'Not every rectangle has four equal sides, so not every rectangle is a square.');
 }
 case 'g5s-g-classify':{
  requireValue(v<=4);
  const qs=[
   'A quadrilateral has four equal sides and four right angles. What is its most specific name?',
   'A quadrilateral has four right angles, opposite equal sides, and unequal adjacent sides. Name it.',
   'A quadrilateral has both pairs of opposite sides parallel, with no right angles and unequal adjacent sides. Name it.',
   'A quadrilateral has four equal sides but no right angles. Name it.',
   'A quadrilateral has exactly one pair of parallel opposite sides. Name it (exactly one parallel pair).'
  ];const ans=['square','rectangle','parallelogram','rhombus','trapezoid'][v];
  return result(qs[v],ans,'Identify the defining side, angle and parallel-line properties.',
   'The best classification from the given properties is '+ans+'.');
 }
 }
 throw Error('Unsupported Grade 5 standard kind');
}
export function grade5FullValues(r:Rng,kind:Grade5FullKind,level:'easy'|'standard'|'challenge'):Values{
 const cap=level==='easy'?5:level==='standard'?8:12;
 let a=0,b=0,c=0,d=0,v=0;
 switch(kind){
 case 'g5s-oa-eval':a=r.int(2,cap);c=r.int(1,cap);b=r.int(c,2*cap);d=r.int(1,Math.min(8,cap));break;
 case 'g5s-oa-expression':a=r.int(2,cap+3);b=r.int(2,cap+5);c=r.int(1,cap+7);break;
 case 'g5s-oa-pattern':a=r.int(2,cap);b=2*a;c=r.int(1,7);break;
 case 'g5s-nbt-place':a=r.int(1,9);break;
 case 'g5s-nbt-power':a=r.int(101,999);b=r.int(1,2);v=r.int(0,1);break;
 case 'g5s-nbt-expand':a=r.int(1,9);b=r.int(0,9);c=r.int(0,9);d=r.int(0,9);break;
 case 'g5s-nbt-compare':a=r.int(101,8999);b=r.int(101,8999);break;
 case 'g5s-nbt-round':a=r.int(1011,9999);v=r.int(0,2);break;
 case 'g5s-nbt-mult':a=r.int(101,999);b=r.int(11,89);break;
 case 'g5s-nbt-div':a=r.int(12,89);b=r.int(11,99);break;
 case 'g5s-nbt-dec-add':case 'g5s-nbt-dec-sub':a=r.int(100,900);b=r.int(10,a);break;
 case 'g5s-nbt-dec-mul':a=r.int(110,900);b=r.int(11,89);break;
 case 'g5s-nbt-dec-div':a=r.int(11,90);b=r.int(2,Math.min(80,Math.floor(9999/a)));break;
 case 'g5s-nf-add':case 'g5s-nf-sub':case 'g5s-nf-story':
  b=r.int(2,cap+5);a=r.int(1,b-1);d=r.int(2,cap+5);c=r.int(1,d-1);
  if(kind==='g5s-nf-sub'&&a*d<b*c){[a,c]=[c,a];[b,d]=[d,b];}break;
 case 'g5s-nf-share':a=r.int(2,cap+6);b=r.int(3,cap+8);break;
 case 'g5s-nf-mul':case 'g5s-nf-area':b=r.int(2,cap+5);a=r.int(1,b-1);d=r.int(2,cap+5);c=r.int(1,d-1);break;
 case 'g5s-nf-scale':a=r.int(2,cap+9);b=r.int(2,cap+3);c=r.int(1,b+5);if(c===b)c++;break;
 case 'g5s-nf-mixed':a=r.int(1,4);c=r.int(2,cap+5);b=r.int(1,c-1);d=r.int(2,cap);break;
 case 'g5s-nf-unit-div':a=r.int(2,cap+6);b=r.int(2,cap+4);break;
 case 'g5s-nf-whole-div':a=r.int(2,cap+5);b=r.int(1,cap);break;
 case 'g5s-md-convert':a=r.int(1,cap*3);b=r.int(1,99);break;
 case 'g5s-md-lineplot':a=r.int(1,4);b=r.int(1,4);c=r.int(1,4);d=r.int(1,4);break;
 case 'g5s-md-unitcube':a=r.int(1,cap);b=r.int(1,cap);break;
 case 'g5s-md-countcubes':case 'g5s-md-prism':a=r.int(2,cap);b=r.int(2,cap);c=r.int(2,cap);break;
 case 'g5s-md-additive':a=r.int(2,cap);b=r.int(2,cap);c=r.int(1,cap);d=r.int(1,cap);break;
 case 'g5s-g-read':case 'g5s-g-plot':a=r.int(1,9);b=r.int(1,9);break;
 case 'g5s-g-hierarchy':case 'g5s-g-classify':v=r.int(0,4);break;
 default:throw Error('Missing Grade 5 value generator');
 }
 return {a,b,c,d,v};
}
/** Student diagrams show the *data*, never a textual solution or answer annotation. */
export function grade5FullDiagram(kind:Grade5FullKind,z:Values):string{
 if(kind==='g5s-md-lineplot'){
  const xs=[60,123,186,249],ys=[z.a,z.b,z.c,z.d],ticks=['1/8','1/4','3/8','1/2'];
  const marks=xs.map((x,i)=>Array.from({length:ys[i]},(_,j)=>'<text x="'+x+'" y="'+(75-j*17)+'" text-anchor="middle" font-size="16" fill="#14537e">×</text>').join('')).join('');
  const labels=xs.map((x,i)=>'<text x="'+x+'" y="110" text-anchor="middle" font-size="12" fill="#243b53">'+ticks[i]+'</text>').join('');
  return '<svg viewBox="0 0 310 130" role="img" aria-label="Line plot of fractional measurements, where X marks are counts"><path d="M 34 94 H 276" stroke="#233f5a" stroke-width="1.7"/>'+xs.map(x=>'<path d="M '+x+' 90 v 8" stroke="#233f5a" stroke-width="1.5"/>').join('')+marks+labels+'<text x="155" y="126" text-anchor="middle" font-size="11">length (inches)</text></svg>';
 }
 if(kind==='g5s-g-read'||kind==='g5s-g-plot'){
  const x0=39,y0=228,step=19;
  const grid=Array.from({length:11},(_,i)=>'<path d="M '+(x0+i*step)+' '+y0+' V '+(y0-10*step)+' M '+x0+' '+(y0-i*step)+' H '+(x0+10*step)+'" stroke="#d3dfe8" stroke-width="1"/>').join('');
  const tick=Array.from({length:11},(_,i)=>'<text x="'+(x0+i*step)+'" y="'+(y0+14)+'" text-anchor="middle" font-size="9" fill="#334d64">'+i+'</text><text x="'+(x0-12)+'" y="'+(y0-i*step+3)+'" font-size="9" text-anchor="middle" fill="#334d64">'+i+'</text>').join('');
  const dot=kind==='g5s-g-read'?'<circle cx="'+(x0+z.a*step)+'" cy="'+(y0-z.b*step)+'" r="5" fill="#0c6f77"/><text x="'+(x0+z.a*step+9)+'" y="'+(y0-z.b*step-7)+'" font-size="12" fill="#0c6f77">P</text>':'';
  return '<svg viewBox="0 0 265 266" role="img" aria-label="'+(dot?'First quadrant grid with a point P':'Blank first quadrant coordinate grid')+'">'+grid+'<path d="M '+x0+' '+(y0-10*step)+' V '+y0+' H '+(x0+10*step)+'" fill="none" stroke="#1a3a53" stroke-width="2"/>'+tick+dot+'<text x="253" y="240" font-size="12">x</text><text x="25" y="28" font-size="12">y</text></svg>';
 }
 return '';
}
