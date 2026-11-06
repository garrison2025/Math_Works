#!/usr/bin/env python3
"""R56 independently audit *exported* prism label glyphs and print positions.

The source manifest supplies exact seeded expected labels. PyMuPDF inspects
actual printed text spans after the PDF is generated. Neither the website's
diagram renderer nor its label builder is trusted as proof of PDF content.
"""
import json
import sys
from collections import Counter
from pathlib import Path
import fitz

PREFIXES=('Length: ','Width: ','Height: ','Side: ')
X0={'Length: ':129.3,'Side: ':129.3,'Width: ':223.3,'Height: ':43.525}

def observed_labels(doc):
    spans=[]
    disclaimers=0
    for page in doc:
        disclaimers+=page.get_text().count('Schematic - not to scale')
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for item in line.get('spans',[]):
                    text=item['text'].strip()
                    if not text.startswith(PREFIXES):continue
                    prefix=next(p for p in PREFIXES if text.startswith(p))
                    rect=fitz.Rect(item['bbox'])
                    if abs(rect.x0-X0[prefix])>2.2:
                        raise AssertionError(f'{text!r} not beside intended dimension edge: x={rect.x0:.2f}')
                    if (rect.x0<36 or rect.x1>page.rect.width-36
                          or rect.y0<36 or rect.y1>page.rect.height-36):
                        raise AssertionError(f'{text!r} exceeds safe page text area: {rect}')
                    spans.append((page.number,text,rect))
    # No two semantic label rectangles may collide in the physical PDF.
    for i,(page_no,text,a) in enumerate(spans):
        for other_page,other,b in spans[i+1:]:
            if other_page!=page_no:continue
            overlap=a&b
            if overlap.is_empty:continue
            if overlap.width>2 and overlap.height>2:
                raise AssertionError(f'Dimension captions overlap: {text!r} and {other!r}')
    return Counter(text for _,text,_ in spans),disclaimers

def expected_counter(record):
    tokens=[]
    for p in record['expected']:
        tokens.append(p['length'])
        for key in ('width','height'):
            if p[key] is not None:tokens.append(p[key])
    return Counter(tokens)

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    if len(manifest['files'])!=8:
        raise AssertionError('R56 requires all 8 volume and surface/cube PDF cases')
    actual=total=0;papers=set();variants=set()
    for record in manifest['files']:
        file=folder/record['name']
        with fitz.open(file) as doc:
            if doc.page_count<1:raise AssertionError('Empty PDF: '+file.name)
            target=595.28 if record['paper']=='A4' else 612
            if abs(doc[0].rect.width-target)>.12:
                raise AssertionError('Wrong paper width: '+file.name)
            labels,notes=observed_labels(doc)
            expected=expected_counter(record)
            if labels!=expected:
                raise AssertionError(f'{file.name}: PDF dimension text {labels} != seeded question {expected}')
            if notes!=record['questionCount']:
                raise AssertionError(f'{file.name}: expected one not-to-scale warning per diagram, got {notes}')
            if 'missing-height' in record['variant']:
                if labels.get('Height: ?',0)!=record['questionCount']:
                    raise AssertionError('Unknown height disclosed or lost in '+file.name)
                if any(label.startswith('Height: ') and label!='Height: ?' for label in labels):
                    raise AssertionError('Student PDF leaks unknown volume height')
            if record['variant']=='surface-cube':
                if any(label.startswith(('Height: ','Length: ','Width: ')) for label in labels):
                    raise AssertionError('Cube has redundant or ambiguous dimension labels')
            total+=record['questionCount']
            actual+=sum(labels.values())
            papers.add(record['paper'])
            variants.add(record['variant'])
    if papers!={'A4','Letter'} or len(variants)!=4:
        raise AssertionError('Incomplete paper/solid/missing-height coverage')
    report={'status':'PASS','documents':8,'prismFigures':total,
        'verifiedNamedDimensionLabels':actual,'papers':sorted(papers),'variants':sorted(variants),
        'scope':'actual PDF extracted glyphs, x positions, page-safe boxes; no physical print'}
    (folder/'prism-dimension-audit.json').write_text(json.dumps(report,indent=2))
    print(f'R56 true-PDF prism dimensions PASS: 8 documents, {total} figures, {actual} dimension labels; unknown height hidden')
if __name__=='__main__':
    run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/prism-dimensions'))
