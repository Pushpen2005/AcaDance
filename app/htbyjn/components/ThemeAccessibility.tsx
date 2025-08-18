"use client";
import { useState } from "react";

export default function ThemeAccessibility() {
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  return (
    <div className={`p-8 max-w-lg mx-auto ${dark ? "dark bg-gray-900 text-white" : "bg-white text-black"}`}>
      <h2 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-200">Theme & Accessibility</h2>
      <div className="flex gap-4 mb-4">
        <button
          className="px-4 py-2 rounded-lg font-semibold shadow border border-gray-300 dark:border-gray-700"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          className="px-4 py-2 rounded-lg font-semibold shadow border border-gray-300 dark:border-gray-700"
          onClick={() => setFontSize((f) => Math.min(f + 2, 24))}
          aria-label="Increase font size"
        >
          A+
        </button>
        <button
          className="px-4 py-2 rounded-lg font-semibold shadow border border-gray-300 dark:border-gray-700"
          onClick={() => setFontSize((f) => Math.max(f - 2, 12))}
          aria-label="Decrease font size"
        >
          A-
        </button>
      </div>
      <div style={{ fontSize }}>
        <p>Screen reader support and keyboard navigation enabled.</p>
        <ul>
          <li>Use <kbd>Tab</kbd> to navigate.</li>
          <li>High contrast colors for visibility.</li>
          <li>Large fonts for readability.</li>
        </ul>
      </div>
    </div>
  );
}
