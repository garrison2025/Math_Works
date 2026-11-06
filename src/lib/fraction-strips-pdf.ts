/** R72 real equal-whole fraction strip charts for coloring or labelled keys.
 * Every N-th unit has the same physical width (in PDF points). No raster
 * screenshots, pseudo-fractions or incorrect denominator area ratios.
 */
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {verifyFractionStrips,type FractionStripsPack} from './fraction-strips.ts';
import type {Paper} from './pdf.ts';
const sizes:Record<Paper,[number,number]>={A4:[595.28,841.89],Letter:[612,792]};
const ink=rgb(.12,.19,.28),muted=rgb(.37,.46,.54),accent=rgb(.14,.37,.60),shade=rgb(.95,.97,.99);
export const FRACTION_STRIP_PRINT_WIDTH_PT=420 as const;
export const FRACTION_STRIP_ROW_HEIGHT_PT=32 as const;
export async function createFractionStripsPdf(pack:FractionStripsPack,paper:Paper):Promise<Uint8Array>{
 verifyFractionStrips(pack);
 if(!Object.hasOwn(sizes,paper))throw Error('Invalid fraction strip paper');
 const doc=await PDFDocument.create(),[width,height]=sizes[paper];
 const page=doc.addPage([width,height]),regular=await doc.embedFont(StandardFonts.Helvetica),
  bold=await doc.embedFont(StandardFonts.HelveticaBold);
 // Leave enough room for the printed row name, including '12 equal parts'.
 const left=120,stripWidth=FRACTION_STRIP_PRINT_WIDTH_PT;
 page.drawText('Printable Fraction Strips',{x:42,y:height-58,font:bold,size:18,color:ink});
 page.drawText(pack.mode==='blank'?'BLANK UNIT FRACTION STRIPS | SHADE, CUT OR COMPARE':
  'LABELED UNIT FRACTION STRIPS | TEACHER REFERENCE',
  {x:42,y:height-83,font:bold,size:9,color:accent});
 page.drawText('All rows represent the same whole. Every cell in row N is exactly 1/N of the whole.',
  {x:42,y:height-107,font:regular,size:9,color:muted});
 page.drawText(pack.mode==='blank'?'Name: _______________________________     Date: ______________':
  'Each individual cell is marked with its simplified unit fraction.',
  {x:42,y:height-126,font:regular,size:8.8,color:muted});
 for(const [index,strip] of pack.cells.entries()){
  const denominator=strip.denominator,y=height-169-index*54;
  const prefix=denominator===1?'Whole':denominator+' equal parts';
  page.drawText(prefix,{x:42,y:y+10,font:regular,size:8.3,color:ink});
  const cellWidth=stripWidth/denominator;
  for(let c=0;c<denominator;c++){
   const x=left+cellWidth*c;
   page.drawRectangle({x,y,width:cellWidth,height:FRACTION_STRIP_ROW_HEIGHT_PT,
    borderColor:ink,borderWidth:1.05,color:pack.mode==='labeled'&&c===0?shade:rgb(1,1,1)});
   if(pack.mode==='labeled'){
    const label=strip.labels[c],size=denominator>=10?8:9.4;
    const tw=bold.widthOfTextAtSize(label,size);
    page.drawText(label,{x:x+(cellWidth-tw)/2,y:y+11,font:bold,size,color:accent});
   }
  }
 }
 const lastY=height-169-(pack.cells.length-1)*54;
 const helpY=Math.max(74,lastY-45);
 page.drawText(pack.mode==='blank'?
  'Color a single part of each row, then write the unit fraction for that part.':
  'Check: '+pack.cells.map(row=>'1/'+row.denominator).join('  '),
  {x:42,y:helpY,font:regular,size:8.4,color:muted});
 page.drawText('All strips share one 420 pt whole. Print at Actual size (100%); colors may be added with a pencil.',
  {x:42,y:53,font:regular,size:7.9,color:muted});
 page.drawText('R72.1 | '+pack.set+' | '+pack.mode+' | '+paper+' | Worksheet Studio',
  {x:42,y:35,font:regular,size:7.3,color:muted});
 doc.setCreator('Math Worksheet Studio');
 doc.setTitle('Fraction Strips '+pack.set+' - '+pack.mode+' - '+paper+' - R72.1');
 doc.setSubject('Exact equal-whole vector fraction strip partitions, separate from fractions arithmetic generator v18');
 return doc.save();
}
