// Only YouTube and Vimeo can be embedded (matches the server's CSP frame-src).
export function videoEmbedUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'm.youtube.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/(embed|shorts)\/([\w-]{6,})/) || [])[2];
    if (id && /^[\w-]{6,}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    if (host === 'vimeo.com') { const m = u.pathname.match(/^\/(\d+)/); if (m) return `https://player.vimeo.com/video/${m[1]}`; }
  } catch { /* not a URL */ }
  return null;
}

export const isInternal = (href) => /^\/(?!\/)/.test(href);
export const isSafeHref = (href) => isInternal(href) || /^https?:\/\//i.test(href);

export const countTasks = (chapters) =>
  chapters.flatMap((c) => c.topics.flatMap((t) => t.blocks.filter((b) => b.type === 'task').map((b) => b._id)));
