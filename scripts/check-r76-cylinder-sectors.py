#!/usr/bin/env python3
"""Independent R76 real PDF geometry audit via PyMuPDF.
Measures rectangle width/(height) and disk radius in the *emitted* PDF,
then verifies expected exact-pi formulas, dimension annotations, print margins
and student/teacher isolation. Also rejects complete-circle strokes in R74
partial-sector area worksheets and checks their actual angular arc endpoints.
"""
import json
import math
import re
import sys
from pathlib import Path
import fitz
root=Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts')
netdir=root/'r76-cylinder-net'
old=root/'r74-inequality-circle'
net=json.loads((netdir/'manifest.json').read_text())['files']
oldfiles=json.loads((old/'manifest.json').read_text())['files']
assert len(net)==30 and len(oldfiles)==66
segment_checks=0
circle_checks=0
sector_checks=0
instances=0

def is_near(a,b,eps=.8):return abs(a-b)<=eps
def close(a,b,eps=.8):return is_near(a[0],b[0],eps) and is_near(a[1],b[1],eps)
def find_line(lines,a,b,eps=.8):
 return any((close(start,a,eps) and close(end,b,eps)) or
            (close(start,b,eps) and close(end,a,eps)) for start,end in lines)
def geom(page):
 line_segments=[]
 ellipses=[]
 for drawing in page.get_drawings():
  if any(item[0]=='c' for item in drawing['items']):
   rect=drawing['rect']
   ellipses.append((rect.x0,rect.y0,rect.x1,rect.y1))
  for line in drawing['items']:
   if line[0]=='l':
    a,b=line[1],line[2]
    line_segments.append(((a.x,a.y),(b.x,b.y)))
 return line_segments,ellipses
def assert_margins(page,width,height,file):
 for block in page.get_text('dict')['blocks']:
  if block.get('type')!=0:continue
  for line in block.get('lines',[]):
   for span in line.get('spans',[]):
    x0,y0,x1,y1=span['bbox']
    assert 35<=x0 and x1<=width-35,(file,'x margin',span['text'],x0,x1,width)
    assert 35<=y0 and y1<=height-35,(file,'y margin',span['text'],y0,y1,height)
for entry in net:
 file=entry['file'];pdf=fitz.open(netdir/file)
 width,height=(612,792) if entry['paper']=='Letter' else (595.28,841.89)
 assert len(pdf)==3
 full=''
 for page_ix,page in enumerate(pdf):
  assert abs(page.rect.width-width)<.15 and abs(page.rect.height-height)<.15
  assert_margins(page,width,height,file)
  full+=page.get_text()+'\n'
  lines,ellipses=geom(page)
  for local,p in enumerate(entry['problems'][3*page_ix:3*page_ix+3]):
   r,h=p['radius'],p['height']
   assert r>1 and h>1
   s=min(129/(2*math.pi*r),95/(h+4*r),3)
   y=height-168-local*185
   x0=width-42-176
   y0=y-145
   base=y0+2*r*s
   roof=base+h*s
   right=x0+2*math.pi*r*s
   to_pdf=lambda xy:(xy[0],height-xy[1])
   rectangle=[
    ((x0,base),(right,base)),((right,base),(right,roof)),
    ((right,roof),(x0,roof)),((x0,roof),(x0,base))
   ]
   for a,b in rectangle:
    assert find_line(lines,to_pdf(a),to_pdf(b)),(file,p['id'],'wrong cylinder rectangle stroke',a,b)
    segment_checks+=1
   # Disks must physically match the same r as the curved-width 2*pi*r.
   cx=x0+(right-x0)/2
   for cy in [y0+r*s,roof+r*s]:
    box=(cx-r*s,height-(cy+r*s),cx+r*s,height-(cy-r*s))
    assert any(all(is_near(box[k],e[k]) for k in range(4)) for e in ellipses),(
     file,p['id'],'wrong circle center/radius or no disk',box,ellipses)
    circle_checks+=1
   # Independent formulas: no use of generator's derived coefficients as oracle.
   L=2*r*h;SA=2*r*(h+r);V=r*r*h
   assert p['lateralCoefficient']==L and p['totalCoefficient']==SA and p['volumeCoefficient']==V
   unit=p['unit']
   expected={
    'total-surface':f'{SA}π {unit}²',
    'lateral-surface':f'{L}π {unit}²',
    'volume':f'{V}π {unit}³',
    'surface-and-volume':f'SA = {SA}π {unit}²; V = {V}π {unit}³'
   }[p['kind']]
   assert p['answer']==expected,(file,p['id'])
   text=page.get_text()
   for label in (f'r={r} {unit}',f'h={h} {unit}','C=2pi*r'):
    assert label in text,(file,p['id'],'dimension missing from actual PDF',label)
   instances+=1
 for p in entry['problems']:
  expected=p['answer'].replace('π','pi').replace('²','^2').replace('³','^3')
  if entry['output']=='questions':
   assert expected not in full,(file,p['id'],'student answer leaked',expected)
  else:
   assert expected in full,(file,p['id'],'teacher answer missing',expected)
 assert 'R76.1' in (pdf.metadata.get('title') or '')
 pdf.close()
