// ===== IMPORT CÁC MODULE CẦN THIẾT =====
import CONFIG from './config.js';
import { showToast, debounce, PerformanceMonitor } from './utils.js';

// ===== KHAI BÁO BIẾN TOÀN CỤC =====
let websocket, myChart;
let heaterDataMap = new Map();      // Lưu dữ liệu thô khi gia nhiệt
let fanDataMap = new Map();         // Lưu dữ liệu thô khi làm mát
let heaterDisplayMap = new Map();   // Dữ liệu hiển thị đồ thị gia nhiệt
let fanDisplayMap = new Map();      // Dữ liệu hiển thị đồ thị làm mát
let isCameraOn = false;             // Trạng thái camera
let isExportPopupOpen = false;      // Trạng thái popup xuất dữ liệu
let autoScaleEnabled = true;        // Bật/tắt auto-scaling (debug)
let cameraInitialized = false;     // Trạng thái khởi tạo camera
let cameraInitializing = false;    // Đang trong quá trình khởi tạo

// ===== HÀM TIỆN ÍCH =====
function formatTimestamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Debug function - gọi từ console để test
window.toggleAutoScale = function() {
    autoScaleEnabled = !autoScaleEnabled;
    console.log('Auto-scaling:', autoScaleEnabled ? 'ENABLED' : 'DISABLED');
    if (!autoScaleEnabled) {
        console.log('Chart will keep current scale. Call updateChart() to refresh.');
    }
    return autoScaleEnabled;
};

// ===== XỬ LÝ ĐỒ THỊ =====
// Cập nhật đồ thị với tối ưu debouncing (chờ 100ms trước khi vẽ lại)
const updateChart = debounce(() => {
    if (!myChart) return;

    PerformanceMonitor.start('updateChart');

    // Chuẩn bị dữ liệu đường gia nhiệt (màu đỏ)
    const tangData = [];
    heaterDisplayMap.forEach((i, uc) => {
        tangData.push({ x: parseFloat(uc), y: parseFloat(i) });
    });

    // Chuẩn bị dữ liệu đường làm mát (màu xanh)
    const giamData = [];
    fanDisplayMap.forEach((i, uc) => {
        giamData.push({ x: parseFloat(uc), y: parseFloat(i) });
    });

    // Cập nhật dữ liệu cho đồ thị
    myChart.data.datasets[0].data = tangData;
    myChart.data.datasets[1].data = giamData;

    // Tự động điều chỉnh cả trục X và Y để hiển thị tất cả dữ liệu
    const allUc = [...tangData, ...giamData].map(d => d.x);
    const allI = [...tangData, ...giamData].map(d => d.y);

    let minUc = allUc.length ? Math.min(...allUc) : 0;
    let maxUc = allUc.length ? Math.max(...allUc) : 1;
    let minI = allI.length ? Math.min(...allI) : -1;
    let maxI = allI.length ? Math.max(...allI) : 1;

    // Debug: Log để kiểm tra
    console.log('Chart update debug:', {
        tangDataCount: tangData.length,
        giamDataCount: giamData.length,
        allUcCount: allUc.length,
        allICount: allI.length,
        minUc: minUc,
        maxUc: maxUc,
        minI: minI,
        maxI: maxI,
        allUcValues: allUc.slice(0, 5), // Chỉ log 5 giá trị đầu
        allIValues: allI.slice(0, 5)
    });

    // Xử lý trục X
    if (minUc === maxUc) {
        minUc -= 1;
        maxUc += 1;
    } else {
        const paddingX = (maxUc - minUc) * 0.05;
        minUc -= paddingX;
        maxUc += paddingX;
    }

    // Xử lý trục Y
    if (minI === maxI) {
        minI -= 1;
        maxI += 1;
    } else {
        const paddingY = (maxI - minI) * 0.1; // Padding lớn hơn cho trục Y
        minI -= paddingY;
        maxI += paddingY;
    }

    console.log('Final scale:', { minUc, maxUc, minI, maxI });

    // Chỉ auto-scale khi được bật
    if (autoScaleEnabled) {
        myChart.options.scales.x.min = minUc;
        myChart.options.scales.x.max = maxUc;
        myChart.options.scales.y.min = minI;
        myChart.options.scales.y.max = maxI;
    }
    myChart.update('none'); // Tắt animation để update ngay lập tức

    PerformanceMonitor.end('updateChart');
}, 100); // Debounce 100ms để tránh vẽ lại quá nhiều lần

// Khởi tạo đồ thị Chart.js
function initChart() {
    if (myChart) myChart.destroy(); // Xóa đồ thị cũ nếu có
    const ctx = document.getElementById("line-chart")?.getContext('2d');
    if (!ctx) {
        console.error('Canvas element line-chart not found');
        return;
    }
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: "Tăng - I (µA)",    // Đường gia nhiệt (màu đỏ)
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3,
                    showLine: false
                },
                {
                    label: "Giảm - I (µA)",    // Đường làm mát (màu xanh)
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Uc (mV)' },
                    ticks: { display: false }
                },
                y: {
                    title: { display: true, text: 'I (µA)' },
                    ticks: { display: false }
                    // Bỏ beginAtZero, min, max để cho phép auto-scaling theo dữ liệu thực tế
                }
            }
        }
    });
    updateChart(); // Vẽ đồ thị lần đầu
}



