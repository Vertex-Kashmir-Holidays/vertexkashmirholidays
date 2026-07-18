"use client";
import { useRef, useMemo, useState } from "react";
import { X, Upload, Loader2, Shield, ShieldOff, UserMinus, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectRoom } from "./hooks/useRoomList";
import { usePresence } from "./hooks/usePresence";

const PRESENCE_COLORS = {
  ONLINE: "bg-green-500",
  AWAY: "bg-amber-400",
  BUSY: "bg-red-500",
  OFFLINE: "bg-zinc-400",
} as const;

interface StaffUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Props {
  room: ConnectRoom;
  currentUserId: string;
  staffUsers: StaffUser[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

function MemberAvatar({
  name,
  image,
  size = 36,
}: {
  name: string | null;
  image: string | null;
  size?: number;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold shrink-0 text-xs"
      style={{ width: size, height: size }}
    >
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function GroupInfoPanel({ room, currentUserId, staffUsers, onClose, onRefresh }: Props) {
  const myMember = room.members.find((m) => m.userId === currentUserId);
  const isAdmin = myMember?.role === "ADMIN";

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(room.name ?? "");
  const [savingName, setSavingName] = useState(false);

  // Avatar uploading
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Per-member busy state (userId → "remove" | "role")
  const [busy, setBusy] = useState<{ id: string; action: string } | null>(null);

  // Add-member section
  const [addingId, setAddingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const memberIds = new Set(room.members.map((m) => m.userId));
  const nonMembers = staffUsers.filter((u) => !memberIds.has(u.id));
  const activeAdminCount = room.members.filter((m) => m.role === "ADMIN").length;

  // Poll presence for all current group members
  const memberUserIds = useMemo(() => room.members.map((m) => m.userId), [room.members]);
  const presenceMap = usePresence(memberUserIds);

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === room.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      const res = await fetch(`/api/connect/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to rename");
      }
      await onRefresh();
      setEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename group.");
    } finally {
      setSavingName(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be under 2 MB.");
      return;
    }
    setAvatarUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "connect");
      const up = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!up.ok) throw new Error();
      const { url } = await up.json();
      const res = await fetch(`/api/connect/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!res.ok) throw new Error();
      await onRefresh();
    } catch {
      setError("Avatar upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function removeMember(userId: string) {
    setBusy({ id: userId, action: "remove" });
    setError(null);
    try {
      const res = await fetch(`/api/connect/rooms/${room.id}/members/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to remove member");
      }
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    setBusy({ id: userId, action: "role" });
    setError(null);
    try {
      const res = await fetch(`/api/connect/rooms/${room.id}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to change role");
      }
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role.");
    } finally {
      setBusy(null);
    }
  }

  async function addMember(userId: string) {
    setAddingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/connect/rooms/${room.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to add member");
      }
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setAddingId(null);
    }
  }

  async function leaveGroup() {
    setBusy({ id: currentUserId, action: "remove" });
    setError(null);
    try {
      const res = await fetch(`/api/connect/rooms/${room.id}/members/${currentUserId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to leave group");
      }
      await onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave group.");
      setBusy(null);
    }
  }

  const currentAvatarUrl = room.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-sm">Group Info</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Identity: avatar + name */}
          <div className="flex flex-col items-center gap-3 py-6 px-5 border-b border-border">
            {/* Avatar */}
            <div className="relative">
              {currentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAvatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold">
                  {(room.name ?? "G").charAt(0).toUpperCase()}
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full p-1 hover:bg-muted transition-colors"
                  title="Change avatar"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              )}
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Group name */}
            {editingName ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  maxLength={80}
                  className="flex-1 text-sm text-center rounded-lg border border-border bg-muted/50 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary"
                >
                  {savingName ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{room.name ?? "Group"}</span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setNameInput(room.name ?? "");
                      setEditingName(true);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Rename group"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {room.members.length} member{room.members.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mt-3">
              <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            </div>
          )}

          {/* Members list */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Members
            </p>
            <div className="space-y-1">
              {room.members.map((m) => {
                const isSelf = m.userId === currentUserId;
                const isBusy = busy?.id === m.userId;
                const isLastAdmin = m.role === "ADMIN" && activeAdminCount === 1;

                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2.5 py-2 rounded-xl hover:bg-muted/40 px-2 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <MemberAvatar name={m.user.name} image={m.user.image} size={32} />
                      {(() => {
                        const ps = presenceMap[m.userId] ?? "OFFLINE";
                        return ps !== "OFFLINE" ? (
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-card",
                              PRESENCE_COLORS[ps],
                            )}
                          />
                        ) : null;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {m.user.name ?? m.userId}
                        {isSelf && (
                          <span className="ml-1 text-[12px] text-muted-foreground">(you)</span>
                        )}
                      </p>
                    </div>

                    {/* Role badge */}
                    {m.role === "ADMIN" && (
                      <span className="text-[12px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                        Admin
                      </span>
                    )}

                    {/* Admin-only actions (not on self) */}
                    {isAdmin && !isSelf && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Promote / demote */}
                        <button
                          onClick={() => toggleRole(m.userId, m.role)}
                          disabled={isBusy || isLastAdmin}
                          title={m.role === "ADMIN" ? "Remove admin role" : "Make admin"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isLastAdmin
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {isBusy && busy?.action === "role" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : m.role === "ADMIN" ? (
                            <ShieldOff className="w-3.5 h-3.5" />
                          ) : (
                            <Shield className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Remove member */}
                        <button
                          onClick={() => removeMember(m.userId)}
                          disabled={isBusy || isLastAdmin}
                          title={isLastAdmin ? "Cannot remove last admin" : "Remove from group"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isLastAdmin
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-red-500/10 text-muted-foreground hover:text-red-500",
                          )}
                        >
                          {isBusy && busy?.action === "remove" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserMinus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add members (admin only) */}
          {isAdmin && nonMembers.length > 0 && (
            <div className="px-5 pt-3 pb-4 border-t border-border mt-2">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Add Members
              </p>
              <div className="space-y-1">
                {nonMembers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-muted/40 transition-colors"
                  >
                    <MemberAvatar name={u.name} image={u.image} size={28} />
                    <span className="flex-1 text-sm truncate text-muted-foreground">
                      {u.name ?? u.id}
                    </span>
                    <button
                      onClick={() => addMember(u.id)}
                      disabled={addingId === u.id}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors shrink-0 disabled:opacity-50"
                    >
                      {addingId === u.id ? "Adding…" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Leave group */}
        <div className="shrink-0 px-5 py-4 border-t border-border">
          <button
            onClick={leaveGroup}
            disabled={
              busy?.id === currentUserId || (myMember?.role === "ADMIN" && activeAdminCount === 1)
            }
            title={
              myMember?.role === "ADMIN" && activeAdminCount === 1
                ? "Promote another member to admin before leaving"
                : "Leave this group"
            }
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-medium transition-colors",
              myMember?.role === "ADMIN" && activeAdminCount === 1
                ? "border border-border text-muted-foreground opacity-40 cursor-not-allowed"
                : "border border-red-300 text-red-500 hover:bg-red-500/10",
            )}
          >
            {busy?.id === currentUserId ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Leaving…
              </span>
            ) : (
              "Leave Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
