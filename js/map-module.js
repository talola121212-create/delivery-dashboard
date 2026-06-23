// ============================================
// ===== map-module.js - وحدة الخريطة =====
// ============================================

const MapModule = {
    map: null,
    markers: {},
    heatmapEnabled: false,

    // تهيئة الخريطة
    init() {
        if (this.map) return;
        
        this.map = L.map('deliveryMap').setView([33.3, 44.3], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(this.map);
        
        // إضافة عناصر التحكم
        this.addControls();
    },

    // إضافة عناصر التحكم
    addControls() {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'map-controls';
        controlDiv.innerHTML = `
            <button class="map-control-btn" onclick="MapModule.centerMap()" title="توسيط">🎯</button>
            <button class="map-control-btn" onclick="MapModule.zoomIn()" title="تقريب">➕</button>
            <button class="map-control-btn" onclick="MapModule.zoomOut()" title="تبعيد">➖</button>
            <button class="map-control-btn" onclick="MapModule.toggleHeatmap()" title="خريطة حرارية">🔥</button>
        `;
        
        const mapContainer = document.getElementById('deliveryMap');
        if (mapContainer) {
            mapContainer.style.position = 'relative';
            mapContainer.appendChild(controlDiv);
        }
    },

    // عرض الخريطة
    render() {
        if (!this.map) this.init();
        
        // إزالة العلامات القديمة
        Object.values(this.markers).forEach(m => this.map.removeLayer(m));
        this.markers = {};
        
        const usersWithLocation = DataManager.getUsersWithLocation();
        
        if (usersWithLocation.length === 0) {
            this.showMessage();
            return;
        }
        
        this.hideMessage();
        
        usersWithLocation.forEach(([id, user]) => {
            const loc = user.data.location;
            const deviceInfo = user.data.deviceInfo || {};
            const deviceIcon = UIUtils.getDeviceIcon(deviceInfo.deviceType);
            
            // تحديد لون العلامة
            const pendingDelivery = Object.entries(DataManager.allDeliveries).find(([_, d]) => 
                d.userId === id && d.status === 'pending'
            );
            
            const delivered = Object.entries(DataManager.allDeliveries).find(([_, d]) => 
                d.userId === id && d.status === 'delivered'
            );
            
            let markerColor = '#10b981'; // أخضر
            if (pendingDelivery) markerColor = '#f59e0b'; // برتقالي
            else if (delivered) markerColor = '#8b5cf6'; // بنفسجي
            else if (!deviceInfo.online) markerColor = '#ef4444'; // أحمر
            
            const marker = L.marker([loc.lat, loc.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `
                        <div style="position:relative;">
                            <div class="marker-pulse" style="background:${markerColor}40;"></div>
                            <div style="background:${markerColor}; width:35px; height:35px; border-radius:50%; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:18px; position:relative; z-index:2;">
                                ${deviceIcon}
                            </div>
                        </div>
                    `,
                    iconSize: [35, 35],
                    iconAnchor: [17, 17]
                })
            }).addTo(this.map);
            
            // محتوى النافذة المنبثقة
            const popupContent = this.createPopupContent(id, user, pendingDelivery);
            marker.bindPopup(popupContent, { maxWidth: 300 });
            
            this.markers[id] = marker;
        });
        
        // تكبير الخريطة لتناسب جميع العلامات
        const markerArray = Object.values(this.markers);
        if (markerArray.length > 0) {
            const group = new L.featureGroup(markerArray);
            this.map.fitBounds(group.getBounds().pad(0.2));
        }
        
        // تحديث إحصائيات الخريطة
        this.updateMapStats();
    },

    // إنشاء محتوى النافذة المنبثقة
    createPopupContent(id, user, pendingDelivery) {
        const data = user.data || {};
        const deviceInfo = data.deviceInfo || {};
        const location = data.location;
        const deviceIcon = UIUtils.getDeviceIcon(deviceInfo.deviceType);
        
        return `
            <div class="user-popup">
                <div class="popup-header">
                    <div class="popup-icon">${deviceIcon}</div>
                    <div>
                        <div class="popup-title">${deviceInfo.deviceType || 'مستخدم'}</div>
                        <div style="font-size:11px; color:#6b7280;">${deviceInfo.os || ''}</div>
                    </div>
                </div>
                <div class="popup-info">🌐 IP: <strong>${data.ipAddress || 'غير معروف'}</strong></div>
                <div class="popup-info">⭐ النقاط: <strong>${user.points || 0}</strong></div>
                <div class="popup-info">🎯 الدقة: ${Math.round(location.accuracy || 0)}م</div>
                <div class="popup-info">🕐 ${UIUtils.formatTime(data.lastUpdate)}</div>
                ${pendingDelivery ? `
                    <div style="background:#fef3c7; padding:8px; border-radius:6px; font-size:12px; color:#92400e; margin:8px 0;">
                        📦 طلب معلق: <strong>${pendingDelivery[1].giftName}</strong>
                    </div>
                ` : ''}
                <div class="popup-actions">
                    <button class="popup-btn primary" onclick="UIUtils.openGoogleMaps(${location.lat}, ${location.lng})">🗺️ Google Maps</button>
                    <button class="popup-btn secondary" onclick="UsersModule.viewUser('${id}')">👁️ التفاصيل</button>
                </div>
            </div>
        `;
    },

    // إظهار رسالة
    showMessage() {
        const mapContainer = document.getElementById('deliveryMap');
        if (!document.getElementById('mapMessage')) {
            const msgDiv = document.createElement('div');
            msgDiv.id = 'mapMessage';
            msgDiv.className = 'map-message';
            msgDiv.innerHTML = `
                <div class="icon">📍</div>
                <h3>لا يوجد مواقع بعد</h3>
                <p>لم يوافق أي مستخدم على تحديد الموقع حتى الآن</p>
            `;
            mapContainer.appendChild(msgDiv);
        }
    },

    // إخفاء الرسالة
    hideMessage() {
        const msg = document.getElementById('mapMessage');
        if (msg) msg.remove();
    },

    // تحديث إحصائيات الخريطة
    updateMapStats() {
        const mapContainer = document.getElementById('deliveryMap');
        let statsDiv = document.getElementById('mapStats');
        
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.id = 'mapStats';
            statsDiv.className = 'map-stats';
            mapContainer.appendChild(statsDiv);
        }
        
        const total = DataManager.getValidUsers().length;
        const located = DataManager.getUsersWithLocation().length;
        const percentage = total > 0 ? Math.round((located / total) * 100) : 0;
        
        statsDiv.innerHTML = `
            <h4>📊 إحصائيات الخريطة</h4>
            <div class="map-stat-row">
                <span>إجمالي المستخدمين:</span>
                <strong>${total}</strong>
            </div>
            <div class="map-stat-row">
                <span>محدد موقعهم:</span>
                <strong>${located}</strong>
            </div>
            <div class="map-stat-row">
                <span>النسبة:</span>
                <strong>${percentage}%</strong>
            </div>
        `;
    },

    // توسيط الخريطة
    centerMap() {
        const markerArray = Object.values(this.markers);
        if (markerArray.length > 0) {
            const group = new L.featureGroup(markerArray);
            this.map.fitBounds(group.getBounds().pad(0.2));
        } else {
            this.map.setView([33.3, 44.3], 6);
        }
    },

    // تقريب
    zoomIn() {
        this.map.zoomIn();
    },

    // تبعيد
    zoomOut() {
        this.map.zoomOut();
    },

    // تبديل الخريطة الحرارية
    toggleHeatmap() {
        this.heatmapEnabled = !this.heatmapEnabled;
        UIUtils.showToast(
            this.heatmapEnabled ? '🔥 تم تفعيل الخريطة الحرارية' : '🗺️ تم إلغاء الخريطة الحرارية',
            'success'
        );
        // يمكن إضافة heatmap plugin هنا
    }
};
