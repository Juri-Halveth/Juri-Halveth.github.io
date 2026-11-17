"""Small, explicit forward models. No inference about the nature of Sgr A*.

Units for rays: Ellis throat a=1 or Schwarzschild critical impact b_c=1.
Radio models: sky-plane coordinates in microarcseconds, baseline in wavelengths.
Only Python's standard library is required.
"""
from __future__ import annotations
import cmath
import math
from typing import Callable

TAU = 2.0 * math.pi
UAS = math.pi / (180.0 * 3600.0 * 1e6)


def integrate(f: Callable[[float], float], lo: float, hi: float,
              tol: float = 1e-9, depth: int = 22) -> float:
    """Adaptive Simpson quadrature, failing rather than hiding non-convergence."""
    if hi == lo:
        return 0.0
    if hi < lo:
        return -integrate(f, hi, lo, tol, depth)
    a, b = lo, hi
    m = (a + b) / 2
    fa, fm, fb = f(a), f(m), f(b)
    whole = (b-a)*(fa+4*fm+fb)/6
    def step(a, b, fa, fm, fb, whole, eps, level):
        m = (a+b)/2
        fl, fr = f((a+m)/2), f((m+b)/2)
        left = (m-a)*(fa+4*fl+fm)/6
        right = (b-m)*(fm+4*fr+fb)/6
        delta = left+right-whole
        if abs(delta) <= 15*eps:
            return left+right+delta/15
        if level <= 0:
            raise ArithmeticError('quadrature did not converge')
        return (step(a,m,fa,fl,fm,left,eps/2,level-1)
                +step(m,b,fm,fr,fb,right,eps/2,level-1))
    result = step(a,b,fa,fm,fb,whole,tol,depth)
    if not math.isfinite(result):
        raise ArithmeticError('non-finite quadrature')
    return result


def elliptic_k(m: float) -> float:
    """Complete elliptic integral K(m), parameter m, via AGM."""
    if not 0 <= m < 1:
        raise ValueError('K requires 0 <= m < 1')
    a, b = 1.0, math.sqrt(1-m)
    for _ in range(40):
        a, b = (a+b)/2, math.sqrt(a*b)
        if abs(a-b) < 2e-15*a:
            return math.pi/(2*a)
    raise ArithmeticError('AGM did not converge')


def elliptic_f(phi: float, m: float) -> float:
    if not (0 <= m < 1 and 0 <= phi <= math.pi/2):
        raise ValueError('invalid incomplete elliptic integral parameters')
    return integrate(lambda t: 1/math.sqrt(1-m*math.sin(t)**2), 0, phi)


def trace_ellis(b: float, observer: float = 8.0) -> dict:
    """Null-geodesic angular integral for ds²=-dt²+dl²+(l²+1)dOmega².

    A static observer at l=observer sends a backward ray initially inward.
    b<1 -> other asymptotic region. b>1 -> same region. b=1 -> critical orbit.
    The returned direction labels a source boundary at infinity, not a wall.
    """
    if not all(map(math.isfinite, (b, observer))) or b < 0 or observer <= 0:
        raise ValueError('invalid ray inputs')
    if b >= math.sqrt(observer*observer+1):
        raise ValueError('ray not initially inward at this observer')
    if b == 1:
        return {'side':'critical','phi':None}
    if b < 1:
        m = b*b
        phi = b*(2*elliptic_k(m)-elliptic_f(math.atan(1/observer),m))
        return {'side':'other','phi':phi}
    m = 1/(b*b)
    turning = math.sqrt(b*b-1)
    phi = elliptic_k(m)+elliptic_f(math.acos(turning/observer),m)
    return {'side':'same','phi':phi}


def trace_schwarzschild(b: float, observer: float = 8.0) -> dict:
    """Background-only Schwarzschild null geodesics, b_critical=1.

    No emitting gas, no Kerr spin, no plasma, no local observer frequency shift.
    Angular maps are physical for this stated metric; textures are arbitrary.
    """
    M = 1/(3*math.sqrt(3))
    if not all(map(math.isfinite,(b,observer))) or b < 0 or observer <= 3*M:
        raise ValueError('invalid ray inputs')
    maximum = observer/math.sqrt(1-2*M/observer)
    if b >= maximum:
        raise ValueError('ray not initially inward at this observer')
    if b == 1:
        return {'side':'critical','phi':None}
    if b < 1:
        return {'side':'captured','phi':None}
    lo, hi = 3*M, b
    for _ in range(70):
        r = (lo+hi)/2
        if r*r*r/(r-2*M) < b*b:
            lo = r
        else:
            hi = r
    r = (lo+hi)/2
    C = 2*M/(r-2*M)
    def kernel(t):
        x = 1-t*t
        return 2*b/r/math.sqrt(1+x-C*x*x)
    phi = integrate(kernel,0,1)+integrate(kernel,0,math.sqrt(1-r/observer))
    return {'side':'same','phi':phi}