// ===== WEBSOCKET - KẾT NỐI VỚI SERVER =====
function initWebSocket() {
    websocket = new WebSocket(CONFIG.wsUrl);

    // Khi kết nối thành công
    websocket.onopen = function() {
        console.log('WebSocket connected successfully');

        // FIX: Reset retry counter khi kết nối thành công
        window.wsRetryCount = 0;

        const username = localStorage.getItem('username');
        const token = localStorage.getItem('token');

        // Gửi thông tin xác thực đến server
        if (username && token) {
            websocket.send(JSON.stringify({
                action: "authenticate",
                username,
                token
            }));
            // Cập nhật thông tin user trên giao diện
            const userName = document.getElementById('userName');
            const userRole = document.getElementById('userRole');
            if (userName) userName.innerText = username || 'Chưa có thông tin';
            if (userRole) userRole.innerText = localStorage.getItem('role') || 'Chưa có thông tin';
            updateControlPermission(localStorage.getItem('role'));
        } else {
            // Chuyển về trang đăng nhập nếu chưa có thông tin
            window.location.href = "/login.html";
        }
    };

    // FIX RECONNECTION LOOP: Thêm limit retry
    websocket.onclose = function() {
        console.log('WebSocket disconnected - attempting reconnect');

        // Tăng retry counter
        if (!window.wsRetryCount) window.wsRetryCount = 0;
        window.wsRetryCount++;

        // Limit retry attempts (max 10 lần)
        if (window.wsRetryCount <= 10) {
            const delay = Math.min(2000 * window.wsRetryCount, 30000); // Exponential backoff, max 30s
            console.log(`Retry ${window.wsRetryCount}/10 in ${delay}ms`);
            setTimeout(initWebSocket, delay);
        } else {
            console.error('Max retry attempts reached. Please refresh page.');
            localStorage.clear();
        }
    };

    // Xử lý tin nhắn từ server
    websocket.onmessage = onMessage;

    // Xử lý lỗi kết nối
    websocket.onerror = function(error) {
        console.error('WebSocket error:', error);
        showToast('Lỗi kết nối WebSocket');
    };
}

// ===== QUẢN LÝ QUYỀN ĐIỀU KHIỂN =====
// Kiểm tra quyền điều khiển của user hiện tại
function canUserControl() {
    const role = localStorage.getItem('role');
    return role === 'admin' || role === 'controller';
}

// Kiểm tra trạng thái nguồn từ UI
function isPowerOn() {
    const onOffButton = document.getElementById('onoff');
    return onOffButton && onOffButton.classList.contains('active');
}

// Kiểm tra điều kiện điều khiển và hiển thị thông báo lỗi nếu cần
function checkControlConditions(requirePower = true) {
    if (!canUserControl()) {
        showToast('Bạn không có quyền điều khiển');
        return false;
    }

    if (requirePower && !isPowerOn()) {
        showToast('Bạn chưa khởi động nguồn');
        return false;
    }

    return true;
}

// Cập nhật trạng thái enable/disable của các nút điều khiển
function updateControlButtons(canControl) {
    ['onoff', 'bep', 'quat', 'camera', 'resetButton'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = !canControl;
            // Không tự động thay đổi trạng thái active của các nút
            // Trạng thái active chỉ được thay đổi bởi server state hoặc user action
            console.log(`Set ${id}.disabled = ${!canControl}`);
        } else {
            console.error(`Element with ID ${id} not found in DOM`);
        }
    });
}

// Cập nhật hiển thị quyền điều khiển trên giao diện
function updateControlPermission(role) {
    const controlPermissionElement = document.getElementById('controlPermission');
    if (controlPermissionElement) {
        if (role === 'admin' || role === 'controller') {
            controlPermissionElement.innerText = 'Có';
        } else if (role === 'viewer') {
            controlPermissionElement.innerText = 'Không';
        } else {
            controlPermissionElement.innerText = 'Chưa có';
        }
    }
}

