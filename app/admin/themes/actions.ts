"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTheme(formData: FormData): Promise<void> {
  const theme = formData.get("theme") as string;
  const level = formData.get("level") as string;
  const genre = formData.get("genre") as string;
  const kanji = formData.get("kanji") as string;
  const katakana = formData.get("katakana") as string;
  const furigana = formData.get("furigana") as string;

  if (!theme || !level || !genre || !kanji || !katakana || !furigana) {
    return;
  }

  try {
    await prisma.theme.create({
      data: {
        theme,
        level,
        genre,
        kanji,
        katakana,
        furigana,
      },
    });

    revalidatePath("/admin/themes");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to create theme:", error);
  }
}

export async function deleteTheme(id: number): Promise<void> {
  if (!id) return;

  try {
    await prisma.theme.delete({
      where: { id },
    });

    revalidatePath("/admin/themes");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Failed to delete theme:", error);
  }
}
