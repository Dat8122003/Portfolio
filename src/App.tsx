import Header from "./component/Header";
import Hero from "./component/Hero";
import About from "./component/About";
import Skill from "./component/Skill";
import Projects from "./component/Projects";
import Footer from "./component/Footer";

const App = () => (
  <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
    <Header />
    <main>
      <Hero />
      <About />
      <Skill />
      <Projects />
    </main>
    <Footer />
  </div>
);

export default App;