// ===== QUẢN LÝ DỮ LIỆU =====
// Reset tất cả dữ liệu và đồ thị về trạng thái ban đầu
function resetData() {
    console.log('resetData called, map sizes before clear:', {
        heaterDataMap: heaterDataMap.size,
        fanDataMap: fanDataMap.size,
        heaterDisplayMap: heaterDisplayMap.size,
        fanDisplayMap: fanDisplayMap.size
    });

    // Xóa tất cả dữ liệu trong bộ nhớ
    heaterDataMap.clear();
    fanDataMap.clear();
    heaterDisplayMap.clear();
    fanDisplayMap.clear();

    console.log('Maps cleared, sizes after clear:', {
        heaterDataMap: heaterDataMap.size,
        fanDataMap: fanDataMap.size,
        heaterDisplayMap: heaterDisplayMap.size,
        fanDisplayMap: fanDisplayMap.size
    });

    // Reset đồ thị
    if (myChart) {
        myChart.data.datasets[0].data = [];
        myChart.data.datasets[1].data = [];
        myChart.options.scales.x.min = undefined;
        myChart.options.scales.x.max = undefined;
        myChart.options.scales.y.min = undefined;
        myChart.options.scales.y.max = undefined;
        myChart.update();
        console.log('Chart reset: datasets cleared');
    } else {
        console.warn('myChart not initialized, reinitializing');
        initChart();
    }

    // Reset bảng dữ liệu trong popup
    const heaterData = document.getElementById('heaterData');
    const fanData = document.getElementById('fanData');
    if (heaterData && fanData) {
        heaterData.innerHTML = '<table class="data-table"><tr><th>Thời gian</th><th>Uc (mV)</th><th>I (µA)</th></tr><tr><td colspan="3">Chưa có</td></tr></table>';
        fanData.innerHTML = '<table class="data-table"><tr><th>Thời gian</th><th>Uc (mV)</th><th>I (µA)</th></tr><tr><td colspan="3">Chưa có</td></tr></table>';
        if (isExportPopupOpen) {
            showAllData();
            console.log('Popup tables reset to empty');
        }
    } else {
        console.error('heaterData or fanData element not found');
    }

    // Reset hiển thị dữ liệu hiện tại
    const currentI = document.getElementById('currentI');
    const currentUc = document.getElementById('currentUc');
    if (currentI && currentUc) {
        currentI.innerText = 'Chưa có dữ liệu';
        currentUc.innerText = 'Chưa có dữ liệu';
        console.log('currentI and currentUc reset');
    } else {
        console.error('currentI or currentUc element not found');
    }
}

