#!/usr/bin/env python3
"""R44 real-PDF geometry gate: reject SVG/PDF inverted trapezoid bases.
Renders do not establish math correctness; verify post-export vector paths
against exact source problem inputs in the full CI manifest instead.
"""
import json
import math
import re
import sys
from pathlib import Path
import fitz
TOPIC='area-of-trapezoids-worksheets'
BASES=re.compile(r'\bbases (\d+), (\d+) and\b')
INK=(.105,.39,.65)
def near(a,b,tol=.07):return abs(a-b)<=tol

def blue_line_paths(page):
    lines=[]
    for path in page.get_drawings():
        color=path.get('color')
        if not color or len(color)<3 or not all(near(color[i],INK[i]) for i in range(3)):
            continue
        if not near(path.get('width',0),1.1):continue
        for item in path['items']:
            if item[0]=='l':
                lines.append((item[1],item[2]))
    return lines

def check_five_strokes(strokes,bottom_value,top_value):
    if len(strokes)!=5:
        return [f'Expected 5 outline/altitude segments, got {len(strokes)}']
    (bl,br),(rb,rt),(tr,tl),(lt,lb),(at,ab)=strokes
    issues=[]
    def horizontal(a,b):return near(a.y,b.y,.3)
    def vertical(a,b):return near(a.x,b.x,.3)
    if not horizontal(bl,br) or not horizontal(tr,tl):
        return ['First/third trapezoid strokes not horizontal']
    if not vertical(at,ab):issues.append('Height is not perpendicular to horizontal parallel bases')
    # PDF coordinate y increases DOWN. The LOWER base must appear at larger y!
    if not bl.y>tr.y+12:issues.append('Printed lower base rendered ABOVE upper base')
    lower=abs(br.x-bl.x);upper=abs(tr.x-tl.x)
    observed=0 if abs(lower-upper)<.3 else (1 if lower>upper else -1)
    expected=(bottom_value>top_value)-(bottom_value<top_value)
    if observed!=expected:
        issues.append(f'Base length ordering reversed: bottom {bottom_value} ({lower:.1f}pt), top {top_value} ({upper:.1f}pt)')
    if not min(bl.x,br.x)-.5<=at.x<=max(bl.x,br.x)+.5:
        issues.append('Perpendicular height outside lower base')
    if not min(tr.x,tl.x)-.5<=at.x<=max(tr.x,tl.x)+.5:
        issues.append('Perpendicular height outside upper base')
    if not near(at.y,tr.y,.5) or not near(ab.y,bl.y,.5):
        issues.append('Altitude does not reach both parallel bases')
    return issues

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    if manifest['summary']['topics']!=51 or len(manifest['cases'])!=102 or len(manifest['files'])!=500:
        raise AssertionError('R93 full 51-topic, 102-case, 500-PDF release corpus was reduced')
    mode_counts={name:sum(record['mode']==name for record in manifest['files'])
                 for name in ('questions','answers','steps')}
    if mode_counts!={'questions':204,'answers':204,'steps':92}:
        raise AssertionError('R44 requires all 204 practice, 204 teacher keys and 92 reviewed steps: '+str(mode_counts))
    cases={(c['topic'],c['difficulty']):c for c in manifest['cases']}
    relevant=[f for f in manifest['files'] if f['topic']==TOPIC]
    if len(relevant)!=12: # 2 difficulties x 2 papers x questions/answers/verified steps
        raise AssertionError(f'Unexpected trapezoid corpus: {len(relevant)} PDFs')
    errors=[];drawings=0;documents=0
    for record in relevant:
        case=cases[(TOPIC,record['difficulty'])]
        vals=[]
        for question in case['questions']:
            match=BASES.search(question['question'])
            if not match:raise AssertionError(f'Unparseable source trapezoid: {question["question"]}')
            vals.append((int(match[1]),int(match[2])))
        with fitz.open(folder/record['name']) as doc:
            strokes=[s for page in doc for s in blue_line_paths(page)]
            notes=sum(page.get_text().count('Schematic - not to scale') for page in doc)
        expected_strokes=5*len(vals) if record['mode']=='questions' else 0
        if len(strokes)!=expected_strokes:
            errors.append(f'{record["name"]}: {len(strokes)} strokes, expected {expected_strokes}')
        if record['mode']=='questions':
            if notes!=len(vals):errors.append(f'{record["name"]}: {notes} schematic notes, expected {len(vals)}')
            for i,(bottom,top) in enumerate(vals):
                segments=strokes[i*5:i*5+5]
                for error in check_five_strokes(segments,bottom,top):
                    if len(errors)<50:errors.append(f'{record["name"]} Q{i+1}: {error}')
            drawings+=len(vals)
        documents+=1
    report={'status':'FAIL' if errors else 'PASS','topic':TOPIC,
      'documents':documents,'question_diagrams':drawings,
      'checked':'exact base ordering, vertical page direction, altitude and schematic text',
      'errors':errors[:50]}
    (folder/'trapezoid-pdf-geometry-audit.json').write_text(
        json.dumps(report,indent=2),encoding='utf8')
    print('R44 true-PDF trapezoid geometry:',report['status'],documents,
          'PDFs',drawings,'diagrams',len(errors),'errors')
    for error in errors[:10]:print('ERROR:',error,file=sys.stderr)
    return int(bool(errors))

if __name__=='__main__':
    sys.exit(run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/pdf-stress')))
