#!/usr/bin/env python3
"""R31 independent proof of *exported PDF* protractor physical dimensions.

Unlike source-code constant checks, this reads every visible PDF vector operator
on all 160 worksheet-instrument pages plus the two blank Letter/A4 instruments.
This checks *PDF coordinates* only. Printer scaling, paper size selected in a
physical print dialog and actual 50 mm ruler measurements remain NOT VERIFIED.
"""
import hashlib
import json
import math
import sys
from pathlib import Path

try:
    import fitz
except ImportError as error:
    raise SystemExit('PyMuPDF required; physical PDF geometry audit cannot be skipped') from error

PT_PER_MM = 72 / 25.4
CALIBRATION_PT = 50 * PT_PER_MM
RADIUS_PT = 72 * PT_PER_MM
BASELINE_PT = 2 * RADIUS_PT
# 0.1 pt = 0.0353 mm: tighter than common physical-printer tolerances.
TOLERANCE_PT = 0.10
LETTER = (612, 792)
A4 = (595.28, 841.89)


def _line_segments(page):
    for drawing in page.get_drawings():
        for item in drawing['items']:
            if item[0] == 'l':
                a, b = item[1], item[2]
                if all(map(math.isfinite, (a.x, a.y, b.x, b.y))):
                    yield a, b


def _matching_horizontal(segments, length):
    return [(a, b) for a, b in segments
            if abs(a.y - b.y) <= TOLERANCE_PT
            and abs(abs(b.x - a.x) - length) <= TOLERANCE_PT]


def validate_page(page, context='protractor'):
    """Raise if real PDF vector commands fail 72 mm + 50 mm geometry."""
    segments = list(_line_segments(page))
    baseline = _matching_horizontal(segments, BASELINE_PT)
    calibration = _matching_horizontal(segments, CALIBRATION_PT)
    if len(baseline) != 1:
        raise AssertionError(f'{context}: need exactly one 144 mm protractor baseline, found {len(baseline)}')
    if len(calibration) != 1:
        raise AssertionError(f'{context}: need exactly one 50 mm calibration bar, found {len(calibration)}')
    a, b = baseline[0]
    center_x, center_y = (a.x + b.x) / 2, (a.y + b.y) / 2
    apex = (center_x, center_y - RADIUS_PT)
    apex_points = [point for start, end in segments for point in (start, end)
                   if abs(point.x - apex[0]) < TOLERANCE_PT
                   and abs(point.y - apex[1]) < TOLERANCE_PT]
    if not apex_points:
        raise AssertionError(f'{context}: missing semicircle apex at 72 mm radius')
    observed_apex = min(apex_points, key=lambda point: abs(point.y - apex[1]))
    # The ticked bar is not just a graphic with similar length: it has a short
    # perpendicular endpoint at each end, as a measurable calibration ruler.
    ca, cb = calibration[0]
    for endpoint in (ca, cb):
        if not any(abs(start.x - end.x) < TOLERANCE_PT
                   and abs(start.x - endpoint.x) < TOLERANCE_PT
                   and abs((start.y + end.y) / 2 - endpoint.y) < TOLERANCE_PT
                   and 5 <= abs(start.y - end.y) <= 7
                   for start, end in segments):
            raise AssertionError(f'{context}: 50 mm bar lacks an endpoint tick')
    if '50 mm check' not in page.get_text():
        raise AssertionError(f'{context}: missing visible 50 mm calibration label')
    # Text-safety is distinct from page-edge safety: 0°/180° digits must not
    # touch the long horizontal protractor baseline. Inspect printed glyph boxes.
    spans = [span for block in page.get_text('dict')['blocks']
             for line in block.get('lines', []) for span in line['spans']]
    for tick in ('0', '180'):
        matches = [span for span in spans if span['text'].strip() == tick
                   and abs((span['bbox'][0] + span['bbox'][2])/2 -
                           (center_x + (RADIUS_PT - 27) * (1 if tick == '0' else -1))) < 10]
        if len(matches) != 1:
            raise AssertionError(f'{context}: missing {tick}-degree endpoint caption')
        if matches[0]['bbox'][3] > center_y - 2:
            raise AssertionError(f'{context}: {tick}-degree caption collides with baseline')
    # A PDF coordinate proof is not valid if the drawing itself is outside the
    # printable safe zone or has been cropped by a narrower MediaBox.
    if min(a.x, b.x, ca.x, cb.x) < 36 - TOLERANCE_PT:
        raise AssertionError(f'{context}: physical instrument is too close to left margin')
    if max(a.x, b.x, ca.x, cb.x) > page.rect.width - 36 + TOLERANCE_PT:
        raise AssertionError(f'{context}: physical instrument is too close to right margin')
    if apex[1] < 36 - TOLERANCE_PT or max(a.y, b.y, ca.y, cb.y) > page.rect.height - 36 + TOLERANCE_PT:
        raise AssertionError(f'{context}: physical instrument is too close to top/bottom margin')
    return {
        'radius_mm': round(abs(center_y - observed_apex.y) / PT_PER_MM, 6),
        'baseline_mm': round(abs(b.x - a.x) / PT_PER_MM, 6),
        'calibration_mm': round(abs(cb.x - ca.x) / PT_PER_MM, 6),
    }


