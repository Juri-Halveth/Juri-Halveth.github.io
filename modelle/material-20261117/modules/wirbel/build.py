"""Build a standalone, offline browser page. Python standard library only."""
from pathlib import Path
import argparse,base64,hashlib,json,sys,webbrowser
ROOT=Path(__file__).resolve().parent

def verify():
    expected=json.loads((ROOT/'SHA256.json').read_text(encoding='utf-8'))
    for name,digest in expected.items():
        p=ROOT/name
        if p.is_symlink() or not p.is_file() or ROOT not in p.resolve().parents:
            raise ValueError('Unzulaessige oder fehlende Paketdatei: '+name)
        if hashlib.sha256(p.read_bytes()).hexdigest()!=digest:
            raise ValueError('Abweichende Paketdatei: '+name)
    print(f'PAKET | {len(expected)} Dateien stimmen mit Manifest ueberein')

def build():
    engine=(ROOT/'src/engine.js').read_text(encoding='utf-8')
    app=(ROOT/'src/app.js').read_text(encoding='utf-8').replace('SOURCE_SHA',hashlib.sha256((ROOT/'src/engine.js').read_bytes()).hexdigest())
    markup=(ROOT/'src/template.html').read_text(encoding='utf-8')
    for key,code in [('ENGINE',engine),('APP',app)]:
        if '</script' in code.lower(): raise ValueError('Unerwartetes Script-Ende im Quelltext')
        h=base64.b64encode(hashlib.sha256(code.encode('utf-8')).digest()).decode('ascii')
        markup=markup.replace(key+'_HASH',h).replace(key+'_CODE',code)
    p=ROOT/'WIRBEL.html'
    if p.is_symlink(): raise ValueError('Verknuepfung nicht ueberschreiben')
    p.write_bytes(markup.encode('utf-8'))
    return p

def main():
    p=argparse.ArgumentParser();p.add_argument('--verify',action='store_true');p.add_argument('--open',action='store_true');a=p.parse_args()
    if a.verify: verify()
    target=build()
    print('BROWSER | '+str(target))
    if a.open and not webbrowser.open(target.as_uri()):print('Browser bitte selbst oeffnen: '+str(target))
if __name__=='__main__':
    if sys.version_info<(3,10):raise SystemExit('Python >= 3.10 benoetigt')
    try:main()
    except (ValueError,OSError) as error:raise SystemExit('STOP: '+str(error))