def ray_grid(maximum: float = 3.2) -> list[float]:
    # Extra samples on both sides of the unstable orbit. Never interpolate
    # through its divergent angle. Finite resolution cannot resolve all images.
    values = [maximum*i/1000 for i in range(1001)]
    values += [2*i/1000 for i in range(1001)]
    values += [1+s*10**(-5+4*i/160) for s in (-1,1) for i in range(161)]
    return sorted(set(x for x in values if abs(x-1)>1e-12))


def make_ray_tables() -> dict:
    tables = {}
    for name, tracer in [('ellis',trace_ellis),('schwarzschild',trace_schwarzschild)]:
        tables[name] = {}
        for observer in (4.0,8.0,16.0):
            grid = ray_grid(max(3.2,observer*.75))
            tables[name][str(int(observer))] = {
                'b':grid, 'phi':[tracer(b,observer)['phi'] for b in grid]}
    return tables


def bessel_j0(x: float) -> float:
    """Convergent defining series, restricted to the range used by this lab."""
    if not math.isfinite(x) or abs(x) > 20:
        raise ValueError('J0 argument outside verified interval [-20,20]')
    terms, term = [1.0], 1.0
    for k in range(1,160):
        term *= -(x*x/4)/(k*k)
        terms.append(term)
        if k > abs(x) and abs(term)<1e-16:
            return math.fsum(terms)
    raise ArithmeticError('Bessel series did not converge')


DEFAULTS = {'flux':1.0, 'radius_uas':26.0, 'width_uas':6.0,
            'center_width_uas':20.0, 'center_fraction':0.2,
            'rotation_deg':15.0, 'weights':[0.4,0.35,0.25]}
MODELS = ('ring','three_nodes','filled_center','ring_plus_center')


def visibility(model: str, u: float, v: float, cfg: dict | None = None) -> complex:
    """Fourier-domain forward prediction; NOT an astrophysical fit.

    Ring: continuous thin ring convolved with a circular Gaussian.
    Three nodes: three circular Gaussians at an equilateral arrangement.
    Widths are Gaussian sigma, not FWHM. Values are assumed, not estimated.
    """
    p = {**DEFAULTS, **(cfg or {})}
    vals = (u,v,p['flux'],p['radius_uas'],p['width_uas'],
            p['center_width_uas'],p['center_fraction'],p['rotation_deg'])
    if not all(math.isfinite(float(x)) for x in vals):
        raise ValueError('non-finite model parameters')
    if min(p['flux'],p['radius_uas'],p['width_uas'],p['center_width_uas']) < 0:
        raise ValueError('negative model size or flux')
    if not 0<=p['center_fraction']<=1:
        raise ValueError('center_fraction outside [0,1]')
    weights = p['weights']
    if len(weights)!=3 or any(not math.isfinite(w) or w<0 for w in weights) or sum(weights)<=0:
        raise ValueError('three non-negative weights required')
    q = math.hypot(u,v)
    envelope = math.exp(-2*math.pi**2*(p['width_uas']*UAS*q)**2)
    center = math.exp(-2*math.pi**2*(p['center_width_uas']*UAS*q)**2)
    if model=='filled_center':
        return complex(p['flux']*center)
    if model=='three_nodes':
        rotation = math.radians(p['rotation_deg'])
        result = 0j
        for i,w in enumerate(weights):
            angle = rotation+TAU*i/3
            x,y = p['radius_uas']*UAS*math.cos(angle),p['radius_uas']*UAS*math.sin(angle)
            result += w/sum(weights)*cmath.exp(-1j*TAU*(u*x+v*y))
        return p['flux']*envelope*result
    if model not in ('ring','ring_plus_center'):
        raise ValueError('unknown brightness model')
    ring = bessel_j0(TAU*p['radius_uas']*UAS*q)*envelope
    f = p['center_fraction'] if model=='ring_plus_center' else 0
    return complex(p['flux']*((1-f)*ring+f*center))
