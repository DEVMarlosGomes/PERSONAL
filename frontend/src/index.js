import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress harmless ResizeObserver loop errors (Recharts/Portal layout)
if (typeof window !== "undefined") {
  if (window.ResizeObserver) {
    const RO = window.ResizeObserver;
    window.ResizeObserver = class extends RO {
      constructor(callback) {
        super((entries, observer) => {
          window.requestAnimationFrame(() => callback(entries, observer));
        });
      }
    };
  }

  const isResizeObserverError = (message) =>
    typeof message === "string" &&
    (message.includes("ResizeObserver loop completed with undelivered notifications") ||
      message.includes("ResizeObserver loop limit exceeded"));

  const ignoreResizeObserverError = (event) => {
    if (isResizeObserverError(event?.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  window.addEventListener("error", ignoreResizeObserverError, true);
  window.addEventListener("unhandledrejection", (event) => {
    if (isResizeObserverError(event?.reason?.message)) {
      event.preventDefault();
    }
  });

  window.onerror = (message) => {
    if (isResizeObserverError(message)) {
      return true;
    }
    return false;
  };

  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args?.[0]?.message || args?.[0];
    if (isResizeObserverError(message)) {
      return;
    }
    originalConsoleError(...args);
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
