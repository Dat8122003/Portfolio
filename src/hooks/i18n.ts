export type Lang = "vi" | "en";

export const dict = {
  vi: {
    name: "Ngô Lê Quang Đạt",

    nav: {
      about: "Giới thiệu",
      skills: "Kỹ năng",
      projects: "Dự án",
      contact: "Liên hệ",
    },

    aboutHeading: "Giới thiệu & Liên hệ",
    aboutTitle: "Giới thiệu",
    skillsTitle: "Kỹ năng",
    projectsTitle: "Dự án",
    contactTitle: "Liên hệ",

    catHardware: "Phần cứng",
    catProtocol: "Giao thức",
    catLanguage: "Ngôn ngữ",
    catFramework: "Framework",
    catTool: "Công cụ",
    catSoftware: "Phần mềm",

    profileProgram: "Chương trình",
    profileMajor: "Chuyên ngành",
    profileField: "Ngành",
    profileDepartment: "Khoa",
    profileUniversity: "Trường",
    programValue: "Cử nhân tài năng",
    majorValue: "Vật lý Tin học",
    fieldValue: "Vật lý học",
    departmentValue: "Vật lý - Vật lý Kỹ thuật",
    universityValue: "Trường ĐH Khoa học Tự nhiên - ĐHQG-HCM",

    contactPhone: "Điện thoại",
    contactEmail: "Email",
    contactGithub: "GitHub",
    phoneValue: "0327125737",
    emailValue: "ngolequangdat08122003@gmail.com",
    githubValue: "github.com/your-username",
    contactCv: "Tải CV",
    cvValue: "CV_NgoLeQuangDat.pdf",

    p1Title: "Website cửa hàng",
    p1Role: "Frontend · Backend · Responsive",
    p1Lines: [
      "Đăng ký / đăng nhập bằng JWT cho cả người dùng và quản trị.",
      "Trang quản lý cho admin với REST API sản phẩm.",
      "Quản lý sản phẩm, giỏ hàng và thanh toán cơ bản.",
      "Frontend React + TypeScript, Backend Node.js + Express.",
      "Dữ liệu lưu trữ trên MongoDB, giao diện responsive.",
    ],

    p2Title:
      "Bài thí nghiệm trực tuyến khảo sát nhiệt độ Curie của chất sắt từ",
    p2Role: "IoT · WebSocket · Thí nghiệm vật lý",
    p2Lines: [
      "ESP32 đọc tín hiệu cảm biến từ qua giao thức I2C.",
      "Gửi dữ liệu về server Node.js xử lý và lưu trữ.",
      "Server phát lại cho client qua WebSocket theo thời gian thực.",
      "Giao diện vẽ đồ thị Uc theo nhiệt độ T bằng Chart.js.",
      "Lưu phiên đo dưới dạng JSON, có thể tải về máy.",
      "Kết hợp IoT để điều khiển từ xa trong thí nghiệm vật lý.",
      "Triển khai trên VPS Linux.",
    ],

    demo: "Mở demo",
    docs: "Mở tài liệu",
    code: "Mã nguồn",
    demoImage: "Ảnh minh họa",
  },
  en: {
    name: "Ngo Le Quang Dat",

    nav: {
      about: "About",
      skills: "Skills",
      projects: "Projects",
      contact: "Contact",
    },

    aboutHeading: "About & Contact",
    aboutTitle: "About",
    skillsTitle: "Skills",
    projectsTitle: "Projects",
    contactTitle: "Contact",

    catHardware: "Hardware",
    catProtocol: "Protocols",
    catLanguage: "Languages",
    catFramework: "Frameworks",
    catTool: "Tools",
    catSoftware: "Software",

    profileProgram: "Program",
    profileMajor: "Major",
    profileField: "Field",
    profileDepartment: "Department",
    profileUniversity: "University",
    programValue: "Talent undergraduate program",
    majorValue: "Physics Computer Science",
    fieldValue: "Physics",
    departmentValue: "Physics · Engineering Physics",
    universityValue: "VNUHCM - University of Science",

    contactPhone: "Phone",
    contactEmail: "Email",
    contactGithub: "GitHub",
    phoneValue: "0327125737",
    emailValue: "ngolequangdat08122003@gmail.com",
    githubValue: "github.com/your-username",
    contactCv: "Download CV",
    cvValue: "CV_NgoLeQuangDat.pdf",

    p1Title: "E-commerce website",
    p1Role: "Frontend · Backend · Responsive",
    p1Lines: [
      "JWT-based registration and login for users and admin.",
      "Admin dashboard exposing a products REST API.",
      "Product management, cart and basic checkout flow.",
      "React + TypeScript frontend, Node.js + Express backend.",
      "MongoDB storage, fully responsive UI.",
    ],

    p2Title: "Online experiment: Curie temperature of ferromagnetic materials",
    p2Role: "IoT · WebSocket · Physics lab",
    p2Lines: [
      "ESP32 reads the magnetic sensor over the I2C protocol.",
      "Data is forwarded to a Node.js server for processing and storage.",
      "Server streams the data to the client over WebSocket in real time.",
      "UI plots a Uc vs T chart with Chart.js.",
      "Each session is saved as JSON and can be downloaded.",
      "IoT-based remote control integrated into the experiment.",
      "Deployed on a Linux VPS.",
    ],

    demo: "Open demo",
    docs: "Open docs",
    code: "Source code",
    demoImage: "Preview",
  },
} as const;

export type Dict = (typeof dict)["vi"] | (typeof dict)["en"];
