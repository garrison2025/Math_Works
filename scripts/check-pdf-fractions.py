#!/usr/bin/env python3
"""R39 independent check: the full PDF really contains every stacked fraction bar."""
import json
import re
import sys
from pathlib import Path
import fitz

FRACTION_TOPICS={
    'fractions-worksheets', 'equivalent-fractions-worksheets',
    'adding-unlike-fractions-worksheets', 'multiplying-fractions-worksheets',
    'percentages-worksheets'
}
FRACTION=re.compile(r'(?:\d{1,3}|____)/(?:\d{1,3}|____)')
def expected_bars(topic,question):
    if topic not in FRACTION_TOPICS:return 0
    if topic=='percentages-worksheets':
        return 1 if re.fullmatch(r'Convert \d{1,3}/\d{1,3} into a percentage\.', question) else 0
    return len(FRACTION.findall(question))

def fraction_bars(page):
    bars=[]
    for path in page.get_drawings():
        if abs(float(path.get('width',0))-1.15)>.07:continue
        for item in path['items']:
            if item[0]!='l':continue
            a,b=item[1],item[2]
            if (abs(a.y-b.y)<.1 and 9<=abs(a.x-b.x)<=70):
                bars.append((min(a.x,b.x),max(a.x,b.x),a.y))
    return bars

def obscured_bars(page,bars):
    spans=[fitz.Rect(span['bbox'])
        for block in page.get_text('dict',sort=False)['blocks']
        for line in block.get('lines',[])
        for span in line.get('spans',[]) if span['text'].strip()]
    problems=[]
    for left,right,yy in bars:
        for rect in spans:
            horizontal=min(rect.x1,right)-max(rect.x0,left)
            if horizontal>2 and rect.y0+1<yy<rect.y1-1:
                problems.append(f'Fraction line intersects printed text at ({left:.1f},{yy:.1f}) {rect}')
                break
    return problems

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    cases={(case['topic'],case['difficulty']):case for case in manifest['cases']}
    if manifest['summary']['topics']!=51 or len(cases)!=102 or len(manifest['files'])<408:
        raise AssertionError('Full-catalog PDF verification was reduced')
    sample_count=0;checked=0;found_total=expected_total=0;errors=[]
    for record in manifest['files']:
        if record['topic'] not in FRACTION_TOPICS:continue
        case=cases[(record['topic'],record['difficulty'])]
        expected=sum(expected_bars(record['topic'],q['question'])
                     for q in case['questions']) if record['mode']=='questions' else 0
        with fitz.open(folder/record['name']) as doc:
            if len(doc)!=record['pages']:
                errors.append(f"{record['name']}: altered page count")
            observed=0
            for pi,page in enumerate(doc,1):
                bars=fraction_bars(page)
                observed+=len(bars)
                for problem in obscured_bars(page,bars):
                    if len(errors)<35:errors.append(f"{record['name']} p{pi}: {problem}")
            if observed!=expected and len(errors)<35:
                errors.append(f"{record['name']}: expected {expected} fraction bars, extracted {observed}")
            expected_total+=expected;found_total+=observed;checked+=1
            if record['mode']=='questions' and expected:
                sample_count+=1
    if sample_count<16:
        errors.append(f'Unexpectedly few fraction practice samples: {sample_count}')
    report={'status':'FAIL' if errors else 'PASS','documents_checked':checked,
      'fraction_practice_samples':sample_count,'expected_bars':expected_total,
      'extracted_bars':found_total,'problems':errors,
      'scope':'PDF vector bar count and text crossing, not full human visual proof'}
    (folder/'fraction-vector-audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    print('R39 fraction vector audit:',report['status'],checked,'PDFs;',
          found_total,'bars;',len(errors),'errors')
    for error in errors[:15]:print('ERROR:',error,file=sys.stderr)
    return 1 if errors else 0

if __name__=='__main__':
    sys.exit(run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/pdf-stress')))
