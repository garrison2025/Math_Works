"""R52 fail deliberately if digital printer measurement geometry changes."""
import importlib.util
import unittest
from pathlib import Path
import fitz
p=Path(__file__).resolve().parents[1]/'scripts'/'check-print-calibration.py'
spec=importlib.util.spec_from_file_location('r52_print_calibration',p)
cal=importlib.util.module_from_spec(spec);spec.loader.exec_module(cal)
PT=72/25.4
class PhysicalPrintVectorAuditTest(unittest.TestCase):
    def make(self,dx=100,dy=100,bar=50,square=25):
        doc=fitz.open();page=doc.new_page(width=612,height=792)
        def line(ax,ay,bx,by):
            page.draw_line((ax,ay),(bx,by),color=(.1,.4,.6),width=1.4)
        x,y=74,205
        line(x,y,x+dx*PT,y)
        line(x,y+20,x,y+20+dy*PT)
        line(x,y+355,x+bar*PT,y+355)
        w=square*PT
        line(380,370,380+w,370)
        line(380+w,370,380+w,370+w)
        line(380+w,370+w,380,370+w)
        line(380,370+w,380,370)
        return doc,page
    def test_correct_vectors(self):
        doc,page=self.make()
        self.assertEqual(sorted(cal.classify(cal.segments(page))),
          sorted(['H100','V100','H50']+['S25']*4))
        doc.close()
    def test_wrong_horizontal_length_is_detected(self):
        doc,page=self.make(dx=96)
        self.assertNotIn('H100',cal.classify(cal.segments(page)))
        doc.close()
    def test_wrong_vertical_scale_is_detected(self):
        doc,page=self.make(dy=104)
        self.assertNotIn('V100',cal.classify(cal.segments(page)))
        doc.close()
    def test_wrong_square_and_50mm_bar_detected(self):
        doc,page=self.make(bar=49,square=26)
        found=cal.classify(cal.segments(page))
        self.assertNotIn('H50',found)
        self.assertNotIn('S25',found)
        doc.close()
if __name__=='__main__':unittest.main()
