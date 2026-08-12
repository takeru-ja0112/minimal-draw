"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteUser(id: string): Promise<void> {
  if (!id) return;

  try {
    await prisma.mUser.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to delete user:", error);
  }
}
