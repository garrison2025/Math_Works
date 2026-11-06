"""R59 adversarial count-the-dots PDF geometry acceptance tests."""
import importlib.util
import unittest
from pathlib import Path

path=Path(__file__).resolve().parents[1]/'scripts'/'check-pdf-counting-dots.py'
spec=importlib.util.spec_from_file_location('r59_counting_dots',path)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def valid(n):
    return [(50+i%6*m.X_STEP,150-(i//6)*m.Y_STEP) for i in range(n)]

class CountDotPrintAuditTests(unittest.TestCase):
    def test_all_valid_integer_counts_have_expected_vectors(self):
        for n in range(1,13):
            self.assertEqual(m.check_layout(valid(n),n,595.28,841.89),n)
    def test_missing_circle_fails(self):
        with self.assertRaisesRegex(AssertionError,'Printed'):
            m.check_layout(valid(7)[:-1],7,595.28,841.89)
    def test_duplicate_circle_fails(self):
        with self.assertRaisesRegex(AssertionError,'same PDF coordinate'):
            dots=valid(5);dots[4]=dots[3]
            m.check_layout(dots,5,595.28,841.89)
    def test_misplaced_columns_fail(self):
        with self.assertRaisesRegex(AssertionError,'misplaced'):
            dots=valid(6);dots[3]=(dots[3][0]+4,dots[3][1])
            m.check_layout(dots,6,595.28,841.89)
    def test_wrong_row_spacing_fails(self):
        with self.assertRaisesRegex(AssertionError,'misplaced'):
            dots=valid(8);dots[7]=(dots[7][0],dots[7][1]-6)
            m.check_layout(dots,8,595.28,841.89)
    def test_off_paper_dots_fail(self):
        with self.assertRaisesRegex(AssertionError,'margins'):
            m.check_layout([(12,150)],1,595.28,841.89)
if __name__=='__main__':
    unittest.main()
