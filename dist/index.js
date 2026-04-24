// src/lib/dom.ts
var Fragment = (props) => {
  const fragment = document.createDocumentFragment();
  const children = props?.children || [];
  for (const child of children.flat()) {
    if (child === null || child === undefined)
      continue;
    if (child instanceof Node) {
      fragment.appendChild(child);
    } else if (typeof child === "string" || typeof child === "number") {
      fragment.appendChild(document.createTextNode(String(child)));
    }
  }
  return fragment;
};
function createElement(tag, attributes, ...children) {
  if (tag === Fragment) {
    return Fragment({ children: children.flat() });
  }
  if (typeof tag === "function") {
    const result = tag({ ...attributes, children: children.flat() });
    return result instanceof Node || result instanceof DocumentFragment ? result : null;
  }
  const isSvg = (() => {
    const svgTags = [
      "svg",
      "circle",
      "rect",
      "path",
      "g",
      "line",
      "polygon",
      "polyline",
      "ellipse",
      "defs",
      "linearGradient",
      "stop",
      "text",
      "tspan",
      "use",
      "clipPath",
      "mask",
      "pattern"
    ];
    return svgTags.includes(tag.toLowerCase());
  })();
  let element;
  if (isSvg) {
    element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  } else {
    element = document.createElement(tag);
  }
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (key === "children" || key === "ref")
        continue;
      if (key === "className") {
        element.setAttribute("class", value);
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === "dangerouslySetInnerHTML") {
        element.innerHTML = value.__html;
      } else if (typeof value === "boolean") {
        if (value)
          element.setAttribute(key, "");
        else
          element.removeAttribute(key);
      } else if (value !== null && value !== undefined) {
        if (isSvg) {
          element.setAttribute(key, String(value));
        } else {
          element[key] = value;
        }
      }
    }
  }
  const flatChildren = children.flat();
  for (const child of flatChildren) {
    if (child === null || child === undefined)
      continue;
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (child instanceof DocumentFragment) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      const processArray = (arr) => {
        for (const item of arr) {
          if (item instanceof Node)
            element.appendChild(item);
          else if (typeof item === "string")
            element.appendChild(document.createTextNode(item));
          else if (Array.isArray(item))
            processArray(item);
        }
      };
      processArray(child);
    }
  }
  return element;
}
function render(element, container) {
  if (!element)
    return;
  container.innerHTML = "";
  container.appendChild(element);
}

// src/components/icons/index.tsx
var IconPaused = (props) => /* @__PURE__ */ createElement("svg", {
  className: "i-paused",
  style: { width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px` },
  viewBox: "0 0 24 24",
  fill: "currentColor"
}, /* @__PURE__ */ createElement("path", {
  stroke: "none",
  d: "M0 0h24v24H0z",
  fill: "none"
}), /* @__PURE__ */ createElement("path", {
  d: "M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z"
}), /* @__PURE__ */ createElement("path", {
  d: "M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z"
}));
var IconResume = (props) => /* @__PURE__ */ createElement("svg", {
  className: "i-resume",
  style: { width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px` },
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, /* @__PURE__ */ createElement("path", {
  d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
}));
var IconPause = (props) => /* @__PURE__ */ createElement("svg", {
  className: "i-pause",
  style: { width: `${props.size ?? 24}px`, height: `${props.size ?? 24}px` },
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, /* @__PURE__ */ createElement("rect", {
  x: "14",
  y: "3",
  width: "5",
  height: "18",
  rx: "1"
}), /* @__PURE__ */ createElement("rect", {
  x: "5",
  y: "3",
  width: "5",
  height: "18",
  rx: "1"
}));

// src/components/clear-link/style.css
var style_default = `a {
    cursor: pointer;
    text-decoration: underline;
    color: #C43B38;
    display: inline-block;
    &.disabled {
        color: #888;
        text-decoration: none;
        cursor: default;
    }
    svg {
        width: 18px;
        height: 18px;
    }
}
`;

// src/components/clear-link/index.tsx
var sheet = new CSSStyleSheet;
sheet.replaceSync(style_default);
customElements.get("clear-link") || customElements.define("clear-link", class extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [sheet];
    const body = /* @__PURE__ */ createElement(Fragment, null, /* @__PURE__ */ createElement("a", {
      href: "",
      onClick: this.submit.bind(this)
    }, chrome.i18n.getMessage("clearSettings"), /* @__PURE__ */ createElement(IconResume, {
      size: 17
    }), /* @__PURE__ */ createElement(IconPause, {
      size: 27
    }), /* @__PURE__ */ createElement(IconPaused, {
      size: 27
    }), /* @__PURE__ */ createElement("svg-icon", {
      name: "triangle",
      size: 30
    })), /* @__PURE__ */ createElement("div", null, "sss"));
    render(body, shadow);
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(value) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
  static observedAttributes = ["disabled"];
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "disabled" && oldValue !== newValue) {
      const $a = this.shadowRoot.firstChild;
      if (this.disabled) {
        $a.className = "disabled";
      } else {
        $a.removeAttribute("class");
      }
    }
  }
  submit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (this.disabled || !confirm(chrome.i18n.getMessage("clearSettingsConfirm"))) {
      return;
    }
    this.dispatchEvent(new CustomEvent("submit"));
  }
});