// ===== XỬ LÝ TIN NHẮN TỪ SERVER =====
function onMessage(event) {
    const data = JSON.parse(event.data);

    // FIX SPAM LOG: Chỉ log message quan trọng, không spam console
    if (data.action !== 'realtimeUpdate' && data.action !== 'newData') {
        console.log('WebSocket message:', data.action || data.type, data);
    }

    // Xử lý thông báo lỗi
    if (data.action === 'error') {
        showToast(data.message);
        return;
    }

    // Xử lý đăng xuất bắt buộc (bị admin kick)
    if (data.action === 'forceLogout') {
        showToast(data.message || 'Bạn đã bị đăng xuất');
        localStorage.clear();
        window.location.href = '/login.html';
        return;
    }

    // Xử lý cập nhật trạng thái thiết bị từ server
    if (data.action === 'state') {
        console.log('Received state update:', data);
        const onOff = document.getElementById('onoff');
        const bep = document.getElementById('bep');
        const quat = document.getElementById('quat');
        const camera = document.getElementById('camera');

        // Cập nhật trạng thái nút nguồn
        if (onOff) {
            if (data.power) {
                onOff.classList.add('active');
                // KHÔNG tự động bật camera khi bật nguồn - phải bấm nút camera
            } else {
                onOff.classList.remove('active');
                // Tự động tắt camera khi tắt nguồn
                if (isCameraOn) {
                    hideCamera();
                }
            }
        }

        // Cập nhật trạng thái nút gia nhiệt
        if (bep) {
            if (data.heater) {
                bep.classList.add('active');
            } else {
                bep.classList.remove('active');
            }
        }

        // Cập nhật trạng thái nút quạt
        if (quat) {
            if (data.fan) {
                quat.classList.add('active');
            } else {
                quat.classList.remove('active');
            }
        }

        // Cập nhật trạng thái nút camera
        if (camera) {
            if (data.camera) {
                camera.classList.add('active');
            } else {
                camera.classList.remove('active');
            }
        }

        // Điều khiển hiển thị camera thực tế
        if (data.camera !== isCameraOn) {
            if (data.camera) {
                showCamera();
            } else {
                hideCamera();
            }
        }
    }
    
    if (data.action === 'fullData') {
        heaterDataMap.clear();
        fanDataMap.clear();
        heaterDisplayMap.clear();
        fanDisplayMap.clear();

        // Phân loại lại toàn bộ lịch sử vào 2 dataset dựa vào heater/fan
        if (data.history && Array.isArray(data.history)) {
            data.history.forEach(point => {
                const uc_rounded = parseFloat(point.Uc).toFixed(2);
                const i_rounded = parseFloat(point.I).toFixed(2);
                const timestamp = point.timestamp || point.actualTimestamp || formatTimestamp();
                const uniqueKey = `${timestamp}_${uc_rounded}`;
                if (point.heater) {
                    heaterDataMap.set(uniqueKey, {
                        voltage: Number(uc_rounded),
                        current: Number(i_rounded),
                        timestamp: timestamp
                    });
                    heaterDisplayMap.set(uc_rounded, i_rounded);
                } else if (point.fan) {
                    fanDataMap.set(uniqueKey, {
                        voltage: Number(uc_rounded),
                        current: Number(i_rounded),
                        timestamp: timestamp
                    });
                    fanDisplayMap.set(uc_rounded, i_rounded);
                }
            });
        }

        initChart();
        if (isExportPopupOpen) showAllData();
    } else if (data.action === 'currentData' && data.I !== undefined && data.Uc !== undefined) {
        // Cập nhật dữ liệu hiện tại (500ms/lần, luôn hiển thị khi bật nguồn)
        const uc_rounded = parseFloat(data.Uc).toFixed(1);
        const i_rounded = parseFloat(data.I).toFixed(1);
        const currentI = document.getElementById('currentI');
        const currentUc = document.getElementById('currentUc');
        if (currentI) currentI.innerText = i_rounded + ' µA';
        if (currentUc) currentUc.innerText = uc_rounded + ' mV';

    } else if (data.action === 'newData' && data.I !== undefined && data.Uc !== undefined) {
        // Xử lý dữ liệu logging (10s) - lưu vào đồ thị và chi tiết
        const uc_rounded = parseFloat(data.Uc).toFixed(1); // 1 số thập phân
        const i_rounded = parseFloat(data.I).toFixed(1);   // 1 số thập phân

        // Sử dụng actualTimestamp từ server (thời gian ghi thực tế) hoặc tạo mới
        const timestamp = data.actualTimestamp ?
            new Date(data.actualTimestamp).toLocaleTimeString('vi-VN', { hour12: false }) :
            formatTimestamp();

        if (data.heater) {
            const uniqueKey = `${timestamp}_${uc_rounded}`;
            heaterDataMap.set(uniqueKey, {
                voltage: Number(uc_rounded),
                current: Number(i_rounded),
                timestamp: timestamp
            });
            heaterDisplayMap.set(uc_rounded, i_rounded);
            // FIX SPAM LOG: Loại bỏ debug log
        }
        if (data.fan) {
            const uniqueKey = `${timestamp}_${uc_rounded}`;
            fanDataMap.set(uniqueKey, {
                voltage: Number(uc_rounded),
                current: Number(i_rounded),
                timestamp: timestamp
            });
            fanDisplayMap.set(uc_rounded, i_rounded);
            // FIX SPAM LOG: Loại bỏ debug log
        }

        // Cập nhật đồ thị và chi tiết
        updateChart();
        if (isExportPopupOpen) showAllData();

        // Cập nhật hiển thị số liệu (backup cho trường hợp không có real-time)
        const currentI = document.getElementById('currentI');
        const currentUc = document.getElementById('currentUc');
        if (currentI) currentI.innerText = i_rounded + ' µA';
        if (currentUc) currentUc.innerText = uc_rounded + ' mV';
    }
    
    if (data.action === 'userInfo') {
        console.log('Received userInfo:', data);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        if (userName) userName.innerText = data.username || 'Chưa có thông tin';
        if (userRole) userRole.innerText = data.role || 'Chưa có thông tin';

        const canControl = data.role === 'admin' || data.role === 'controller';
        updateControlButtons(canControl);
        updateControlPermission(data.role);

        // Yêu cầu server gửi trạng thái hiện tại để đồng bộ camera
        websocket.send(JSON.stringify({
            action: 'requestCurrentState',
            username: data.username
        }));
    }
    
    if (data.action === 'activeUsers') {
        console.log('Received activeUsers:', data);
        // updateUserList chỉ dùng cho admin page, không cần xử lý ở đây
    }

    if (data.action === 'dataReset') {
        console.log('Processing dataReset with state:', data.state);
        resetData();

        // Cập nhật UI state từ server nếu có - server giữ nguyên camera state
        if (data.state) {
            console.log('Updating UI state from dataReset:', data.state);

            const onOff = document.getElementById('onoff');
            const bep = document.getElementById('bep');
            const quat = document.getElementById('quat');
            const camera = document.getElementById('camera');

            if (onOff) {
                if (data.state.power) {
                    onOff.classList.add('active');
                } else {
                    onOff.classList.remove('active');
                }
            }
            if (bep) {
                if (data.state.heater) {
                    bep.classList.add('active');
                } else {
                    bep.classList.remove('active');
                }
            }
            if (quat) {
                if (data.state.fan) {
                    quat.classList.add('active');
                } else {
                    quat.classList.remove('active');
                }
            }
            if (camera) {
                // Cập nhật camera theo server state (server giữ nguyên trạng thái cũ)
                // Update camera UI from reset state
                if (data.state.camera) {
                    camera.classList.add('active');
                } else {
                    camera.classList.remove('active');
                }
            }
        }

        showToast(data.message || 'Dữ liệu đã được reset');
    }

    if (data.action === 'updateRole' && data.username === localStorage.getItem('username')) {
        console.log('Updating role:', data.role);
        localStorage.setItem('role', data.role);
        const userRole = document.getElementById('userRole');
        if (userRole) {
            userRole.innerText = data.role || 'Chưa có thông tin';
            console.log('userRole updated in UI');
        } else {
            console.error('userRole element not found');
        }
        showToast(`Quyền của bạn đã được cập nhật thành ${data.role}`);
        
        const canControl = data.role === 'admin' || data.role === 'controller';
        updateControlButtons(canControl);
        updateControlPermission(data.role);
    }
}

