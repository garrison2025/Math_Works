#!/usr/bin/env python3
"""R52 verify ACTUAL exported vector length and direction, not source values.
Physical paper and printer are outside the scope of this automated check.
"""
import json
import sys
from pathlib import Path
import fitz

PT_MM = 72 / 25.4
TOL = 0.11
PAPERS = {'letter': (612, 792), 'a4': (595.28, 841.89)}

def segments(page):
    out = []
    for drawing in page.get_drawings():
        for shape in drawing['items']:
            if shape[0] == 'l':
                out.append((shape[1], shape[2]))
    return out

def near(a,b):
    return abs(a-b) <= TOL

def classify(actual):
    rows = []
    for a,b in actual:
        dx = abs(a.x-b.x)
        dy = abs(a.y-b.y)
        if near(dx,100*PT_MM) and near(dy,0):
            rows.append('H100')
        if near(dy,100*PT_MM) and near(dx,0):
            rows.append('V100')
        if near(dx,50*PT_MM) and near(dy,0):
            rows.append('H50')
        if (near(dx,25*PT_MM) and near(dy,0)) or (near(dy,25*PT_MM) and near(dx,0)):
            rows.append('S25')
    return rows

def validate_page(page,filename,paper):
    size=PAPERS[paper]
    if page.rect.width!=page.rect.width or any(
      abs(value-target)>.12 for value,target in zip((page.rect.width,page.rect.height),size)):
        raise AssertionError(filename+': paper size not '+paper)
    found=classify(segments(page))
    expected={'H100':1,'V100':1,'H50':1,'S25':4}
    for key,count in expected.items():
        if found.count(key)!=count:
            raise AssertionError(filename+': expected '+str(count)+' '+key+' vectors, found '+str(found.count(key)))
    rect=page.rect
    for a,b in segments(page):
        if not all(35<=point.x<=rect.width-35 and 35<=point.y<=rect.height-35 for point in (a,b)):
            raise AssertionError(filename+': calibration vector outside 35pt print safe area')
    text=page.get_text()
    for token in ['100 mm horizontal','100 mm vertical','50 mm','25 x 25 mm','Actual size']:
        if token not in text:
            raise AssertionError(filename+': missing printer instruction '+token)
    return dict(filename=filename,paper=paper,measuredSegments=found,
      geometry='100mm H/V, 50mm H and 25mm square, all correct PDF vectors',
      actualPrinterOutput='NOT MEASURED')

def run(folder):
    evidence=[]
    for paper in PAPERS:
        name='printer-calibration-'+paper+'.pdf'
        with fitz.open(folder/name) as doc:
            if len(doc)!=1:raise AssertionError(name+': expected exactly one page')
            evidence.append(validate_page(doc[0],name,paper))
    report={'status':'PASS','digitalVectors':evidence,
       'physicalMeasurements':'NOT RUN - needs actual printed A4/Letter paper and ruler'}
    (folder/'vector-audit.json').write_text(json.dumps(report,indent=2))
    print('R52 true-PDF printer calibration geometry PASS: 2 pages, 100mm X/Y, 50mm and 25mm square; actual printer NOT measured')

if __name__=='__main__':run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/print-calibration'))
