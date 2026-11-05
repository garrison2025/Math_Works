#!/usr/bin/env python3
"""Audit actual PDF vector paths, not only text, in the 51-topic stress set."""
import json
import math
import sys
from collections import Counter
from pathlib import Path
try:
    import fitz
except ImportError as error:
    raise SystemExit('PyMuPDF is mandatory for vector print QA') from error

SAFE = 36.0
TOLERANCE = 0.25

def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else 'qa-artifacts/pdf-stress')
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf8'))
    records = manifest['files']
    if len(records) < 408 or manifest['summary']['topics'] != 51:
        raise ValueError('Cannot skip any live topic for vector QA')
    problems = []
    by_topic = Counter()
    pages = drawings = violations = 0
    for record in records:
        name = record['name']
        with fitz.open(folder / name) as pdf:
            if len(pdf) != record['pages']:
                raise ValueError(f'{name}: page count mismatch')
            for pn, page in enumerate(pdf, 1):
                pages += 1
                width, height = page.rect.width, page.rect.height
                for drawing in page.get_drawings():
                    drawings += 1
                    box = drawing['rect']
                    # Zero-height or zero-width lines are valid strokes.
                    if (not all(math.isfinite(v) for v in [box.x0, box.y0, box.x1, box.y1])
                        or box.x0 > box.x1 or box.y0 > box.y1
                        or box.x0 < SAFE-TOLERANCE or box.y0 < SAFE-TOLERANCE
                        or box.x1 > width-SAFE+TOLERANCE
                        or box.y1 > height-SAFE+TOLERANCE):
                        violations += 1
                        topic = name.split('-standard-')[0].split('-challenge-')[0]
                        by_topic[topic] += 1
                        if len(problems) < 30:
                            problems.append(f'{name} p{pn}: {box}')
    if pages != manifest['summary']['pages']:
        raise ValueError('Generated PDF page count changed')
    result = {'status':'PASS' if not violations else 'FAIL',
              'documents':len(records), 'pages':pages,
              'vector_paths':drawings, 'min_printable_margin_pt':SAFE,
              'violations':violations, 'by_topic':dict(by_topic),
              'examples':problems}
    (folder / 'vector-bounds-audit.json').write_text(
        json.dumps(result,indent=2,ensure_ascii=False),encoding='utf8')
    print('Vector safe margins:',result['status'],len(records),'PDFs',
          pages,'pages',drawings,'paths',violations,'violations')
    for issue in problems:
        print('ERROR:',issue,file=sys.stderr)
    return 1 if violations else 0

if __name__ == '__main__':
    sys.exit(main())
