// ============================================
// ===== firebase-config.js - إعدادات Firebase =====
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyD8jLXCopW1Klgm97FdHrY7VzpcrFE2s9s",
    authDomain: "switgame-a4227.firebaseapp.com",
    databaseURL: "https://switgame-a4227-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "switgame-a4227",
    storageBucket: "switgame-a4227.firebasestorage.app",
    messagingSenderId: "871810794908",
    appId: "1:871810794908:web:a55a81099041c74b1fb459"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// قائمة الهدايا المتاحة
const GIFTS = [
    { id: 1, name: 'شاحن هاتف', icon: '🔌', points: 100 },
    { id: 2, name: 'سماعات بلوتوث', icon: '🎧', points: 200 },
    { id: 3, name: 'ساعة ذكية', icon: '⌚', points: 500 },
    { id: 4, name: 'جهاز لوحي', icon: '📱', points: 1000 },
    { id: 5, name: 'لابتوب', icon: '💻', points: 2000 },
    { id: 6, name: 'PlayStation 5', icon: '🎮', points: 3000 }
];

// مراقبة حالة الاتصال
db.ref('.info/connected').on('value', (snap) => {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        if (snap.val() === true) {
            statusEl.innerHTML = '<div class="status-dot"></div><span>متصل بـ Firebase</span>';
        } else {
            statusEl.innerHTML = '<div class="status-dot offline"></div><span>غير متصل</span>';
        }
    }
});

console.log('✅ تم تهيئة Firebase بنجاح');
