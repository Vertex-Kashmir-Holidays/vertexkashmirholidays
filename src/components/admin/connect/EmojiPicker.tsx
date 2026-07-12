"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const EMOJI_GROUPS: Array<{ label: string; emojis: string[] }> = [
  {
    label: "Smileys",
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","😶‍🌫️","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿"],
  },
  {
    label: "Gestures",
    emojis: ["👍","👎","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","🤜","🤛","✊","👊","🙌","🫶","👐","🤲","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","👀","👁️","👅","👄","🫦","🦷","👣"],
  },
  {
    label: "Hearts & Symbols",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","🕉️","✡️","🔯","☦️","⭐","🌟","💫","⚡","🌈","🎉","🎊","🎈","🎁","🔥","💯","✅","❌","⚠️","🚨","🔔","💡","🔑","🔒","🔓","📌","📍","💬","💭","🗨️"],
  },
  {
    label: "Work",
    emojis: ["💼","📊","📈","📉","📋","📝","✏️","🖊️","📌","📍","📎","🖇️","📂","📁","🗂️","📅","📆","🗒️","🗓️","📓","📔","📒","📕","📗","📘","📙","📚","🖥️","💻","🖨️","⌨️","🖱️","📱","☎️","📞","📟","📠","📡","🔭","🔬","💊","🧪","🧬","🔧","🔨","⚙️","🛠️","🧰","🗑️","📤","📥","📬","✉️","📧","💌"],
  },
  {
    label: "Nature",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪲","🌸","🌺","🌻","🌹","🌷","🌱","🌿","🍀","🌴","🌵","🌊","🌙","🌞","🌈","❄️","🍃"],
  },
  {
    label: "Food",
    emojis: ["🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍑","🍒","🥭","🍍","🥥","🥝","🍅","🫒","🥑","🍆","🥕","🧄","🧅","🥔","🌽","🌶️","🫑","🥦","🧆","🫘","🍞","🥖","🥐","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🌭","🍔","🍟","🍕","🥙","🌮","🌯","🫔","🥗","🍝","🍜","🍛","🍣","🍱","🍚","🍙","🧁","🍰","🎂","🍩","🍪","☕","🍵","🧋","🥤","🍺","🍻","🥂","🍾"],
  },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 w-80 max-h-80 overflow-y-auto rounded-xl border-2 border-border bg-card shadow-2xl p-3"
      style={{ opacity: 1 }}
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.emojis.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(emoji)}
                className={cn(
                  "text-2xl w-10 h-10 flex items-center justify-center rounded-lg",
                  "hover:bg-muted transition-colors hover:scale-110",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
