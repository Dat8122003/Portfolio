const Navbar = () => (
  <nav className="sticky top-0 w-full z-10 bg-white">
    <div className="flex items-center justify-between">
      <span className="text-2xl font-bold bg-gradient-to-r from-black to-red-500 bg-clip-text text-transparent">
        Portfolio
      </span>
      <div className="hidden md:flex gap-x-4 font-medium">
        {["About", "Skills", "Projects", "Contact"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="hover:text-primary transition-colors"
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  </nav>
);
export default Navbar;