// Removed unused controlGPIO function

function initializeWebRTC() {
    console.log('Initializing WebRTC camera...');

    // Sử dụng IP từ config
    const cameraIP = CONFIG.cameraIp || "171.244.139.17";
    const cameraPort = CONFIG.cameraPort || "5119";

    console.log(`Camera connecting to ${cameraIP}:${cameraPort}`);
    console.log('Camera config:', { cameraIP, cameraPort });

    // Kiểm tra xem container có tồn tại không
    const container = document.getElementById("video1");
    if (!container) {
        console.error('Camera container "video1" not found!');
        showToast('Lỗi: Không tìm thấy container camera');
        return;
    }

    // Khởi tạo player bằng RunPlayer cho container "video1" với tối ưu tốc độ
    try {
        console.log('Starting RunPlayer...');
        RunPlayer("video1", 0, 0, cameraIP, cameraPort, false, "icam", "", true, true, 1, "", false);
        console.log('RunPlayer initialized successfully');
    } catch (error) {
        console.error('Error initializing RunPlayer:', error);
        showToast('Lỗi khởi tạo camera: ' + error.message);
    }

    // Sau 500ms, cấu hình phần tử video con được tạo ra (ID: video1_Video) - tối ưu tốc độ
    setTimeout(function() {
        console.log('Looking for video1_Video element...');
        var video1 = document.getElementById("video1_Video");
        if (video1) {
            console.log('Video element found, configuring...');
            video1.muted = true; // Giúp vượt qua chính sách autoplay của Chrome
            video1.controls = false; // Tắt controls của video
            video1.setAttribute('controls', false);
            video1.removeAttribute('controls');

            // Thêm event listeners để debug
            video1.addEventListener('loadstart', () => console.log('Video: loadstart'));
            video1.addEventListener('loadeddata', () => console.log('Video: loadeddata'));
            video1.addEventListener('canplay', () => console.log('Video: canplay'));
            video1.addEventListener('playing', () => console.log('Video: playing'));
            video1.addEventListener('error', (e) => console.error('Video error:', e));
            // Tối ưu độ trễ camera với MediaSource buffer management - đơn giản hóa
            setInterval(function() {
                if (video1.seekable.length && !video1.paused) {
                    var delay = video1.seekable.end(0) - video1.currentTime;
                    if (delay > 1) {
                        video1.currentTime = video1.seekable.end(0) - 1;
                    }
                }
            }, 2000);
        } else {
            console.error('Video element video1_Video not found after 500ms');
            showToast('Camera không khởi tạo được - thử lại sau');
        }

        // Ẩn tất cả controls của RunPlayer
        const video1Container = document.getElementById("video1");
        if (video1Container) {
            // Function để ẩn controls
            function hideControls() {
                const controls = video1Container.querySelectorAll('button, .control, .controls, [class*="control"], [class*="button"]');
                controls.forEach(control => {
                    control.style.display = 'none';
                    control.style.visibility = 'hidden';
                    control.style.opacity = '0';
                    control.style.pointerEvents = 'none';
                });

                const overlays = video1Container.querySelectorAll('[class*="overlay"], [class*="ui"], [style*="position: absolute"]');
                overlays.forEach(overlay => {
                    if (overlay !== video1) {
                        overlay.style.display = 'none';
                    }
                });
            }

            // Ẩn controls ngay lập tức
            hideControls();

            // Theo dõi thay đổi DOM và ẩn controls mới xuất hiện
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        hideControls();
                    }
                });
            });

            observer.observe(video1Container, {
                childList: true,
                subtree: true
            });

            // Ẩn controls định kỳ
            setInterval(hideControls, 500);
        }
    }, 500); // Giảm từ 1000ms xuống 500ms để tăng tốc độ khởi tạo

    // Thêm timeout dài hơn để kiểm tra camera có hoạt động không
    setTimeout(function() {
        const video1_Video = document.getElementById("video1_Video");
        if (video1_Video) {
            console.log('Camera status after 3s:', {
                readyState: video1_Video.readyState,
                networkState: video1_Video.networkState,
                paused: video1_Video.paused,
                ended: video1_Video.ended,
                currentTime: video1_Video.currentTime,
                duration: video1_Video.duration
            });

            if (video1_Video.readyState === 0) {
                console.warn('Camera not loading after 3s - possible connection issue');
                showToast('Camera đang kết nối... Vui lòng đợi');
            }
        } else {
            console.error('Camera element still not found after 3s');
            showToast('Lỗi: Camera không khởi tạo được');
        }
    }, 3000);
}



function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

function initPopup() {
    const popup = document.getElementById('dataPopup');
    if (!popup) return;

    popup.style.display = 'none';
    isExportPopupOpen = false;

    const detailButton = document.getElementById('detailData');
    if (detailButton) {
        detailButton.addEventListener('click', function() {
            if (!isExportPopupOpen) {
                showAllData();
            }
        });
    }

    const closeButton = document.getElementById('closeDataPopup');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closePopup();
        });
    }

    const exportButton = document.getElementById('exportData');
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }

    initDraggablePopup();
}

