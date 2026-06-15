import React from "react";

interface FormattedTextProps {
  text: string;
  className?: string;
}

export default function FormattedText({ text, className = "" }: FormattedTextProps) {
  if (!text) return null;

  // Split content into blocks by double line breaks
  const blocks = text.split(/\n\s*\n/);

  const parseInlineStyles = (content: string) => {
    // Regex for bold text: **text** or __text__
    const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
    // Regex for inline code: `code`
    const codeRegex = /`([^`]+)`/g;

    let parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // We can run a simple replacement or build matching structures.
    // Let's replace code and bold structures step-by-step
    const tempText = content;
    
    // Quick helper to convert markdown to React nodes safely
    let match;
    const items: { startIndex: number; endIndex: number; type: "bold" | "code"; value: string }[] = [];

    // Find all bold instances
    const boldMatches = [...tempText.matchAll(/\*\*([^*]+)\*\*/g)];
    for (const m of boldMatches) {
      if (m.index !== undefined) {
        items.push({
          startIndex: m.index,
          endIndex: m.index + m[0].length,
          type: "bold",
          value: m[1]
        });
      }
    }

    // Find all inline code instances
    const codeMatches = [...tempText.matchAll(/`([^`]+)`/g)];
    for (const m of codeMatches) {
      if (m.index !== undefined) {
        items.push({
          startIndex: m.index,
          endIndex: m.index + m[0].length,
          type: "code",
          value: m[1]
        });
      }
    }

    // Sort by start index
    items.sort((a, b) => a.startIndex - b.startIndex);

    // Resolve overlapping ranges if any, and build non-overlapping nodes list
    let index = 0;
    const nodes: React.ReactNode[] = [];

    for (const item of items) {
      if (item.startIndex < index) continue; // skip overlapping
      if (item.startIndex > index) {
        nodes.push(tempText.substring(index, item.startIndex));
      }
      if (item.type === "bold") {
        nodes.push(
          <strong key={item.startIndex} className="font-bold text-zinc-900 border-b border-zinc-150/40 pb-px">
            {item.value}
          </strong>
        );
      } else if (item.type === "code") {
        nodes.push(
          <code key={item.startIndex} className="bg-zinc-100/90 text-zinc-800 px-1.5 py-0.5 rounded font-mono text-[10.5px] border border-zinc-200">
            {item.value}
          </code>
        );
      }
      index = item.endIndex;
    }

    if (index < tempText.length) {
      nodes.push(tempText.substring(index));
    }

    return nodes.length > 0 ? nodes : content;
  };

  const renderBlock = (blockText: string, blockIndex: number) => {
    const trimmed = blockText.trim();
    if (!trimmed) return null;

    // 1. Headings: ### Title or ## Title or # Title
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={blockIndex} className="text-xs font-bold text-zinc-900 mt-4 mb-2 tracking-tight flex items-center gap-1.5 border-l-2 border-zinc-800 pl-2">
          {parseInlineStyles(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={blockIndex} className="text-sm font-bold text-zinc-900 mt-5 mb-2.5 tracking-tight border-b border-zinc-250 pb-1 flex items-center gap-2">
          {parseInlineStyles(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={blockIndex} className="text-md font-bold text-zinc-900 mt-6 mb-3 tracking-tight border-b border-zinc-300 pb-1">
          {parseInlineStyles(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
    }

    // 2. Unordered lists: line segments starting with - or *
    const lines = trimmed.split("\n");
    const isList = lines.every(line => line.trim().startsWith("- ") || line.trim().startsWith("* "));
    
    if (isList) {
      return (
        <ul key={blockIndex} className="space-y-1.5 my-3 pl-4 list-none">
          {lines.map((line, li) => {
            const cleanLine = line.trim().replace(/^[-*]\s+/, "");
            return (
              <li key={li} className="relative pl-3 text-zinc-650 leading-relaxed text-[11px]">
                <span className="absolute left-0 top-1.5 w-1 h-1 bg-zinc-800 rounded-full"></span>
                {parseInlineStyles(cleanLine)}
              </li>
            );
          })}
        </ul>
      );
    }

    // If block contains some list lines and some text lines, let's parse them individually
    return (
      <p key={blockIndex} className="leading-relaxed text-[11.5px] text-zinc-700 font-medium">
        {trimmed.split("\n").map((line, li) => {
          const isItem = line.trim().startsWith("- ") || line.trim().startsWith("* ");
          if (isItem) {
            const cleanLine = line.trim().replace(/^[-*]\s+/, "");
            return (
              <span key={li} className="block relative pl-4 my-1.5 text-zinc-650">
                <span className="absolute left-1.5 top-1.5 w-1 h-1 bg-zinc-500 rounded-full"></span>
                {parseInlineStyles(cleanLine)}
              </span>
            );
          }
          return (
            <React.Fragment key={li}>
              {li > 0 && <span className="block h-1"></span>}
              {parseInlineStyles(line)}
            </React.Fragment>
          );
        })}
      </p>
    );
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
