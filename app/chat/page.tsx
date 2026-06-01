"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getToken, useUser } from "@clerk/nextjs";
import { initSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/components/CompanyProvider";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import {
  Bell,
  BellOff,
  BellRing,
  Circle,
  CircleCheck,
  Hash,
  MessageSquare,
  Mic,
  MicOff,
  MoreVertical,
  Palette,
  Pencil,
  Play,
  Plus,
  Search,
  Send,
  Shield,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { Paperclip } from "lucide-react";
import {
  CHAT_WALLPAPER_IDS,
  CHAT_WALLPAPER_LABELS,
  type ChatWallpaperId,
  chatWallpaperStyle,
} from "@/lib/chatWallpaper";

type Sender = {
  _id?: string;
  name?: string;
  email?: string;
  image?: string;
} | string | null | undefined;

type PresenceStatus = "free" | "busy" | "working";

type ChatPeer = {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  presenceStatus?: PresenceStatus;
};

type ChatRoom = {
  _id: string;
  name?: string;
  type?: string;
  displayName?: string;
  peer?: ChatPeer | null;
  participants?: string[];
};

function presenceLabel(status?: PresenceStatus) {
  switch (status) {
    case "busy":
      return "Busy";
    case "working":
      return "Working";
    default:
      return "Free";
  }
}

function presenceDotClass(status?: PresenceStatus) {
  switch (status) {
    case "busy":
      return "bg-rose-500";
    case "working":
      return "bg-amber-500";
    default:
      return "bg-emerald-500";
  }
}
type ChatAttachment = {
  url: string;
  type: "image" | "video" | "file" | "audio";
  name?: string;
};

type ChatMessage = {
  _id: string;
  text?: string;
  sender?: Sender;
  roomId?: string;
  attachments?: ChatAttachment[];
  createdAt?: string;
  updatedAt?: string;
  seenBy?: string[];
  editedAt?: string | null;
  deletedAt?: string | null;
  isDeleted?: boolean;
};

type AssignableUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  presenceStatus?: PresenceStatus;
};

const GROUP_GAP_MS = 5 * 60 * 1000;
const MAX_MESSAGE_CHARS = 8000;



function senderId(m: ChatMessage): string | null {
  const s = m.sender;
  if (s && typeof s === "object" && s._id) return String(s._id);
  return null;
}

function senderName(m: ChatMessage): string {
  const s = m.sender;
  if (s && typeof s === "object") {
    if (s.name?.trim()) return s.name.trim();
    if (s.email) return s.email.split("@")[0] || "Member";
  }
  return "Member";
}

function senderInitial(name: string) {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

function senderImage(m: ChatMessage) {
  const s = m.sender;

  if (
    s &&
    typeof s === "object" &&
    s.image
  ) {
    return s.image;
  }

  return null;
}
function roomIdFromMessage(msg: ChatMessage): string | null {
  const r = msg.roomId;
  if (!r) return null;
  if (typeof r === "object" && r !== null && "_id" in (r as object)) {
    return String((r as { _id: string })._id);
  }
  return String(r);
}

function sameId(a: string | undefined | null, b: string | undefined | null) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function roomDisplayName(r: ChatRoom): string {
  if (r.type === "direct") {
    return (
      r.displayName ||
      r.peer?.name?.trim() ||
      r.peer?.email?.split("@")[0] ||
      r.name ||
      "Chat"
    );
  }
  return r.name || "Channel";
}

function formatMessageTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ", " + time
  );
}

function dayKey(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDayDivider(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function showSenderHeader(prev: ChatMessage | undefined, curr: ChatMessage): boolean {
  if (!prev) return true;
  if (senderId(prev) !== senderId(curr)) return true;
  const a = prev.createdAt ? new Date(prev.createdAt).getTime() : 0;
  const b = curr.createdAt ? new Date(curr.createdAt).getTime() : 0;
  return b - a > GROUP_GAP_MS;
}

const NOTIFICATION_STORAGE_KEY =
  "creonox_chat_notifications";

function readBoolStorage(key: string, defaultOn: boolean): boolean {
  if (typeof window === "undefined") return defaultOn;
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultOn;
    return v !== "0";
  } catch {
    return defaultOn;
  }
}

/** Short chime when a new message arrives (respect browser autoplay rules). */
function playMessageChime() {
  try {
    const AC =
      typeof window !== "undefined" &&
      (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    const seq: [number, number][] = [
      [880, 0],
      [660, 0.1],
    ];
    for (const [freq, t] of seq) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.exponentialRampToValueAtTime(0.11, now + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.16);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + t);
      o.stop(now + t + 0.18);
    }
    void ctx.resume().catch(() => { });
  } catch {
    /* ignore */
  }
}

function notifyDesktopWithPreview(title: string, body: string, tag: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag,
      silent: false,
      requireInteraction: false,
    });
  } catch {
    /* ignore */
  }
}

function messageReadByRecipients(
  m: ChatMessage,
  myUserId: string | null,
  room: ChatRoom | undefined
): boolean {
  if (!myUserId || !sameId(senderId(m), myUserId)) return false;
  const readers = new Set((m.seenBy || []).map(String));
  readers.delete(myUserId);
  if (readers.size === 0) return false;

  if (room?.type === "direct" && room.peer?._id) {
    return readers.has(String(room.peer._id));
  }

  const others = (room?.participants || []).map(String).filter((id) => id !== myUserId);
  if (others.length === 0) return false;
  return others.some((id) => readers.has(id));
}

