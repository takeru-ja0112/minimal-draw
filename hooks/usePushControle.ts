"use client";
import {
    subscribePush,
    unsubscribePush,
} from "@/app/room/[id]/answer/action";
import { urlBase64ToUint8Array } from "@/lib/urlBase64ToUnit8Array";
import { useState } from "react";

const SUBSCRIBE =
    "3hkmvpw-faawd-hjyuievsa";

/**
 * PWA対応用のフックス
 */
export default function usePushControl(
    roomId: string,
) {
    const localSubscription =
        localStorage.getItem(SUBSCRIBE);

    const roomSubscription =
        localSubscription
            ? JSON.parse(
                  localSubscription,
              ).roomId === roomId
                ? localSubscription
                : null
            : null;

    const localUserId =
        localStorage.getItem(
            "drawing_app_user_id",
        );

    const [sub, setSub] =
        useState<PushSubscription | null>(
            roomSubscription
                ? JSON.parse(
                      roomSubscription,
                  )
                : null,
        );

    /**
     * プッシュ通知の購読
     */
    const handleSubscribe =
        async () => {
            if (
                !(
                    "Notification" in
                    window
                )
            ) {
                return {
                    success: false,
                    error: "Notification API not supported",
                };
            }

            if (
                Notification.permission ===
                "default"
            ) {
                const permission =
                    await Notification.requestPermission();
                if (
                    permission !==
                    "granted"
                ) {
                    return {
                        success: false,
                        error: "Notification permission denied",
                    };
                }
            }

            if (
                Notification.permission !==
                "granted"
            ) {
                return {
                    success: false,
                    error: "Notification permission denied",
                };
            }

            const registration =
                await navigator
                    .serviceWorker
                    .ready;
            const existingSubscription =
                await registration.pushManager.getSubscription();
            const subscription =
                existingSubscription ??
                (await registration.pushManager.subscribe(
                    {
                        userVisibleOnly: true,
                        applicationServerKey:
                            urlBase64ToUint8Array(
                                process
                                    .env
                                    .NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
                            ),
                    },
                ));
            setSub(subscription); // 取得した情報をステートに保存
            localStorage.setItem(
                SUBSCRIBE,
                JSON.stringify({
                    sub: subscription,
                    roomId: roomId,
                }),
            );
            await subscribePush(
                localUserId!,
                roomId,
                subscription,
            );
            return { success: true };
        };

    const handleDeleteSubscription =
        async () => {
            const registration =
                await navigator
                    .serviceWorker
                    .ready;
            const subscription =
                await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setSub(null);
                localStorage.removeItem(
                    SUBSCRIBE,
                );
                await unsubscribePush(
                    localUserId!,
                );
                return {
                    success: true,
                };
            }
        };

    // // ★ ここに提示されたコードを書きます
    // const sendNotification = async (subscription: any) => {
    //   //   alert('送信ボタンが押されました。宛先情報'+ JSON.stringify(subscription));
    //   console.log('送信されました。宛先情報' + JSON.stringify(subscription));
    //   await fetch('/api/push', {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       subscription,
    //       title: 'イラストが届いているよ！',
    //       body: '確認してね！'
    //     }),
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    //   //   alert("通知リクエストを送信しました！アプリを閉じて待ってください。");
    // };

    return {
        sub,
        // sendNotification,
        handleSubscribe,
        handleDeleteSubscription,
    };
}
