// Отключаем автоматическую загрузку типов React для JSX
// @ts-nocheck - временно отключаем проверку для этого файла

// Объявляем свои типы в глобальном пространстве, переопределяя React
declare global {
    namespace JSX {
        // Переопределяем Element для нашей реализации
        type Element = Node | DocumentFragment | string | number | boolean | null | undefined;


        interface IntrinsicElements {
            [elemName: string]: any;
        }

        // Для Fragment
        interface ElementChildrenAttribute {
            children: {};
        }
    }
}

// Экспортируем Fragment как компонент
export const Fragment = (props: { children?: any[] }): DocumentFragment => {
    const fragment = document.createDocumentFragment();
    const children = props?.children || [];

    for (const child of children.flat()) {
        if (child === null || child === undefined) continue;

        if (child instanceof Node) {
            fragment.appendChild(child);
        } else if (typeof child === 'string' || typeof child === 'number') {
            fragment.appendChild(document.createTextNode(String(child)));
        }
    }

    return fragment;
};

type Component<P = {}> = (props: P) => Node | DocumentFragment | string | number | null;

// Основная createElement функция
export function createElement(
    tag: string | Component | typeof Fragment,
    attributes: Record<string, any> | null,
    ...children: any[]
): Node | DocumentFragment | null {

    // Fragment
    if (tag === Fragment) {
        return Fragment({ children: children.flat() });
    }

    // Компонент-функция
    if (typeof tag === 'function') {
        const result = tag({ ...attributes, children: children.flat() });
        return result instanceof Node || result instanceof DocumentFragment ? result : null;
    }

    // Определяем тип элемента (SVG или HTML)
    const isSvg = (() => {
        const svgTags = [
            'svg', 'circle', 'rect', 'path', 'g', 'line', 'polygon',
            'polyline', 'ellipse', 'defs', 'linearGradient', 'stop',
            'text', 'tspan', 'use', 'clipPath', 'mask', 'pattern'
        ];
        return svgTags.includes(tag.toLowerCase());
    })();

    // Создаём элемент
    let element: Element;
    if (isSvg) {
        element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    } else {
        element = document.createElement(tag);
    }

    // Устанавливаем атрибуты
    if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'children' || key === 'ref') continue;

            if (key === 'className') {
                element.setAttribute('class', value);
            }
            else if (key === 'style' && typeof value === 'object') {
                Object.assign((element as HTMLElement).style, value);
            }
            else if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value);
            }
            else if (key === 'dangerouslySetInnerHTML') {
                element.innerHTML = value.__html;
            }
            else if (typeof value === 'boolean') {
                if (value) element.setAttribute(key, '');
                else element.removeAttribute(key);
            }
            else if (value !== null && value !== undefined) {
                if (isSvg) {
                    element.setAttribute(key, String(value));
                } else {
                    (element as any)[key] = value;
                }
            }
        }
    }

    // Добавляем дочерние элементы
    const flatChildren = children.flat();
    for (const child of flatChildren) {
        if (child === null || child === undefined) continue;

        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        }
        else if (child instanceof Node) {
            element.appendChild(child);
        }
        else if (child instanceof DocumentFragment) {
            element.appendChild(child);
        }
        else if (Array.isArray(child)) {
            // Рекурсивно обрабатываем вложенные массивы
            const processArray = (arr: any[]) => {
                for (const item of arr) {
                    if (item instanceof Node) element.appendChild(item);
                    else if (typeof item === 'string') element.appendChild(document.createTextNode(item));
                    else if (Array.isArray(item)) processArray(item);
                }
            };
            processArray(child);
        }
    }

    return element;
}

// Хелпер для рендеринга
export function render(element: JSX.Element | null, container: HTMLElement | ShadowRoot) {
    if (!element) return;
    container.innerHTML = '';
    container.appendChild(element);
}
