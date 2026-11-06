#!/usr/bin/env python3
"""R57 independent PDF-vector audit for zero-aligned Cartesian axes.

Source-level ticks are NOT used as the oracle. Each exported PDF page is
opened with PyMuPDF: locate the actual horizontal/vertical axis strokes,
the much shorter mathematical tick strokes, and the single printed origin
'0'. Confirm that both tick arrays are symmetric arithmetic progressions
anchored at the true crossing of the axes.

This audits PDF coordinates only. No student handwriting or real printer
output is available to automated CI.
"""
from pathlib import Path
import json
import sys
import fitz

MAIN=(.105,.39,.65)
EPS=.30
X_AXIS_LENGTH=235*.88
Y_AXIS_LENGTH=128*.86
X_TICK_LENGTH=128*.04
Y_TICK_LENGTH=235*.04

def near(a,b,tol=EPS):
    return abs(a-b)<=tol

def plot_segments(page):
    rows=[]
    for drawing in page.get_drawings():
        color=drawing.get('color')
        if not color or len(color)!=3:
            continue
        if any(abs(color[i]-MAIN[i])>.025 for i in range(3)):
            continue
        if not near(drawing.get('width',0),1.1,.035):
            continue
        for item in drawing['items']:
            if item[0]=='l':
                rows.append((item[1],item[2]))
    return rows

def get_axes(page):
    strokes=plot_segments(page)
    horizontal=[
      (a,b) for a,b in strokes
      if near(a.y,b.y) and near(abs(a.x-b.x),X_AXIS_LENGTH)
    ]
    vertical=[
      (a,b) for a,b in strokes
      if near(a.x,b.x) and near(abs(a.y-b.y),Y_AXIS_LENGTH)
    ]
    matches=[]
    for a,b in horizontal:
        cx=(a.x+b.x)/2;cy=a.y
        aligned=[(c,d) for c,d in vertical
                 if near(c.x,cx) and near((c.y+d.y)/2,cy)]
        if len(aligned)!=1:
            raise AssertionError('Horizontal printed axis has no unique perpendicular axis')
        matches.append((cx,cy))
    if len(matches)!=len(vertical):
        raise AssertionError('Orphan or duplicated vertical printed axis')
    return strokes,matches

def verify_marks(positions,origin,description):
    delta=sorted(p-origin for p in positions)
    if len(delta)<5 or len(delta)%2!=1:
        raise AssertionError(f'{description}: expected at least 5 symmetrical ticks, got {len(delta)}')
    mid=len(delta)//2
    if not near(delta[mid],0):
        raise AssertionError(f'{description}: zero is NOT a real centered tick')
    for i in range(mid):
        if not near(delta[i],-delta[-1-i]):
            raise AssertionError(f'{description}: asymmetric intervals around zero')
    step=delta[mid+1]-delta[mid]
    if step<=3:
        raise AssertionError(f'{description}: implausibly small printed tick spacing')
    for a,b in zip(delta,delta[1:]):
        if not near(b-a,step):
            raise AssertionError(f'{description}: mathematically unequal interval spacing')
    return len(delta)

def origins(page):
    found=[]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line.get('spans',[]):
                if span['text'].strip()=='0' and near(span['size'],6,.12):
                    found.append(fitz.Rect(span['bbox']))
    return found

def verify_page(page,label):
    strokes,axes=get_axes(page)
    if not axes:
        raise AssertionError(label+': no printable Cartesian axes found')
    zeroLabels=origins(page)
    if len(zeroLabels)!=len(axes):
        raise AssertionError(f'{label}: expected {len(axes)} printed origin 0 labels, found {len(zeroLabels)}')
    used=set()
    for index,(cx,cy) in enumerate(axes):
        xTicks=[
          (a.x+b.x)/2 for a,b in strokes
          if near(a.x,b.x) and near(abs(a.y-b.y),X_TICK_LENGTH)
          and near((a.y+b.y)/2,cy) and abs(a.x-cx)<=X_AXIS_LENGTH/2+.2
        ]
        yTicks=[
          (a.y+b.y)/2 for a,b in strokes
          if near(a.y,b.y) and near(abs(a.x-b.x),Y_TICK_LENGTH)
          and near((a.x+b.x)/2,cx) and abs(a.y-cy)<=Y_AXIS_LENGTH/2+.2
        ]
        verify_marks(xTicks,cx,label+f':chart{index+1}:x')
        verify_marks(yTicks,cy,label+f':chart{index+1}:y')
        labelMatches=[
          k for k,rect in enumerate(zeroLabels)
          if k not in used and 3<=rect.x0-cx<=12
          and 0<=rect.y0-cy<=20
        ]
        if len(labelMatches)!=1:
            raise AssertionError(f'{label}:chart{index+1}: origin label is missing/misplaced')
        used.add(labelMatches[0])
    return len(axes)

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    records=manifest['documents']
    if len(records)!=8:
        raise AssertionError('R57 requires eight original PDF geometry fixtures')
    total=0;pages=0
    for entry in records:
        with fitz.open(folder/entry['file']) as pdf:
            paperWidth=595.28 if entry['paper']=='A4' else 612
            if abs(pdf[0].rect.width-paperWidth)>.12:
                raise AssertionError(entry['file']+': wrong page type')
            observed=0
            for i,page in enumerate(pdf):
                observed+=verify_page(page,entry['file']+f':page{i+1}')
                pages+=1
            if observed!=entry['graphs']:
                raise AssertionError(f"{entry['file']}: expected {entry['graphs']} axes, got {observed}")
            total+=observed
    if total!=64:
        raise AssertionError(f'R57 expected 64 true printed charts, got {total}')
    report={'status':'PASS','pdfs':8,'charts':total,'pages':pages,
     'checked':'real PDF axis intersections, symmetric zero-tick spacings and printed origin 0',
     'physicalPrinter':'NOT MEASURED'}
    (folder/'axis-vector-audit.json').write_text(json.dumps(report,indent=2))
    print(f'R57 true-PDF Cartesian origin PASS: 8 PDFs, {total} graphs, {pages} pages; both axes centered and symmetric')
if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/cartesian-ticks'))
