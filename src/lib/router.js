import { useEffect, useState } from 'react';

// ניתוב לפי hash, כך ש"העתקת קישור" מעתיקה את הדף והנושא המדויקים.
const parse = () => {
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  const parts = path.split('/').filter(Boolean);
  return { path, page: parts[0] || 'home', param: parts[1] || null };
};

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path) => {
  location.hash = path;
};
