// タイ語単語帳 Service Worker
// バージョンを変えると自動更新される（更新時はこの数字を上げる）
const CACHE_VERSION = 'thai-flashcard-v52';
const ASSETS = [
  './',
  './index.html',
  './words.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// ページからの skipWaiting 要求に応答（更新の即時反映）
self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

// インストール時：ファイルをキャッシュ
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // すぐ新バージョンを有効化
});

// 有効化時：古いキャッシュを削除
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// リクエスト時：ネットワーク優先、失敗したらキャッシュ（オフライン対応）
// index.htmlは常に最新を取りにいく（Network First）
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname.endsWith('/');

  if (isHTML) {
    // HTML: ネットワーク優先 → 最新版を取得、オフライン時のみキャッシュ
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
  } else {
    // その他（アイコン等）: キャッシュ優先
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request))
    );
  }
});
