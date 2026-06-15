import CONFIG from './config.js';
import { showToast, AuthManager } from './utils.js';

let ws = null;

function initWebSocket() {
    ws = new WebSocket(CONFIG.wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected for admin');
        const { username, role, token } = AuthManager.getAuthData();

        if (AuthManager.isAdmin() && token) {
            ws.send(JSON.stringify({
                action: "setUsername",
                username,
                role,
                token
            }));
            console.log("Sent setUsername: " + username);
            fetchUsers();
            fetchActiveUsers();
        }
    };

    ws.onmessage = (event) => {
        console.log('Raw WebSocket message received:', event.data);
        try {
            const data = JSON.parse(event.data);
            console.log('Parsed WebSocket message:', data);
            
            if (data.action === 'updateUsers' || data.action === 'registerSuccess' || 
                data.action === 'userDeleted' || data.action === 'userDisconnected' ||
                data.action === 'updateRole') {
                console.log('Nhận thông báo cập nhật, cập nhật cả hai danh sách');
                fetchUsers();
                fetchActiveUsers();
            } else if (data.action === 'activeUsers') {
                console.log('Nhận danh sách người dùng hoạt động:', data.data);
                if (!Array.isArray(data.data)) {
                    console.error('Dữ liệu activeUsers không phải mảng:', data.data);
                    showToast('Dữ liệu người dùng hoạt động không hợp lệ');
                    return;
                }
                const tbody = document.querySelector('#activeUserTable tbody');
                tbody.innerHTML = '';
                const activeUsers = data.data.filter(user => user.username !== localStorage.getItem('username'));
                document.getElementById('activeUserCount').textContent = activeUsers.length;
                activeUsers.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.username}</td>
                        <td>
                            <button onclick="disconnectUser(${user.clientId})">Ngắt kết nối</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else if (data.action === 'userInfo') {
                console.log('Nhận thông tin người dùng:', data);
                document.getElementById('userName').innerText = data.username || 'Chưa có thông tin';
                document.getElementById('userRole').innerText = data.role || 'Chưa có thông tin';
            } else if (data.action === 'forceLogout') {
                console.log('Nhận forceLogout, đăng xuất...');
                localStorage.clear();
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('adminContent').style.display = 'none';
                document.getElementById('errorMessage').textContent = 'Bạn đã bị đăng xuất';
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            showToast('Lỗi xử lý thông báo WebSocket');
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(() => {
            initWebSocket();
        }, CONFIG.wsTimeout);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showToast('Lỗi kết nối WebSocket');
    };
}

async function disconnectUser(clientId) {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/disconnectUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ clientId })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showToast('Đã ngắt kết nối người dùng');
            fetchActiveUsers();
        } else {
            showToast(data.message || 'Lỗi khi ngắt kết nối');
        }
    } catch (error) {
        console.error('Error disconnecting user:', error);
        showToast('Lỗi khi ngắt kết nối người dùng');
    }
}

async function fetchUsers() {
    console.log("Gọi API /users...");
    try {
        const res = await fetch(`${CONFIG.apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                showToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                localStorage.clear();
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('adminContent').style.display = 'none';
                return;
            }
            throw new Error(`Lỗi API /users: ${res.status}`);
        }
        const users = await res.json();
        console.log("Phản hồi API /users:", JSON.stringify(users));
        const tbody = document.querySelector('#userTable tbody');
        tbody.innerHTML = '';
        if (!Array.isArray(users)) {
            console.error("Lỗi: Dữ liệu API không phải mảng:", users);
            showToast('Dữ liệu người dùng không hợp lệ');
            return;
        }
        users.forEach(user => {
            if (user.role === 'admin') return;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="changeRole('${user.username}', '${user.role === 'viewer' ? 'controller' : 'viewer'}')">
                        ${user.role === 'viewer' ? 'Lên controller' : 'Xuống viewer'}
                    </button>
                    <button onclick="viewUserPassword('${user.username}')">Xem mật khẩu</button>
                    <button onclick="deleteUser('${user.username}')">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Lỗi khi gọi API /users:", error);
        showToast('Lỗi khi tải danh sách người dùng');
    }
}

async function changeRole(username, newRole) {
    try {
        const res = await fetch(`${CONFIG.apiUrl}/changeRole`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username, newRole })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Đã đổi quyền của ${username} thành ${newRole}`);
            fetchUsers();
        } else {
            showToast(data.message || 'Lỗi khi đổi quyền');
        }
    } catch (error) {
        console.error('Error changing role:', error);
        showToast('Lỗi kết nối khi đổi quyền');
    }
}

