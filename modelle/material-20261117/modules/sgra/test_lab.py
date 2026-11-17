import cmath
import contextlib
import io
import json
import math
from pathlib import Path
import random
import tempfile
import unittest
from unittest import mock
import physics as p
import lab

class RayTests(unittest.TestCase):
    def test_adaptive_integral_known_polynomial(self):
        self.assertAlmostEqual(p.integrate(lambda x:x**4,0,1),.2,places=10)
    def test_integral_reversed_and_zero(self):
        self.assertAlmostEqual(p.integrate(math.sin,math.pi,0),-2,places=9)
        self.assertEqual(p.integrate(math.sin,1,1),0)
    def test_agm_elliptic_anchor(self):
        self.assertAlmostEqual(p.elliptic_k(0),math.pi/2,places=14)
        self.assertAlmostEqual(p.elliptic_k(.5),1.8540746773013719,places=13)
    def test_elliptic_incomplete_zero_parameter(self):
        self.assertAlmostEqual(p.elliptic_f(.7,0),.7,places=13)
    def test_ellis_radial_ray(self):
        self.assertEqual(p.trace_ellis(0),{'side':'other','phi':0.0})
    def test_critical_not_silently_regularized(self):
        for f in (p.trace_ellis,p.trace_schwarzschild):
            self.assertEqual(f(1),{'side':'critical','phi':None})
    def test_two_models_differ_inside_same_normalized_boundary(self):
        self.assertEqual(p.trace_ellis(.7)['side'],'other')
        self.assertEqual(p.trace_schwarzschild(.7)['side'],'captured')
    def test_seeded_ray_domains(self):
        rng=random.Random(20261116)
        for _ in range(300):
            b=rng.uniform(0,3.2)
            for f in (p.trace_ellis,p.trace_schwarzschild):
                r=f(b)
                if r['phi'] is not None:self.assertTrue(math.isfinite(r['phi']) and r['phi']>=0)
                if b>1:self.assertEqual(r['side'],'same')
    def test_ellis_angle_grows_near_throat_orbit(self):
        values=[p.trace_ellis(b)['phi'] for b in (.8,.9,.99,.999)]
        self.assertEqual(values,sorted(values))
    def test_weak_ellis_limit(self):
        b,o=100,10000
        phi=p.trace_ellis(b,o)['phi']
        flat=math.pi-math.asin(b/math.sqrt(o*o+1))
        self.assertLess(abs((phi-flat)-math.pi/(4*b*b)),2e-7)
    def test_invalid_input_rejected(self):
        for f in (p.trace_ellis,p.trace_schwarzschild):
            for b in (-1,float('nan'),float('inf'),100):
                with self.assertRaises(ValueError):f(b)
    def test_bessel_known_values(self):
        self.assertEqual(p.bessel_j0(0),1)
        self.assertAlmostEqual(p.bessel_j0(2.404825557695773),0,places=13)
        self.assertAlmostEqual(p.bessel_j0(5),-.1775967713143383,places=13)
    def test_flux_at_zero_baseline(self):
        for model in p.MODELS:self.assertEqual(p.visibility(model,0,0),1+0j)
    def test_hermitian_and_visibility_bound(self):
        rng=random.Random(17)
        for model in p.MODELS:
            for _ in range(200):
                u,v=(rng.uniform(-9e9,9e9) for _ in range(2))
                z=p.visibility(model,u,v)
                self.assertLessEqual(abs(z),1+1e-8)
                self.assertLess(abs(z.conjugate()-p.visibility(model,-u,-v)),1e-12)
    def test_translation_does_not_change_amplitude_or_closure(self):
        uv=[(2e9,1e9),(-1e9,4e9),(-1e9,-5e9)]
        values=[p.visibility('three_nodes',u,v) for u,v in uv]
        shifted=[z*cmath.exp(-2j*math.pi*(u*8*p.UAS+v*-3*p.UAS)) for z,(u,v) in zip(values,uv)]
        for a,b in zip(values,shifted):self.assertAlmostEqual(abs(a),abs(b),places=14)
        self.assertLess(abs(math.prod(values)-math.prod(shifted)),1e-13)
    def test_parameter_validation(self):
        for cfg in ({'width_uas':-1},{'flux':float('nan')},{'weights':[1,2]}, {'center_fraction':2}):
            with self.assertRaises(ValueError):p.visibility('ring',0,0,cfg)
    def test_mixture_limits(self):
        for u,v in [(0,0),(1e9,3e9)]:
            self.assertEqual(p.visibility('ring_plus_center',u,v,{'center_fraction':0}),p.visibility('ring',u,v))
            self.assertEqual(p.visibility('ring_plus_center',u,v,{'center_fraction':1}),p.visibility('filled_center',u,v))

