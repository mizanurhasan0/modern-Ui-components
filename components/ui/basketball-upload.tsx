"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent } from "react";

export interface BasketballUploadProps {
  /** Receives each file after the demo progress animation starts. */
  onUpload?: (file: File) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  initialUploadedCount?: number;
  className?: string;
}

type UploadState = "idle" | "aiming" | "launching" | "uploading" | "success" | "error";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A playful drag-and-drop upload card with a basketball hoop target. */
export default function BasketballUpload({
  onUpload,
  accept = "*/*",
  multiple = true,
  initialUploadedCount = 2,
  className = "",
}: BasketballUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const [aimPoint, setAimPoint] = useState({ x: 72, y: 510 });
  const [shotOrigin, setShotOrigin] = useState({ x: 48, y: 510 });
  const [isDemoAiming, setIsDemoAiming] = useState(false);
  const queueRef = useRef<File[]>([]);
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoActiveRef = useRef(false);
  const demoCountedRef = useRef(false);
  const demoTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("2.4 MB");
  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(Math.max(0, initialUploadedCount));
  const [queuedCount, setQueuedCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);

  function toggleSound() {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    if (!next) return;
    try {
      audioContextRef.current ??= new AudioContext();
      void audioContextRef.current.resume();
    } catch {
      // Sound is an optional enhancement; upload behavior still works without Web Audio.
    }
  }

  function playChime() {
    const context = audioContextRef.current;
    if (!soundEnabledRef.current || !context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.setValueAtTime(990, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }

  useEffect(() => {
    mountedRef.current = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!onUpload && !reducedMotion) {
      demoActiveRef.current = true;
      const pause = (duration: number) => new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          demoTimeoutsRef.current = demoTimeoutsRef.current.filter((queued) => queued !== timeout);
          resolve();
        }, duration);
        demoTimeoutsRef.current.push(timeout);
      });
      const playDemo = async () => {
        while (mountedRef.current && demoActiveRef.current) {
          setFileName("document.pdf");
          setFileSize("2.4 MB");
          setProgress(0);
          setIsDemoAiming(true);
          setUploadState("aiming");
          await pause(850);
          if (!mountedRef.current || !demoActiveRef.current) break;
          setIsDemoAiming(false);
          setShotOrigin({ x: 48, y: 510 });
          setUploadState("launching");
          await pause(1050);
          if (!mountedRef.current || !demoActiveRef.current) break;

          setProgress(4);
          setUploadState("uploading");
          let currentProgress = 4;
          timerRef.current = setInterval(() => {
            currentProgress = Math.min(92, currentProgress + Math.max(2, Math.round((96 - currentProgress) / 7)));
            if (mountedRef.current) setProgress(currentProgress);
          }, 100);
          await pause(700);
          if (!mountedRef.current || !demoActiveRef.current) break;
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;

          setProgress(100);
          setUploadState("success");
          playChime();
          if (!demoCountedRef.current) {
            demoCountedRef.current = true;
            setUploadedCount((count) => count + 1);
          }
          await pause(2200);
          if (!mountedRef.current || !demoActiveRef.current) break;
          setUploadState("idle");
          setFileName("");
          setFileSize("2.4 MB");
          setProgress(0);
          await pause(450);
        }
      };
      void playDemo();
    }
    return () => {
      mountedRef.current = false;
      demoActiveRef.current = false;
      setIsDemoAiming(false);
      demoTimeoutsRef.current.forEach(clearTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") void audioContextRef.current.close();
    };
  }, [onUpload]);

  async function processQueue() {
    if (busyRef.current) return;
    busyRef.current = true;

    while (queueRef.current.length && mountedRef.current) {
      const file = queueRef.current.shift();
      if (!file) continue;
      setQueuedCount(queueRef.current.length);
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setProgress(0);
      setUploadState("launching");
      setStatusMessage(`Uploading ${file.name}.`);

      await new Promise((resolve) => setTimeout(resolve, 1050));
      if (!mountedRef.current) return;
      setProgress(4);
      setUploadState("uploading");

      let currentProgress = 4;
      timerRef.current = setInterval(() => {
        currentProgress = Math.min(92, currentProgress + Math.max(1, Math.round((96 - currentProgress) / 9)));
        if (mountedRef.current) setProgress(currentProgress);
      }, 100);

      try {
        if (onUpload) {
          await onUpload(file);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1150));
        }
        if (!mountedRef.current) return;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setProgress(100);
        setUploadState("success");
        setUploadedCount((count) => count + 1);
        playChime();
        setStatusMessage(`${file.name} uploaded successfully.`);
        await new Promise((resolve) => setTimeout(resolve, 2200));
      } catch {
        if (!mountedRef.current) return;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setUploadState("error");
        setStatusMessage(`${file.name} could not be uploaded. Please try again.`);
        queueRef.current = [];
        setQueuedCount(0);
        break;
      }
    }

    busyRef.current = false;
    if (mountedRef.current && queueRef.current.length === 0) {
      // Keep the success row visible briefly, then return the hoop to its ready state.
      setTimeout(() => {
        if (!mountedRef.current || busyRef.current) return;
        setUploadState((state) => state === "success" ? "idle" : state);
        setProgress(0);
        setFileName("");
        setFileSize("2.4 MB");
        setStatusMessage("");
      }, 80);
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    if (demoActiveRef.current) {
      demoActiveRef.current = false;
      setIsDemoAiming(false);
      demoTimeoutsRef.current.forEach(clearTimeout);
      demoTimeoutsRef.current = [];
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const files = Array.from(fileList);
    queueRef.current.push(...files);
    setQueuedCount(queueRef.current.length);
    void processQueue();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.currentTarget.files);
    // Let the same file be selected again after an error or a completed upload.
    event.currentTarget.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function stopDemo() {
    demoActiveRef.current = false;
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsDemoAiming(false);
  }

  function pointInCard(event: PointerEvent<HTMLButtonElement>) {
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return aimPoint;
    return {
      x: Math.max(22, Math.min(470, (event.clientX - bounds.left) / bounds.width * 492)),
      y: Math.max(115, Math.min(560, (event.clientY - bounds.top) / bounds.height * 612)),
    };
  }

  function startAim(event: PointerEvent<HTMLButtonElement>) {
    if (busyRef.current || uploadState === "launching" || uploadState === "uploading") return;
    stopDemo();
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setAimPoint(pointInCard(event));
    setFileName("document.pdf");
    setFileSize("2.4 MB");
    setUploadState("aiming");
  }

  function moveAim(event: PointerEvent<HTMLButtonElement>) {
    if (pointerRef.current !== event.pointerId) return;
    setAimPoint(pointInCard(event));
  }

  function releaseAim(event: PointerEvent<HTMLButtonElement>) {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    setShotOrigin(pointInCard(event));
    event.currentTarget.releasePointerCapture(event.pointerId);
    queueRef.current.push(new File(["Basketball upload interaction demo"], "document.pdf", { type: "application/pdf" }));
    void processQueue();
  }

  function keyboardShot() {
    if (busyRef.current) return;
    stopDemo();
    setShotOrigin({ x: 72, y: 510 });
    queueRef.current.push(new File(["Basketball upload interaction demo"], "document.pdf", { type: "application/pdf" }));
    void processQueue();
  }

  const shotPath = `M ${shotOrigin.x} ${shotOrigin.y} C ${shotOrigin.x + 45} ${Math.min(shotOrigin.y - 230, 220)}, 224 116, 246 320 L 246 360`;
  const aimPath = `M ${aimPoint.x} ${aimPoint.y} C ${aimPoint.x + 45} ${Math.min(aimPoint.y - 230, 220)}, 224 116, 246 320`;
  const isAiming = uploadState === "aiming";
  const isUploading = uploadState === "launching" || uploadState === "uploading";
  const showUploadRow = uploadState === "uploading" || uploadState === "success" || uploadState === "error";
  const fileExtension = fileName.includes(".") ? fileName.split(".").pop()?.slice(0, 4).toUpperCase() : "FILE";

  return (
    <section className={`basketball-upload ${className}`} aria-label="Basketball file upload">
      <style>{BASKETBALL_UPLOAD_STYLES}</style>
      <div className="bu-stage">
        <div className="bu-card-shell">
        <div ref={cardRef} className="bu-card" data-state={uploadState} data-demo-aiming={isDemoAiming}>
          <header className="bu-header">
            <div>
              <h2>Upload files</h2>
              <p>Drag and drop, or take the shot.</p>
            </div>
            <div className="bu-header-actions">
              <button className="bu-sound" type="button" onClick={toggleSound} aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"} aria-pressed={soundEnabled} title={soundEnabled ? "Mute sound effects" : "Enable sound effects"}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8v4h3l4 3V5L6 8H3Z" /><path d={soundEnabled ? "M13 7a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" : "m13 8 4 4m0-4-4 4"} /></svg>
              </button>
              <span className="bu-count" aria-label={`${uploadedCount} files uploaded`}>
                <span className="bu-count-dot" aria-hidden="true" />
                Uploaded <strong>{uploadedCount}</strong>
              </span>
            </div>
          </header>

          <input
            ref={inputRef}
            id={inputId}
            className="bu-file-input"
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            aria-label="Choose files to upload"
          />

          <button
            className="bu-dropzone"
            type="button"
            data-dragging={isDragging}
            data-state={uploadState}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={handleDragOver}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
            }}
            onDrop={handleDrop}
            aria-describedby={`${inputId}-hint`}
            aria-label="Choose files or drag files here to upload"
            aria-busy={isUploading}
          >
            <span className="bu-drop-copy">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" /></svg>
              <strong>{isDragging ? "Release to shoot!" : uploadState === "error" ? "Try another shot" : "Drop files here"}</strong>
              <span id={`${inputId}-hint`}>or take the shot</span>
            </span>
            <span className="bu-hoop" aria-hidden="true">
              <svg viewBox="0 0 112 124" fill="none">
                <path d="M28 4h56v44H28z" fill="#fff" stroke="#d9deeb" strokeWidth="2" />
                <path d="M35 11h42v31H35z" fill="#f8f9fd" stroke="#5267ed" strokeWidth="2.5" />
                <path d="M22 47c0-5 15-9 34-9s34 4 34 9-15 9-34 9-34-4-34-9Z" fill="#fff" stroke="#4458e8" strokeWidth="3" />
                <path d="M22 47c0 5 15 9 34 9s34-4 34-9" stroke="#4458e8" strokeWidth="2" />
                <path d="m26 51 10 57m8-54 4 59m16-59-4 59m16-62-10 57M33 56l12 47m34-47-12 47M25 67c12 7 42 7 62 0M28 81c13 7 38 7 56 0M31 95c12 6 31 6 49 0" stroke="#98a0b2" strokeWidth="1.5" />
              </svg>
            </span>
            {showUploadRow && (
              <span className="bu-upload-row" aria-hidden="true">
                <span className="bu-file-icon bu-file-icon-small"><span>{fileExtension}</span></span>
                <span className="bu-upload-info">
                  <span className="bu-upload-line">
                    <span className="bu-upload-name">{fileName || "document.pdf"}</span>
                    <span className={`bu-progress-value${uploadState === "success" ? " bu-done" : ""}`}>{uploadState === "success" ? "Done" : uploadState === "error" ? "Retry" : `${progress}%`}</span>
                  </span>
                  <span className="bu-progress-track"><span style={{ width: `${progress}%` }} /></span>
                  <span className="bu-upload-line">
                    <span className={`bu-upload-caption${uploadState === "error" ? " bu-upload-error" : ""}`}>{uploadState === "success" ? "✓ File uploaded successfully" : uploadState === "error" ? "Upload failed. Try again." : "Uploading file…"}</span>
                    <span className="bu-upload-size">{fileSize}</span>
                  </span>
                </span>
              </span>
            )}
          </button>

          <div className="bu-footer">
            <p>{isAiming ? "Release to shoot!" : "Aim the file & release to shoot into the basket"}</p>
            {queuedCount > 0 && <span className="bu-queue-count" aria-hidden="true">+{queuedCount}</span>}
          </div>

          <svg className="bu-trajectory" viewBox="0 0 492 612" aria-hidden="true">
            <path d={isDemoAiming ? "M 48 510 C 93 220, 224 116, 246 320" : aimPath} />
          </svg>
          <button
            className="bu-file-tile"
            type="button"
            aria-label="Drag the sample file, then release to shoot it into the basket"
            data-aiming={isAiming}
            onPointerDown={startAim}
            onPointerMove={moveAim}
            onPointerUp={releaseAim}
            onPointerCancel={() => { pointerRef.current = null; setUploadState("idle"); }}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); keyboardShot(); } }}
            style={isAiming && !isDemoAiming ? { left: `${aimPoint.x / 492 * 100}%`, top: `${aimPoint.y / 612 * 100}%` } : undefined}
          >
            <span className="bu-file-fold" />
            <span className="bu-file-lines" />
            <span className="bu-file-tag">PDF</span>
          </button>
          <svg className="bu-shot-trail" viewBox="0 0 492 612" aria-hidden="true"><path d={shotPath} /></svg>
          {uploadState === "launching" && (
            <svg className="bu-file-flight" viewBox="0 0 492 612" aria-hidden="true">
              <g>
                <animateMotion dur=".85s" path={shotPath} calcMode="spline" keyTimes="0;1" keySplines=".2 .5 .4 1" fill="freeze" />
                <path d="M-17-26H8L20-14V25H-17Z" fill="white" stroke="#e0e4ec" strokeWidth="1.5" />
                <path d="M8-26v12h12" fill="#edf0f6" stroke="#e0e4ec" strokeWidth="1.5" />
                <path d="M-10-13H3m-13 5H5m-15 5H1" stroke="#d5dae5" strokeWidth="1.5" />
                <rect x="-11" y="9" width="25" height="11" rx="2" fill="#4267d9" />
                <text x="1.5" y="17" fill="white" fontSize="7" textAnchor="middle" fontWeight="700">{fileExtension}</text>
              </g>
            </svg>
          )}
          <p className="bu-live" role={uploadState === "error" ? "alert" : "status"} aria-live="polite">{statusMessage}</p>
        </div>
        </div>
      </div>
    </section>
  );
}

