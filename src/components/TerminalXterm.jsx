// src/components/TerminalXterm.jsx
import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import {
  TERMINAL_PROFILE,
  TERMINAL_COMMANDS,
  OPEN_TARGETS,
  makeVFS,
  terminalHelpText,
} from "#constants";

export default function TerminalXterm({
  onOpenProjects,
  onOpenAbout,
  onOpenContact,

  // optional: pass terminal.minimized from DesktopShell so we can refit on restore
  isMinimized = false,
}) {
  const hostRef = useRef(null);

  // keep latest callbacks without re-initializing xterm
  const onOpenProjectsRef = useRef(onOpenProjects);
  const onOpenAboutRef = useRef(onOpenAbout);
  const onOpenContactRef = useRef(onOpenContact);

  useEffect(() => {
    onOpenProjectsRef.current = onOpenProjects;
  }, [onOpenProjects]);

  useEffect(() => {
    onOpenAboutRef.current = onOpenAbout;
  }, [onOpenAbout]);

  useEffect(() => {
    onOpenContactRef.current = onOpenContact;
  }, [onOpenContact]);

  // keep terminal + fit addon in refs so we can fit later
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const disposedRef = useRef(false);

  // init terminal ONCE
  useEffect(() => {
    if (!hostRef.current) return;

    const { username, hostname, home: HOME, resumeUrl } = TERMINAL_PROFILE;
    const FS = makeVFS(HOME);

    disposedRef.current = false;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.25,
      theme: {
        background: "#00000000",
        foreground: "#EDEDED",
        cursor: "#EDEDED",
        selectionBackground: "#ffffff33",
      },
      scrollback: 2000,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);

    termRef.current = term;
    fitRef.current = fit;

    term.open(hostRef.current);

    const safeFit = () => {
      if (disposedRef.current) return;
      if (!term.element) return;
      try {
        fit.fit();
      } catch {
        // ignore timing race in dev/StrictMode
      }
    };

    requestAnimationFrame(safeFit);
    setTimeout(safeFit, 0);

    // ===== helpers =====
    const normalize = (p) => {
      let x = p.replace(/\/+/g, "/");
      if (x.length > 1 && x.endsWith("/")) x = x.slice(0, -1);
      return x;
    };

    const joinPath = (cwd, arg) => {
      if (!arg) return cwd;
      if (arg.startsWith("/")) return normalize(arg);
      if (arg === "~") return HOME;
      return normalize(`${cwd}/${arg}`);
    };

    const parentDir = (p) => {
      const x = normalize(p);
      if (x === "/") return "/";
      const parts = x.split("/").filter(Boolean);
      parts.pop();
      return "/" + parts.join("/");
    };

    const isDir = (p) => FS[p]?.type === "dir";
    const isFile = (p) => FS[p]?.type === "file";

    const getExt = (name) => {
      const base = String(name || "");
      const i = base.lastIndexOf(".");
      if (i <= 0 || i === base.length - 1) return "";
      return base.slice(i).toLowerCase();
    };

    const openLink = (href) => {
      try {
        window.open(href, "_blank", "noopener,noreferrer");
      } catch {}
    };

    // Open a lightweight “Preview” tab for any text-like file
    const openPreview = (filename, content) => {
      const safeTitle = String(filename || "Preview").replace(/[<>]/g, "");
      const body = String(content ?? "");

      // simple HTML so it looks decent everywhere (Safari too)
      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background:#0b0b0d; color:#eaeaea; }
    header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.08); position: sticky; top: 0; background: rgba(11,11,13,.92); backdrop-filter: blur(10px); }
    .title { font-size: 13px; opacity: .95; }
    pre { margin: 0; padding: 16px; white-space: pre-wrap; word-break: break-word; line-height: 1.4; font-size: 13px; }
  </style>
</head>
<body>
  <header><div class="title">${safeTitle}</div></header>
  <pre>${body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      // Open immediately (works as a user gesture from Enter/command)
      const w = window.open(url, "_blank", "noopener,noreferrer");

      // If popups blocked, at least show the url in terminal
      if (!w) {
        return { ok: false, url };
      }

      // Revoke later
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return { ok: true };
    };

    let cwd = HOME;
    let buffer = "";

    // history
    let history = [];
    let histPos = -1;

    // ctrl+r search
    let searchMode = false;
    let searchQuery = "";
    let searchMatch = "";

    const promptText = () => `${username}@${hostname} ${cwd.replace(HOME, "~")} % `;
    const writeln = (s = "") => term.writeln(String(s));
    const outLines = (text) =>
      String(text).split("\n").forEach((ln) => writeln(ln));

    const writePrompt = () => term.write(promptText());

    const renderLine = (text) => {
      term.write("\r\x1b[2K");
      term.write(promptText() + text);
    };

    const listDirEntries = (dirPath) => {
      if (!isDir(dirPath)) return [];
      return FS[dirPath].children || [];
    };

    const commonPrefix = (arr) => {
      if (!arr.length) return "";
      let p = arr[0];
      for (let i = 1; i < arr.length; i++) {
        while (!arr[i].startsWith(p) && p) p = p.slice(0, -1);
      }
      return p;
    };

    const findReverseMatch = (q) => {
      if (!q) return "";
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].toLowerCase().includes(q.toLowerCase()))
          return history[i];
      }
      return "";
    };

    const renderSearchLine = () => {
      term.write("\r\x1b[2K");
      term.write(`(reverse-i-search)\`${searchQuery}\`: ${searchMatch}`);
    };

    const runCommand = (cmdRaw) => {
      const cmdLine = cmdRaw.trim();
      if (!cmdLine) return;

      history.push(cmdLine);
      histPos = -1;

      const parts = cmdLine.split(/\s+/);
      const base = (parts[0] || "").toLowerCase();
      const argStr = parts.slice(1).join(" ").trim();
      const argLower = argStr.toLowerCase();

      switch (base) {
        case "help":
          outLines(terminalHelpText);
          break;

        case "clear":
          term.clear();
          break;

        case "pwd":
          writeln(cwd);
          break;

        case "ls": {
          const entries = listDirEntries(cwd);
          writeln(entries.join("  "));
          break;
        }

        case "cd": {
          const target = argStr || HOME;
          let next;

          if (target === "/") next = "/";
          else if (target === "..") next = parentDir(cwd);
          else next = joinPath(cwd, target);

          if (isDir(next)) cwd = next;
          else if (isFile(next)) writeln(`cd: not a directory: ${target}`);
          else writeln(`cd: no such file or directory: ${target}`);
          break;
        }

        case "cat": {
          if (!argStr) return writeln("cat: missing file operand");
          const p = joinPath(cwd, argStr);
          if (isFile(p)) outLines(FS[p].content || "");
          else if (isDir(p)) writeln(`cat: ${argStr}: Is a directory`);
          else writeln(`cat: ${argStr}: No such file or directory`);
          break;
        }

        case "open": {
          if (!argStr)
            return writeln("Usage: open <file|projects|about|contact>");

          // UI targets
          if (argLower === "projects") {
            writeln("Opening Projects…");
            onOpenProjectsRef.current?.();
            return;
          }
          if (argLower === "about") {
            writeln("Opening About…");
            onOpenAboutRef.current?.();
            return;
          }
          if (argLower === "contact") {
            writeln("Opening Contact…");
            onOpenContactRef.current?.();
            return;
          }

          // file open
          const p = joinPath(cwd, argStr);
          if (!isFile(p)) {
            writeln(`open: ${argStr}: No such file`);
            return;
          }

          // Keep real PDF behavior
          if (p.endsWith("resume.pdf")) {
            writeln("Opening resume.pdf…");
            openLink(resumeUrl);
            return;
          }

          const ext = getExt(argStr);

          // As you requested: .txt does NOT open (use cat)
          if (ext === ".txt") {
            writeln(`open: ${argStr}: .txt is disabled — use: cat ${argStr}`);
            return;
          }

          const raw = FS[p]?.content;

          // “binary” placeholder or missing content
          if (raw == null || raw === "(binary)") {
            writeln(`open: ${argStr}: cannot preview binary file in this demo`);
            return;
          }

          // Only open files that have an extension (your request)
          if (!ext) {
            writeln(`open: ${argStr}: needs a file extension (example: memo.md)`);
            return;
          }

          writeln(`Opening ${argStr}…`);
          const res = openPreview(argStr, raw);

          if (res?.ok === false && res.url) {
            writeln("Popup blocked by browser. Copy/paste this URL:");
            writeln(res.url);
          }
          break;
        }

        case "projects":
          writeln("Opening Projects…");
          onOpenProjectsRef.current?.();
          break;

        default:
          writeln(`zsh: command not found: ${base}`);
          break;
      }
    };

    // ===== Tab completion =====
    const handleTab = () => {
      if (searchMode) return;

      const raw = buffer;
      const parts = raw.split(/\s+/);
      const base = (parts[0] || "").toLowerCase();

      const isCompletingCommand = parts.length <= 1 && !raw.endsWith(" ");
      const currentToken = raw.endsWith(" ")
        ? ""
        : parts[parts.length - 1] || "";

      let candidates = [];

      if (isCompletingCommand) {
        candidates = TERMINAL_COMMANDS.filter((c) =>
          c.startsWith(currentToken.toLowerCase())
        );
      } else {
        const entries = listDirEntries(cwd);

        const entryPool =
          base === "cd"
            ? ["..", ...entries]
            : base === "open"
              ? [...OPEN_TARGETS, ...entries]
              : entries;

        candidates = entryPool.filter((e) =>
          e.toLowerCase().startsWith(currentToken.toLowerCase())
        );
      }

      if (!candidates.length) return;

      if (candidates.length === 1) {
        const completed = candidates[0];
        const newParts = raw.endsWith(" ")
          ? [...parts, completed]
          : [...parts.slice(0, -1), completed];

        buffer = newParts.join(" ");
        renderLine(buffer);
        return;
      }

      const prefix = commonPrefix(candidates);
      if (prefix && prefix.length > currentToken.length) {
        const newParts = raw.endsWith(" ")
          ? [...parts, prefix]
          : [...parts.slice(0, -1), prefix];

        buffer = newParts.join(" ");
        renderLine(buffer);
        return;
      }

      term.write("\r\n");
      writeln(candidates.join("  "));
      writePrompt();
      term.write(buffer);
    };

    // ===== ctrl+r =====
    const startSearch = () => {
      searchMode = true;
      searchQuery = "";
      searchMatch = "";
      renderSearchLine();
    };

    const updateSearch = () => {
      searchMatch = findReverseMatch(searchQuery);
      renderSearchLine();
    };

    const exitSearch = (accept) => {
      if (accept && searchMatch) {
        term.write("\r\n");
        runCommand(searchMatch);
        buffer = "";
        searchMode = false;
        searchQuery = "";
        searchMatch = "";
        writePrompt();
        return;
      }
      searchMode = false;
      searchQuery = "";
      searchMatch = "";
      renderLine(buffer);
    };

    // ===== history arrows =====
    const historyUp = () => {
      if (!history.length) return;
      if (histPos === -1) histPos = history.length - 1;
      else histPos = Math.max(0, histPos - 1);
      buffer = history[histPos] || "";
      renderLine(buffer);
    };

    const historyDown = () => {
      if (!history.length) return;
      if (histPos === -1) return;

      if (histPos === history.length - 1) {
        histPos = -1;
        buffer = "";
      } else {
        histPos = Math.min(history.length - 1, histPos + 1);
        buffer = history[histPos] || "";
      }
      renderLine(buffer);
    };

    // ===== boot =====
    term.writeln("Welcome to Om’s Terminal (xterm.js)");
    term.writeln("Type `help` to see commands.");
    writePrompt();

    const sub = term.onData((data) => {
      // Ctrl+C
      if (data === "\u0003") {
        term.write("^C\r\n");
        buffer = "";
        histPos = -1;
        if (searchMode) {
          searchMode = false;
          searchQuery = "";
          searchMatch = "";
        }
        writePrompt();
        return;
      }

      // Ctrl+L
      if (data === "\f") {
        term.clear();
        buffer = "";
        histPos = -1;
        writePrompt();
        return;
      }

      // Ctrl+R
      if (data === "\u0012") {
        startSearch();
        return;
      }

      // Esc / Ctrl+G cancels search
      if (searchMode && (data === "\u001b" || data === "\u0007")) {
        exitSearch(false);
        return;
      }

      // Tab
      if (data === "\t") {
        handleTab();
        return;
      }

      // Arrow keys
      if (data === "\x1b[A") {
        if (!searchMode) historyUp();
        return;
      }
      if (data === "\x1b[B") {
        if (!searchMode) historyDown();
        return;
      }

      // Enter
      if (data === "\r") {
        if (searchMode) {
          exitSearch(true);
          return;
        }
        term.write("\r\n");
        runCommand(buffer);
        buffer = "";
        histPos = -1;
        writePrompt();
        return;
      }

      // Backspace
      if (data === "\u007f") {
        if (searchMode) {
          if (searchQuery.length > 0) {
            searchQuery = searchQuery.slice(0, -1);
            updateSearch();
          } else {
            renderSearchLine();
          }
          return;
        }

        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          renderLine(buffer);
        }
        return;
      }

      // Ignore other control chars
      const code = data.charCodeAt(0);
      if (code < 32) return;

      // Printable
      if (searchMode) {
        searchQuery += data;
        updateSearch();
        return;
      }

      buffer += data;
      term.write(data);
    });

    const onResize = () => safeFit();
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => safeFit());
    ro.observe(hostRef.current);

    return () => {
      disposedRef.current = true;
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      sub.dispose();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  // Optional: refit after restore (when isMinimized becomes false)
  useEffect(() => {
    if (isMinimized) return;
    const fit = fitRef.current;
    if (!fit) return;

    requestAnimationFrame(() => {
      if (disposedRef.current) return;
      try {
        fit.fit();
      } catch {}
    });
  }, [isMinimized]);

  return (
    <div className="h-full w-full rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl p-3">
      <div className="h-full w-full" ref={hostRef} />
    </div>
  );
}
