#!/usr/bin/env python3
"""R75 independent audit of real PDF strokes, math and student answer isolation.
Reconstructs each expected outline from source values and checks *drawn vectors*
in PyMuPDF. Distinguishes impossible-triangle rods from actual triangles.
"""
import json
import math
import sys
from pathlib import Path
import fitz

root=Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r75-triangle-composite')
files=json.loads((root/'manifest.json').read_text('utf-8'))['evidence']
assert len(files)==42,('PDF fixture count',len(files))
strokes=0
questions=0

def close(a,b,eps=.65):
    return abs(a[0]-b[0])<eps and abs(a[1]-b[1])<eps
def has_segment(lines,pa,pb):
    return any((close(a,pa) and close(b,pb)) or (close(a,pb) and close(b,pa))
               for a,b in lines)

for item in files:
    pdf=fitz.open(root/item['file'])
    paper=item['paper']
    width,height=(612,792) if paper=='Letter' else (595.28,841.89)
    assert len(pdf)==3,(item['file'],'expected 3 actual pages')
    full=''
    for page_number,page in enumerate(pdf):
        assert abs(page.rect.width-width)<.15 and abs(page.rect.height-height)<.15,item['file']
        text=page.get_text()
        full+=text+'\n'
        assert 'R75.1' in text and 'Seed '+str(item['seed']) in text,item['file']
        assert 'Name:' in text if item['output']=='questions' else 'Name:' not in text
        lines=[]
        for drawing in page.get_drawings():
            for stroke in drawing['items']:
                if stroke[0]!='l':continue
                pa,pb=stroke[1],stroke[2]
                lines.append(((pa.x,pa.y),(pb.x,pb.y)))
        assert len(lines)>=8,(item['file'],'no real vector diagrams')
        for block in page.get_text('dict')['blocks']:
            if block.get('type')!=0:continue
            for line in block.get('lines',[]):
                for span in line.get('spans',[]):
                    x0,y0,x1,y1=span['bbox']
                    assert x0>=35 and x1<=width-35,(item['file'],'text exceeds x print margin',span['text'],x0,x1)
                    assert y0>=35 and y1<=height-35,(item['file'],'text exceeds y print margin',span['text'],y0,y1)
        for row,p in enumerate(item['problems'][page_number*3:(page_number+1)*3]):
            y=height-162-184*row
            # PyMuPDF's page coordinates point downward; pdf-lib's point upward.
            def pt(x,ypdf):return (x,height-ypdf)
            right=width-42
            if item['topic']=='triangle':
                a,b,c=p['a'],p['b'],p['c']
                values=[a,b]+([c] if p['kind']=='possible' else [])
                x0=right-181
                scale=108/max(a,b,c)
                for i,side in enumerate(values):
                    yy=y-61-28*i
                    assert has_segment(lines,pt(x0,yy),pt(x0+scale*side,yy)),(
                        item['file'],p['id'],'missing/scaled triangle side',i,side)
                    strokes+=1
                s=sorted(values)
                if p['kind']=='possible':
                    assert p['valid']==(s[0]+s[1]>s[2]),(item['file'],p['id'],'invalid triangle theorem')
                else:
                    lo,hi=abs(a-b),a+b
                    assert p['lower']==lo and p['upper']==hi
                    assert p['c']==0
                    if p['kind']=='integer-count':
                        assert p['answer']==str(hi-lo-1)+' possible integer lengths'
            else:
                W,H,w,h=p['outerWidth'],p['outerHeight'],p['cutWidth'],p['cutHeight']
                scale=min(127/W,75/H)
                x0=right-169;y0=y-131
                def position(x,yy):return pt(x0+scale*x,y0+scale*yy)
                poly=[(0,0),(W,0),(W,H-h),(W-w,H-h),(W-w,H),(0,H),(0,0)]
                for j in range(6):
                    assert has_segment(lines,position(*poly[j]),position(*poly[j+1])),(
                        item['file'],p['id'],'polygon stroke mismatch',poly[j],poly[j+1])
                    strokes+=1
                assert has_segment(lines,position(W,H-h),position(W,H))
                assert has_segment(lines,position(W-w,H),position(W,H))
                if p['kind']=='split':
                    assert has_segment(lines,position(W-w,0),position(W-w,H-h)),(
                        item['file'],p['id'],'missing internal decomposition')
                shoelace=abs(sum(poly[j][0]*poly[j+1][1]-poly[j+1][0]*poly[j][1]
                    for j in range(6)))/2
                assert p['area']==W*H-w*h==(W-w)*H+w*(H-h)==shoelace
                for label in ['W='+str(W),'H='+str(H),'w='+str(w),'h='+str(h)]:
                    assert label in text,(item['file'],p['id'],'dimension label missing',label)
            questions+=1
    for p in item['problems']:
        expected=p['answer'].replace('²','^2')
        if item['output']=='questions':
            assert expected not in full,(item['file'],p['id'],'student key leaked')
        else:
            assert expected in full,(item['file'],p['id'],'teacher answer not printed',expected)
    assert 'R75.1' in (pdf.metadata.get('title') or '')
    pdf.close()

summary={'schema':'r75-real-vector-pdf-audit/v1','files':len(files),
    'printed_problem_instances':questions,'verified_geometry_strokes':strokes,
    'student_answer_isolation':'PASS','independent_triangle_constraints':'PASS',
    'independent_polygon_shoelace_and_decomposition':'PASS',
    'print_safe_text_boundaries':'PASS',
    'teacher_manual_review':'NOT RUN','physical_printing':'NOT RUN'}
(root/'independent-vector-audit.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
print('R75 actual PDF vector audit PASS:',len(files),'documents,',questions,
      'printed question instances,',strokes,'independently checked drawn segments.')
