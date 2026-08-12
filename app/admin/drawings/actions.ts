"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteDrawing(id: string): Promise<void> {
  if (!id) return;

  try {
    await prisma.drawing.delete({
      where: { id },
    });

    revalidatePath("/admin/drawings");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to delete drawing:", error);
  }
}
