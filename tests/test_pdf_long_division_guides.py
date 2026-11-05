import importlib.util
import unittest
from pathlib import Path
import fitz

source=Path(__file__).resolve().parents[1]/'scripts'/'check-pdf-long-division-guides.py'
spec=importlib.util.spec_from_file_location('r53_division',source)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class TestLongDivisionPdfGuides(unittest.TestCase):
    def fixture(self,dividend=1234,rows=5,span=126):
        doc=fitz.open()
        page=doc.new_page(width=612,height=792)
        page.insert_text((45,100),f'{dividend} ÷ 12 = ____ (quotient R remainder)',fontsize=10)
        for row in range(rows):
            page.draw_line((178,160+row*18),(178+span,160+row*18))
        return doc,page
    def test_five_rows(self):
        doc,page=self.fixture()
        self.assertEqual(audit.validate_page(page,'good')[:2],(1,5))
        doc.close()
    def test_missing_rows_fails(self):
        doc,page=self.fixture(rows=2)
        with self.assertRaisesRegex(AssertionError,'need 5 pencil rows'):
            audit.validate_page(page,'missing rows')
        doc.close()
    def test_wrong_span_fails(self):
        doc,page=self.fixture(span=120)
        with self.assertRaisesRegex(AssertionError,'found 0'):
            audit.validate_page(page,'too short')
        doc.close()
    def test_three_digit_dividend_has_four_rows(self):
        doc,page=self.fixture(dividend=123,rows=4)
        self.assertEqual(audit.validate_page(page,'three digits')[:2],(1,4))
        doc.close()

if __name__=='__main__':unittest.main()
