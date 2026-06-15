// Cấu hình
import CONFIG from './config.js';

// Hàm helper
function showToast(message, duration = CONFIG.toastDuration) {
    const toast = document.createElement('div');
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#2c3e50',
        color: '#ecf0f1',
        padding: '10px 20px',
        borderRadius: '6px',
        zIndex: '1000',
        fontSize: '14px'
    });
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), duration);
}

// Hàm xử lý logout
function handleLogout() {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
}

// Initial authentication logic
document.addEventListener("DOMContentLoaded", function () {
  const authForm = document.getElementById("authForm");
  const message = document.getElementById("message");
  const toggleLink = document.getElementById("toggleLink");
  const togglePrefix = document.getElementById("togglePrefix");
  const formTitle = document.getElementById("formTitle");
  const changePasswordLink = document.getElementById("changePasswordLink");
  const changePasswordPopup = document.getElementById("changePasswordPopup");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const closeChangePasswordPopup = document.getElementById("closeChangePasswordPopup");
  const captchaContainer = document.getElementById("captchaContainer");
  const refreshCaptcha = document.getElementById("refreshCaptcha");

  // Hiển thị CAPTCHA chỉ khi ở chế độ đăng ký
  if (formTitle && formTitle.textContent.trim() === "Đăng ký") {
    captchaContainer.style.display = "flex";
    fetchCaptcha();
  } else {
    captchaContainer.style.display = "none";
  }

  // Hàm lấy CAPTCHA từ server
  function fetchCaptcha() {
    fetch('/captcha')
      .then(res => res.json())
      .then(data => {
        console.log("Dữ liệu CAPTCHA từ server:", data);
        const captchaElement = document.getElementById('captchaQuestion');
        if (!data.question) {
          console.error("Lỗi: CAPTCHA rỗng!");
          captchaElement.textContent = "Không thể tải CAPTCHA!";
        } else {
          captchaElement.textContent = data.question;
          // Lưu giá trị đúng vào localStorage để so sánh khi đăng ký
          localStorage.setItem("captchaAnswer", data.answer);
        }
      })
      .catch(error => console.error("Lỗi tải CAPTCHA:", error));
  }

  // Xử lý nút làm mới CAPTCHA (nút refresh icon)
  if (refreshCaptcha) {
    refreshCaptcha.addEventListener("click", function (e) {
      e.preventDefault();
      fetchCaptcha();
    });
  }

  // Toggle giữa đăng nhập và đăng ký
  if (toggleLink) {
    toggleLink.addEventListener("click", function (e) {
      e.preventDefault();
      if (!formTitle) return;

      const currentMode = formTitle.textContent.trim();
      if (currentMode === "Đăng nhập") {
        // Chuyển sang trạng thái đăng ký
        formTitle.textContent = "Đăng ký";
        const submitBtn = authForm.querySelector("#submitBtn");
        if (submitBtn) submitBtn.textContent = "Đăng ký";
        if (togglePrefix) togglePrefix.textContent = "Đã có tài khoản?";
        toggleLink.textContent = "Quay lại đăng nhập";
        if (captchaContainer) captchaContainer.style.display = "flex";
        fetchCaptcha();
      } else {
        // Chuyển sang trạng thái đăng nhập
        formTitle.textContent = "Đăng nhập";
        const submitBtn = authForm.querySelector("#submitBtn");
        if (submitBtn) submitBtn.textContent = "Đăng nhập";
        if (togglePrefix) togglePrefix.textContent = "Chưa có tài khoản?";
        toggleLink.textContent = "Đăng ký";
        if (captchaContainer) captchaContainer.style.display = "none";
        const captchaQuestion = document.getElementById('captchaQuestion');
        if (captchaQuestion) captchaQuestion.textContent = '';
      }
      console.log("Chuyển đổi trạng thái:", formTitle.textContent);
    });
  }


    // Xử lý đăng nhập/đăng ký
	if (authForm) {
		authForm.addEventListener("submit", async function (e) {
			e.preventDefault();
		console.log("Sự kiện đăng ký đã được kích hoạt!"); // Kiểm tra xem sự kiện có chạy không

		if (formTitle && formTitle.textContent === "Đăng ký") {
			const captchaAnswerElement = document.getElementById("captchaAnswer");
			const captchaAnswer = captchaAnswerElement ? captchaAnswerElement.value.trim() : "";
		if (!captchaAnswer || captchaAnswer !== localStorage.getItem("captchaAnswer")) {
			alert("Xác thực CAPTCHA thất bại!");
			return;
		}
		}
        const usernameElement = document.getElementById("username");
        const passwordElement = document.getElementById("password");
        const username = usernameElement ? usernameElement.value.trim() : "";
        const password = passwordElement ? passwordElement.value.trim() : "";
        const isRegister = formTitle && formTitle.textContent === "Đăng ký";

        if (!username || !password) {
            if (message) message.textContent = "Vui lòng nhập đầy đủ thông tin!";
            return;
        }

        try {
            console.log(`Sending request to ${CONFIG.apiUrl}/${isRegister ? "register" : "login"}: `, { username, password });
			const captchaAnswerElement = document.getElementById("captchaAnswer");
			const requestData = {
			username: username,
			password: password,
			captchaAnswer: captchaAnswerElement ? captchaAnswerElement.value.trim() : "",
			captchaStored: localStorage.getItem("captchaAnswer") // Gửi CAPTCHA lưu từ client lên server
			};

			console.log("Dữ liệu gửi lên server:", requestData);
          const response = await fetch(`${CONFIG.apiUrl}/${isRegister ? "register" : "login"}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestData) // Đảm bảo CAPTCHA được gửi lên server
		  });

            const data = await response.json();
            console.log("Response from server: ", data);

            if (data.success) {
                if (!isRegister) {
                    localStorage.setItem("username", username);
                    localStorage.setItem("role", data.role || "viewer");
                    localStorage.setItem("token", data.token);

                    window.location.href = "/index.html";

                    const ws = new WebSocket(CONFIG.wsUrl);
                    ws.onopen = () => {
                        ws.send(JSON.stringify({ 
                            action: "setUsername", 
                            username,
                            role: data.role || "viewer"
                        }));
                        setTimeout(() => ws.close(), 1000);
                    };
                    ws.onerror = () => {
                        console.error("WebSocket connection failed");
                    };
                } else {
                    message.textContent = "Đăng ký thành công! Vui lòng đăng nhập.";
                    const ws = new WebSocket(CONFIG.wsUrl);
                    ws.onopen = () => {
                        ws.send(JSON.stringify({ 
                            action: "registerSuccess",
                            username: username
                        }));
                        setTimeout(() => ws.close(), 1000);
                    };
                    ws.onerror = (error) => {
                        console.error("WebSocket notification error:", error);
                    };
                }
            } else {
                if (message) message.textContent = data.message || "Đăng nhập/Đăng ký thất bại!";
            }
        } catch (err) {
            if (message) message.textContent = "Lỗi kết nối!";
            console.error("Login/Register error:", err);
        }
    });
	}

    // Hiển thị popup đổi mật khẩu
    if (changePasswordLink) {
        changePasswordLink.addEventListener("click", function (e) {
            e.preventDefault();
            if (changePasswordPopup) changePasswordPopup.style.display = "flex";
        });
    }

    // Đóng popup đổi mật khẩu
    if (closeChangePasswordPopup) {
        closeChangePasswordPopup.addEventListener("click", function () {
            if (changePasswordPopup) changePasswordPopup.style.display = "none";
        });
    }

    // Xử lý đổi mật khẩu
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const changeUsernameElement = document.getElementById("changeUsername");
        const oldPasswordElement = document.getElementById("oldPassword");
        const newPasswordElement = document.getElementById("newPassword");
        const confirmPasswordElement = document.getElementById("confirmPassword");

        const username = changeUsernameElement ? changeUsernameElement.value.trim() : "";
        const oldPassword = oldPasswordElement ? oldPasswordElement.value.trim() : "";
        const newPassword = newPasswordElement ? newPasswordElement.value.trim() : "";
        const confirmPassword = confirmPasswordElement ? confirmPasswordElement.value.trim() : "";

        if (!username || !oldPassword || !newPassword || !confirmPassword) {
            if (message) message.textContent = "Vui lòng nhập đầy đủ thông tin!";
            return;
        }

        if (newPassword !== confirmPassword) {
            if (message) message.textContent = "Mật khẩu mới và xác nhận không khớp!";
            return;
        }

        try {
            const requestData = { username, oldPassword, newPassword };
            console.log("Sending request to /changePassword: ", requestData);

            const response = await fetch(`${CONFIG.apiUrl}/changePassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error("Lỗi server: " + (text || "Không có phản hồi chi tiết"));
            }

            const data = await response.json();
            console.log("Response from server: ", data);

            if (data.success) {
                if (message) message.textContent = "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.";
                if (changePasswordPopup) changePasswordPopup.style.display = "none";
                if (changeUsernameElement) changeUsernameElement.value = "";
                if (oldPasswordElement) oldPasswordElement.value = "";
                if (newPasswordElement) newPasswordElement.value = "";
                if (confirmPasswordElement) confirmPasswordElement.value = "";
            } else {
                if (message) message.textContent = data.message || "Đổi mật khẩu thất bại!";
            }
        } catch (err) {
            if (message) message.textContent = "Lỗi: " + err.message;
            console.error("Change password error:", err);
        }
        });
    }
});
