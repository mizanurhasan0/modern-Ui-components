import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[65vh] max-w-[600px] flex-col items-center justify-center px-5 py-20 text-center sm:px-8"
    >
      <p className="font-mono text-xs tracking-[0.2em] text-[#4666ee]">
        404 / NOT FOUND
      </p>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#171922] sm:text-5xl">
        A little off the grid.
      </h1>
      <p className="mt-4 max-w-[340px] text-sm leading-7 text-[#737783]">
        This page doesn’t exist. Head back to the collection and find something
        worth building with.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#4666ee] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3454dc]"
      >
        <span aria-hidden="true">←</span>
        Back to components
      </Link>
    </main>
  );
}
