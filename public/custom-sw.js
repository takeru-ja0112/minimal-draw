// public/sw.js

// プッシュイベントを受け取った時の処理
self.addEventListener('push', function (event) {
  console.log('Pushイベントを受信しました');

  let data = { title: '通知です', body: '新着メッセージがあります' };

  if (event.data) {
    try {
      // サーバーから送られてきたJSONを解析
      data = event.data.json();
    } catch (e) {
      // JSONでない場合はテキストとして取得
      data = { title: '通知', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // あなたのアプリのアイコンパス
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],   // 振動パターン
    data: {
      dateOfArrival: Date.now(),
    },
  };

  // ★重要：通知表示（Promiseを渡す）
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
// self.addEventListener('push', function (event) {
//     // クライアント（PWA画面）へメッセージ送信
//   self.clients.matchAll().then(clients => {
//     clients.forEach(client => {
//       client.postMessage({ type: 'push', data });
//     });
//   });

//   event.waitUntil(
//     self.registration.showNotification("強制表示テスト", { body: "届いています！" })
//   );
// });

// 通知をクリックした時の処理（任意）
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // 通知をクリックしたらアプリを開く
  );
});