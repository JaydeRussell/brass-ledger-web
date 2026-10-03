// Page probe for the grand hunt. Paste into the page (or run through the
// browser automation's JS tool) and it returns a JSON summary of defect
// classes that "looks fine" can't see:
//   - overflowX: page wider than the viewport, and the elements causing it
//     (ignoring ones clipped by an overflow:hidden/auto ancestor)
//   - smallTargets: visible buttons/links/inputs under 24x24 CSS px (WCAG
//     2.5.8), excluding inline links inside running text
//   - lowContrast: visible text whose contrast against its effective
//     background is under 4.5:1 (3:1 for large text)
//   - imgNoAlt: <img> without an alt attribute
//   - unlabeled: buttons/inputs with no accessible name
(() => {
  const vw = document.documentElement.clientWidth;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
  };
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "hidden" || o === "auto" || o === "scroll" || o === "clip") return true;
    }
    return false;
  };
  const label = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 30)}"`;

  const all = [...document.querySelectorAll("body *")];

  const overflow = all
    .filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1 && getComputedStyle(el).position !== "fixed" && !clipped(el))
    .slice(0, 10)
    .map((el) => `${label(el)} right=${Math.round(el.getBoundingClientRect().right)}`);

  const interactive = [...document.querySelectorAll("button, a[href], input, select, textarea, [role=button], [role=switch], [role=radio], [role=tab]")].filter(visible);
  const inText = (el) => el.tagName === "A" && getComputedStyle(el).display === "inline" && el.parentElement && /\S/.test((el.parentElement.innerText || "").replace(el.innerText, ""));
  const smallTargets = interactive
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return (r.width < 24 || r.height < 24) && !inText(el);
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return `${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`;
    });

  // sRGB relative luminance; colours come back from getComputedStyle as
  // rgb()/rgba() or, for oklch tokens in newer engines, as lab()/oklch().
  // A 1x1 canvas normalises any CSS colour to rgba bytes.
  const ctx = document.createElement("canvas").getContext("2d");
  const toRgba = (c) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const c = toRgba(getComputedStyle(p).backgroundColor);
      if (c[3] > 0.9) return c;
    }
    return toRgba(getComputedStyle(document.body).backgroundColor);
  };
  const textEls = all.filter((el) => visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const seen = new Map();
  for (const el of textEls) {
    const s = getComputedStyle(el);
    const fg = toRgba(s.color);
    if (fg[3] < 0.5) continue;
    const bg = bgOf(el);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const size = parseFloat(s.fontSize);
    const large = size >= 24 || (size >= 18.66 && parseInt(s.fontWeight, 10) >= 700);
    const min = large ? 3 : 4.5;
    if (ratio < min) {
      const key = `${s.color}|${Math.round(ratio * 10) / 10}`;
      if (!seen.has(key)) seen.set(key, `${ratio.toFixed(2)}:1 ${size}px ${label(el)}`);
    }
  }

  return {
    viewport: vw,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: overflow,
    smallTargets: { count: smallTargets.length, sample: smallTargets.slice(0, 12) },
    lowContrast: { distinct: seen.size, sample: [...seen.values()].slice(0, 12) },
    imgNoAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).map((i) => i.src.slice(-40)),
    unlabeled: interactive
      .filter((el) => !(el.textContent || "").trim() && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && !el.title && !(el.labels && el.labels.length))
      .map(label)
      .slice(0, 10),
  };
})();
