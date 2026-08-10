import { prisma } from "@/lib/prisma";

export async function getArts() {
    try {
        const data = await prisma.historyDrawing.findMany({
            orderBy: { created_at: "desc" },
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
