// ============================================
// ===== ui-utils.js =====
// ============================================

const UIUtils = {
    showToast(msg, type = '') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    formatTime(timestamp) {
        if (!timestamp) return 'غير معروف';
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = (now - date) / 1000;
            
            if (diff < 60) return 'الآن';
            if (diff < 3600) return `منذ ${Math.floor(diff/60)} دقيقة`;
            if (diff < 86400) return `منذ ${Math.floor(diff/3600)} ساعة`;
            if (diff < 604800) return `منذ ${Math.floor(diff/86400)} يوم`;
            
            return date.toLocaleString('ar', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return timestamp; }
    },

    formatFullTime(timestamp) {
        if (!timestamp) return 'غير معروف';
        try {
            return new Date(timestamp).toLocaleString('ar', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        } catch { return timestamp; }
    },

    truncate(str, length = 20) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    getDeviceIcon(deviceType) {
        if (deviceType === 'هاتف محمول') return '📱';
        if (deviceType === 'جهاز لوحي') return '📲';
        return '💻';
    },

    getLocationBadge(location) {
        if (location && location.lat && location.lng) {
            return '<span class="badge success">📍 محدد</span>';
        }
        return '<span class="badge warning">⏳ بانتظار</span>';
    },

    getOnlineBadge(online) {
        if (online) return '<span class="badge success">🟢 متصل</span>';
        return '<span class="badge error">🔴 غير متصل</span>';
    },

    openGoogleMaps(lat, lng) {
        const url = `https://www.google.com/maps?q=${lat},${lng}&z=17`;
        window.open(url, '_blank');
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('✅ تم النسخ بنجاح!', 'success');
            return true;
        } catch {
            this.showToast('❌ فشل النسخ', 'error');
            return false;
        }
    },

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
        
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = isDark;
    },

    loadTheme() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            const icon = document.getElementById('themeIcon');
            if (icon) icon.textContent = '☀️';
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = true;
        }
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('mobile-open');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    },

    toggleNotifications() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) panel.classList.toggle('active');
    },

    addNotification(title, message, type = 'info') {
        const list = document.getElementById('notificationsList');
        if (!list) return;
        
        // إزالة رسالة "لا توجد إشعارات"
        const empty = list.querySelector('.empty-state');
        if (empty) empty.remove();
        
        const item = document.createElement('div');
        item.className = 'notification-item unread';
        item.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <div class="notification-time">${this.formatTime(new Date().toISOString())}</div>
        `;
        
        list.insertBefore(item, list.firstChild);
        
        // حد أقصى 20 إشعار
        const items = list.querySelectorAll('.notification-item');
        if (items.length > 20) items[items.length - 1].remove();
        
        const count = list.querySelectorAll('.unread').length;
        const countEl = document.getElementById('notificationCount');
        if (countEl) countEl.textContent = count;
    },

    clearNotifications() {
        const list = document.getElementById('notificationsList');
        if (list) list.innerHTML = '<div class="empty-state small"><p>لا توجد إشعارات</p></div>';
        const countEl = document.getElementById('notificationCount');
        if (countEl) countEl.textContent = '0';
    },

    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showToast('⚠️ لا توجد بيانات للتصدير', 'warning');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h];
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : (val ?? '');
            }).join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showToast('✅ تم التصدير بنجاح', 'success');
    },

    exportToJSON(data, filename) {
        if (!data) {
            this.showToast('⚠️ لا توجد بيانات', 'warning');
            return;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('✅ تم التصدير بنجاح', 'success');
    }
};

// تحميل المظهر عند بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
    UIUtils.loadTheme();
});
