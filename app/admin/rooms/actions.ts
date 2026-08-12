"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteRoom(id: string): Promise<void> {
  if (!id) return;

  try {
    await prisma.room.delete({
      where: { id },
    });

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to delete room:", error);
  }
}
