import unittest
import wave
from pathlib import Path
from server import validate

class AnnotationValidationTests(unittest.TestCase):
    def row(self):
        return dict(id='test', clipId='sample-01', emotion='Uncertain', createdAt='2026-09-19T00:00:00Z', valence=0, arousal=.5, confidence=3, start=0, end=1)

    def test_valid(self):
        validate(self.row())

    def test_missing_fields(self):
        for key in ('id', 'clipId', 'emotion', 'createdAt'):
            row = self.row()
            del row[key]
            with self.assertRaises(ValueError): validate(row)

    def test_ranges_and_nonfinite(self):
        for key, value in [('valence', 2), ('arousal', -1), ('confidence', 9), ('start', -1), ('end', float('nan')), ('valence', True), ('arousal', '0.5')]:
            with self.assertRaises(ValueError): validate({**self.row(), key:value})

    def test_region(self):
        with self.assertRaises(ValueError): validate({**self.row(), 'end':0})

    def test_non_object(self):
        with self.assertRaises(ValueError): validate([])

    def test_real_audio_files(self):
        files = list((Path(__file__).parent / 'public' / 'audio').glob('*.wav'))
        self.assertEqual(len(files), 15)
        for path in files:
            with wave.open(str(path)) as wav:
                self.assertGreater(wav.getnframes(), 0)
                self.assertGreater(wav.getframerate(), 0)
                self.assertGreater(wav.getnchannels(), 0)

if __name__ == '__main__':
    unittest.main()
