#!/usr/bin/env python3
"""R80 independent actual-PDF geometry audit. Rebuilds expected full-size
net coordinates and mathematically recomputes exposed areas without using
any JS renderer or formula helper. Reads printed lines, curves and captions.
"""
import json,math,sys
from pathlib import Path
import fitz
folder=Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r80-true-net-composite-area')
manifest=json.loads((folder/'manifest.json').read_text('utf8'))
docs=manifest['documents']
assert manifest['schema']=='mathworks-r80-true-nets-composite/v1' and len(docs)==54
net_edges=disks=questions=0
kinds={k:0 for k in ['rectangular-prism','triangular-prism','cylinder',
 'square-pyramid','regular-tetrahedron','joined-L-prisms']}
def near(a,b,t=.60):return abs(a-b)<=t
def near_pt(a,b,t=.60):return near(a[0],b[0],t) and near(a[1],b[1],t)
def shoelace(points):
 return abs(sum(points[i][0]*points[(i+1)%len(points)][1]-
  points[(i+1)%len(points)][0]*points[i][1] for i in range(len(points))))/2
def segments(page):
 lines=[];ellipses=[]
 for path in page.get_drawings():
  for item in path['items']:
   if item[0]=='l':
    a,b=item[1],item[2];lines.append(((a.x,a.y),(b.x,b.y)))
  if any(item[0]=='c' for item in path['items']):
   box=fitz.Rect(path['rect'])
   ellipses.append((box.x0,box.y0,box.x1,box.y1))
 return lines,ellipses
def required(lines,a,b,tag):
 global net_edges
 if not any((near_pt(x,a) and near_pt(y,b)) or
            (near_pt(x,b) and near_pt(y,a)) for x,y in lines):
  raise AssertionError(('R80 wrong actual printed net edge',tag,a,b))
 net_edges+=1
def labels(page):
 return [span for block in page.get_text('dict')['blocks'] if block.get('type')==0
  for line in block.get('lines',[]) for span in line.get('spans',[])]
def check_rect(q,lines,w,h,row):
 l,b,z=q['l'],q['w'],q['h']
 s=min(184/(2*l+2*b),112/(z+2*b),4.2)
 x0=w-42-208;y0=row-147
 xx=[x0,x0+b*s,x0+(b+l)*s,x0+(2*b+l)*s,x0+(2*b+2*l)*s]
 low=y0+b*s;high=low+z*s;P=lambda x,y:(x,h-y)
 for x in xx:required(lines,P(x,low),P(x,high),('rect',q['id']))
 for y in [low,high]:required(lines,P(xx[0],y),P(xx[4],y),('rect',q['id']))
 for a,c in [(low-b*s,low),(high,high+b*s)]:
  for x in [xx[1],xx[2]]:required(lines,P(x,a),P(x,c),('rect end',q['id']))
  outside=a if a==low-b*s else c
  required(lines,P(xx[1],outside),P(xx[2],outside),('rect end',q['id']))
 assert near((xx[4]-xx[0])*(high-low)/s**2,2*(l+b)*z,.00001)
 return 2*(l*b+l*z+b*z),['l='+str(l),'w='+str(b),'h='+str(z)]
def check_tri(q,lines,w,h,row):
 a,b,c,L=q['a'],q['b'],q['c'],q['length']
 assert a*a+b*b==c*c
 s=min(184/(a+b+c),112/(L+2*b),4)
 x0=w-42-208;y0=row-147;xa=x0+b*s;xb=xa+a*s;xc=xb+c*s
 low=y0+b*s;high=low+L*s;P=lambda x,y:(x,h-y)
 for x in [x0,xa,xb,xc]:required(lines,P(x,low),P(x,high),('tri',q['id']))
 for y in [low,high]:required(lines,P(x0,y),P(xc,y),('tri',q['id']))
 for at,top in [(low,low-b*s),(high,high+b*s)]:
  required(lines,P(xa,at),P(xa,top),('triangle leg',q['id']))
  required(lines,P(xa,top),P(xb,at),('hypotenuse',q['id']))
  assert near(abs((xb-xa)*(top-at))/(2*s*s),a*b/2,.00001)
 assert near((xc-x0)*(high-low)/s**2,(a+b+c)*L,.00001)
 return a*b+(a+b+c)*L,['a='+str(a),'b='+str(b),'c='+str(c),'L='+str(L)]
