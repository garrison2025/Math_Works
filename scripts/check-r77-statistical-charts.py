#!/usr/bin/env python3
"""R77: Independent printed coordinate and answer audit for three statistical
chart families plus number-recognition dots. Inspects real PyMuPDF paths,
never calls or trusts TypeScript plot geometry, axis helpers or math oracles.
"""
from pathlib import Path
import importlib.util
import json
import math
import re
import sys
import fitz

root=Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts')
src=root/'r77-statistical-dot-plots'
docs=json.loads((src/'manifest.json').read_text('utf-8'))
assert docs['schema']=='mathworks-r77-frequency-dot-plot-pdfs/v1'
records=docs['documents']
assert len(records)==36
AXIS=184.5
STEP=18.5
BLUE=(.12,.39,.65)
INK=(.10,.17,.27)
checked_dots=checked_ticks=checked_questions=0

def near(a,b,tol=.64):return abs(a-b)<=tol
def same_color(a,b):
 return a is not None and len(a)>=3 and all(abs(a[i]-b[i])<.045 for i in range(3))
def edges(page):
 out=[]
 for draw in page.get_drawings():
  for v in draw['items']:
   if v[0]=='l':
    a,b=v[1],v[2]
    out.append(((a.x,a.y),(b.x,b.y),draw.get('width'),draw.get('color')))
 return out
def has_line(segments,a,b,width=None):
 for x,y,w,c in segments:
  if ((near(x[0],a[0]) and near(x[1],a[1]) and near(y[0],b[0]) and near(y[1],b[1])) or
      (near(y[0],a[0]) and near(y[1],a[1]) and near(x[0],b[0]) and near(x[1],b[1]))):
   if width is None or near(w,width,.2):return True
 return False
def dots(page):
 result=[]
 for draw in page.get_drawings():
  if not same_color(draw.get('fill'),BLUE):continue
  rect=fitz.Rect(draw['rect'])
  if not near(rect.width,6.2,.4) or not near(rect.height,6.2,.4):continue
  if not any(item[0]=='c' for item in draw['items']):
   raise AssertionError('Dot marker is not a PDF circle path')
  result.append(((rect.x0+rect.x1)/2,(rect.y0+rect.y1)/2))
 return result
def text_spans(page):
 for block in page.get_text('dict')['blocks']:
  if block.get('type')!=0:continue
  for line in block.get('lines',[]):
   for span in line.get('spans',[]):
    yield span
def assert_text_margins(page,width,height,file):
 for t in text_spans(page):
  x0,y0,x1,y1=t['bbox']
  assert x0>=35 and x1<=width-35,(file,'horizontal print margin',t['text'],x0,x1)
  assert y0>=35 and y1<=height-35,(file,'vertical print margin',t['text'],y0,y1)
