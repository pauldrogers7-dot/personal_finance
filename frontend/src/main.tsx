import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import AppContainer from "@/components/AppContainer";

// Global error handler
window.addEventListener('error', (event) => {
  console.error('🔴 Global error caught:', event.error);
  console.error('🔴 Error message:', event.message);
  console.error('🔴 Error stack:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Unhandled promise rejection:', event.reason);
});

console.log('🚀 Application starting...');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppContainer />
  </StrictMode>,
);