function showAllData() {
    // Show all data popup
    const popup = document.getElementById('dataPopup');
    const heaterData = document.getElementById('heaterData');
    const fanData = document.getElementById('fanData');
    
    if (!popup || !heaterData || !fanData) {
        return;
    }

    isExportPopupOpen = true;
    
    let heaterHtml = '<table class="data-table"><tr><th>Uc (mV)</th><th>I (µA)</th></tr>';
    if (heaterDataMap.size === 0) {
        heaterHtml += '<tr><td colspan="2">Chưa có</td></tr>';
    } else {
        heaterDataMap.forEach((data) => {
            if (data && typeof data.voltage === 'number' && typeof data.current === 'number') {
                heaterHtml += `<tr><td>${(data.voltage).toFixed(1)}</td><td>${(data.current).toFixed(1)}</td></tr>`;
            }
        });
    }
    heaterHtml += '</table>';
    heaterData.innerHTML = heaterHtml;

    let fanHtml = '<table class="data-table"><tr><th>Uc (mV)</th><th>I (µA)</th></tr>';
    if (fanDataMap.size === 0) {
        fanHtml += '<tr><td colspan="2">Chưa có</td></tr>';
    } else {
        fanDataMap.forEach((data) => {
            if (data && typeof data.voltage === 'number' && typeof data.current === 'number') {
                fanHtml += `<tr><td>${(data.voltage).toFixed(1)}</td><td>${(data.current).toFixed(1)}</td></tr>`;
            }
        });
    }
    fanHtml += '</table>';
    fanData.innerHTML = fanHtml;

    popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.getElementById('dataPopup');
    if (popup) {
        popup.style.display = 'none';
        isExportPopupOpen = false;
    }
}

function showCamera() {
    console.log('showCamera called');

    // Tránh khởi tạo nhiều lần cùng lúc
    if (cameraInitializing) {
        console.log('Camera is already initializing, skipping...');
        return;
    }

    // Khởi tạo camera nếu chưa được khởi tạo
    if (!cameraInitialized) {
        cameraInitializing = true;
        showToast('Đang kết nối camera...');

        // Khởi tạo ngay lập tức
        initializeWebRTC();
        cameraInitialized = true;
        cameraInitializing = false;

        // Hiển thị sau khi khởi tạo - giảm thời gian chờ
        setTimeout(() => {
            showToast('Camera đã sẵn sàng');
        }, 1000);
    }

    var video1 = document.getElementById('video1');
    var video1_Video = document.getElementById('video1_Video');

    // Hiển thị container của video
    if (video1) {
        video1.style.display = 'block';
        console.log('Camera container shown');
    }

    // Hiển thị video element nếu có
    if (video1_Video) {
        video1_Video.style.display = 'block';
        console.log('Camera video element shown');
    }

    isCameraOn = true;
}

function hideCamera() {
    console.log('hideCamera called');

    var video1 = document.getElementById('video1');
    var video1_Video = document.getElementById('video1_Video');

    // Ẩn container
    if (video1) {
        video1.style.display = 'none';
        console.log('Camera container hidden');
    }

    // Ẩn video element
    if (video1_Video) {
        video1_Video.style.display = 'none';
        console.log('Camera video element hidden');
    }

    isCameraOn = false;
}

function reconnectCamera() {
    console.log('Manual camera reconnect...');

    // Xóa camera cũ
    const video1 = document.getElementById('video1');
    if (video1) {
        video1.innerHTML = '';
    }

    // Đặt lại trạng thái
    cameraInitialized = false;
    cameraInitializing = false;

    // Khởi tạo lại camera sau 500ms
    setTimeout(() => {
        if (isCameraOn) {
            initializeWebRTC();
            cameraInitialized = true;
            console.log('Camera reconnected');
        }
    }, 500);
}