assert segment_checks==30*8*4
assert circle_checks==30*8*2

# Previous R74 packs now use true sectors rather than a full-circle outline.
for entry in oldfiles:
 if entry['kind']!='circle':continue
 path=old/entry['file'];pdf=fitz.open(path)
 width,height=(612,792) if entry['paper']=='Letter' else (595.28,841.89)
 assert len(pdf)==2
 for page_ix,page in enumerate(pdf):
  lines,ellipses=geom(page)
  for local,p in enumerate(entry['problems'][page_ix*4:page_ix*4+4]):
   x=width-98;y=height-169-local*145-94
   rad=31
   degree={'semicircle':180,'quarter-circle':90}.get(p['kind'],
      p['degrees'] if p['kind']=='sector' else 360)
   # PDFs use a top-left coordinate system. Every partial arc must have its
   # two radial boundaries AND a circular perimeter chord at precise theta.
   point=lambda a:(x+rad*math.cos(math.radians(a)),
                   height-(y+rad*math.sin(math.radians(a))))
   centre=(x,height-y)
   if degree<360:
    assert find_line(lines,centre,point(0)),(path,p['id'],'start radius missing')
    assert find_line(lines,centre,point(degree)),(path,p['id'],'end radius missing',degree)
    n=math.ceil(degree/5)
    for j in range(n):
     assert find_line(lines,point(degree*j/n),point(degree*(j+1)/n)),(
       path,p['id'],'arc chord missing',degree,j)
     sector_checks+=1
    # A complete circle would assert the *wrong shaded region*.
    assert not any(is_near(e[0],x-rad) and is_near(e[2],x+rad) and
                   is_near(e[1],height-y-rad) and is_near(e[3],height-y+rad)
                   for e in ellipses),(path,p['id'],'partial sector contains full-circle outline')
   else:
    assert any(is_near(e[0],x-rad) and is_near(e[2],x+rad) and
               is_near(e[1],height-y-rad) and is_near(e[3],height-y+rad)
               for e in ellipses),(path,p['id'],'full-circle outline absent')
  assert_margins(page,width,height,path)
 pdf.close()
assert sector_checks>150
report={'schema':'mathworks-r76-real-vector-geometry/v1','cylinder_files':len(net),
 'cylinder_printed_question_instances':instances,'true_unwrapped_rectangle_strokes_checked':segment_checks,
 'true_base_disks_checked':circle_checks,'r74_sector_arc_chords_checked':sector_checks,
 'closed_vs_lateral_vs_volume_units':'PASS','student_answers_isolated':'PASS',
 'print_text_margins':'PASS','teacher_review':'NOT RUN','physical_print':'NOT RUN'}
(netdir/'independent-r76-vector-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('R76 verified 30 cylinder PDFs,',segment_checks,'net strokes,',circle_checks,
 'circles,',sector_checks,'sector arc chords. All math, privacy and margins pass.')
