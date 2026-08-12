'use server';

import { prisma } from "@/lib/prisma";

export async function getArtsByCountDesc() {
    try {
        const data = await prisma.historyDrawing.findMany({
            include: { user: true },
            orderBy: { element_count: "desc" },
            take: 20,
        });

        return data;
    } catch (error) {
        console.error(
            "Error fetching arts:",
            error,
        );
        return [];
    }
}

export async function getArtsByCountAsc() {
    try {
        const data = await prisma.historyDrawing.findMany({
            include: { user: true },
            orderBy: { element_count: "asc" },
            take: 20,
        });

        return data;
    } catch (error) {
        console.error(
            "Error fetching arts:",
            error,
        );
        return [];
    }
}

// 新規: テーマ選択肢の取得（プルダウン用、重複なし・null除外）
export async function getThemeList(): Promise<string[]> {
    try {
        const data = await prisma.historyDrawing.findMany({
            where: { theme: { not: null } },
            select: { theme: true },
            distinct: ["theme"],
            orderBy: { theme: "asc" },
        });
        return data.map((d) => d.theme as string);
    } catch (error) {
        console.error("Error fetching theme list:", error);
        return [];
    }
}

// 変更: theme必須 + element_count はオプションの絞り込み条件として使う
export async function getArtsByTheme(
    theme: string,
    minElementCount?: number,
    order: "asc" | "desc" = "desc",
) {
    try {
        const data = await prisma.historyDrawing.findMany({
            include: { user: true },
            where: {
                theme,
                ...(minElementCount != null
                    ? { element_count: { gte: minElementCount } }
                    : {}),
            },
            orderBy: { element_count: order },
            take: 20,
        });
        return data;
    } catch (error) {
        console.error("Error fetching arts by theme:", error);
        return [];
    }
}