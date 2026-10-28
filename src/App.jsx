import { useEffect } from 'react';
import { useRoute } from './lib/router.js';
import { TopBar, Footer } from './components/Shell.jsx';
import Home from './pages/Home.jsx';
import { Library, Concept } from './pages/Library.jsx';
import Prakriti from './pages/Prakriti.jsx';
import Vikriti from './pages/Vikriti.jsx';
import Consultant from './pages/Consultant.jsx';
import Results from './pages/Results.jsx';
import Safety from './pages/Safety.jsx';
import { conceptById } from './data/concepts.js';

const TITLES = {
  home: '',
  library: 'ספרייה',
  prakriti: 'שאלון חוקה',
  vikriti: 'איזון נוכחי',
  consultant: 'יועצת',
  results: 'התוצאות שלי',
  safety: 'בטיחות ומקורות',
};

function Page({ route }) {
  switch (route.page) {
    case 'library':
      return route.param ? <Concept id={route.param} /> : <Library />;
    case 'prakriti':
      return <Prakriti />;
    case 'vikriti':
      return <Vikriti />;
    case 'consultant':
      return <Consultant />;
    case 'results':
      return <Results />;
    case 'safety':
      return <Safety />;
    default:
      return <Home />;
  }
}

export default function App() {
  const route = useRoute();
  useEffect(() => {
    const sub = route.page === 'library' && route.param ? conceptById(route.param)?.term : TITLES[route.page];
    document.title = sub ? `${sub} · יועץ איורוודה` : 'יועץ איורוודה';
  }, [route.path]);

  return (
    <div className="app">
      <TopBar route={route} />
      <main>
        <div className="wrap" key={route.path}>
          <Page route={route} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
