import { Navbar } from "#components";
import DesktopShell from "#components/DesktopShell";
import IntroGlass from "#components/IntroGlass";
import React from "react";

const App = () => {
  return (
    <main className="relative min-h-dvh">
      <IntroGlass
        title="Hi, I’m Om Gandhi"
        subtitle="PhD in Computer Science • Blockchain • Distributed Systems • Security"
        durationMs={7000}
      />

      <Navbar />
      <DesktopShell />

      {/* ✅ Brightness overlay (web-safe “device brightness” simulation)
          Put it BELOW ControlCenter (z 80/90), ABOVE page (z < 70). */}
      <div
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{
          background: "black",
          opacity: `calc(1 - var(--ui-brightness, 1))`,
        }}
      />
    </main>
  );
};

export default App;
