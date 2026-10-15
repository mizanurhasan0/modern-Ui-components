type OpenHandler = (trigger: HTMLElement) => void;

let openHandler: OpenHandler | null = null;
let pendingTrigger: HTMLElement | null = null;

export function openPreviewFullscreen(trigger: HTMLElement) {
  if (openHandler) openHandler(trigger);
  else pendingTrigger = trigger;
}

export function registerPreviewFullscreen(handler: OpenHandler) {
  openHandler = handler;
  if (pendingTrigger?.isConnected) handler(pendingTrigger);
  pendingTrigger = null;

  return () => {
    if (openHandler === handler) openHandler = null;
  };
}
