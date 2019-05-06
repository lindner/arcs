const mainTemplate = `
  <style>
    #arcs {
      display: none;
    }
    #error {
      display: none;
      margin-top: 20px;
    }
  </style>
  <div id="arcs"></div>
  <error-panel id="error"></error-panel>`;

const arcTemplate = `
  <style>
    #arc-id {
      font-family: Arial;
      font-size: 13px;
      font-style: italic;
      margin-top: 20px;
    }
    #arc-root {
      margin: 4px 0 6px 0;
      border: 1px solid;
    }
    #toggle {
      color: #777;
      font-size: 15px;
      vertical-align: top;
    }
    #toggle:hover {
      cursor: pointer;
    }
    #serialization {
      display: none;
      font-size: 11px;
      width: fit-content;
      margin: 0;
      padding: 4px 8px;
      border: 1px dashed;
    }
  </style>
  <div id="arc-id"></div>
  <div id="arc-root"></div>
  <span id="toggle"></span>
  <pre id="serialization"></pre>`;

const errorTemplate = `
  <style>
    .container {
      color: red;
    }
    #header {
      font-family: Arial;
      font-style: italic;
      margin: 8px;
    }
    #message {
      overflow: auto;
      font-size: 12px;
      margin: 0 0 8px 8px;
    }
  </style>
  <div class="container">
    <div id="header"></div>
    <pre id="message"></pre>
  </div>`;

export class OutputPane extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = mainTemplate;

    this.arcs = shadowRoot.getElementById('arcs');
    this.error = shadowRoot.getElementById('error');
  }

  reset() {
    this.arcs.style.display = 'block';
    this.error.style.display = 'none';
    while (this.arcs.firstChild) {
      this.arcs.firstChild.dispose();
      this.arcs.removeChild(this.arcs.firstChild);
    }
    this.error.clear();
  }

  addArcPanel(arcId) {
    const arcPanel = document.createElement('arc-panel');
    this.arcs.appendChild(arcPanel);
    arcPanel.setId(arcId);
    return arcPanel;
  }

  showError(header, message = '') {
    this.arcs.style.display = 'none';
    this.error.style.display = 'block';
    this.error.show(header, message);
  }
}

class ArcPanel extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = arcTemplate;

    this.arcId = shadowRoot.getElementById('arc-id');
    this.arcRoot = shadowRoot.getElementById('arc-root');
    this.toggle = shadowRoot.getElementById('toggle');
    this.serialization = shadowRoot.getElementById('serialization');

    this.linkedArc = null;
    this.toggle.addEventListener('click', this.toggleSerialization.bind(this));
  }

  setId(arcId) {
    this.arcId.textContent = arcId.idTree[0];
  }

  attachArc(arc) {
    this.linkedArc = arc;
  }

  setSerialization(text) {
    this.serialization.textContent = text.trim().replace(/ +\n/g, '\n').replace(/\n{2,}/g, '\n\n');
    this.toggleSerialization();
  }

  toggleSerialization() {
    if (this.serialization.style.display === 'none') {
      this.serialization.style.display = 'inline-block';
      this.toggle.innerHTML = '&#x2BC6;';  // ⯆
    } else {
      this.serialization.style.display = 'none';
      this.toggle.innerHTML = '&#x2BC8;';  // ⯈
    }
  }

  showError(header, message = '') {
    const error = document.createElement('error-panel');
    this.arcRoot.appendChild(error);
    error.show(header, message);
  }

  dispose() {
    if (this.linkedArc) {
      this.linkedArc.dispose();
    }
  }
}

class ErrorPanel extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = errorTemplate;

    this.header = shadowRoot.getElementById('header');
    this.message = shadowRoot.getElementById('message');
  }

  clear() {
    this.header.textContent = '';
    this.message.textContent = '';
  }

  show(header, message) {
    this.header.textContent = header;
    this.message.textContent = message;
  }
}

window.customElements.define('output-pane', OutputPane);
window.customElements.define('arc-panel', ArcPanel);
window.customElements.define('error-panel', ErrorPanel);