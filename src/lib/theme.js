import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

function getStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore — persistence is a nice-to-have, not required for the theme to apply
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    if (getStoredTheme()) return; // an explicit choice already overrides system preference
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setTheme(e.matches ? "dark" : "light");
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return { theme, toggleTheme };
}
