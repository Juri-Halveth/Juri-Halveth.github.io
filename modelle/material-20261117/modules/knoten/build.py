from pathlib import Path
import hashlib,re
module=Path(__file__).resolve().parent
names=('material-engine.js','material-model.js','material-view.js')
# Two explicit distribution layouts: complete local RC and additive public site.
layouts=(('local-shared',module.parents[3]/'shared'),('public-assets',module.parents[1]/'assets'))
matches=[(name,folder)for name,folder in layouts if all((folder/n).is_file()for n in names)]
if not matches:raise RuntimeError('Material source layout missing; no source files were overwritten')
layout,shared=matches[0]
raw={name:(shared/name).read_bytes()for name in names}
actual=hashlib.sha256(raw[names[0]]).hexdigest()
binding=re.search(rb"const SOURCE_HASH='([0-9a-f]{64})'",raw[names[1]])
if not binding or binding.group(1).decode()!=actual:raise RuntimeError('Material engine/model source binding differs; candidate not written')
read=lambda p:p.read_bytes().decode('utf-8')
parts={"ENGINE":raw[names[0]].decode('utf-8'),"MODEL":raw[names[1]].decode('utf-8'),"VIEW":raw[names[2]].decode('utf-8'),"SHIM":read(module/'src/render-compat.js'),"APP":read(module/'src/app.js'),"SHA":actual}
text=read(module/'src/template.html')
for key,value in parts.items():text=text.replace('__'+key+'__',value)
candidate=text.encode('utf-8')
if any(value not in candidate for value in raw.values()):raise RuntimeError('Exact material source section missing; candidate not written')
(module/'KNOTEN.html').write_bytes(candidate)
print('Rebuilt standalone:',layout,'exact source SHA256',actual)