def check_cylinder(q,lines,ellipses,w,h,row):
 global disks
 r,H=q['radius'],q['height'];s=min(129/(2*math.pi*r),95/(H+4*r),3)
 x0=w-42-176;y0=row-145
 length=2*math.pi*r*s
 base=y0+2*r*s;roof=base+H*s
 x1=x0+length;cx=x0+length/2;P=lambda x,y:(x,h-y)
 for a,b in [((x0,base),(x1,base)),((x1,base),(x1,roof)),
  ((x1,roof),(x0,roof)),((x0,roof),(x0,base))]:
  required(lines,P(*a),P(*b),('cylinder',q['id']))
 for cy in [y0+r*s,roof+r*s]:
  rad=r*s
  expected=(cx-rad,h-(cy+rad),cx+rad,h-(cy-rad))
  assert any(all(near(rect[i],expected[i],.46) for i in range(4)) for rect in ellipses),(
   'R80 circle radius/center misprinted',q['id'],expected)
  disks+=1
 assert near((x1-x0)*(roof-base)/(s*s),2*math.pi*r*H,.00001)
 return 2*r*r+2*r*H,['r='+str(r)+' '+q['unit'],'h='+str(H)+' '+q['unit'],'C=2pi*r']
def check_square(q,lines,w,h,row):
 side,slant=q['side'],q['slant']
 assert slant>side/2
 s=min(172/(side+2*slant),111/(side+2*slant),5)
 x0=w-42-206;y0=row-147
 xa=x0+slant*s;xb=xa+side*s;ya=y0+slant*s;yb=ya+side*s
 edges=[((xa,ya),(xb,ya)),((xb,ya),(xb,yb)),
        ((xb,yb),(xa,yb)),((xa,yb),(xa,ya))]
 peaks=[((xa+xb)/2,ya-slant*s),(xb+slant*s,(ya+yb)/2),
       ((xa+xb)/2,yb+slant*s),(xa-slant*s,(ya+yb)/2)]
 P=lambda x:(x[0],h-x[1])
 for a,b in edges:required(lines,P(a),P(b),('square',q['id']))
 face_area=0
 for (a,b),peak in zip(edges,peaks):
  required(lines,P(a),P(peak),('sq face',q['id']))
  required(lines,P(b),P(peak),('sq face',q['id']))
  face_area+=shoelace([a,b,peak])/s**2
 required(lines,P(((xa+xb)/2,yb)),P(peaks[2]),('face SLANT',q['id']))
 assert near(face_area,2*side*slant,.00001)
 return side*side+2*side*slant,['s='+str(side),'l='+str(slant)]
def check_tetra(q,lines,w,h,row):
 side=q['side'];height=side*math.sqrt(3)/2
 scale=min(172/(2*side),111/(2*height),5)
 x0=w-42-204;y0=row-149
 A=(0,0);B=(side,0);C=(side/2,height)
 plus=lambda u,v,x:(u[0]+v[0]-x[0],u[1]+v[1]-x[1])
 AB=plus(A,B,C);BC=plus(B,C,A);CA=plus(C,A,B)
 P=lambda x:(x0+(x[0]+side/2)*scale,h-(y0+(x[1]+height)*scale))
 edges=[(A,B),(B,C),(C,A),(A,AB),(B,AB),(B,BC),(C,BC),(C,CA),(A,CA)]
 for a,b in edges:
  required(lines,P(a),P(b),('tetrahedron',q['id']))
  assert near(math.dist(P(a),P(b)),side*scale,.00001)
 polygons=[(A,B,C),(A,B,AB),(B,C,BC),(C,A,CA)]
 area=sum(shoelace([P(x) for x in poly])/(scale*scale) for poly in polygons)
 assert near(area,side*side*math.sqrt(3),.00001)
 return side*side,['s='+str(side)]
def check_composite(q,lines,w,h,row):
 L,T,D,H,J=q['baseLength'],q['stepLength'],q['depth'],q['lowHeight'],q['upperHeight']
 assert L>T>=2 and D>=2 and H>=2 and J>=2
 if q['orientation']=='left':
  poly=[(0,0),(L,0),(L,H),(T,H),(T,H+J),(0,H+J)]
 else:
  assert q['orientation']=='right'
  poly=[(0,0),(L,0),(L,H+J),(L-T,H+J),(L-T,H),(0,H)]
 assert near(shoelace(poly),L*H+T*J,.00001)
 widths=[math.dist(poly[i],poly[(i+1)%6]) for i in range(6)]
 P=sum(widths)
 assert near(P,2*(L+H+J),.00001)
 s=min(180/P,108/(D+2*(H+J)),4.1)
 x0=w-42-208;y0=row-148
 low=y0+(H+J)*s;high=low+D*s
 xx=[x0]
 for a in widths:xx.append(xx[-1]+a*s)
 conv=lambda x,y:(x,h-y)
 for x in xx:required(lines,conv(x,low),conv(x,high),('composite strip',q['id']))
 for y in [low,high]:
  required(lines,conv(xx[0],y),conv(xx[6],y),('composite strip',q['id']))
 for anchor,sign in [(high,1),(low,-1)]:
  for i in range(1,6):
   a,b=poly[i],poly[(i+1)%6]
   required(lines,conv(x0+a[0]*s,anchor+sign*a[1]*s),
    conv(x0+b[0]*s,anchor+sign*b[1]*s),('composite L-face',q['id']))
 rectarea=P*D;ends=2*shoelace(poly);total=rectarea+ends
 a1=2*(L*D+L*H+D*H);a2=2*(T*D+T*J+D*J)
 assert near(total,a1+a2-2*T*D,.00001),('exposed area mismatch',q['id'])
 return int(total+1e-8),['B='+str(L),'T='+str(T),'D='+str(D),
  'H1='+str(H),'H2='+str(J)]