async function viewUserPassword(username) {
    try {
        const res = await fetch(`${CONFIG.apiUrl}/viewPassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            const message = `Tài khoản: ${data.username}\nMật khẩu: ${data.password}\nQuyền: ${data.role}\n\n${data.message}`;
            alert(message);
        } else {
            showToast(data.message || 'Lỗi khi xem mật khẩu');
        }
    } catch (error) {
        console.error('Error viewing password:', error);
        showToast('Lỗi kết nối khi xem mật khẩu');
    }
}

async function deleteUser(username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng ${username}?`)) {
        return;
    }
    try {
        const res = await fetch(`${CONFIG.apiUrl}/deleteUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('Đã xóa người dùng');
            fetchUsers();
            fetchActiveUsers();
        } else {
            showToast(data.message || 'Lỗi khi xóa người dùng');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Lỗi kết nối khi xóa người dùng');
    }
}

async function fetchActiveUsers() {
    console.log("Gọi API /activeUsers...");
    try {
        const res = await fetch(`${CONFIG.apiUrl}/activeUsers`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                showToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                localStorage.clear();
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('adminContent').style.display = 'none';
                return;
            }
            throw new Error(`Lỗi API /activeUsers: ${res.status}`);
        }
        const data = await res.json();
        console.log("Phản hồi API /activeUsers:", JSON.stringify(data));
        const tbody = document.querySelector('#activeUserTable tbody');
        tbody.innerHTML = '';
        const activeUsers = data.filter(user => user.username !== localStorage.getItem('username'));
        document.getElementById('activeUserCount').textContent = activeUsers.length;
        activeUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>
                    <button onclick="disconnectUser(${user.clientId})">Ngắt kết nối</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Lỗi khi gọi API /activeUsers:", error);
        showToast('Lỗi khi tải danh sách người dùng hoạt động');
    }
}

function logout() {
    localStorage.clear();
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
    if (ws) ws.close();
}

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const adminContent = document.getElementById('adminContent');
    const errorMessage = document.getElementById('errorMessage');

    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (username && role === 'admin' && token) {
        loginSection.style.display = 'none';
        adminContent.style.display = 'block';
        document.getElementById('userName').innerText = username;
        document.getElementById('userRole').innerText = role;
        initWebSocket();
    } else {
        loginSection.style.display = 'block';
        adminContent.style.display = 'none';
    }

    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        try {
            const response = await fetch(`${CONFIG.apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok && data.success && data.role === 'admin') {
                localStorage.setItem('username', username);
                localStorage.setItem('role', data.role);
                localStorage.setItem('token', data.token);
                loginSection.style.display = 'none';
                adminContent.style.display = 'block';
                errorMessage.textContent = '';
                document.getElementById('userName').innerText = username;
                document.getElementById('userRole').innerText = data.role;
                initWebSocket();
            } else {
                errorMessage.textContent = data.message || 'Chỉ admin được truy cập trang này';
            }
        } catch (error) {
            errorMessage.textContent = 'Lỗi kết nối khi đăng nhập';
            console.error('Login error:', error);
        }
    });
});
window.changeRole = changeRole;
window.disconnectUser = disconnectUser;
window.viewUserPassword = viewUserPassword;
window.deleteUser = deleteUser;
window.fetchUsers = fetchUsers;
window.fetchActiveUsers = fetchActiveUsers;
window.logout = logout;