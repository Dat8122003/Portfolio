const config = require('./config.js');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const DATA_FILE = './data.json';

// Serve static files from the public directory
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve admin.html, index.html, and login.html
app.get(['/', '/index.html', '/admin.html', '/login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path));
});

// Lưu trữ người dùng (thay bằng database trong thực tế)
// Lưu cả mật khẩu gốc và mật khẩu đã hash để admin có thể xem
const users = new Map([
    ['admin', {
        password: bcrypt.hashSync('admin', 10),
        originalPassword: 'admin',
        role: 'admin'
    }]
]);

function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captchaText = '';
    for (let i = 0; i < 6; i++) {
        captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return { question: captchaText, answer: captchaText };
}

// Lưu trữ client WebSocket và thông tin người dùng
const clients = new Map();
let esp32Client = null;
let clientIdCounter = 1;

// Lưu trữ trạng thái thiết bị
let deviceState = {
    power: false,
    heater: false,
    fan: false,
    camera: false
};

// Lưu trữ lịch sử trạng thái và cảm biến
async function saveData(type, data) {
    try {
        let history = { state_history: [], sensor_history: [], device_state: deviceState };
        try {
            const content = await fs.readFile(DATA_FILE, 'utf8');
            history = JSON.parse(content);
        } catch (error) {}
        if (type === 'state') {
            history.state_history.push({ ...data, timestamp: Date.now() });
            history.device_state = { ...data };
        } else if (type === 'sensor') {
            // Chỉ lưu các điểm là chart_data (tức là có type === 'chart_data')
            if (data.type === 'chart_data') {
                history.sensor_history.push({ ...data, timestamp: Date.now() });
            }
        }
        await fs.writeFile(DATA_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// API lấy lịch sử dữ liệu
app.get('/history', authenticate, async (req, res) => {
    try {
        const content = await fs.readFile(DATA_FILE, 'utf8');
        const history = JSON.parse(content);
        res.json({
            ...history,
            current_state: deviceState
        });
    } catch (error) {
        res.json({
            state_history: [],
            sensor_history: [],
            device_state: deviceState,
            current_state: deviceState
        });
    }
});

app.get('/captcha', (req, res) => {
    const captcha = generateCaptcha();
    res.json({ question: captcha.question, answer: captcha.answer });
});

// Đăng ký
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const captchaStored = req.body.captchaStored; // Lấy CAPTCHA client lưu lại
    console.log("CAPTCHA từ client:", captchaStored);
    console.log("CAPTCHA người dùng nhập:", req.body.captchaAnswer);

    if (!captchaStored || req.body.captchaAnswer !== captchaStored) {
        return res.json({ success: false, message: 'Xác thực CAPTCHA thất bại!' });
    }
    if (users.has(username)) {
        return res.json({ success: false, message: 'Tên người dùng đã tồn tại' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.set(username, {
        password: hashedPassword,
        originalPassword: password,
        role: 'viewer'
    });
    res.json({ success: true });
    broadcastToAdmins(JSON.stringify({ action: 'registerSuccess', username }));
});

// Đăng nhập
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.get(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    }
    const token = jwt.sign({ username, role: user.role }, process.env.JWT_SECRET || 'a2');
    res.json({ success: true, role: user.role, token });
});

// Đổi mật khẩu
app.post('/changePassword', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const user = users.get(username);
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
        return res.json({ success: false, message: 'Tài khoản hoặc mật khẩu cũ không đúng' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users.set(username, {
        ...user,
        password: hashedPassword,
        originalPassword: newPassword
    });
    res.json({ success: true });
});

// API lấy danh sách người dùng
app.get('/users', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin được truy cập' });
    }
    const userList = Array.from(users.entries()).map(([username, data]) => ({
        username,
        role: data.role
    }));
    res.json(userList);
});

// API lấy danh sách người dùng đang hoạt động
app.get('/activeUsers', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin được truy cập' });
    }
    const activeUsers = Array.from(clients.values()).map(client => ({
        username: client.username,
        role: client.role,
        clientId: client.clientId
    }));
    res.json(activeUsers);
});

