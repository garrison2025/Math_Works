"""R39 fraction stroke extraction must detect missing or overlaid bars."""
import importlib.util
import unittest
from pathlib import Path
import fitz

script=Path(__file__).resolve().parents[1]/'scripts'/'check-pdf-fractions.py'
spec=importlib.util.spec_from_file_location('fraction_audit',script)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class FractionBarTests(unittest.TestCase):
    def setUp(self):
        self.doc=fitz.open()
        self.addCleanup(self.doc.close)
        self.page=self.doc.new_page(width=612,height=792)

    def test_expected_question_matching(self):
        self.assertEqual(audit.expected_bars('fractions-worksheets','3/4 ÷ 5/6 = ____'),2)
        self.assertEqual(audit.expected_bars('equivalent-fractions-worksheets','2/3 = ____/6'),2)
        self.assertEqual(audit.expected_bars('percentages-worksheets','Convert 1/8 into a percentage.'),1)
        self.assertEqual(audit.expected_bars('percentages-worksheets','Find 25% of 50.'),0)
        self.assertEqual(audit.expected_bars('slope-worksheets','1/2 + 1/2 = ____'),0)

    def test_exact_stroke_counts_not_any_horizontal_rule(self):
        self.page.draw_line((55,130),(75,130),width=1.15)
        self.page.draw_line((55,160),(75,160),width=.65)
        self.page.draw_line((55,190),(80,190),width=1.15)
        self.page.draw_line((55,220),(200,220),width=1.15)
        self.assertEqual(len(audit.fraction_bars(self.page)),2)

    def test_bar_crossing_text_rejected(self):
        self.page.insert_text((50,120),'2',fontsize=12)
        self.page.draw_line((48,115),(63,115),width=1.15)
        self.assertTrue(audit.obscured_bars(self.page,audit.fraction_bars(self.page)))

    def test_bar_between_numerator_and_denominator_accepted(self):
        self.page.insert_text((55,100),'2',fontsize=11)
        self.page.draw_line((53,112),(69,112),width=1.15)
        self.page.insert_text((55,128),'3',fontsize=11)
        self.assertEqual(audit.obscured_bars(self.page,audit.fraction_bars(self.page)),[])

if __name__=='__main__':
    unittest.main()
