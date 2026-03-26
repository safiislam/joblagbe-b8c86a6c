import { useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, Minus, Undo2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
  placeholder?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

type FormatAction = {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix?: string;
  block?: boolean; // true = line-level prefix (no suffix wrapping)
};

const formatActions: (FormatAction | "sep")[] = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "*", suffix: "*" },
  "sep",
  { icon: Heading1, label: "Heading 1", prefix: "# ", block: true },
  { icon: Heading2, label: "Heading 2", prefix: "## ", block: true },
  { icon: Heading3, label: "Heading 3", prefix: "### ", block: true },
  "sep",
  { icon: List, label: "Bullet List", prefix: "- ", block: true },
  { icon: ListOrdered, label: "Numbered List", prefix: "1. ", block: true },
  { icon: Quote, label: "Blockquote", prefix: "> ", block: true },
  "sep",
  { icon: Code, label: "Inline Code", prefix: "`", suffix: "`" },
  { icon: Link2, label: "Link", prefix: "[", suffix: "](url)" },
  { icon: Minus, label: "Horizontal Rule", prefix: "\n---\n", block: true },
];

const MarkdownEditor = ({
  value,
  onChange,
  rows = 12,
  className = "",
  placeholder,
  textareaRef: externalRef,
}: MarkdownEditorProps) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const taRef = (externalRef ?? internalRef) as React.RefObject<HTMLTextAreaElement>;

  const applyFormat = useCallback(
    (action: FormatAction) => {
      const ta = taRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end);
      const before = value.slice(0, start);
      const after = value.slice(end);

      let replacement: string;
      let cursorOffset: number;

      if (action.block) {
        // For block-level, add prefix at start of line
        const lineStart = before.lastIndexOf("\n") + 1;
        const beforeLine = value.slice(0, lineStart);
        const currentLine = value.slice(lineStart, end);

        if (selected) {
          // Apply prefix to each selected line
          const lines = value.slice(lineStart, end).split("\n");
          const formatted = lines.map((l) => `${action.prefix}${l}`).join("\n");
          const newValue = beforeLine + formatted + after;
          onChange(newValue);
          setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(
              lineStart,
              lineStart + formatted.length
            );
          }, 0);
          return;
        } else {
          replacement = action.prefix;
          cursorOffset = start + replacement.length;
          onChange(before + replacement + after);
        }
      } else {
        const placeholderText = selected || "text";
        replacement = `${action.prefix}${placeholderText}${action.suffix ?? ""}`;
        cursorOffset = selected
          ? start + replacement.length
          : start + action.prefix.length + placeholderText.length;
        onChange(before + replacement + after);
      }

      setTimeout(() => {
        ta.focus();
        if (!selected && !action.block) {
          // Select the placeholder text so user can type over it
          ta.setSelectionRange(
            start + action.prefix.length,
            start + action.prefix.length + (action.block ? 0 : "text".length)
          );
        } else {
          ta.setSelectionRange(cursorOffset, cursorOffset);
        }
      }, 0);
    },
    [value, onChange, taRef]
  );

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Toolbar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 px-2 py-1.5">
          {formatActions.map((action, i) => {
            if (action === "sep") {
              return <Separator key={`sep-${i}`} orientation="vertical" className="mx-1 h-6" />;
            }
            const Icon = action.icon;
            return (
              <Tooltip key={action.label}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-background"
                    onClick={() => applyFormat(action)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {action.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Textarea */}
      <Textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm resize-y ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
};

export default MarkdownEditor;
