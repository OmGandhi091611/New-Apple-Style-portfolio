import {
  SiteNav,
  Hero,
  About,
  Publications,
  Projects,
  Experience,
  Education,
  CV,
  Contact,
  Footer,
} from "#components";

const App = () => {
  return (
    <main className="min-h-dvh">
      <SiteNav />
      <Hero />
      <About />
      <Publications />
      <Projects />
      <Experience />
      <Education />
      <CV />
      <Contact />
      <Footer />
    </main>
  );
};

export default App;
