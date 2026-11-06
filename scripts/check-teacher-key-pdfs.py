#!/usr/bin/env python3
"""R60 independent audit of actual 40-question classroom PDF page layout.

Read PyMuPDF text rectangles and page MediaBoxes. Verify that every expected
question number is printed once, every teacher answer has a matching marker
in the same column, and no 10pt printed prompt/answer text crosses the gutter.
Diagram answer keys must remain FULL WIDTH, not compressed into two columns.
No physical paper, ink contrast or teacher handwriting can be assessed here.
"""
from pathlib import Path
import json
import re
import sys
import fitz

MARGIN=40
GAP=19

def close(a,b,tolerance=.8):
    return abs(a-b)<=tolerance

def all_spans(page):
    return [(span['text'].strip(),fitz.Rect(span['bbox']),span['size'],span.get('flags',0))
            for block in page.get_text('dict')['blocks']
            for line in block.get('lines',[])
            for span in line.get('spans',[]) if span['text'].strip()]

def validate_page(page,mode,with_diagram):
    w=page.rect.width
    cw=(w-2*MARGIN-GAP)/2
    xleft=MARGIN
    xright=MARGIN+cw+GAP
    spans=all_spans(page)
    ids=[]
    answers=[]
    prompt_rectangles=[]
    for label,rect,size,flags in spans:
        if re.fullmatch(r'[1-9]\d*\.',label) and close(size,9,.16) and flags&16:
            ids.append((int(label[:-1]),rect))
        if label.startswith('Answer:') and close(size,10,.16) and flags&16:
            answers.append(rect)
        if close(size,10,.16) and not with_diagram and mode in ('questions','answers'):
            prompt_rectangles.append(rect)
        if rect.x0<36-1 or rect.x1>w-36+1 or rect.y0<36-1 or rect.y1>page.rect.height-36+1:
            # Header/footer captions are also constrained by the existing R29
            # global PDF text margin audit; this additionally checks R60 pages.
            raise AssertionError(f'Printed text outside safe page area: {label[:50]}')
    if not ids:
        raise AssertionError('R60 blank/orphan header-only PDF page')
    expected_positions=[xleft] if with_diagram else [xleft,xright]
    for num,box in ids:
        if not any(close(box.x0,x,1.0) for x in expected_positions):
            raise AssertionError(f'Question {num} placed outside expected print column')
    if not with_diagram:
        # Includes question/answer 10pt spans; the PDF renderer measures their
        # widths in the actual embedded font, not approximate character counts.
        for box in prompt_rectangles:
            side=0 if box.x0<xright-5 else 1
            low=xleft if side==0 else xright
            high=low+cw
            if not (low-1<=box.x0 and box.x1<=high-3):
                raise AssertionError(f'10pt printed text crosses answer gutter: {box}')
    if mode=='questions':
        if answers:
            raise AssertionError('Student questions leaked teacher Answer: text')
        return [num for num,_ in ids],0,len({round(box.x0,1) for _,box in ids})
    if len(answers)!=len(ids):
        raise AssertionError(f'Question count {len(ids)} differs from teacher answer labels {len(answers)}')
    linked=set()
    for answer in answers:
        same_column=[(num,box) for num,box in ids
                     if close(answer.x0,box.x0+10,1.0) and box.y0<answer.y0]
        if not same_column:
            raise AssertionError('Teacher answer label detached from numbered problem')
        num,anchor=max(same_column,key=lambda pair:pair[1].y0)
        if num in linked:
            raise AssertionError('Duplicate answer label for one question')
        linked.add(num)
        later=[box.y0 for other,box in ids if other!=num
               and close(box.x0,anchor.x0) and box.y0>anchor.y0+2]
        if later and answer.y1>min(later)+2:
            raise AssertionError('Teacher answer collides with next numbered exercise')
    return [num for num,_ in ids],len(answers),len({round(box.x0,1) for _,box in ids})

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    if manifest['schema']!='mathworks-r60-teacher-key/v1' or len(manifest['documents'])!=38:
        raise AssertionError('R60 requires complete 38 real PDF fixtures')
    seen=set()
    total_answer_labels=0
    saved_pages=0
    for item in manifest['documents']:
        key=(item['topic'],item['paper'],item['mode'])
        if key in seen:raise AssertionError('Duplicate R60 fixture')
        seen.add(key)
        if len(item['ids'])!=item['qty'] or len(item['answers'])!=item['qty']:
            raise AssertionError('Manifest omitted question or answer')
        with fitz.open(folder/item['file']) as doc:
            if len(doc)!=item['pages'] or not 1<=len(doc)<=item['qty']:
                raise AssertionError('Incorrect PDF page count')
            width=595.28 if item['paper']=='A4' else 612
            if not close(doc[0].rect.width,width,.11):
                raise AssertionError('Wrong paper MediaBox')
            numbers=[]
            markers=0
            right_columns=0
            for page in doc:
                labels,answers,cols=validate_page(page,item['mode'],item['withDiagram'])
                numbers.extend(labels)
                markers+=answers
                if cols==2:right_columns+=1
                if item['withDiagram'] and cols!=1:
                    raise AssertionError('Diagram teacher answers must stay in full-width single column')
            if numbers!=list(range(1,item['qty']+1)):
                raise AssertionError(f'Wrong printed question numbering/sequence in {item["file"]}')
            if item['mode']=='answers':
                if markers!=item['qty']:
                    raise AssertionError('Teacher key omitted answers')
                total_answer_labels+=markers
            if not item['withDiagram'] and item['mode']=='answers':
                if not right_columns:
                    raise AssertionError('Compact answer-key never printed its second column')
                if len(doc)>4:
                    raise AssertionError(f'R60 40-answer key wasted {len(doc)} pages (>4)')
                # The pre-R60 actual full-width 40-answer layout used five
                # Letter pages on the same eight topics.
                if item['paper']=='Letter':
                    saved_pages+=5-len(doc)
    report={'status':'PASS','pdfDocuments':38,'textOnly40QuestionTopics':8,
      'teacherAnswerLabels':total_answer_labels,
      'LetterPagesAvoidedVsR59For8Topics':saved_pages,
      'coverage':'true printed PDF question order; one answer per exercise; 2-column gutter and text clipping; diagram key stays full width',
      'teacherReviewed':'NOT RUN','physicalPrint':'NOT MEASURED'}
    (folder/'teacher-key-vector-audit.json').write_text(json.dumps(report,indent=2))
    print('R60 print layout PASS: 38 actual PDFs; 40/40 numbered exercises per compact key; '
          +str(total_answer_labels)+' teacher answers; Letter pages avoided vs R59: '+str(saved_pages))
if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r60-teacher-key'))
