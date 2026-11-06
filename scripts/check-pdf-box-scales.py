#!/usr/bin/env python3
"""R58: independent geometry audit of *actual* printed modified box plots.

The oracle reads PyMuPDF vector strokes, numeric text rectangles and the
exported question's eight raw observations. It must not call the TypeScript
boxPracticeAxis, renderer or quartile implementation. A digital PASS is not
educator approval or physical-printer calibration.
"""
from pathlib import Path
import json
import math
import re
import sys
import fitz

BLUE=(.105,.39,.65)
BORDER=(.64,.26,.15)
AXIS_LENGTH=235*.87
TICK_LENGTH=128*.17
MARK_LENGTH=128*.32

def close(a,b,tol=.38):
    return abs(a-b)<=tol

def color_is(color,rgb):
    return color is not None and len(color)>=3 and all(abs(color[i]-rgb[i])<.034 for i in range(3))

def source_stats(raw):
    if len(raw)!=8 or any(not isinstance(v,int) for v in raw):
        raise AssertionError('R58 box fixtures require eight integer observations')
    a=sorted(raw)
    q1=(a[1]+a[2])/2
    mid=(a[3]+a[4])/2
    q3=(a[5]+a[6])/2
    iqr=q3-q1
    inside=[v for v in a if q1-1.5*iqr<=v<=q3+1.5*iqr]
    out=[v for v in a if not(q1-1.5*iqr<=v<=q3+1.5*iqr)]
    return q1,mid,q3,inside[0],inside[-1],out

def vector_lines(page):
    found=[]
    for drawing in page.get_drawings():
        if not color_is(drawing.get('color'),BLUE) or not close(drawing.get('width',0),1.1,.045):
            continue
        for item in drawing['items']:
            if item[0]=='l':
                found.append((item[1],item[2]))
    return found

