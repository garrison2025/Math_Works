/** R64: printable 1-12 table distinct from the randomized times-table
 * equation-drill generator. No user data or API; vector PDF only.
 */
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import type {Paper} from './pdf.ts';
export type MultiplicationGridMode='blank'|'key';
export const MULTIPLICATION_GRID_LIMIT=12;
const sheets:Record<Paper,readonly [number,number]>={Letter:[612,792],A4:[595.28,841.89]};
export function multiplicationGridValue(row:number,column:number):number{
 if(!Number.isSafeInteger(row)||!Number.isSafeInteger(column)||
    row<1||row>12||column<1||column>12)throw Error('Table indices must be whole numbers 1-12');
 return row*column;
}
const ink=rgb(.09,.14,.22),muted=rgb(.35,.42,.52),accent=rgb(.09,.35,.61),line=rgb(.68,.74,.81);
function centered(page:PDFPage,value:string,cx:number,cy:number,font:PDFFont,size:number,color=ink){
 const width=font.widthOfTextAtSize(value,size);
 page.drawText(value,{x:cx-width/2,y:cy-size*.35,font,size,color});
}
export async function createMultiplicationGridPdf(paper:Paper,mode:MultiplicationGridMode):Promise<Uint8Array>{
 if(!Object.hasOwn(sheets,paper))throw Error('Unsupported paper size');
 if(!['blank','key'].includes(mode))throw Error('Invalid multiplication grid mode');
 const [w,h]=sheets[paper],pdf=await PDFDocument.create(),page=pdf.addPage([w,h]);
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const isKey=mode==='key';
 page.drawText('Multiplication Table 1-12',
  {x:45,y:h-68,size:20,font:bold,color:ink});
 page.drawText(isKey?'ANSWER KEY - all 144 products shown':
   'BLANK PRACTICE - complete all 144 empty products',
  {x:45,y:h-91,size:11,font:bold,color:isKey?accent:muted});
 page.drawText(isKey?'Use this to check the separately printed blank table.':
   'Multiply the number at the left of each row by the number at the top of each column.',
  {x:45,y:h-111,size:isKey?9:8.6,font:regular,color:muted});
 page.drawText('Name: ___________________________   Date: ______________',
  {x:45,y:h-138,size:9,font:regular,color:muted});
 // A 13x13 square contains 144 multiplication answers plus row/column
 // heading cells. Calculated from the actual Letter/A4 MediaBox, not CSS.
 const cell=Math.min((w-86)/13,38);
 const side=13*cell,originX=(w-side)/2,top=h-181;
 const headBg=rgb(.90,.94,.98);
 const alternate=rgb(.974,.985,.995);
 for(let row=0;row<=12;row++){
  for(let col=0;col<=12;col++){
   const x=originX+col*cell,y=top-(row+1)*cell;
   page.drawRectangle({x,y,width:cell,height:cell,
    color:row===0||col===0?headBg:row%2===0?alternate:rgb(1,1,1),
    borderColor:line,borderWidth:.56});
   const value=row===0&&col===0?'×'
    :row===0?String(col)
    :col===0?String(row)
    :isKey?String(multiplicationGridValue(row,col)):'';
   if(value){
    centered(page,value,x+cell/2,y+cell/2,
     row===0||col===0?bold:regular,
     row===0||col===0?11:9.8,
     row===0||col===0?accent:ink);
   }
  }
 }
 const below=top-side-26;
 page.drawText('Rows and columns: 1 through 12  |  '+(isKey?'Complete answer table':'Write one product in each empty box'),
  {x:originX,y:below,font:regular,size:8.6,color:muted});
 page.drawText('Print at Actual size / 100% on '+paper+'. All 144 cells are vector shapes.',
  {x:45,y:51,font:regular,size:8,color:muted});
 page.drawText('Math Worksheet Studio  |  Free printable reference / practice',
  {x:45,y:37,font:regular,size:7.5,color:muted});
 pdf.setTitle('Multiplication Table 1-12 - '+(isKey?'Answer Key':'Blank Worksheet')+' - '+paper);
 pdf.setCreator('Math Worksheet Studio');
 pdf.setSubject('Standalone multiplication grid; not the randomized facts generator');
 return pdf.save();
}
