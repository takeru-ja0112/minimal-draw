import { usePathname } from "next/navigation";

/**
 * 現在のルートが特定ルート条件に一致しているか確認する
 * フッターの表示条件を制御するために使用する。
 */
export const CurrentRootingCheck = () => {
    const root = [
        "/drawing",
    ]

    const pathname = usePathname();

    if (root.includes(pathname)) {
        return true;
    }
    return false;
}