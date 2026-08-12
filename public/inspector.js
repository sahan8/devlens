/* global chrome */

(() => {
  const fontStyle = document.createElement("style");

  fontStyle.id = "devlens-fonts";

  fontStyle.textContent = `
    @font-face {
      font-family: "DevLens Inter";
      src: url("${chrome.runtime.getURL(
        "fonts/Inter-Regular.woff2"
      )}") format("woff2");

      font-weight: 400;
    }

    @font-face {
      font-family: "DevLens Inter";
      src: url("${chrome.runtime.getURL(
        "fonts/Inter-SemiBold.woff2"
      )}") format("woff2");

      font-weight: 600;
    }

    @font-face {
      font-family: "DevLens Space";
      src: url("${chrome.runtime.getURL(
        "fonts/SpaceGrotesk-Bold.woff2"
      )}") format("woff2");

      font-weight: 700;
    }

    @font-face {
      font-family: "DevLens Mono";
      src: url("${chrome.runtime.getURL(
        "fonts/JetBrainsMono-Regular.woff2"
      )}") format("woff2");
    }
  `;

  document.head.appendChild(fontStyle);

  if (window.devlensActive) {
    return;
  }

  window.devlensActive = true;

  let selectedElement = null;


  function detectFramework(element) {
  if (
    typeof element.className !== "string" ||
    !element.className.trim()
  ) {
    return {
      name: "None detected",
      classes: [],
    };
  }

  const classes = element.className
    .trim()
    .split(/\s+/);

  const bootstrapPatterns = [
    /^btn$/,
    /^btn-/,
    /^col-/,
    /^col$/,
    /^container$/,
    /^container-/,
    /^row$/,
    /^navbar/,
    /^card$/,
    /^card-/,
    /^form-control$/,
    /^form-select$/,
    /^alert-/,
    /^badge$/,
    /^d-/,
    /^justify-content-/,
    /^align-items-/,
    /^text-/,
  ];

  const tailwindPatterns = [
    /^flex$/,
    /^grid$/,
    /^block$/,
    /^hidden$/,
    /^items-/,
    /^justify-/,
    /^bg-/,
    /^text-/,
    /^font-/,
    /^p-\d/,
    /^px-/,
    /^py-/,
    /^pt-/,
    /^pb-/,
    /^m-\d/,
    /^mx-/,
    /^my-/,
    /^mt-/,
    /^mb-/,
    /^w-/,
    /^h-/,
    /^rounded/,
    /^shadow/,
    /^gap-/,
    /^space-/,
    /^border-/,
    /^hover:/,
    /^md:/,
    /^lg:/,
    /^sm:/,
  ];

  const bootstrapClasses =
    classes.filter((className) =>
      bootstrapPatterns.some((pattern) =>
        pattern.test(className)
      )
    );

  const tailwindClasses =
    classes.filter((className) =>
      tailwindPatterns.some((pattern) =>
        pattern.test(className)
      )
    );

  if (
    bootstrapClasses.length >
    tailwindClasses.length
  ) {
    return {
      name: "Likely Bootstrap",
      classes: bootstrapClasses,
    };
  }

  if (tailwindClasses.length > 0) {
    return {
      name: "Likely Tailwind CSS",
      classes: tailwindClasses,
    };
  }

  return {
    name: "None detected",
    classes: [],
  };
}

  function rgbToHex(rgb) {
    if (!rgb) return "#000000";

    if (
      rgb === "rgba(0, 0, 0, 0)" ||
      rgb === "transparent"
    ) {
      return "Transparent";
    }

    const values = rgb.match(/\d+/g);

    if (!values || values.length < 3) {
      return rgb;
    }

    const [r, g, b] = values;

    return (
      "#" +
      [r, g, b]
        .map((value) =>
          Number(value)
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
        .toUpperCase()
    );
  }

  function getElementName(element) {
    let name = element.tagName.toLowerCase();

    if (element.id) {
      name += `#${element.id}`;
    }

    if (
      typeof element.className === "string" &&
      element.className.trim()
    ) {
      const classes = element.className
        .trim()
        .split(/\s+/)
        .slice(0, 4);

      name += "." + classes.join(".");
    }

    return name;
  }

  function getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    let selector = element.tagName.toLowerCase();

    if (
      typeof element.className === "string" &&
      element.className.trim()
    ) {
      const classes = element.className
        .trim()
        .split(/\s+/)
        .slice(0, 3);

      selector += "." + classes.join(".");
    }

    return selector;
  }

  function getDomPath(element) {
    const path = [];

    let current = element;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE
    ) {
      let part =
        current.tagName.toLowerCase();

      if (current.id) {
        part += `#${current.id}`;
        path.unshift(part);
        break;
      }

      if (
        typeof current.className === "string" &&
        current.className.trim()
      ) {
        const firstClass =
          current.className
            .trim()
            .split(/\s+/)[0];

        part += `.${firstClass}`;
      }

      path.unshift(part);

      current = current.parentElement;

      if (path.length >= 6) {
        break;
      }
    }

    return path.join(" > ");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function restoreElement(element) {
    if (!element) return;

    element.style.outline =
      element.dataset.devlensOldOutline || "";

    element.style.cursor =
      element.dataset.devlensOldCursor || "";
  }

  function highlightElement(event) {
    const target = event.target;

    if (target.closest("#devlens-panel")) {
      return;
    }

    if (
      selectedElement &&
      selectedElement !== target
    ) {
      restoreElement(selectedElement);
    }

    selectedElement = target;

    if (
      !selectedElement.dataset
        .devlensOldOutlineSaved
    ) {
      selectedElement.dataset.devlensOldOutline =
        selectedElement.style.outline || "";

      selectedElement.dataset.devlensOldCursor =
        selectedElement.style.cursor || "";

      selectedElement.dataset
        .devlensOldOutlineSaved = "true";
    }

    selectedElement.style.outline =
      "3px solid #a78bfa";

    selectedElement.style.cursor =
      "crosshair";
  }

  function removeHighlight(event) {
    if (event.target.closest("#devlens-panel")) {
      return;
    }

    restoreElement(event.target);
  }

  function stopInspector() {
    restoreElement(selectedElement);

    document.removeEventListener(
      "mouseover",
      highlightElement,
      true
    );

    document.removeEventListener(
      "mouseout",
      removeHighlight,
      true
    );

    document.removeEventListener(
      "click",
      inspectElement,
      true
    );

    document.removeEventListener(
      "keydown",
      handleEscape
    );

    window.devlensActive = false;

    selectedElement = null;
  }

  function startInspector() {
    document.addEventListener(
      "mouseover",
      highlightElement,
      true
    );

    document.addEventListener(
      "mouseout",
      removeHighlight,
      true
    );

    document.addEventListener(
      "click",
      inspectElement,
      true
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    window.devlensActive = true;
  }

  function handleEscape(event) {
    if (event.key !== "Escape") {
      return;
    }

    const panel =
      document.getElementById(
        "devlens-panel"
      );

    if (panel) {
      panel.remove();
    }

    stopInspector();
  }

  function createPanel(element, style) {
    const existingPanel =
      document.getElementById(
        "devlens-panel"
      );

    if (existingPanel) {
      existingPanel.remove();
    }

    const rect =
      element.getBoundingClientRect();

    const textHex =
      rgbToHex(style.color);

    const backgroundHex =
      rgbToHex(
        style.backgroundColor
      );

    const elementName =
      getElementName(element);

    const selector =
      getSelector(element);

    const domPath =
      getDomPath(element);

   const framework =
  detectFramework(element);  

    const className =
      typeof element.className ===
        "string" &&
      element.className.trim()
        ? element.className
        : "No class";

    const panel =
      document.createElement("div");

    panel.id = "devlens-panel";

    panel.style.cssText = `
      position: fixed;
      top: 22px;
      right: 22px;

      width: 370px;
      max-height: 92vh;
      overflow-y: auto;

      padding: 22px;

      color: rgba(255,255,255,0.78);

      background:
        linear-gradient(
          145deg,
          rgba(20, 24, 40, 0.72),
          rgba(25, 30, 50, 0.48)
        );

      backdrop-filter:
        blur(32px)
        saturate(190%);

      -webkit-backdrop-filter:
        blur(32px)
        saturate(190%);

      border:
        1px solid rgba(255,255,255,0.20);

      border-radius: 24px;

      box-shadow:
        0 30px 80px rgba(0,0,0,0.55),
        0 0 45px rgba(124,58,237,0.15),
        inset 0 1px 0 rgba(255,255,255,0.22),
        inset 0 -1px 0 rgba(255,255,255,0.05);

      font-family:
        "DevLens Inter",
        "Segoe UI",
        sans-serif;

      font-size: 14px;
      line-height: 1.55;

      z-index: 2147483647;
    `;

    panel.innerHTML = `
      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:20px;
        "
      >

        <strong
          style="
            font-family:
              'DevLens Space',
              sans-serif;

            font-size:21px;
            font-weight:700;

            color:#c4b5fd;

            letter-spacing:-0.5px;
          "
        >
          🔍 DevLens
        </strong>

        <button
          id="devlens-close"
          style="
            background:none;
            border:none;
            color:white;
            font-size:24px;
            cursor:pointer;
          "
        >
          ×
        </button>

      </div>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        ELEMENT
      </p>

      <p style="
        margin-top:0;
        word-break:break-word;
      ">
        ${escapeHtml(elementName)}
      </p>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        CLASS
      </p>

      <p style="
        margin-top:0;
        word-break:break-word;
      ">
        ${escapeHtml(className)}
      </p>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        CSS SELECTOR
      </p>

      <div style="
        display:flex;
        gap:8px;
        margin-bottom:16px;
      ">

        <code
          style="
            flex:1;
            font-family:
              'DevLens Mono',
              monospace;
            background:rgba(255,255,255,0.07);
            border:1px solid rgba(255,255,255,0.10);
            backdrop-filter:blur(12px);
            padding:9px;
            border-radius:10px;
            color:#e2e8f0;
            word-break:break-all;
          "
        >
          ${escapeHtml(selector)}
        </code>

        <button
          id="devlens-copy-selector"
          style="
            border:none;
            border-radius:6px;
            padding:7px 9px;
            cursor:pointer;
          "
        >
          Copy
        </button>

      </div>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        DOM PATH
      </p>

      <code
        style="
          display:block;
          font-family:
            'DevLens Mono',
            monospace;
          background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.10);
          backdrop-filter:blur(12px);
          padding:9px;
          border-radius:10px;
          color:#e2e8f0;
          word-break:break-all;
          margin-bottom:16px;
        "
      >
        ${escapeHtml(domPath)}
      </code>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        SIZE
      </p>

      <p style="margin-top:0;">
        ${Math.round(rect.width)}px
        ×
        ${Math.round(rect.height)}px
      </p>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        TYPOGRAPHY
      </p>

      <p style="margin-top:0;">
        Font:
        ${escapeHtml(
          style.fontFamily
        )}
        <br>

        Size:
        ${style.fontSize}
        <br>

        Weight:
        ${style.fontWeight}
        <br>

        Line height:
        ${style.lineHeight}
      </p>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:8px;
      ">
        COLORS
      </p>


      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        margin-bottom:10px;
      ">

        <span style="
          width:20px;
          height:20px;
          border-radius:5px;
          background:${style.color};
          border:1px solid #4b5563;
        ">
        </span>

        <span style="flex:1;">
          ${textHex}
        </span>

        <button
          id="devlens-copy-text-color"
          style="
            border:none;
            border-radius:5px;
            padding:5px 8px;
            cursor:pointer;
          "
        >
          Copy
        </button>

      </div>


      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        margin-bottom:18px;
      ">

        <span style="
          width:20px;
          height:20px;
          border-radius:5px;
          background:${style.backgroundColor};
          border:1px solid #4b5563;
        ">
        </span>

        <span style="flex:1;">
          ${backgroundHex}
        </span>

        <button
          id="devlens-copy-background"
          style="
            border:none;
            border-radius:5px;
            padding:5px 8px;
            cursor:pointer;
          "
        >
          Copy
        </button>

      </div>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        SPACING
      </p>

      <p style="margin-top:0;">
        Margin:
        ${style.margin}
        <br>

        Padding:
        ${style.padding}
      </p>


      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        LAYOUT
      </p>

      <p style="margin-top:0;">
        Display:
        ${style.display}
        <br>

        Position:
        ${style.position}
        <br>

        Overflow:
        ${style.overflow}
      </p>
       
      <p style="
  color:#a78bfa;
  font-size:11px;
  font-weight:bold;
  margin-bottom:4px;
">
  FRAMEWORK
</p>

<div style="
  background:rgba(255,255,255,0.07);
  border:1px solid rgba(255,255,255,0.10);
  backdrop-filter:blur(12px);
  border-radius:10px;
  padding:10px;
  border-radius:7px;
  margin-bottom:16px;
">

  <strong>
    ${framework.name}
  </strong>

  ${
    framework.classes.length > 0
      ? `
        <div style="
          margin-top:8px;
          font-size:12px;
          color:#d1d5db;
          word-break:break-word;
        ">
          ${framework.classes
            .map(
              (className) =>
                `<code style="
                  display:inline-block;
                  background:#374151;
                  padding:3px 6px;
                  margin:2px;
                  border-radius:4px;
                ">
                  ${escapeHtml(className)}
                </code>`
            )
            .join("")}
        </div>
      `
      : `
        <div style="
          margin-top:5px;
          color:#9ca3af;
          font-size:12px;
        ">
          No common framework classes found.
        </div>
      `
  }

</div>

      <p style="
        color:#a78bfa;
        font-size:11px;
        font-weight:bold;
        margin-bottom:4px;
      ">
        BORDER
      </p>

      <p style="margin-top:0;">
        ${style.border}
        <br>

        Radius:
        ${style.borderRadius}
      </p>


      <button
        id="devlens-copy-css"
        style="
          width:100%;
          padding:12px;
          margin-top:10px;

          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #2563eb
            );

          color:white;

          border:
            1px solid rgba(255,255,255,0.12);

          border-radius:10px;

          font-weight:bold;
          cursor:pointer;

          box-shadow:
            0 8px 20px rgba(124,58,237,0.25);
        "
      >
        Copy CSS
      </button>
     
      <button
  id="devlens-explain-css"
  style="
    width:100%;
    padding:13px;
    margin-top:10px;

    background:
      linear-gradient(
        135deg,
        rgba(124,58,237,0.75),
        rgba(59,130,246,0.65)
      );

    backdrop-filter:blur(14px);

    border:
      1px solid rgba(255,255,255,0.20);

    border-radius:12px;

    color:white;

    font-weight:700;
    cursor:pointer;

    box-shadow:
      0 10px 28px rgba(124,58,237,0.25),
      inset 0 1px 0 rgba(255,255,255,0.22);
  "
>
  ✨ Explain CSS
</button>

<div
  id="devlens-explanation"
  style="
    display:none;
    margin-top:12px;
    padding:12px;
    background:rgba(255,255,255,0.07);
    border:1px solid rgba(255,255,255,0.10);
    backdrop-filter:blur(12px);
    border-radius:10px;
    font-size:13px;
    line-height:1.6;
    white-space:pre-line;
  "
></div>



      <button
        id="devlens-inspect-another"
        style="
          width:100%;
          padding:12px;
          margin-top:10px;

          background:
            rgba(255,255,255,0.07);

          backdrop-filter:blur(12px);

          color:white;

          border:
            1px solid rgba(255,255,255,0.14);

          border-radius:12px;

          font-weight:600;
          cursor:pointer;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12);
        "
      >
        🔍 Inspect Another
      </button>


      <p style="
        text-align:center;
        color:#6b7280;
        font-size:11px;
        margin-bottom:0;
        margin-top:14px;
      ">
        Press ESC to exit DevLens
      </p>
    `;

    document.body.appendChild(panel);

    const closeButton =
      panel.querySelector(
        "#devlens-close"
      );

    const copyCssButton =
      panel.querySelector(
        "#devlens-copy-css"
      );

    const inspectAnotherButton =
      panel.querySelector(
        "#devlens-inspect-another"
      );

    const selectorButton =
      panel.querySelector(
        "#devlens-copy-selector"
      );

    const textColorButton =
      panel.querySelector(
        "#devlens-copy-text-color"
      );

    const backgroundButton =
      panel.querySelector(
        "#devlens-copy-background"
      );

    const explainButton =
  panel.querySelector(
    "#devlens-explain-css"
  );

const explanationBox =
  panel.querySelector(
    "#devlens-explanation"
  );

    closeButton.addEventListener(
      "click",
      () => {
        panel.remove();
        stopInspector();
      }
    );

    selectorButton.addEventListener(
      "click",
      () => {
        copyText(
          selector,
          selectorButton
        );
      }
    );

    textColorButton.addEventListener(
      "click",
      () => {
        copyText(
          textHex,
          textColorButton
        );
      }
    );

    backgroundButton.addEventListener(
      "click",
      () => {
        copyText(
          backgroundHex,
          backgroundButton
        );
      }
    );

    copyCssButton.addEventListener(
      "click",
      () => {
        const css = `
color: ${textHex};
background-color: ${backgroundHex};
font-family: ${style.fontFamily};
font-size: ${style.fontSize};
font-weight: ${style.fontWeight};
line-height: ${style.lineHeight};
margin: ${style.margin};
padding: ${style.padding};
display: ${style.display};
position: ${style.position};
border: ${style.border};
border-radius: ${style.borderRadius};
        `.trim();

        copyText(
          css,
          copyCssButton,
          "✓ CSS Copied!"
        );
      }
    );

    explainButton.addEventListener(
  "click",
  () => {
    if (!window.DevLensExplainer) {
      explanationBox.style.display =
        "block";

      explanationBox.textContent =
        "CSS explainer is not loaded.";

      return;
    }

    const explanation =
      window.DevLensExplainer.explain(
        style
      );

    explanationBox.style.display =
      "block";

    explanationBox.textContent =
      explanation;

    explainButton.textContent =
      "✨ Explanation Generated";
  }
);

    inspectAnotherButton.addEventListener(
      "click",
      () => {
        panel.remove();

        selectedElement = null;

        startInspector();
      }
    );
  }

  async function copyText(
    text,
    button,
    successText = "✓ Copied!"
  ) {
    const oldText =
      button.textContent;

    try {
      await navigator.clipboard.writeText(
        text
      );

      button.textContent =
        successText;

      setTimeout(() => {
        button.textContent =
          oldText;
      }, 1200);
    } catch (error) {
      console.error(
        "DevLens copy error:",
        error
      );

      button.textContent =
        "Failed";

      setTimeout(() => {
        button.textContent =
          oldText;
      }, 1200);
    }
  }

  function inspectElement(event) {
    if (
      event.target.closest(
        "#devlens-panel"
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const element =
      event.target;

    const style =
      window.getComputedStyle(
        element
      );

    restoreElement(element);

    document.removeEventListener(
      "mouseover",
      highlightElement,
      true
    );

    document.removeEventListener(
      "mouseout",
      removeHighlight,
      true
    );

    document.removeEventListener(
      "click",
      inspectElement,
      true
    );

    createPanel(
      element,
      style
    );
  }

  startInspector();

  console.log(
    "🔍 DevLens v0.2 started"
  );
})();
