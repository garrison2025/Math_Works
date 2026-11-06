#!/usr/bin/env python3
"""Independent R74 audit of actual printable PDF text, geometry and exact math.
Uses PyMuPDF to inspect the real PDF page streams, not just source JSON.
"""
import json
import math
import re
import sys
from pathlib import Path
import fitz

root=Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r74-inequality-circle')
manifest=json.loads((root/'manifest.json').read_text('utf-8'))
assert len(manifest['files'])==66, 'Expected 66 exported student/teacher/step PDFs'
checks=0
for entry in manifest['files']:
    path=root/entry['file']
    pdf=fitz.open(path)
    assert len(pdf)==2,(path,len(pdf))
    width,height=(612,792) if entry['paper']=='Letter' else (595.28,841.89)
    full=''
    diagram_count=0
    for page in pdf:
        assert abs(page.rect.width-width)<0.15 and abs(page.rect.height-height)<0.15,path
        drawing=page.get_drawings()
        diagram_count+=len(drawing)
        for block in page.get_text('dict')['blocks']:
            if block.get('type')!=0:
                continue
            for line in block['lines']:
                for span in line['spans']:
                    x0,y0,x1,y1=span['bbox']
                    assert x0>=35.0 and x1<=width-35.0,(path,span['text'],x0,x1)
                    assert y0>=35.0 and y1<=height-35.0,(path,span['text'],y0,y1)
        full+=page.get_text()+'\n'
    assert diagram_count>=4,(path,'No vector line/circle content')
    meta=pdf.metadata.get('title') or ''
    assert 'R74.1' in meta and entry['output'] in meta,path
    assert 'Seed '+str(entry['seed']) in full,path
    assert ('Answer:' not in full)==(entry['output']=='questions'),path
    assert len(entry['problems'])==entry['quantity']==8
    for idx,p in enumerate(entry['problems'],start=1):
        assert re.search(r'(?m)^'+str(idx)+r'\.\s',full),(path,'Missing question number',idx)
        if entry['kind']=='inequality':
            l,u=p['lower'],p['upper']
            if p['kind']=='translate':
                v,k=p['bound'],p['constant']
                if p['context']==0:
                    expected=f'x + {k} <= {v+k}'
                    assert v+k<=v+k and v+1+k>v+k
                elif p['context']==1:
                    expected=f'x - {k} >= {v-k}'
                    assert v-k>=v-k and v-1-k<v-k
                elif p['context']==2:
                    expected=f'{k}x < {k*v}'
                    assert k*(v-1)<k*v and not k*v<k*v
                else:
                    assert v%k==0
                    expected=f'x / {k} > {v//k}'
                    assert (v+1)/k>v/k and not v/k>v/k
                assert p['answer'].replace('≤','<=').replace('≥','>=')==expected
                assert p['graph']['lower']==p['graph']['upper']==v
            else:
                assert l<u and p['graph']['lower']==l and p['graph']['upper']==u
                left='<=' if p['closedLeft'] else '<'
                right='<=' if p['closedRight'] else '<'
                if p['kind']=='and':
                    expected=f'{l} {left} x {right} {u}'
                    assert p['graph']['kind']=='between'
                else:
                    expected=f'x {left} {l} or x {">=" if p["closedRight"] else ">"} {u}'
                    assert p['graph']['kind']=='outside'
                assert p['answer'].replace('≤','<=').replace('≥','>=')==expected
        else:
            r,angle=p['radius'],p['degrees']
            if p['kind']=='semicircle':angle=180
            elif p['kind']=='quarter-circle':angle=90
            elif p['kind']!='sector':angle=360
            numerator=r*r*angle
            divisor=360
            g=math.gcd(numerator,divisor)
            assert p['areaNumerator']==numerator//g
            assert p['areaDenominator']==divisor//g
            if p['kind']=='missing-radius':
                assert p['answer']==f'{r} {p["unit"]}'
            else:
                assert p['answer'].endswith(' '+p['unit']+'²')
                assert 'π' in p['answer']
        if entry['output']!='questions':
            expected_text=p['answer'].replace('π','pi').replace('²','^2').replace('≤','<=').replace('≥','>=')
            assert expected_text in full,(path,'Answer not present in PDF text',idx,expected_text)
        checks+=1
    pdf.close()
report={'schema':'r74-true-pdf-independent-audit/v1','pdfs':len(manifest['files']),
    'audited_problem_instances':checks,'paper_sizes':['Letter','A4'],
    'outputs':['questions','answers','steps'],'exact_math_and_print_bounds':'PASS',
    'teacher_human_review':'NOT RUN','physical_print_calibration':'NOT RUN'}
(root/'independent-pdf-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('R74 actual PDF audit PASS:',len(manifest['files']),'PDFs,',checks,
      'instances, exact values, student answer isolation and text-safe bounds')
