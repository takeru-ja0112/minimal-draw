"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteDrawing(id: string): Promise<void> {
  if (!id) return;

  try {
    const drawing = await prisma.historyDrawing.findUnique({
      where: { id },
      select: { deleted_at: true },
    });

    if (!drawing) return;

    if (drawing.deleted_at === null) {
      await prisma.historyDrawing.update({
        where: { id },
        data: { deleted_at: new Date() },
      });
    } else {
      await prisma.historyDrawing.update({
        where: { id },
        data: { deleted_at: null },
      });
    }

    revalidatePath("/admin/drawings");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to delete drawing:", error);
  }
}