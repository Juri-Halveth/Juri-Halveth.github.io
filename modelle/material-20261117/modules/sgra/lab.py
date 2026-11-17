#!/usr/bin/env python3
"""HALVETH Sgr A* laboratory v0.2. Standard library only; standalone.

Offline demos never become observed data. The fetch command downloads only
explicitly pinned public EHT files. compare refuses missing or changed data.
"""
from __future__ import annotations
import argparse
import base64
import re
import cmath
import csv
import hashlib
import io
import itertools
import json
import math
import os
from pathlib import Path
import statistics
import sys
import urllib.request
import webbrowser
from datetime import datetime, timezone
from physics import MODELS, make_ray_tables, visibility

ROOT = Path(__file__).resolve().parent
LIMIT = 3_000_000


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def blob_hash(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()


def atomic_write(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.is_symlink():
        raise ValueError(f'Will not overwrite symbolic link: {path}')
    temporary = path.with_name(path.name+'.tmp-'+os.urandom(6).hex())
    try:
        with temporary.open('xb') as f:
            f.write(data)
        os.replace(temporary,path)
    finally:
        temporary.unlink(missing_ok=True)


def record(event, details):
    """Local append-only convention, not tamper-proof or blockchain consensus."""
    folder = ROOT/'results'
    folder.mkdir(exist_ok=True)
    file = folder/'runs.jsonl'
    if file.is_symlink():
        raise ValueError('Refusing linked run journal')
    old = file.read_bytes() if file.exists() else b''
    previous = sha256(old)
    row = {'at_utc':datetime.now(timezone.utc).isoformat(),
           'event':event,'previous_file_sha256':previous,'details':details}
    line = json.dumps(row,ensure_ascii=False,sort_keys=True).encode()+b'\n'
    # This small standalone lab assumes one running writer, not concurrent use.
    atomic_write(file,old+line)


def verify_package():
    manifest = read_json(ROOT/'SHA256.json')
    for name, expected in manifest.items():
        relative = Path(name)
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('Unsafe package manifest path')
        path = ROOT/relative
        if not path.is_file() or path.is_symlink() or sha256(path.read_bytes()) != expected:
            raise ValueError(f'Package changed or missing: {name}')
    print(f'PAKET | {len(manifest)} Dateien stimmen mit SHA256.json ueberein')


def parse_eht(data: bytes) -> list[dict]:
    text = data.decode('utf-8-sig')
    lines = text.splitlines()
    required = '#time(UTC),T1,T2,U(lambda),V(lambda),Iamp(Jy),Iphase(d),Isigma(Jy)'
    if not lines or not lines[0].startswith('#SRC:SGRA,') or required not in lines[:5]:
        raise ValueError('Unknown EHT source/header/units; no guessed interpretation')
    records = []
    for i, cells in enumerate(csv.reader(x for x in lines if x and not x.startswith('#')),1):
        if len(cells)!=8:
            raise ValueError(f'CSV record {i}: expected 8 columns')
        t,a,b,u,v,amp,phase,sigma = cells
        values = [float(x) for x in (t,u,v,amp,phase,sigma)]
        if not all(map(math.isfinite,values)):
            raise ValueError(f'CSV record {i}: nonfinite value')
        t,u,v,amp,phase,sigma=values
        if sigma<=0 or amp<0 or not a.isalnum() or not b.isalnum() or a==b:
            raise ValueError(f'CSV record {i}: invalid observation')
        records.append({'time':t,'a':a,'b':b,'u':u,'v':v,
                        'amp':amp,'phase_deg':phase,'sigma':sigma})
    if not records:
        raise ValueError('Empty observation dataset')
    return records


def validate_download(data: bytes, spec: dict):
    if len(data)!=spec['bytes'] or blob_hash(data)!=spec['git_blob_sha1']:
        raise ValueError('EHT bytes do not match the pinned Git object; refusing comparison')
    return parse_eht(data)


def fetch_data():
    manifest = read_json(ROOT/'EHT_MANIFEST.json')
    provenance = []
    for spec in manifest['files']:
        target = ROOT/'data'/spec['name']
        url = ('https://raw.githubusercontent.com/'+manifest['repository']+'/'
               +manifest['commit']+'/'+spec['path'])
        if target.is_symlink():
            raise ValueError('Refusing linked data file')
        if target.exists():
            data = target.read_bytes()
            rows = validate_download(data,spec)
            action='CACHE_GEPRUEFT'
        else:
            request=urllib.request.Request(url,headers={'User-Agent':'HALVETH-SgrA-Lab/0.2'})
            with urllib.request.urlopen(request,timeout=45) as response:
                # No credentials are supplied; allow only GitHub's raw host.
                from urllib.parse import urlparse
                if urlparse(response.geturl()).hostname!='raw.githubusercontent.com':
                    raise ValueError('Unexpected download redirect')
                data=response.read(LIMIT+1)
            if len(data)>LIMIT:
                raise ValueError('Download exceeds allowed size')
            rows=validate_download(data,spec)
            atomic_write(target,data)
            action='HERUNTERGELADEN'
        info={'file':spec['name'],'sha256':sha256(data),'rows':len(rows),'url':url}
        provenance.append(info)
        print(f'EHT | {action} | {spec["name"]} | {len(rows)} Datenzeilen')
    atomic_write(ROOT/'data'/'provenance.json',json.dumps(provenance,indent=2).encode())
    record('EHT_DATA_FETCHED',provenance)


def wrapped_degrees(angle):
    return math.degrees(math.atan2(math.sin(angle),math.cos(angle)))


def closure_residuals(rows,model,cfg):
    """Simultaneous triangles, only baseline SNR>=3. Not independent samples.

    Identical CSV timestamps only; never mix nearby but distinct source times.
    No temporal averaging and no automatic gain calibration.
    """
    groups={}
    for row in rows:
        if row['amp']/row['sigma'] < 3:
            continue
        key=(row['a'],row['b'])
        groups.setdefault(row['time'],{})[key]=row
    residuals=[]
    for edges in groups.values():
        stations=sorted({a for edge in edges for a in edge})
        def pair(a,b):
            if (a,b) in edges:
                row=edges[a,b]
                sign=1
            elif (b,a) in edges:
                row=edges[b,a]
                sign=-1
            else:
                return None
            measured=cmath.rect(row['amp'],sign*math.radians(row['phase_deg']))
            predicted=visibility(model,sign*row['u'],sign*row['v'],cfg)
            return measured,predicted
        for a,b,c in itertools.combinations(stations,3):
            z=[pair(a,b),pair(b,c),pair(c,a)]
            if any(item is None for item in z):
                continue
            measured=z[0][0]*z[1][0]*z[2][0]
            predicted=z[0][1]*z[1][1]*z[2][1]
            if abs(predicted)<1e-12:
                continue  # phase is undefined at a visibility null
            residuals.append(abs(wrapped_degrees(cmath.phase(measured)-cmath.phase(predicted))))
    return residuals


def compare_data():
    """Fixed-parameter forward comparison only. No selection of 'true model'."""
    manifest=read_json(ROOT/'EHT_MANIFEST.json')
    cfg=read_json(ROOT/'experiment.json')
    output={'status':'FIXED_PARAMETER_DIAGNOSTIC_NOT_PHYSICAL_INFERENCE',
      'parameters':cfg,'datasets':[],
      'limitations':[
       'No parameter optimization or model evidence. Lower residual is not proof.',
       'No station-gain fitting, temporal source model, scattering model or polarization.',
       'Amplitudes alone do not determine an image; closures here are descriptive.',
       'Triangles share baselines and are correlated; no chi-square significance reported.',
       'Four geometric brightness candidates, not four self-consistent matter theories.',
       'Ellis/Schwarzschild visual sky experiments are deliberately NOT fitted to radio data.']}
    for spec in manifest['files']:
        file=ROOT/'data'/spec['name']
        if not file.is_file():
            raise ValueError('EHT data missing. Run: python -B lab.py fetch')
        data=file.read_bytes()
        rows=validate_download(data,spec)
        dataset={'file':spec['name'],'sha256':sha256(data),'n':len(rows),'models':{}}
        export=io.StringIO(newline='')
        writer=csv.writer(export)
        writer.writerow(['time_utc_hours','T1','T2','u_lambda','v_lambda','measured_amp_normalized',
                         'thermal_sigma_normalized']+[m+'_predicted_amp' for m in MODELS])
        all_predictions={m:[] for m in MODELS}
        for row in rows:
            pred=[abs(visibility(m,row['u'],row['v'],cfg)) for m in MODELS]
            writer.writerow([row['time'],row['a'],row['b'],row['u'],row['v'],row['amp'],row['sigma']]+pred)
            for m,p in zip(MODELS,pred):
                all_predictions[m].append(abs(row['amp']-p))
        for model in MODELS:
            errs=all_predictions[model]
            closures=closure_residuals(rows,model,cfg)
            dataset['models'][model]={'amplitude_abs_residual_mean':statistics.mean(errs),
              'amplitude_abs_residual_median':statistics.median(errs),
              'closure_triangles_snr_ge_3':len(closures),
              'closure_abs_residual_median_deg':statistics.median(closures) if closures else None}
        output['datasets'].append(dataset)
        atomic_write(ROOT/'results'/(spec['name']+'.predictions.csv'),export.getvalue().encode())
    atomic_write(ROOT/'results'/'DATA_COMPARISON.json',json.dumps(output,indent=2).encode())
    record('FIXED_PARAMETER_DATA_COMPARISON',{'datasets':len(output['datasets']),
       'config_sha256':sha256((ROOT/'experiment.json').read_bytes())})
    print('DATENVERGLEICH | fertig | results/DATA_COMPARISON.json')
    print('KEIN IDENTITAETSNACHWEIS | Keine automatische Aussage: Schwarzes Loch / Wurmloch / Fusionsknoten')


def build_demo(open_browser=False):
    tables=make_ray_tables()
    params=read_json(ROOT/'experiment.json')
    template=(ROOT/'web'/'template.html').read_text(encoding='utf-8')
    js=(ROOT/'web'/'app.js').read_text(encoding='utf-8')
    injected='const RAY_TABLES='+json.dumps(tables,separators=(',',':'))+';\n'
    injected+='const RADIO_PARAMS='+json.dumps(params,separators=(',',':'))+';\n'
    html=template.replace('/*__APP__*/',injected+js)
    for tag,marker in [('script','__SCRIPT_HASH__'),('style','__STYLE_HASH__')]:
        block=re.search('<'+tag+'>(.*?)</'+tag+'>',html,re.S).group(1)
        digest=base64.b64encode(hashlib.sha256(block.encode()).digest()).decode()
        html=html.replace(marker,digest)
    target=ROOT/'results'/'index.html'
    atomic_write(target,html.encode('utf-8'))
    record('SYNTHETIC_DEMO_GENERATED',{'file_sha256':sha256(html.encode()),
                                    'ray_grid_per_observer':len(tables['ellis']['8']['b']),
                                    'data_used':'none'})
    print('SIMULATION | results/index.html | SYNTHETISCH, keine Sgr-A-Aufnahme')
    print(target)
    if open_browser:
        webbrowser.open(target.as_uri())


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['verify','demo','fetch','compare'])
    parser.add_argument('--open',action='store_true')
    args=parser.parse_args()
    try:
        if args.action=='verify': verify_package()
        elif args.action=='demo': build_demo(args.open)
        elif args.action=='fetch': fetch_data()
        elif args.action=='compare': compare_data()
    except Exception as exc:
        print(f'STOP | {type(exc).__name__}: {exc}',file=sys.stderr)
        return 1
    return 0

if __name__=='__main__':
    sys.exit(main())
