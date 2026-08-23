import { createElement } from "react";
import { getIconComponent, DEFAULT_ICON_COLOR } from "@/utils/Icons";

export default function UserIcon({
    iconName,
    iconColor,
    size = 24,
    className,
}: {
    iconName?: string | null;
    iconColor?: string | null;
    size?: number;
    className?: string;
}) {
    const Icon = getIconComponent(iconName);
    if (!Icon) return null;

    return createElement(Icon, {
        size,
        color: iconColor || DEFAULT_ICON_COLOR,
        className,
    });
}
