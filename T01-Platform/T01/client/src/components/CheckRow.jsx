import { FiCheck } from 'react-icons/fi';

/** One row of the "Look 1" layout: bold text on the left, teal rounded checkbox on the right. */
export default function CheckRow({ children }) {
  return (
    <li className="flex items-center justify-between gap-6">
      <span className="font-bold text-navy-900 text-base md:text-lg">{children}</span>
      <span className="shrink-0 w-11 h-11 rounded-xl border-[3px] border-teal-brand bg-white/60 flex items-center justify-center text-teal-brand" aria-hidden="true">
        <FiCheck strokeWidth={3} />
      </span>
    </li>
  );
}
