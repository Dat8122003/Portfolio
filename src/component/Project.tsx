import { motion } from "framer-motion";

const Project = () => {
  const projects = [
    {
      name: "Real-time Auction Platform",
      description: [
        "Developed a live bidding system handling concurrent requests using pessimistic locking.",
        "Implemented real-time price updates and synchronized timers via WebSockets (SockJS/STOMP).",
        "Secured RESTful API and managed multi-role access using Spring Security & JWT.",
      ],
      img: "https://iili.io/qqZaBOg.png",
      technologies: [
        "ReactJS",
        "Spring Boot",
        "WebSockets",
        "MySQL",
        "Tailwind",
      ],
      links: {
        demo: "https://auction-frontend-kappa-rose.vercel.app",
        githubFE: "https://github.com/datgf812-afk/auction-frontend",
        githubBE: "https://github.com/datgf812-afk/auction-backend",
      },
    },
    {
      name: "Hobby Store E-commerce",
      description: [
        "Built a full-featured e-commerce site with an Admin Dashboard for CRUD inventory management.",
        "Implemented auto-decrease stock logic on purchase and real-time order status tracking.",
        "Managed Authentication & Authorization using JWT and Bcrypt.",
      ],
      img: "https://iili.io/qqPrCpj.png",
      technologies: ["ReactJS", "Node.js", "MongoDB", "Express", "Bootstrap"],
      links: {
        demo: "https://shop-vray.vercel.app",
        githubFE: "https://github.com/datgf812-afk/shop-frontend",
        githubBE: "https://github.com/datgf812-afk/shop-backend",
      },
    },
  ];
  return (
    <div
      id="projects"
      className="min-h-screen mt-16 md:mt-auto flex flex-col items-center justify-center gap-y-6 scroll-mt-6"
    >
      <h2 className="text-4xl font-bold bg-gradient-to-r from-black to-red-500 bg-clip-text text-transparent">
        Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start ">
        {projects.map((project, index) => (
          <motion.div
            whileHover={{
              scale: 1.01,
              transition: { duration: 0.2 },
            }}
            key={index}
            className=" p-4 rounded-xl shadow-lg"
          >
            <img
              src={project.img}
              alt={project.name}
              className="w-full h-48 object-cover mb-3 rounded"
            />
            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
            <ul className="text-gray-600 mb-6 text-sm list-disc pl-5 space-y-2 text-left leading-relaxed">
              {project.description.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 mb-3 justify-center items-center">
              {project.technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="text-xs border text-white bg-black px-2 py-1 rounded-full font-bold"
                >
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex gap-x-4 justify-center items-center text-sm">
              <a
                href={project.links.githubFE}
                className="text-blue-500 hover:underline"
              >
                Link Github Frontend
              </a>

              <a
                href={project.links.githubBE}
                className="text-blue-500 hover:underline"
              >
                Link Github Backend
              </a>
            </div>
            <a
              href={project.links.demo}
              className="border-2 mt-2 px-2 py-1 rounded-xl font-bold hover:bg-gray-200 transition-colors block w-full text-center"
            >
              Click to view demo
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default Project;
