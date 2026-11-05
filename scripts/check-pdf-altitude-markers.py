#!/usr/bin/env python3
"""R55 inspect real PDF vector right-angle cues in three geometry topics.

Do NOT infer success from SVG/source strings. Detect exact post-export 0.82pt
orthogonal joined strokes, matching two segments per student practice figure.
R44 separately verifies trapezoid base order/altitude under its original rule.
"""
import json
import sys
from pathlib import Path
import fitz

KINDS={'area-of-triangles-worksheets','area-of-parallelograms-worksheets',
       'area-of-trapezoids-worksheets'}
TOL=.18
INK=(.105,.39,.65)

def near(a,b,eps=TOL):
    return abs(a-b)<=eps

def marker_segments(page):
    strokes=[]
    for drawing in page.get_drawings():
        color=drawing.get('color')
        if not color or len(color)!=3 or not all(near(color[i],INK[i],.025) for i in range(3)):
            continue
        if not near(drawing.get('width',0),.82,.025):
            continue
        for item in drawing['items']:
            if item[0]=='l':strokes.append((item[1],item[2]))
    return strokes

def validate_pairs(strokes,expected,label):
    if len(strokes)!=expected*2:
        raise AssertionError(f'{label}: expected {expected*2} right-angle strokes, found {len(strokes)}')
    for i in range(0,len(strokes),2):
        (a,b),(c,d)=strokes[i:i+2]
        if not near(a.y,b.y) or not near(c.x,d.x) or not near(b.x,c.x) or not near(b.y,c.y):
            raise AssertionError(f'{label} marker {i//2+1}: missing connected 90-degree corner')
        width=abs(b.x-a.x);height=abs(d.y-c.y)
        if not (7<width<20 and 7<height<20):
            raise AssertionError(f'{label} marker {i//2+1}: invalid square dimensions {width:.2f} × {height:.2f}')
    return expected

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    if manifest['summary']['topics']!=51 or len(manifest['files'])!=468:
        raise AssertionError('R55 requires the complete 51-topic PDF fixture release corpus')
    selected=[r for r in manifest['files'] if r['topic'] in KINDS]
    if len(selected)!=36:
        raise AssertionError(f'Expected 36 topic-PDF documents (3 × 2 difficulties × 2 paper × 3 modes), got {len(selected)}')
    docs=figures=strokes=0
    for record in selected:
        filename=record['name'];mode=record['mode'];quantity=record['quantity']
        expected=quantity if mode=='questions' else 0
        with fitz.open(folder/filename) as pdf:
            all_strokes=[]
            notes=0
            for page in pdf:
                all_strokes.extend(marker_segments(page))
                notes+=page.get_text().count('Schematic - not to scale')
        validate_pairs(all_strokes,expected,filename)
        if mode=='questions' and notes!=quantity:
            raise AssertionError(f'{filename}: expected {quantity} schematic warnings, found {notes}')
        if mode!='questions' and notes:
            raise AssertionError(f'{filename}: schematic diagram leaked into {mode} PDF')
        docs+=1;figures+=expected;strokes+=len(all_strokes)
    evidence={'status':'PASS','documents':docs,'question_diagrams':figures,
        'right_angle_strokes':strokes,'limitations':'Digital printed vectors only; no classroom/printer confirmation'}
    (folder/'r55-perpendicular-height-audit.json').write_text(json.dumps(evidence,indent=2))
    print(f'R55 true-PDF altitude marker PASS: {docs} documents, {figures} diagrams, {strokes} orthogonal strokes, no answer leakage')
if __name__=='__main__':run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/pdf-stress'))
