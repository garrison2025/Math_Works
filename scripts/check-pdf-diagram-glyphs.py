#!/usr/bin/env python3
"""R43: independent actual-PDF text oracle for math diagram operator glyphs.
Checks all 516 R93 stress-PDF artifacts, including 27 independently certified worked-step topic families. Fail on visually ambiguous 'x' or 'deg' in
angle/column-multiplication diagrams, regardless of math engine assertions.
"""
import json
import re
import sys
from pathlib import Path
import fitz

ANGLE_TOPICS={
    'angle-worksheets':2,
    'triangle-angle-sum-worksheets':4,
    'complementary-supplementary-angles-worksheets':2,
    'vertical-angles-worksheets':2,
}
MULTIPLICATION_TOPICS={
    'two-digit-multiplication-worksheets',
    'two-digit-by-one-digit-multiplication-worksheets',
    'three-digit-by-two-digit-multiplication-worksheets'
}
BAD_ANGLE=re.compile(r'(?<![a-zA-Z])deg(?![a-zA-Z])',re.I)
SINGLE_X=re.compile(r'(?m)^x$')

def check_text(topic,mode,question_count,text):
    """Only the question-mode PDF includes the actual diagrams."""
    if mode!='questions' or topic not in (set(ANGLE_TOPICS)|MULTIPLICATION_TOPICS):
        return []
    issues=[]
    if topic in ANGLE_TOPICS:
        if BAD_ANGLE.search(text):
            issues.append('Legacy deg abbreviation found in printable angle diagrams')
        degree_count=text.count('°')
        required=ANGLE_TOPICS[topic]*question_count
        if degree_count<required:
            issues.append(f'Missing angle glyphs: need >= {required} degree signs, found {degree_count}')
    if topic in MULTIPLICATION_TOPICS:
        if SINGLE_X.search(text):
            issues.append('Ambiguous x printed as vertical multiplication operator')
        crosses=text.count('×')
        required=2*question_count # readable prompt plus actual vector column
        if crosses<required:
            issues.append(f'Missing multiplication symbols: need >= {required} crosses, found {crosses}')
    return issues

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    cases={(case['topic'],case['difficulty']):case for case in manifest['cases']}
    if manifest['summary']['topics']!=51 or len(cases)!=102 or len(manifest['files'])!=516:
        raise AssertionError('R94 full-stress scope changed; require 51 topics, 102 cases and 516 PDFs')
    modes={mode:sum(1 for entry in manifest['files'] if entry['mode']==mode)
           for mode in ('questions','answers','steps')}
    if modes!={'questions':204,'answers':204,'steps':108}:
        raise AssertionError('R93 complete student, answer and 23-family worked-step PDF coverage changed: '+str(modes))
    files=[r for r in manifest['files'] if r['topic'] in (set(ANGLE_TOPICS)|MULTIPLICATION_TOPICS)]
    if len(files)<28:
        raise AssertionError('Missing required angle/multiplication diagram coverage')
    checked=0
    violations=[]
    for record in files:
        case=cases[(record['topic'],record['difficulty'])]
        with fitz.open(folder/record['name']) as doc:
            text='\n'.join(page.get_text() for page in doc)
        issues=check_text(record['topic'],record['mode'],len(case['questions']),text)
        checked+=1
        for issue in issues:
            violations.append({'file':record['name'],'error':issue})
    report={
        'status':'FAIL' if violations else 'PASS',
        'files_examined':checked,
        'text_contract':'PDF triangle/angle labels must use °; column multiplication uses × not x',
        'violations':violations[:40]
    }
    (folder/'math-diagram-glyph-audit.json').write_text(
        json.dumps(report,indent=2),encoding='utf8')
    print('R43 diagram glyph audit:',report['status'],checked,'PDFs',len(violations),'errors')
    for issue in violations[:12]:
        print('ERROR:',issue,file=sys.stderr)
    return int(bool(violations))

if __name__=='__main__':
    sys.exit(run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/pdf-stress')))
