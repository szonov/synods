const sheet = new CSSStyleSheet();
sheet.replaceSync(`
svg {
  width: 12px;
  height: 12px;
  &.check {
    color: #0d8050;
  }
  &.clock, &.pause {
    color: #888;
  }
  &.triangle {
    color: #C43B38;
  }
}
`);

const VISIBILITY = {
  waiting: 'clock',
  downloading: 'down',
  paused: 'pause',
  finishing: 'down',
  finished: 'check',
  hash_checking: 'down',
  seeding: 'up',
  filehosting_waiting: 'clock',
  extracting: 'down',
  error: 'triangle',
}

const DEFAULT_ICON = 'clock'

const ICONS = {
  down: `<svg class="down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg>`,
  up: `<svg class="up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg>`,
  check: `<svg class="check"  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg>`,
  clock: `<svg class="clock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -.993 .883l-.007 .117v5l.009 .131a1 1 0 0 0 .197 .477l.087 .1l3 3l.094 .082a1 1 0 0 0 1.226 0l.094 -.083l.083 -.094a1 1 0 0 0 0 -1.226l-.083 -.094l-2.707 -2.708v-4.585l-.007 -.117a1 1 0 0 0 -.993 -.883z"/></svg>`,
  triangle: `<svg class="triangle" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  pause: `<svg class="pause" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /><path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /></svg>`,
}

class StatusIcon extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    const status = this.dataset.status;

    if (status) {
      const iconName = VISIBILITY[status] ?? DEFAULT_ICON
      this.shadowRoot.innerHTML = ICONS[iconName]
    }
  }

  static observedAttributes = ['data-status'];

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (attrName === 'data-status') {
      if (newValue) {
        const iconName = VISIBILITY[newValue] ?? DEFAULT_ICON
        this.shadowRoot.innerHTML = ICONS[iconName]
      } else {
        this.shadowRoot.innerHTML = ''
      }
    }
  }
}

customElements.get('status-icon') || customElements.define('status-icon', StatusIcon);
