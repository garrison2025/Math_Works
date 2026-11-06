"""R72 real-PDF fraction strip geometry audit, independent of JS arithmetic.
Compare every printed partition rectangle against the same exact 420 pt whole,
test equal widths and 1/n labels, reject teacher text in blank student charts.
"""
from __future__ import annotations
from pathlib import Path
import json
import math
import sys
import fitz

SIZES={'a4':(595.28,841.89),'letter':(612.,792.)}
def inspect(folder:Path,case:dict):
    file=folder/case['filename']
    if not file.is_file():raise AssertionError(f'Missing real strip file {file}')
    with fitz.open(file) as doc:
        if doc.page_count!=1:raise AssertionError(f'{file}: strip charts must fit one page')
        page=doc[0]
        width,height=SIZES[case['paper'].lower()]
        if abs(page.rect.width-width)>.12 or abs(page.rect.height-height)>.12:
            raise AssertionError(f'{file}: paper MediaBox wrong')
        bounds=[]
        for drawing in page.get_drawings():
            # Border rectangles from pdf-lib can be encoded as
            # a closed sequence of vector lines, not necessarily 're'.
            # Its real PyMuPDF path bounds remain exact regardless.
            rect=drawing.get('rect')
            if rect and abs(rect.height-32)<.5 and 30<rect.width<425:
                bounds.append(fitz.Rect(rect))
        expected=sum(case['denominators'])
        if len(bounds)!=expected:
            raise AssertionError(f'{file}: {len(bounds)} actual cell rectangles, expected {expected}')
        bounds.sort(key=lambda r:(round(r.y0,1),r.x0))
        words=page.get_text('words')
        cursor=0
        for row,n in enumerate(case['denominators']):
            cells=sorted(bounds[cursor:cursor+n],key=lambda r:r.x0)
            cursor+=n
            if len(cells)!=n:raise AssertionError(f'{file}: row {n} missing cells')
            x=120.0
            for c,rect in enumerate(cells):
                expected_width=420.0/n
                if abs(rect.x0-x)>.25 or abs(rect.width-expected_width)>.35:
                    raise AssertionError(f'{file}: row {n} cell {c} is not equal partition: {rect}')
                if abs(rect.height-32)>.25:
                    raise AssertionError(f'{file}: row {n} printed partition has wrong height')
                x+=expected_width
                visible=[]
                for x0,y0,x1,y1,word,*_ in words:
                    cx,cy=(x0+x1)/2,(y0+y1)/2
                    if rect.x0+1<cx<rect.x1-1 and rect.y0+1<cy<rect.y1-1:
                        visible.append(word)
                if case['mode']=='blank':
                    if visible:raise AssertionError(f'{file}: student strip cell leaks teacher labels: {visible}')
                elif visible!=['1/'+str(n)]:
                    raise AssertionError(f'{file}: teacher strip cell label wrong: {visible} at {n}th')
            if abs(cells[-1].x1-540.0)>.35:
                raise AssertionError(f'{file}: row {n} does not equal universal 420pt whole')
        for word in page.get_text('words'):
            if word[0]<35 or word[2]>width-35 or word[1]<26 or word[3]>height-26:
                raise AssertionError(f'{file}: text outside print-safe margin {word}')
        return {'name':file.name,'truePartitionRectangles':len(bounds),
         'sameWholeWidthPt':420,'denominatorRows':len(case['denominators']),
         'labeledCellCount':len(bounds) if case['mode']=='labeled' else 0,
         'blankCellCount':len(bounds) if case['mode']=='blank' else 0,
         'physicalPrintChecked':False}

def main(folder:Path):
    cases=json.loads((folder/'r72-fraction-strips-fixtures.json').read_text())
    if len(cases)!=8:raise AssertionError('Eight original strip PDFs required')
    results=[inspect(folder,x) for x in cases]
    summary={'status':'PASS','realPDFs':8,
     'independentPartitionRectangles':sum(x['truePartitionRectangles'] for x in results),
     'teacherCellsIndependentlyVerified':sum(x['labeledCellCount'] for x in results),
     'blankStudentCellsChecked':sum(x['blankCellCount'] for x in results),
     'sameWholePhysicalWidthPt':420,
     'manualPrinterVerification':'NOT RUN','teacherSignoff':'NOT RUN',
     'cases':results}
    (folder/'independent-r72-strip-geometry.json').write_text(json.dumps(summary,indent=2)+'\n')
    print('R72 PASS: 8 actual PDFs,',summary['independentPartitionRectangles'],
     'equal-whole partition cells,',summary['teacherCellsIndependentlyVerified'],'verified teacher labels')

if __name__=='__main__':
    main(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r72-fraction-strips'))
