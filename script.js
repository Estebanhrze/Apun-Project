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

  initActiveNav();
  initContactMap();
});

function initActiveNav() {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!navLinks.length || !("IntersectionObserver" in window)) {
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

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        activateLink(visible[0].target.id);
      }
    },
    {
      rootMargin: "-35% 0px -50% 0px",
      threshold: [0.2, 0.5, 0.8],
    }
  );

  sectionMap.forEach(({ section }) => observer.observe(section));
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

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }).addTo(map);

  const nominatimUrl =
    "https://nominatim.openstreetmap.org/search?city=Guayaquil&country=Ecuador&format=geojson&polygon_geojson=1&limit=1";

  fetch(nominatimUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("No fue posible obtener el limite de Guayaquil");
      }
      return response.json();
    })
    .then((geojson) => {
      if (!geojson.features || !geojson.features.length) {
        throw new Error("No se encontro el limite geografico");
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
