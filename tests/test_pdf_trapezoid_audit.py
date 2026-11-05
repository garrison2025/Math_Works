"""R44 adversarial printed trapezoid geometry: y-axis inversion is fatal."""
import importlib.util
import unittest
from pathlib import Path
import fitz
p=Path(__file__).resolve().parents[1]/'scripts'/'check-pdf-trapezoid.py'
spec=importlib.util.spec_from_file_location('r44_trapezoid',p)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
P=fitz.Point
def outline(ybottom=140,ytop=50,bottomw=120,topw=40):
    cx=150
    bleft=P(cx-bottomw/2,ybottom);bright=P(cx+bottomw/2,ybottom)
    tleft=P(cx-topw/2,ytop);tright=P(cx+topw/2,ytop)
    altitude_x=max(bleft.x,tleft.x)
    return [(bleft,bright),(bright,tright),(tright,tleft),
            (tleft,bleft),(P(altitude_x,ytop),P(altitude_x,ybottom))]
class TrapezoidPrintTests(unittest.TestCase):
    def test_correct_lower_and_upper_in_real_pdf_coordinates(self):
        self.assertEqual(audit.check_five_strokes(outline(),16,3),[])
        self.assertEqual(audit.check_five_strokes(outline(bottomw=40,topw=120),3,16),[])
        self.assertEqual(audit.check_five_strokes(outline(bottomw=120,topw=120),3,3),[])
    def test_reject_inverted_pdf_coordinate_system(self):
        e=audit.check_five_strokes(outline(ybottom=50,ytop=140),16,3)
        self.assertTrue(any('ABOVE upper' in msg for msg in e),e)
    def test_reject_wrong_visual_base_width_ordering(self):
        e=audit.check_five_strokes(outline(bottomw=40,topw=120),16,3)
        self.assertTrue(any('reversed' in msg for msg in e),e)
    def test_reject_nonvertical_altitude(self):
        s=outline()
        a,b=s[-1];s[-1]=(P(a.x+8,a.y),b)
        e=audit.check_five_strokes(s,16,3)
        self.assertTrue(any('perpendicular' in msg for msg in e),e)
    def test_reject_missing_segment(self):
        self.assertTrue(audit.check_five_strokes(outline()[:4],16,3))

if __name__=='__main__':
    unittest.main()
