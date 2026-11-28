"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

interface ReorderableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (next: T[]) => void;
  /** Singular noun for accessible labels, e.g. "day" or "hotel". */
  noun: string;
  /** The controls float in the left gutter, so leave ~28px of room beside the cards. */
  className?: string;
  children: (item: T, index: number) => ReactNode;
}

// Drag-to-reorder list for the admin editors' day / hotel / stay-plan cards.
// Dragging starts only from the grip handle (the cards are full of editable
// fields, so making the whole card draggable would fight text selection); the
// up/down buttons do the same move without dragging, which matters for tall
// cards and on touch screens. On touch the grip needs a short press-and-hold
// before the drag starts, so a scroll that happens to begin on it never
// grabs a card; a mouse drags straight away.

/** Hold time before a touch on the grip starts dragging. */
const TOUCH_HOLD_MS = 300;
/** Finger movement that cancels a pending hold (it was a scroll/tap). */
const TOUCH_SLOP_PX = 8;
export function ReorderableList<T extends { id: string }>({
  items,
  onReorder,
  noun,
  className,
  children,
}: ReorderableListProps<T>) {
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  }

  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} as="div" className={className}>
      {items.map((item, index) => (
        <ReorderableRow
          key={item.id}
          item={item}
          index={index}
          count={items.length}
          noun={noun}
          onMove={move}
        >
          {children(item, index)}
        </ReorderableRow>
      ))}
    </Reorder.Group>
  );
}

function ReorderableRow<T extends { id: string }>({
  item,
  index,
  count,
  noun,
  onMove,
  children,
}: {
  item: T;
  index: number;
  count: number;
  noun: string;
  onMove: (from: number, to: number) => void;
  children: ReactNode;
}) {
  const controls = useDragControls();
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const [armed, setArmed] = useState(false);

  function cancelHold() {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  }

  function onGripDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse") {
      controls.start(e);
      return;
    }
    cancelHold();
    const { clientX: x, clientY: y } = e;
    hold.current = {
      x,
      y,
      timer: setTimeout(() => {
        hold.current = null;
        setArmed(true);
        navigator.vibrate?.(15);
        controls.start(e);
      }, TOUCH_HOLD_MS),
    };
  }

  function onGripMove(e: PointerEvent<HTMLButtonElement>) {
    const h = hold.current;
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > TOUCH_SLOP_PX) cancelHold();
  }

  function onGripEnd() {
    cancelHold();
    setArmed(false);
  }

  const buttonCls =
    "flex h-5 w-6 items-center justify-center text-muted-foreground transition hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground";

  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ zIndex: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }}
      onDragEnd={() => setArmed(false)}
      className={`relative rounded-xl ${armed ? "ring-2 ring-primary/50" : ""}`}
    >
      {children}
      <div className="no-print absolute -left-7 top-1/2 flex -translate-y-1/2 flex-col items-center rounded-md border border-border bg-card shadow-sm">
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label={`Move ${noun} ${index + 1} up`}
          className={buttonCls}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripEnd}
          onPointerCancel={onGripEnd}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={`Drag to reorder ${noun} ${index + 1} (touch: press and hold)`}
          className={`${buttonCls} cursor-grab touch-none select-none active:cursor-grabbing`}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === count - 1}
          aria-label={`Move ${noun} ${index + 1} down`}
          className={buttonCls}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}