export default function ChatPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { workspaceReady, workspaceUser } = useCompany();
  const myUserId = workspaceUser?.id ?? null;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});
  const [channelFilter, setChannelFilter] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  const [notificationsOn, setNotificationsOn] =
    useState(true);
  const notificationsOnRef = useRef(true);
  notificationsOnRef.current =
    notificationsOn;

  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [previewImage, setPreviewImage] =
    useState<string | null>(null);

  const [previewVideo, setPreviewVideo] =
    useState<string | null>(null);

  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const [assignable, setAssignable] = useState<AssignableUser[]>([]);
  const [loadingAssignable, setLoadingAssignable] = useState(false);

  const [presenceStatus, setPresenceStatus] =
    useState<PresenceStatus>("free");
  const [presenceByUser, setPresenceByUser] = useState<
    Record<string, PresenceStatus>
  >({});
  const [chatWallpaper, setChatWallpaper] =
    useState<ChatWallpaperId>("default");
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const myUserIdRef = useRef<string | null>(null);
  const roomsRef = useRef<ChatRoom[]>([]);
  const baseTitleRef = useRef<string | null>(null);

  roomsRef.current = rooms;

  activeRoomIdRef.current = activeRoomId;
  myUserIdRef.current = myUserId;

  const filteredRooms = useMemo(() => {
    const q = channelFilter.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const title = roomDisplayName(r).toLowerCase();
      const email = (r.peer?.email || "").toLowerCase();
      const chName = (r.name || "").toLowerCase();
      return title.includes(q) || email.includes(q) || chName.includes(q);
    });
  }, [rooms, channelFilter]);

  const directRooms = useMemo(
    () => filteredRooms.filter((r) => r.type === "direct"),
    [filteredRooms]
  );
  const groupRooms = useMemo(
    () => filteredRooms.filter((r) => r.type !== "direct"),
    [filteredRooms]
  );

  const dmTeammates = useMemo(() => {
    const q = dmSearch.trim().toLowerCase();
    return assignable
      .filter((u) => u.id !== myUserId)
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
  }, [assignable, myUserId, dmSearch]);

  const loadMessages = useCallback(async (roomId: string) => {
    const res = await apiFetch(`/messages/${roomId}`);
    if (!res.ok) {
      setError("Could not load messages");
      return;
    }
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }, []);

  const markRoomRead = useCallback(async (roomId: string) => {
    try {
      const res = await apiFetch(`/messages/${roomId}/read`, { method: "POST" });
      if (!res.ok) return;
    } catch {
      /* ignore */
    }
  }, []);

  const markRoomReadRef = useRef(markRoomRead);
  markRoomReadRef.current = markRoomRead;

  const loadRooms = useCallback(async (selectRoomId?: string | null) => {
    setLoadingRooms(true);
    setError(null);
    try {
      const res = await apiFetch("/chat");
      if (!res.ok) {
        setError("Could not load chat rooms");
        setRooms([]);
        return;
      }
      const data = (await res.json()) as ChatRoom[];
      const list = Array.isArray(data) ? data : [];
      setRooms(list);
      setActiveRoomId((prev) => {
        if (list.length === 0) return null;
        if (
          selectRoomId &&
          list.some((r) => String(r._id) === String(selectRoomId))
        ) {
          return String(selectRoomId);
        }
        if (prev && list.some((r) => String(r._id) === prev)) return prev;
        return String(list[0]._id);
      });
    } catch {
      setError("Network error");
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  function isNearBottom(element: HTMLElement, threshold = 120) {
    return (
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight <
      threshold
    );
  }

  const loadAssignable = useCallback(() => {
    if (!workspaceReady) return;
    setLoadingAssignable(true);
    apiFetch("/users/assignable")
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = Array.isArray(data) ? (data as AssignableUser[]) : [];
        setAssignable(list);
        const map: Record<string, PresenceStatus> = {};
        for (const u of list) {
          map[u.id] = u.presenceStatus || "free";
        }
        setPresenceByUser(map);
      })
      .catch(() => setAssignable([]))
      .finally(() => setLoadingAssignable(false));
  }, [workspaceReady]);

  useEffect(() => {
    loadAssignable();
  }, [loadAssignable]);

  useEffect(() => {
    if (!myUserId) return;
    setPresenceByUser((prev) => ({
      ...prev,
      [myUserId]: presenceStatus,
    }));
  }, [myUserId, presenceStatus]);

  useEffect(() => {
    if (!workspaceUser) return;
    setPresenceStatus(workspaceUser.presenceStatus || "free");
    const wp = workspaceUser.chatWallpaper as ChatWallpaperId;
    if (wp && CHAT_WALLPAPER_IDS.includes(wp)) {
      setChatWallpaper(wp);
    }
  }, [workspaceUser]);


  const startDm = async (userId: string) => {
    setError(null);
    try {
      const res = await apiFetch("/chat/dm", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message || "Could not open chat");
        return;
      }
      const room = (await res.json()) as ChatRoom;
      setNewDmOpen(false);
      setDmSearch("");
      await loadRooms(String(room._id));
    } catch {
      setError("Could not open chat");
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!baseTitleRef.current) baseTitleRef.current = document.title;
    const total = Object.values(unreadByRoom).reduce((a, b) => a + b, 0);
    if (document.hidden && total > 0) {
      document.title = `(${total}) · ${baseTitleRef.current || PRODUCT_NAME}`;
    } else {
      document.title = baseTitleRef.current || PRODUCT_NAME;
    }
  }, [unreadByRoom]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !workspaceReady) return;
    void loadRooms();
  }, [isLoaded, isSignedIn, workspaceReady, loadRooms]);

  useEffect(() => {
    try {
      setNotificationsOn(
        readBoolStorage(
          NOTIFICATION_STORAGE_KEY,
          true
        )
      );
    } catch {
      setNotificationsOn(true);
    }
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    setUnreadByRoom((prev) => ({ ...prev, [activeRoomId]: 0 }));
  }, [activeRoomId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !workspaceReady) return;

    let cancelled = false;

    (async () => {
      const token = await getToken();
      if (!token || cancelled) return;

      const s = initSocket(token);
      if (!s || cancelled) return;

      const joinAllRooms = () => {
        for (const r of roomsRef.current) {
          s.emit("join_room", { roomId: String(r._id) });
        }
      };

      const onConnect = () => {
        setSocketConnected(true);
        setError((prev) => {
          if (!prev) return null;
          const p = prev.toLowerCase();
          if (
            p.includes("cannot connect to real-time") ||
            p.includes("next_public_socket_url") ||
            p.includes("websocket") ||
            p.includes("xhr poll error") ||
            p.includes("transport")
          )
            return null;
          return prev;
        });
        joinAllRooms();
      };

      const onReconnect = () => {
        joinAllRooms();
      };

      const onDisconnect = () => setSocketConnected(false);

      const onConnectError = (err: unknown) => {
        setSocketConnected(false);
        const msg =
          err instanceof Error
            ? err.message
            : err &&
              typeof err === "object" &&
              "message" in err &&
              typeof (err as { message: unknown }).message === "string"
              ? (err as { message: string }).message
              : null;
        setError(
          msg ||
          "Cannot connect to real-time chat. Set NEXT_PUBLIC_SOCKET_URL to your API host (without /api), or ensure the backend is running."
        );
      };

      s.on("connect", onConnect);
      s.on("reconnect", onReconnect);
      s.on("disconnect", onDisconnect);
      s.on("connect_error", onConnectError);

      s.on("receive_message", (msg: ChatMessage) => {
        const rid =
          roomIdFromMessage(msg) ||
          activeRoomIdRef.current;

        if (!rid) return;

        const active = activeRoomIdRef.current;

        const sid = senderId(msg);

        const mine = Boolean(
          sid &&
          myUserIdRef.current &&
          sameId(sid, myUserIdRef.current)
        );

        // unread counter
        if (!sameId(rid, active)) {
          setUnreadByRoom((prev) => ({
            ...prev,
            [String(rid)]: (prev[String(rid)] || 0) + 1,
          }));
        }

        // notification sound
        if (
          !mine &&
          notificationsOnRef.current
        ) {
          playMessageChime();
        }

        // desktop notification
        if (
          !mine &&
          notificationsOnRef.current &&
          typeof document !== "undefined" &&
          document.hidden &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          const room = roomsRef.current.find((r) =>
            sameId(r._id, rid)
          );

          notifyDesktopWithPreview(
            `${PRODUCT_NAME} · ${room
              ? roomDisplayName(room)
              : "Chat"
            }`,
            (msg.text || "")
              .trim()
              .slice(0, 160) || "New message",
            `chat-${rid}-${msg._id}`
          );
        }

        // IMPORTANT FIX
        // only append if message belongs to active room
        if (sameId(rid, active)) {
          setMessages((prev) => {
            const exists = prev.some((m) =>
              sameId(m._id, msg._id)
            );

            if (exists) return prev;

            return [...prev, msg];
          });

          if (!mine) {
            void markRoomReadRef.current(String(rid));
          }

          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: "smooth",
            });
          });
        }
      });

      s.on(
        "read_receipt",
        (payload: { roomId?: string; readerUserId?: string }) => {
          const { roomId, readerUserId } = payload || {};
          if (!roomId || !readerUserId) return;
          if (!sameId(roomId, activeRoomIdRef.current)) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (!sameId(senderId(m), myUserIdRef.current)) return m;
              const s = new Set((m.seenBy || []).map(String));
              if (s.has(String(readerUserId))) return m;
              return { ...m, seenBy: [...s, String(readerUserId)] };
            })
          );
        }
      );

      s.on("user_typing", (payload: { userId?: string; userName?: string }) => {
        if (sameId(payload.userId, myUserIdRef.current)) return;
        setTypingFrom(payload.userName || "Someone");
        window.setTimeout(() => setTypingFrom(null), 2500);
      });

      s.on("message_updated", (msg: ChatMessage) => {
        const rid = roomIdFromMessage(msg);
        if (!sameId(rid, activeRoomIdRef.current)) return;
        setMessages((prev) =>
          prev.map((m) => (sameId(m._id, msg._id) ? { ...m, ...msg } : m))
        );
      });

      s.on(
        "presence_update",
        (payload: { userId?: string; presenceStatus?: PresenceStatus }) => {
          if (!payload?.userId) return;
          const st = payload.presenceStatus || "free";
          setPresenceByUser((prev) => ({
            ...prev,
            [String(payload.userId)]: st,
          }));
          if (sameId(payload.userId, myUserIdRef.current)) {
            setPresenceStatus(st);
          }
          setRooms((prev) =>
            prev.map((r) => {
              if (r.peer && sameId(r.peer._id, payload.userId)) {
                return {
                  ...r,
                  peer: { ...r.peer, presenceStatus: st },
                };
              }
              return r;
            })
          );
        }
      );

      s.on("error", (payload: { message?: string } | string) => {
        const errText = typeof payload === "string" ? payload : payload?.message;
        if (errText) setError(errText);
      });

      setSocketConnected(s.connected);
      if (s.connected) joinAllRooms();
    })();

    return () => {
      cancelled = true;
      setSocketConnected(false);
      disconnectSocket();
    };
  }, [isLoaded, isSignedIn, workspaceReady]);

  useEffect(() => {
    const s = getSocket();
    if (!s?.connected || rooms.length === 0) return;
    for (const r of rooms) {
      s.emit("join_room", { roomId: String(r._id) });
    }
  }, [rooms]);

  useEffect(() => {
    if (!workspaceReady || !activeRoomId) return;

    let cancelled = false;

    // IMPORTANT
    // clear previous room messages instantly
    setMessages([]);

    (async () => {
      const res = await apiFetch(
        `/messages/${activeRoomId}`
      );

      if (!res.ok || cancelled) return;

      const data = await res.json();

      if (cancelled) return;

      setMessages(
        Array.isArray(data) ? data : []
      );

      await markRoomRead(activeRoomId);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeRoomId, markRoomRead, workspaceReady]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && activeRoomIdRef.current) {
        void markRoomReadRef.current(activeRoomIdRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;

    if (!container) return;

    const shouldScroll =
      isNearBottom(container) || messages.length <= 1;

    if (!shouldScroll) return;

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }, [messages, activeRoomId]);

  useEffect(() => {
    const onKey = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
        setPreviewVideo(null);
      }
    };

    window.addEventListener(
      "keydown",
      onKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKey
      );
  }, []);

  const createChannel = async () => {
    const name = newChannelName.trim() || "General";
    setCreatingChannel(true);
    setError(null);
    try {
      const res = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ name, type: "group", membersScope: "workspace" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        if (res.status === 402) {
          setError(
            err.message ||
            "Your subscription is not active. Renew billing to create channels."
          );
        } else {
          setError(err.message || "Could not create channel");
        }
        return;
      }
      const room = (await res.json()) as ChatRoom;
      setCreateChannelOpen(false);
      setNewChannelName("");
      await loadRooms(String(room._id));
    } catch {
      setError("Could not create channel");
    } finally {
      setCreatingChannel(false);
    }
  };
  const uploadFiles = async (files: File[]) => {
    const uploaded: ChatAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/chat`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
          body: form,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setUploadProgress(Math.round(((i + 1) / files.length) * 100));

      uploaded.push({
        url: data.file.url,
        type: data.file.type || "file",
        name: data.file.name || file.name,
      });
    }

    return uploaded;
  };

  const updatePresence = async (status: PresenceStatus) => {
    setPresenceStatus(status);
    setPresenceByUser((prev) => ({
      ...prev,
      ...(myUserId ? { [myUserId]: status } : {}),
    }));
    const s = getSocket();
    if (s?.connected) {
      s.emit("set_presence", { status });
    }
    try {
      await apiFetch("/users/me/presence", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      /* ignore */
    }
  };

  const saveWallpaper = async (id: ChatWallpaperId) => {
    setChatWallpaper(id);
    try {
      await apiFetch("/users/me/chat-preferences", {
        method: "PATCH",
        body: JSON.stringify({ chatWallpaper: id }),
      });
    } catch {
      /* ignore */
    }
  };

  const startEditMessage = (m: ChatMessage) => {
    setMenuMessageId(null);
    setEditingMessageId(m._id);
    setEditingText(m.text || "");
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const submitEditMessage = async () => {
    if (!editingMessageId) return;
    const t = editingText.trim();
    if (!t) return;
    try {
      const res = await apiFetch(`/messages/item/${editingMessageId}`, {
        method: "PATCH",
        body: JSON.stringify({ text: t }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message || "Could not edit message");
        return;
      }
      const updated = (await res.json()) as ChatMessage;
      setMessages((prev) =>
        prev.map((m) => (sameId(m._id, updated._id) ? { ...m, ...updated } : m))
      );
      cancelEditMessage();
    } catch {
      setError("Could not edit message");
    }
  };

  const deleteMessage = async (messageId: string) => {
    setMenuMessageId(null);
    try {
      const res = await apiFetch(`/messages/item/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message || "Could not delete message");
        return;
      }
      const updated = (await res.json()) as ChatMessage;
      setMessages((prev) =>
        prev.map((m) => (sameId(m._id, updated._id) ? { ...m, ...updated } : m))
      );
    } catch {
      setError("Could not delete message");
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recordChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunksRef.current, {
          type: "audio/webm",
        });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setSelectedFiles((prev) => [...prev, file]);
        setIsRecording(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access is required for voice messages.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const sendMessage = async () => {
    const t = text.trim();

    // allow media-only messages
    if (!t && selectedFiles.length === 0) return;

    if (!activeRoomId) return;

    if (t.length > MAX_MESSAGE_CHARS) {
      setError(
        `Message is too long (max ${MAX_MESSAGE_CHARS} characters).`
      );
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // optimistic clear
      setText("");

      let attachments: ChatAttachment[] = [];

      // upload media
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(
          selectedFiles
        );
      }

      const res = await apiFetch(
        "/messages",
        {
          method: "POST",
          body: JSON.stringify({
            roomId: activeRoomId,
            text: t,
            attachments,
          }),
        }
      );

      if (!res.ok) {
        const err = (await res
          .json()
          .catch(() => ({}))) as {
            message?: string;
          };

        setText(t);

        setError(
          err.message ||
          "Failed to send message"
        );

        return;
      }

      // IMPORTANT
      // socket already adds message
      // don't append again here

      setSelectedFiles([]);
      setUploadProgress(0);
    } catch (err) {
      console.log(err);

      setText(t);

      setError(
        "Failed to send message"
      );
    } finally {
      setUploading(false);
      setSelectedFiles([]);
    }
  };

  const onTyping = () => {
    const s = getSocket();
    const id = activeRoomIdRef.current;
    if (s?.connected && id) {
      s.emit("typing", { roomId: String(id) });
    }
  };

  if (!isLoaded) {
    return <div className="text-sm text-gray-500">Loading…</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="text-sm text-gray-600">
        Sign in to use enterprise team messaging in {PRODUCT_NAME}.
      </div>
    );
  }

  if (!workspaceReady) {
    return <div className="text-sm text-gray-500">Loading your workspace…</div>;
  }

  const activeRoom = rooms.find((r) => String(r._id) === activeRoomId);

  const peerPresence: PresenceStatus | undefined =
    activeRoom?.type === "direct" && activeRoom.peer?._id
      ? presenceByUser[activeRoom.peer._id] ||
        activeRoom.peer.presenceStatus ||
        "free"
      : undefined;

  return (
    <div className="flex w-full mx-auto flex-1 min-h-0 flex-col gap-1">


      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 rounded-md p-1 text-rose-700 hover:bg-rose-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex h-full min-h-0 flex-1 overflow-hidden rounded-[28px] border border-black/[0.04] bg-[#fbfbfc] shadow-[0_10px_40px_rgba(0,0,0,0.04)] md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-[#f7f7f8] md:w-[320px] md:border-b-0 md:border-r md:border-gray-200">
          <div className="border-b border-gray-200/90 px-3 py-3 md:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Chats</p>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search people & channels…"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full rounded-2xl border border-black/[0.05] bg-[#fbfbfc]/95 backdrop-blur-xl/90 backdrop-blur-xl py-2 pl-8 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loadingRooms ? (
              <p className="px-2 py-3 text-xs text-gray-500">Loading chats…</p>
            ) : rooms.length === 0 ? (
              <p className="px-2 py-3 text-xs text-gray-600">
                No chats yet. Use <strong className="text-gray-900">New chat</strong> for a
                one-to-one message or <strong className="text-gray-900">New channel</strong> for a
                team room.
              </p>
            ) : filteredRooms.length === 0 ? (
              <p className="px-2 py-3 text-xs text-gray-500">No chats match your search.</p>
            ) : (
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 px-2 mt-1 mb-1">
                    Direct messages
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDmSearch("");
                      setNewDmOpen(true);
                    }}
                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] py-2 text-xs font-medium text-white shadow-sm transition hover:bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] hover:scale-[1.01]"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    New chat
                  </button>
                  {directRooms.length === 0 ? (
                    <p className="px-2 py-2 text-[11px] leading-snug text-gray-500">
                      No personal chats yet. Start a DM with a teammate.
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {directRooms.map((r) => {
                        const id = String(r._id);
                        const unread = unreadByRoom[id] || 0;
                        const active = activeRoomId === id;
                        const label = roomDisplayName(r);
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRoomId(id);
                                setError(null);
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition-all duration-150 hover:scale-[1.01] ${active
                                ? "bg-[#fbfbfc]/95 backdrop-blur-xl text-black shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-black/[0.04]"
                                : "text-gray-600 hover:bg-[radial-gradient(circle_at_top,#ffffff,transparent_70%)] bg-[#fbfbfc]"
                                }`}
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#6264A7] to-[#4f52b2] shadow-sm ring-1 ring-black/5">
                                  {r.peer?.image ? (
                                    <img
                                      src={r.peer.image}
                                      alt={label}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs font-semibold uppercase tracking-wide text-white">
                                      {senderInitial(label)}
                                    </span>
                                  )}

                                  <span
                                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white ${presenceDotClass(
                                      r.peer?._id
                                        ? presenceByUser[r.peer._id] ||
                                            r.peer.presenceStatus
                                        : "free"
                                    )}`}
                                    title={presenceLabel(
                                      r.peer?._id
                                        ? presenceByUser[r.peer._id] ||
                                            r.peer.presenceStatus
                                        : "free"
                                    )}
                                  />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">{label}</span>
                                  {r.peer?.email ? (
                                    <span className="block truncate text-[10px] text-gray-400">
                                      {r.peer.email}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                              {unread > 0 && !active && (
                                <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                                  {unread > 9 ? "9+" : unread}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 px-2 mt-2 mb-1">
                    Channels
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewChannelName("");
                      setCreateChannelOpen(true);
                    }}
                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-[#fbfbfc]/95 backdrop-blur-xl py-2 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 hover:scale-[1.01]"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    New channel
                  </button>
                  {groupRooms.length === 0 ? (
                    <p className="px-2 py-2 text-[11px] leading-snug text-gray-500">
                      No team channels in view. Create one for group discussions.
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {groupRooms.map((r) => {
                        const id = String(r._id);
                        const unread = unreadByRoom[id] || 0;
                        const active = activeRoomId === id;
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRoomId(id);
                                setError(null);
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition-all duration-150 hover:scale-[1.01] ${active
                                ? "bg-[#fbfbfc]/95 backdrop-blur-xl text-black shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-black/[0.04]"
                                : "text-gray-600 hover:bg-[radial-gradient(circle_at_top,#ffffff,transparent_70%)] bg-[#fbfbfc]"
                                }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Hash className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                                <span className="truncate font-medium">{r.name || "Channel"}</span>
                              </span>
                              {unread > 0 && !active && (
                                <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-purple-100 px-1.5 text-[10px] font-bold text-purple-700">
                                  {unread > 9 ? "9+" : unread}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200/90 px-3 py-2.5 md:px-4">
            <p className="flex items-center gap-1.5 text-[10px] leading-snug text-gray-500">
              <Shield className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
              Workspace-isolated threads. Retention follows your org policy.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,#ffffff,transparent_70%)] bg-[#fbfbfc] min-h-0 overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl px-4 py-3.5 md:px-6">
            <div>
              <h2 className="text-sm font-medium text-gray-900">
                {activeRoom ? roomDisplayName(activeRoom) : "Select a chat"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                {activeRoom?.type === "direct" ? (
                  <>
                    <span>Direct message</span>
                    {peerPresence ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${presenceDotClass(peerPresence)}`}
                        />
                        {presenceLabel(peerPresence)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  `${PRODUCT_NAME} · Workspace channel`
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end md:pt-0.5">
              <div className="hidden sm:flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-0.5 text-[10px]">
                {(["free", "busy", "working"] as PresenceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => void updatePresence(st)}
                    className={`rounded-lg px-2 py-1 font-medium capitalize transition ${
                      presenceStatus === st
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {presenceLabel(st)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setChatSettingsOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                title="Chat wallpaper"
              >
                <Palette size={18} />
              </button>
              <div
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${socketConnected
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                title="WebSocket connection to messaging service"
              >
                {socketConnected ? (
                  <Wifi className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" aria-hidden />
                )}
                {socketConnected ? "Live" : "Connecting…"}
              </div>
              {notifPermission === "denied" ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                  <BellOff size={14} />
                  {/* Browser blocked notifications */}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={async () => {

                      const next = !notificationsOn;

                      try {
                        localStorage.setItem(
                          NOTIFICATION_STORAGE_KEY,
                          next ? "1" : "0"
                        );
                      } catch { }

                      setNotificationsOn(next);

                      if (next) {

                        playMessageChime();

                        if ("Notification" in window) {

                          const permission =
                            await Notification.requestPermission();

                          setNotifPermission(permission);

                          if (permission === "granted") {

                            new Notification(
                              "Notifications enabled",
                              {
                                body:
                                  "You will now receive chat alerts.",
                              }
                            );
                          }
                        }
                      }
                    }}
                    className={`group flex h-11 w-11 min-h-[44px] min-w-[44px]
  items-center justify-center rounded-2xl border
  transition-all duration-200 ${notificationsOn
                        ? "border-[#7c5cff]/15 bg-gradient-to-r from-[#7c5cff]/12 to-[#5b4bdb]/12 shadow-[0_4px_18px_rgba(124,92,255,0.18)]"
                        : "border-black/[0.05] bg-white/70 text-gray-400 backdrop-blur-xl"
                      }`}
                    title={
                      notificationsOn
                        ? "Notifications enabled"
                        : "Notifications disabled"
                    }
                  >
                    <div className="relative flex h-[18px] w-[18px] items-center justify-center">

                      {notificationsOn ? (
                        <BellRing
                          className="h-[18px] w-[18px] text-[#6d5afc]"
                          strokeWidth={2.3}
                        />
                      ) : (
                        <BellOff
                          className="h-[16px] w-[16px] text-gray-400"
                          strokeWidth={2.1}
                        />
                      )}

                      {notificationsOn && (
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#64eb96] ring-2 ring-white" />
                      )}

                    </div>
                  </button>
                </>
              )}

            </div>
          </div>

          {chatSettingsOpen && (
            <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Chat background
              </p>
              <div className="flex flex-wrap gap-2">
                {CHAT_WALLPAPER_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void saveWallpaper(id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      chatWallpaper === id
                        ? "border-[#7c5cff] bg-[#7c5cff]/10 text-[#5b4bdb]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {CHAT_WALLPAPER_LABELS[id]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 sm:hidden">
                Your status
              </p>
              <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                {(["free", "busy", "working"] as PresenceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => void updatePresence(st)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
                      presenceStatus === st
                        ? "bg-black text-white"
                        : "border border-gray-200 text-gray-600"
                    }`}
                  >
                    {presenceLabel(st)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            ref={chatContainerRef}
            className="relative flex-1 overflow-y-auto"
            style={chatWallpaperStyle(chatWallpaper)}
          >
            <div className="relative mx-auto max-w-3xl px-3 py-5 md:px-6">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const showDay = i === 0 || dayKey(m.createdAt) !== dayKey(prev?.createdAt);
                const mine = sameId(senderId(m), myUserId);
                const header = showSenderHeader(prev, m);
                const name = senderName(m);
                const time = formatMessageTime(m.createdAt);

                return (
                  <div key={m._id}>
                    {showDay && (
                      <div className="mb-4 flex justify-center">
                        <span className="rounded-full border border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-500 shadow-sm">
                          {formatDayDivider(m.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`mb-1 flex gap-2 md:gap-3 ${mine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!mine && (
                        <div className="flex w-5 shrink-0 flex-col items-center pt-0.5">
                          {header ? (
                            <div
                              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-purple-100 shadow-sm ring-1 ring-gray-100"
                              title={name}
                            >
                              {senderImage(m) ? (
                                <img
                                  src={senderImage(m)!}
                                  alt={name}
                                  className="h-10 w-10 object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-purple-700">
                                  {senderInitial(name)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-10" aria-hidden />
                          )}
                        </div>
                      )}
                      {mine && <div className="hidden w-9 shrink-0 sm:block" aria-hidden />}

                      <div
                        className={`flex min-w-0 max-w-[min(92%,520px)] flex-col ${mine ? "items-end" : "items-start"}`}
                      >
                        {header && !mine && (
                          <div className="mb-0.5 flex items-baseline gap-2 pl-1.5">
                            <span className="text-xs font-semibold text-gray-900">{name}</span>
                            <span className="text-[10px] font-medium text-gray-400">{time}</span>
                          </div>
                        )}
                        {header && mine && (
                          <div className="mb-0.5 flex items-baseline gap-2 pr-0.5">
                            <span className="text-[10px] font-medium text-gray-400">{time}</span>
                            <span className="text-xs font-semibold text-gray-600">You</span>
                          </div>
                        )}
                        <div className="relative group/msg">
                        {mine && !m.isDeleted && (
                          <div className="absolute -left-8 top-1 z-10 opacity-0 transition group-hover/msg:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuMessageId(
                                  menuMessageId === m._id ? null : m._id
                                )
                              }
                              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              aria-label="Message options"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {menuMessageId === m._id && (
                              <div className="absolute right-0 top-6 z-20 min-w-[120px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => startEditMessage(m)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteMessage(m._id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${m.isDeleted
                            ? "rounded-2xl border border-dashed border-gray-300 bg-gray-100/80 px-3 py-2 text-xs italic text-gray-500"
                            : mine
                            ? m.attachments?.length && !m.text
                              ? "bg-transparent shadow-none border-0"
                              : "rounded-[20px] border border-gray-800 bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] text-white shadow-sm px-2.5 pt-2.5 pb-2"
                            : m.attachments?.length && !m.text
                              ? "bg-transparent shadow-none border-0"
                              : "rounded-2xl rounded-bl-md border border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl text-gray-900 shadow-sm px-2.5 pt-2.5 pb-2"
                            }`}
                        >
                          {m.isDeleted ? (
                            <span>This message was deleted</span>
                          ) : editingMessageId === m._id ? (
                            <div className="space-y-2 min-w-[200px]">
                              <textarea
                                className="w-full rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-sm text-white placeholder:text-white/60"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEditMessage}
                                  className="rounded-lg px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void submitEditMessage()}
                                  className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-[#5b4bdb]"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                          {m.text && <div>{m.text}</div>}
                          {m.editedAt ? (
                            <p
                              className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-gray-400"}`}
                            >
                              Edited
                            </p>
                          ) : null}

                          {/* Attachments */}
                          {m.attachments?.length ? (
                            <div className="mt-2 space-y-2">
                              {m.attachments?.length ? (
                                <div className="mt-2 space-y-2">
                                  {m.attachments.map((a, i) => (
                                    <div
                                      key={i}
                                      className="overflow-hidden rounded-xl bg-gray-100"
                                    >
                                      {a.type === "image" ? (
                                        <img
                                          src={a.url}
                                          alt={a.name || "image"}
                                          onClick={() =>
                                            setPreviewImage(a.url)
                                          }
                                          className="max-h-[140px] w-full cursor-pointer rounded-xl object-cover"
                                        />
                                      ) : a.type === "video" ? (
                                        <div
                                          className="relative cursor-pointer overflow-hidden rounded-xl"
                                          onClick={() =>
                                            setPreviewVideo(a.url)
                                          }
                                        >
                                          <video
                                            src={a.url}
                                            className="max-h-[140px] w-full rounded-xl object-cover"
                                          />

                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="rounded-full bg-black/60 p-4 text-white backdrop-blur">
                                              <Play size={28} />
                                            </div>
                                          </div>
                                        </div>
                                      ) : a.type === "audio" ? (
                                        <audio
                                          controls
                                          src={a.url}
                                          className="max-w-full min-w-[220px]"
                                          preload="metadata"
                                        />
                                      ) : (
                                        <a
                                          href={a.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${mine
                                            ? "bg-white/10 text-white"
                                            : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                          <Paperclip size={16} />
                                          <span className="truncate">
                                            {a.name || "Attachment"}
                                          </span>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : null}


                              {/* IMAGE PREVIEW */}
                              {previewImage && (
                                <div
                                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 p-4 backdrop-blur-sm"
                                  onClick={() => setPreviewImage(null)}
                                >
                                  <button
                                    className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                                    onClick={() => setPreviewImage(null)}
                                  >
                                    <X size={22} />
                                  </button>

                                  <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}

                              {/* VIDEO PREVIEW */}
                              {previewVideo && (
                                <div
                                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 p-4 backdrop-blur-sm"
                                  onClick={() => setPreviewVideo(null)}
                                >
                                  <button
                                    className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                                    onClick={() => setPreviewVideo(null)}
                                  >
                                    <X size={22} />
                                  </button>

                                  <video
                                    src={previewVideo}
                                    controls
                                    autoPlay
                                    className="max-h-[92vh] max-w-[92vw] rounded-2xl shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                          ) : null}
                            </>
                          )}
                        </div>
                        </div>
                        {mine && !m.isDeleted && (
                          <span
                            className="mt-1 flex items-center justify-end"
                            title={
                              messageReadByRecipients(m, myUserId, activeRoom)
                                ? "Read"
                                : "Sent"
                            }
                          >
                            {messageReadByRecipients(m, myUserId, activeRoom) ? (
                              <CircleCheck
                                className="h-4 w-4 text-[#d8d4ff]"
                                strokeWidth={2.4}
                              />
                            ) : (
                              <Circle
                                className="h-4 w-4 text-white/60"
                                strokeWidth={2.4}
                              />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
              {messages.length === 0 && !loadingRooms && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl py-14 text-center text-sm text-gray-500 shadow-sm">
                  No messages in this channel yet. Send a message below to open the thread.
                </div>
              )}
            </div>
          </div>

          {typingFrom && (
            <p className="border-t border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl px-4 py-2 text-xs text-gray-700 md:px-6">
              <span className="mr-1 inline-flex gap-0.5 align-middle">
                <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400" />
                <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:120ms]" />
                <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:240ms]" />
              </span>
              <strong className="text-gray-900">{typingFrom}</strong> is composing…
            </p>
          )}

          <div className="flex shrink-0 gap-2 border-t border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl p-3 md:p-4">
            {selectedFiles.length > 0 && (
              <div className="border-t border-gray-200 bg-white px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                    >
                      {file.type.startsWith(
                        "image"
                      ) ? (
                        <img
                          src={URL.createObjectURL(
                            file
                          )}
                          alt={file.name}
                          className="h-24 w-24 object-cover"
                        />
                      ) : file.type.startsWith(
                        "video"
                      ) ? (
                        <video
                          src={URL.createObjectURL(
                            file
                          )}
                          className="h-24 w-24 object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center p-3 text-xs text-gray-600">
                          {file.name}
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setSelectedFiles((prev) =>
                            prev.filter(
                              (_, idx) => idx !== i
                            )
                          )
                        }
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {uploading && (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] transition-all"
                        style={{
                          width: `${uploadProgress}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Uploading...
                      {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}
            <textarea
              className="min-h-[48px] max-h-36 flex-1 resize-y rounded-xl border border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={
                activeRoomId
                  ? activeRoom?.type === "direct"
                    ? `Message ${roomDisplayName(activeRoom)} — Enter to send, Shift+Enter for new line`
                    : `Message #${activeRoom?.name || "channel"} — Enter to send, Shift+Enter for new line`
                  : "Select a chat or start a new one from the sidebar"
              }
              rows={1}
              disabled={!activeRoomId}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setSelectedFiles((prev) => [...prev, ...files]);
                  e.target.value = "";
                }}
              />
              <Paperclip size={18} className="text-gray-600" />
            </label>
            <button
              type="button"
              onClick={() =>
                isRecording ? stopVoiceRecording() : void startVoiceRecording()
              }
              disabled={!activeRoomId}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition ${
                isRecording
                  ? "border-rose-300 bg-rose-50 text-rose-600 animate-pulse"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
              title={isRecording ? "Stop recording" : "Voice message"}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              type="button"
              onClick={sendMessage}
              disabled={!activeRoomId}
              className="inline-flex shrink-0 items-center gap-2 self-end rounded-lg bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </div>
      </div>

      {createChannelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb]/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creatingChannel) setCreateChannelOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-channel-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="new-channel-title" className="text-lg font-semibold text-gray-900">
              New channel
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Everyone in your workspace is added to this channel automatically, including people who
              join later. Use a separate flow with{" "}
              <code className="rounded bg-gray-100 px-1 text-xs">membersScope: &quot;custom&quot;</code>{" "}
              on the API when you need a private subset.
            </p>
            <label className="mt-4 block text-xs font-medium text-gray-600">
              Channel name
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g. Delivery, Sales, Engineering"
                maxLength={80}
                autoFocus
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setCreateChannelOpen(false)}
                disabled={creatingChannel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] px-4 py-2 text-sm font-medium text-white hover:bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb] disabled:opacity-50"
                onClick={() => void createChannel()}
                disabled={creatingChannel}
              >
                {creatingChannel ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {newDmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-[#7c5cff] to-[#5b4bdb]/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNewDmOpen(false);
              setDmSearch("");
            }
          }}
        >
          <div
            className="flex max-h-[min(560px,85vh)] w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-[#fbfbfc]/95 backdrop-blur-xl shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-dm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 p-5 pb-3">
              <h2 id="new-dm-title" className="text-lg font-semibold text-gray-900">
                New chat
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Pick a workspace member. If you already have a thread with them, you will jump back
                into the same conversation.
              </p>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Search by name or email…"
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {loadingAssignable ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">Loading teammates…</p>
              ) : dmTeammates.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">
                  No teammates match your search.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {dmTeammates.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => void startDm(u.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 transition hover:bg-[radial-gradient(circle_at_top,#ffffff,transparent_70%)] bg-[#fbfbfc] hover:scale-[1.01]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                          {senderInitial(u.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-gray-900">{u.name}</span>
                          {u.email ? (
                            <span className="block truncate text-xs text-gray-500">{u.email}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-gray-100 p-4">
              <button
                type="button"
                className="w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setNewDmOpen(false);
                  setDmSearch("");
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
