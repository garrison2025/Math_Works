"""Adversarial R32 tests: PDFs must contain every question, answer and step."""
import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

import fitz

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'check-pdf-content.py'
spec = importlib.util.spec_from_file_location('pdf_content_audit', SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class PrintedPdfContentAuditTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.path = Path(self.folder.name) / 'example.pdf'
        self.questions = [
            {'id':'Q1','question':'Find 3 × 4 = ____','answer':'12',
             'steps':['Multiply 3 × 4.','The result is 12.']},
            {'id':'Q2','question':'Find 8 ÷ 2 = ____','answer':'4',
             'steps':['Divide 8 ÷ 2.','The result is 4.']},
        ]

    def produce(self, mode='steps', missing_answer=False, missing_step=False,
                missing_question=False, second_page=False):
        doc = fitz.open()
        page = doc.new_page(width=612, height=792)
        for i, question in enumerate(self.questions):
            if second_page and i == 1:
                page = doc.new_page(width=612, height=792)
            y = 110 if second_page else 110 + 200 * i
            if missing_question and i == 1:
                continue
            page.insert_text((40,y), f'{i+1}.', fontsize=9, fontname='hebo')
            page.insert_text((40,y+18),audit.pdf_ascii(question['question']),
                             fontsize=10,fontname='helv')
            if mode != 'questions':
                if not (missing_answer and i == 1):
                    page.insert_text((50,y+36),'Answer: '+question['answer'],
                                     fontsize=10,fontname='hebo')
                if mode == 'steps':
                    for j, step in enumerate(question['steps'],1):
                        if missing_step and i == 1 and j == 1:
                            continue
                        page.insert_text((50,y+36+j*17),audit.pdf_ascii(f'{j}) {step}'),
                                         fontsize=10,fontname='helv')
        doc.set_metadata({'title':'Test - generator v18 - config abc123 - layout 2'})
        raw = doc.tobytes()
        doc.close()
        self.path.write_bytes(raw)
        self.record = {'sha256':hashlib.sha256(raw).hexdigest(),
                       'pages':2 if second_page else 1,
                       'mode':mode,'optionsHash':'abc123'}

    def verify(self):
        return audit.verify_file(self.path,self.record,self.questions,
                                 generator='18',layout='2')

    def test_three_modes_and_page_breaks(self):
        for mode in ('questions','answers','steps'):
            self.produce(mode,second_page=True)
            pages, texts = self.verify()
            self.assertEqual(pages,2)
            self.assertGreaterEqual(texts,2)

    def test_math_transliteration_and_wrapping(self):
        self.assertEqual(audit.compact('3 × 4'),audit.compact('3 x 4'))
        self.assertEqual(audit.compact('8 ÷ 2'),audit.compact('8 divided by 2'))

    def test_missing_question_rejected(self):
        self.produce(missing_question=True)
        with self.assertRaisesRegex(AssertionError,'numbered PDF problems'):
            self.verify()

    def test_missing_answer_rejected(self):
        self.produce(missing_answer=True)
        with self.assertRaisesRegex(AssertionError,'missing/wrong answer'):
            self.verify()

    def test_missing_step_rejected(self):
        self.produce(missing_step=True)
        with self.assertRaisesRegex(AssertionError,'missing step'):
            self.verify()

    def test_tampered_pdf_rejected(self):
        self.produce()
        self.path.write_bytes(self.path.read_bytes()+b'\n% changed')
        with self.assertRaisesRegex(AssertionError,'SHA-256 mismatch'):
            self.verify()

if __name__ == '__main__':
    unittest.main()