const BASKETBALL_UPLOAD_STYLES = `
.basketball-upload{container-type:inline-size;min-width:0;background:#eceef2;color:#252832;font-family:Arial,Helvetica,sans-serif;isolation:isolate}
.basketball-upload *{box-sizing:border-box}
.basketball-upload .bu-stage{min-height:698px;display:grid;place-items:center;padding:40px 20px 46px;background:#eceef2}
.basketball-upload .bu-card-shell{container-type:inline-size;width:min(492px,calc(100cqw - 40px))}
.basketball-upload .bu-card{position:relative;display:flex;width:100%;aspect-ratio:492/612;flex-direction:column;padding:5.69cqw;border:1px solid #e5e8ef;border-radius:5.3cqw;background:#f7f8fc;box-shadow:0 20px 35px #4a536714,0 3px 8px #58637c0a;overflow:hidden}
.basketball-upload .bu-header{display:flex;flex:0 0 auto;align-items:flex-start;justify-content:space-between;gap:1.6cqw;margin-bottom:5.1cqw}
.basketball-upload .bu-header h2{margin:0;color:#252832;font-size:4.47cqw;font-weight:700;letter-spacing:-.04em}
.basketball-upload .bu-header p{margin:1.62cqw 0 0;color:#858b99;font-size:2.44cqw;line-height:1.4}
.basketball-upload .bu-header-actions{display:flex;align-items:center;gap:1.6cqw;margin-top:.2cqw}
.basketball-upload .bu-sound{display:grid;width:6.1cqw;height:6.1cqw;flex:0 0 6.1cqw;place-items:center;border:1px solid #e5e8ef;border-radius:50%;background:#f0f2f7;color:#8490a2;padding:0;cursor:pointer}
.basketball-upload .bu-sound:hover,.basketball-upload .bu-sound:focus-visible{color:#5265e8;outline:2px solid #6779ef;outline-offset:2px}
.basketball-upload .bu-sound svg{width:3.25cqw;height:3.25cqw;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.basketball-upload .bu-count{display:inline-flex;align-items:center;gap:.8cqw;white-space:nowrap;border:1px solid #d3d9e5;border-radius:999px;background:#e0e6ef;padding:1.83cqw 2.44cqw;color:#5d687b;font-size:2.24cqw;line-height:1}
.basketball-upload .bu-count strong{color:#505a6d;font-weight:700}
.basketball-upload .bu-card[data-state=success] .bu-count{background:#e4e7ff;border-color:#bbc4ef}
.basketball-upload .bu-count-dot{display:none}
.basketball-upload .bu-file-input{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.basketball-upload .bu-dropzone{position:relative;display:block;width:100%;height:44.72cqw;flex:0 0 44.72cqw;padding:2cqw;border:2px dashed #d1d5df;border-radius:4.47cqw;background:#ffffffc9;color:inherit;text-align:center;cursor:pointer;transition:border-color .2s ease,background .2s ease,box-shadow .2s ease;overflow:visible}
.basketball-upload .bu-dropzone:hover,.basketball-upload .bu-dropzone:focus-visible{border-color:#9a9ae7;outline:none}
.basketball-upload .bu-dropzone:focus-visible{outline:2px solid #6575ef;outline-offset:3px}
.basketball-upload .bu-dropzone[data-dragging=true]{border-color:#8889e6;background:#f6f7ff;box-shadow:0 0 0 4px #6575ef18}
.basketball-upload .bu-drop-copy{position:absolute;top:4.47cqw;left:1.6cqw;right:1.6cqw;z-index:1;display:flex;flex-direction:column;align-items:center;gap:1.42cqw;color:#737b8b;font-size:2.44cqw;pointer-events:none}
.basketball-upload .bu-drop-copy svg{width:4.47cqw;height:4.47cqw;margin-bottom:.6cqw;fill:none;stroke:#222b3c;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.basketball-upload .bu-drop-copy strong{color:#252a35;font-size:2.85cqw;font-weight:700}
.basketball-upload .bu-drop-copy span{font-size:2.44cqw;color:#a0a5b1}
.basketball-upload .bu-hoop{position:absolute;z-index:5;left:50%;top:calc(100% - 15.24cqw);width:22.76cqw;height:25.2cqw;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 4px 3px #272d3a08)}
.basketball-upload .bu-hoop svg{width:100%;height:100%;overflow:visible}
.basketball-upload .bu-file-icon{position:relative;display:grid;place-items:end center;width:20px;height:27px;padding-bottom:2px;border:1px solid #e7e9ef;border-radius:3px;background:linear-gradient(145deg,#fff 0 79%,#e8ebf2 80%);box-shadow:0 3px 6px #272d3a16}
.basketball-upload .bu-file-icon::before,.basketball-upload .bu-file-icon::after{position:absolute;left:4px;right:5px;height:1px;background:#dce0e8;content:""}
.basketball-upload .bu-file-icon::before{top:7px}.basketball-upload .bu-file-icon::after{top:10px}
.basketball-upload .bu-file-icon>span{position:relative;z-index:1;max-width:17px;overflow:hidden;text-overflow:ellipsis;border-radius:2px;background:#4267d9;padding:1px 2px;color:#fff;font-size:4px;font-weight:700;line-height:1}
.basketball-upload .bu-file-flight,.basketball-upload .bu-trajectory,.basketball-upload .bu-shot-trail{position:absolute;inset:0;z-index:4;width:100%;height:100%;pointer-events:none;overflow:visible}
.basketball-upload .bu-file-flight g{filter:drop-shadow(0 6px 9px #3a3e5324);animation:bu-shot-fade .88s linear both}
.basketball-upload .bu-trajectory path,.basketball-upload .bu-shot-trail path{fill:none;stroke:#7e83eb;stroke-width:2.1;stroke-linecap:round;stroke-dasharray:0 23;opacity:.7}
.basketball-upload .bu-trajectory{opacity:0}
.basketball-upload .bu-card[data-state=aiming] .bu-trajectory{opacity:1}
.basketball-upload .bu-shot-trail{opacity:0}
.basketball-upload .bu-card[data-state=launching] .bu-shot-trail{animation:bu-trail .9s linear both}
.basketball-upload .bu-card[data-state=launching] .bu-hoop{animation:bu-hoop-pop .38s .7s ease-out both}
.basketball-upload .bu-upload-row{position:absolute;z-index:6;top:1.62cqw;left:1.62cqw;right:1.62cqw;display:flex;align-items:flex-start;gap:1.22cqw;min-height:12.2cqw;padding:1.62cqw 1.83cqw;border:1px solid #e8eaf0;border-radius:2.85cqw;background:#fff;box-shadow:0 4px 9px #343c5210;text-align:left;animation:bu-row-in .2s ease both}
.basketball-upload .bu-file-icon-small{display:grid;place-items:center;width:3.86cqw;height:2.24cqw;flex:0 0 3.86cqw;border:0;border-radius:.6cqw;padding:0;margin-top:.2cqw;background:#eef2ff;box-shadow:none}
.basketball-upload .bu-file-icon-small::before,.basketball-upload .bu-file-icon-small::after{display:none}
.basketball-upload .bu-file-icon-small>span{max-width:none;padding:0;color:#586bc5;background:transparent;font-size:1.42cqw}
.basketball-upload .bu-upload-info{display:flex;min-width:0;flex:1;flex-direction:column;gap:1.02cqw}
.basketball-upload .bu-upload-line{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:1.02cqw}
.basketball-upload .bu-upload-name{overflow:hidden;color:#3d4555;font-size:1.83cqw;font-weight:600;text-overflow:ellipsis;white-space:nowrap}
.basketball-upload .bu-progress-track{display:block;width:calc(100% + 5.08cqw);height:.81cqw;margin-left:-5.08cqw;overflow:hidden;border-radius:99px;background:#e8eaf2}
.basketball-upload .bu-progress-track>span{display:block;height:100%;border-radius:inherit;background:#6555ef;transition:width .1s linear}
.basketball-upload .bu-upload-caption{margin-left:-5.08cqw;color:#747de0;font-size:1.62cqw}
.basketball-upload .bu-upload-error{color:#c6535d}
.basketball-upload .bu-upload-size{flex:0 0 auto;color:#a0a5b1;font-size:1.62cqw}
.basketball-upload .bu-progress-value{min-width:4.27cqw;color:#6c76da;font-size:1.62cqw;text-align:right}
.basketball-upload .bu-progress-value.bu-done{color:#27925f}
.basketball-upload .bu-dropzone[data-state=success] .bu-upload-row{border-color:#d9efe3}
.basketball-upload .bu-dropzone[data-state=success] .bu-progress-track>span{background:#30ae72}
.basketball-upload .bu-dropzone[data-state=success] .bu-upload-caption{color:#27925f}
.basketball-upload .bu-footer{position:relative;display:flex;flex:1;min-height:0;align-items:flex-end;justify-content:center;padding:0 1.02cqw}
.basketball-upload .bu-footer p{margin:0;color:#929aa8;font-size:2.24cqw;line-height:1.5;text-align:center}
.basketball-upload .bu-file-tile{position:absolute;z-index:7;left:14.63%;top:83.33%;display:block;width:8.13cqw;height:10.57cqw;padding:0;border:1px solid #e7e9ef;border-radius:1.02cqw;background:linear-gradient(145deg,#fff 0 78%,#e8ebf2 79%);box-shadow:0 6px 10px #272d3a1c;transform:translate(-50%,-50%) rotate(-6deg);cursor:grab;touch-action:none}
.basketball-upload .bu-file-tile:focus-visible{outline:2px solid #6b69e2;outline-offset:5px}
.basketball-upload .bu-file-tile[data-aiming=true]{cursor:grabbing;box-shadow:0 10px 20px #272d3a25}
.basketball-upload .bu-card[data-demo-aiming=true] .bu-file-tile{animation:bu-demo-aim .85s ease-in-out both}
.basketball-upload .bu-card[data-state=launching] .bu-file-tile{opacity:0;pointer-events:none}
.basketball-upload .bu-file-fold{position:absolute;right:0;top:0;width:2.44cqw;height:2.44cqw;background:linear-gradient(45deg,#e9ecf3 50%,#fff 51%);border-left:1px solid #e7e9ef;border-bottom:1px solid #e7e9ef}
.basketball-upload .bu-file-lines{position:absolute;top:2.44cqw;left:1.22cqw;width:4.47cqw;height:2.24cqw;border-top:1px solid #dce0e8;border-bottom:1px solid #dce0e8}
.basketball-upload .bu-file-tag{position:absolute;bottom:1.22cqw;left:1.02cqw;border-radius:.6cqw;background:#4267d9;padding:.4cqw .61cqw;color:#fff;font-size:1.42cqw;font-weight:700;line-height:1}
.basketball-upload .bu-queue-count{position:absolute;left:10.16cqw;bottom:9.76cqw;display:grid;place-items:center;width:2.64cqw;height:2.64cqw;border-radius:50%;background:#e8ebff;color:#5969df;font-size:1.22cqw;font-weight:700}
.basketball-upload .bu-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@keyframes bu-demo-aim{0%{left:63%;top:70%;transform:translate(-50%,-50%) rotate(12deg)}40%{left:22%;top:77%;transform:translate(-50%,-50%) rotate(8deg)}100%{left:9.76%;top:83.33%;transform:translate(-50%,-50%) rotate(-8deg)}}
@keyframes bu-shot-fade{0%,86%{opacity:1}100%{opacity:0}}
@keyframes bu-trail{0%{opacity:.7}70%{opacity:.6}100%{opacity:0}}
@keyframes bu-hoop-pop{0%{transform:translateX(-50%) scale(1)}45%{transform:translateX(-50%) scale(1.04,.92)}100%{transform:translateX(-50%) scale(1)}}
@keyframes bu-row-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
@container(max-width:560px){.basketball-upload .bu-stage{min-height:0;padding:24px 20px}.basketball-upload .bu-card-shell{width:calc(100cqw - 40px)}}
@media(prefers-reduced-motion:reduce){.basketball-upload *,.basketball-upload *::before,.basketball-upload *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}.basketball-upload .bu-file-flight{display:none}}
`;