function initDraggablePopup() {
    const popup = document.getElementById('dataPopup');
    const header = document.getElementById('popupHeader');
    if (!popup || !header) return;

    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;
        popup.style.transition = 'none';
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            popup.style.left = (e.clientX - offsetX) + 'px';
            popup.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login.html';
        return;
    }

    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.style.height = '295px';
    }

    initPopup();
    initWebSocket();
    initChart();
    // Không khởi tạo camera ngay, chỉ khởi tạo khi cần
    initNavigationArrows();

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    const reconnectButton = document.getElementById('reconnectButton');
    if (reconnectButton) {
        reconnectButton.addEventListener('click', function() {
            if (confirm('Bạn có muốn tải lại trang để kết nối lại không?')) {
                window.location.reload();
            }
        });
    }

    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', async function() {
            const role = localStorage.getItem('role');
            if (role !== 'admin' && role !== 'controller') {
                showToast('Bạn không có quyền reset dữ liệu');
                return;
            }
            if (confirm('Bạn có đồng ý xóa toàn bộ dữ liệu và bắt đầu lại từ đầu hay không?')) {
                // Tắt bếp và quạt trước khi reset - với delay để tránh conflict
                const heaterButton = document.getElementById('bep');
                const fanButton = document.getElementById('quat');

                let deviceOffPromises = [];

                if (heaterButton && heaterButton.classList.contains('active')) {
                    console.log('Turning off heater before reset');
                    deviceOffPromises.push(
                        new Promise(resolve => {
                            websocket.send(JSON.stringify({ action: 'heater_off', username: username }));
                            setTimeout(resolve, 300);
                        })
                    );
                }

                if (fanButton && fanButton.classList.contains('active')) {
                    console.log('Turning off fan before reset');
                    deviceOffPromises.push(
                        new Promise(resolve => {
                            setTimeout(() => {
                                websocket.send(JSON.stringify({ action: 'fan_off', username: username }));
                                resolve();
                            }, 150);
                        })
                    );
                }

                // Đợi tất cả thiết bị tắt xong rồi mới reset
                Promise.all(deviceOffPromises).then(() => {
                    console.log('All devices turned off, proceeding with reset');
                    setTimeout(performReset, 500);
                });

                function performReset() {
                    // Reset UI buttons trước - CHỈ bếp và quạt, KHÔNG tắt camera
                    if (heaterButton) {
                        heaterButton.classList.remove('active');
                    }
                    if (fanButton) {
                        fanButton.classList.remove('active');
                    }
                    // KHÔNG tắt camera button - để giữ nguyên trạng thái

                    // Gửi yêu cầu reset qua WebSocket
                    try {
                        console.log('Sending reset request via WebSocket with role:', role);
                        websocket.send(JSON.stringify({ action: 'reset', username: username, role: role }));
                        // Nếu sau 2s không nhận được dataReset thì reset cục bộ
                        setTimeout(() => {
                            if (heaterDataMap.size > 0 || fanDataMap.size > 0) {
                                console.warn('No dataReset message received, forcing client-side reset');
                                resetData();
                                showToast('Dữ liệu đã được reset cục bộ');
                            }
                        }, 2000);
                    } catch (error) {
                        console.error('Error sending reset request via WebSocket:', error);
                        showToast('Lỗi gửi yêu cầu reset qua WebSocket');
                        resetData();
                        showToast('Dữ liệu đã được reset cục bộ do lỗi WebSocket');
                    }
                }
            } else {
                console.log('Reset cancelled by user');
            }
        });
    }

    // ===== XỬ LÝ CÁC NÚT ĐIỀU KHIỂN =====
    const onOffButton = document.getElementById('onoff');
    if (onOffButton) {
        onOffButton.onclick = function() {
            if (!checkControlConditions(false)) return; // Không cần kiểm tra nguồn cho nút nguồn

            const isActive = this.classList.contains('active');

            // Chỉ hỏi xác nhận khi tắt nguồn
            if (isActive) {
                if (!confirm('Bạn có chắc chắn muốn tắt nguồn không?')) {
                    return;
                }
            }

            websocket.send(JSON.stringify({
                action: isActive ? 'power_off' : 'power_on',
                username: username
            }));
        };
    }

    const heaterButton = document.getElementById('bep');
    if (heaterButton) {
        heaterButton.onclick = function() {
            if (!checkControlConditions()) return; // Kiểm tra quyền và nguồn

            const fanButton = document.getElementById('quat');
            const isActive = this.classList.contains('active');
            const isFanActive = fanButton.classList.contains('active');

            if (!isActive && isFanActive) {
                if (!confirm('Bạn có muốn tắt quạt và bật bếp không?')) {
                    return;
                }
                fanButton.classList.remove('active');
                websocket.send(JSON.stringify({ action: 'fan_off', username: username }));
                setTimeout(() => {
                    websocket.send(JSON.stringify({ action: 'heater_on', username: username }));
                }, 500);
            } else {
                // Thêm xác nhận khi tắt bếp
                if (isActive && !confirm('Bạn có chắc chắn muốn tắt bếp không?')) {
                    return;
                }
                websocket.send(JSON.stringify({
                    action: isActive ? 'heater_off' : 'heater_on',
                    username: username
                }));
            }
        };
    }

    const fanButton = document.getElementById('quat');
    if (fanButton) {
        fanButton.onclick = function() {
            if (!checkControlConditions()) return; // Kiểm tra quyền và nguồn

            const heaterButton = document.getElementById('bep');
            const isActive = this.classList.contains('active');
            const isHeaterActive = heaterButton.classList.contains('active');

            if (!isActive && isHeaterActive) {
                if (!confirm('Bạn có muốn tắt bếp và bật quạt không?')) {
                    return;
                }
                heaterButton.classList.remove('active');
                websocket.send(JSON.stringify({ action: 'heater_off', username: username }));
                setTimeout(() => {
                    websocket.send(JSON.stringify({ action: 'fan_on', username: username }));
                }, 500);
            } else {
                // Thêm xác nhận khi tắt quạt
                if (isActive && !confirm('Bạn có chắc chắn muốn tắt quạt không?')) {
                    return;
                }
                websocket.send(JSON.stringify({
                    action: isActive ? 'fan_off' : 'fan_on',
                    username: username
                }));
            }
        };
    }


    const cameraButton = document.getElementById('camera');
    if (cameraButton) {
        cameraButton.onclick = function() {
            if (!canUserControl()) {
                showToast('Bạn không có quyền điều khiển camera');
                return;
            }

            const isActive = this.classList.contains('active');

            // Toggle camera state
            websocket.send(JSON.stringify({
                action: 'camera',
                state: !isActive,
                username: username
            }));

            // Khi tắt camera, thực hiện clean shutdown
            if (isActive) {
                hideCamera();
                showToast('Camera đã tắt');
            } else {
                // Khi bật camera, thực hiện fresh start (reconnect)
                showToast('Đang khởi động camera...');
                // Nếu camera đã từng được khởi tạo, thực hiện reconnect
                if (cameraInitialized) {
                    reconnectCamera();
                } else {
                    // Lần đầu khởi tạo
                    showCamera();
                }
            }
        };
    }

