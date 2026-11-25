document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  // 1. Cabecera con sombra al hacer scroll
  function updateNavbar() {
    if (!navbar) return;
    navbar.classList.toggle("scrolled", window.scrollY > 30);
  }
  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });

  // 2. Menú móvil
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuToggle.classList.toggle("open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
      });
    });
  }

  // 3. Aparición suave al hacer scroll (con respaldo para elementos ya visibles)
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -10px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));

    const showVisibleElements = () => {
      revealEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.05 && rect.bottom > 0) {
          el.classList.add("visible");
        }
      });
    };

    window.addEventListener("scroll", showVisibleElements, { passive: true });
    setTimeout(showVisibleElements, 200);
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  // 4. Selector interactivo de momentos del día (08h · Horno / 12h · Pausa / 17h · Merienda) + Otra mezcla
  const RHYTHM_DATA = {
    manana: {
      moodClass: "mood-manana",
      angle: 0,
      title: "Bandejas calientes nada más abrir",
      desc: "El aroma a mantequilla tostada y canela marca el inicio del día. Sacamos croissants y rolls recién hechos mientras calibramos el espresso.",
      tags: ["Recién salido del horno", "Café de especialidad"],
      img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85",
      alt: "Bollería y pan recién horneado",
      combos: [
        {
          name: "Roll de canela + Latte",
          desc: "Dulzor especiado con leche texturizada sedosa.",
          price: "5,30 €"
        },
        {
          name: "Croissant de mantequilla + Cappuccino",
          desc: "Hojaldre crujiente y espuma fina para empezar con calma.",
          price: "4,40 €"
        },
        {
          name: "Tostada de tomate y aceite + Café con leche",
          desc: "Clásico de desayuno mediterráneo hecho al momento.",
          price: "5,50 €"
        }
      ]
    },
    pausa: {
      moodClass: "mood-pausa",
      angle: 120,
      title: "Mesas tranquilas para leer o trabajar un rato",
      desc: "Luz natural, enchufes cerca de la pared y un ambiente sin prisas para avanzar con tu proyecto o desconectar con un cappuccino.",
      tags: ["Sin prisas", "Café de especialidad"],
      img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=85",
      alt: "Rincón tranquilo de cafetería con luz natural",
      combos: [
        {
          name: "Tostada de aguacate + Americano",
          desc: "Pan crujiente con aguacate aliñado y café largo.",
          price: "7,20 €"
        },
        {
          name: "Yogur con fruta y granola + Cappuccino",
          desc: "Textura cremosa, granola crujiente y fruta fresca.",
          price: "7,20 €"
        },
        {
          name: "Brunch Luna + Latte",
          desc: "La opción más completa para alargar la mañana.",
          price: "12,40 €"
        }
      ]
    },
    tarde: {
      moodClass: "mood-tarde",
      angle: 240,
      title: "Tarta casera, chocolate y sobremesa larga",
      desc: "Por la tarde apetece algo dulce: porciones de tarta de queso, brownie o cookie templada acompañadas de café o infusión.",
      tags: ["Repostería hecha en casa", "Perfecto para compartir"],
      img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85",
      alt: "Tarta casera para la merienda",
      combos: [
        {
          name: "Tarta de queso + Mocha",
          desc: "Porción cremosa con el toque de cacao del mocha.",
          price: "7,30 €"
        },
        {
          name: "Brownie + Latte",
          desc: "Chocolate intenso por dentro con leche caliente suave.",
          price: "6,00 €"
        },
        {
          name: "Cookie de chocolate + Espresso",
          desc: "Galleta tierna con pepitas y un espresso corto.",
          price: "3,70 €"
        }
      ]
    }
  };

  const rhythmStage = document.getElementById("rhythmStage");
  const dialNeedle = document.getElementById("dialNeedle");
  const dialButtons = document.querySelectorAll(".dial-btn, .rhythm-tab");
  const rhythmTitle = document.getElementById("rhythmTitle");
  const rhythmDesc = document.getElementById("rhythmDesc");
  const slotTags = document.getElementById("slotTags") || document.getElementById("rhythmMeta");
  const rhythmImg = document.getElementById("rhythmImg");

  const comboGenerator = document.querySelector(".combo-generator");
  const comboDisplay = document.getElementById("comboDisplay");
  const spinComboBtn = document.getElementById("spinComboBtn");

  let currentMood = "manana";
  let lastComboIndex = 0;

  // Detecta la clave ("manana", "pausa", "tarde") aunque falte el atributo en el HTML
  function resolveMoodKey(btn, index) {
    const explicit = btn.dataset.mood || btn.getAttribute("data-moment");
    if (explicit && RHYTHM_DATA[explicit]) return explicit;

    const text = (btn.textContent || "").toLowerCase();
    if (text.includes("08h") || text.includes("horno") || text.includes("mañana")) return "manana";
    if (text.includes("12h") || text.includes("pausa")) return "pausa";
    if (text.includes("17h") || text.includes("merienda") || text.includes("tarde")) return "tarde";

    const fallbackOrder = ["manana", "pausa", "tarde"];
    return fallbackOrder[index] || "manana";
  }

  function renderCombo(combo, animate = true) {
    if (!comboDisplay || !combo) return;

    const paint = () => {
      comboDisplay.innerHTML = `
        <strong>${combo.name}</strong>
        <p>${combo.desc}</p>
        <span class="combo-price">${combo.price}</span>
      `;
      comboDisplay.classList.remove("is-fading");
    };

    if (!animate) {
      paint();
      return;
    }

    comboDisplay.classList.add("is-fading");
    setTimeout(paint, 150);
  }

  function applyMoment(key, pickFirstCombo = true) {
    const item = RHYTHM_DATA[key];
    if (!item) return;

    currentMood = key;

    dialButtons.forEach((btn, idx) => {
      const btnKey = resolveMoodKey(btn, idx);
      const active = btnKey === key;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    if (dialNeedle && typeof item.angle === "number") {
      dialNeedle.style.transform = `rotate(${item.angle}deg)`;
    }

    if (rhythmStage && item.moodClass) {
      rhythmStage.classList.remove("mood-manana", "mood-pausa", "mood-tarde");
      rhythmStage.classList.add(item.moodClass);
    }

    if (rhythmTitle) rhythmTitle.textContent = item.title;
    if (rhythmDesc) rhythmDesc.textContent = item.desc;

    if (slotTags && Array.isArray(item.tags)) {
      slotTags.innerHTML = item.tags.map((t) => `<span>✦ ${t}</span>`).join("");
    }

    if (rhythmImg && item.img) {
      rhythmImg.src = item.img;
      rhythmImg.alt = item.alt || item.title;
    }

    if (pickFirstCombo && item.combos && item.combos[0]) {
      lastComboIndex = 0;
      renderCombo(item.combos[0], true);
    }
  }

  dialButtons.forEach((btn, idx) => {
    const key = resolveMoodKey(btn, idx);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      applyMoment(key, true);
    });
  });

  if (spinComboBtn) {
    spinComboBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const combos = RHYTHM_DATA[currentMood]?.combos || [];
      if (combos.length <= 1) return;

      let nextIndex = Math.floor(Math.random() * combos.length);
      if (nextIndex === lastComboIndex) {
        nextIndex = (lastComboIndex + 1) % combos.length;
      }
      lastComboIndex = nextIndex;

      spinComboBtn.classList.add("spinning");
      if (comboGenerator) comboGenerator.classList.add("is-spinning");

      renderCombo(combos[nextIndex], true);

      setTimeout(() => {
        spinComboBtn.classList.remove("spinning");
        if (comboGenerator) comboGenerator.classList.remove("is-spinning");
      }, 360);
    });
  }

  if (comboDisplay && RHYTHM_DATA[currentMood]?.combos?.[0]) {
    renderCombo(RHYTHM_DATA[currentMood].combos[0], false);
  }

  // 5. Validación del formulario de contacto
  if (form && status) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("name");
      const email = document.getElementById("email");
      const message = document.getElementById("message");

      if (!name || !email || !message) return;

      if (!name.value.trim() || !email.validity.valid || !message.value.trim()) {
        status.textContent = "Revisa los campos: necesitamos tu nombre, un email válido y un mensaje.";
        status.style.color = "#985643";
        return;
      }

      status.textContent = "¡Mensaje preparado! En una web conectada, aquí se enviaría al equipo de Luna & Miga.";
      status.style.color = "#6b7d5e";
      form.reset();
    });
  }
});