import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productAPI, libraryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import CheckRow from '../components/CheckRow';
import { inr, categoryLabel } from '../utils/format';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [outline, setOutline] = useState([]);
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    setP(null);
    productAPI.get(slug).then((r) => { setP(r.data.product); setOutline(r.data.outline || []); }).catch(() => setP(false));
  }, [slug]);

  useEffect(() => {
    if (!user || !p) return;
    libraryAPI.list().then((r) => setOwned(r.data.items.some((i) => i.product._id === p._id))).catch(() => {});
  }, [user, p]);

  if (p === null) return <Spinner full />;
  if (p === false) return <div className="container-t01 py-24 text-center">Product not found. <Link className="underline" to="/products">Back to products</Link></div>;

  // Click Buy Now -> Already registered? -> (Create account) -> Login -> Checkout
  const buy = () => {
    if (!user) {
      toast('Please log in or create an account to continue');
      return navigate('/login', { state: { from: `/checkout/${p.slug}` } });
    }
    navigate(`/checkout/${p.slug}`);
  };

  return (
    <div className="bg-peach">
      <div className="container-t01 py-12 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <Link to="/products" className="text-sm font-bold text-sky-brand">← Back to Explore</Link>
          <span className="badge bg-white/70 ml-3">{categoryLabel(p.category)}</span>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900 mt-4">{p.title}</h1>
          <p className="text-lg font-semibold text-navy-800/70 mt-2">{p.tagline}</p>

          {p.thumbnail && (
            <div className="mt-6 rounded-2xl overflow-hidden h-64 bg-white/50">
              <img src={p.thumbnail} alt={p.title} className="h-full w-full object-cover" />
            </div>
          )}

          {/* Heading + paragraph */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 mt-10 mb-3">About this product</h2>
          <p className="whitespace-pre-line font-semibold text-navy-800 leading-relaxed">{p.description}</p>

          {/* Checklist rows */}
          {p.features?.length > 0 && (
            <ul className="mt-8 space-y-4 max-w-xl">
              {p.features.map((f) => <CheckRow key={f}>{f}</CheckRow>)}
            </ul>
          )}

          {outline.length > 0 && (
            <>
              <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 mt-10 mb-3">Inside the e-book</h2>
              <ol className="space-y-3 font-semibold text-navy-800">
                {outline.map((c, i) => (
                  <li key={i}><span className="font-extrabold text-navy-900">Chapter {i + 1}: {c.title}</span>
                    <ul className="list-disc ml-6 font-semibold text-navy-800/80">{c.topics.map((t, j) => <li key={j}>{t}</li>)}</ul>
                  </li>
                ))}
              </ol>
            </>
          )}

          {/* Heading + paragraph */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 mt-10 mb-3">Who is this for?</h2>
          <p className="whitespace-pre-line font-semibold text-navy-800 leading-relaxed">
            {p.audience || 'Made for students and young people who want clear direction on their career, without confusion or guesswork.'}
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit card p-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold">{inr(p.price)}</span>
            {p.compareAtPrice > p.price && <span className="line-through text-navy-800/40">₹{p.compareAtPrice}</span>}
          </div>
          {owned ? (
            <Link to={p.deliveryType === 'ebook' ? `/read/${p.slug}` : '/dashboard'} className="btn-dark w-full mt-5">{p.deliveryType === 'ebook' ? 'Continue reading' : 'Already yours - open in dashboard'}</Link>
          ) : (
            <button onClick={buy} className="btn-primary w-full mt-5">{p.price === 0 ? 'Get it free' : 'Buy Now'}</button>
          )}
          <ul className="text-sm text-navy-800/70 mt-5 space-y-2">
            <li>✓ Instant access after payment</li>
            <li>✓ Pay via UPI, card or net banking</li>
            <li>✓ Secure payments by Cashfree</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
