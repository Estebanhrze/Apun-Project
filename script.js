document.documentElement.classList.add("js");

const sections = document.querySelectorAll(".section-reveal");
const mapState = {
  map: null,
  tileLayer: null,
};

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

  initThemeToggle();
  initActiveNav();
  initContactMap();
});

function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) {
    return;
  }

  const savedTheme = localStorage.getItem("apun-theme");
  const prefersLight =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const initialTheme = savedTheme || (prefersLight ? "light" : "dark");

  applyTheme(initialTheme);

  toggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.contains("theme-light");
    const nextTheme = isLight ? "dark" : "light";
    applyTheme(nextTheme);
    localStorage.setItem("apun-theme", nextTheme);
  });
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("theme-light", isLight);
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-label", isLight ? "Activar modo oscuro" : "Activar modo claro");
    toggleBtn.setAttribute("title", isLight ? "Activar modo oscuro" : "Activar modo claro");
  }

  setMapTheme(theme);
}

function initActiveNav() {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!navLinks.length) {
    return;
  }

  const sectionMap = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      if (!id) {
        return null;
      }

      const section = document.querySelector(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const activateLink = (targetId) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${targetId}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const sectionsById = new Map(sectionMap.map(({ section }) => [section.id, section]));
  const sectionOffsets = () =>
    sectionMap.map(({ section }) => ({
      id: section.id,
      top: section.getBoundingClientRect().top + window.scrollY,
    }));

  let ticking = false;

  const updateByScroll = () => {
    const headerOffset = 130;
    const currentY = window.scrollY + headerOffset;
    const points = sectionOffsets();

    let activeId = points[0]?.id;
    points.forEach((point) => {
      if (currentY >= point.top) {
        activeId = point.id;
      }
    });

    const isAtBottom =
      Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
    if (isAtBottom) {
      activeId = points[points.length - 1]?.id;
    }

    if (activeId) {
      activateLink(activeId);
    }
  };

  const onScrollOrResize = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(() => {
      updateByScroll();
      ticking = false;
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.getAttribute("href");
      if (!target) {
        return;
      }

      activateLink(target.slice(1));
    });
  });

  if (window.location.hash) {
    const hashId = window.location.hash.slice(1);
    if (sectionsById.has(hashId)) {
      activateLink(hashId);
    }
  } else {
    const firstTarget = navLinks[0].getAttribute("href");
    if (firstTarget) {
      activateLink(firstTarget.slice(1));
    }
  }

  window.addEventListener("hashchange", () => {
    const hashId = window.location.hash.slice(1);
    if (sectionsById.has(hashId)) {
      activateLink(hashId);
    }
  });

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  updateByScroll();
}

function initContactMap() {
  const mapContainer = document.getElementById("contact-map");
  if (!mapContainer || typeof L === "undefined") {
    return;
  }

  const map = L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView([-2.170998, -79.922359], 11);

  mapState.map = map;

  const currentTheme = document.body.classList.contains("theme-light") ? "light" : "dark";
  setMapTheme(currentTheme);

  const nominatimUrl =
    "https://nominatim.openstreetmap.org/search?city=Guayaquil&country=Ecuador&format=geojson&polygon_geojson=1&limit=1";

  fetch(nominatimUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("No fue posible obtener el límite de Guayaquil");
      }
      return response.json();
    })
    .then((geojson) => {
      if (!geojson.features || !geojson.features.length) {
        throw new Error("No se encontró el límite geográfico");
      }

      const boundaryLayer = L.geoJSON(geojson, {
        style: {
          color: "#ff3b30",
          weight: 2,
          opacity: 0.95,
          dashArray: "8 5",
          fillOpacity: 0,
        },
        interactive: false,
      }).addTo(map);

      map.fitBounds(boundaryLayer.getBounds(), {
        padding: [10, 10],
      });

      const center = boundaryLayer.getBounds().getCenter();
      L.marker(center)
        .addTo(map)
        .bindTooltip("Guayaquil", {
          permanent: true,
          direction: "top",
          offset: [0, -8],
          className: "city-label",
        });
    })
    .catch(() => {
      const fallback = document.createElement("p");
      fallback.textContent = "No se pudo cargar el borde administrativo de Guayaquil.";
      fallback.style.margin = "0";
      fallback.style.padding = "0.75rem";
      fallback.style.color = "#cbd5e1";
      fallback.style.fontSize = "0.9rem";
      mapContainer.appendChild(fallback);
    });
}

function setMapTheme(theme) {
  if (!mapState.map || typeof L === "undefined") {
    return;
  }

  if (mapState.tileLayer) {
    mapState.map.removeLayer(mapState.tileLayer);
  }

  const tileUrl =
    theme === "light"
      ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  mapState.tileLayer = L.tileLayer(tileUrl, {
    subdomains: "abcd",
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }).addTo(mapState.map);
}
