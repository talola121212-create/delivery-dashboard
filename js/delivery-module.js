// ============================================
// ===== delivery-module.js - النسخة المُصلحة =====
// ============================================

const DeliveryModule = {
    render() {
        const tbody = document.getElementById('deliveriesTableBody');
        if (!tbody) return;
        
        const deliveries = Object.entries(DataManager.allDeliveries || {});
        
        if (deliveries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <div class="icon">📦</div>
                        <h3>لا توجد طلبات توصيل</h3>
                        <p>أنشئ طلب توصيل من قائمة المستخدمين</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        deliveries.sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));
        
        tbody.innerHTML = deliveries.map(([id, delivery]) => {
            const statusBadge = delivery.status === 'pending' 
                ? '<span class="badge warning">⏳ قيد التوصيل</span>'
                : delivery.status === 'delivered' 
                ? '<span class="badge success">✅ تم التوصيل</span>'
                : '<span class="badge error">❌ ملغي</span>';
            
            return `
                <tr>
                    <td><small>#${id.substring(0, 8)}</small></td>
                    <td><strong>${delivery.customerName || 'غير معروف'}</strong></td>
                    <td><a href="tel:${delivery.customerPhone}" style="color:#3b82f6;">${delivery.customerPhone || '-'}</a></td>
                    <td>${delivery.giftIcon || ''} ${delivery.giftName || 'غير معروف'}</td>
                    <td><small>${delivery.address || 'غير محدد'}</small></td>
                    <td>${statusBadge}</td>
                    <td><small>${UIUtils.formatTime(delivery.timestamp)}</small></td>
                    <td>
                        <div style="display:flex; gap:3px; flex-wrap:wrap;">
                            ${delivery.status === 'pending' ? `
                                <button class="btn btn-sm btn-success" onclick="DeliveryModule.markDelivered('${id}')">✅ تسليم</button>
                                <button class="btn btn-sm" style="background:#dc2626;" onclick="UIUtils.openGoogleMaps(${delivery.lat}, ${delivery.lng})">🗺️</button>
                                <button class="btn btn-sm btn-danger" onclick="DeliveryModule.cancelDelivery('${id}')">❌</button>
                            ` : `
                                <button class="btn btn-sm" style="background:#6b7280;" onclick="DeliveryModule.viewDelivery('${id}')">👁️</button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openForm(userId) {
        const user = DataManager.getUser(userId);
        if (!user) return;
        
        const data = user.data || {};
        const location = data.location;
        const deviceInfo = data.deviceInfo || {};
        
        if (!location) {
            UIUtils.showToast('⚠️ المستخدم لم يوافق على تحديد الموقع بعد', 'warning');
            return;
        }
        
        const giftsOptions = GIFTS.map(g => 
            `<option value="${g.id}">${g.icon} ${g.name} (${g.points} نقطة)</option>`
        ).join('');
        
        const form = `
            <div class="info-box info">
                <span class="icon">👤</span>
                <div>
                    <strong>معلومات المستخدم</strong><br>
                    <small>
                        📱 ${deviceInfo.deviceType || 'غير معروف'} - ${deviceInfo.os || ''}<br>
                        🌐 IP: ${data.ipAddress || 'غير معروف'}<br>
                        ⭐ النقاط: <strong>${user.points || 0}</strong><br>
                        📍 الموقع: <strong style="color:#10b981;">✓ محدد</strong>
                    </small>
                </div>
            </div>
            
            <form onsubmit="DeliveryModule.submit(event, '${userId}')">
                <div class="delivery-form">
                    <h3>🎁 اختر الهدية</h3>
                    <div class="form-group">
                        <label>الهدية المطلوبة *</label>
                        <select id="deliveryGift" required>
                            <option value="">-- اختر الهدية --</option>
                            ${giftsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>اسم المستلم *</label>
                        <input type="text" id="deliveryName" required placeholder="الاسم الكامل">
                    </div>
                    <div class="form-group">
                        <label>رقم الهاتف *</label>
                        <input type="tel" id="deliveryPhone" required placeholder="07xxxxxxxx">
                    </div>
                    <div class="form-group">
                        <label>العنوان التفصيلي *</label>
                        <textarea id="deliveryAddress" required placeholder="الشارع، رقم الدار..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>ملاحظات للسائق</label>
                        <input type="text" id="deliveryNotes" placeholder="مثال: اتصل قبل الوصول">
                    </div>
                    <div class="info-box warning">
                        <span class="icon">📍</span>
                        <span>سيتم استخدام الموقع المحدد مسبقاً من المستخدم لتوجيه السائق</span>
                    </div>
                    <button type="submit" class="submit-btn">🚚 إنشاء طلب التوصيل</button>
                </div>
            </form>
        `;
        
        document.getElementById('deliveryForm').innerHTML = form;
        UIUtils.openModal('deliveryModal');
    },

    openNewForm() {
        const usersWithLocation = DataManager.getUsersWithLocation();
        if (usersWithLocation.length === 0) {
            UIUtils.showToast('⚠️ لا يوجد مستخدمون بموقع محدد', 'warning');
            return;
        }
        
        const options = usersWithLocation.map(([id, user]) => {
            const deviceInfo = user.data?.deviceInfo || {};
            return `<option value="${id}">${UIUtils.getDeviceIcon(deviceInfo.deviceType)} ${id.substring(0, 30)}...</option>`;
        }).join('');
        
        const form = `
            <div class="form-group">
                <label>اختر المستخدم *</label>
                <select id="deliveryUserSelect" required onchange="DeliveryModule.openForm(this.value); UIUtils.closeModal('deliveryModal');">
                    <option value="">-- اختر مستخدم --</option>
                    ${options}
                </select>
            </div>
        `;
        
        document.getElementById('deliveryForm').innerHTML = form;
        UIUtils.openModal('deliveryModal');
    },

    async submit(event, userId) {
        event.preventDefault();
        
        const user = DataManager.getUser(userId);
        const location = user.data.location;
        const giftId = parseInt(document.getElementById('deliveryGift').value);
        const gift = GIFTS.find(g => g.id === giftId);
        
        const delivery = {
            userId: userId,
            customerName: document.getElementById('deliveryName').value.trim(),
            customerPhone: document.getElementById('deliveryPhone').value.trim(),
            address: document.getElementById('deliveryAddress').value.trim(),
            notes: document.getElementById('deliveryNotes').value.trim(),
            giftId: gift.id,
            giftName: gift.name,
            giftIcon: gift.icon,
            giftPoints: gift.points,
            lat: location.lat,
            lng: location.lng,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        try {
            const newRef = db.ref('deliveries').push();
            await newRef.set(delivery);
            
            UIUtils.closeModal('deliveryModal');
            UIUtils.showToast('✅ تم إنشاء طلب التوصيل بنجاح!', 'success');
            UIUtils.addNotification('📦 طلب توصيل جديد', `${gift.name} إلى ${delivery.customerName}`, 'new-delivery');
            
            DataManager.loadAllData();
        } catch (error) {
            console.error('خطأ:', error);
            UIUtils.showToast('❌ فشل إنشاء الطلب', 'error');
        }
    },

    async markDelivered(id) {
        if (!confirm('✅ هل تم تسليم الهدية فعلياً؟')) return;
        
        try {
            await db.ref(`deliveries/${id}`).update({
                status: 'delivered',
                deliveredAt: new Date().toISOString()
            });
            
            UIUtils.showToast('✅ تم تسجيل التسليم', 'success');
            UIUtils.addNotification('✅ تم التوصيل', `تم تسليم الطلب #${id.substring(0, 8)}`, 'delivered');
            
            DataManager.loadAllData();
        } catch (error) {
            UIUtils.showToast('❌ خطأ في التحديث', 'error');
        }
    },

    async cancelDelivery(id) {
        if (!confirm('❌ هل تريد إلغاء هذا الطلب؟')) return;
        
        try {
            await db.ref(`deliveries/${id}`).update({
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
            });
            
            UIUtils.showToast('❌ تم إلغاء الطلب', 'warning');
            DataManager.loadAllData();
        } catch (error) {
            UIUtils.showToast('❌ خطأ', 'error');
        }
    },

    viewDelivery(id) {
        const delivery = DataManager.allDeliveries[id];
        if (!delivery) return;
        
        const form = `
            <div class="info-section">
                <h3>📦 معلومات الطلب</h3>
                <div class="info-row"><span class="label">رقم الطلب:</span><span class="value">#${id}</span></div>
                <div class="info-row"><span class="label">الهدية:</span><span class="value">${delivery.giftIcon} ${delivery.giftName}</span></div>
                <div class="info-row"><span class="label">القيمة:</span><span class="value">${delivery.giftPoints} نقطة</span></div>
                <div class="info-row"><span class="label">الحالة:</span><span class="value">${delivery.status}</span></div>
                <div class="info-row"><span class="label">التاريخ:</span><span class="value">${UIUtils.formatFullTime(delivery.timestamp)}</span></div>
            </div>
            
            <div class="info-section">
                <h3>👤 معلومات المستلم</h3>
                <div class="info-row"><span class="label">الاسم:</span><span class="value">${delivery.customerName}</span></div>
                <div class="info-row"><span class="label">الهاتف:</span><span class="value"><a href="tel:${delivery.customerPhone}">${delivery.customerPhone}</a></span></div>
                <div class="info-row"><span class="label">العنوان:</span><span class="value">${delivery.address}</span></div>
                ${delivery.notes ? `<div class="info-row"><span class="label">ملاحظات:</span><span class="value">${delivery.notes}</span></div>` : ''}
            </div>
            
            <div class="info-section">
                <h3>📍 الموقع</h3>
                <div class="info-row"><span class="label">الإحداثيات:</span><span class="value">${delivery.lat}, ${delivery.lng}</span></div>
                <button class="btn" onclick="UIUtils.openGoogleMaps(${delivery.lat}, ${delivery.lng})" style="width:100%; margin-top:10px;">🗺️ فتح في Google Maps</button>
            </div>
        `;
        
        document.getElementById('deliveryForm').innerHTML = form;
        UIUtils.openModal('deliveryModal');
    }
};
