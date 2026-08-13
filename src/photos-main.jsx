import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import PhotosPage from "./PhotosPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PhotosPage />
  </StrictMode>
);