// Fullscreen button đã được xóa vì function goFullscreen không tồn tại
});

function exportToCSV() {
    // Tạo CSV với format đúng - sử dụng dấu ; để tách cột (Excel format)
    let csv = '\uFEFF'; // BOM cho UTF-8

    // Header row 1: Nhóm cột
    csv += 'Dữ liệu tăng;;Dữ liệu giảm;\n';

    // Header row 2: Tên cột cụ thể
    csv += 'Uc (mV);I (µA);Uc (mV);I (µA)\n';

    // Chuyển đổi Map thành mảng và sắp xếp theo thời gian
    const heaterArray = Array.from(heaterDataMap.values())
        .filter(data => data && typeof data.voltage === 'number' && typeof data.current === 'number')
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const fanArray = Array.from(fanDataMap.values())
        .filter(data => data && typeof data.voltage === 'number' && typeof data.current === 'number')
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('Heater data count:', heaterArray.length);
    console.log('Fan data count:', fanArray.length);
    console.log('Sample heater data:', heaterArray.slice(0, 2));
    console.log('Sample fan data:', fanArray.slice(0, 2));

    // Tìm số dòng tối đa
    const maxRows = Math.max(heaterArray.length, fanArray.length);

    // Nếu không có dữ liệu nào
    if (maxRows === 0) {
        csv += 'Chưa có dữ liệu;;;;\n';
    } else {
        // Tạo dữ liệu cho từng dòng - chỉ xuất Uc, I
        for (let i = 0; i < maxRows; i++) {
            const heaterData = heaterArray[i];
            const fanData = fanArray[i];

            const heaterVoltage = heaterData ? heaterData.voltage.toFixed(2) : '';
            const heaterCurrent = heaterData ? heaterData.current.toFixed(2) : '';
            const fanVoltage = fanData ? fanData.voltage.toFixed(2) : '';
            const fanCurrent = fanData ? fanData.current.toFixed(2) : '';

            // Tạo dòng CSV - 4 cột: Uc1, I1, Uc2, I2
            csv += `${heaterVoltage};${heaterCurrent};${fanVoltage};${fanCurrent}\n`;
        }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'du_lieu_thu_duoc.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function updateUserList đã được chuyển sang admin.js vì chỉ dùng cho admin

// ===== ĐIỀU HƯỚNG TRANG =====
// Khởi tạo các mũi tên điều hướng để cuộn giữa camera và đồ thị
function initNavigationArrows() {
    const navArrowDown = document.getElementById('navArrowDown');
    const navArrowUp = document.getElementById('navArrowUp');

    // Mũi tên xuống - cuộn đến đồ thị
    if (navArrowDown) {
        navArrowDown.addEventListener('click', () => {
            const chartsSection = document.querySelector('.chart-section-bottom');
            if (chartsSection) {
                chartsSection.scrollIntoView({ behavior: 'smooth' });
                navArrowDown.style.display = 'none';
                if (navArrowUp) navArrowUp.style.display = 'flex';
            } else {
                console.log('Chart section not found');
            }
        });
    }

    // Mũi tên lên - cuộn về đầu trang (tiêu đề + camera)
    if (navArrowUp) {
        navArrowUp.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            navArrowUp.style.display = 'none';
            if (navArrowDown) navArrowDown.style.display = 'flex';
        });
    }

    // Theo dõi scroll để hiển thị/ẩn mũi tên phù hợp
    window.addEventListener('scroll', () => {
        const chartsSection = document.querySelector('.chart-section-bottom');

        if (chartsSection && navArrowDown && navArrowUp) {
            const chartsSectionTop = chartsSection.offsetTop;
            const scrollPosition = window.scrollY + window.innerHeight / 2;

            if (scrollPosition >= chartsSectionTop) {
                // Đang ở vùng đồ thị - hiển thị mũi tên lên
                navArrowDown.style.display = 'none';
                navArrowUp.style.display = 'flex';
            } else {
                // Đang ở vùng trên (tiêu đề + camera) - hiển thị mũi tên xuống
                navArrowDown.style.display = 'flex';
                navArrowUp.style.display = 'none';
            }
        }
    });
}

