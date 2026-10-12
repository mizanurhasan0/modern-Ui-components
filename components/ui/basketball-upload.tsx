"use client";

import { ComponentStyles } from "./component-styles";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from "react";

export interface BasketballUploadProps {
  /** Transfer a selected file. The sample shot never invokes this callback. */
  onUpload?: (file: File) => void | Promise<void>;
  onError?: (error: unknown, file: File) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  initialUploadedCount?: number;
  className?: string;
}

type UploadState =
  "idle" | "aiming" | "launching" | "uploading" | "success" | "error";
type Point = { x: number; y: number };
type UploadJob = { file: File | null; origin: Point };
type ScheduledWait = {
  timer: ReturnType<typeof setTimeout>;
  resolve: (active: boolean) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function acceptsFile(file: File, accept: string) {
  if (!accept.trim()) return true;
  return accept.split(",").some((entry) => {
    const pattern = entry.trim().toLowerCase();
    if (!pattern) return false;
    if (pattern === "*/*") return true;
    if (pattern.startsWith("."))
      return file.name.toLowerCase().endsWith(pattern);
    if (pattern.endsWith("/*"))
      return file.type.toLowerCase().startsWith(pattern.slice(0, -1));
    return file.type.toLowerCase() === pattern;
  });
}

/* Tailwind classes shared by the live component and its gallery thumbnail. */
const ui = {
  stage: "grid flex-auto place-items-center bg-[#eceef2]",
  card: "group/card relative flex aspect-[492/612] w-full flex-col overflow-hidden rounded-[5.3cqw] border border-[#e5e8ef] bg-[#f7f8fc] p-[5.69cqw] shadow-[0_20px_35px_#4a536714,0_3px_8px_#58637c0a]",
  header: "mb-[5.1cqw] flex flex-none items-start justify-between gap-[1.6cqw]",
  title: "m-0 text-[4.47cqw] font-bold tracking-[-.04em] text-[#252832]",
  subtitle:
    "mx-0 mt-[1.62cqw] mb-0 text-[2.44cqw] leading-[1.4] text-[#858b99]",
  headerActions: "mt-[.2cqw] flex items-center gap-[1.6cqw]",
  sound:
    "bu-sound grid size-[6.1cqw] flex-[0_0_6.1cqw] cursor-pointer place-items-center rounded-[50%] border border-[#e5e8ef] bg-[#f0f2f7] p-0 text-[#8490a2]",
  soundIcon:
    "size-[3.25cqw] fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]",
  count:
    "inline-flex items-center gap-[.8cqw] rounded-[999px] border border-[#d3d9e5] bg-[#e0e6ef] px-[2.44cqw] py-[1.83cqw] text-[2.24cqw] leading-none whitespace-nowrap text-[#5d687b] group-data-[state=success]/card:border-[#bbc4ef] group-data-[state=success]/card:bg-[#e4e7ff]",
  countValue: "font-bold text-[#505a6d]",
  dropzone:
    "bu-dropzone group/drop relative block h-[44.72cqw] w-full flex-[0_0_44.72cqw] cursor-pointer overflow-visible rounded-[4.47cqw] border-2 border-dashed border-[#d1d5df] bg-[#ffffffc9] p-[2cqw] text-center text-inherit transition-[border-color,background,box-shadow] duration-200 ease-[ease] hover:border-[#9a9ae7] focus-visible:border-[#9a9ae7] disabled:cursor-not-allowed disabled:opacity-55 data-[dragging=true]:border-[#8889e6] data-[dragging=true]:bg-[#f6f7ff] data-[dragging=true]:shadow-[0_0_0_4px_#6575ef18]",
  dropCopy:
    "pointer-events-none absolute inset-x-[1.6cqw] top-[4.47cqw] z-1 flex flex-col items-center gap-[1.42cqw] text-[2.44cqw] text-[#737b8b]",
  dropIcon:
    "mb-[.6cqw] size-[4.47cqw] fill-none stroke-[#222b3c] stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]",
  dropTitle: "text-[2.85cqw] font-bold text-[#252a35]",
  dropHint: "text-[2.44cqw] text-[#a0a5b1]",
  hoop: "pointer-events-none absolute top-[calc(100%-15.24cqw)] left-1/2 z-5 h-[25.2cqw] w-[22.76cqw] [filter:drop-shadow(0_4px_3px_#272d3a08)] [transform:translateX(-50%)] group-data-[state=launching]/card:animate-[bu-hoop-pop_.38s_.7s_ease-out_both]",
  uploadRow:
    "absolute inset-x-[1.62cqw] top-[1.62cqw] z-6 flex min-h-[12.2cqw] animate-[bu-row-in_.2s_ease_both] items-start gap-[1.22cqw] rounded-[2.85cqw] border border-[#e8eaf0] bg-white px-[1.83cqw] py-[1.62cqw] text-left shadow-[0_4px_9px_#343c5210] group-data-[state=success]/drop:border-[#d9efe3]",
  fileBadge:
    "relative mt-[.2cqw] grid h-[2.24cqw] w-[3.86cqw] flex-[0_0_3.86cqw] place-items-center rounded-[.6cqw] border-none bg-[#eef2ff] p-0",
  fileBadgeLabel:
    "relative z-1 max-w-none overflow-hidden rounded-[2px] bg-transparent p-0 text-[1.42cqw] leading-none font-bold text-ellipsis text-[#586bc5]",
  uploadInfo: "flex min-w-0 flex-1 flex-col gap-[1.02cqw]",
  uploadLine: "flex min-w-0 items-center justify-between gap-[1.02cqw]",
  uploadName: "truncate text-[1.83cqw] font-semibold text-[#3d4555]",
  progressValue: "min-w-[4.27cqw] text-right text-[1.62cqw]",
  progressTrack:
    "ml-[-5.08cqw] block h-[.81cqw] w-[calc(100%+5.08cqw)] overflow-hidden rounded-[99px] bg-[#e8eaf2]",
  progressBar:
    "block h-full rounded-[inherit] bg-[#6555ef] transition-[width] duration-100 ease-linear group-data-[state=success]/drop:bg-[#30ae72]",
  uploadCaption:
    "ml-[-5.08cqw] text-[1.62cqw] group-data-[state=success]/drop:text-[#27925f]",
  uploadSize: "flex-none text-[1.62cqw] text-[#a0a5b1]",
  footer: "relative flex min-h-0 flex-1 items-end justify-center px-[1.02cqw]",
  footerText: "m-0 text-center text-[2.24cqw] leading-[1.5] text-[#929aa8]",
  overlay:
    "pointer-events-none absolute inset-0 z-4 size-full overflow-visible",
  trajectoryPath:
    "fill-none stroke-[#7e83eb] stroke-[2.1] opacity-70 [stroke-dasharray:0_23] [stroke-linecap:round]",
  fileTile:
    "bu-file-tile absolute z-7 block h-[10.57cqw] w-[8.13cqw] touch-none rounded-[1.02cqw] border border-[#e7e9ef] bg-[linear-gradient(145deg,#fff_0_78%,#e8ebf2_79%)] p-0 shadow-[0_6px_10px_#272d3a1c]",
  fileTileRest:
    "top-[83.33%] left-[14.63%] [transform:translate(-50%,-50%)_rotate(-6deg)]",
  fileFold:
    "absolute top-0 right-0 size-[2.44cqw] border-b border-l border-b-[#e7e9ef] border-l-[#e7e9ef] bg-[linear-gradient(45deg,#e9ecf3_50%,#fff_51%)]",
  fileLines:
    "absolute top-[2.44cqw] left-[1.22cqw] h-[2.24cqw] w-[4.47cqw] border-y border-y-[#dce0e8]",
  fileTag:
    "absolute bottom-[1.22cqw] left-[1.02cqw] rounded-[.6cqw] bg-[#4267d9] px-[.61cqw] py-[.4cqw] text-[1.42cqw] leading-none font-bold text-white",
};

const rootClass =
  "basketball-upload flex min-w-0 flex-col isolate bg-[#eceef2] font-[Arial,Helvetica,sans-serif] text-[#252832]";

function BasketballHoop() {
  return (
    <svg
      viewBox="0 0 112 124"
      fill="none"
      className="size-full overflow-visible"
    >
      <path d="M28 4h56v44H28z" fill="#fff" stroke="#d9deeb" strokeWidth="2" />
      <path
        d="M35 11h42v31H35z"
        fill="#f8f9fd"
        stroke="#5267ed"
        strokeWidth="2.5"
      />
      <path
        d="M22 47c0-5 15-9 34-9s34 4 34 9-15 9-34 9-34-4-34-9Z"
        fill="#fff"
        stroke="#4458e8"
        strokeWidth="3"
      />
      <path
        d="M22 47c0 5 15 9 34 9s34-4 34-9"
        stroke="#4458e8"
        strokeWidth="2"
      />
      <path
        d="m26 51 10 57m8-54 4 59m16-59-4 59m16-62-10 57M33 56l12 47m34-47-12 47M25 67c12 7 42 7 62 0M28 81c13 7 38 7 56 0M31 95c12 6 31 6 49 0"
        stroke="#98a0b2"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Select actual files, or drag the sample document to play a local basketball shot. */
export default function BasketballUpload({
  onUpload,
  onError,
  accept = "*/*",
  multiple = true,
  disabled = false,
  initialUploadedCount = 2,
  className = "",
}: BasketballUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const [aimPoint, setAimPoint] = useState<Point>({ x: 72, y: 510 });
  const [shotOrigin, setShotOrigin] = useState<Point>({ x: 48, y: 510 });
  const queueRef = useRef<UploadJob[]>([]);
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const waitsRef = useRef(new Set<ScheduledWait>());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef({ onUpload, onError });
  const [isDragging, setIsDragging] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [isDemoUpload, setIsDemoUpload] = useState(true);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("2.4 MB");
  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(
    Math.max(0, initialUploadedCount),
  );
  const [queuedCount, setQueuedCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    callbacksRef.current = { onUpload, onError };
  }, [onUpload, onError]);

  useEffect(() => {
    mountedRef.current = true;
    const waits = waitsRef.current;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      waits.forEach(({ timer, resolve }) => {
        clearTimeout(timer);
        resolve(false);
      });
      waits.clear();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      queueRef.current = [];
      busyRef.current = false;
      const context = audioContextRef.current;
      if (context && context.state !== "closed")
        void context.close().catch(() => {});
    };
  }, []);

  function wait(milliseconds: number, generation: number) {
    return new Promise<boolean>((resolve) => {
      const entry: ScheduledWait = {
        timer: setTimeout(() => {
          waitsRef.current.delete(entry);
          resolve(mountedRef.current && generationRef.current === generation);
        }, milliseconds),
        resolve,
      };
      waitsRef.current.add(entry);
    });
  }

  function toggleSound() {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    if (!next) return;
    try {
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      )
        audioContextRef.current = new AudioContext();
      void audioContextRef.current.resume().catch(() => {});
    } catch {
      /* Sound is optional; file handling works without Web Audio. */
    }
  }

  function playChime() {
    const context = audioContextRef.current;
    if (!soundEnabledRef.current || !context || context.state !== "running")
      return;
    try {
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
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(now);
      oscillator.stop(now + 0.25);
    } catch {
      /* Audio failures must not turn successful transfers into errors. */
    }
  }

  async function processQueue() {
    if (busyRef.current || !mountedRef.current) return;
    busyRef.current = true;
    const generation = generationRef.current;
    const active = () =>
      mountedRef.current && generationRef.current === generation;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    try {
      while (queueRef.current.length && active()) {
        const job = queueRef.current.shift();
        if (!job) continue;
        const upload = callbacksRef.current.onUpload;
        const demo = !job.file || !upload;
        const name = job.file?.name ?? "document.pdf";
        setQueuedCount(queueRef.current.length);
        setShotOrigin(job.origin);
        setFileName(name);
        setFileSize(job.file ? formatFileSize(job.file.size) : "2.4 MB");
        setIsDemoUpload(demo);
        setProgress(0);
        setUploadState(reducedMotion ? "uploading" : "launching");
        setStatusMessage(
          demo
            ? `Playing an upload demo for ${name}. No file is sent.`
            : `Uploading ${name}.`,
        );
        if (!(await wait(reducedMotion ? 0 : 1050, generation))) return;
        setProgress(4);
        setUploadState("uploading");
        let currentProgress = 4;
        timerRef.current = setInterval(() => {
          currentProgress = Math.min(
            92,
            currentProgress +
              Math.max(1, Math.round((96 - currentProgress) / 9)),
          );
          if (active()) setProgress(currentProgress);
        }, 100);
        try {
          if (job.file && upload) await upload(job.file);
          else if (!(await wait(reducedMotion ? 0 : 1150, generation))) return;
          if (!active()) return;
          setProgress(100);
          setUploadState("success");
          setUploadedCount((count) => count + 1);
          playChime();
          setStatusMessage(
            demo
              ? `Sample shot complete for ${name}. No file was uploaded.`
              : `${name} uploaded successfully.`,
          );
        } catch (error: unknown) {
          if (!active()) return;
          setUploadState("error");
          setStatusMessage(
            `${name} could not be uploaded. Select it again to retry.`,
          );
          if (job.file) {
            try {
              callbacksRef.current.onError?.(error, job.file);
            } catch {
              /* Preserve upload recovery if consumer reporting throws. */
            }
          }
          // Leave the final failed file and its message visible until the next attempt.
          if (!queueRef.current.length) return;
        } finally {
          if (generationRef.current === generation && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
        if (!(await wait(reducedMotion ? 0 : 2200, generation))) return;
        if (!queueRef.current.length) {
          setUploadState("idle");
          setProgress(0);
          setFileName("");
          setFileSize("2.4 MB");
        }
      }
    } finally {
      if (generationRef.current === generation) busyRef.current = false;
    }
  }

  function addFiles(fileList: FileList | null) {
    if (disabled || !fileList?.length) return;
    const selected = Array.from(fileList);
    const files = (multiple ? selected : selected.slice(0, 1)).filter((file) =>
      acceptsFile(file, accept),
    );
    const rejectedCount = (multiple ? selected.length : 1) - files.length;
    if (rejectedCount) {
      setStatusMessage(
        `${rejectedCount} ${rejectedCount === 1 ? "file is" : "files are"} not accepted. Choose ${accept} files.`,
      );
      if (!files.length && !busyRef.current) {
        setFileName(selected[0].name);
        setFileSize(formatFileSize(selected[0].size));
        setProgress(0);
        setUploadState("error");
      }
    }
    if (!files.length) return;
    queueRef.current.push(
      ...files.map((file) => ({ file, origin: { x: 72, y: 510 } })),
    );
    setQueuedCount(queueRef.current.length);
    void processQueue();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    if (!disabled && event.dataTransfer.types.includes("Files"))
      setIsDragging(true);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function pointInCard(event: PointerEvent<HTMLButtonElement>): Point {
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return aimPoint;
    return {
      x: Math.max(
        22,
        Math.min(470, ((event.clientX - bounds.left) / bounds.width) * 492),
      ),
      y: Math.max(
        115,
        Math.min(560, ((event.clientY - bounds.top) / bounds.height) * 612),
      ),
    };
  }

  function startAim(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || busyRef.current || !event.isPrimary || event.button !== 0)
      return;
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setAimPoint(pointInCard(event));
    setFileName("document.pdf");
    setFileSize("2.4 MB");
    setUploadState("aiming");
  }

  function moveAim(event: PointerEvent<HTMLButtonElement>) {
    if (pointerRef.current === event.pointerId) setAimPoint(pointInCard(event));
  }

  function cancelAim(event: PointerEvent<HTMLButtonElement>) {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    setUploadState("idle");
  }

  function enqueueDemo(origin: Point) {
    if (disabled || busyRef.current) return;
    queueRef.current.push({ file: null, origin });
    void processQueue();
  }

  function releaseAim(event: PointerEvent<HTMLButtonElement>) {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    enqueueDemo(pointInCard(event));
  }

  function keyboardShot() {
    enqueueDemo({ x: 72, y: 510 });
  }

  const shotPath = `M ${shotOrigin.x} ${shotOrigin.y} C ${shotOrigin.x + 45} ${Math.min(shotOrigin.y - 230, 220)}, 224 116, 246 320 L 246 360`;
  const aimPath = `M ${aimPoint.x} ${aimPoint.y} C ${aimPoint.x + 45} ${Math.min(aimPoint.y - 230, 220)}, 224 116, 246 320`;
  const isAiming = uploadState === "aiming";
  const isUploading =
    uploadState === "launching" || uploadState === "uploading";
  const showUploadRow =
    uploadState === "uploading" ||
    uploadState === "success" ||
    uploadState === "error";
  const fileExtension = fileName.includes(".")
    ? fileName.split(".").pop()?.slice(0, 4).toUpperCase()
    : "FILE";

  return (
    <section
      className={`${rootClass} @container ${className}`}
      aria-label="Basketball file upload"
    >
      <ComponentStyles css={BASKETBALL_UPLOAD_STYLES} />
      <div
        className={`${ui.stage} min-h-[698px] px-5 pt-10 pb-[46px] [@container(max-width:560px)]:min-h-0 [@container(max-width:560px)]:pt-6 [@container(max-width:560px)]:pb-6`}
      >
        <div className="@container w-[min(492px,calc(100cqw-40px))] [@container(max-width:560px)]:w-[calc(100cqw-40px)]">
          <div ref={cardRef} className={ui.card} data-state={uploadState}>
            <header className={ui.header}>
              <div>
                <h2 className={ui.title}>Upload files</h2>
                <p className={ui.subtitle}>Drag and drop, or take the shot.</p>
              </div>
              <div className={ui.headerActions}>
                <button
                  className={ui.sound}
                  type="button"
                  onClick={toggleSound}
                  aria-label={
                    soundEnabled ? "Mute sound effects" : "Enable sound effects"
                  }
                  aria-pressed={soundEnabled}
                  title={
                    soundEnabled ? "Mute sound effects" : "Enable sound effects"
                  }
                >
                  <svg
                    className={ui.soundIcon}
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M3 8v4h3l4 3V5L6 8H3Z" />
                    <path
                      d={
                        soundEnabled
                          ? "M13 7a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10"
                          : "m13 8 4 4m0-4-4 4"
                      }
                    />
                  </svg>
                </button>
                <span
                  className={ui.count}
                  aria-label={`${uploadedCount} files uploaded`}
                >
                  <span className="hidden" aria-hidden="true" />
                  Uploaded{" "}
                  <strong className={ui.countValue}>{uploadedCount}</strong>
                </span>
              </div>
            </header>

            <input
              ref={inputRef}
              id={inputId}
              className="absolute -m-px h-px w-px overflow-hidden p-0 whitespace-nowrap [border:0] [clip:rect(0,0,0,0)]"
              type="file"
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              tabIndex={-1}
              onChange={handleInputChange}
              aria-label="Choose files to upload"
            />

            <button
              className={ui.dropzone}
              type="button"
              data-dragging={isDragging}
              data-state={uploadState}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!disabled && event.dataTransfer.types.includes("Files"))
                  setIsDragging(true);
              }}
              onDragOver={handleDragOver}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                )
                  setIsDragging(false);
              }}
              onDrop={handleDrop}
              aria-describedby={`${inputId}-hint`}
              aria-label="Choose files or drag files here to upload"
              aria-busy={isUploading}
            >
              <span className={ui.dropCopy}>
                <svg
                  className={ui.dropIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" />
                </svg>
                <strong className={ui.dropTitle}>
                  {isDragging
                    ? "Release to shoot!"
                    : uploadState === "error"
                      ? "Try another shot"
                      : "Drop files here"}
                </strong>
                <span className={ui.dropHint} id={`${inputId}-hint`}>
                  or take the shot
                </span>
              </span>
              <span className={ui.hoop} aria-hidden="true">
                <BasketballHoop />
              </span>
              {showUploadRow && (
                <span className={ui.uploadRow} aria-hidden="true">
                  <span className={ui.fileBadge}>
                    <span className={ui.fileBadgeLabel}>{fileExtension}</span>
                  </span>
                  <span className={ui.uploadInfo}>
                    <span className={ui.uploadLine}>
                      <span className={ui.uploadName}>
                        {fileName || "document.pdf"}
                      </span>
                      <span
                        className={`${ui.progressValue} ${uploadState === "success" ? "text-[#27925f]" : "text-[#6c76da]"}`}
                      >
                        {uploadState === "success"
                          ? "Done"
                          : uploadState === "error"
                            ? "Retry"
                            : `${progress}%`}
                      </span>
                    </span>
                    <span className={ui.progressTrack}>
                      <span
                        className={ui.progressBar}
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                    <span className={ui.uploadLine}>
                      <span
                        className={`${ui.uploadCaption} ${uploadState === "error" ? "text-[#c6535d]" : "text-[#747de0]"}`}
                      >
                        {uploadState === "success"
                          ? isDemoUpload
                            ? "✓ Sample shot complete"
                            : "✓ File uploaded successfully"
                          : uploadState === "error"
                            ? "Upload failed. Try again."
                            : "Uploading file…"}
                      </span>
                      <span className={ui.uploadSize}>{fileSize}</span>
                    </span>
                  </span>
                </span>
              )}
            </button>

            <div className={ui.footer}>
              <p className={ui.footerText}>
                {isAiming
                  ? "Release to shoot!"
                  : "Aim the file & release to shoot into the basket"}
              </p>
              {queuedCount > 0 && (
                <span
                  className="absolute bottom-[9.76cqw] left-[10.16cqw] grid size-[2.64cqw] place-items-center rounded-[50%] bg-[#e8ebff] text-[1.22cqw] font-bold text-[#5969df]"
                  aria-hidden="true"
                >
                  +{queuedCount}
                </span>
              )}
            </div>

            <svg
              className={`${ui.overlay} opacity-0 group-data-[state=aiming]/card:opacity-100`}
              viewBox="0 0 492 612"
              aria-hidden="true"
            >
              <path className={ui.trajectoryPath} d={aimPath} />
            </svg>
            <button
              className={`${ui.fileTile} ${ui.fileTileRest} data-[aiming=true]:shadow-[0_10px_20px_#272d3a25] ${uploadState === "launching" ? "pointer-events-none opacity-0" : "disabled:opacity-55"}`}
              type="button"
              aria-label="Drag the sample file, then release to shoot it into the basket"
              data-aiming={isAiming}
              onPointerDown={startAim}
              onPointerMove={moveAim}
              onPointerUp={releaseAim}
              onPointerCancel={cancelAim}
              onLostPointerCapture={cancelAim}
              onClick={(event) => {
                if (event.detail === 0) keyboardShot();
              }}
              disabled={disabled}
              aria-disabled={
                disabled ||
                isUploading ||
                uploadState === "success" ||
                queuedCount > 0
              }
              style={
                isAiming
                  ? {
                      left: `${(aimPoint.x / 492) * 100}%`,
                      top: `${(aimPoint.y / 612) * 100}%`,
                    }
                  : undefined
              }
            >
              <span className={ui.fileFold} />
              <span className={ui.fileLines} />
              <span className={ui.fileTag}>PDF</span>
            </button>
            <svg
              className={`${ui.overlay} opacity-0 group-data-[state=launching]/card:animate-[bu-trail_.9s_linear_both]`}
              viewBox="0 0 492 612"
              aria-hidden="true"
            >
              <path className={ui.trajectoryPath} d={shotPath} />
            </svg>
            {uploadState === "launching" && (
              <svg
                className={`${ui.overlay} motion-reduce:hidden`}
                viewBox="0 0 492 612"
                aria-hidden="true"
              >
                <g className="animate-[bu-shot-fade_.88s_linear_both] [filter:drop-shadow(0_6px_9px_#3a3e5324)]">
                  <animateMotion
                    dur=".85s"
                    path={shotPath}
                    calcMode="spline"
                    keyTimes="0;1"
                    keySplines=".2 .5 .4 1"
                    fill="freeze"
                  />
                  <path
                    d="M-17-26H8L20-14V25H-17Z"
                    fill="white"
                    stroke="#e0e4ec"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8-26v12h12"
                    fill="#edf0f6"
                    stroke="#e0e4ec"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M-10-13H3m-13 5H5m-15 5H1"
                    stroke="#d5dae5"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="-11"
                    y="9"
                    width="25"
                    height="11"
                    rx="2"
                    fill="#4267d9"
                  />
                  <text
                    x="1.5"
                    y="17"
                    fill="white"
                    fontSize="7"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {fileExtension}
                  </text>
                </g>
              </svg>
            )}
            <p
              className="absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)]"
              role={uploadState === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {statusMessage}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Pure gallery artwork. previewStep is driven by the gallery's shared clock. */
export function BasketballUploadThumbnail({
  className = "",
  previewStep = 0,
}: {
  className?: string;
  previewStep?: number;
}) {
  const step = Math.abs(Math.trunc(previewStep)) % 4;
  const states = ["aiming", "launching", "uploading", "success"] as const;
  const state = states[step];
  const progress = step === 3 ? 100 : 65;
  return (
    <div
      className={`${rootClass} bu-thumbnail pointer-events-none h-full min-h-0 [container-type:size] ${className}`}
      aria-hidden="true"
      inert
    >
      <ComponentStyles css={BASKETBALL_UPLOAD_STYLES} />
      <div className={`${ui.stage} h-full min-h-0 px-4 py-3`}>
        <div className="@container w-[min(250px,calc(100cqw-32px),80cqh)]">
          <div className={ui.card} data-state={state}>
            <header className={ui.header}>
              <div>
                <h2 className={ui.title}>Upload files</h2>
                <p className={ui.subtitle}>Drag and drop, or take the shot.</p>
              </div>
              <div className={ui.headerActions}>
                <span className={ui.sound}>
                  <svg className={ui.soundIcon} viewBox="0 0 20 20">
                    <path d="M3 8v4h3l4 3V5L6 8H3Z" />
                    <path d="m13 8 4 4m0-4-4 4" />
                  </svg>
                </span>
                <span className={ui.count}>
                  Uploaded{" "}
                  <strong className={ui.countValue}>
                    {step === 3 ? 3 : 2}
                  </strong>
                </span>
              </div>
            </header>
            <div className={ui.dropzone} data-state={state}>
              <span className={ui.dropCopy}>
                <svg className={ui.dropIcon} viewBox="0 0 24 24">
                  <path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" />
                </svg>
                <strong className={ui.dropTitle}>Drop files here</strong>
                <span className={ui.dropHint}>or take the shot</span>
              </span>
              <span className={ui.hoop}>
                <BasketballHoop />
              </span>
              {step >= 2 && (
                <span className={ui.uploadRow}>
                  <span className={ui.fileBadge}>
                    <span className={ui.fileBadgeLabel}>PDF</span>
                  </span>
                  <span className={ui.uploadInfo}>
                    <span className={ui.uploadLine}>
                      <span className={ui.uploadName}>document.pdf</span>
                      <span
                        className={`${ui.progressValue} ${step === 3 ? "text-[#27925f]" : "text-[#6c76da]"}`}
                      >
                        {step === 3 ? "Done" : `${progress}%`}
                      </span>
                    </span>
                    <span className={ui.progressTrack}>
                      <span
                        className={ui.progressBar}
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                    <span className={ui.uploadLine}>
                      <span className={`${ui.uploadCaption} text-[#747de0]`}>
                        {step === 3
                          ? "✓ File uploaded successfully"
                          : "Uploading file…"}
                      </span>
                      <span className={ui.uploadSize}>2.4 MB</span>
                    </span>
                  </span>
                </span>
              )}
            </div>
            <div className={ui.footer}>
              <p className={ui.footerText}>
                {step === 0
                  ? "Release to shoot!"
                  : "Aim the file & release to shoot into the basket"}
              </p>
            </div>
            <svg
              className={`${ui.overlay} opacity-0 group-data-[state=aiming]/card:opacity-100`}
              viewBox="0 0 492 612"
            >
              <path
                className={ui.trajectoryPath}
                d="M 72 510 C 117 220, 224 116, 246 320"
              />
            </svg>
            {/* The thumbnail freezes the launch mid-flight instead of animating it. */}
            <span
              className={`${ui.fileTile} ${state === "launching" ? "top-[32%] left-[43%] [transform:translate(-50%,-50%)_rotate(15deg)]" : ui.fileTileRest}`}
            >
              <span className={ui.fileFold} />
              <span className={ui.fileLines} />
              <span className={ui.fileTag}>PDF</span>
            </span>
            <svg
              className={`${ui.overlay} ${state === "launching" ? "opacity-50" : "opacity-0"}`}
              viewBox="0 0 492 612"
            >
              <path
                className={ui.trajectoryPath}
                d="M 72 510 C 117 220, 224 116, 246 320 L 246 360"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Only what Tailwind utilities cannot express (or cannot win against) stays here:
 * keyframes, the descendant-wide thumbnail/reduced-motion resets, and the focus rings
 * and tile cursors, which must outrank the host app's unlayered `:focus-visible` and
 * `button:not(:disabled)` rules that layered utilities always lose to.
 */
const BASKETBALL_UPLOAD_STYLES = `
.basketball-upload *{box-sizing:border-box}
.basketball-upload .bu-sound:hover,.basketball-upload .bu-sound:focus-visible{color:#5265e8;outline:2px solid #6779ef;outline-offset:2px}
.basketball-upload .bu-dropzone:focus-visible{outline:2px solid #6575ef;outline-offset:3px}
.basketball-upload .bu-file-tile{cursor:grab}
.basketball-upload .bu-file-tile:focus-visible{outline:2px solid #6b69e2;outline-offset:5px}
.basketball-upload .bu-file-tile[data-aiming=true]{cursor:grabbing}
.basketball-upload .bu-file-tile[aria-disabled=true]{cursor:wait}
@keyframes bu-shot-fade{0%,86%{opacity:1}100%{opacity:0}}
@keyframes bu-trail{0%{opacity:.7}70%{opacity:.6}100%{opacity:0}}
@keyframes bu-hoop-pop{0%{transform:translateX(-50%) scale(1)}45%{transform:translateX(-50%) scale(1.04,.92)}100%{transform:translateX(-50%) scale(1)}}
@keyframes bu-row-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
.basketball-upload.bu-thumbnail *{animation:none!important;transition:none!important}
@media(prefers-reduced-motion:reduce){.basketball-upload *,.basketball-upload *::before,.basketball-upload *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
`;
