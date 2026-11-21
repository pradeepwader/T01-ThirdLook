import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import { errMsg } from '../../utils/format';

const TYPES = [
  ['heading', 'Sub-heading'], ['text', 'Explanation (long text)'], ['video', 'Video (YouTube / Vimeo link)'],
  ['task', 'Task to tick off'], ['activity', 'Short activity'], ['link', 'Link / button'], ['quiz', 'Quick test (question)'],
];
const blank = (type) => ({ type, text: '', url: '', options: type === 'quiz' ? ['', ''] : [], correct: 0, explanation: '' });
const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a; };

const Mini = ({ onClick, children, danger }) => (
  <button type="button" onClick={onClick} className={`text-xs font-bold px-2 py-1 rounded ${danger ? 'text-red-600 hover:bg-red-50' : 'text-sky-brand hover:bg-sky-soft'}`}>{children}</button>
);

function BlockEditor({ b, set }) {
  const f = (k) => ({ value: b[k] ?? '', onChange: (e) => set({ ...b, [k]: e.target.value }) });
  if (b.type === 'video') return <div className="space-y-2"><input className="input" placeholder="https://www.youtube.com/watch?v=..." {...f('url')} /><input className="input" placeholder="Caption (optional)" {...f('text')} /></div>;
  if (b.type === 'link') return <div className="grid sm:grid-cols-2 gap-2"><input className="input" placeholder="Button text" {...f('text')} /><input className="input" placeholder="https://... or /products/some-slug" {...f('url')} /></div>;
  if (b.type === 'quiz') {
    return (
      <div className="space-y-2">
        <input className="input" placeholder="Question" {...f('text')} />
        {b.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name={`c-${b._id || b.tmp}`} checked={b.correct === i} onChange={() => set({ ...b, correct: i })} title="Correct answer" />
            <input className="input" placeholder={`Answer ${i + 1}`} value={o} onChange={(e) => set({ ...b, options: b.options.map((x, j) => (j === i ? e.target.value : x)) })} />
            {b.options.length > 2 && <Mini danger onClick={() => set({ ...b, options: b.options.filter((_, j) => j !== i), correct: 0 })}>✕</Mini>}
          </div>
        ))}
        {b.options.length < 6 && <Mini onClick={() => set({ ...b, options: [...b.options, ''] })}>+ answer</Mini>}
        <input className="input" placeholder="Explanation shown after answering (optional)" {...f('explanation')} />
      </div>
    );
  }
  const tall = b.type === 'text' || b.type === 'activity';
  return tall
    ? <textarea className="input" rows={b.type === 'text' ? 7 : 3} placeholder={b.type === 'text' ? 'Write the explanation. Blank line = new paragraph. **bold**, [link text](https://...) or [link](/products/slug)' : 'What should the reader do?'} {...f('text')} />
    : <input className="input" placeholder={b.type === 'task' ? 'e.g. Write down 3 roles you like' : 'Heading'} {...f('text')} />;
}

export default function ContentBuilder() {
  const { id } = useParams();
  const [meta, setMeta] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    adminAPI.getContent(id).then((r) => { setMeta(r.data); setChapters(r.data.chapters); }).catch((e) => toast.error(errMsg(e)));
  }, [id]);
  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!meta) return <Spinner />;
  const upd = (fn) => { setChapters(fn); setDirty(true); };
  const setCh = (ci, v) => upd((cs) => cs.map((c, i) => (i === ci ? v : c)));
  const setTp = (ci, ti, v) => setCh(ci, { ...chapters[ci], topics: chapters[ci].topics.map((t, i) => (i === ti ? v : t)) });

  const save = async () => {
    setBusy(true);
    try { const { data } = await adminAPI.saveProductContent(id, chapters); setChapters(data.chapters); setDirty(false); toast.success('Content saved'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-16 z-10 bg-cream py-3">
        <div><Link to="/admin/products" className="text-sm font-bold text-sky-brand">← Products</Link><h2 className="text-xl font-extrabold">Content: {meta.title}</h2></div>
        <div className="flex gap-3">
          <Link to={`/read/${meta.slug}`} target="_blank" className="btn-outline-dark">Preview</Link>
          <button className="btn-primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving...' : dirty ? 'Save content' : 'Saved'}</button>
        </div>
      </div>
      <p className="text-sm text-navy-800/70">Save before you press Preview. Existing readers keep their ticked tasks when you edit text.</p>

      {chapters.map((c, ci) => (
        <section key={c._id || `n${ci}`} className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm">Chapter {ci + 1}</span>
            <input className="input" placeholder="Chapter title" value={c.title} onChange={(e) => setCh(ci, { ...c, title: e.target.value })} />
            <Mini onClick={() => upd((cs) => move(cs, ci, -1))}>↑</Mini><Mini onClick={() => upd((cs) => move(cs, ci, 1))}>↓</Mini>
            <Mini danger onClick={() => window.confirm('Delete this chapter?') && upd((cs) => cs.filter((_, i) => i !== ci))}>Delete</Mini>
          </div>
          <input className="input" placeholder="Short summary (optional)" value={c.summary || ''} onChange={(e) => setCh(ci, { ...c, summary: e.target.value })} />

          {c.topics.map((t, ti) => (
            <div key={t._id || `n${ti}`} className="rounded-xl bg-peach/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Topic {ti + 1}</span>
                <input className="input" placeholder="Topic title" value={t.title} onChange={(e) => setTp(ci, ti, { ...t, title: e.target.value })} />
                <Mini onClick={() => setCh(ci, { ...c, topics: move(c.topics, ti, -1) })}>↑</Mini><Mini onClick={() => setCh(ci, { ...c, topics: move(c.topics, ti, 1) })}>↓</Mini>
                <Mini danger onClick={() => window.confirm('Delete this topic?') && setCh(ci, { ...c, topics: c.topics.filter((_, i) => i !== ti) })}>Delete</Mini>
              </div>

              {t.blocks.map((b, bi) => (
                <div key={b._id || `n${bi}`} className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-teal-brand">{TYPES.find(([k]) => k === b.type)?.[1]}</span>
                    <span><Mini onClick={() => setTp(ci, ti, { ...t, blocks: move(t.blocks, bi, -1) })}>↑</Mini><Mini onClick={() => setTp(ci, ti, { ...t, blocks: move(t.blocks, bi, 1) })}>↓</Mini><Mini danger onClick={() => setTp(ci, ti, { ...t, blocks: t.blocks.filter((_, i) => i !== bi) })}>✕</Mini></span>
                  </div>
                  <BlockEditor b={b} set={(nb) => setTp(ci, ti, { ...t, blocks: t.blocks.map((x, i) => (i === bi ? nb : x)) })} />
                </div>
              ))}
              <select className="input !w-auto" value="" onChange={(e) => e.target.value && setTp(ci, ti, { ...t, blocks: [...t.blocks, { ...blank(e.target.value), tmp: Date.now() }] })}>
                <option value="">+ Add to this topic...</option>
                {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          ))}
          <Mini onClick={() => setCh(ci, { ...c, topics: [...c.topics, { title: '', blocks: [] }] })}>+ Add topic</Mini>
        </section>
      ))}
      <button className="btn-dark" onClick={() => upd((cs) => [...cs, { title: '', summary: '', topics: [] }])}>+ Add chapter</button>
    </div>
  );
}