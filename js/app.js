// ============================================
// ===== app.js - التطبيق الرئيسي =====
// ============================================

const App = {
    // تهيئة التطبيق
    init() {
        console.log('🚀 جاري تشغيل لوحة توزيع الهدايا...');
        
        // تحميل البيانات
        DataManager.loadAllData();
        
        // بدء التحديث التلقائي
        DataManager.startAutoRefresh(5000);
        
        console.log('✅ اللوحة جاهزة');
    },

    // تبديل القسم
    switchSection(sectionName) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        // إظهار القسم المحدد
        const section = document.getElementById(`section-${sectionName}`);
        if (section) section.classList.add('active');
        
        const navItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (navItem) navItem.classList.add('active');
        
        // تحديث الخريطة عند فتحها
        if (sectionName === 'map') {
            setTimeout(() => {
                MapModule.init();
                MapModule.render();
                if (MapModule.map) MapModule.map.invalidateSize();
            }, 100);
        }
        
        // إغلاق الشريط الجانبي على الموبايل
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('mobile-open');
        }
    }
};

// دوال عامة للوصول من HTML
function switchSection(name, event) {
    if (event) event.preventDefault();
    App.switchSection(name);
}

function toggleSidebar() {
    UIUtils.toggleSidebar();
}

function toggleTheme() {
    UIUtils.toggleTheme();
}

function refreshData() {
    DataManager.loadAllData();
    UIUtils.showToast('🔄 تم تحديث البيانات', 'success');
}

function exportData() {
    DataManager.exportAllData();
}

function toggleNotifications() {
    UIUtils.toggleNotifications();
}

function clearNotifications() {
    UIUtils.clearNotifications();
}

function handleGlobalSearch(value) {
    // البحث العام - ينقل المستخدم لقسم المستخدمين ويفلتر
    if (value.length > 0) {
        App.switchSection('users');
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.value = value;
            UsersModule.filter();
        }
    }
}

function changeRefreshInterval(interval) {
    DataManager.changeRefreshInterval(interval);
}

function clearLocalData() {
    DataManager.clearLocalData();
}

// ===== بدء التشغيل =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// إغلاق النوافذ المنبثقة عند النقر خارجها
document.addEventListener('click', (e) => {
    // إغلاق الإشعارات
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
        document.getElementById('notificationsPanel')?.classList.remove('active');
    }
});
