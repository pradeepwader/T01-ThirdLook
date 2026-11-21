import { useEffect, useState } from 'react';
import { contentAPI } from '../services/api';
import CheckRow from '../components/CheckRow';

const OFFERS = [
  'Chapter-wise guides you can read at your own pace',
  'Explanation videos for every topic',
  'Tasks you can tick off as you go',
  'Short activities and tests to practise what you learn',
];

export default function About() {
  const [about, setAbout] = useState('');
  useEffect(() => { contentAPI.get('home').then((r) => setAbout(r.data.data.about)).catch(() => {}); }, []);
  return (
    <div className="bg-peach">
      <div className="container-t01 py-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-navy-900">About T01</h1>

        <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 mt-8 mb-3">Who we are</h2>
        <p className="font-semibold text-navy-800 leading-relaxed">{about}</p>

        <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 mt-10 mb-4">What you get</h2>
        <ul className="space-y-4 max-w-xl">
          {OFFERS.map((o) => <CheckRow key={o}>{o}</CheckRow>)}
        </ul>

        <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 mt-10 mb-3">How it works</h2>
        <p className="font-semibold text-navy-800 leading-relaxed">
          Choose a guide, unlock it once, and read it online anytime. Prefer not to read right now? Watch the explanation videos instead.
        </p>
      </div>
    </div>
  );
}
