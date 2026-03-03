import { motion } from "framer-motion";

const Hero = () => {
  const item = [
    { key: "about", label: "Click to view About" },
    { key: "skills", label: "Click to view Skills" },
    { key: "projects", label: "Click to view Projects" },
    { key: "contact", label: "Click to view Contact" },
  ];
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center gap-y-6 ">
        <motion.h1
          className="text-8xl font-bold bg-gradient-to-l from-red-500 to-black bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            delay: 0.2,
            type: "spring",
            stiffness: 100,
          }}
        >
          Hi!
        </motion.h1>
        <div className="flex gap-x-4">
          {" "}
          {item.map((i, index) => (
            <a
              key={index}
              className="animate-bounce text-sm text-gray-400"
              href={`#${i.key}`}
            >
              {i.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
};

export default Hero;
