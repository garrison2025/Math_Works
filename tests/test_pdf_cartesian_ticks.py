import importlib.util
import unittest
from pathlib import Path

root=Path(__file__).resolve().parents[1]
path=root/'scripts'/'check-pdf-cartesian-ticks.py'
spec=importlib.util.spec_from_file_location('r57_cartesian',path)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class TestCartesianVectorMarkAudit(unittest.TestCase):
    def test_mirrored_grid_is_accepted(self):
        self.assertEqual(audit.verify_marks([80,100,120,140,160],120,'good'),5)
    def test_legacy_shifted_ticks_fail_even_when_spaced(self):
        with self.assertRaisesRegex(AssertionError,'symmetrical ticks'):
            audit.verify_marks([65,85,105,125,145,165],115,'old off-origin')
    def test_zero_missing_fails(self):
        with self.assertRaisesRegex(AssertionError,'symmetrical ticks'):
            audit.verify_marks([80,100,140,160],120,'zero absent')
    def test_uneven_intervals_fail(self):
        with self.assertRaisesRegex(AssertionError,'asymmetric|unequal'):
            audit.verify_marks([80,100,120,140,162],120,'wrong spacing')
    def test_axis_origin_shift_fails(self):
        with self.assertRaisesRegex(AssertionError,'zero is NOT'):
            audit.verify_marks([80,100,120,140,160],123,'bad crossing')
if __name__=='__main__':
    unittest.main()
