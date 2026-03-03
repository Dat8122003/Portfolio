import "./App.css";
import About from "./component/About";
import Footer from "./component/Footer";
import Navbar from "./component/Header";
import Hero from "./component/Hero";
import Project from "./component/Project";
import Skill from "./component/Skill";

function App() {
  return (
    <>
      <Navbar />
      <Hero></Hero>
      <About></About>
      <Skill></Skill>
      <Project></Project>
      <Footer></Footer>
    </>
  );
}

export default App;