// API đổi quyền người dùng
app.post('/changeRole', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin được đổi quyền' });
    }
    const { username, newRole } = req.body;
    if (!users.has(username)) {
        return res.json({ success: false, message: 'Người dùng không tồn tại' });
    }
    if (!['viewer', 'controller'].includes(newRole)) {
        return res.json({ success: false, message: 'Quyền không hợp lệ' });
    }
    const user = users.get(username);
    users.set(username, { ...user, role: newRole });
    res.json({ success: true });

    for (let [client, data] of clients) {
        if (data.username === username) {
            clients.set(client, { ...data, role: newRole });
            client.send(JSON.stringify({ action: 'updateRole', username, role: newRole }));
        }
    }
    broadcastToAll(JSON.stringify({ action: 'updateRole', username, role: newRole }));
});

// API xóa người dùng
app.post('/deleteUser', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin được xóa người dùng' });
    }
    const { username } = req.body;
    if (!users.has(username)) {
        return res.json({ success: false, message: 'Người dùng không tồn tại' });
    }
    users.delete(username);
    res.json({ success: true });

    for (let [client, data] of clients) {
        if (data.username === username) {
            client.send(JSON.stringify({ action: 'forceLogout', message: 'Tài khoản của bạn đã bị xóa bởi admin' }));
            client.close();
        }
    }
    broadcastToAll(JSON.stringify({ action: 'userDeleted', username }));
});

// API xem mật khẩu của một tài khoản cụ thể (chỉ admin)
app.post('/viewPassword', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin được truy cập' });
    }

    const { username } = req.body;
    const user = users.get(username);

    if (!user) {
        return res.json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    // Hiển thị mật khẩu gốc cho tất cả tài khoản (admin có quyền xem)
    let displayPassword = user.originalPassword;

    // Nếu không có originalPassword, có thể là tài khoản admin cũ
    if (!displayPassword && username === 'admin') {
        displayPassword = 'admin'; // Mật khẩu mặc định của admin
    }

    if (!displayPassword) {
        displayPassword = 'Mật khẩu đã bị mã hóa - không thể khôi phục';
    }

    res.json({
        success: true,
        username: username,
        password: displayPassword,
        role: user.role,
        canShow: true,
        message: user.originalPassword ? 'Mật khẩu gốc' : 'Mật khẩu mặc định'
    });
});

// API ngắt kết nối người dùng
app.post('/disconnectUser', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin được ngắt kết nối' });
    }
    const { clientId } = req.body;
    let targetClient = null;
    for (let [client, data] of clients) {
        if (data.clientId === clientId) {
            targetClient = client;
            break;
        }
    }
    if (targetClient) {
        targetClient.send(JSON.stringify({ action: 'forceLogout', message: 'Bạn đã bị ngắt kết nối bởi admin' }));
        targetClient.close();
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Người dùng không còn kết nối' });
    }
});

// API reset dữ liệu
app.post('/reset', async (req, res) => {
    const { role } = req.body;
    if (!role || (role !== 'admin' && role !== 'controller')) {
        return res.status(403).json({ success: false, message: 'Chỉ admin hoặc controller được reset' });
    }
    try {
        // Đặt lại trạng thái thiết bị - GIỮ NGUYÊN POWER VÀ CAMERA, chỉ reset bếp và quạt
        const currentPower = deviceState.power; // Lưu trạng thái power hiện tại
        const currentCamera = deviceState.camera; // Lưu trạng thái camera hiện tại
        deviceState = {
            power: currentPower, // Giữ nguyên trạng thái power
            heater: false, // Reset bếp
            fan: false, // Reset quạt
            camera: currentCamera // Giữ nguyên trạng thái camera
        };
        // Xóa dữ liệu lịch sử bằng cách ghi đè file data.json
        const resetData = { state_history: [], sensor_history: [], device_state: deviceState };
        await fs.writeFile(DATA_FILE, JSON.stringify(resetData, null, 2));
        console.log('Data file reset successfully:', resetData);

        // Phát thông điệp reset tới tất cả client
        const resetMessage = JSON.stringify({
            action: 'dataReset',
            message: 'Dữ liệu đã được reset',
            state: deviceState
        });
        console.log('Reset completed. Final deviceState:', deviceState);
        broadcastToAll(resetMessage);
        console.log('Broadcasted dataReset message to all clients with state:', deviceState);

        res.json({ success: true });
    } catch (error) {
        console.error('Error resetting data:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi reset dữ liệu' });
    }
});

