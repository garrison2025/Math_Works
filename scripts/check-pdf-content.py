#!/usr/bin/env python3
"""R32: audit real exported PDF content against the complete R29 manifest.

Checks exact numbered questions, answers and reviewed steps inside each
individual PDF problem block. Also checks SHA256 and file identities.
This is not a substitute for human visual or physical print approval.
"""
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

try:
    import fitz
except ImportError as exc:
    raise SystemExit('PyMuPDF is mandatory for semantic PDF audit') from exc

REPLACEMENTS = [
    ('−', '-'), ('×', 'x'), ('÷', ' divided by '), ('≤', '<='),
    ('≥', '>='), ('π', 'pi'), ('√', 'sqrt'), ('²', '^2'), ('³', '^3'),
    ('°', ' deg'), ('½', '1/2'), ('●', '*'), ('→', ' -> '),
    ('←', ' <- '), ('↔', ' <-> '), ('–', '-'), ('—', '-'),
]

def pdf_ascii(value):
    """Same transformations as src/lib/pdf.ts ascii()."""
    for before, after in REPLACEMENTS:
        value = value.replace(before, after)
    return ''.join(ch for ch in value if ' ' <= ch <= '~')

def compact(value):
    # PDF wrapping can split long unspaced mathematical expressions.
    return re.sub(r'\s+', '', pdf_ascii(value))

def problem_chunks(document):
    """Read PDF content-stream order, retaining each question's own text."""
    chunks, number, parts = [], None, []
    for page in document:
        for block in page.get_text('dict', sort=False)['blocks']:
            for line in block.get('lines', []):
                for span in line.get('spans', []):
                    value = span['text'].strip()
                    if not value:
                        continue
                    marker = re.fullmatch(r'(\d{1,2})\.', value)
                    is_label = (marker is not None
                                and abs(span['size'] - 9) < .2
                                and 'bold' in span['font'].lower())
                    if is_label:
                        if number is not None:
                            chunks.append((number, ' '.join(parts)))
                        number, parts = int(marker.group(1)), []
                    elif number is not None:
                        parts.append(value)
    if number is not None:
        chunks.append((number, ' '.join(parts)))
    return chunks

def verify_file(path, record, questions, *, generator, layout):
    if not path.is_file():
        raise AssertionError(f'{path.name}: missing exported PDF')
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != record['sha256']:
        raise AssertionError(f'{path.name}: SHA-256 mismatch vs manifest')
    with fitz.open(stream=raw, filetype='pdf') as doc:
        if len(doc) != record['pages']:
            raise AssertionError(f'{path.name}: page count mismatch')
        title = doc.metadata.get('title', '')
        for item in (f'generator v{generator}', f'layout {layout}',
                     f'config {record["optionsHash"]}'):
            if item not in title:
                raise AssertionError(f'{path.name}: missing PDF identity {item}')
        chunks = problem_chunks(doc)
        labels = [number for number, _ in chunks]
        expected_labels = list(range(1, len(questions) + 1))
        if labels != expected_labels:
            raise AssertionError(f'{path.name}: numbered PDF problems {labels} != {expected_labels}')
        verified = 0
        for (number, text), question in zip(chunks, questions):
            if question['id'] != f'Q{number}':
                raise AssertionError(f'{path.name}: corrupt manifest ID at Q{number}')
            actual = compact(text)
            prompt = compact(question['question'])
            if not prompt or prompt not in actual:
                raise AssertionError(f'{path.name} Q{number}: missing/truncated question {question["question"]!r}')
            verified += 1
            if record['mode'] in ('answers', 'steps'):
                answer = compact('Answer: ' + question['answer'])
                if not answer or answer not in actual:
                    raise AssertionError(f'{path.name} Q{number}: missing/wrong answer {question["answer"]!r}')
                verified += 1
            if record['mode'] == 'steps':
                if not question['steps']:
                    raise AssertionError(f'{path.name} Q{number}: blank reviewed steps')
                for step_no, step in enumerate(question['steps'], 1):
                    item = compact(f'{step_no}) {step}')
                    if not item or item not in actual:
                        raise AssertionError(f'{path.name} Q{number}: missing step {step_no}: {step!r}')
                    verified += 1
        return len(doc), verified

def run(folder):
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf8'))
    cases, files = manifest['cases'], manifest['files']
    if manifest['summary']['topics'] != 51 or len(cases) != 102 or len(files) < 408:
        raise AssertionError('Full-catalog stress scope reduced')
    case_map = {(case['topic'], case['difficulty']): case for case in cases}
    if len(case_map) != len(cases):
        raise AssertionError('Duplicate stress cases')
    names, pages, texts, modes = set(), 0, 0, Counter()
    for record in files:
        name = record['name']
        if Path(name).name != name or name in names:
            raise AssertionError(f'Unsafe or duplicate filename {name}')
        names.add(name)
        case = case_map.get((record['topic'], record['difficulty']))
        if case is None or name not in case['files']:
            raise AssertionError(f'{name}: mismatched case membership')
        if (record['seed'] != case['seed']
                or record['quantity'] != len(case['questions'])
                or record['paper'] not in ('Letter', 'A4')
                or record['mode'] not in ('questions', 'answers', 'steps')):
            raise AssertionError(f'{name}: invalid PDF provenance')
        checked = {**record, 'optionsHash': case['optionsHash']}
        count, assertions = verify_file(
            folder / name, checked, case['questions'],
            generator=str(manifest['generatorVersion']),
            layout=str(manifest['layoutVersion']))
        pages += count
        texts += assertions
        modes[record['mode']] += 1
    if pages != manifest['summary']['pages'] or len(names) != manifest['summary']['documents']:
        raise AssertionError('Exported PDF totals do not match manifest')
    for case in cases:
        if len(case['files']) not in (4, 6) or any(name not in names for name in case['files']):
            raise AssertionError(f'{case["topic"]}: incomplete paper/mode coverage')
    result = {'status':'PASS', 'documents':len(names), 'pages':pages,
              'checked_text_segments':texts, 'modes':dict(modes),
              'problem_cases':len(cases), 'topics':51,
              'note':'PDF content extracted; manual/physical print review not done'}
    (folder / 'content-integrity-audit.json').write_text(
        json.dumps(result, indent=2, ensure_ascii=False), encoding='utf8')
    return result

def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else 'qa-artifacts/pdf-stress')
    try:
        result = run(folder)
        print('R32 PDF content PASS:', result['documents'], 'PDFs,',
              result['pages'], 'pages,', result['checked_text_segments'], 'text segments')
        return 0
    except Exception as error:
        (folder / 'content-integrity-audit.json').write_text(
            json.dumps({'status':'FAIL', 'error':str(error)}, indent=2), encoding='utf8')
        print('R32 PDF content FAIL:', error, file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
