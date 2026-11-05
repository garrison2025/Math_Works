"""Adversarial tests for R37 full-page PDF text geometry."""
import importlib.util
import unittest
from pathlib import Path
import fitz
SCRIPT=Path(__file__).resolve().parents[1]/'scripts'/'check-pdf-visual.py'
spec=importlib.util.spec_from_file_location('pdf_visual_preflight',SCRIPT)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class TextPlacementTests(unittest.TestCase):
    def setUp(self):
        self.doc=fitz.open()
        self.addCleanup(self.doc.close)
        self.page=self.doc.new_page(width=612,height=792)
    def test_separate_lines(self):
        self.page.insert_text((40,100),'First mathematics question',fontsize=10)
        self.page.insert_text((40,114),'Second mathematics question',fontsize=10)
        errors,spans=audit.text_issues(self.page)
        self.assertEqual(errors,[])
        self.assertEqual(spans,2)
    def test_superimposed_equations_rejected(self):
        self.page.insert_text((40,100),'7 x 8 equals 56',fontsize=10)
        self.page.insert_text((40,100),'8 x 7 equals 56',fontsize=10)
        issues,_=audit.text_issues(self.page)
        self.assertTrue(any('Overlapping text' in s for s in issues),issues)
    def test_columns_at_same_height_allowed(self):
        self.page.insert_text((40,100),'Left column',fontsize=10)
        self.page.insert_text((310,100),'Right column',fontsize=10)
        self.assertEqual(audit.text_issues(self.page)[0],[])
    def test_fallback_missing_glyph_rejected(self):
        self.page.insert_text((40,100),'Missing glyph: \u25a1',fontsize=10)
        issues,_=audit.text_issues(self.page)
        self.assertTrue(any('glyph' in s for s in issues),issues)
    def test_blank_page_has_no_spans(self):
        self.assertEqual(audit.text_issues(self.page),([],0))

if __name__=='__main__':
    unittest.main()
