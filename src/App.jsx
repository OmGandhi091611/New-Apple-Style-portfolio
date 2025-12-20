import { Navbar } from "#components";
import DesktopShell from "#components/DesktopShell";
import IntroGlass from "#components/IntroGlass";
import React from "react";

const App = () => {
  return (
    <main style={{ filter: "brightness(var(--ui-brightness, 1))" }}>
      <IntroGlass
        title="Hi, I’m Om Gandhi"
        subtitle="PhD in Computer Science • Blockchain • Distributed Systems • Security"
        durationMs={7000}
      />
      <Navbar />
      <DesktopShell />
    </main>
  );
};

export default App;