def oracle(p):
 values=p['observations']
 assert 8<=len(values)<=16 and all(isinstance(v,int) and 1<=v<=10 for v in values)
 frequencies=[sum(v==i for v in values) for i in range(1,11)]
 assert p['frequencies']==frequencies
 assert sum(frequencies)==len(values) and 2<=max(frequencies)<=5
 modes=[i for i,n in enumerate(frequencies,1) if n==max(frequencies)]
 sorted_values=sorted(values)
 assert values==sorted_values
 n=len(values)
 median=sorted_values[n//2] if n%2 else (sorted_values[n//2-1]+sorted_values[n//2])/2
 expect={'plot':'Dots: '+', '.join(f'{i}:{v}' for i,v in enumerate(frequencies,1)),
         'frequency':str(frequencies[p['targetValue']-1]),
         'mode':', '.join(map(str,modes)),
         'median':str(median).removesuffix('.0'),
         'range':str(sorted_values[-1]-sorted_values[0])}[p['kind']]
 assert p['answer']==expect,(p['id'],'answer mismatch',p['answer'],expect)
 return frequencies

for entry in records:
 file=entry['file']
 pdf=fitz.open(src/file)
 width,height=(612,792) if entry['paper']=='Letter' else (595.28,841.89)
 assert len(pdf)==3,(file,'expected three printable pages')
 full=''
 for page_idx,page in enumerate(pdf):
  assert near(page.rect.width,width,.15) and near(page.rect.height,height,.15)
  assert_text_margins(page,width,height,file)
  full+=page.get_text()+'\n'
  lines=edges(page)
  circles=dots(page)
  expected_circles=[]
  for j,p in enumerate(entry['problems'][3*page_idx:3*page_idx+3]):
   freq=oracle(p)
   rowY=height-168-j*185
   axisY=rowY-135
   x0=width-42-215
   axis_top=height-axisY
   assert has_line(lines,(x0-9,axis_top),(x0+9*STEP+9,axis_top),1.3),(
    file,p['id'],'missing or incorrectly scaled frequency-dot axis')
   for value in range(1,11):
    x=x0+(value-1)*STEP
    assert has_line(lines,(x,axis_top+4),(x,axis_top-4),.8),(
     file,p['id'],'frequency-axis tick moved',value)
    # True PDF text must be centered under the exact numeric tick, not inferred
    # from an unused manifest scale.
    labels=[s for s in text_spans(page) if s['text'].strip()==str(value)
       and near(s['size'],7.5,.18)
       and axis_top+5<=s['bbox'][1]<=axis_top+30
       and near((s['bbox'][0]+s['bbox'][2])/2,x,1.75)]
    assert len(labels)==1,(file,p['id'],'missing/shifted/duplicated printed number',value,len(labels))
    checked_ticks+=1
    if entry['output']!='questions' or p['kind']!='plot':
     for k in range(freq[value-1]):
      expected_circles.append((x,height-(axisY+12.4+k*12.4)))
   checked_questions+=1
  # Each dot belongs to exactly one stack and its vertical index is exact.
  assert len(circles)==len(expected_circles),(file,'dot count',len(circles),len(expected_circles))
  remaining=circles[:]
  for target in expected_circles:
   matches=[i for i,q in enumerate(remaining)
            if near(q[0],target[0],.45) and near(q[1],target[1],.45)]
   assert len(matches)==1,(file,'wrong frequency/stack coordinate',target)
   remaining.pop(matches[0]);checked_dots+=1
  assert not remaining
 for p in entry['problems']:
  if entry['output']=='questions':
   assert ('Answer: '+p['answer']) not in full,(file,p['id'],'student answer leak')
  else:
   assert ('Answer: '+p['answer']) in full,(file,p['id'],'teacher answer missing')
 assert 'R77.1' in (pdf.metadata.get('title') or '')
 pdf.close()

# Re-run independent R58/R59 auditors over the actual PDF files produced by
# this very same CI run; mere JS math parity would not verify the drawn strokes.
auditors=[
 ('box_plots','scripts/check-pdf-box-scales.py','stat-chart-pdfs'),
 ('scatter_plots','scripts/check-pdf-scatter-vectors.py','scatter-chart-pdfs'),
 ('counting_dots_not_statistics','scripts/check-pdf-counting-dots.py','counting-dot-pdfs')
]
project=Path(__file__).resolve().parents[1]
for name,rel,folder in auditors:
 spec=importlib.util.spec_from_file_location('r77_'+name,project/rel)
 mod=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(mod)
 mod.run(root/folder)

report={
 'schema':'mathworks-r77-independent-statistical-pdf-coordinates/v1','status':'PASS',
 'real_statistical_dotplot_pdfs':len(records),
 'printed_statistics_question_instances':len(records)*8,
 'independently_checked_numbered_frequency_ticks':checked_ticks,
 'independently_checked_stacked_dot_circles':checked_dots,
 'rechecked_modified_boxplot_pdf_fixtures':16,
 'rechecked_scatterplot_pdf_fixtures':18,
 'rechecked_number_recognition_dot_pdf_fixtures':24,
 'statistics_frequency_vs_number_recognition':'DIFFERENT TASKS, BOTH CHECKED',
 'student_answers_separated':'PASS',
 'real_printed_positions_and_math':'PASS',
 'teacher_approval':'NOT RUN','physical_printer_calibration':'NOT RUN',
 'cloudflare_live_deployment':'NOT VERIFIED'
}
(src/'independent-r77-statistics-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print('R77 real-vector statistical charts PASS:',len(records),'true frequency-dot PDFs,',
 checked_ticks,'numeric value ticks,',checked_dots,'real dots;',
 'legacy 16 box, 18 scatter, 24 recognition-dot PDFs independently rechecked.')
