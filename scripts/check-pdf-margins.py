#!/usr/bin/env python3
"""R29 full-catalog text bounds gate. Requires Poppler `pdftotext` on CI runner.

Unlike checking the PDF MediaBox, verifies the actual extracted glyph bounding boxes.
Respects the V2 plan minimum physical printer safety zone: 36 pt on all edges.
This is a machine check, NOT a visual proof for vector drawings or a printer test.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree

SAFE = 36.0
TOLERANCE = 0.25


def main() -> int:
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else 'qa-artifacts/pdf-stress')
    if not shutil.which('pdftotext'):
        raise RuntimeError('pdftotext (Poppler) missing: this release gate may not silently skip')
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    files = manifest['files']
    if len(files) < 408 or manifest['summary']['topics'] != 51:
        raise ValueError('Full-catalog PDF scope reduced unexpectedly')
    bad = []
    pages = 0
    words = 0
    for file_meta in files:
        name = file_meta['name']
        pdf_path = folder / name
        if not pdf_path.is_file():
            raise FileNotFoundError(pdf_path)
        result = subprocess.run(
            ['pdftotext', '-q', '-bbox', str(pdf_path), '-'],
            text=True, encoding='utf-8', capture_output=True, check=True,
        )
        root = ElementTree.fromstring(result.stdout)
        pdf_pages = [node for node in root.iter() if node.tag.endswith('page')]
        if len(pdf_pages) != file_meta['pages']:
            bad.append(f'{name}: PDF page count changed from manifest')
        for page_number, page in enumerate(pdf_pages, 1):
            pages += 1
            width, height = float(page.attrib['width']), float(page.attrib['height'])
            for word in page.iter():
                if not word.tag.endswith('word'):
                    continue
                words += 1
                left, top, right, bottom = (
                    float(word.attrib[field]) for field in ('xMin', 'yMin', 'xMax', 'yMax')
                )
                if (left < SAFE-TOLERANCE or right > width-SAFE+TOLERANCE
                        or top < SAFE-TOLERANCE or bottom > height-SAFE+TOLERANCE):
                    if len(bad) < 15:
                        bad.append(
                            f'{name} p{page_number} {word.text!r}: '
                            f'box=({left:.2f},{top:.2f},{right:.2f},{bottom:.2f}) '
                            f'page={width:.2f}x{height:.2f}'
                        )
    result = dict(documents=len(files), pages=pages, words=words,
                  min_printable_margin_pt=SAFE, status='PASS' if not bad else 'FAIL', examples=bad)
    (folder / 'text-bounds-audit.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print('Full-catalog PDF text bounds:', result['status'],
          f'{len(files)} PDFs, {pages} pages, {words} words, {SAFE:g}pt safe margins')
    for example in bad:
        print('ERROR:', example, file=sys.stderr)
    if bad:
        return 1
    if pages != manifest['summary']['pages']:
        raise ValueError('Page count does not match generated stress manifest')
    return 0


if __name__ == '__main__':
    sys.exit(main())
