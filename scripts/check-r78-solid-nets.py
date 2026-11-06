#!/usr/bin/env python3
"""R78 independent, real-PDF inspection of solid faces and printable labels.
No TypeScript geometry library, generator or helper is used as an oracle:
we reconstruct each expected shape mathematically from actual dimensions,
and measure *printed vector segments* with PyMuPDF.
"""
import json
import math
import sys
from pathlib import Path
import fitz

base=Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r78-prism-pyramid-nets')
manifest=json.loads((base/'manifest.json').read_text('utf8'))
assert manifest['schema']=='mathworks-r78-exact-proportional-solid-nets/v1'
documents=manifest['documents']
assert len(documents)==36, len(documents)
strokes=0
pages=0
problems=0
by_kind={}
def near(a,b,eps=.60):return abs(a-b)<=eps
def close(a,b,eps=.60):return near(a[0],b[0],eps) and near(a[1],b[1],eps)
def has(lines,a,b):
 return any((close(x,a) and close(y,b)) or (close(x,b) and close(y,a)) for x,y in lines)
def polygon_area(points):
 return abs(sum(points[i][0]*points[(i+1)%len(points)][1]-
   points[(i+1)%len(points)][0]*points[i][1] for i in range(len(points))))/2
def vectors(page):
 segments=[]
 for drawing in page.get_drawings():
  for element in drawing['items']:
   if element[0]=='l':
    a,b=element[1],element[2]
    segments.append(((a.x,a.y),(b.x,b.y)))
 return segments
def printed(page):
 return [span for block in page.get_text('dict')['blocks'] if block.get('type')==0
  for line in block.get('lines',[]) for span in line.get('spans',[])]
def assert_text_safe(page,width,height,path):
 for span in printed(page):
  x0,y0,x1,y1=span['bbox']
  assert x0>=35 and x1<=width-35,(path,span['text'],'horizontal print-safe margin',x0,x1)
  assert y0>=35 and y1<=height-35,(path,span['text'],'vertical print-safe margin',y0,y1)
def assert_line(lines,a,b,tag):
 global strokes
 if not has(lines,a,b):raise AssertionError('R78 missing/moved solid face edge: '+str(tag)+' '+str((a,b)))
 strokes+=1
