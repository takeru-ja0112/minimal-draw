import { usePathname } from "next/navigation";

/**
 * 現在のルートが特定ルート条件に一致しているか確認する
 * フッターの表示条件を制御するために使用する。
 */
export const CurrentRootingCheck = () => {
    const root = [
        "/room/*/drawing",
    ];

    const pathname = usePathname();

    if (!pathname) return false;

    const isCheckPage = root.some((r) => {
        // 正規表現の特殊文字をエスケープし、* をパスセグメント一致 ([^/]+) に変換
        const escaped = r.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        const pattern = escaped.replace(/\*/g, "[^/]+");
        const regex = new RegExp(`^${pattern}/?$`);
        return regex.test(pathname);
    });

    return isCheckPage;
};