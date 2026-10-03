"use client";

import { useId, useRef, useState, type FormEvent } from "react";

export interface AnimatedBorderCardProps {
  imageSrc?: string;
  displayName?: string;
  role?: string;
  stats?: {
    posts: string | number;
    followers: string | number;
    following: string | number;
  };
  /** Called before the local follow state changes. Reject to display an error. */
  onFollow?: (following: boolean) => void | Promise<void>;
  /** Connect your messaging service here. Without it, the composer saves a local draft. */
  onMessage?: (message: string) => void | Promise<void>;
  className?: string;
}

const DEFAULT_AVATAR = "data:image/webp;base64,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";
const DEFAULT_STATS = { posts: 392, followers: "6.5M", following: 194 };

type Profile = Required<
  Pick<AnimatedBorderCardProps, "imageSrc" | "displayName" | "role" | "stats">
>;

function Avatar({ imageSrc, displayName }: Pick<Profile, "imageSrc" | "displayName">) {
  return (
    <div className="abc-avatar" aria-hidden="true">
      {/* A standard image keeps this component portable outside Next.js. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt={displayName} draggable={false} />
    </div>
  );
}

function ProfileDetails({ displayName, role, stats, statsVisible = true }: Omit<Profile, "imageSrc"> & { statsVisible?: boolean }) {
  return (
    <>
      <h2 className="abc-name">
        {displayName}
        <span>{role}</span>
      </h2>
      <dl className="abc-stats" aria-hidden={!statsVisible}>
        {(["posts", "followers", "following"] as const).map((label) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{stats[label]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/** Hover, focus the portrait, or tap it to reveal the profile's actions. */
export default function AnimatedBorderCard({
  imageSrc = DEFAULT_AVATAR,
  displayName = "Mr. Skeleton",
  role = "Senior UX/UI Designer Player",
  stats = DEFAULT_STATS,
  onFollow,
  onMessage,
  className = "",
}: AnimatedBorderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [followStatus, setFollowStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [savedDraft, setSavedDraft] = useState("");
  const [messagePending, setMessagePending] = useState(false);
  const [messageStatus, setMessageStatus] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  async function toggleFollow() {
    if (followPending) return;
    setFollowPending(true);
    setFollowStatus("");
    try {
      await onFollow?.(!following);
      setFollowing(!following);
      setFollowStatus(following ? `Unfollowed ${displayName}.` : `Following ${displayName}.`);
    } catch {
      setFollowStatus("Could not update your follow. Please try again.");
    } finally {
      setFollowPending(false);
    }
  }

  function openComposer() {
    setDraft(savedDraft);
    setMessageStatus("");
    dialog.current?.showModal();
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || messagePending) return;
    setMessagePending(true);
    setMessageStatus("");
    try {
      if (onMessage) {
        await onMessage(message);
        setDraft("");
        setSavedDraft("");
        setMessageStatus("Message sent.");
      } else {
        setSavedDraft(message);
        setMessageStatus("Draft saved for this preview.");
      }
    } catch {
      setMessageStatus("Your message could not be sent. Please try again.");
    } finally {
      setMessagePending(false);
    }
  }

  return (
    <section
      className={`abc-stage relative flex min-h-[620px] w-full items-center justify-center overflow-hidden ${className}`}
      aria-label="Animated border profile card"
    >
      <style>{STYLES}</style>
      <article
        className="abc-card"
        data-expanded={expanded}
        aria-label={`${displayName}'s profile`}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setExpanded(true);
        }}
        onPointerLeave={(event) => {
          const focusedControl = event.currentTarget.querySelector(":focus-visible");
          if (event.pointerType === "mouse" && !dialog.current?.open && !focusedControl) setExpanded(false);
        }}
        onFocusCapture={(event) => {
          if (event.target.matches(":focus-visible")) setExpanded(true);
        }}
        onBlurCapture={(event) => {
          if (!dialog.current?.open && !event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
        }}
      >
        <div className="abc-lines" aria-hidden="true" />
        <Avatar imageSrc={imageSrc} displayName={displayName} />
        <button
          type="button"
          className="abc-avatar-trigger"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${displayName}'s profile`}
          aria-expanded={expanded}
          aria-controls={`${id}-actions`}
          onClick={() => setExpanded((current) => !current)}
        />
        <div className="abc-content">
          <div className="abc-details">
            <ProfileDetails displayName={displayName} role={role} stats={stats} statsVisible={expanded} />
            <div className="abc-actions" id={`${id}-actions`} inert={!expanded} aria-hidden={!expanded}>
              <button type="button" onClick={toggleFollow} aria-pressed={following} disabled={followPending}>
                {followPending ? "Updating…" : following ? "Following" : "Follow"}
              </button>
              <button type="button" onClick={openComposer}>Message</button>
            </div>
          </div>
        </div>
      </article>
      <p className="abc-follow-status" role="status" aria-live="polite">{followStatus}</p>
      <dialog className="abc-dialog" ref={dialog} aria-labelledby={`${id}-message-title`}>
        <form onSubmit={submitMessage}>
          <div className="abc-dialog-heading">
            <h2 id={`${id}-message-title`}>Message {displayName}</h2>
            <button type="button" className="abc-close" aria-label="Close message" onClick={() => dialog.current?.close()}>×</button>
          </div>
          <p className="abc-dialog-description">
            {onMessage ? "Start a conversation." : "Try the composer. Your draft stays in this preview."}
          </p>
          <label htmlFor={`${id}-message`}>Your message</label>
          <textarea
            id={`${id}-message`}
            value={draft}
            onChange={(event) => { setDraft(event.target.value); setMessageStatus(""); }}
            placeholder="Hey! I love your work…"
            maxLength={2000}
            rows={5}
            required
            disabled={messagePending}
          />
          <div className="abc-composer-footer">
            <span>{draft.length}/2000</span>
            <button type="submit" disabled={!draft.trim() || messagePending}>
              {messagePending ? "Saving…" : onMessage ? "Send message" : "Save draft"}
            </button>
          </div>
          <p className="abc-message-status" role="status" aria-live="polite">{messageStatus}</p>
        </form>
      </dialog>
    </section>
  );
}

/** An inert, expanded preview that can safely be nested inside a gallery link. */
export function AnimatedBorderCardThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  return (
    <div className={`abc-stage abc-thumbnail relative flex h-full min-h-[260px] w-full items-center justify-center overflow-hidden ${className}`} aria-hidden="true" inert>
      <style>{STYLES}</style>
      <div className="abc-card" data-expanded={previewStep % 3 !== 1}>
        <div className="abc-lines" />
        <Avatar imageSrc={DEFAULT_AVATAR} displayName="Mr. Skeleton" />
        <div className="abc-content">
          <div className="abc-details">
            <ProfileDetails displayName="Mr. Skeleton" role="Senior UX/UI Designer Player" stats={DEFAULT_STATS} />
            <div className="abc-actions"><span>Follow</span><span>Message</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STYLES = `
.abc-stage {
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  --abc-cyan: #45f3ff;
  --abc-pink: #ff3c7b;
  background: #222;
  color: #fff;
  font-family: "Poppins", Arial, sans-serif;
  isolation: isolate;
}
.abc-stage *, .abc-stage *::before, .abc-stage *::after { box-sizing: border-box; }
.abc-card {
  position: relative;
  width: 350px;
  max-width: calc(100% - 40px);
  height: 190px;
  background: #333;
  transition: height .5s;
  flex-shrink: 0;
}
.abc-card[data-expanded="true"] { height: 450px; }
.abc-lines { position: absolute; inset: 0; background: #000; overflow: hidden; }
.abc-lines::before {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 600px; height: 120px;
  background: linear-gradient(transparent, var(--abc-cyan), var(--abc-cyan), var(--abc-cyan), transparent);
  animation: abc-orbit 4s linear infinite;
}
.abc-lines::after { content: ""; position: absolute; inset: 3px; background: #292929; }
.abc-avatar, .abc-avatar-trigger {
  position: absolute;
  top: -50px; left: 50%;
  width: 150px; height: 150px;
  transform: translateX(-50%);
  transition: width .5s, height .5s;
}
.abc-avatar { z-index: 2; overflow: hidden; background: #000; }
.abc-avatar::before {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 500px; height: 150px;
  background: linear-gradient(transparent, var(--abc-pink), var(--abc-pink), var(--abc-pink), transparent);
  animation: abc-orbit 6s linear infinite reverse;
}
.abc-avatar::after { content: ""; position: absolute; inset: 3px; background: #292929; }
.abc-avatar img { position: absolute; z-index: 1; inset: 10px; width: calc(100% - 20px); height: calc(100% - 20px); object-fit: cover; }
.abc-avatar-trigger { z-index: 3; border: 0; border-radius: 0; padding: 0; background: transparent; cursor: pointer; }
.abc-card[data-expanded="true"] .abc-avatar, .abc-card[data-expanded="true"] .abc-avatar-trigger { width: 250px; height: 250px; }
.abc-content { position: absolute; inset: 0; display: flex; justify-content: center; align-items: flex-end; overflow: hidden; }
.abc-details { padding: 40px; width: 100%; text-align: center; transition: transform .5s; transform: translateY(145px); }
.abc-card[data-expanded="true"] .abc-details { transform: translateY(0); }
.abc-name { margin: 0; color: var(--abc-cyan); font-size: 20px; font-weight: 600; line-height: 1.2; }
.abc-name > span { display: block; margin-top: 5px; color: #fff; font-size: 15px; font-weight: 500; line-height: 1.2; white-space: nowrap; }
.abc-stats { display: flex; justify-content: space-between; gap: 10px; margin: 20px 0; }
.abc-stats > div { display: flex; flex-direction: column-reverse; text-align: center; }
.abc-stats dt { color: #fff; font-size: 13.6px; line-height: 1.4; font-weight: 400; text-transform: capitalize; }
.abc-stats dd { margin: 0; color: var(--abc-cyan); font-size: 16px; line-height: 1.2; font-weight: 600; }
.abc-actions { display: flex; justify-content: space-between; gap: 20px; }
.abc-actions button, .abc-actions > span { display: flex; align-items: center; justify-content: center; min-width: 0; flex: 1; border: 0; border-radius: 5px; padding: 10px 12px; background: var(--abc-cyan); color: #222; font: inherit; font-size: 16px; font-weight: 500; line-height: 1.5; white-space: nowrap; }
.abc-actions button { cursor: pointer; transition: opacity .2s; }
.abc-actions > :nth-child(2) { background: #fff; }
.abc-actions button:hover { opacity: .85; }
.abc-actions button[aria-pressed="true"] { background: #213f41; color: var(--abc-cyan); box-shadow: inset 0 0 0 1px var(--abc-cyan); }
.abc-stage button:focus-visible { outline: 2px solid #fff; outline-offset: 5px; }
.abc-stage button:disabled { cursor: wait; opacity: .6; }
.abc-follow-status { position: absolute; bottom: 18px; left: 20px; right: 20px; margin: 0; text-align: center; color: #c1c6c7; font-size: 12px; }
.abc-dialog { position: fixed; inset: 0; width: min(430px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); margin: auto; padding: 26px; overflow-y: auto; border: 1px solid #4d6c70; border-radius: 10px; background: #292929; color: #fff; font-family: "Poppins", Arial, sans-serif; box-shadow: 0 24px 100px #0009; }
.abc-dialog::backdrop { background: #000a; backdrop-filter: blur(5px); }
.abc-dialog-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.abc-dialog-heading h2 { margin: 0; color: var(--abc-cyan); font-size: 19px; font-weight: 600; }
.abc-close { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; border: 0; border-radius: 4px; background: #ffffff0d; color: #fff; font-size: 26px; line-height: 1; cursor: pointer; }
.abc-dialog-description { margin: 12px 0 24px; font-size: 13px; line-height: 1.6; color: #b9bec0; }
.abc-dialog label { display: block; margin-bottom: 9px; font-size: 13px; }
.abc-dialog textarea { display: block; resize: vertical; width: 100%; min-height: 120px; max-height: 45dvh; border: 1px solid #535759; border-radius: 6px; padding: 12px; background: #202020; color: #fff; font: inherit; font-size: 14px; line-height: 1.6; }
.abc-dialog textarea:focus { outline: 2px solid var(--abc-cyan); outline-offset: 2px; }
.abc-composer-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 14px; }
.abc-composer-footer > span { color: #b9bec0; font-size: 11px; }
.abc-composer-footer button { border: 0; border-radius: 5px; padding: 10px 16px; background: var(--abc-cyan); color: #222; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.abc-composer-footer button:disabled { cursor: not-allowed; }
.abc-message-status { margin: 14px 0 0; font-size: 13px; line-height: 1.6; }
.abc-message-status:empty { display: none; }
.abc-thumbnail .abc-card { transform: translateY(13px) scale(.52); max-width: none; }
.abc-thumbnail .abc-lines::before { animation: none; transform: translate(-50%, -50%) rotate(25deg); }
.abc-thumbnail .abc-avatar::before { animation: none; transform: translate(-50%, -50%) rotate(-25deg); }
@keyframes abc-orbit { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@container (max-width: 380px) {
  .abc-card { max-width: calc(100% - 28px); }
  .abc-details { padding-right: 25px; padding-left: 25px; }
  .abc-name > span { font-size: 13px; }
  .abc-actions { gap: 12px; }
  .abc-actions button { font-size: 14px; }
  .abc-card[data-expanded="true"] .abc-avatar,
  .abc-card[data-expanded="true"] .abc-avatar-trigger { width: min(250px, calc(100% - 20px)); height: auto; aspect-ratio: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .abc-stage *, .abc-stage *::before, .abc-stage *::after { transition: none !important; animation: none !important; }
  .abc-lines::before { transform: translate(-50%, -50%) rotate(25deg); }
  .abc-avatar::before { transform: translate(-50%, -50%) rotate(-25deg); }
}
`;
