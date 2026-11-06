#!/usr/bin/env python3
"""R59: inspect actual PDF scatter plots, not screenshots or TS geometry.

For each printed chart, recover true vector axes, gridlines, numeric labels
and any PDF-painted data circles. Recompute pixel positions from the six raw
integer coordinate pairs in the manifest. The student "plot" chart MUST have
zero data circles; the separate answer chart MUST have six exact points.
Print scale and classroom judgment cannot be established by this audit.
"""
from pathlib import Path
import json
import re
import sys
import fitz

DARK=(.105,.39,.65)
GRID=(.87,.91,.95)
WIDTH=235*.8
HEIGHT=128*.75

def near(a,b,t=.55):
    return abs(a-b)<=t

def colormatch(found,target,tol=.033):
    return found is not None and len(found)>=3 and all(abs(x-y)<tol for x,y in zip(found,target))

def geometric_ticks(observed,start,interval,count,label,eps=.6):
    """Never trust renderer-produced tick positions as expected values."""
    if len(observed)!=count:
        raise AssertionError(f'{label}: expected {count} PDF marks, saw {len(observed)}')
    for index,(value) in enumerate(sorted(observed)):
        goal=start+interval*index
        if not near(value,goal,eps):
            raise AssertionError(f'{label}: mark {index} is {value:.3f} instead of {goal:.3f}')
    return count

def vectors(page,color,thickness):
    lines=[]
    for d in page.get_drawings():
        if not colormatch(d.get('color'),color) or not near(d.get('width',0),thickness,.045):
            continue
        for item in d['items']:
            if item[0]=='l':
                lines.append((item[1],item[2]))
    return lines

def origin_and_marks(page):
    main=vectors(page,DARK,1.1)
    xs=[(a,b) for a,b in main if near(a.y,b.y,.15) and near(abs(a.x-b.x),WIDTH,.25)]
    ys=[(a,b) for a,b in main if near(a.x,b.x,.15) and near(abs(a.y-b.y),HEIGHT,.25)]
    if len(xs)!=1 or len(ys)!=1:
        raise AssertionError(f'R59 expected one real x and y axis: {len(xs)}, {len(ys)}')
    x0=min(xs[0][0].x,xs[0][1].x)
    y0=max(ys[0][0].y,ys[0][1].y)
    if not near(min(ys[0][0].x,ys[0][1].x),x0,.35) or not near(xs[0][0].y,y0,.35):
        raise AssertionError('Printed scatter axes do not share the mathematical origin')
    light=vectors(page,GRID,.5)
    xmarks=sorted(a.x for a,b in light
                  if near(a.x,b.x,.15) and near(abs(a.y-b.y),HEIGHT,.25)
                  and x0-2<=a.x<=x0+WIDTH+2)
    ymarks=sorted(a.y for a,b in light
                  if near(a.y,b.y,.15) and near(abs(a.x-b.x),WIDTH,.25)
                  and y0-HEIGHT-2<=a.y<=y0+2)
    geometric_ticks(xmarks,x0,WIDTH/7,8,'x grid')
    geometric_ticks(ymarks,y0-HEIGHT,HEIGHT/5,6,'y grid')
    return x0,y0,xmarks,ymarks

def printed_number_spans(page):
    spans=[]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line.get('spans',[]):
                s=span['text'].strip()
                if re.fullmatch(r'\d+',s) and near(span['size'],7,.16):
                    spans.append((int(s),fitz.Rect(span['bbox'])))
    return spans

def verify_numbers(page,x0,y0):
    spans=printed_number_spans(page)
    xlabels=[(value,box) for value,box in spans
             if x0-3<=box.x0 and box.x1<=x0+WIDTH+4
             and y0+3<box.y0<y0+22]
    ylabels=[(value,box) for value,box in spans
             if x0-24<=box.x0<x0-4 and box.x1<x0+1
             and y0-HEIGHT-9<box.y0<y0+12]
    if len(xlabels)!=8 or len(ylabels)!=6:
        raise AssertionError(f'R59 missing/duplicate PDF numeric labels: x={len(xlabels)} y={len(ylabels)}')
    for value,box in xlabels:
        if value not in range(8):
            raise AssertionError('Unexpected x tick number')
        if not near((box.x0+box.x1)/2,x0+WIDTH*value/7,1.65):
            raise AssertionError(f'R59 printed X={value} does not align with PDF grid')
    for value,box in ylabels:
        if value not in range(0,11,2):
            raise AssertionError('Unexpected y tick number')
        if not near((box.y0+box.y1)/2,y0-HEIGHT*value/10,2.2):
            raise AssertionError(f'R59 printed Y={value} does not align with PDF grid')
    if sorted(value for value,_ in xlabels)!=list(range(8)):
        raise AssertionError('R59 X numeric tick order/values corrupted')
    if sorted(value for value,_ in ylabels)!=list(range(0,11,2)):
        raise AssertionError('R59 Y numeric tick order/values corrupted')
    return len(xlabels)+len(ylabels)

