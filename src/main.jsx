import React from "react";
import { createRoot } from "react-dom/client";
import BrewFluent from "./BrewFluent.tsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrewFluent />
  </React.StrictMode>,
);
