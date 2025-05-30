// استيراد Firebase من SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";

// إعدادات Firebase (ضع بيانات مشروعك هنا)
const firebaseConfig = {
    apiKey: "AIzaSyAxoC6esP0bRsZ5i5--RBTpPeTTVOhoD1Y",
    authDomain: "radwan-zello.firebaseapp.com",
    databaseURL: "https://radwan-zello-default-rtdb.firebaseio.com",
    projectId: "radwan-zello",
    storageBucket: "radwan-zello.firebasestorage.app",
    messagingSenderId: "610135917058",
    appId: "1:610135917058:web:593bcd470bf91d80269d1b"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

// عناصر HTML
const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");

// متغيرات التسجيل
let mediaRecorder;
let audioChunks = [];

// تحقق من صلاحية الميكروفون (يطلبها مرة واحدة فقط)
async function checkMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        alert("يرجى السماح باستخدام الميكروفون لتتمكن من التسجيل.");
        return false;
    }
}

// بدء التسجيل عند الضغط مطولاً
recordBtn.addEventListener("mousedown", async () => {
    const allowed = await checkMicrophonePermission();
    if (!allowed) return;

    audioChunks = [];
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = e => {
            audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];

            // تحويل إلى Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result;

                // إرسال البيانات إلى Firebase
                push(messagesRef, {
                    audio: base64Audio,
                    timestamp: Date.now()
                });
            };
            reader.readAsDataURL(audioBlob);

            statusText.textContent = "تم إرسال التسجيل.";
        };

        mediaRecorder.start();
        statusText.textContent = "التسجيل جارٍ... حرر الزر للإيقاف.";
    } catch (err) {
        statusText.textContent = "حدث خطأ في تسجيل الصوت.";
        console.error(err);
    }
});

// إيقاف التسجيل عند رفع الضغط
recordBtn.addEventListener("mouseup", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        statusText.textContent = "جاري الإرسال...";
    }
});

// دعم إيقاف التسجيل لو حدث رفع الضغط خارج الزر
recordBtn.addEventListener("mouseleave", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        statusText.textContent = "جاري الإرسال...";
    }
});

// تشغيل الأصوات المستقبلة من الآخرين
onChildAdded(messagesRef, snapshot => {
    const message = snapshot.val();
    if (message.audio) {
        const audio = new Audio(message.audio);
        audio.play();
    }
});
