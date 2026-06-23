// ============================================
// ===== app.js - التطبيق الرئيسي =====
// ============================================

const App = {
    init() {
        console.log('🚀 جاري تشغيل لوحة توزيع الهدايا...');
        
        try {
            DataManager.loadAllData();
            DataManager.startAutoRefresh(5000);
            console.log('✅ اللوحة جاهزة');
        } catch (error) {
            console.error('❌ خطأ في التهيئة:', error);
        }
    },

    switchSection(sectionName) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const section = document.getElementById(`section-${sectionName}`);
        if (section) section.classList.add('active');
        
        const navItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (navItem) navItem.classList.add('active');
        
        if (sectionName === 'map') {
            setTimeout(() => {
                if (typeof MapModule !== 'undefined') {
                    MapModule.init();
                    MapModule.render();
                    if (MapModule.map) MapModule.map.invalidateSize();
                }
            }, 100);
        }
        
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('mobile-open');
        }
    }
};

// ===== تعريف جميع الدوال عالمياً (مهم جداً!) =====
window.switchSection = function(name, event) {
    if (event) event.preventDefault();
    App.switchSection(name);
};

window.toggleSidebar = function() {
    if (typeof UIUtils !== 'undefined') UIUtils.toggleSidebar();
};

window.toggleTheme = function() {
    if (typeof UIUtils !== 'undefined') UIUtils.toggleTheme();
};

window.refreshData = function() {
    if (typeof DataManager !== 'undefined') {
        DataManager.loadAllData();
        const lastUpdateEl = document.getElementById('lastUpdateTime');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = new Date().toLocaleString('ar');
        }
        if (typeof UIUtils !== 'undefined') {
            UIUtils.showToast('🔄 تم تحديث البيانات', 'success');
        }
    }
};

window.exportData = function() {
    if (typeof DataManager !== 'undefined') DataManager.exportAllData();
};

window.toggleNotifications = function() {
    if (typeof UIUtils !== 'undefined') UIUtils.toggleNotifications();
};

window.clearNotifications = function() {
    if (typeof UIUtils !== 'undefined') UIUtils.clearNotifications();
};

window.handleGlobalSearch = function(value) {
    if (value.length > 0) {
        App.switchSection('users');
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.value = value;
            if (typeof UsersModule !== 'undefined') UsersModule.filter();
        }
    }
};

window.changeRefreshInterval = function(interval) {
    if (typeof DataManager !== 'undefined') DataManager.changeRefreshInterval(interval);
};

window.clearLocalData = function() {
    if (typeof DataManager !== 'undefined') DataManager.clearLocalData();
};

window.closeModal = function(id) {
    if (typeof UIUtils !== 'undefined') UIUtils.closeModal(id);
};

window.filterUsers = function() {
    if (typeof UsersModule !== 'undefined') UsersModule.filter();
};

window.sortTable = function(col) {
    if (typeof UsersModule !== 'undefined') UsersModule.sortTable(col);
};

window.exportUsersCSV = function() {
    if (typeof UsersModule !== 'undefined') UsersModule.exportCSV();
};

window.exportUsersJSON = function() {
    if (typeof UsersModule !== 'undefined') UsersModule.exportJSON();
};

window.openNewDeliveryModal = function() {
    if (typeof DeliveryModule !== 'undefined') DeliveryModule.openNewForm();
};

window.centerMap = function() {
    if (typeof MapModule !== 'undefined') MapModule.centerMap();
};

window.toggleHeatmap = function() {
    if (typeof MapModule !== 'undefined') MapModule.toggleHeatmap();
};

window.clearActivity = function() {
    const list = document.getElementById('activityList');
    if (list) list.innerHTML = '<div class="empty-state small"><p>تم المسح</p></div>';
};

// ===== بدء التشغيل =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// إغلاق النوافذ المنبثقة عند النقر خارجها
document.addEventListener('click', (e) => {
    const notifPanel = document.getElementById('notificationsPanel');
    const notifBtn = document.querySelector('.notification-btn');
    if (notifPanel?.classList.contains('active') && 
        !notifPanel.contains(e.target) && 
        !notifBtn?.contains(e.target)) {
        notifPanel.classList.remove('active');
    }
});

// إغلاق المودال بمفتاح Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
        const notifPanel = document.getElementById('notificationsPanel');
        if (notifPanel) notifPanel.classList.remove('active');
    }
});
