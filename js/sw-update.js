// Service worker'ı kaydeder ve yeni sürüm yayınlanınca açık sayfayı bir kez yeniler,
// böylece eski kod ile yeni sayfa karışık çalışmaz. Hem oda hem Deniz paneli kullanır.
export function setupServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // İlk kurulumda yenileme gerekmez; sadece eski sürümün yerini yenisi alınca.
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then(reg => {
    // Uygulama uzun süre açık kalırsa (telefonda) geri dönüldüğünde güncelleme kontrolü.
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
