import { motion } from "framer-motion";

const Skill = () => {
  const skills = [
    {
      category: "Programming Languages",
      items: ["Java", "JavaScript (ES6+)", "C++", "HTML5", "CSS3"],
    },
    {
      category: "Backend & System Integration",
      items: [
        "Spring Boot (Java)",
        "Node.js (Express)",
        "RESTful API",
        "Authentication (JWT, Bcrypt)",
      ],
    },
    {
      category: "Frontend & UI Libraries",
      items: [
        "ReactJS",
        "Tailwind CSS",
        "Bootstrap",
        "jQuery",
        "Responsive Design",
      ],
    },
    {
      category: "Database & Data Handling",
      items: ["MySQL", "MongoDB (NoSQL)", "JSON Data Handling"],
    },
    {
      category: "Tools & Version Control",
      items: ["GitHub", "VS Code", "IntelliJ IDEA"],
    },
    {
      category: "Soft Skills",
      items: ["Problem Solving", "Team Collaboration"],
    },
  ];
  return (
    <div id="skills" className="w-full min-h-screen scroll-mt-20">
      <h2 className="text-4xl inline-block font-bold mb-8 pb-2 bg-gradient-to-r from-black to-red-500 bg-clip-text text-transparent">
        Skills
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {skills.map((skill, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            key={index}
            className="shadow-lg p-4 rounded-xl"
          >
            <h3 className="text-xl mb-4 font-bold">{skill.category}</h3>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {skill.items.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs border text-white bg-black p-2 rounded-full font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default Skill;
