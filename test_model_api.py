import unittest
from pathlib import Path

from model_api import ModelError, ModelService, validate_train_config

ROOT = Path(__file__).parent


class TrainConfigValidationTests(unittest.TestCase):
    def test_valid(self):
        cfg = validate_train_config({'lr': 0.02, 'epochs': 30, 'hidden': 64, 'layers': 2, 'activation': 'gelu',
                                     'dropout': 0.3, 'feature_set': 'mfcc'})
        self.assertEqual(cfg['epochs'], 30)
        self.assertEqual(cfg['activation'], 'gelu')

    def test_rejects_out_of_range_and_bad_types(self):
        for bad in [{'lr': 5}, {'epochs': 0}, {'layers': 9}, {'hidden': True}, {'dropout': '0.5'},
                    {'activation': 'softmax'}, {'feature_set': 'video'}, []]:
            with self.assertRaises(ModelError):
                validate_train_config(bad)


@unittest.skipUnless((ROOT / 'model' / 'segment_mlp.pt').exists(), 'trained model not present')
class PredictionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            import torch  # noqa: F401
        except ImportError:
            raise unittest.SkipTest('torch not installed')
        cls.service = ModelService()

    def test_predict_bundled_clip(self):
        out = self.service.predict_clip('1001_DFA_ANG_XX')
        self.assertEqual(len(out['probs']), 6)
        self.assertAlmostEqual(sum(out['probs']), 1.0, places=2)
        self.assertEqual(len(out['segments']), 8)

    def test_rejects_path_traversal(self):
        with self.assertRaises(ModelError):
            self.service.predict_clip('../server')

    def test_probe_swap_full_span_equals_donor_prediction(self):
        donor = self.service.predict_clip('1001_DFA_NEU_XX')
        out = self.service.probe({'sourceId': '1001_DFA_ANG_XX', 'op': 'swap', 'donorId': '1001_DFA_NEU_XX',
                                  'segments': list(range(8))})
        for a, b in zip(out['after']['probs'], donor['probs']):
            self.assertAlmostEqual(a, b, places=3)


if __name__ == '__main__':
    unittest.main()
