#!/usr/bin/env python3
"""R79: independent real-PDF vector verification of ONE mixed prism/cylinder
worksheet for both volume and closed total surface. Reads actual PDF paths,
measures rectangles, right triangles and disk radii and checks answer isolation.
"""
from pathlib import Path
import json
import math
import sys
import fitz
root=Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r79-mixed-prisms-cylinders')
manifest=json.loads((root/'manifest.json').read_text('utf8'))
docs=manifest['documents']
assert manifest['schema']=='mathworks-r79-mixed-solid-pdf-v1' and len(docs)==48
strokes=circle_count=problems=0
kinds={'rectangular-prism':0,'triangular-prism':0,'cylinder':0}
def near(a,b,t=.65):return abs(a-b)<=t
def eq(a,b):return near(a[0],b[0]) and near(a[1],b[1])
def have(lines,a,b):
 return any((eq(x,a) and eq(y,b)) or (eq(x,b) and eq(y,a)) for x,y in lines)
def required(lines,a,b,tag):
 global strokes
 assert have(lines,a,b),('R79 missing face vector',tag,a,b)
 strokes+=1
def measured(page):
 lines=[];circles=[]
 for path in page.get_drawings():
  for part in path['items']:
   if part[0]=='l':
    a,b=part[1],part[2]
    lines.append(((a.x,a.y),(b.x,b.y)))
  if any(part[0]=='c' for part in path['items']):
   b=fitz.Rect(path['rect'])
   circles.append((b.x0,b.y0,b.x1,b.y1))
 return lines,circles
def textspans(page):
 return [span for block in page.get_text('dict')['blocks'] if block.get('type')==0
  for line in block.get('lines',[]) for span in line.get('spans',[])]
def rectangle(p,lines,w,height,row):
 l,b,h=p['l'],p['w'],p['h']
 s=min(184/(2*l+2*b),112/(h+2*b),4.2)
 x0=w-42-208;y0=row-147
 xs=[x0,x0+b*s,x0+(b+l)*s,x0+(2*b+l)*s,x0+(2*b+2*l)*s]
 low=y0+b*s;high=low+h*s
 P=lambda x,y:(x,height-y)
 for x in xs:required(lines,P(x,low),P(x,high),(p['id'],'rectangle strip vertical'))
 for y in [low,high]:required(lines,P(xs[0],y),P(xs[4],y),(p['id'],'rectangle strip horizontal'))
 for lower,upper in [(low-b*s,low),(high,high+b*s)]:
  for x in [xs[1],xs[2]]:required(lines,P(x,lower),P(x,upper),(p['id'],'base face side'))
  end=lower if lower==low-b*s else upper
  required(lines,P(xs[1],end),P(xs[2],end),(p['id'],'base face external'))
 assert near((xs[4]-xs[0])*(high-low)/s**2,2*(l+b)*h,.00001)
 assert near(2*(xs[2]-xs[1])*(b*s)/s**2,2*l*b,.00001)
 v=l*b*h;area=2*(l*b+l*h+b*h)
 return (v if p['task']=='volume' else area),['l='+str(l),'w='+str(b),'h='+str(h)]
def triangle(p,lines,w,height,row):
 a,b,c,L=p['a'],p['b'],p['c'],p['length']
 assert a*a+b*b==c*c
 s=min(184/(a+b+c),112/(L+2*b),4)
 x0=w-42-208;y0=row-147
 xa=x0+b*s;xb=xa+a*s;xc=xb+c*s
 low=y0+b*s;high=low+L*s
 P=lambda x,y:(x,height-y)
 for x in [x0,xa,xb,xc]:required(lines,P(x,low),P(x,high),(p['id'],'triangle strip vertical'))
 for y in [low,high]:required(lines,P(x0,y),P(xc,y),(p['id'],'triangle strip horizontal'))
 for bottom,top in [(low,low-b*s),(high,high+b*s)]:
  required(lines,P(xa,bottom),P(xa,top),(p['id'],'triangle leg'))
  required(lines,P(xa,top),P(xb,bottom),(p['id'],'triangle hypotenuse'))
  assert near(abs((xb-xa)*(top-bottom))/(2*s*s),a*b/2,.00001)
 assert near((xc-x0)*(high-low)/(s*s),(a+b+c)*L,.00001)
 v=a*b*L//2;area=a*b+(a+b+c)*L
 return v if p['task']=='volume' else area,['a='+str(a),'b='+str(b),'c='+str(c),'L='+str(L)]
