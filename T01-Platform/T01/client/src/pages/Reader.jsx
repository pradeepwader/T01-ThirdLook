import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheck, FiMenu, FiChevronLeft, FiChevronRight, FiExternalLink } from 'react-icons/fi';
import { libraryAPI } from '../services/api';
import Spinner from '../components/Spinner';
import RichText from '../components/RichText';
import { videoEmbedUrl, isInternal, countTasks } from '../utils/ebook';
import { errMsg } from '../utils/format';

const Box = ({ done, onClick, label }) => (
  <button type="button" onClick={onClick} aria-pressed={done} aria-label={label}
    className={`shrink-0 w-11 h-11 rounded-xl border-[3px] border-teal-brand flex items-center justify-center transition ${done ? 'bg-teal-brand text-white' : 'bg-white/60 text-transparent hover:text-teal-brand/40'}`}>
    <FiCheck strokeWidth={3} />
  </button>
);

function Quiz({ block, onAnswer }) {
  const a = block.answer;
  return (
    <div className="rounded-2xl bg-white/70 p-5">
      <p className="text-xs font-extrabold uppercase tracking-wide text-teal-brand mb-1">Quick test</p>
      <p className="font-extrabold text-navy-900 mb-3">{block.text}</p>
      <div className="space-y-2">
        {block.options.map((o, i) => {
          const isRight = a && i === a.correctIndex;
          const isWrong = a && i === a.choice && !a.correct;
          return (
            <button key={i} type="button" disabled={!!a && a.correct} onClick={() => onAnswer(block._id, i)}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 font-semibold text-sm transition ${isRight ? 'border-green-600 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : 'border-navy-800/15 bg-white hover:border-teal-brand'}`}>
              {o}
            </button>
          );
        })}
      </div>
      {a && <p className={`mt-3 text-sm font-bold ${a.correct ? 'text-green-700' : 'text-red-600'}`}>{a.correct ? 'Correct!' : 'Not quite - try again.'} {a.explanation && <span className="font-semibold text-navy-800">{a.explanation}</span>}</p>}
    </div>
  );
}

function Block({ b, done, onTask, onAnswer }) {
  switch (b.type) {
    case 'heading': return <h3 className="text-2xl font-extrabold text-navy-900 mt-8 mb-2">{b.text}</h3>;
    case 'text': return <div className="space-y-4 font-semibold text-navy-800"><RichText text={b.text} /></div>;
    case 'video': {
      const src = videoEmbedUrl(b.url);
      return (
        <figure>
          {src ? (
            <div className="aspect-video rounded-2xl overflow-hidden bg-navy-900">
              <iframe src={src} title={b.text || 'Explanation video'} className="w-full h-full" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          ) : <a href={b.url} target="_blank" rel="noopener noreferrer" className="btn-dark">Watch video <FiExternalLink /></a>}
          {b.text && <figcaption className="text-sm font-semibold text-navy-800/70 mt-2">{b.text}</figcaption>}
        </figure>
      );
    }
    case 'task':
      return (
        <div className="flex items-center justify-between gap-6 max-w-xl">
          <span className={`font-bold text-navy-900 ${done ? 'line-through opacity-60' : ''}`}>{b.text}</span>
          <Box done={done} onClick={() => onTask(b._id, !done)} label={`Mark task: ${b.text}`} />
        </div>
      );
    case 'activity':
      return (
        <div className="rounded-2xl border-2 border-dashed border-teal-brand p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-teal-brand mb-1">Short activity</p>
          <div className="space-y-3 font-semibold text-navy-800"><RichText text={b.text} /></div>
        </div>
      );
    case 'link':
      return isInternal(b.url)
        ? <Link to={b.url} className="btn-dark">{b.text || b.url}</Link>
        : <a href={b.url} target="_blank" rel="noopener noreferrer" className="btn-dark">{b.text || b.url} <FiExternalLink /></a>;
    case 'quiz': return <Quiz block={b} onAnswer={onAnswer} />;
    default: return null;
  }
}

/** The purchased product: a web page (chapters > topics) the buyer reads, watches and ticks off. */
export default function Reader() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState(new Set());
  const [pos, setPos] = useState(0); // index into the flat list of topics
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    libraryAPI.read(slug)
      .then((r) => { setData(r.data); setTasks(new Set(r.data.progress.tasks)); })
      .catch((err) => {
        toast.error(errMsg(err, 'Could not open this product'));
        navigate(err?.response?.status === 403 ? `/products/${slug}` : '/dashboard', { replace: true });
      });
  }, [slug, navigate]);

  const flat = useMemo(() => (data ? data.chapters.flatMap((c, ci) => c.topics.map((t) => ({ ...t, chapter: c, ci }))) : []), [data]);
  const allTasks = useMemo(() => (data ? countTasks(data.chapters) : []), [data]);

  if (!data) return <Spinner full />;
  if (flat.length === 0) return <div className="container-t01 py-24 text-center">This product has no content yet. <Link className="underline" to="/dashboard">Back</Link></div>;

  const topic = flat[Math.min(pos, flat.length - 1)];
  const doneCount = allTasks.filter((id) => tasks.has(id)).length;
  const pct = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;
  const go = (i) => { setPos(i); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const onTask = async (blockId, done) => {
    const next = new Set(tasks); done ? next.add(blockId) : next.delete(blockId);
    setTasks(next); // optimistic
    try { await libraryAPI.setTask(slug, blockId, done); } catch (err) { setTasks(tasks); toast.error(errMsg(err, 'Could not save')); }
  };
  const onAnswer = async (blockId, choice) => {
    try {
      const { data: r } = await libraryAPI.answerQuiz(slug, blockId, choice);
      setData((d) => ({ ...d, chapters: d.chapters.map((c) => ({ ...c, topics: c.topics.map((t) => ({ ...t, blocks: t.blocks.map((b) => (b._id === blockId ? { ...b, answer: r.answer } : b)) })) })) }));
    } catch (err) { toast.error(errMsg(err, 'Could not check the answer')); }
  };

  const toc = (
    <nav aria-label="Table of contents" className="space-y-5">
      {data.chapters.map((c, ci) => (
        <div key={c._id}>
          <p className="text-xs font-extrabold uppercase tracking-wide text-navy-800/60">Chapter {ci + 1}</p>
          <p className="font-extrabold text-navy-900 mb-1">{c.title}</p>
          <ul className="space-y-1">
            {flat.map((t, i) => t.chapter._id === c._id && (
              <li key={t._id}><button onClick={() => go(i)} className={`w-full text-left text-sm font-semibold rounded-lg px-3 py-2 ${i === pos ? 'bg-navy-800 text-white' : 'hover:bg-white/70'}`}>{t.title}</button></li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="bg-peach min-h-screen">
      <div className="container-t01 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <Link to="/dashboard" className="text-sm font-bold text-sky-brand">← My products</Link>
            <h1 className="text-2xl md:text-4xl font-extrabold text-navy-900 truncate">{data.product.title}</h1>
            {data.preview && <span className="badge bg-amber/40 mt-1">Admin preview</span>}
          </div>
          <button className="lg:hidden btn-dark !px-4" onClick={() => setMenu(!menu)} aria-label="Contents"><FiMenu /></button>
        </div>

        {allTasks.length > 0 && (
          <div className="mb-8 max-w-xl">
            <div className="flex justify-between text-sm font-bold mb-1"><span>Your progress</span><span>{doneCount}/{allTasks.length} tasks · {pct}%</span></div>
            <div className="h-3 rounded-full bg-white/70 overflow-hidden"><div className="h-full bg-teal-brand transition-all" style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          <aside className={`${menu ? 'block' : 'hidden'} lg:block lg:sticky lg:top-24 h-fit max-h-[80vh] overflow-y-auto rounded-2xl bg-white/50 p-4`}>{toc}</aside>

          <article className="min-w-0 max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-wide text-teal-brand">{topic.chapter.title}</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy-900 mt-1 mb-6">{topic.title}</h2>
            <div className="space-y-6">
              {topic.blocks.map((b) => <Block key={b._id} b={b} done={tasks.has(b._id)} onTask={onTask} onAnswer={onAnswer} />)}
            </div>
            <div className="flex justify-between mt-12">
              <button className="btn-outline-dark" disabled={pos === 0} onClick={() => go(pos - 1)}><FiChevronLeft /> Previous</button>
              <button className="btn-dark" disabled={pos >= flat.length - 1} onClick={() => go(pos + 1)}>Next <FiChevronRight /></button>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}