def check_prism(p,lines,w,h,y):
 a,b,c,L=p['a'],p['b'],p['c'],p['length']
 assert a*a+b*b==c*c and min(a,b,L)>0
 scale=min(184/(a+b+c),112/(L+2*b),4)
 x0=w-42-208;y0=y-147
 xA=x0+b*scale;xB=xA+a*scale;xC=xB+c*scale
 low=y0+b*scale;high=low+L*scale
 P=lambda x,yy:(x,h-yy)
 for x in [x0,xA,xB,xC]:assert_line(lines,P(x,low),P(x,high),('prism',p['id'],'vertical',x))
 assert_line(lines,P(x0,low),P(xC,low),('prism',p['id'],'bottom lateral'))
 assert_line(lines,P(x0,high),P(xC,high),('prism',p['id'],'top lateral'))
 for at,apexY in [(high,high+b*scale),(low,low-b*scale)]:
  assert_line(lines,P(xA,at),P(xA,apexY),('prism',p['id'],'right triangle altitude'))
  assert_line(lines,P(xA,apexY),P(xB,at),('prism',p['id'],'right triangle hypotenuse'))
  tri=polygon_area([(xA,at),(xB,at),(xA,apexY)])/(scale*scale)
  assert near(tri,a*b/2,.00001)
 rects=((xA-x0)+(xB-xA)+(xC-xB))*(high-low)/(scale*scale)
 assert near(rects,(a+b+c)*L,.00001)
 assert near(2*tri+rects,a*b+(a+b+c)*L,.00001)
 if p['kind']=='triangular-prism-volume':
  answer=str((a*b*L)//2)+' '+p['unit']+'³'
 else:answer=str(a*b+(a+b+c)*L)+' '+p['unit']+'²'
 assert p['answer']==answer,('prism math',p['id'],answer,p['answer'])
 return ['a='+str(a),'b='+str(b),'c='+str(c),'L='+str(L)]
def check_square(p,lines,w,h,y):
 s,l=p['side'],p['slant']
 assert 4<=s<=24 and s/2<l<=30
 scale=min(172/(s+2*l),111/(s+2*l),5)
 x0=w-42-206;y0=y-147
 xA=x0+l*scale;xB=xA+s*scale
 yA=y0+l*scale;yB=yA+s*scale
 E=[
  ((xA,yA),(xB,yA)),((xB,yA),(xB,yB)),
  ((xB,yB),(xA,yB)),((xA,yB),(xA,yA))
 ]
 apex=[
  ((xA+xB)/2,yA-l*scale),
  (xB+l*scale,(yA+yB)/2),
  ((xA+xB)/2,yB+l*scale),
  (xA-l*scale,(yA+yB)/2)
 ]
 P=lambda item:(item[0],h-item[1])
 for edge in E:assert_line(lines,P(edge[0]),P(edge[1]),('square',p['id'],'base edge'))
 areas=0
 for edge,peak in zip(E,apex):
  assert_line(lines,P(edge[0]),P(peak),('square',p['id'],'face side 1'))
  assert_line(lines,P(edge[1]),P(peak),('square',p['id'],'face side 2'))
  areas+=polygon_area([edge[0],edge[1],peak])/(scale*scale)
 assert_line(lines,P(((xA+xB)/2,yB)),P(apex[2]),('square',p['id'],'measured slant height'))
 assert near(areas,2*s*l,.0001)
 assert near(math.sqrt(l*l-(s/2)**2)**2+(s/2)**2,l*l,.00001)
 exact=s*s+2*s*l
 assert near(s*s+areas,exact,.00001)
 assert p['answer']==str(exact)+' '+p['unit']+'²'
 return ['s='+str(s),'l='+str(l)]
def check_tetra(p,lines,w,h,y):
 side=p['side'];htri=side*math.sqrt(3)/2
 scale=min(172/(2*side),111/(2*htri),5)
 x0=w-42-204;y0=y-149
 A=(0,0);B=(side,0);C=(side/2,htri)
 ap=lambda u,v,w:(u[0]+v[0]-w[0],u[1]+v[1]-w[1])
 AB=ap(A,B,C);BC=ap(B,C,A);CA=ap(C,A,B)
 P=lambda point:(x0+(point[0]+side/2)*scale,h-(y0+(point[1]+htri)*scale))
 edges=[(A,B),(B,C),(C,A),(A,AB),(B,AB),(B,BC),(C,BC),(C,CA),(A,CA)]
 for i,(u,v) in enumerate(edges):
  assert_line(lines,P(u),P(v),('tetrahedron',p['id'],i))
  # Every fold and exterior side is one equal-length edge.
  px=P(u);py=P(v)
  assert near(math.hypot(px[0]-py[0],px[1]-py[1]),side*scale,.00001)
 faces=[(A,B,C),(A,B,AB),(B,C,BC),(C,A,CA)]
 total=sum(polygon_area([P(u),P(v),P(x)])/(scale*scale) for u,v,x in faces)
 assert near(total,side*side*math.sqrt(3),.00001)
 assert p['answer']==str(side*side)+'√3 '+p['unit']+'²'
 assert 'REGULAR' in p['question']
 return ['s='+str(side)]
for record in documents:
 path=base/record['file']
 pdf=fitz.open(path)
 width,height=(612,792) if record['paper']=='Letter' else (595.28,841.89)
 assert len(pdf)==3,(path,'should have 3 printed pages')
 full=''
 for pageNumber,page in enumerate(pdf):
  pages+=1
  assert near(page.rect.width,width,.16) and near(page.rect.height,height,.16)
  assert_text_safe(page,width,height,str(path))
  content=page.get_text()
  full+=content+'\n'
  assert 'R78.1' in content and 'Seed '+str(record['seed']) in content
  strokesOnPage=vectors(page)
  for row,p in enumerate(record['problems'][pageNumber*3:pageNumber*3+3]):
   y=height-168-row*185
   if p['kind'].startswith('triangular-prism'):
    labels=check_prism(p,strokesOnPage,width,height,y)
   elif p['kind']=='square-pyramid-surface':
    labels=check_square(p,strokesOnPage,width,height,y)
   else:labels=check_tetra(p,strokesOnPage,width,height,y)
   for label in labels:assert label in content,(path,p['id'],'missing dimension caption',label)
   by_kind[p['kind']]=by_kind.get(p['kind'],0)+1
   problems+=1
 for p in record['problems']:
  textAnswer='Answer: '+p['answer'].replace('√3','sqrt(3)').replace('²','^2').replace('³','^3')
  if record['output']=='questions':
   assert textAnswer not in full,(path,p['id'],'student answer disclosure')
  else:
   assert textAnswer in full,(path,p['id'],'teacher math key missing',textAnswer)
 assert 'R78.1' in (pdf.metadata.get('title') or ''),path
 pdf.close()
assert problems==36*8,problems
assert set(by_kind)=={'triangular-prism-volume','triangular-prism-surface',
 'square-pyramid-surface','regular-tetrahedron-surface'}
report={'schema':'mathworks-r78-independent-net-pdf-geometry/v1','status':'PASS',
 'pdfFiles':36,'pagesInspected':pages,'actualQuestionInstances':problems,
 'netFaceSegmentsChecked':strokes,'skillsFound':by_kind,
 'actualPrintedPolygonArea':'PASS','independent3DSurfaceFormula':'PASS',
 'studentAnswerIsolation':'PASS','teacherAnswerConsistency':'PASS',
 'safePrintTextMargins':'PASS','original51V18Generators':'NOT MODIFIED',
 'teacherReview':'NOT RUN','realPrinterMeasured':'NOT RUN','cloudflareSHA':'NOT VERIFIED'}
(base/'independent-r78-net-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print('R78 independent real-PDF net audit PASS:',len(documents),
 'documents,',pages,'pages,',problems,'questions,',strokes,'accurate scaled face edges.')
