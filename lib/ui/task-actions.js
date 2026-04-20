const sheet = new CSSStyleSheet();
sheet.replaceSync(`
a {
  display: inline;
  text-decoration: none;
  color: #ccc;
  margin-left: 8px;
  margin-right: 2px;

  &:hover {
    color: #1a73e8;
    &.delete {
      color: #d93025;
    }
  }
  svg {
    width: 16px;
    height: 16px;
  }
}
`);

const VISIBILITY = {
  pause: ["downloading", "hash_checking", "waiting", "seeding"],
  resume: ["paused", "finished", "error"],
  delete: ['*']
}

const ICONS = {
  pause: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="14" y="3" width="5" height="18" rx="1"/>
              <rect x="5" y="3" width="5" height="18" rx="1"/>
           </svg>`,
  resume: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>
           </svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m15 9-6 6"/>
              <path d="m9 9 6 6"/>
           </svg>`,
}

class TaskActions extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.innerHTML = `
      <a href="#" class="resume">${ICONS['resume']}</a>
      <a href="#" class="pause">${ICONS['pause']}</a>
      <a href="#" class="delete">${ICONS['delete']}</a>
    `
  }

  connectedCallback() {
    console.log('[action-button] connectedCallback', this.getAttribute('type'));
    // this.addEventListener('click', this.action);
    this.shadowRoot.querySelectorAll('a').forEach($a => {
      $a.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        console.log($a.className );
        this.dispatchEvent(new CustomEvent('action', { detail: $a.className }));
      });
    })
  }

  static observedAttributes = ['data-status'];

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (attrName === 'data-status') {
      this.shadowRoot.querySelectorAll('a').forEach($a => {
        const type = $a.className;
        const isVisible = (VISIBILITY[type].includes(newValue) || VISIBILITY[type].includes('*'));
        $a.style.display = isVisible ? "inline" : "none";
      })
    }
  }
}

customElements.get('task-actions') || customElements.define('task-actions', TaskActions);
