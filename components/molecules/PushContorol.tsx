"use client";
import Button from "@/components/atoms/Button";
import { urlBase64ToUint8Array } from "@/lib/urlBase64ToUnit8Array";
import { useState } from "react";

export default function PushTest() {
  const [sub, setSub] = useState<any>(null);

  // ステップ3の購読処理
  const handleSubscribe = async () => {
    if (!("Notification" in window)) {
      alert("Notification APIが未対応です");
      return;
    }
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("通知権限が許可されていません");
        return;
      }
    }
    if (Notification.permission !== "granted") {
      alert("通知権限が許可されていません");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      )
    });
    setSub(subscription); // 取得した情報をステートに保存
  };

  // ★ ここに提示されたコードを書きます
  const sendNotification = async (subscription: any) => {

    await fetch('/api/push', {
      method: 'POST',
      body: JSON.stringify({
        subscription,
        title: 'イラストが届いているよ！',
        body: '確認してね！'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    alert("通知リクエストを送信しました！アプリを閉じて待ってください。");
  };

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      <Button onClick={handleSubscribe}
        value="1. 購読（Subscribe）する"
      />

      <Button onClick={() => sendNotification(sub)}
        value="2. テスト通知を送る"
      />
    </div>
  );
}