def audit(stress_dir: Path, instrument_dir: Path):
    manifest = json.loads((stress_dir / 'manifest.json').read_text(encoding='utf-8'))
    if manifest.get('summary', {}).get('topics') != 51 or manifest.get('summary', {}).get('cases') != 102:
        raise AssertionError('Refusing a partial full-catalog stress test')
    records = [r for r in manifest['files']
               if r['topic'] == 'printable-protractor' and r['mode'] == 'questions']
    if len(records) != 4 or {(r['paper'], r['difficulty']) for r in records} != {
        ('Letter', 'standard'), ('Letter', 'challenge'),
        ('A4', 'standard'), ('A4', 'challenge')
    }:
        raise AssertionError('Missing a printable-protractor paper/difficulty combination')
    checked = 0
    by_paper = {}
    for record in records:
        pdf_path = stress_dir / record['name']
        if hashlib.sha256(pdf_path.read_bytes()).hexdigest() != record['sha256']:
            raise AssertionError(f'{pdf_path.name}: PDF hash does not match stress manifest')
        with fitz.open(pdf_path) as pdf:
            if len(pdf) != record['pages'] or len(pdf) != record['quantity']:
                raise AssertionError(f'{pdf_path.name}: every question needs an actual-size protractor page')
            for index, page in enumerate(pdf, 1):
                width, height = LETTER if record['paper'] == 'Letter' else A4
                if abs(page.rect.width - width) > .03 or abs(page.rect.height - height) > .03:
                    raise AssertionError(f'{pdf_path.name}: incorrect physical page dimensions')
                by_paper[f"worksheet-{record['paper']}"] = validate_page(page, f'{pdf_path.name} p{index}')
                checked += 1
    instruments = json.loads((instrument_dir / 'manifest.json').read_text(encoding='utf8'))
    if instruments.get('schema') != 'math-works-physical-protractor/v1' or len(instruments['files']) != 2:
        raise AssertionError('Missing blank physical protractor PDF fixtures')
    if {r['paper'] for r in instruments['files']} != {'Letter', 'A4'}:
        raise AssertionError('Blank protractor must cover Letter and A4')
    for record in instruments['files']:
        pdf_path = instrument_dir / record['name']
        if hashlib.sha256(pdf_path.read_bytes()).hexdigest() != record['sha256']:
            raise AssertionError(f'{pdf_path.name}: PDF hash mismatch')
        with fitz.open(pdf_path) as pdf:
            if len(pdf) != 1:
                raise AssertionError(f'{pdf_path.name}: blank instrument must fit one page')
            width, height = LETTER if record['paper'] == 'Letter' else A4
            if abs(pdf[0].rect.width - width) > .03 or abs(pdf[0].rect.height - height) > .03:
                raise AssertionError(f'{pdf_path.name}: wrong paper size')
            by_paper[f"blank-{record['paper']}"] = validate_page(pdf[0], pdf_path.name)
            checked += 1
    return {
        'status': 'PASS', 'schema': 'math-works-protractor-pdf-geometry/v1',
        'checked_pages': checked, 'worksheet_pages': checked-2,
        'blank_instrument_pages': 2, 'pdf_files': len(records)+2,
        'radius_mm': 72, 'diameter_mm': 144, 'calibration_mm': 50,
        'coordinate_tolerance_pt': TOLERANCE_PT,
        'by_paper': by_paper,
        'physical_printer_measurement': 'NOT RUN',
    }


def main():
    stress_dir = Path(sys.argv[1] if len(sys.argv) > 1 else 'qa-artifacts/pdf-stress')
    instrument_dir = Path(sys.argv[2] if len(sys.argv) > 2 else 'qa-artifacts/protractor-instruments')
    result = audit(stress_dir, instrument_dir)
    report = instrument_dir / 'geometry-audit.json'
    report.write_text(json.dumps(result, indent=2), encoding='utf8')
    print('PASS: independently measured', result['checked_pages'],
          'actual-size protractor PDF pages with 50 mm bars and 72 mm radii')
    print('NOT RUN: physical printer and ruler calibration')


if __name__ == '__main__':
    main()
