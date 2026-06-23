// ============================================
// ===== data-manager.js =====
// ============================================

const DataManager = {
    allUsers: {},
    allDeliveries: {},
    refreshInterval: 5000,
    intervalId: null,
    previousUsersCount: 0,

    async loadAllData() {
        try {
            const usersSnap = await db.ref('users').once('value');
            const newUsers = usersSnap.val() || {};
            
            this.detectNewUsers(newUsers);
            this.allUsers = newUsers;
            
            const deliveriesSnap = await db.ref('deliveries').once('value');
            this.allDeliveries = deliveriesSnap.val() || {};
            
            this.updateAllModules();
            this.updateBadges();
            
            // تحديث وقت آخر تحديث
            const lastUpdateEl = document.getElementById('lastUpdateTime');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = new Date().toLocaleString('ar');
            }
            
            console.log('✅ تم تحديث البيانات -', new Date().toLocaleTimeString('ar'));
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            if (typeof UIUtils !== 'undefined') {
                UIUtils.showToast('❌ خطأ في تحميل البيانات', 'error');
            }
        }
    },

    detectNewUsers(newUsers) {
        const newIds = Object.keys(newUsers).filter(id => 
            id && id !== 'null' && id !== 'undefined' && id.trim() !== '' && !this.allUsers[id]
        );
        
        if (newIds.length > 0 && this.previousUsersCount > 0) {
            newIds.forEach(id => {
                const user = newUsers[id];
                const deviceInfo = user?.data?.deviceInfo || {};
                if (typeof UIUtils !== 'undefined') {
                    UIUtils.addNotification(
                        '🆕 مستخدم جديد!',
                        `${deviceInfo.deviceType || 'جهاز'} - ${deviceInfo.os || ''}`,
                        'new-user'
                    );
                }
            });
        }
        
        this.previousUsersCount = this.getValidUsers().length;
    },

    updateAllModules() {
        if (typeof StatsModule !== 'undefined') StatsModule.update();
        if (typeof UsersModule !== 'undefined') UsersModule.render();
        if (typeof MapModule !== 'undefined') MapModule.render();
        if (typeof DeliveryModule !== 'undefined') DeliveryModule.render();
    },

    updateBadges() {
        const validUsers = this.getValidUsers();
        const pendingCount = Object.values(this.allDeliveries).filter(d => d.status === 'pending').length;
        
        const usersBadge = document.getElementById('usersBadge');
        const deliveriesBadge = document.getElementById('deliveriesBadge');
        
        if (usersBadge) usersBadge.textContent = validUsers.length;
        if (deliveriesBadge) deliveriesBadge.textContent = pendingCount;
    },

    getUser(id) {
        return this.allUsers[id];
    },

    getValidUsers() {
        return Object.entries(this.allUsers).filter(([id, u]) => 
            id && id !== 'null' && id !== 'undefined' && id.trim() !== '' && u !== null
        );
    },

    getUsersWithLocation() {
        return this.getValidUsers().filter(([_, u]) => u?.data?.location);
    },

    filterUsers(options = {}) {
        let users = this.getValidUsers();
        
        if (options.search) {
            const search = options.search.toLowerCase();
            users = users.filter(([id, u]) => {
                const data = u?.data || {};
                return id.toLowerCase().includes(search) ||
                       data.ipAddress?.toLowerCase().includes(search) ||
                       data.deviceInfo?.browser?.toLowerCase().includes(search) ||
                       data.deviceInfo?.os?.toLowerCase().includes(search);
            });
        }
        
        if (options.device) {
            users = users.filter(([_, u]) => 
                u?.data?.deviceInfo?.deviceType === options.device
            );
        }
        
        if (options.location === 'located') {
            users = users.filter(([_, u]) => u?.data?.location);
        } else if (options.location === 'not-located') {
            users = users.filter(([_, u]) => !u?.data?.location);
        }
        
        if (options.online === 'online') {
            users = users.filter(([_, u]) => u?.data?.deviceInfo?.online);
        } else if (options.online === 'offline') {
            users = users.filter(([_, u]) => !u?.data?.deviceInfo?.online);
        }
        
        if (options.sortBy) {
            users = this.sortUsers(users, options.sortBy, options.sortDir || 'desc');
        }
        
        return users;
    },

    sortUsers(users, sortBy, direction = 'desc') {
        return users.sort((a, b) => {
            let valA, valB;
            
            switch(sortBy) {
                case 'points':
                    valA = a[1].points || 0;
                    valB = b[1].points || 0;
                    break;
                case 'lastVisit':
                    valA = new Date(a[1]?.data?.lastUpdate || 0).getTime();
                    valB = new Date(b[1]?.data?.lastUpdate || 0).getTime();
                    break;
                case 'firstVisit':
                    valA = new Date(a[1]?.data?.deviceInfo?.firstVisit || 0).getTime();
                    valB = new Date(b[1]?.data?.deviceInfo?.firstVisit || 0).getTime();
                    break;
                default:
                    valA = a[0];
                    valB = b[0];
            }
            
            return direction === 'desc' ? valB - valA : valA - valB;
        });
    },

    startAutoRefresh(interval = 5000) {
        this.refreshInterval = interval;
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.loadAllData(), interval);
        console.log(`🔄 التحديث التلقائي كل ${interval/1000} ثانية`);
    },

    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    changeRefreshInterval(interval) {
        this.startAutoRefresh(parseInt(interval));
        if (typeof UIUtils !== 'undefined') {
            UIUtils.showToast(`🔄 التحديث كل ${interval/1000} ثانية`, 'success');
        }
    },

    exportAllData() {
        const data = {
            users: this.allUsers,
            deliveries: this.allDeliveries,
            exportDate: new Date().toISOString(),
            totalUsers: this.getValidUsers().length,
            totalDeliveries: Object.keys(this.allDeliveries).length
        };
        
        if (typeof UIUtils !== 'undefined') {
            UIUtils.exportToJSON(data, 'delivery_dashboard_backup');
        }
    },

    clearLocalData() {
        if (confirm('⚠️ هل أنت متأكد من مسح جميع البيانات المحلية؟')) {
            localStorage.clear();
            if (typeof UIUtils !== 'undefined') {
                UIUtils.showToast('🗑️ تم مسح البيانات المحلية', 'success');
            }
            setTimeout(() => location.reload(), 1000);
        }
    }
};
