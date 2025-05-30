const startListeningTimestamp = Date.now();

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxoC6esP0bRsZ5i5--RBTpPeTTVOhoD1Y",
  authDomain: "radwan-zello.firebaseapp.com",
  databaseURL: "https://radwan-zello-default-rtdb.firebaseio.com",
  projectId: "radwan-zello",
  storageBucket: "radwan-zello.firebasestorage.app",
  messagingSenderId: "610135917058",
  appId: "1:610135917058:web:593bcd470bf91d80269d1b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

// توليد معرف عشوائي لجهاز المستخدم (يتم مرة واحدة)
const clientId = Math.random().toString(36).substring(2) + Date.now().toString(36);

const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");

let mediaRecorder;
let audioChunks = [];

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

recordBtn.addEventListener("mousedown", async () => {
  const allowed = await checkMicrophonePermission();
  if (!allowed) return;

  audioChunks = [];
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = e => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;

        // نرسل clientId مع الصوت لتمييز المرسل
        push(messagesRef, {
          audio: base64Audio,
          timestamp: Date.now(),
          senderId: clientId
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

recordBtn.addEventListener("mouseup", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    statusText.textContent = "جاري الإرسال...";
  }
});

recordBtn.addEventListener("mouseleave", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    statusText.textContent = "جاري الإرسال...";
  }
});

onChildAdded(messagesRef, snapshot => {
  const message = snapshot.val();
  if (message.audio && message.timestamp >= startListeningTimestamp) {
    if (message.senderId !== clientId) {
      const audio = new Audio(message.audio);
      audio.play();
    }
  }
});

