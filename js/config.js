// Firebase projesi: guzinin-odasi (Firebase konsolu > Proje ayarları > Uygulamalar > oda).
// Bu anahtarlar gizli değildir; odaya kimin girebileceğini Firestore kuralları belirler.
// firebaseConfig = null yapılırsa site "yerel mod"da çalışır (veriler sadece o tarayıcıda).
export const firebaseConfig = {
  apiKey: "AIzaSyByS1nI67vTJblyWl6TUSeYCEuJLSA_MsQ",
  authDomain: "guzinin-odasi.firebaseapp.com",
  projectId: "guzinin-odasi",
  storageBucket: "guzinin-odasi.firebasestorage.app",
  messagingSenderId: "860546714284",
  appId: "1:860546714284:web:add4648f17420d38daed09"
};

// Veritabanındaki oda belgesinin adı (rooms/guzin).
export const ROOM_ID = 'guzin';

// Deneme için adrese ?yerel eklenirse gerçek oda yerine bu tarayıcıdaki
// boş bir deneme odası açılır (Firebase'e hiç dokunmaz).
export const LOCAL_MODE = !firebaseConfig || new URLSearchParams(location.search).has('yerel');
