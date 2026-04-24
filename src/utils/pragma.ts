// Tag can be string or a function if we parse the functional component
import {JSX} from 'bun-types/jsx';

type Tag = string | HTMLElement | ((props: any, children: any[]) => JSX.Element);

// Attributes of the element – object or null
type Props = Record<string, string> | null;

// Element children – return value from the h()
type Children = (Node | string)[];

export const h = (tag: Tag, props: Props, ...children: Children) => {
    console.log(`TAG: ${tag}`);
    // If tag is a component, call it
    if (typeof tag === "function")
    {
        return tag({...props}, children);
    }
    console.log(`TAG: ${tag}`);
    // Create HTML-element with given attributes
    const el = (tag instanceof HTMLElement) ? tag : document.createElement(tag);
    if (props)
    {
        Object.entries(props).forEach(([key, val]) => {
            if (key === "className")
            {
                el.classList.add(...((val as string) || "").trim().split(" "));
                return;
            }
            el.setAttribute(key, val);
        });
    }

    // Append child elements into the parent
    children.forEach((child) => {
        el.append(child);
    });

    return el;
};
