"""R43: visual-glyph regression tests against extracted PDF text semantics."""
import importlib.util
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location(
    'math_diagram_glyphs',
    Path(__file__).resolve().parents[1]/'scripts'/'check-pdf-diagram-glyphs.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class TestMathDiagramGlyphs(unittest.TestCase):
    def test_triangle_must_repeat_degree_on_diagram(self):
        s='Triangle angles are 33° and 27°. Find the third angle.\n33°\n27°\n?'
        self.assertEqual(module.check_text('triangle-angle-sum-worksheets','questions',1,s),[])
        old=s.replace('33°\n27°','33 deg\n27 deg')
        self.assertTrue(module.check_text('triangle-angle-sum-worksheets','questions',1,old))
    def test_angle_and_intersection_glyphs(self):
        for topic in ('angle-worksheets','complementary-supplementary-angles-worksheets',
                      'vertical-angles-worksheets'):
            self.assertEqual(module.check_text(topic,'questions',1,'Find 50°.\n50°\n?'),[])
            self.assertTrue(module.check_text(topic,'questions',1,'Find 50°.\n50 deg\n?'))
    def test_column_multiplication_requires_real_operator(self):
        topic='two-digit-multiplication-worksheets'
        self.assertEqual(module.check_text(topic,'questions',1,'3 × 4 = ____\n3\n4\n×'),[])
        self.assertTrue(module.check_text(topic,'questions',1,'3 × 4 = ____\n3\n4\nx'))
        self.assertTrue(module.check_text(topic,'questions',1,'3 × 4 = ____\n3\n4'))
    def test_answers_have_no_practice_diagram_contract(self):
        self.assertEqual(module.check_text('vertical-angles-worksheets','answers',1,'83 deg'),[])
        self.assertEqual(module.check_text('other-worksheets','questions',1,'3 x 4'),[])

if __name__=='__main__':
    unittest.main()
