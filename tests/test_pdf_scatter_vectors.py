"""R59 adversarial independent PDF scatter coordinate tests."""
import importlib.util
import unittest
from pathlib import Path

script=Path(__file__).resolve().parents[1]/'scripts'/'check-pdf-scatter-vectors.py'
spec=importlib.util.spec_from_file_location('r59_scatter',script)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class ScatterVectorOracleTests(unittest.TestCase):
    def test_regular_x_and_y_ticks(self):
        self.assertEqual(mod.geometric_ticks([10,20,30,40],10,10,4,'x'),4)
        self.assertEqual(mod.geometric_ticks([110,130,150],110,20,3,'y'),3)
    def test_shifted_ticks_are_rejected(self):
        with self.assertRaisesRegex(AssertionError,'mark 1'):
            mod.geometric_ticks([10,21,30,40],10,10,4,'shifted')
    def test_missing_or_extra_ticks_are_rejected(self):
        with self.assertRaisesRegex(AssertionError,'expected 4'):
            mod.geometric_ticks([10,20,30],10,10,4,'missing')
        with self.assertRaisesRegex(AssertionError,'expected 4'):
            mod.geometric_ticks([10,20,30,40,50],10,10,4,'extra')
    def test_real_points_not_moved_and_not_leaked(self):
        samples=[[1,0],[2,2],[3,4],[4,6],[5,8],[6,10]]
        original=[(10+188*x/7,100-96*y/10) for x,y in samples]
        self.assertEqual(mod.verify_dots(original,samples,10,100,True),6)
        self.assertEqual(mod.verify_dots([],samples,10,100,False),0)
        with self.assertRaisesRegex(AssertionError,'actual printed dot'):
            altered=list(original);altered[2]=(altered[2][0]+5,altered[2][1])
            mod.verify_dots(altered,samples,10,100,True)
        with self.assertRaisesRegex(AssertionError,'plotted 6'):
            mod.verify_dots(original,samples,10,100,False)
    def test_trend_and_coordinate_answer_checked_independently(self):
        pairs=[[1,1],[2,2],[3,4],[4,4],[5,6],[6,7]]
        mod.independently_check_trend({'pairs':pairs,'trend':'positive','task':'identify','answer':'positive'})
        with self.assertRaisesRegex(AssertionError,'trend disagrees'):
            mod.independently_check_trend({'pairs':pairs,'trend':'negative','task':'identify','answer':'negative'})
        with self.assertRaisesRegex(AssertionError,'answer'):
            mod.independently_check_trend({'pairs':pairs,'trend':'positive','task':'identify','answer':'negative'})
        with self.assertRaisesRegex(AssertionError,'answer text'):
            mod.independently_check_trend({'pairs':pairs,'trend':'positive','task':'plot','answer':'Coordinates: (1, 2)'})
if __name__=='__main__':
    unittest.main()
