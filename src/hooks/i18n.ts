export type Lang = "vi" | "en";

export const dict = {
  vi: {
    name: "Ngô Lê Quang Ð?t",

    nav: {
      about: "Gi?i thi?u",
      skills: "K? nang",
      projects: "D? án",
      contact: "Liên h?",
    },

    aboutHeading: "Gi?i thi?u & Liên h?",
    aboutTitle: "Gi?i thi?u",
    skillsTitle: "K? nang",
    projectsTitle: "D? án",
    contactTitle: "Liên h?",

    catHardware: "Ph?n c?ng",
    catProtocol: "Giao th?c",
    catLanguage: "Ngôn ng?",
    catFramework: "Framework",
    catTool: "Công c?",
    catSoftware: "Ph?n m?m",

    profileProgram: "Chuong trình",
    profileMajor: "Chuyên ngành",
    profileField: "Ngành",
    profileDepartment: "Khoa",
    profileUniversity: "Tru?ng",
    programValue: "C? nhân tài nang",
    majorValue: "V?t lý Tin h?c",
    fieldValue: "V?t lý h?c",
    departmentValue: "V?t lý - V?t lý K? thu?t",
    universityValue:
      "Tru?ng ÐH Khoa h?c T? nhiên\u00A0-\u00A0ÐHQG-HCM",

    contactPhone: "Ði?n tho?i",
    contactEmail: "Email",
    contactGithub: "GitHub",
    contactCv: "T?i CV",
    phoneValue: "0327125737",
    emailValue: "ngolequangdat08122003@gmail.com",
    githubValue: "github.com/your-username",
    cvValue: "CV_NgoLeQuangDat.pdf",

    p1Title: "Website c?a hàng",
    p1Role: "Frontend · Backend · Responsive",
    p1Lines: [
      "Ðang ký / dang nh?p b?ng JWT cho c? ngu?i dùng và qu?n tr?.",
      "Trang qu?n lý cho admin v?i REST API s?n ph?m.",
      "Qu?n lý s?n ph?m, gi? hàng và thanh toán co b?n.",
      "Frontend React + TypeScript, Backend Node.js + Express.",
      "D? li?u luu trên MongoDB, giao di?n responsive.",
    ],

    p2Title:
      "Bài thí nghi?m tr?c tuy?n kh?o sát nhi?t d? Curie c?a ch?t s?t t?",
    p2Role: "IoT · WebSocket · Thí nghi?m v?t lý",
    p2Lines: [
      "ESP32 d?c tín hi?u c?m bi?n t? qua giao th?c I2C.",
      "G?i d? li?u v? server Node.js x? lý và luu tr?.",
      "Server phát l?i cho client qua WebSocket theo th?i gian th?c.",
      "Giao di?n v? d? th? Uc theo nhi?t d? T b?ng Chart.js.",
      "Luu phiên do du?i d?ng JSON, có th? t?i v? máy.",
      "K?t h?p IoT d? di?u khi?n t? xa trong thí nghi?m v?t lý.",
      "Tri?n khai trên VPS Linux.",
    ],

    demo: "M? demo",
    docs: "M? tài li?u",
    code: "Mã ngu?n",
    demoImage: "?nh minh ho?",
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
    departmentValue: "Physics — Engineering Physics",
    universityValue: "VNUHCM - University of Science",

    contactPhone: "Phone",
    contactEmail: "Email",
    contactGithub: "GitHub",
    contactCv: "Download CV",
    phoneValue: "0327125737",
    emailValue: "ngolequangdat08122003@gmail.com",
    githubValue: "github.com/your-username",
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