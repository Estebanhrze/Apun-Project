document.documentElement.classList.add("js");

const sections = document.querySelectorAll(".section-reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  sections.forEach((section) => {
    observer.observe(section);
  });
} else {
  sections.forEach((section) => {
    section.classList.add("visible");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    document.body.classList.add("page-loaded");
  });

  const hero = document.querySelector(".hero");
  const magnetLines = document.querySelector(".magnet-lines");

  if (hero && magnetLines) {
    const maxShift = 14;
    let targetX = 0;
    let targetY = 0;
    const start = performance.now();
    let currentX = 0;
    let currentY = 0;

    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      targetX = x * maxShift;
      targetY = y * maxShift;
      magnetLines.style.setProperty("--mx", `${targetX}px`);
      magnetLines.style.setProperty("--my", `${targetY}px`);
    });

    hero.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      magnetLines.style.setProperty("--mx", "0px");
      magnetLines.style.setProperty("--my", "0px");
    });

    const animateAmbientLoop = (time) => {
      const t = (time - start) / 1000;
      const autoX = Math.sin(t * 0.9) * 8;
      const autoY = Math.cos(t * 0.7) * 6;

      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;

      magnetLines.style.setProperty("--mx", `${currentX}px`);
      magnetLines.style.setProperty("--my", `${currentY}px`);
      magnetLines.style.setProperty("--ax", `${autoX}px`);
      magnetLines.style.setProperty("--ay", `${autoY}px`);

      requestAnimationFrame(animateAmbientLoop);
    };

    requestAnimationFrame(animateAmbientLoop);
  }
});
