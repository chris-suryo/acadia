"use client";

// Chirp — the trip's own Twitter, asked for by Molida. A reverse-chron feed
// of 280-character posts with photos, hearts, one-level replies, and pins.
// During the trip it's "summit!" photos and "firewood acquired"; afterward
// it's the memory reel. The Photos segment is the same feed as an album.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bird,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
  X,
} from "lucide-react";
import { useData } from "@/lib/data/context";
import { chirpTime, splitLinks } from "@/lib/chirp";
import type { Post } from "@/lib/types";
import { Card, Segmented, SubH } from "./primitives";
import { Avatar } from "./ui/Avatar";
import { BottomSheet } from "./ui/BottomSheet";
import { PhotoLightbox } from "./PhotoLightbox";
import { onFieldFocus } from "./ui/keepVisible";

const MAX_PHOTOS = 4;
const MAX_CHARS = 280;

/** Body text with links tappable — no dangerouslySetInnerHTML. */
function Body({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="text-[14.5px] leading-[1.45] text-ink whitespace-pre-wrap break-words m-0 mt-0.5">
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noreferrer"
            className="text-moss underline underline-offset-2 break-all"
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  );
}

function PhotoGrid({
  photos,
  onOpen,
}: {
  photos: string[];
  onOpen: (src: string) => void;
}) {
  if (!photos.length) return null;
  const one = photos.length === 1;
  return (
    <div
      className={`mt-2 grid gap-[3px] rounded-xl overflow-hidden ${one ? "" : "grid-cols-2"}`}
    >
      {photos.map((src) => (
        <button
          key={src}
          onClick={() => onOpen(src)}
          aria-label="Open photo"
          className="block p-0 border-none bg-[#E9EEE4] cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- user photo */}
          <img
            src={src}
            alt=""
            loading="lazy"
            className={`w-full object-cover ${one ? "max-h-[340px]" : "aspect-square"}`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * One chirp — used for roots and, slightly smaller, for replies.
 * Stateless on purpose: every fact and action arrives as a prop.
 */
function PostCard({
  p,
  name,
  time,
  liked,
  likeCount,
  replyCount,
  isReply = false,
  onLike,
  onLikers,
  onReply,
  onMenu,
  onPhoto,
}: {
  p: Post;
  name: string;
  time: string;
  liked: boolean;
  likeCount: number;
  replyCount?: number;
  isReply?: boolean;
  onLike: () => void;
  onLikers: () => void;
  onReply?: () => void;
  onMenu: () => void;
  onPhoto: (src: string) => void;
}) {
  return (
    <div className="flex gap-2.5 min-w-0">
      <div className="pt-0.5">
        <Avatar userId={p.user_id} name={name} size={isReply ? 26 : 34} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[13.5px] font-semibold text-ink truncate">{name}</span>
          <span className="font-mono text-[10.5px] text-faint shrink-0">{time}</span>
          {p.pinned && !isReply ? (
            <span className="ml-auto shrink-0 inline-flex items-center gap-1 font-mono text-[10px] tracking-[.08em] uppercase text-granite">
              <Pin size={10} /> pinned
            </span>
          ) : null}
        </div>
        <Body text={p.body} />
        <PhotoGrid photos={p.photos} onOpen={onPhoto} />
        <div className="flex items-center mt-1.5 -mb-1 -ml-1.5">
          <span className="flex items-center">
            <button
              onClick={onLike}
              aria-label={liked ? "Unlike" : "Like"}
              className="p-1.5 bg-transparent border-none cursor-pointer flex items-center"
            >
              <Heart
                size={16}
                className={liked ? "text-blaze" : "text-mute"}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
            {likeCount > 0 ? (
              <button
                onClick={onLikers}
                aria-label="Who liked this"
                className={`p-1 -ml-1 bg-transparent border-none cursor-pointer font-mono text-[11px] ${liked ? "text-blaze" : "text-mute"}`}
              >
                {likeCount}
              </button>
            ) : null}
          </span>
          {onReply ? (
            <button
              onClick={onReply}
              aria-label="Reply to this"
              className="ml-4 p-1.5 bg-transparent border-none cursor-pointer flex items-center gap-1 text-mute"
            >
              <MessageCircle size={16} />
              {replyCount ? (
                <span className="font-mono text-[11px]">{replyCount}</span>
              ) : null}
            </button>
          ) : null}
          <button
            onClick={onMenu}
            aria-label="Post menu"
            className="ml-auto p-1.5 bg-transparent border-none cursor-pointer text-faint flex items-center"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The compose box — the feed's top card, and inline under a post in reply
 * mode. Keeps everything typed until the post actually lands.
 */
function Composer({
  placeholder,
  parentId = null,
  autoFocus = false,
  compact = false,
  onPosted,
}: {
  placeholder: string;
  parentId?: string | null;
  autoFocus?: boolean;
  compact?: boolean;
  onPosted?: () => void;
}) {
  const { userId, name, ensureName, addPost } = useData();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Autosize: the box grows with the chirp instead of scrolling inside itself.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const add = [...list].slice(0, MAX_PHOTOS - files.length);
    if (!add.length) return;
    setFiles((f) => [...f, ...add]);
    setPreviews((p) => [...p, ...add.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles((f) => f.filter((_, x) => x !== i));
    setPreviews((p) => p.filter((_, x) => x !== i));
  };

  const left = MAX_CHARS - body.length;
  const canPost = !busy && (body.trim().length > 0 || files.length > 0) && left >= 0;

  const send = () => {
    if (!canPost) return;
    ensureName(async () => {
      setBusy(true);
      const ok = await addPost(body, files, parentId);
      setBusy(false);
      if (!ok) return; // everything typed stays put for the retry
      previews.forEach((u) => URL.revokeObjectURL(u));
      setBody("");
      setFiles([]);
      setPreviews([]);
      onPosted?.();
    });
  };

  return (
    <div className="flex gap-2.5">
      {!compact && (
        <div className="pt-1">
          <Avatar userId={userId} name={name || "?"} size={34} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={onFieldFocus}
          autoFocus={autoFocus}
          maxLength={MAX_CHARS}
          rows={compact ? 1 : 2}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full resize-none border-none bg-transparent p-0 pt-1 text-[16px] leading-[1.4] text-ink placeholder:text-faint focus:outline-none"
        />
        {previews.length > 0 && (
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {previews.map((src, i) => (
              <span key={src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- preview */}
                <img
                  src={src}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg border border-rule"
                />
                <button
                  onClick={() => removePhoto(i)}
                  aria-label="Remove photo"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white border-none cursor-pointer flex items-center justify-center"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center mt-1 border-t border-rule pt-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              pick(e.target.files);
              e.target.value = ""; // same photo twice in a row still fires
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Add photo"
            disabled={files.length >= MAX_PHOTOS}
            className={`p-1.5 -ml-1.5 bg-transparent border-none flex items-center ${
              files.length >= MAX_PHOTOS ? "text-faint" : "text-moss cursor-pointer"
            }`}
          >
            <ImagePlus size={18} />
          </button>
          {left <= 40 && (
            <span
              aria-hidden
              className={`ml-2 font-mono text-[11px] ${left <= 10 ? "text-blaze" : "text-granite"}`}
            >
              {left}
            </span>
          )}
          <button
            onClick={send}
            disabled={!canPost}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full border-none px-4 py-1.5 min-h-[32px] text-[13px] font-semibold text-white ${
              canPost ? "bg-blaze cursor-pointer" : "bg-[#C9C2AE]"
            }`}
          >
            {busy ? <Loader2 size={14} className="spin" /> : null}
            {parentId ? "Reply" : "Chirp"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Chirp() {
  const {
    posts,
    postLikes,
    profiles,
    members,
    memberOf,
    isMe,
    toggleLikePost,
    deletePost,
    setPostPinned,
  } = useData();

  const [view, setViewState] = useState("feed");
  // Restored off the render path — the same deferral as Shell's segments.
  useEffect(() => {
    const timer = setTimeout(() => {
      const v = sessionStorage.getItem("abc.chirpView");
      if (v) setViewState(v);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const setView = (v: string) => {
    setViewState(v);
    sessionStorage.setItem("abc.chirpView", v);
  };

  // The relative clock re-reads once a minute, so "4m" doesn't sit at "now".
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [likersFor, setLikersFor] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);

  const nameOf = (uid: string) =>
    profiles[uid] ||
    members.find((m) => m.id === memberOf(uid))?.name ||
    "Someone";

  const roots = useMemo(
    () =>
      posts
        .filter((p) => !p.parent_id)
        .sort(
          (a, b) =>
            (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
            b.created_at.localeCompare(a.created_at),
        ),
    [posts],
  );

  const repliesOf = (id: string) =>
    posts
      .filter((p) => p.parent_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

  /** One heart per person, whatever devices it arrived from. */
  const likersOf = (id: string) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const l of postLikes) {
      if (l.post_id !== id) continue;
      const who = memberOf(l.user_id) || l.user_id;
      if (seen.has(who)) continue;
      seen.add(who);
      out.push(l.user_id);
    }
    return out;
  };

  const iLike = (id: string) =>
    postLikes.some((l) => l.post_id === id && isMe(l.user_id));

  const openPhoto = (p: Post, src: string) =>
    setLightbox({
      src,
      caption: `${nameOf(p.user_id)}${p.body ? ` — ${p.body}` : ""}`,
    });

  const closeMenu = () => {
    setMenuFor(null);
    setConfirmDelete(false);
  };

  const menuPost = menuFor ? posts.find((p) => p.id === menuFor) : undefined;

  const album = useMemo(
    () =>
      [...posts]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .flatMap((p) => p.photos.map((src) => ({ src, p }))),
    [posts],
  );

  const cardProps = (p: Post) => ({
    p,
    name: nameOf(p.user_id),
    time: chirpTime(p.created_at, now),
    liked: iLike(p.id),
    likeCount: likersOf(p.id).length,
    onLike: () => toggleLikePost(p.id),
    onLikers: () => setLikersFor(p.id),
    onMenu: () => setMenuFor(p.id),
    onPhoto: (src: string) => openPhoto(p, src),
  });

  return (
    <div className="px-3.5 pt-4 pb-[60px]">
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: "feed", label: "Feed" },
          { id: "photos", label: "Photos" },
        ]}
      />

      {view === "feed" && (
        <>
          <Card className="p-3.5 mb-3">
            <Composer placeholder="What’s happening at camp?" />
          </Card>

          {roots.length === 0 ? (
            <div className="p-[44px_20px] text-center text-granite">
              <Bird size={26} className="mx-auto mb-2.5 text-moss" />
              <p className="text-[14px] m-0">Quiet out here.</p>
              <p className="font-mono text-[11.5px] text-faint mt-1 m-0">
                First chirp?
              </p>
            </div>
          ) : (
            roots.map((p) => {
              const replies = repliesOf(p.id);
              return (
                <Card key={p.id} className="p-3.5 mb-2.5">
                  <PostCard
                    {...cardProps(p)}
                    replyCount={replies.length}
                    onReply={() =>
                      setReplyFor((cur) => (cur === p.id ? null : p.id))
                    }
                  />
                  {replies.length > 0 && (
                    <div className="mt-3 ml-1 pl-3 border-l-2 border-rule flex flex-col gap-3.5">
                      {replies.map((r) => (
                        <PostCard key={r.id} {...cardProps(r)} isReply />
                      ))}
                    </div>
                  )}
                  {replyFor === p.id && (
                    <div className="mt-3 ml-1 pl-3 border-l-2 border-rule">
                      <Composer
                        placeholder={`Reply to ${nameOf(p.user_id)}…`}
                        parentId={p.id}
                        autoFocus
                        compact
                        onPosted={() => setReplyFor(null)}
                      />
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </>
      )}

      {view === "photos" &&
        (album.length === 0 ? (
          <div className="p-[44px_20px] text-center text-granite">
            <Bird size={26} className="mx-auto mb-2.5 text-moss" />
            <p className="text-[14px] m-0">No photos yet.</p>
            <p className="font-mono text-[11.5px] text-faint mt-1 m-0">
              Chirp one from the feed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {album.map(({ src, p }, i) => (
              <button
                key={`${p.id}-${i}`}
                onClick={() => openPhoto(p, src)}
                aria-label={`Photo by ${nameOf(p.user_id)}`}
                className="block p-0 border-none bg-[#E9EEE4] rounded-lg overflow-hidden cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user photo */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
              </button>
            ))}
          </div>
        ))}

      {lightbox && (
        <PhotoLightbox
          src={lightbox.src}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Who liked — faces, not a number. */}
      <BottomSheet open={!!likersFor} onClose={() => setLikersFor(null)}>
        <SubH icon={Heart}>Liked by</SubH>
        <div className="flex flex-col gap-3 pt-1">
          {(likersFor ? likersOf(likersFor) : []).map((uid) => (
            <span key={uid} className="flex items-center gap-2.5">
              <Avatar userId={uid} name={nameOf(uid)} size={28} />
              <span className="text-[14px] font-medium text-ink">{nameOf(uid)}</span>
            </span>
          ))}
        </div>
      </BottomSheet>

      {/* Post menu: pin for anyone, delete only for the author. */}
      <BottomSheet open={!!menuPost} onClose={closeMenu}>
        {menuPost && (
          <div className="flex flex-col gap-2">
            {!menuPost.parent_id && (
              <button
                onClick={() => {
                  setPostPinned(menuPost.id, !menuPost.pinned);
                  closeMenu();
                }}
                className="flex items-center gap-2.5 w-full p-3 rounded-lg border border-rule bg-white text-[14px] font-medium text-ink cursor-pointer"
              >
                {menuPost.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                {menuPost.pinned ? "Unpin" : "Pin to top"}
              </button>
            )}
            {isMe(menuPost.user_id) &&
              (confirmDelete ? (
                <button
                  onClick={() => {
                    deletePost(menuPost.id);
                    closeMenu();
                  }}
                  className="flex items-center gap-2.5 w-full p-3 rounded-lg border-none bg-blaze text-[14px] font-semibold text-white cursor-pointer"
                >
                  <Trash2 size={16} />
                  Really delete?
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2.5 w-full p-3 rounded-lg border border-rule bg-white text-[14px] font-medium text-blaze cursor-pointer"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
