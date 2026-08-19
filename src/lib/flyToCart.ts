const CART_ICON_ID = "nav-cart-icon";

/**
 * Animates a small clone of the add-to-cart origin element flying to the
 * header cart icon, then pulses the icon on arrival. Best-effort only —
 * silently no-ops if the cart icon isn't mounted or the user prefers
 * reduced motion.
 */
export function flyToCart(origin: HTMLElement | null) {
  if (!origin || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.getElementById(CART_ICON_ID);
  if (!target) return;

  const originRect = origin.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (originRect.width === 0 || originRect.height === 0) return;

  const imgEl = origin.querySelector("img");
  const size = Math.min(originRect.width, originRect.height, 64);

  const clone = document.createElement("div");
  clone.style.position = "fixed";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = `${size}px`;
  clone.style.height = `${size}px`;
  clone.style.borderRadius = "9999px";
  clone.style.overflow = "hidden";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.boxShadow = "0 8px 24px rgba(0,0,0,0.45)";
  clone.style.border = "1px solid rgba(255,255,255,0.2)";

  if (imgEl?.src) {
    const img = document.createElement("img");
    img.src = imgEl.src;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    clone.appendChild(img);
  } else {
    clone.style.backgroundColor = "#ffffff";
  }

  document.body.appendChild(clone);

  const startX = originRect.left + originRect.width / 2 - size / 2;
  const startY = originRect.top + originRect.height / 2 - size / 2;
  const endX = targetRect.left + targetRect.width / 2 - size / 2;
  const endY = targetRect.top + targetRect.height / 2 - size / 2;
  // Slight upward arc through the midpoint so the flight reads as a toss
  // rather than a straight linear slide.
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 60;

  const animation = clone.animate(
    [
      { transform: `translate(${startX}px, ${startY}px) scale(1)`, opacity: 1, offset: 0 },
      { transform: `translate(${midX}px, ${midY}px) scale(0.7)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${endX}px, ${endY}px) scale(0.15)`, opacity: 0.4, offset: 1 },
    ],
    { duration: 650, easing: "cubic-bezier(.32,.1,.3,1)" }
  );

  animation.onfinish = () => {
    clone.remove();
    target.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.35)" },
        { transform: "scale(1)" },
      ],
      { duration: 320, easing: "ease-out" }
    );
  };
}

export { CART_ICON_ID };
