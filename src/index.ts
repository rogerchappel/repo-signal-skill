import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
export type Evidence = { file: string; line?: number; text: string };
export type RepoSignalMap = { name: string; audience: string[]; proofPoints: Evidence[]; riskAreas: Evidence[]; demoCommands: Evidence[]; followUpQuestions: string[]; filesScanned: string[] };
const wanted = ['README.md','package.json','CHANGELOG.md','docs','test','tests','src'];
export function scanRepo(repo: string): RepoSignalMap {
  const files = collectFiles(repo);
  const texts = files.map(file => ({ file, body: safeRead(repo, file) }));
  const pkg = texts.find(t => t.file === 'package.json');
  let name = repo.split('/').filter(Boolean).pop() ?? 'repository';
  if (pkg) { try { name = JSON.parse(pkg.body).name ?? name; } catch {} }
  const proofPoints = pickEvidence(texts, [/quickstart/i,/usage/i,/features?/i,/cli/i,/api/i,/test/i], 8);
  const riskAreas = pickEvidence(texts, [/limitation/i,/out of scope/i,/todo/i,/fixme/i,/risk/i,/safety/i], 8);
  const demoCommands = pickEvidence(texts, [/npm run/i,/node .*dist/i,/curl /i,/python /i,/smoke/i], 6);
  return { name, audience: inferAudience(texts), proofPoints, riskAreas, demoCommands, filesScanned: files, followUpQuestions: questions(proofPoints, riskAreas, demoCommands) };
}
function collectFiles(repo:string){ const out:string[]=[]; for (const item of wanted) { const full=join(repo,item); if(!existsSync(full)) continue; const st=lstatSync(full); if(st.isSymbolicLink()) continue; if(st.isFile()) out.push(item); if(st.isDirectory()) walk(repo, full, out); } return out.filter(f => !f.includes('node_modules')).sort(); }
function walk(root:string, dir:string, out:string[]){ for(const name of readdirSync(dir)){ const full=join(dir,name); const st=lstatSync(full); if(st.isSymbolicLink()) continue; if(st.isDirectory() && out.length < 80) walk(root, full, out); if(st.isFile() && /\.(md|json|ts|js|txt|yml|yaml)$/.test(name)) out.push(relative(root,full)); } }
function safeRead(root:string, file:string){ try { const resolvedRoot=realpathSync(root); const resolvedFile=realpathSync(join(root,file)); const pathFromRoot=relative(resolvedRoot,resolvedFile); if(pathFromRoot === '..' || pathFromRoot.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(pathFromRoot)) return ''; return readFileSync(resolvedFile,'utf8').slice(0,20000); } catch { return ''; } }
function pickEvidence(texts:{file:string;body:string}[], patterns:RegExp[], limit:number): Evidence[]{ const found:Evidence[]=[]; for(const t of texts){ const lines=t.body.split(/\r?\n/); lines.forEach((line,i)=>{ if(found.length<limit && patterns.some(p=>p.test(line))) found.push({file:t.file,line:i+1,text:line.trim().slice(0,180)}); }); } return found; }
function inferAudience(texts:{file:string;body:string}[]){ const joined=texts.map(t=>t.body).join(' ').toLowerCase(); const aud=[]; if(joined.includes('cli')) aud.push('CLI users'); if(joined.includes('agent')||joined.includes('skill')) aud.push('agent builders'); if(joined.includes('api')||joined.includes('library')) aud.push('library integrators'); return aud.length ? aud : ['maintainers']; }
function questions(proof:Evidence[], risks:Evidence[], demos:Evidence[]){ const q=[]; if(!proof.length) q.push('Which files prove the primary user value?'); if(!demos.length) q.push('Which command should a new user run first?'); if(!risks.length) q.push('What limitations or safety notes should launch material mention?'); q.push('Which claim needs one more file-backed citation before publishing?'); return q; }
export function signalMapToMarkdown(map: RepoSignalMap){ const ev=(items:Evidence[])=>items.length?items.map(e=>`- ${e.file}${e.line?`:${e.line}`:''} - ${e.text}`).join('\n'):'- None found'; return [`# Repo Signal Map: ${map.name}`,'', '## Audience', ...map.audience.map(a=>`- ${a}`), '', '## Proof Points', ev(map.proofPoints), '', '## Risk Areas', ev(map.riskAreas), '', '## Demo Commands', ev(map.demoCommands), '', '## Follow-up Questions', ...map.followUpQuestions.map(q=>`- ${q}`), '', '## Files Scanned', ...map.filesScanned.map(f=>`- ${f}`)].join('\n'); }
export function briefRepo(repo:string){ const map=scanRepo(repo); return { name: map.name, strongestProof: map.proofPoints.slice(0,3), primaryRisk: map.riskAreas[0], firstDemo: map.demoCommands[0], question: map.followUpQuestions[0] }; }
