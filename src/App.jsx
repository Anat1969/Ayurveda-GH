import { useEffect } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { useRoute } from './lib/router.js';
import { TopBar, Footer } from './components/Shell.jsx';
import Home from './pages/Home.jsx';
import { Library, Concept } from './pages/Library.jsx';
import Prakriti from './pages/Prakriti.jsx';
import Vikriti from './pages/Vikriti.jsx';
import Consultant from './pages/Consultant.jsx';
import Results from './pages/Results.jsx';
import Safety from './pages/Safety.jsx';
import Journey from './pages/Journey.jsx';
import Maps from './pages/Maps.jsx';
import { conceptById } from './data/concepts.js';

const TITLES = {
  home: '',
  journey: 'המסע',
  maps: 'מפות',
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
    case 'journey':
      return <Journey />;
    case 'maps':
      return <Maps />;
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

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

export default function App() {
  const route = useRoute();
  const reduce = useReducedMotion();
  useEffect(() => {
    const sub = route.page === 'library' && route.param ? conceptById(route.param)?.term : TITLES[route.page];
    document.title = sub ? `${sub} · יועץ איורוודה` : 'יועץ איורוודה';
  }, [route.path]);

  return (
    <div className="app">
      <TopBar route={route} />
      <ScrollProgress />
      <main>
        <motion.div
          className="wrap" key={route.path}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Page route={route} />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
