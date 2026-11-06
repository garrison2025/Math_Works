"""R61 adversarial geometry writing-space oracle cases."""
import importlib.util
import unittest
from pathlib import Path

script=Path(__file__).resolve().parents[1]/'scripts'/'check-geometry-writing-space.py'
spec=importlib.util.spec_from_file_location('r61_geometry_print',script)
p=importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class GeometryPencilVectors(unittest.TestCase):
    def test_valid_below_diagram_rules(self):
        self.assertEqual(p.check_grouping([(1,100)], [290,311],2),2)
        self.assertEqual(p.check_grouping([(1,100),(2,360)], [290,311,550,571],2),4)
        self.assertEqual(p.check_grouping([(1,100)],[],0),0)
    def test_missing_or_extra_lines_rejected(self):
        with self.assertRaisesRegex(AssertionError,'found 1 lines'):
            p.check_grouping([(1,100)],[290],2)
        with self.assertRaisesRegex(AssertionError,'found 2 lines'):
            p.check_grouping([(1,100)],[290,311],1)
    def test_misplaced_and_colliding_lines_rejected(self):
        with self.assertRaisesRegex(AssertionError,'overlaps diagram'):
            p.check_grouping([(1,100)],[248],1)
        with self.assertRaisesRegex(AssertionError,'not 21pt'):
            p.check_grouping([(1,100)],[290,319],2)
        with self.assertRaisesRegex(AssertionError,'overlaps next question'):
            p.check_grouping([(1,100),(2,315)],[290],1)
    def test_unattached_rule_rejected(self):
        with self.assertRaisesRegex(AssertionError,'above its question'):
            p.check_grouping([(1,100)],[90],1)
if __name__=='__main__':
    unittest.main()
