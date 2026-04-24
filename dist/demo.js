// src/vendor/tsx-create-element.ts
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function decamelize(str, separator = "-") {
  return str.replace(/([a-z\d])([A-Z])/g, "$1" + separator + "$2").replace(/([A-Z]+)([A-Z][a-z\d]+)/g, "$1" + separator + "$2").toLowerCase();
}
function createElement(tag, attrs, ...children) {
  if (typeof tag === "function") {
    const fn = tag;
    let props = attrs;
    if (props === null || props === undefined) {
      props = { children };
    } else {
      props.children = children;
    }
    return fn(props);
  } else {
    const ns = tag === "svg" ? SVG_NAMESPACE : null;
    const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
    const map = attrs;
    let ref;
    for (let name in map) {
      if (name && map.hasOwnProperty(name)) {
        let value = map[name];
        if (name === "className" && value !== undefined) {
          setAttribute(el, ns, "class", value.toString());
        } else if (name === "disabled" && !value) {} else if (value === null || value === undefined) {} else if (value === true) {
          setAttribute(el, ns, name, name);
        } else if (typeof value === "function") {
          if (name === "ref") {
            ref = value;
          } else {
            el[name.toLowerCase()] = value;
          }
        } else if (typeof value === "object") {
          setAttribute(el, ns, name, flatten(value));
        } else {
          setAttribute(el, ns, name, value.toString());
        }
      }
    }
    if (children && children.length > 0) {
      appendChildren(el, children);
    }
    if (ref) {
      ref(el);
    }
    return el;
  }
}
function setAttribute(el, ns, name, value) {
  if (ns) {
    el.setAttributeNS(null, name, value);
  } else {
    el.setAttribute(name, value);
  }
}
function flatten(o) {
  const arr = [];
  for (let prop in o)
    arr.push(`${decamelize(prop, "-")}:${o[prop]}`);
  return arr.join(";");
}
function isInsideForeignObject(element) {
  let current = element;
  while (current) {
    if (current.tagName.toLowerCase() === "foreignobject") {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}
function recreateWithSvgNamespace(element) {
  const svgElement = document.createElementNS(SVG_NAMESPACE, element.tagName.toLowerCase());
  for (let i = 0;i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    svgElement.setAttributeNS(null, attr.name, attr.value);
  }
  const eventProperties = [
    "onclick",
    "onmousedown",
    "onmouseup",
    "onmouseover",
    "onmouseout",
    "onmousemove",
    "onkeydown",
    "onkeyup",
    "onkeypress",
    "onfocus",
    "onblur"
  ];
  for (const prop of eventProperties) {
    if (element[prop]) {
      svgElement[prop] = element[prop];
    }
  }
  for (let i = 0;i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      svgElement.appendChild(recreateWithSvgNamespace(child));
    } else {
      svgElement.appendChild(child.cloneNode(true));
    }
  }
  return svgElement;
}
function addChild(parentElement, child) {
  if (child === null || child === undefined || typeof child === "boolean") {
    return;
  } else if (Array.isArray(child)) {
    appendChildren(parentElement, child);
  } else if (isElement(child)) {
    const childEl = child;
    if (parentElement.namespaceURI === SVG_NAMESPACE && childEl.namespaceURI !== SVG_NAMESPACE && childEl.tagName.toLowerCase() !== "foreignobject" && !isInsideForeignObject(parentElement)) {
      const recreated = recreateWithSvgNamespace(childEl);
      parentElement.appendChild(recreated);
    } else {
      parentElement.appendChild(childEl);
    }
  } else {
    parentElement.appendChild(document.createTextNode(child.toString()));
  }
}
function appendChildren(parentElement, children) {
  children.forEach((child) => addChild(parentElement, child));
}
function isElement(el) {
  return !!el.nodeType;
}
function mount(element, container) {
  container.innerHTML = "";
  if (element) {
    addChild(container, element);
  }
}

// src/components/like.tsx
var LikeComponent = (props) => {
  return /* @__PURE__ */ createElement("div", null, "LIKE LikeComponent ", props.big, " :: ", props.more, ":: ", props.big ? "YES" : "NO");
};

// src/components/app.tsx
var App = /* @__PURE__ */ createElement("main", {
  className: "hello"
}, /* @__PURE__ */ createElement("h1", null, "Hello JSX!"), /* @__PURE__ */ createElement(LikeComponent, {
  big: true,
  more: "DE"
}));

// src/components/demo.ts
document.addEventListener("DOMContentLoaded", () => {
  const app = document.querySelector("#app");
  mount(App, app);
});
console.log(App);
