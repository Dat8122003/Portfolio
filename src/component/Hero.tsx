import { motion } from "framer-motion";

const Hero = () => {
  const item = [
    { key: "about", label: "Nhấn để xem Giới thiệu" },
    { key: "skills", label: "Nhấn để xem Kỹ năng" },
    { key: "projects", label: "Nhấn để xem Project" },
    { key: "contact", label: "Nhấn để xem Liên hệ" },
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
