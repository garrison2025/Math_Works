#!/usr/bin/env python3
"""R61 independent true-PDF inspection of geometry handwriting rules.

The auditor reads PDF vector strokes, not TypeScript rendering routines.
It checks per-question pencil count, row spacing, diagram separation, and
answer-only documents that must contain no student writing lines.
"""
from pathlib import Path
import json
import re
import sys
import fitz

COLOR=(.78,.84,.89)
EXPECTED={
 'area-worksheets':1,
 'area-of-triangles-worksheets':2,
 'area-of-parallelograms-worksheets':2,
 'area-of-trapezoids-worksheets':2,
 'volume-of-rectangular-prisms-worksheets':2,
 'surface-area-worksheets':2,
 'pythagorean-worksheets':2,
 'triangle-angle-sum-worksheets':1,
 'complementary-supplementary-angles-worksheets':1,
 'vertical-angles-worksheets':1,
 'scatter-plot-worksheets':0,
 'box-plots-worksheets':0,
 'long-division-worksheets':0,
 'printable-protractor':0,
 'angle-worksheets':0
}
EXEMPT={'long-division-worksheets','printable-protractor'}

def near(a,b,eps=.5):
    return abs(a-b)<=eps

def lines_from_pdf(page):
    width=page.rect.width
    found=[]
    for drawing in page.get_drawings():
        color=drawing.get('color')
        if (color is None or len(color)<3 or
            any(abs(color[i]-COLOR[i])>.034 for i in range(3)) or
            not near(drawing.get('width',0),.65,.045)):
            continue
        for item in drawing['items']:
            if item[0]!='l':continue
            a,b=item[1:3]
            if (near(a.y,b.y,.15) and near(min(a.x,b.x),48,.35)
                    and near(max(a.x,b.x),width-54,.35)):
                if not(36<a.y<page.rect.height-36 and 36<a.x<width-36 and 36<b.x<width-36):
                    raise AssertionError('Geometry pencil rule crosses printable margin')
                found.append((a.y+b.y)/2)
    return sorted(found)

def question_numbers(page):
    marks=[]
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line.get('spans',[]):
                s=span['text'].strip()
                if re.fullmatch(r'\d{1,2}\.',s) and near(span['size'],9,.15) and span.get('flags',0)&16:
                    rect=fitz.Rect(span['bbox'])
                    if not near(rect.x0,40,1.1):
                        raise AssertionError('R61 diagram questions are no longer full-width')
                    marks.append((int(s[:-1]),rect.y0))
    return sorted(marks,key=lambda p:p[1])

def check_grouping(numbers,rules,per_question):
    if not numbers:raise AssertionError('Empty/orphan PDF page')
    groups={number:[] for number,_ in numbers}
    for y in rules:
        candidates=[(n,qy) for n,qy in numbers if qy<y]
        if not candidates:raise AssertionError('Pencil rule is above its question')
        n,qy=max(candidates,key=lambda pair:pair[1])
        groups[n].append(y)
    for idx,(n,qy) in enumerate(numbers):
        ys=groups[n]
        if len(ys)!=per_question:
            raise AssertionError(f'Problem {n}: found {len(ys)} lines, expected {per_question}')
        for i,y in enumerate(ys):
            if y<qy+155:raise AssertionError(f'Problem {n}: writing line overlaps diagram')
            if i and not near(y-ys[i-1],21,.75):
                raise AssertionError(f'Problem {n}: writing rows not 21pt apart')
        if idx+1<len(numbers) and ys and numbers[idx+1][1]-ys[-1]<15:
            raise AssertionError(f'Problem {n}: writing line overlaps next question')
    return len(rules)

def inspect(doc,item):
    if len(doc)!=item['pages'] or not 1<=len(doc)<=8:
        raise AssertionError('Wrong PDF page count')
    expected_width=595.28 if item['paper']=='A4' else 612
    if not near(doc[0].rect.width,expected_width,.12):
        raise AssertionError('Wrong A4/Letter PDF width')
    topic=item['topic']
    if item['baseLines']!=EXPECTED[topic]:
        raise AssertionError('Manifest and independent subject workline policy disagree')
    count=0 if item['mode']=='answers' else EXPECTED[topic]
    if item['mode']=='questions' and item['room']=='extra' and topic not in EXEMPT:
        count+=1
    numbers=[];total=0
    for page in doc:
        anchors=question_numbers(page)
        numbers.extend(n for n,_ in anchors)
        total+=check_grouping(anchors,lines_from_pdf(page),count)
    if numbers!=list(range(1,9)) or total!=8*count:
        raise AssertionError(f'Wrong question sequence or rule total for {topic}')
    return total

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    docs=manifest['documents']
    if manifest['schema']!='mathworks-r61-geometry-room/v1' or len(docs)!=90:
        raise AssertionError('R61 requires exactly 90 A4/Letter test PDFs')
    combinations=set();total=0;by_topic={}
    for item in docs:
        key=(item['topic'],item['paper'],item['mode'],item['room'])
        if key in combinations:raise AssertionError('Duplicate R61 fixture')
        combinations.add(key)
        with fitz.open(folder/item['file']) as pdf:
            count=inspect(pdf,item)
        by_topic[item['topic']]=by_topic.get(item['topic'],0)+count
        total+=count
    for topic in EXPECTED:
        for paper in ['A4','Letter']:
            for mode,room in [('questions','standard'),('questions','extra'),('answers','extra')]:
                if (topic,paper,mode,room) not in combinations:
                    raise AssertionError('Missing topic/paper/mode fixture')
    report={'status':'PASS','pdfDocuments':90,'topics':len(EXPECTED),
        'truePencilVectors':total,'byTopic':by_topic,
        'checks':'real vector lines; below-diagram placement; question spacing; correct 21pt rows; teacher answer isolation; A4/Letter safety',
        'teacherReview':'NOT RUN','physicalPrint':'NOT MEASURED'}
    (folder/'geometry-writing-vector-audit.json').write_text(json.dumps(report,indent=2))
    print(f'R61 physical-PDF vector PASS: 90 documents, {total} printed calculation rules, {len(EXPECTED)} subjects')
if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r61-geometry-writing-space'))
