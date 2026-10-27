// Veri katmanı. İki arka uç aynı arayüzü sunar:
//  - yerel: localStorage (Firebase ayarlanmadan önce deneme için)
//  - bulut: Firebase Firestore + Google girişi (telefon ve bilgisayar eşitlenir)
//
// Bütün oda tek bir belgede tutulur: rooms/<ROOM_ID>.
// Değişiklikler "ops" listesiyle yapılır: [['todos.abc.done', true], ['hearts', INC(1)]]
// Her işlem sadece kendi alanına dokunduğu için iki cihaz aynı anda yazsa da
// birbirinin verisini ezmez.

import { firebaseConfig, ROOM_ID } from './config.js';

export const INC = n => ({ __op: 'inc', n });
export const DEL = { __op: 'del' };

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';

export async function createStore() {
  return firebaseConfig ? cloudStore() : localStore();
}

const clone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

function applyLocal(obj, path, val) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof o[parts[i]] !== 'object' || o[parts[i]] === null) o[parts[i]] = {};
    o = o[parts[i]];
  }
  const k = parts[parts.length - 1];
  if (val && val.__op === 'del') delete o[k];
  else if (val && val.__op === 'inc') o[k] = (typeof o[k] === 'number' ? o[k] : 0) + val.n;
  else o[k] = clone(val);
}

function localStore() {
  const KEY = 'oda_v1_' + ROOM_ID;
  let state = null;
  let h = null;
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  return {
    mode: 'local',
    start(handlers) {
      h = handlers;
      state = read();
      if (!state) { state = h.seed(); write(); }
      h.onUser({ local: true, name: 'Yerel mod' });
      h.onState(clone(state));
      // Aynı tarayıcıda açık diğer sekmeler (ör. Deniz paneli) değişince güncelle.
      addEventListener('storage', e => {
        if (e.key !== KEY || !e.newValue) return;
        try { state = JSON.parse(e.newValue); h.onState(clone(state)); } catch (err) {}
      });
    },
    async apply(ops) {
      for (const [p, v] of ops) applyLocal(state, p, v);
      write();
      h.onState(clone(state));
    },
    async signIn() {},
    async signOut() {},
  };
}

async function cloudStore() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FB + 'firebase-app.js'),
    import(FB + 'firebase-auth.js'),
    import(FB + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  let db;
  try {
    // Çevrimdışı önbellek: internet yokken de çalışır, bağlantı gelince eşitler.
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch (e) {
    db = F.getFirestore(app);
  }
  const ref = F.doc(db, 'rooms', ROOM_ID);
  let unsub = null;
  let h = null;
  const toFb = v => (v && v.__op === 'del' ? F.deleteField() : v && v.__op === 'inc' ? F.increment(v.n) : v);

  return {
    mode: 'cloud',
    start(handlers) {
      h = handlers;
      A.getRedirectResult(auth).catch(err => h.onError(err));
      A.onAuthStateChanged(auth, user => {
        if (unsub) { unsub(); unsub = null; }
        h.onUser(user ? { email: user.email, name: user.displayName, photo: user.photoURL } : null);
        if (!user) return;
        unsub = F.onSnapshot(ref, snap => {
          if (!snap.exists()) {
            // Belge hiç yoksa (ilk açılış) varsayılan odayı oluştur.
            if (!snap.metadata.fromCache) F.setDoc(ref, h.seed()).catch(err => h.onError(err));
            return;
          }
          h.onState(snap.data(), { pending: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache });
        }, err => h.onError(err));
      });
    },
    apply(ops) {
      const root = {};
      for (const [path, val] of ops) {
        const parts = path.split('.');
        let o = root;
        for (let i = 0; i < parts.length - 1; i++) o = (o[parts[i]] ??= {});
        o[parts[parts.length - 1]] = toFb(val);
      }
      return F.setDoc(ref, root, { merge: true }).catch(err => h.onError(err));
    },
    async signIn() {
      const p = new A.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      try {
        await A.signInWithPopup(auth, p);
      } catch (e) {
        const fallback = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];
        if (fallback.includes(e.code)) await A.signInWithRedirect(auth, p);
        else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') throw e;
      }
    },
    signOut: () => A.signOut(auth),
  };
}