// Middleware xác thực JWT
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Không có token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'a2');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
}

function broadcastToAll(message) {
    let sentCount = 0;
    for (let client of clients.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                sentCount++;
            } catch (error) {
                console.error('Error sending message to client:', error);
            }
        }
    }
    // Chỉ log số lượng client nhận được, không log toàn bộ message
    if (sentCount > 0) {
        const messageObj = JSON.parse(message);
        console.log(`Broadcasted ${messageObj.action} to ${sentCount} clients`);
    }
}

function broadcastToAdmins(message) {
    for (let [client, data] of clients) {
        if (data.role === 'admin' && client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                console.log('Sent message to admin:', message);
            } catch (error) {
                console.error('Error sending message to admin:', error);
            }
        }
    }
}

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    const clientId = clientIdCounter++;
    let clientUsername = null;
    let clientRole = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            // Debug: Log tất cả message từ ESP32
            if (ws === esp32Client) {
                console.log('ESP32 message received:', data);
            }
            console.log('Received:', data);

            // Ưu tiên xử lý chart_data từ ESP32
            if (data.type === 'chart_data' && ws === esp32Client) {
                // Lưu vào database
                await saveData('sensor', data);
                // Debug: Log tổng số điểm trong sensor_history sau khi lưu
                try {
                    const content = await fs.readFile(DATA_FILE, 'utf8');
                    const history = JSON.parse(content);
                    console.log(`[DEBUG] sensor_history length: ${history.sensor_history.length}`);
                } catch (e) {
                    console.log('[DEBUG] Không đọc được data.json sau khi lưu chart_data');
                }
                // Broadcast cho đồ thị và chi tiết
                broadcastToAll(JSON.stringify({
                    action: 'newData',
                    Uc: data.Uc,
                    I: data.I,
                    heater: data.heater,
                    fan: data.fan,
                    actualTimestamp: data.recordTime || new Date().toISOString()
                }));
                console.log(`[Chart Data] Uc=${data.Uc}mV, I=${data.I}mA - Broadcasted to clients & saved to DB`);
                return;
            }

            // Xử lý sensor_data từ ESP32: broadcast cho phần dữ liệu hiện tại (currentData)
            if (data.type === 'sensor_data' && ws === esp32Client) {
                const actualTimestamp = data.recordTime ?
                    new Date(Date.now() - (Date.now() % 1000) + (data.recordTime % 1000)).toISOString() :
                    new Date().toISOString();

                const sensorDataWithTimestamp = {
                    ...data,
                    heater: data.heater,
                    fan: data.fan,
                    actualTimestamp: actualTimestamp
                };

                await saveData('sensor', sensorDataWithTimestamp);
                // Broadcast riêng cho dữ liệu hiện tại
                broadcastToAll(JSON.stringify({
                    action: 'currentData',
                    Uc: data.Uc,
                    I: data.I,
                    heater: data.heater,
                    fan: data.fan,
                    actualTimestamp: actualTimestamp
                }));
                return;
            }

            if (data.action === 'setUsername') {
                clientUsername = data.username;
                clientRole = data.role;
                clients.set(ws, { username: clientUsername, role: clientRole, clientId });
                ws.send(JSON.stringify({ action: 'userInfo', username: clientUsername, role: clientRole }));
                ws.send(JSON.stringify({ action: 'state', ...deviceState }));
                if (clientRole === 'admin') {
                    const activeUsers = Array.from(clients.values()).map(client => ({
                        username: client.username,
                        role: client.role,
                        clientId: client.clientId
                    }));
                    ws.send(JSON.stringify({ action: 'activeUsers', data: activeUsers }));
                }
                try {
                    const content = await fs.readFile(DATA_FILE, 'utf8');
                    const history = JSON.parse(content);
                    console.log(`[DEBUG] Sending fullData to client ${clientUsername} (sensor_history length: ${history.sensor_history.length})`);
                    ws.send(JSON.stringify({
                        action: 'fullData',
                        history: (history.sensor_history || []).filter(d => d.type === 'chart_data')
                    }));
                } catch (error) {
                    ws.send(JSON.stringify({
                        action: 'fullData',
                        heater_increase: [],
                        fan_decrease: []
                    }));
                }
                broadcastToAdmins(JSON.stringify({ action: 'updateUsers', username: clientUsername }));
            } else if (data.action === 'authenticate') {
                try {
                    const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'a2');
                    if (decoded.username === data.username) {
                        clientUsername = data.username;
                        clientRole = decoded.role;
                        clients.set(ws, { username: clientUsername, role: clientRole, clientId });
                        ws.send(JSON.stringify({ action: 'userInfo', username: clientUsername, role: clientRole }));
                        ws.send(JSON.stringify({ action: 'state', ...deviceState }));
                        try {
                            const content = await fs.readFile(DATA_FILE, 'utf8');
                            const history = JSON.parse(content);
                            console.log(`[DEBUG] Sending fullData to client ${clientUsername} (sensor_history length: ${history.sensor_history.length})`);
                            ws.send(JSON.stringify({
                                action: 'fullData',
                                history: (history.sensor_history || []).filter(d => d.type === 'chart_data')
                            }));
                        } catch (error) {
                            ws.send(JSON.stringify({
                                action: 'fullData',
                                heater_increase: [],
                                fan_decrease: []
                            }));
                        }
                        broadcastToAdmins(JSON.stringify({ action: 'updateUsers', username: clientUsername }));
                    } else {
                        ws.send(JSON.stringify({ action: 'error', message: 'Xác thực thất bại' }));
                    }
                } catch (error) {
                    ws.send(JSON.stringify({ action: 'error', message: 'Token không hợp lệ' }));
                }
            } else if (data.type === 'esp32_connect') {
                console.log('ESP32 connected');
                esp32Client = ws;
            } else if (['power_on', 'power_off', 'heater_on', 'heater_off', 'fan_on', 'fan_off', 'camera'].includes(data.action)) {
                if (data.action === 'power_on') {
                    deviceState.power = true;
                } else if (data.action === 'power_off') {
                    deviceState.power = false;
                    deviceState.heater = false;
                    deviceState.fan = false;
                    deviceState.camera = false;
                } else if (data.action === 'heater_on') {
                    deviceState.heater = true;
                    deviceState.fan = false;
                } else if (data.action === 'heater_off') {
                    deviceState.heater = false;
                } else if (data.action === 'fan_on') {
                    deviceState.fan = true;
                    deviceState.heater = false;
                } else if (data.action === 'fan_off') {
                    deviceState.fan = false;
                } else if (data.action === 'camera') {
                    console.log('Camera action received. Setting camera to:', data.state);
                    deviceState.camera = data.state;
                }
                console.log(`Forwarding ${data.action} to ESP32`);
                if (esp32Client && esp32Client.readyState === WebSocket.OPEN) {
                    esp32Client.send(JSON.stringify(data));
                } else {
                    ws.send(JSON.stringify({ action: 'error', message: 'ESP32 không kết nối' }));
                }
                await saveData('state', deviceState);
                broadcastToAll(JSON.stringify({ action: 'state', ...deviceState }));
            } else if (data.type === 'state_update' && ws === esp32Client) {
                console.log('State update from ESP32:', data);
                console.log('Current server state before ESP32 update:', deviceState);

                // KHÔNG cho ESP32 override camera state - chỉ cập nhật power, heater, fan
                const newState = {
                    power: data.power,
                    heater: data.heater,
                    fan: data.fan,
                    camera: deviceState.camera // GIỮ NGUYÊN camera state từ server
                };

                console.log('ESP32 wants to set camera to:', data.camera, 'but server keeps:', deviceState.camera);

                // So sánh state cũ và mới
                const hasChanges = JSON.stringify(deviceState) !== JSON.stringify(newState);
                if (hasChanges) {
                    console.log('ESP32 state differs from server, updating (except camera):', newState);
                    deviceState = newState;
                    await saveData('state', deviceState);
                    broadcastToAll(JSON.stringify({
                        action: 'state',
                        ...deviceState
                    }));
                } else {
                    console.log('ESP32 state matches server state, no update needed');
                }
            } else if (data.type === 'realtime_data' && ws === esp32Client) {
                // Xử lý dữ liệu real-time (100ms) - chỉ cập nhật hiển thị, không lưu database
                const realtimeData = {
                    action: 'realtimeUpdate',
                    Uc: data.Uc,
                    I: data.I,
                    heater: deviceState.heater,
                    fan: deviceState.fan,
                    recordTime: data.recordTime
                };

                // Chỉ broadcast cho hiển thị real-time, không lưu database
                broadcastToAll(JSON.stringify(realtimeData));
                console.log(`[Real-time] Uc=${data.Uc}mV, I=${data.I}µA - Broadcasting to ${clients.size} clients`);

            } else if (data.type === 'data_log' && ws === esp32Client) {
                // Xử lý dữ liệu logging (10s) - lưu database và cập nhật đồ thị
                const actualTimestamp = data.recordTime ?
                    new Date(Date.now() - (Date.now() % 1000) + (data.recordTime % 1000)).toISOString() :
                    new Date().toISOString();

                const logDataWithTimestamp = {
                    ...data,
                    heater: deviceState.heater,
                    fan: deviceState.fan,
                    actualTimestamp: actualTimestamp
                };

                // Lưu vào database
                await saveData('sensor', logDataWithTimestamp);

                // Broadcast cho đồ thị và chi tiết
                broadcastToAll(JSON.stringify({
                    action: 'newData',
                    Uc: data.Uc,
                    I: data.I,
                    heater: deviceState.heater,
                    fan: deviceState.fan,
                    actualTimestamp: actualTimestamp
                }));
                console.log(`[Data Log] Uc=${data.Uc}mV, I=${data.I}µA logged`);

            } else if (data.type === 'sensor_data' && ws === esp32Client) {
                // Đã xử lý ở trên, không cần xử lý lại ở đây
                return;
            } else if (data.action === 'requestCurrentState') {
                // Client yêu cầu trạng thái hiện tại (thường khi reconnect)
                console.log('Client requested current state:', data.username);
                ws.send(JSON.stringify({ action: 'state', ...deviceState }));
            } else if (data.action === 'registerSuccess') {
                broadcastToAdmins(JSON.stringify({ action: 'registerSuccess', username: data.username }));
            } else if (data.action === 'reset') {
                // Xử lý reset qua WebSocket
                if (!data.role || (data.role !== 'admin' && data.role !== 'controller')) {
                    ws.send(JSON.stringify({ action: 'error', message: 'Chỉ admin hoặc controller được reset' }));
                    return;
                }
                try {
                    // Đặt lại trạng thái thiết bị - GIỮ NGUYÊN POWER VÀ CAMERA, chỉ reset bếp và quạt
                    const currentPower = deviceState.power;
                    const currentCamera = deviceState.camera;
                    deviceState = {
                        power: currentPower,
                        heater: false,
                        fan: false,
                        camera: currentCamera
                    };
                    // Xóa dữ liệu lịch sử bằng cách ghi đè file data.json
                    const resetData = { state_history: [], sensor_history: [], device_state: deviceState };
                    await fs.writeFile(DATA_FILE, JSON.stringify(resetData, null, 2));
                    console.log('Data file reset successfully (WebSocket):', resetData);
                    // Phát thông điệp reset tới tất cả client
                    const resetMessage = JSON.stringify({
                        action: 'dataReset',
                        message: 'Dữ liệu đã được reset',
                        state: deviceState
                    });
                    broadcastToAll(resetMessage);
                    console.log('Broadcasted dataReset message to all clients with state (WebSocket):', deviceState);
                } catch (error) {
                    console.error('Error resetting data (WebSocket):', error);
                    ws.send(JSON.stringify({ action: 'error', message: 'Lỗi khi reset dữ liệu' }));
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({ action: 'error', message: 'Lỗi xử lý yêu cầu' }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket disconnected');
        if (ws === esp32Client) {
            esp32Client = null;
        }
        if (clients.has(ws)) {
            const clientData = clients.get(ws);
            clients.delete(ws);
            broadcastToAdmins(JSON.stringify({ action: 'userDisconnected', username: clientData.username }));
        }
    });
});

server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});