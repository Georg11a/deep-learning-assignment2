"""Download a small, attributed CREMA-D subset; never clone the full corpus."""
from pathlib import Path
from urllib.request import urlopen
import concurrent.futures

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://media.githubusercontent.com/media/CheyneyComputerScience/CREMA-D/master/AudioWAV/'
NAMES = [f'{speaker}_{sentence}_{emotion}_XX.wav' for speaker in ['1001', '1002'] for sentence in ['DFA', 'TIE'] for emotion in ['ANG', 'HAP', 'NEU', 'SAD']]
NAMES.remove('1002_TIE_NEU_XX.wav')  # Not available at the upstream URL.

def download(name):
    dest = ROOT / 'public' / 'audio' / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.read_bytes()[:4] == b'RIFF':
        return name + ' already present'
    with urlopen(BASE + name, timeout=30) as response:
        body = response.read()
    if body[:4] != b'RIFF':
        raise ValueError(f'{name}: expected WAV, got pointer or error')
    dest.write_bytes(body)
    return name + f' ({len(body)} bytes)'

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(download, NAMES):
            print(result)
