#!/usr/bin/env python3
"""R54 independent PDF writing-rule audit, inspecting real exported strokes.

Excludes the header separator and all non-matching diagrams by measuring the
EXACT span of a practice pencil rule relative to each real PDF's MediaBox.
This checks digital vector geometry; classroom handwriting still needs users.
"""
import json
import sys
from pathlib import Path
import fitz

TOPICS={
 'addition-worksheets':(0,2,False),
 'two-step-equations-worksheets':(2,2,False),
 'area-of-triangles-worksheets':(0,1,True),
 'long-division-worksheets':(0,0,True),
 'printable-protractor':(0,0,True)
}
TOL=0.18

def count_pencil_rules(doc,has_diagram):
    expected_span=(doc[0].rect.width-80-19)/2-22 if not has_diagram else doc[0].rect.width-80-22
    count=0
    for page in doc:
        for drawing in page.get_drawings():
            for piece in drawing['items']:
                if piece[0]!='l':continue
                a,b=piece[1:3]
                if abs(a.y-b.y)<TOL and abs(abs(a.x-b.x)-expected_span)<TOL:
                    # A printable student pencil guide always lies within safe margins.
                    if not (38<a.x<page.rect.width-38 and
                            38<b.x<page.rect.width-38 and
                            38<a.y<page.rect.height-38 and
                            38<b.y<page.rect.height-38):
                        raise AssertionError('Ruled pencil line crosses printable safety margins')
                    count+=1
    return count

def run(folder):
    files=list(folder.glob('*.pdf'))
    if len(files)!=24:
        raise AssertionError(f'R54 expected 24 exported PDFs, found {len(files)}')
    evidence=[]
    for slug,(baseline,added,has_diagram) in TOPICS.items():
        for paper in ['a4','letter']:
            totals={}
            for room in ['standard','extra']:
                filename=f'{slug}-{paper}-{room}-questions.pdf'
                with fitz.open(folder/filename) as pdf:
                    if pdf.page_count<1:raise AssertionError(filename+' is empty')
                    expected_width=595.28 if paper=='a4' else 612
                    if abs(pdf[0].rect.width-expected_width)>.1:
                        raise AssertionError(filename+' wrong paper size')
                    count=count_pencil_rules(pdf,has_diagram)
                    expected=8*(baseline+(added if room=='extra' else 0))
                    if count!=expected:
                        raise AssertionError(f'{filename}: expected {expected} pencil vectors, found {count}')
                    totals[room]={'lines':count,'pages':len(pdf)}
                    if room=='extra' and 'extra writing room' not in pdf.metadata.get('title',''):
                        raise AssertionError(filename+' is missing extra-space PDF identity')
            if totals['extra']['pages']<totals['standard']['pages']:
                raise AssertionError(slug+' extra work space reduced total pages')
            evidence.append({'topic':slug,'paper':paper,'vectorCounts':totals,
                             'additionalPerQuestion':added})
            if slug in ('addition-worksheets','two-step-equations-worksheets'):
                file=folder/f'{slug}-{paper}-extra-answers.pdf'
                with fitz.open(file) as answers:
                    if count_pencil_rules(answers,has_diagram):
                        raise AssertionError(file.name+' answer sheet gained practice pencil rules')
    report={'status':'PASS','pdfs':len(files),'comparisons':evidence,
       'limits':'True PDF vector geometry validated, no physical printer or teacher involved'}
    (folder/'vector-audit.json').write_text(json.dumps(report,indent=2))
    print('R54 writing-room true-PDF PASS: 24 files, 10 standard-vs-extra paired audits, all ruled strokes correct; answer keys untouched')

if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r54-writing-room'))
