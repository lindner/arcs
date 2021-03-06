/*
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// elements
import './shell-ui/suggestion-element.js';
import './shell-ui/settings-panel.js';
import './shell-ui/user-picker.js';
import './shell-ui/voice-driver.js';

// components
import '../../components/simple-tabs.js';
import '../../components/arc-tools/store-explorer.js';
import '../../components/xen-tools/xen-explorer.js';

// libs
import Xen from '../../components/xen/xen.js';

// strings
import {StyleSheet} from './shell-ui.css.js';

// templates
const html = Xen.html;
const template = html`
  ${StyleSheet}
  <!-- -->
  <div scrim open$="{{scrimOpen}}" on-click="_onScrimClick"></div>
  <!-- -->
  <slot name="modal"></slot>
  <slot></slot>
  <!-- adds space at the bottom of the static flow so no actual content is ever covered by the app-bar -->
  <div barSpacer></div>
  <!-- -->
  <voice-driver on-search="_onVoiceSearch"></voice-driver>
  <!-- -->
  <div bar glowing$="{{glows}}" glowable state$="{{barState}}" open$="{{barOpen}}" over$="{{barOver}}" on-mouseenter="_onBarEnter" on-mouseleave="_onBarLeave">
    <div touchbar on-click="_onTouchbarClick"></div>
    <div toolbars on-click="_onBarClick">
      <div main toolbar open$="{{mainToolbarOpen}}">
        <a href="{{launcherHref}}" title="Go to Launcher"><icon>apps</icon></a>
        <input search placeholder="Search" value="{{search}}" on-focus="_onSearchFocus" on-input="_onSearchChange" on-blur="_onSearchBlur" on-dblclick="_onResetSearch">
        <icon hidden="{{hideMic}}" on-click="_onListen">mic</icon>
        <icon hidden="{{hideClear}}" on-click="_onClearSearch">highlight_off</icon>
        <icon on-click="_onSettingsClick">settings</icon>
      </div>
      <div search toolbar open$="{{searchToolbarOpen}}">
        <icon on-click="_onMainClick">arrow_back</icon>
      </div>
      <div settings toolbar open$="{{settingsToolbarOpen}}">
        <icon on-click="_onMainClick">arrow_back</icon>
        <span style="flex: 1;">Settings</span>
        <avatar title="{{avatar_title}}" xen:style="{{avatar_style}}" on-click="_onAvatarClick"></avatar>
      </div>
    </div>
    <div contents scrolltop="{{scrollTop:contentsScrollTop}}">
      <div suggestions content open$="{{suggestionsContentOpen}}">
        <slot name="suggestions" slot="suggestions" on-plan-choose="_onChooseSuggestion"></slot>
      </div>
      <settings-panel settings content open$="{{settingsContentOpen}}" key="{{key}}" arc="{{arc}}" users="{{users}}" user="{{user}}" friends="{{friends}}" avatars="{{avatars}}" share="{{share}}" user_picker_open="{{userPickerOpen}}" on-user="_onSelectUser" on-share="_onShare"></settings-panel>
    </div>
  </div>
  <!-- -->
  <icon style="position: fixed; right: 0px; bottom: 0px; z-index: 10000;" on-click="_onToolsClick">assessment</icon>
  <div tools open$="{{toolsOpen}}">
    <simple-tabs>
      <div tab="Store Explorer">
        <store-explorer arc="{{arc}}" context="{{context}}"></store-explorer>
      </div>
      <div tab="Xen Explorer">
        <xen-explorer></xen-explorer>
      </div>
    </simple-tabs>
  </div>
`;

const log = Xen.logFactory('ShellUi', '#ac6066');

class ShellUi extends Xen.Debug(Xen.Base, log) {
  static get observedAttributes() {
    return ['users', 'user', 'context', 'friends', 'key', 'arc', 'title', 'share', 'search', 'glows', 'showhint', 'avatars'];
  }
  get template() {
    return template;
  }
  _getInitialState() {
    return {
      showHintFor: 3500,
      intent: 'start',
      barState: 'over',
      toolState: 'main',
      // TODO(sjmiles): include manifest or other directives?
      launcherHref: `${location.origin}${location.pathname}`,
      toolsOpen: false
    };
  }
  _render(props, state, oldProps, oldState) {
    if (props.arc && props.arc !== oldProps.arc) {
      state.intent = 'start';
    }
    const {intent, toolState, barState, toolsOpen} = state;
    // `start` intent means no minimization
    if (intent === 'start') {
      if (state.barState !== 'open') {
        state.barState = props.showhint ? 'hint' : 'over';
      }
      if (state.barState === 'hint') {
        // only leave hint open for a short time, then hide it automagically
        this._hintDebounce = Xen.debounce(this._hintDebounce, () => {
          if (state.barState === 'hint') {
            this._setState({barState: 'peek', intent: 'auto'});
          }
        }, state.showHintFor);
      }
    }
    // `auto` intent means minimziation vs hint is a calculation
    if (intent === 'auto') {
      if (barState === 'hint' && !props.showhint) {
        state.barState = 'peek';
      }
      else if (barState === 'peek' && props.showhint && !oldProps.showhint) {
        state.barState = 'hint';
      }
    }
    if (state.barState === 'peek') {
      state.toolState = 'main';
    }
    const barOpen = barState === 'open';
    const mainOpen = toolState === 'main';
    const searchOpen = toolState === 'search';
    const settingsOpen = toolState === 'settings';
    const userOpen = toolState === 'user';
    const micVsClear = !props.search;
    const renderModel = {
      scrimOpen: barOpen || toolsOpen,
      mainToolbarOpen: mainOpen,
      searchToolbarOpen: searchOpen,
      suggestionsContentOpen: mainOpen || searchOpen,
      settingsToolbarOpen: settingsOpen || userOpen,
      settingsContentOpen: settingsOpen,
      userContentOpen: userOpen,
      glows: Boolean(props.glows),
      hideMic: !micVsClear,
      hideClear: micVsClear
    };
    if (state.userPickerOpen && state.userPickerOpen !== oldState.userPickerOpen) {
      renderModel.contentsScrollTop = 0;
    }
    const {user, arc, avatars} = props;
    if (user && user.info && arc) {
      renderModel.avatar_title = user.info.name;
      const avatar = avatars && avatars.get(user.id);
      // TODO(sjmiles): bad way to surface the resolver
      const url = arc._loader._resolve(avatar && avatar.url || `https://$shell/assets/avatars/user (0).png`);
      renderModel.avatar_style = url ? `background-image: url("${url}");` : '';
    }
    return [props, state, renderModel];
  }
  _didRender(props, {barState, toolState}, oldProps, oldState) {
    if (barState === 'hint' && oldState.barState !== 'hint') {
      const input = this.host.querySelector('input');
      // TODO(sjmiles): without timeout, rendering gets destroyed (Blink bug?)
      setTimeout(() => {
        input.focus();
        input.select();
      }, 300);
    }
  }
  _onScrimClick() {
    if (this._state.toolsOpen) {
      this._setState({toolsOpen: false});
    } else {
      this._setState({barState: 'peek', intent: 'auto'});
    }
  }
  _onTouchbarClick() {
    if (this._state.barState !== 'over') {
      this._setState({barState: 'open'});
    }
  }
  _onBarClick(e) {
    const wasAnchorClick = e.composedPath().find(n => n.localName === 'a');
    this._setState({barState: wasAnchorClick ? 'peek' : 'open'});
  }
  _onBarEnter(e) {
    // stop waiting to autohide the hint
    Xen.debounce(this._hintDebounce);
    if (this._state.barState === 'peek') {
      let barState = 'over';
      if (this._props.showhint && this._state.toolState === 'main') {
        barState = 'hint';
      }
      this._setState({barState});
    }
  }
  _onBarLeave(e) {
    if ((window.innerHeight - e.clientY) > 10) {
      switch (this._state.barState) {
        case 'over':
        case 'hint':
          this._collapseBar();
          break;
      }
    }
  }
  _collapseBar() {
    this._setState({barState: 'peek', intent: 'auto'});
  }
  _onSearchClick(e) {
    e.stopPropagation();
    this._setState({toolState: 'search', barState: 'open'});
  }
  _onMainClick(e) {
    e.stopPropagation();
    let {toolState} = this._state;
    switch (toolState) {
      default:
        toolState = 'main';
        break;
    }
    this._setState({toolState, barState: 'open'});
  }
  _onSettingsClick(e) {
    e.stopPropagation();
    this._setState({toolState: 'settings', barState: 'open'});
  }
  _onChooseSuggestion(e, suggestion) {
    e.stopPropagation();
    this._setState({barState: 'peek'});
    // TODO(sjmiles): if we go async here, we have a tendency to send
    // stale suggestions to the listener, so we use a sync fire
    // ... watch out for jank in the animation caused by the sync work
    this._fire('suggestion', suggestion);
  }
  _onSelectUser(e, user) {
    this._fire('select-user', user.id);
    this._setState({userPickerOpen: false});
  }
  _onShare(e, share) {
    this._fire('share', share);
  }
  _onToolsClick() {
    this._setState({toolsOpen: !this._state.toolsOpen});
  }
  _onAvatarClick() {
    this._setState({userPickerOpen: !this._state.userPickerOpen});
  }
  _onSearchFocus(e) {
    this._setState({searchFocus: true});
  }
  _onSearchBlur(e) {
    this._setState({searchFocus: false});
  }
  _onSearchChange(e) {
    const search = e.target.value;
    // don't re-plan until typing has stopped for this length of time
    const delay = 500;
    const commit = () => this._commitSearch(search);
    this._searchDebounce = Xen.debounce(this._searchDebounce, commit, delay);
  }
  _onClearSearch(e) {
    this._commitSearch('');
  }
  _onResetSearch(e) {
    // Doubleclick on empty search box searches for '*'
    if (e.target.value === '') {
      this._commitSearch('*');
    }
  }
  _onVoiceSearch(e, search) {
    this._fire('search', search || '');
  }
  _commitSearch(search) {
    this._fire('search', search || '');
  }
}

customElements.define('shell-ui', ShellUi);