class DataSafetyTests(unittest.TestCase):
    def test_actual_eht_excerpt_schema(self):
        raw=(lab.ROOT/'fixtures/eht_besttime_excerpt.csv').read_bytes()
        rows=lab.parse_eht(raw)
        self.assertEqual(len(rows),5)
        self.assertEqual(rows[0]['a'],'AA')
        self.assertAlmostEqual(rows[0]['amp'],.03995702)
    def test_wrong_units_refused(self):
        raw=(lab.ROOT/'fixtures/eht_besttime_excerpt.csv').read_bytes()
        with self.assertRaises(ValueError):lab.parse_eht(raw.replace(b'U(lambda)',b'U(km)'))
    def test_nan_rejected(self):
        raw=(lab.ROOT/'fixtures/eht_besttime_excerpt.csv').read_bytes()
        with self.assertRaises(ValueError):lab.parse_eht(raw.replace(b'0.03995702',b'nan'))
    def test_tamper_detection(self):
        raw=(lab.ROOT/'fixtures/eht_besttime_excerpt.csv').read_bytes()
        spec={'bytes':len(raw),'git_blob_sha1':lab.blob_hash(raw)}
        self.assertEqual(len(lab.validate_download(raw,spec)),5)
        with self.assertRaises(ValueError):lab.validate_download(raw.replace(b'0.03995702',b'0.13995702'),spec)
    def test_missing_data_is_not_synthetic_fallback(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/'EHT_MANIFEST.json').write_bytes((lab.ROOT/'EHT_MANIFEST.json').read_bytes())
            (root/'experiment.json').write_bytes((lab.ROOT/'experiment.json').read_bytes())
            with mock.patch.object(lab,'ROOT',root):
                with self.assertRaisesRegex(ValueError,'missing'):lab.compare_data()
    def test_closure_from_matching_synthetic_model(self):
        rows=[]
        for a,b,u,v in [('AA','BB',1e9,2e9),('BB','CC',3e9,-1e9),('CC','AA',-4e9,-1e9)]:
            z=p.visibility('three_nodes',u,v)
            rows.append({'time':1.0,'a':a,'b':b,'u':u,'v':v,'amp':abs(z),
                         'sigma':.0001,'phase_deg':math.degrees(cmath.phase(z))})
        residuals=lab.closure_residuals(rows,'three_nodes',{})
        self.assertEqual(len(residuals),1)
        self.assertLess(residuals[0],1e-10)
    def test_closure_refuses_to_mix_source_times(self):
        rows=[]
        for i,(a,b,u,v) in enumerate([('AA','BB',1e9,2e9),('BB','CC',3e9,-1e9),('CC','AA',-4e9,-1e9)]):
            z=p.visibility('three_nodes',u,v)
            rows.append({'time':1+i*.01,'a':a,'b':b,'u':u,'v':v,'amp':abs(z),
                         'sigma':.0001,'phase_deg':math.degrees(cmath.phase(z))})
        self.assertEqual(lab.closure_residuals(rows,'three_nodes',{}),[])
    def test_synthetic_end_to_end_comparison_is_not_inference(self):
        cfg=p.DEFAULTS.copy()
        lines=['#SRC:SGRA,DATE(MJD):57850,FREQ:227.0707GHz',
               '#time(UTC),T1,T2,U(lambda),V(lambda),Iamp(Jy),Iphase(d),Isigma(Jy)']
        for a,b,u,v in [('AA','BB',1e9,2e9),('BB','CC',3e9,-1e9),('CC','AA',-4e9,-1e9)]:
            z=p.visibility('three_nodes',u,v,cfg)
            lines.append(f'1,{a},{b},{u},{v},{abs(z):.17g},{math.degrees(cmath.phase(z)):.17g},0.0001')
        raw=('\n'.join(lines)+'\n').encode()
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'data').mkdir()
            spec={'name':'synthetic.csv','bytes':len(raw),'git_blob_sha1':lab.blob_hash(raw)}
            (root/'data/synthetic.csv').write_bytes(raw)
            (root/'EHT_MANIFEST.json').write_text(json.dumps({'files':[spec]}))
            (root/'experiment.json').write_text(json.dumps(cfg))
            with mock.patch.object(lab,'ROOT',root),contextlib.redirect_stdout(io.StringIO()):lab.compare_data()
            out=json.loads((root/'results/DATA_COMPARISON.json').read_text())
            self.assertEqual(out['status'],'FIXED_PARAMETER_DIAGNOSTIC_NOT_PHYSICAL_INFERENCE')
            model=out['datasets'][0]['models']['three_nodes']
            self.assertLess(model['amplitude_abs_residual_mean'],1e-14)
            self.assertLess(model['closure_abs_residual_median_deg'],1e-10)
            self.assertNotIn('winner',out)
    def test_fetch_rejects_unexpected_redirect(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/'EHT_MANIFEST.json').write_bytes((lab.ROOT/'EHT_MANIFEST.json').read_bytes())
            fake=mock.MagicMock()
            fake.__enter__.return_value.geturl.return_value='https://example.invalid/data.csv'
            with mock.patch.object(lab,'ROOT',root),mock.patch('urllib.request.urlopen',return_value=fake):
                with self.assertRaisesRegex(ValueError,'redirect'):lab.fetch_data()
            self.assertFalse((root/'data').exists())

    def test_text_only_frontend_and_offline_scope(self):
        js=(lab.ROOT/'web/app.js').read_text()
        for unwanted in ('innerHTML','eval(','fetch(','XMLHttpRequest','localStorage'):
            self.assertNotIn(unwanted,js)
    def test_atomic_write_replaces_without_leftover(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'test.json'
            lab.atomic_write(f,b'first');lab.atomic_write(f,b'second')
            self.assertEqual(f.read_bytes(),b'second')
            self.assertEqual(len(list(Path(d).iterdir())),1)

if __name__=='__main__':unittest.main(verbosity=2)