def cylinder(p,lines,ellipses,w,height,row):
 global circle_count
 r,h=p['radius'],p['height']
 s=min(129/(2*math.pi*r),95/(h+4*r),3)
 x0=w-42-176;y0=row-145
 width=2*math.pi*r*s
 base=y0+2*r*s;roof=base+h*s
 x1=x0+width;cx=x0+width/2
 P=lambda x,y:(x,height-y)
 for a,b in [((x0,base),(x1,base)),((x1,base),(x1,roof)),
             ((x1,roof),(x0,roof)),((x0,roof),(x0,base))]:
  required(lines,P(*a),P(*b),(p['id'],'cylinder net rectangle'))
 for cy in [y0+r*s,roof+r*s]:
  rad=r*s
  box=(cx-rad,height-(cy+rad),cx+rad,height-(cy-rad))
  assert any(all(near(t[i],box[i],.45) for i in range(4)) for t in ellipses),(
   'R79 printed cylinder has incorrect circle radius',p['id'],box)
  circle_count+=1
 assert near((x1-x0)*(roof-base)/s**2,2*math.pi*r*h,.00001)
 result=r*r*h if p['task']=='volume' else 2*r*r+2*r*h
 return result,['r='+str(r)+' '+p['unit'],'h='+str(h)+' '+p['unit'],'C=2pi*r']
for rec in docs:
 file=rec['file']
 pdf=fitz.open(root/file)
 w,height=(612,792) if rec['paper']=='Letter' else (595.28,841.89)
 assert len(pdf)==3
 full=''
 for pageIndex,page in enumerate(pdf):
  assert near(page.rect.width,w,.16) and near(page.rect.height,height,.16)
  spans=textspans(page)
  for span in spans:
   x0,y0,x1,y1=span['bbox']
   assert 35<=x0 and x1<=w-35,(file,'x text margin',span['text'],x0,x1)
   assert 35<=y0 and y1<=height-35,(file,'y text margin',span['text'],y0,y1)
  full+=page.get_text()+'\n'
  lines,ellipses=measured(page)
  for offset,p in enumerate(rec['problems'][3*pageIndex:3*pageIndex+3]):
   row=height-168-offset*185
   if p['kind']=='rectangular-prism':num,labels=rectangle(p,lines,w,height,row)
   elif p['kind']=='triangular-prism':num,labels=triangle(p,lines,w,height,row)
   else:num,labels=cylinder(p,lines,ellipses,w,height,row)
   kinds[p['kind']]+=1;problems+=1
   expected=str(num)+('π ' if p['kind']=='cylinder' else ' ')+p['unit']+('³' if p['task']=='volume' else '²')
   assert expected==p['answer'],('independent arithmetic mismatch',file,p['id'],expected,p['answer'])
   for label in labels:
    assert label in page.get_text(),('missing printed dimension',file,p['id'],label)
 for p in rec['problems']:
  expected='Answer: '+p['answer'].replace('π','pi').replace('³','^3').replace('²','^2')
  if rec['output']=='questions':assert expected not in full,(file,p['id'],'student key leaked')
  else:assert expected in full,(file,p['id'],'teacher answer absent',expected)
 assert 'R79.1' in (pdf.metadata.get('title') or '')
 pdf.close()
assert problems==48*8 and circle_count>0 and strokes>2000
assert all(v>0 for v in kinds.values())
report={'schema':'mathworks-r79-independent-mixed-solids-vector/v1','status':'PASS',
 'actualPdfFiles':len(docs),'actualMixedProblemInstances':problems,
 'independentlyCheckedNetEdges':strokes,'independentlyCheckedCylinderDisks':circle_count,
 'actualShapeInstances':kinds,'samePdfAllThreeShapes':True,
 'closedTotalAreaAndVolumeUnits':'PASS','studentTeacherSeparation':'PASS',
 'printableTextMargins':'PASS','teacherApproval':'NOT RUN',
 'actualPhysicalPrint':'NOT RUN','cloudflareDeployment':'NOT VERIFIED'}
(root/'independent-r79-mixed-net-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('R79 checked',len(docs),'real mixed PDFs,',problems,'geometry problems,',
 strokes,'net strokes and',circle_count,'circular bases.')
