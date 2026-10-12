"use server";

import { getComponentSource } from "@/lib/component-source";
import { getComponent } from "@/lib/component-registry";

/** Public catalog source is loaded only when a visitor opens the Code tab. */
export async function loadComponentSource(slug: string) {
  if (typeof slug !== "string" || !getComponent(slug)) {
    return { success: false as const };
  }
  return { success: true as const, source: getComponentSource(slug) };
}
