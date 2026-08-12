"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteHistoryDrawing(id: string): Promise<void> {
  if (!id) return;

  try {
    await prisma.historyDrawing.delete({
      where: { id },
    });

    revalidatePath("/admin/history-drawings");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to delete history drawing:", error);
  }
}
