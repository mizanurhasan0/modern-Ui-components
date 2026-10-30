import type { JsonLdData } from "@/lib/structured-data";

/** Renders structured data for search engines. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
