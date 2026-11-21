import { Link } from 'react-router-dom';
import { isInternal, isSafeHref } from '../utils/ebook';

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

function inline(text) {
  return text.split(TOKEN).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (m) {
      const [, label, href] = m;
      if (!isSafeHref(href)) return label;
      const cls = 'font-bold text-sky-brand underline underline-offset-2';
      return isInternal(href)
        ? <Link key={i} to={href} className={cls}>{label}</Link>
        : <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>;
    }
    return part;
  });
}

export default function RichText({ text, className = '' }) {
  return (
    <>
      {(text || '').split(/\n{2,}/).map((para, i) => (
        <p key={i} className={`whitespace-pre-line leading-relaxed ${className}`}>{inline(para)}</p>
      ))}
    </>
  );
}