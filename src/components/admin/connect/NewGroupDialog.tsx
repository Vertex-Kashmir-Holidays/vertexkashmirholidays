"use client";
import { useRef, useState } from "react";
import { X, Upload, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Props {
  staffUsers: StaffUser[];
  currentUserId: string;
  onCreated: (roomId: string) => void;
  onClose: () => void;
}

export function NewGroupDialog({ staffUsers, currentUserId, onCreated, onClose }: Props) {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const candidates = staffUsers.filter((u) => u.id !== currentUserId);

  function toggleMember(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function uploadAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be under 2 MB.");
      return;
    }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "connect");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvatarUrl(data.url);
    } catch {
      setError("Avatar upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Group name is required."); return; }
    if (selectedIds.size === 0) { setError("Select at least one member."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/connect/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          memberIds: [...selectedIds],
          avatarUrl: avatarUrl ?? undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create group");
      }
      const room = await res.json();
      onCreated(room.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">New Group</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
          {/* Group avatar + name row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              className={cn(
                "relative w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center shrink-0",
                "hover:border-primary/60 transition-colors overflow-hidden bg-muted",
                avatarUploading && "opacity-60",
              )}
              title="Upload group avatar"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : avatarUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                maxLength={80}
                className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <input
              ref={fileRef}
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

          {/* Member selection */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Add members ({selectedIds.size} selected)
            </p>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border">
              {candidates.map((u) => {
                const checked = selectedIds.has(u.id);
                return (
                  <label
                    key={u.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/60 transition-colors",
                      checked && "bg-primary/5",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(u.id)}
                      className="accent-primary"
                    />
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {(u.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm">{u.name ?? u.id}</span>
                    <span className="ml-auto text-[12px] text-muted-foreground capitalize">
                      {u.role.toLowerCase()}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || avatarUploading}
              className={cn(
                "flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors",
                (submitting || avatarUploading) && "opacity-60 cursor-not-allowed",
              )}
            >
              {submitting ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
