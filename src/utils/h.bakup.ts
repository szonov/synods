//// DOM utility functions:
//
// const el = (sel, par = document) => par.querySelector(sel);
// const els = (sel, par = document) => par.querySelectorAll(sel);
// const elNew = (tag, prop) => Object.assign(document.createElement(tag), prop);
// const attr = (el, attr) => Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, v));
// const css = (el, styles) => Object.assign(el.style, styles);

const classIdSplit = /([\.#]?[a-zA-Z0-9_:-]+)/;
const notClassId = /^\.|#/;

export function createElement(tagName: any = "div", properties: any = null, ...children: any): Node {
    /**
   Wrapper for React.createElement() to simplify usage and remove boilerplate
   Usage:
   h('div', [h('h2', 'Hello')]);
   h('div', h('h2', 'Hello'));
   h('div#foo.bar.baz', [h('h2', 'Hello')]);
   h('div.bar.baz', [h('h2', 'Hello')]);
   h('div', {className: 'greeting'}, [h('h2', 'Hello')]);
   **/
    if (!Array.isArray(children)) {
        children = [children];
    }
    let props: Record<string, any> = {};

    if (arguments.length > 0) {
        if (objType(properties) === "[object Object]") {
            props = properties;
        } else if (Array.isArray(properties)) {
            children = [].concat(...properties, children);
        } else {
            children.unshift(properties);
        }
    }

    let el;
    if (typeof tagName === "function") {
        el = tagName(props);
    } else {
        const tag: string = arguments.length > 0 ? parseTag(tagName, props) : "div";
        el = assignProps(document.createElement(tag), props);
    }

    children.forEach((child: any) => {
        if (child == null) {
            return;
        }
        const typeOfChild = typeof child;
        if (typeOfChild === "string") {
            el.appendChild(document.createTextNode(child));
        } else if (typeOfChild === "number") {
            el.appendChild(document.createTextNode(String(child)));
        } else if (typeOfChild === "object" && child.nodeType === 1) {
            el.appendChild(child);
        }
    });

    console.log("EL:" , el);
    return el;
}

function parseTag(tag: string, props: Record<string, any>): string {
    if (!tag) {
        return "div";
    }

    const noId = !props.hasOwnProperty("id");

    const tagParts = tag.split(classIdSplit);
    let tagName: string | null = null;

    if (notClassId.test(tagParts[1])) {
        tagName = "div";
    }

    let classes: Array<string> = [];
    let part, type;

    tagParts.forEach((tagPart) => {
        part = tagPart;

        if (!part) {
            return;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === ".") {
            classes.push(part.substring(1, part.length));
        } else if (type === "#" && noId) {
            props.id = part.substring(1, part.length);
        }
    });

    if (classes.length > 0) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(" ");
    }

    return tagName ? tagName.toLowerCase() : "div";
}

function objType(obj: any): string {
    return Object.prototype.toString.call(obj);
}

function assignProps(el: Node, props: Record<string, any>): Node {
    console.log(`assignProps [${el.nodeName}]: ${JSON.stringify(props)}]`);
    return Object.assign(el, props);
}
