// Shared utilities for the application
import CONFIG from './config.js';

// Shared toast notification function
export function showToast(message) {
    // Try to find existing toast element first
    let toast = document.getElementById('toast');
    
    // If no toast element exists, create one dynamically
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            padding: '10px 20px',
            borderRadius: '6px',
            zIndex: '1000',
            fontSize: '14px',
            display: 'none'
        });
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.display = 'block';
    
    // Clear any existing timeout
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    
    // Set new timeout
    toast.timeoutId = setTimeout(() => {
        toast.style.display = 'none';
    }, CONFIG.toastDuration);
}

// Shared authentication utilities
export class AuthManager {
    static getAuthData() {
        return {
            username: localStorage.getItem('username'),
            role: localStorage.getItem('role'),
            token: localStorage.getItem('token')
        };
    }
    
    static setAuthData(username, role, token) {
        localStorage.setItem('username', username);
        localStorage.setItem('role', role);
        localStorage.setItem('token', token);
    }
    
    static clearAuthData() {
        localStorage.clear();
    }
    
    static isAuthenticated() {
        const { username, token } = this.getAuthData();
        return !!(username && token);
    }
    
    static isAdmin() {
        const { role } = this.getAuthData();
        return role === 'admin';
    }
    
    static canControl() {
        const { role } = this.getAuthData();
        return role === 'admin' || role === 'controller';
    }
    
    static redirectToLogin() {
        this.clearAuthData();
        window.location.href = '/login.html';
    }
}

// Shared WebSocket utilities
export class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.messageHandlers = new Map();
        this.isConnected = false;
    }
    
    connect() {
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleReconnect();
        }
    }
    
    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.onOpen();
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            this.onClose();
            this.handleReconnect();
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.onError(error);
        };
    }
    
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
            showToast('Mất kết nối WebSocket. Vui lòng tải lại trang.');
        }
    }
    
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        } else {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }
    }
    
    addMessageHandler(action, handler) {
        this.messageHandlers.set(action, handler);
    }
    
    handleMessage(data) {
        const handler = this.messageHandlers.get(data.action);
        if (handler) {
            handler(data);
        } else {
            console.warn('No handler for action:', data.action);
        }
    }
    
    // Override these methods in subclasses
    onOpen() {}
    onClose() {}
    onError(error) {}
}

// Debounce utility for performance optimization
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle utility for performance optimization
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Data validation utilities
export class DataValidator {
    static isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
    
    static isValidString(value, minLength = 1) {
        return typeof value === 'string' && value.length >= minLength;
    }
    
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.replace(/[<>]/g, '');
    }
}

// Performance monitoring utilities
export class PerformanceMonitor {
    static timers = new Map();
    
    static start(label) {
        this.timers.set(label, performance.now());
    }
    
    static end(label) {
        const startTime = this.timers.get(label);
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`${label}: ${duration.toFixed(2)}ms`);
            this.timers.delete(label);
            return duration;
        }
        return null;
    }
}