def painted_dots(page):
    centers=[]
    for drawing in page.get_drawings():
        if not colormatch(drawing.get('fill'),DARK):
            continue
        box=fitz.Rect(drawing.get('rect'))
        # pdf-lib fill circles have 6-point by 6-point half-radius in PDF units.
        if near(box.width,6,.4) and near(box.height,6,.4):
            if not any(item[0]=='c' for item in drawing['items']):
                raise AssertionError('R59 data marker was not a true circle vector')
            centers.append(((box.x0+box.x1)/2,(box.y0+box.y1)/2))
    return centers

def verify_dots(actual,points,x0,y0,visible):
    if len(points)!=6 or any(len(pair)!=2 for pair in points):
        raise AssertionError('R59 source must carry exactly six true coordinate pairs')
    if len(actual)!=(6 if visible else 0):
        raise AssertionError(f'R59 plotted {len(actual)} PDF dots; expected {6 if visible else 0}')
    if not visible:
        return 0
    expected=[]
    for i,(xx,yy) in enumerate(points):
        if xx!=i+1 or not isinstance(yy,int) or not 0<=yy<=10:
            raise AssertionError('R59 manifest has invalid scatter source values')
        expected.append((x0+WIDTH*xx/7,y0-HEIGHT*yy/10))
    # Compare as coordinate sets (not PDF command paint order).
    for (ax,ay),(ex,ey) in zip(sorted(actual),sorted(expected)):
        if not near(ax,ex,.55) or not near(ay,ey,.55):
            raise AssertionError(f'R59 actual printed dot ({ax:.2f}, {ay:.2f}) != ({ex:.2f}, {ey:.2f})')
    return len(actual)

def independently_check_trend(record):
    points=record['pairs']
    ym=sum(pair[1] for pair in points)/len(points)
    covariance=sum((pair[0]-3.5)*(pair[1]-ym) for pair in points)
    observed='positive' if covariance>1e-9 else 'negative' if covariance < -1e-9 else 'none'
    if observed!=record['trend']:
        raise AssertionError('R59 underlying scatter trend disagrees with independent covariance')
    if record['task']=='identify':
        expected='no clear linear trend' if observed=='none' else observed
        if record['answer']!=expected:
            raise AssertionError('R59 generated trend answer differs from underlying plotted data')
    else:
        pairs=re.findall(r'\((\d+), (\d+)\)',record['answer'])
        if [(int(x),int(y)) for x,y in pairs]!=[tuple(pair) for pair in points]:
            raise AssertionError('R59 plotting answer text differs from source points')

def verify_pdf(path,record):
    independently_check_trend(record)
    with fitz.open(path) as pdf:
        width=595.28 if record['paper']=='A4' else 612
        if pdf.page_count!=1 or not near(pdf[0].rect.width,width,.12):
            raise AssertionError(f'R59 wrong paper size or page count in {path.name}')
        page=pdf[0]
        x0,y0,_,_=origin_and_marks(page)
        labels=verify_numbers(page,x0,y0)
        dots=verify_dots(painted_dots(page),record['pairs'],x0,y0,
                         record['expectedDots']==6)
        return labels,dots

def run(directory):
    manifest=json.loads((directory/'manifest.json').read_text(encoding='utf8'))
    records=manifest['documents']
    if manifest['schema']!='mathworks-r59-scatter-vector/v1' or len(records)!=18:
        raise AssertionError('R59 expects 18 original trend/plot/answer A4/Letter PDFs')
    conditions={(r['trend'],r['task'],r['paper'],r['mode']) for r in records}
    expected={(trend,task,paper,mode)
              for trend in ['positive','negative','none']
              for task in ['identify','plot']
              for paper in ['A4','Letter']
              for mode in (['questions','answers'] if task=='plot' else ['questions'])}
    if conditions!=expected:
        raise AssertionError('R59 coverage is incomplete or has duplicates')
    glyphs=dots=0
    for record in records:
        n,d=verify_pdf(directory/record['file'],record)
        glyphs+=n
        dots+=d
    report={'status':'PASS','documents':18,'xAndYNumericLabels':glyphs,
            'actualDataCircles':dots,
            'scope':'true PDF axes, 8 x ticks, 6 y ticks, numeric labels, 6 data points, answer isolation and trend',
            'classroomApproval':'NOT RUN','physicalPrinter':'NOT MEASURED'}
    (directory/'scatter-vector-audit.json').write_text(json.dumps(report,indent=2))
    print(f'R59 true-PDF scatter PASS: 18 PDFs; {glyphs} numeric labels, {dots} actual data circles')
if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/scatter-chart-pdfs'))
