# Güzin'in Odası ♡

Buzdolabındaki post-it'lerle yapılacaklar listesi ve akşamları süslenen tatlı bir oda.

- **Buzdolabı:** Güzin günün yapacaklarını post-it olarak yapıştırır. Biten nota dokununca koparıp atar, **+1 ♡** kazanır. En az 3 notun hepsi bitince **+3 ♡** bonus gelir. "↻ Her gün" işaretli notlar her sabah yeniden çıkar.
- **Dekorasyon:** Liste bitince **ve** akşam saati gelince (varsayılan 18:00) açılır. Kalplerle dükkandan eşya, duvar kağıdı ve zemin alınır, eşyalar sürükleyip yerleştirilir.
- **Mektuplar:** Deniz panelden mektup yazar, içine kalp ya da sadece ondan gelen eşyalar (gül buketi, kalp balon, neon G ♡ D) koyar. Mektup kapının önünde zarf olarak belirir. İstersen ileri bir tarihe zamanlayabilirsin.
- **Oda yaşar:** Pencere gerçek saate göre sabah, gündüz, gün batımı ve gece olur. Gece lambalar yanar, duvar saati gerçek saati gösterir, buzdolabındaki küçük post-it'ler bitmemiş notları gösterir.

| Sayfa | Adres |
|---|---|
| Güzin'in odası | `https://deenizacar.github.io/TodolistForGuzin/` |
| Deniz paneli | `https://deenizacar.github.io/TodolistForGuzin/deniz.html` |

Deniz paneli odanın içinden linklenmez; adresi sadece sen bil.

---

## Kurulum (bir kerelik, ~15 dk)

Firebase ayarlanmadan site **yerel mod**da çalışır: her şey olur ama veriler sadece o tarayıcıda kalır. Telefonla bilgisayarın eşitlenmesi için aşağıdaki adımlar lazım.

### 1. Firebase projesi

1. <https://console.firebase.google.com> → **Proje oluştur**. Ad: `guzinin-odasi`. Google Analytics'i kapatabilirsin.
2. Proje ana sayfasında **Web** simgesine (`</>`) bas, takma ad yaz (ör. `oda`), *Firebase Hosting*'i işaretleme, kaydet.
3. Ekranda çıkan `firebaseConfig = { ... }` nesnesini kopyala ve [`js/config.js`](js/config.js) içindeki `export const firebaseConfig = null;` satırının yerine yapıştır:
   ```js
   export const firebaseConfig = {
     apiKey: "...",
     authDomain: "guzinin-odasi.firebaseapp.com",
     projectId: "guzinin-odasi",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   Bu anahtarlar gizli değildir, GitHub'da durmaları sorun olmaz. Güvenliği aşağıdaki kurallar sağlar.

### 2. Google ile giriş

1. Sol menü **Build → Authentication → Başlayın**.
2. **Sign-in method** sekmesi → **Google** → Etkinleştir → destek e-postasını seç → Kaydet.
3. **Settings → Authorized domains** → **Alan adı ekle** → `deenizacar.github.io`

### 3. Veritabanı

1. Sol menü **Build → Firestore Database → Veritabanı oluştur**.
2. Sürüm sorarsa **Standard**, konum olarak `eur3 (Europe)` ya da `europe-west3 (Frankfurt)` seç, **üretim modunda** başlat.
3. **Rules / Kurallar** sekmesine [`firestore.rules`](firestore.rules) dosyasının içeriğini yapıştır. İki e-postayı (Güzin'in ve senin Google hesabın, küçük harfle) yazıp **Yayınla**'ya bas.

Bu kural sayesinde odayı sadece siz ikiniz okuyup yazabilirsiniz. Başka biri giriş yaparsa "Kapı kilitli" ekranını görür.

### 4. GitHub Pages

1. Değişiklikleri GitHub'a gönder (`git push`).
2. GitHub'da repo → **Settings → Pages** → *Source:* **Deploy from a branch** → *Branch:* `main` ve `/ (root)` → **Save**.
3. Bir iki dakika sonra site `https://deenizacar.github.io/TodolistForGuzin/` adresinde açılır.

Ücretsiz GitHub hesabında Pages için repo'nun **public** olması gerekir. Kod herkese açık olur ama mektuplar, notlar ve oda Firebase'de, kodda değil. Repo gizli kalsın istersen siteyi Netlify'a da koyabilirsin (repo'yu bağla, derleme komutu boş, klasör `/`), bu durumda 2. adımda Netlify alan adını da yetkili alanlara ekle.

### 5. Telefona uygulama gibi ekleme

- **iPhone (Safari):** Paylaş → **Ana Ekrana Ekle**
- **Android (Chrome):** ⋮ menü → **Ana ekrana ekle** / **Uygulamayı yükle**

İlk açılışta Google ile giriş yapılır. Ana ekrandaki uygulamada giriş penceresi açılmazsa siteyi Safari/Chrome sekmesinden kullanmak her zaman çalışır.

---

## Açılış günü için öneri

Güzin'e linki vermeden önce Deniz panelinden bir **hoş geldin mektubu** bırak, içine biraz kalp (ör. 20 ♡) ve bir hediye eşya koy. Odayı ilk açtığında kapının önünde zarfı bulur.

## Yerelde deneme

```bash
python -m http.server 5173
```

Sonra <http://localhost:5173> (oda) ve <http://localhost:5173/deniz.html> (panel). Yerel modda iki sayfa aynı tarayıcıda birbirini görür. Saati denemek için adrese `?saat=21` eklenebilir (sadece yerel modda çalışır).

## Kodun haritası

| Dosya | Ne yapar |
|---|---|
| `index.html`, `js/app.js` | Güzin'in odası: buzdolabı, kalpler, dekorasyon, mektuplar |
| `deniz.html`, `js/deniz.js` | Deniz paneli |
| `js/catalog.js` | Bütün eşya çizimleri (SVG), fiyatlar, duvar kağıtları, zeminler, başlangıç odası |
| `js/room.js` | Odayı çizer (gece ışıkları, zarf, sıralama) |
| `js/logic.js` | Kurallar: gün, kilit, bonus, mektup görünürlüğü |
| `js/store.js` | Veri: yerel mod ya da Firebase (çevrimdışı önbellekli) |
| `css/style.css` | Görünüm (açık ve koyu tema) |
| `sw.js`, `manifest.webmanifest` | Ana ekrana ekleme ve çevrimdışı açılış |

Yeni eşya eklemek için `js/catalog.js` içindeki `ITEMS` listesine bir satır ve bir SVG çizimi eklemen yeterli. Fiyatlar ve bonuslar da orada (`BONUS`, `BONUS_MIN` için `js/logic.js`).
