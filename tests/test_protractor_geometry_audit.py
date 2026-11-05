"""Adversarial regression checks for the independent R31 exported-PDF audit."""
import importlib.util
from pathlib import Path
import unittest
import fitz

path = Path(__file__).resolve().parents[1] / 'scripts/check-protractor-geometry.py'
spec = importlib.util.spec_from_file_location('protractor_audit', path)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def fake_page(radius_mm=72, bar_mm=50, shift_top_pt=0, include_tick=True, label_overlap=False):
    doc=fitz.open()
    page=doc.new_page(width=595.28,height=841.89)
    cx, cy=295,425
    r=radius_mm*audit.PT_PER_MM
    page.draw_line((cx-r,cy),(cx+r,cy))
    page.draw_line((cx,cy-r+shift_top_pt),(cx+0.2,cy-r+shift_top_pt))
    x=55; y=460; length=bar_mm*audit.PT_PER_MM
    page.draw_line((x,y),(x+length,y))
    if include_tick:
        page.draw_line((x,y-3),(x,y+3))
        page.draw_line((x+length,y-3),(x+length,y+3))
    page.insert_text((210,520),'50 mm check')
    label_y=cy+2 if label_overlap else cy-12
    page.insert_text((cx+r-27,label_y),'0',fontsize=7)
    page.insert_text((cx-r+24,label_y),'180',fontsize=7)
    return doc


class ProtractorGeometryAuditTests(unittest.TestCase):
    def test_actual_50mm_and_72mm_accepted(self):
        with fake_page() as doc:
            result=audit.validate_page(doc[0]);self.assertEqual(result['calibration_mm'],50)
            self.assertAlmostEqual(result['baseline_mm'],144,places=4)

    def test_wrong_calibration_scale_rejected(self):
        for length in (49, 50.5, 51):
            with self.subTest(length=length),fake_page(bar_mm=length) as doc:
                with self.assertRaisesRegex(AssertionError,'50 mm calibration bar'):
                    audit.validate_page(doc[0])

    def test_wrong_radius_rejected(self):
        for radius in (70, 71, 73, 75):
            with self.subTest(radius=radius),fake_page(radius_mm=radius) as doc:
                with self.assertRaisesRegex(AssertionError,'144 mm protractor baseline'):
                    audit.validate_page(doc[0])

    def test_endpoint_captions_touching_baseline_rejected(self):
        with fake_page(label_overlap=True) as doc:
            with self.assertRaisesRegex(AssertionError,'caption collides with baseline'):
                audit.validate_page(doc[0])

    def test_missing_apex_or_end_tics_rejected(self):
        with fake_page(shift_top_pt=1) as doc:
            with self.assertRaisesRegex(AssertionError,'semicircle apex'):
                audit.validate_page(doc[0])
        with fake_page(include_tick=False) as doc:
            with self.assertRaisesRegex(AssertionError,'endpoint tick'):
                audit.validate_page(doc[0])


if __name__=='__main__':
    unittest.main()