def extract_chart(page,raw,mode):
    lines=vector_lines(page)
    axes=[(a,b) for a,b in lines
          if close(a.y,b.y) and close(abs(b.x-a.x),AXIS_LENGTH)]
    if len(axes)!=1:
        raise AssertionError(f'R58 expected one printed box axis, found {len(axes)}')
    a,b=axes[0]
    left=min(a.x,b.x)
    right=max(a.x,b.x)
    axis_y=a.y
    marks=sorted((a.x+b.x)/2 for a,b in lines
          if close(a.x,b.x) and close(abs(a.y-b.y),TICK_LENGTH)
          and close((a.y+b.y)/2,axis_y-(.005*128),.8)
          and left<=a.x<=right)
    if len(marks)<3 or len(marks)>12:
        raise AssertionError(f'R58 missing/multiplying box ticks: {len(marks)}')
    labels=[]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line.get('spans',[]):
                value=span['text'].strip()
                rect=fitz.Rect(span['bbox'])
                if not re.fullmatch(r'-?\d+(?:\.\d+)?',value):
                    continue
                if not close(span['size'],8,.15):
                    continue
                if not(left-2<rect.x0 and rect.x1<right+2):
                    continue
                if not (axis_y+7<rect.y0 and rect.y1<axis_y+45):
                    continue
                labels.append((float(value),(rect.x0+rect.x1)/2,rect))
    labels.sort(key=lambda record:record[1])
    if len(labels)!=len(marks):
        raise AssertionError(f'R58 tick text count {len(labels)} differs from actual vector ticks {len(marks)}')
    for (value,x,rect),tick_x in zip(labels,marks):
        if not close(x,tick_x,1.45):
            raise AssertionError(f'R58 label {value} is not centered on its tick: {x} vs {tick_x}')
        if not(rect.y0>axis_y+7):
            raise AssertionError('R58 numeric tick label overlaps upper box/whisker band')
    values=[entry[0] for entry in labels]
    intervals=[values[i+1]-values[i] for i in range(len(values)-1)]
    if any(delta<=0 or not close(delta,intervals[0],1e-6) for delta in intervals):
        raise AssertionError('R58 tick numbers are not a strictly increasing uniform scale')
    if values[0]>min(raw) or values[-1]<max(raw):
        raise AssertionError('R58 scale excludes an actual observed value')
    pixel_step=(marks[-1]-marks[0])/(values[-1]-values[0])
    for i,((value,_,_),mark) in enumerate(zip(labels,marks)):
        predicted=marks[0]+(value-values[0])*pixel_step
        if not close(mark,predicted,1.0):
            raise AssertionError(f'R58 tick at index {i} is visually uneven')
    if mode=='answers':
        q1,median,q3,lower,upper,outliers=source_stats(raw)
        project=lambda v:marks[0]+(v-values[0])*pixel_step
        boxes=[]
        for drawing in page.get_drawings():
            if not close(drawing.get('width',0),1.7,.08) or not color_is(drawing.get('color'),BLUE):
                continue
            # pdf-lib emits drawRectangle as four straight PDF line strokes;
            # PyMuPDF reports the bounding rect on the enclosing drawing,
            # rather than one PDF 're' item. Require all four box edges.
            edges=[item for item in drawing['items'] if item[0]=='l']
            if len(edges)==4:
                box=fitz.Rect(drawing['rect'])
                if box.width>0 and box.height>0:
                    boxes.append(box)
        if len(boxes)!=1:
            raise AssertionError(f'R58 expected a single printed solution box, found {len(boxes)}')
        if not close(boxes[0].x0,project(q1),1.5) or not close(boxes[0].x1,project(q3),1.5):
            raise AssertionError('R58 printed box edges disagree with independent Q1/Q3')
        caps=sorted((a.x+b.x)/2 for a,b in lines
              if close(a.x,b.x) and close(abs(a.y-b.y),MARK_LENGTH)
              and close((a.y+b.y)/2,axis_y,.75) and left<=a.x<=right)
        if len(caps)!=3:
            raise AssertionError(f'R58 expected lower/median/upper vectors, got {len(caps)}')
        for actual,target in zip(caps,sorted([lower,median,upper])):
            if not close(actual,project(target),1.5):
                raise AssertionError(f'R58 whisker/median at {actual} disagrees with {target}')
        found_outliers=[]
        for drawing in page.get_drawings():
            if (color_is(drawing.get('color'),BORDER)
                and close(drawing.get('width',0),1.5,.08)):
                rect=fitz.Rect(drawing['rect'])
                found_outliers.append((rect.x0+rect.x1)/2)
        if len(found_outliers)!=len(outliers):
            raise AssertionError(f'R58 outlier circle count {len(found_outliers)} != {len(outliers)}')
        for actual,target in zip(sorted(found_outliers),sorted(project(v) for v in outliers)):
            if not close(actual,target,1.5):
                raise AssertionError('R58 printed outlier at the wrong numeric position')
    else:
        for drawing in page.get_drawings():
            if color_is(drawing.get('color'),BORDER) and close(drawing.get('width',0),1.5,.08):
                raise AssertionError('R58 student practice PDF leaked a solved outlier')
    return len(marks)

def run(directory):
    manifest=json.loads((directory/'manifest.json').read_text(encoding='utf8'))
    records=manifest['documents']
    if len(records)!=16 or manifest['schema']!='mathworks-r58-box-scale/v1':
        raise AssertionError('R58 requires all 16 seeded sample PDFs')
    if sum(not entry['answer'].endswith('outliers=none') for entry in records)!=8:
        raise AssertionError('R58 must include 8 PDFs with genuine mathematical outliers')
    total_ticks=0
    for record in records:
        with fitz.open(directory/record['file']) as pdf:
            width=595.28 if record['paper']=='A4' else 612
            if len(pdf)!=1 or not close(pdf[0].rect.width,width,.12):
                raise AssertionError('R58 wrong PDF page count or A4/Letter width: '+record['file'])
            total_ticks+=extract_chart(pdf[0],record['raw'],record['mode'])
    report={'status':'PASS','pdfFiles':len(records),'numericTicks':total_ticks,
            'checked':'actual vector ticks, printed numeric captions below axis, independent five-number geometry, outlier circles',
            'educatorReview':'NOT RUN','physicalPrinter':'NOT MEASURED'}
    (directory/'box-pdf-scale-audit.json').write_text(json.dumps(report,indent=2))
    print('R58 printed box-scale audit PASS:',len(records),'PDFs,',total_ticks,'numeric ticks')
if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/stat-chart-pdfs'))
