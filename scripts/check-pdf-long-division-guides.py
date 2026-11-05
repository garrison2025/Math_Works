#!/usr/bin/env python3
"""R53: inspect actual printed long-division PDF vectors, not source constants.

Each 3/4-digit problem must have dividend_digits + 1 horizontal blank
pencil guides of 126 PDF points. Includes max-size A4 and Letter stress files.
"""
import re
import sys
from pathlib import Path
import fitz

GUIDE_LENGTH=315*(.86-.46)
TOL=0.15
PROMPT=re.compile(r'(?m)^([0-9]{3,4})\s*÷\s*([0-9]{1,2})\s*=\s*____\s*\(quotient R remainder\)')

def guide_count(page):
    total=0
    for path in page.get_drawings():
        for item in path['items']:
            if item[0]!='l':continue
            a,b=item[1:3]
            if abs(a.y-b.y)<TOL and abs(abs(a.x-b.x)-GUIDE_LENGTH)<TOL:
                total+=1
    return total

def validate_page(page,label):
    prompts=PROMPT.findall(page.get_text())
    if not prompts:raise AssertionError(f'{label}: no printed division questions found')
    expected=sum(len(a)+1 for a,_ in prompts)
    actual=guide_count(page)
    if actual!=expected:
        raise AssertionError(f'{label}: {len(prompts)} questions need {expected} pencil rows, found {actual}')
    return len(prompts),actual,{len(a) for a,_ in prompts}

def run(directory):
    files=sorted(directory.glob('*long-division*questions.pdf'))
    if len(files)!=4:raise AssertionError(f'Expected 4 stress PDFs, found {len(files)}')
    questions=0;guides=0;pages=0;digits=set()
    for f in files:
        with fitz.open(f) as pdf:
            for number,page in enumerate(pdf):
                n,lines,ds=validate_page(page,f'{f.name}:page{number+1}')
                questions+=n;guides+=lines;digits.update(ds);pages+=1
    if digits!={3,4}:raise AssertionError(f'Missing 3 or 4 digit coverage: {digits}')
    if questions!=160:raise AssertionError(f'Expected 160 student questions, got {questions}')
    print(f'R53 actual-PDF guide audit PASS: 4 files, {pages} pages, 160 questions, {guides} row vectors across 3/4 digit dividends')

if __name__=='__main__':run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/pdf-stress'))
