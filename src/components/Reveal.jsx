import { useEffect, useRef, useState } from "react";

// Wraps a page section; fades/slides it in the first time it scrolls into view.
export default function Reveal({ id, className = "", children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={["section", "reveal", visible ? "reveal-visible" : "", className].join(" ").trim()}
    >
      {children}
    </section>
  );
}
