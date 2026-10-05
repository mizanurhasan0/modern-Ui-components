"use server";

import { getComponentSource } from "@/lib/component-source";
import { getComponent } from "@/lib/component-registry";

const componentCodePassword = "pylot";

export async function unlockComponentSource(slug: string, password: string) {
  if (
    typeof slug !== "string" ||
    typeof password !== "string" ||
    password !== componentCodePassword ||
    !getComponent(slug)
  ) {
    return { success: false as const };
  }

  return {
    success: true as const,
    source: getComponentSource(slug),
  };
}
