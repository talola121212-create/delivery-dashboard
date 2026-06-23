// ============================================
// ===== stats-module.js =====
// ============================================

const StatsModule = {
    update() {
        this.updateMainStats();
        this.updateCharts();
        this.updateActivity();
    },

    updateMainStats() {
        const users = DataManager.getValidUsers();
        const located = DataManager.getUsersWithLocation();
        const deliveries = Object.values(DataManager.allDeliveries);
        
        const totalPoints = users.reduce((sum, [_, u]) => sum + (u.points || 0), 0);
        const online = users.filter(([_, u]) => u.data?.deviceInfo?.online).length;
        const pending = deliveries.filter(d => d.status === 'pending').length;
        const delivered = deliveries.filter(d => d.status === 'delivered').length;
        
        this.setStatValue('statTotal', users.length);
        this.setStatValue('statLocated', located.length);
        this.setStatValue('statPending', pending);
        this.setStatValue('statDelivered', delivered);
        this.setStatValue('statPoints', totalPoints);
        this.setStatValue('statOnline', online);
    },

    setStatValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value.toLocaleString('ar');
    },

    updateCharts() {
        this.renderDevicesChart();
        this.renderBrowsersChart();
        this.renderCountriesChart();
        this.renderHoursChart();
        this.renderOSChart();
        this.renderConnectionChart();
    },

    renderDevicesChart() {
        const container = document.getElementById('devicesChart');
        if (!container) return;
        
        const users = DataManager.getValidUsers();
        const counts = {};
        
        users.forEach(([_, u]) => {
            const type = u.data?.deviceInfo?.deviceType || 'غير معروف';
            counts[type] = (counts[type] || 0) + 1;
        });
        
        this.renderBarChart(container, counts, ['blue', 'green', 'purple']);
    },

    renderBrowsersChart() {
        const container = document.getElementById('browsersChart');
        if (!container) return;
        
        const users = DataManager.getValidUsers();
        const counts = {};
        
        users.forEach(([_, u]) => {
            const browser = u.data?.deviceInfo?.browser || 'غير معروف';
            counts[browser] = (counts[browser] || 0) + 1;
        });
        
        this.renderBarChart(container, counts, ['green', 'blue', 'orange', 'purple']);
    },

    renderCountriesChart() {
        const container = document.getElementById('countriesChart');
        if (!container) return;
        
        const users = DataManager.getValidUsers();
        const counts = {};
        
        users.forEach(([_, u]) => {
            const tz = u.data?.deviceInfo?.timezone || 'غير معروف';
            const country = tz.split('/')[1] || tz;
            counts[country] = (counts[country] || 0) + 1;
        });
        
        this.renderBarChart(container, counts, ['purple', 'blue', 'green']);
    },

    renderHoursChart() {
        const container = document.getElementById('hoursChart');
        if (!container) return;
        
        const users = DataManager.getValidUsers();
        const counts = {};
        
        users.forEach(([_, u]) => {
            const lastUpdate = u.data?.lastUpdate;
            if (lastUpdate) {
                const hour = new Date(lastUpdate).getHours();
                const key = `${hour.toString().padStart(2, '0')}:00`;
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        
        this.renderBarChart(container, counts, ['orange', 'red', 'purple']);
    },

    renderOSChart() {
        const container = document.getElementById('osChart');
        if (!container) return;
        
        const users = DataManager.getValidUsers();
        const counts = {};
        
        users.forEach(([_, u]) => {
            const os = u.data?.deviceInfo?.os || 'غير معروف';
            const osName = os.split(' ')[0];
            counts[osName] = (counts[osName] || 0) + 1;
        });
        
        this.renderBarChart(container, counts, ['blue', 'green', 'purple', 'orange']);
    },

    renderConnectionChart() {
        const container = document.getElementById('connectionChart');
        if (!container) return;
        
        const users = DataManager.getValidUsers();
        const counts = {};
        
        users.forEach(([_, u]) => {
            const type = u.data?.deviceInfo?.connectionType || 'غير معروف';
            counts[type] = (counts[type] || 0) + 1;
        });
        
        this.renderBarChart(container, counts, ['green', 'blue']);
    },

    renderBarChart(container, data, colors = ['blue']) {
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        if (total === 0) {
            container.innerHTML = '<div class="empty-state small"><p>لا توجد بيانات</p></div>';
            return;
        }
        
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
        const max = sorted[0][1];
        
        container.innerHTML = sorted.map(([label, value], idx) => {
            const percentage = (value / max) * 100;
            const colorClass = colors[idx % colors.length];
            return `
                <div class="chart-bar">
                    <div class="chart-bar-label">${label}</div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill ${colorClass}" style="width:${percentage}%;">
                            ${value > 0 ? value : ''}
                        </div>
                    </div>
                    <div class="chart-bar-value">${Math.round((value/total)*100)}%</div>
                </div>
            `;
        }).join('');
    },

    updateActivity() {
        const list = document.getElementById('activityList');
        if (!list) return;
        
        const activities = [];
        
        DataManager.getValidUsers().forEach(([id, user]) => {
            const deviceInfo = user.data?.deviceInfo || {};
            activities.push({
                type: 'new-user',
                icon: UIUtils.getDeviceIcon(deviceInfo.deviceType),
                title: `مستخدم جديد - ${deviceInfo.deviceType || 'جهاز'}`,
                time: deviceInfo.firstVisit || user.data?.lastUpdate,
                id: id
            });
        });
        
        Object.entries(DataManager.allDeliveries).forEach(([id, delivery]) => {
            activities.push({
                type: delivery.status === 'delivered' ? 'delivered' : 'new-delivery',
                icon: delivery.status === 'delivered' ? '✅' : '📦',
                title: `${delivery.giftIcon} ${delivery.giftName} - ${delivery.customerName}`,
                time: delivery.timestamp,
                id: id
            });
        });
        
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        const recent = activities.slice(0, 10);
        
        if (recent.length === 0) {
            list.innerHTML = '<div class="empty-state small"><p>لا توجد نشاطات بعد</p></div>';
            return;
        }
        
        list.innerHTML = recent.map(a => `
            <div class="activity-item">
                <div class="activity-icon ${a.type}">${a.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${a.title}</div>
                    <div class="activity-time">${UIUtils.formatTime(a.time)}</div>
                </div>
            </div>
        `).join('');
    }
};
