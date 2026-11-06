#!/usr/bin/env python3
"""R59 real PDF vectors: count-the-dots questions on both A4 and Letter.

Counts and positions must agree with the exact answer, and each circle
must be a separate vector path, not a raster screenshot. These are
number-recognition dots, not statistical frequency Dot Plots.
"""
from pathlib import Path
import json
import sys
import fitz

BLUE=(.105,.39,.65)
X_STEP=235*.13
Y_STEP=128*.40

def near(a,b,tol=.55):
    return abs(a-b)<=tol

def printed_circles(page):
    centers=[]
    for drawing in page.get_drawings():
        fill=drawing.get('fill')
        if fill is None or len(fill)<3 or any(abs(fill[i]-BLUE[i])>.034 for i in range(3)):
            continue
        bbox=fitz.Rect(drawing['rect'])
        if not near(bbox.width,6,.40) or not near(bbox.height,6,.40):
            continue
        if not any(item[0]=='c' for item in drawing['items']):
            raise AssertionError('Count circle replaced by non-circular PDF path')
        centers.append(((bbox.x0+bbox.x1)/2,(bbox.y0+bbox.y1)/2))
    return centers

def check_layout(centers,count,page_width,page_height):
    if not isinstance(count,int) or not 1<=count<=12:
        raise AssertionError('Invalid counting-dots source answer')
    if len(centers)!=count:
        raise AssertionError(f'Printed {len(centers)} independent circles, expected {count}')
    if len({(round(x,2),round(y,2)) for x,y in centers})!=count:
        raise AssertionError('Two dots occupy the same PDF coordinate')
    for x,y in centers:
        if not(36<x<page_width-36 and 36<y<page_height-36):
            raise AssertionError('A printed counting dot violates safe paper margins')
    start_x=min(x for x,y in centers)
    bottom_y=max(y for x,y in centers)
    ordered=sorted(centers,key=lambda p:(-round(p[1],1),p[0]))
    for i,(x,y) in enumerate(ordered):
        expected_x=start_x+(i%6)*X_STEP
        expected_y=bottom_y-(i//6)*Y_STEP
        if not near(x,expected_x) or not near(y,expected_y):
            raise AssertionError(f'Count {count}: dot {i+1} misplaced in PDF row/column grid')
    return len(ordered)

def run(directory):
    manifest=json.loads((directory/'manifest.json').read_text(encoding='utf8'))
    docs=manifest['documents']
    if manifest['schema']!='mathworks-r59-counting-dot-pdf/v1' or len(docs)!=24:
        raise AssertionError('R59 must provide the full 24-PDF count sample set')
    if {(d['count'],d['paper']) for d in docs}!={(i,p) for i in range(1,13) for p in ['A4','Letter']}:
        raise AssertionError('Counts 1..12 are missing or duplicated across paper sizes')
    total=0
    for record in docs:
        if int(record['answer'])!=record['count']:
            raise AssertionError('Generated numeric answer disagrees with source count')
        with fitz.open(directory/record['file']) as pdf:
            width=595.28 if record['paper']=='A4' else 612
            if pdf.page_count!=1 or not near(pdf[0].rect.width,width,.12):
                raise AssertionError('PDF not one A4/Letter page: '+record['file'])
            dots=printed_circles(pdf[0])
            total+=check_layout(dots,record['count'],width,pdf[0].rect.height)
    if total!=2*sum(range(1,13)):
        raise AssertionError('Unexpected total printed count')
    report={'status':'PASS','pdfDocuments':24,'countsVerified':list(range(1,13)),
            'uniqueVectorCircles':total,'scope':'real PDF circle paths, positions, integer answer and paper-safe margins',
            'statisticsDotPlotFeature':'NOT IMPLEMENTED',
            'teacherReview':'NOT RUN','physicalPrinter':'NOT MEASURED'}
    (directory/'dot-count-vector-audit.json').write_text(json.dumps(report,indent=2))
    print(f'R59 printed counting-dot audit PASS: 24 PDFs; {total} true circles for values 1..12')
if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/counting-dot-pdfs'))
