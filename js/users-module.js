// ============================================
// ===== users-module.js =====
// ============================================

const UsersModule = {
    currentSort: 'lastVisit',
    currentSortDir: 'desc',
    currentFilters: {},

    render() {
        this.renderTable();
        this.updateCount();
    },

    updateCount() {
        const users = DataManager.filterUsers(this.currentFilters);
        const countEl = document.getElementById('usersCount');
        if (countEl) countEl.textContent = users.length;
    },

    renderTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        const users = DataManager.filterUsers({
            ...this.currentFilters,
            sortBy: this.currentSort,
            sortDir: this.currentSortDir
        });
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <div class="icon">📭</div>
                        <h3>لا يوجد مستخدمون</h3>
                        <p>جرب تغيير الفلاتر أو البحث</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(([id, user]) => {
            const data = user?.data || {};
            const deviceInfo = data.deviceInfo || {};
            const location = data.location;
            const points = user.points || 0;
            const lastVisit = UIUtils.formatTime(data.lastUpdate);
            const deviceIcon = UIUtils.getDeviceIcon(deviceInfo.deviceType);
            
            return `
                <tr>
                    <td title="${id}">
                        <small style="color:var(--text-muted);">${UIUtils.truncate(id, 18)}</small>
                    </td>
                    <td>
                        <span style="font-size:18px; margin-left:5px;">${deviceIcon}</span>
                        ${deviceInfo.deviceType || 'غير معروف'}
                    </td>
                    <td>${deviceInfo.os || 'غير معروف'}</td>
                    <td>${deviceInfo.browser || 'غير معروف'}</td>
                    <td>
                        <code style="background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; font-size:11px;">
                            ${data.ipAddress || 'غير معروف'}
                        </code>
                    </td>
                    <td>${UIUtils.getLocationBadge(location)}</td>
                    <td><strong style="color:#d97706;">⭐ ${points}</strong></td>
                    <td><small>${lastVisit}</small></td>
                    <td>
                        <div style="display:flex; gap:3px; flex-wrap:wrap;">
                            <button class="btn btn-sm" style="background:#3b82f6;" onclick="UsersModule.viewUser('${id}')" title="عرض">👁️</button>
                            ${location ? `<button class="btn btn-sm" style="background:#dc2626;" onclick="UIUtils.openGoogleMaps(${location.lat}, ${location.lng})" title="خريطة">🗺️</button>` : ''}
                            <button class="btn btn-sm" style="background:#f59e0b;" onclick="DeliveryModule.openForm('${id}')" title="توصيل">🚚</button>
                            <button class="btn btn-sm" style="background:#6b7280;" onclick="UsersModule.copyUserInfo('${id}')" title="نسخ">📋</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filter() {
        this.currentFilters = {
            search: document.getElementById('userSearch')?.value || '',
            device: document.getElementById('filterDevice')?.value || '',
            location: document.getElementById('filterLocation')?.value || '',
            online: document.getElementById('filterOnline')?.value || ''
        };
        
        const sortBy = document.getElementById('sortBy')?.value || 'lastVisit';
        this.currentSort = sortBy;
        
        this.renderTable();
        this.updateCount();
    },

    sortTable(column) {
        if (this.currentSort === column) {
            this.currentSortDir = this.currentSortDir === 'desc' ? 'asc' : 'desc';
        } else {
            this.currentSort = column;
            this.currentSortDir = 'desc';
        }
        this.renderTable();
    },

    viewUser(id) {
        const user = DataManager.getUser(id);
        if (!user) return;
        
        const data = user.data || {};
        const deviceInfo = data.deviceInfo || {};
        const location = data.location;
        const deviceIcon = UIUtils.getDeviceIcon(deviceInfo.deviceType);
        
        const details = `
            <div class="user-profile-header">
                <div class="device-icon">${deviceIcon}</div>
                <h3>${deviceInfo.deviceType || 'مستخدم'}</h3>
                <p>${deviceInfo.os || ''} - ${deviceInfo.browser || ''}</p>
            </div>
            
            <div class="info-section">
                <h3>🆔 معلومات الحساب</h3>
                <div class="info-row">
                    <span class="label">المعرف:</span>
                    <span class="value" style="font-size:11px;">${id}</span>
                </div>
                <div class="info-row">
                    <span class="label">النقاط:</span>
                    <span class="value"><strong style="color:#d97706;">⭐ ${user.points || 0}</strong></span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>📱 معلومات الجهاز</h3>
                <div class="info-row"><span class="label">نوع الجهاز:</span><span class="value">${deviceInfo.deviceType || 'غير معروف'}</span></div>
                <div class="info-row"><span class="label">نظام التشغيل:</span><span class="value">${deviceInfo.os || 'غير معروف'}</span></div>
                <div class="info-row"><span class="label">المتصفح:</span><span class="value">${deviceInfo.browser || ''} ${deviceInfo.browserVersion || ''}</span></div>
                <div class="info-row"><span class="label">اللغة:</span><span class="value">${deviceInfo.language || 'غير معروف'}</span></div>
                <div class="info-row"><span class="label">المنطقة الزمنية:</span><span class="value">${deviceInfo.timezone || 'غير معروف'}</span></div>
                <div class="info-row"><span class="label">دقة الشاشة:</span><span class="value">${deviceInfo.screenWidth || '?'} × ${deviceInfo.screenHeight || '?'}</span></div>
                <div class="info-row"><span class="label">حجم النافذة:</span><span class="value">${deviceInfo.windowWidth || '?'} × ${deviceInfo.windowHeight || '?'}</span></div>
                <div class="info-row"><span class="label">أنوية المعالج:</span><span class="value">${deviceInfo.cpuCores || 'غير معروف'}</span></div>
                <div class="info-row"><span class="label">الذاكرة:</span><span class="value">${deviceInfo.ram || 'غير متاح'}</span></div>
                <div class="info-row"><span class="label">دعم اللمس:</span><span class="value">${deviceInfo.touchSupport ? '✅ نعم' : '❌ لا'}</span></div>
                <div class="info-row"><span class="label">المنصة:</span><span class="value">${deviceInfo.platform || 'غير معروف'}</span></div>
            </div>
            
            <div class="info-section">
                <h3>🌐 معلومات الشبكة</h3>
                <div class="info-row">
                    <span class="label">عنوان IP:</span>
                    <span class="value"><strong>${data.ipAddress || 'غير معروف'}</strong></span>
                </div>
                <div class="info-row"><span class="label">حالة الاتصال:</span><span class="value">${UIUtils.getOnlineBadge(deviceInfo.online)}</span></div>
                <div class="info-row"><span class="label">نوع الاتصال:</span><span class="value">${deviceInfo.connectionType || 'غير متاح'}</span></div>
            </div>
            
            ${location ? `
                <div class="info-section">
                    <h3>📍 الموقع الجغرافي</h3>
                    <div class="info-row"><span class="label">خط العرض:</span><span class="value">${location.lat}</span></div>
                    <div class="info-row"><span class="label">خط الطول:</span><span class="value">${location.lng}</span></div>
                    <div class="info-row"><span class="label">الدقة:</span><span class="value">${Math.round(location.accuracy || 0)} متر</span></div>
                    <div class="info-row"><span class="label">تاريخ التحديد:</span><span class="value">${UIUtils.formatFullTime(location.timestamp)}</span></div>
                    <div class="modal-actions">
                        <button class="btn" onclick="UIUtils.openGoogleMaps(${location.lat}, ${location.lng})">🗺️ فتح في Google Maps</button>
                        <button class="btn btn-secondary" onclick="UIUtils.copyToClipboard('${location.lat}, ${location.lng}')">📋 نسخ الإحداثيات</button>
                    </div>
                </div>
            ` : `
                <div class="info-section">
                    <h3>📍 الموقع الجغرافي</h3>
                    <div class="info-box warning">
                        <span class="icon">⏳</span>
                        <span>المستخدم لم يوافق على تحديد الموقع بعد</span>
                    </div>
                </div>
            `}
            
            <div class="info-section">
                <h3>🕐 وقت الزيارة</h3>
                <div class="info-row"><span class="label">أول زيارة:</span><span class="value">${UIUtils.formatFullTime(deviceInfo.firstVisit)}</span></div>
                <div class="info-row"><span class="label">آخر زيارة:</span><span class="value">${UIUtils.formatFullTime(data.lastUpdate)}</span></div>
            </div>
            
            <div class="info-section">
                <h3>🔗 User Agent</h3>
                <div class="info-box info">
                    <span style="font-size:11px; word-break:break-all;">${deviceInfo.userAgent || 'غير متوفر'}</span>
                </div>
            </div>
        `;
        
        document.getElementById('userDetails').innerHTML = details;
        UIUtils.openModal('userModal');
    },

    async copyUserInfo(id) {
        const user = DataManager.getUser(id);
        if (!user) return;
        
        const data = user.data || {};
        const location = data.location;
        
        const info = `=== معلومات المستخدم ===
المعرف: ${id}
النقاط: ${user.points || 0}
الجهاز: ${data.deviceInfo?.deviceType || 'غير معروف'}
النظام: ${data.deviceInfo?.os || 'غير معروف'}
المتصفح: ${data.deviceInfo?.browser || 'غير معروف'}
IP: ${data.ipAddress || 'غير معروف'}
الموقع: ${location ? `${location.lat}, ${location.lng}` : 'غير محدد'}
آخر زيارة: ${UIUtils.formatFullTime(data.lastUpdate)}`;
        
        await UIUtils.copyToClipboard(info);
    },

    exportCSV() {
        const users = DataManager.filterUsers(this.currentFilters).map(([id, user]) => {
            const data = user?.data || {};
            const deviceInfo = data.deviceInfo || {};
            const location = data.location;
            
            return {
                'المعرف': id,
                'نوع الجهاز': deviceInfo.deviceType || '',
                'نظام التشغيل': deviceInfo.os || '',
                'المتصفح': deviceInfo.browser || '',
                'الإصدار': deviceInfo.browserVersion || '',
                'IP': data.ipAddress || '',
                'النقاط': user.points || 0,
                'خط العرض': location?.lat || '',
                'خط الطول': location?.lng || '',
                'الدقة': location?.accuracy || '',
                'الاتصال': deviceInfo.online ? 'متصل' : 'غير متصل',
                'نوع الاتصال': deviceInfo.connectionType || '',
                'أول زيارة': deviceInfo.firstVisit || '',
                'آخر زيارة': data.lastUpdate || ''
            };
        });
        
        UIUtils.exportToCSV(users, 'users');
    },

    exportJSON() {
        const users = DataManager.filterUsers(this.currentFilters).map(([id, user]) => ({
            id, ...user
        }));
        
        UIUtils.exportToJSON(users, 'users');
    }
};
