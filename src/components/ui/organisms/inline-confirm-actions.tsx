import * as React from "react";

interface InlineConfirmActionsProps {
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
  children: React.ReactNode;
}

export function InlineConfirmActions({
  confirming,
  onConfirm,
  onCancel,
  pending,
  confirmLabel = "Delete",
  pendingLabel = "…",
  children,
}: InlineConfirmActionsProps) {
  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={onConfirm}
          disabled={pending}
          className="text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="text-[12px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return <div className="flex items-center gap-1">{children}</div>;
}
