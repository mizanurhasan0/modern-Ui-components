/** Run lightweight gallery frames only while their card and the page are visible. */
export function startThumbnailPlayback(
  element: HTMLElement,
  onFrame: () => void,
  paused = false,
  interval = 2600,
): () => void {
  element.dataset.running = "false";
  if (paused || typeof IntersectionObserver === "undefined") return () => {};

  let visible = false;
  let disposed = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  function synchronize() {
    if (disposed) return;
    const running = visible && !document.hidden;
    element.dataset.running = String(running);
    if (running && timer === undefined) timer = setInterval(onFrame, interval);
    else if (!running && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
    synchronize();
  }, { threshold: [0, 0.15] });

  observer.observe(element);
  document.addEventListener("visibilitychange", synchronize);

  return () => {
    disposed = true;
    observer.disconnect();
    document.removeEventListener("visibilitychange", synchronize);
    if (timer !== undefined) clearInterval(timer);
    element.dataset.running = "false";
  };
}
