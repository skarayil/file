import React from "react";
/**
 * main.tsx
 * 
 * Entry point of the application.
 * Mounts the App component to the DOM.
 * Includes global styles (index.css).
 */
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
