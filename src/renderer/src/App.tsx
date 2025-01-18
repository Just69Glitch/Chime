import React, { useState } from "react";
import Home from "@/pages/Home";
import Toolbar from "@/components/Toolbar";

export default function App() {
  const [title, setTitle] = useState<string>("");

  return (
    <React.StrictMode>
      <Toolbar title={title} />
      <Home onTitleChange={setTitle} />
    </React.StrictMode>
  );
}

