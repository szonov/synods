import { createElement, Fragment, render } from '../../lib/dom';
import {IconResume, IconPause, IconPaused} from '../icons';

import styles from "./style.css" with { type: "text" };
const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

customElements.get("clear-link") ||
    customElements.define(
        "clear-link",
        class extends HTMLElement {
            constructor() {
                super();
                const shadow = this.attachShadow({ mode: "open" });
                shadow.adoptedStyleSheets = [sheet];
                const body = (
                    <>
                        <a href={""} onClick={this.submit.bind(this)}>
                            {chrome.i18n.getMessage("clearSettings")}
                            <IconResume size={17}/>
                            <IconPause size={27}/>
                            <IconPaused size={27}/>
                            <svg-icon name={"triangle"} size={30}></svg-icon>
                        </a>
                        <div>sss</div>
                    </>
                )
                render(body, shadow)
            }

            get disabled(): boolean {
                return this.hasAttribute("disabled");
            }

            set disabled(value: boolean) {
                if (value) {
                    this.setAttribute("disabled", "");
                } else {
                    this.removeAttribute("disabled");
                }
            }

            static observedAttributes = ["disabled"];

            attributeChangedCallback(name: string, oldValue: any, newValue: any) {
                if (name === "disabled" && oldValue !== newValue) {
                    const $a = this.shadowRoot!.firstChild! as HTMLAnchorElement;
                    if (this.disabled) {
                        $a.className = "disabled";
                    } else {
                        $a.removeAttribute("class");
                    }
                }
            }

            submit(e: any): void {
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
                if (this.disabled || !confirm(chrome.i18n.getMessage("clearSettingsConfirm"))) {
                    return;
                }
                this.dispatchEvent(new CustomEvent("submit"));
            }
        },
    );
