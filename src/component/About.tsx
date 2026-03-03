const About = () => {
  const info = [
    { key: "Họ tên", value: "Ngô Lê Quang Đạt" },
    { key: "Chuyên ngành", value: "Vật lý tin học" },
    { key: "Ngành", value: "Vật lý học" },
    {
      key: "Trường",
      value: "Đại học Khoa học Tự nhiên, ĐHQG TP.HCM",
    },
    { key: "GPA", value: "7.83/10" },
  ];
  const contact = [
    { key: "Số điện thoại", value: "0327125737" },
    { key: "Email", value: "ngolequangdat08122003@gmail.com" },
  ];
  return (
    <>
      <div className="min-h-screen">
        <h2 className="text-4xl inline-block font-bold mb-8 bg-gradient-to-r from-black to-red-500 bg-clip-text text-transparent">
          Giới thiệu bản thân
        </h2>
        <div className="md:flex justify-center gap-8 md:text-lg text-start">
          <div
            id="about"
            className="p-4 shadow-lg rounded-lg scroll-mt-46 w-full md:w-1/2"
          >
            {" "}
            <p className="font-bold text-center text-2xl p-2">
              Thông tin cơ bản
            </p>
            {info.map((item, index) => (
              <p className="p-1" key={index}>
                <span className="font-bold"> {item.key}</span>: {item.value}
              </p>
            ))}
          </div>
          <div
            id="contact"
            className="p-4 mt-4 shadow-lg rounded-lg scroll-mt-50 w-full md:w-1/2"
          >
            {" "}
            <p className="font-bold text-center text-2xl p-2">
              Thông tin liên hệ
            </p>
            {contact.map((item, index) => (
              <p className="p-1" key={index}>
                <span className="font-bold"> {item.key}</span>: {item.value}
              </p>
            ))}
            <p className="p-1">
              <span className="font-bold ">Github</span>:{" "}
              <a href="https://github.com/datgf812-afk">
                https://github.com/datgf812-afk
              </a>
            </p>
            <a
              className="block text-center mt-4 text-blue-500 hover:underline"
              href="/CV_NgoLeQuangDat.pdf"
              download="CV_NgoLeQuangDat.pdf"
            >
              Tải xuống CV
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
export default About;