for rec in docs:
 with fitz.open(folder/rec['file']) as pdf:
  w,h=(612,792) if rec['paper']=='Letter' else (595.28,841.89)
  assert len(pdf)==4,(rec['file'],'R80 two problems per page; expected 4 pages')
  found_text=''
  for pi,page in enumerate(pdf):
   assert near(page.rect.width,w,.16) and near(page.rect.height,h,.16)
   text=page.get_text()
   found_text+=text+'\n'
   spans=labels(page)
   for span in spans:
    x0,y0,x1,y1=span['bbox']
    assert 35<=x0 and x1<=w-35,(rec['file'],'text x margin',span['text'],x0,x1)
    assert 35<=y0 and y1<=h-35,(rec['file'],'text y margin',span['text'],y0,y1)
    # The row divider is an actual stroke at y=421 PDF top coordinates.\n    # Check bounding-box INTERSECTION, not a wide band that includes\n    # correctly positioned second-row text starting about y=425.
    assert not (y0<=421.18 and y1>=420.82 and x0<w-35),(rec['file'],'text intersects actual row divider',span['text'],y0,y1)
   lines,ellipses=segments(page)
   for i,q in enumerate(rec['problems'][pi*2:pi*2+2]):
    row=h-174-i*260
    kind=q['kind'];kinds[kind]+=1;questions+=1
    if kind=='rectangular-prism':answer,caps=check_rect(q,lines,w,h,row)
    elif kind=='triangular-prism':answer,caps=check_tri(q,lines,w,h,row)
    elif kind=='cylinder':answer,caps=check_cylinder(q,lines,ellipses,w,h,row)
    elif kind=='square-pyramid':answer,caps=check_square(q,lines,w,h,row)
    elif kind=='regular-tetrahedron':answer,caps=check_tetra(q,lines,w,h,row)
    else:answer,caps=check_composite(q,lines,w,h,row)
    expected=str(answer)+('π ' if kind=='cylinder' else '√3 ' if kind=='regular-tetrahedron' else ' ')+q['unit']+'²'
    assert q['answer']==expected,(rec['file'],q['id'],'source answer',q['answer'],expected)
    for cap in caps:assert cap in text,(rec['file'],q['id'],'missing dimension label',cap)
  for q in rec['problems']:
   answer='Answer: '+q['answer'].replace('π','pi').replace('√3','sqrt(3)').replace('²','^2')
   if rec['output']=='questions':
    assert answer not in found_text,(rec['file'],q['id'],'student key leaked')
   else:assert answer in found_text,(rec['file'],q['id'],'teacher answer missing')
  assert 'R80' in (pdf.metadata.get('title') or ''),rec['file']
assert questions==54*8,questions
assert all(kinds.values()),kinds
assert disks>0 and net_edges>2000,(disks,net_edges)
report={'schema':'mathworks-r80-independent-print-vector-audit/v1','status':'PASS',
 'realPdfFiles':len(docs),'pages':len(docs)*4,'actualProblemInstances':questions,
 'checkedTrueNetEdges':net_edges,'checkedCylinderDisks':disks,'shapeCounts':kinds,
 'netFaceAreaIndependent':'PASS','LPrismPerimeterAnd2HiddenJoints':'PASS',
 'matchingTeacherKey':'PASS','studentAnswerIsolation':'PASS',
 'printableTextMargins':'PASS','twoProblemsPerPageNoRowOverlap':'PASS',
 'teacherReviewed':'NOT RUN','physicalPrinterMeasured':'NOT RUN','cloudflareSHA':'NOT VERIFIED'}
(folder/'independent-r80-net-geometry.json').write_text(json.dumps(report,indent=2)+'\n')
print('R80 printed net audit PASS',len(docs),'PDFs',questions,'problems',
 net_edges,'real face strokes',disks,'circular bases')
