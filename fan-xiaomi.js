
console.info("%c Xiaomi Fan Card \n%c  Version  1.1.5 ", "color: orange; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray");
import 'https://unpkg.com/@material/mwc-slider@0.18.0/mwc-slider.js?module'
const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;
const includeDomains = ["fan"];

export class FanXiaomiCard extends LitElement {
  setConfig(config) {
    this.config = config;
  }
  constructor() {
    super();
    this._timer1 = null;
    this._timer2 = null;
  }
  static get properties() {
      return {
          hass: {},
          config: {},
          over:false,
          x0:false,
          y0:false
      };
  }
  static getConfigElement() {
    return document.createElement("fan-xiaomi-card-editor");
  }
  static getStubConfig() {
    return {name: 'AirPurifier',
            entity: '',
            aspect_ratio: '1',
            slider_option: true,
            background_color:''}
  }
  static getPMColor(pm) {
    pm = parseInt(pm);
    if (pm <= 35) {
      let greenStrength = Math.max(150, 255 - pm * 3); // Make green more intense
      return `rgb(0, ${greenStrength}, 50, 0.5)`;
    } else if (pm <= 100) {
        return `rgb(255, ${Math.max(100, 255 - pm)}, 0, 0.5)`; // Yellow tones
    } else {
        return `rgb(200, ${Math.max(0, 200 - (pm - 100) * 2)}, 0, 0.5)`; // Red tones
    }
  }
  render() {
    let fans=[];
    for(var i=1;i<73;i++){
      fans.push(i)
    }
    let fan1s=[];
    for(var i=1;i<73;i+=2){
      fan1s.push(i)
    }
    const state = this.hass.states[this.config.entity];
    const attrs = state.attributes;
    let isSpleep = attrs['preset_mode'] == 'Sleep'
    let isAuto = attrs['preset_mode'] == 'Auto'
    let isManual = attrs['preset_mode'] == 'Favorite'
    let isLock = this.hass.states['switch.zhimi_cpa4_64ab_physical_control_locked'].state == 'on'
    let isSound = this.hass.states['switch.zhimi_cpa4_64ab_alarm'].state == 'on'
    let manualState = this.hass.states['number.zhimi_cpa4_64ab_favorite_level']
    let airLevel = this.hass.states['sensor.zhimi_cpa4_64ab_pm25_density'].state
    let filterLevel = this.hass.states['sensor.zhimi_cpa4_64ab_filter_life_level'].state
    //TODO: Get motor speed for animation speed, let maxMotorSpeed = 2056 
    let nowspeed = isManual ? (15 - manualState.state): 5

    return html`
    <div id="aspect-ratio" 
      style="width:${100*this.config.aspect_ratio||100}%" 
      class="${state.state=='unavailable'||state.state.state=='unavailable'?'offline':''}" 
      @mouseout="${function(){this.over=false}}" 
      @mouseover="${function(){this.over=true}}" 
      @mousemove="${this.onMouseMove}"
      @touchmove="${this.onMouseMove}"
      @mouseup="${this.onMouseUp}"
      @touchend="${this.onMouseUp}">
      <ha-card id="fan" class="${state.state=='on'||state.state.state=='on'?'active':''}" style="background:${this.config.background_color||''}">
        <div id="container">
          <div class="fanbox ${state.state=='on'||state.state.state=='on'?'active':''}">
            <div class="blades" style="animation-duration:${nowspeed}s">
              <div class="b1 ang1"></div>
              <div class="b2 ang25"></div>
              <div class="b3 ang49"></div>
            </div>
            ${fans.map(i => html`<div class="fan ang${i}"></div>`)}
            ${fan1s.map(i => html`<div class="fan1 ang${i}"></div>`)}
            <div class="c2" style="border-color:${FanXiaomiCard.getPMColor(airLevel)}"></div>
            <div class="c3">
                <ha-icon id="power" icon="${state.state=='on'||state.state.state=='on'?(isSpleep?'mdi:weather-night':isManual?'mdi:fan-speed-1':'mdi:leaf'):'mdi:power'}" 
                  class="c_icon state show" role="button" tabindex="0" aria-disabled="false" .cmd="${'toggle'}" @click=${this._action}></ha-icon>
            </div>
            <div class="c1">
              <div class="wrapper rightc complete">
                <div class="circle rightcircle ${filterLevel<20?"red":""}" style="transform:${filterLevel?filterLevel<50?"rotate(-135deg)":"rotate("+(filterLevel/(100/360)-180-135)+"deg)":""}"></div>
              </div>
              <div class="wrapper leftc complete">
                <div class="circle leftcircle ${filterLevel<20?"red":""}" style="transform:${filterLevel?filterLevel<50?"rotate("+(filterLevel/(100/360)-135)+"deg)":"rotate(45deg)":""}"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div id="buttons" class="${this.over || !this.config.slider_option?'show':'hidden'}" style="${!this.config.slider_option?'margin-top:32px;':''}background:${this.config.background_color||'var(--card-background-color)'}">
          <mwc-icon-button id="block" class="c_icon ${isLock?"active":""}" role="button" tabindex="0" aria-disabled="false" .cmd="${'lock'}" @click=${this._action}>
            <ha-icon icon="${isLock?"mdi:lock":"mdi:lock-open"}"></ha-icon>
          </mwc-icon-button>
          <div class="icon-badge-container c_icon" .cmd="${'manualLevel'}" @click=${this._action}>
            <mwc-icon-button id="bmanual" class="${isManual?"active":""}" .cmd="${'favorite'}" @click=${this._action}>
              <ha-icon icon="mdi:fan-speed-1"></ha-icon>
            </mwc-icon-button>
            <div class="badge">${parseInt(manualState.state)}</div>
          </div>
          <mwc-icon-button id="bsound" class="c_icon ${isSound?"active":""}" role="button" tabindex="0" aria-disabled="false" .cmd="${'sound'}" @click=${this._action}>
            <ha-icon icon="${isSound?'mdi:volume-high':'mdi:volume-off'}"></ha-icon>
          </mwc-icon-button>
          <mwc-icon-button id="bauto" class="c_icon ${isAuto?"active":""}" role="button" tabindex="0" aria-disabled="false" .cmd="${'auto'}" @click=${this._action}>
            <ha-icon icon="mdi:fan-auto"></ha-icon>
          </mwc-icon-button>
          <mwc-icon-button id="bsleep" class="c_icon ${isSpleep?"active":""}" role="button" tabindex="0" aria-disabled="false" .cmd="${'sleep'}" @click=${this._action}>
            <ha-icon icon="mdi:weather-night"></ha-icon>
          </mwc-icon-button>
        </div>
        <mwc-slider
          id="manualSlider" 
          class="hidden" 
          pin 
          min="${manualState.attributes['min']}"
          max="${manualState.attributes['max']}" 
          value="${manualState.state}" 
          step="${manualState.attributes['step']}" 
          style="background:${this.config.background_color||'var(--card-background-color)'}" 
          @mousedown=${this._clickSƒlƒider}
          @change=${this._changeManualLevel}
        ></mwc-slider>
        <div class="header" style="font-size: 9px;" class="${this.over?'hidden':'show'}">   
            <div class="name">
              <span class="ellipsis show" style="">${this.config.name}</span>
            </div>
        </div>
      </ha-card>
    </div>
    `
  }
  static get styles() {
    return css `
    #aspect-ratio {position: relative;}
    #aspect-ratio::before {content: "";display: block;padding-bottom: 100%;}
    #aspect-ratio>:first-child {position: absolute;top: 0;left: 0;height: 100%;width: 100%; overflow: hidden;}
    #container{height: 100%;width: 100%;display: flex;overflow: hidden;}
    #buttons{position: absolute;bottom: 0;justify-content:center;width: calc( 100% - 20px );margin: 0 10px;}
    #buttons>*{position: relative;}
    #buttons.show{display: flex;}
    mwc-icon-button ha-icon{padding-bottom: 8px;}
    #buttons ha-icon-button ,#buttons mwc-icon-button{--mdc-icon-button-size: 32px; }
    #buttons tspan{text-anchor: middle;font-family: Helvetica, sans-serif;alignment-baseline: central;dominant-baseline: central;font-size: 10px;}
    #manualSlider{position: absolute;bottom: 0;width: calc( 100% - 20px );margin: 0 10px;z-index: 25;}

    .c_icon {position: absolute;cursor: pointer;top: 0;right: 0;z-index: 25;}
    .c_icon.active{color:var(--paper-item-icon-active-color);fill:var(--paper-item-icon-active-color);}
    .c_icon .oc{stroke:var(--primary-text-color)}
    .c_icon.active .oc{stroke:var(--paper-item-icon-active-color);}

    #bauto.active{color: #32CD32;}
    #bsleep.active{color: #6495ED;}
    #bmanual.active{color: #FF8C00;}
    #block.active{color: #FF0000;}
    #bsound.active{color: #32CD32;}

    .icon-badge-container {
      position: relative;
      display: inline-block;
    }

    .badge {
      position: absolute;
      top: 0;
      right: 0;
      color: white;
      background-color: black;
      font-size: 10px;
      font-weight: bold;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .offline{opacity:0.5}
    .ang1 {transform: rotate(0deg)}.ang2 {transform: rotate(5deg)}.ang3 {transform: rotate(10deg)}.ang4 {transform: rotate(15deg)}.ang5 {transform: rotate(20deg)}.ang6 {transform: rotate(25deg)}.ang7 {transform: rotate(30deg)}.ang8 {transform: rotate(35deg)}.ang9 {transform: rotate(40deg)}.ang10 {transform: rotate(45deg)}.ang11 {transform: rotate(50deg)}.ang12 {transform: rotate(55deg)}.ang13 {transform: rotate(60deg)}.ang14 {transform: rotate(65deg)}.ang15 {transform: rotate(70deg)}.ang16 {transform: rotate(75deg)}.ang17 {transform: rotate(80deg)}.ang18 {transform: rotate(85deg)}.ang19 {transform: rotate(90deg)}.ang20 {transform: rotate(95deg)}.ang21 {transform: rotate(100deg)}.ang22 {transform: rotate(105deg)}.ang23 {transform: rotate(110deg)}.ang24 {transform: rotate(115deg)}.ang25 {transform: rotate(120deg)}.ang26 {transform: rotate(125deg)}.ang27 {transform: rotate(130deg)}.ang28 {transform: rotate(135deg)}.ang29 {transform: rotate(140deg)}.ang30 {transform: rotate(145deg)}.ang31 {transform: rotate(150deg)}.ang32 {transform: rotate(155deg)}.ang33 {transform: rotate(160deg)}.ang34 {transform: rotate(165deg)}.ang35 {transform: rotate(170deg)}.ang36 {transform: rotate(175deg)}.ang37 {transform: rotate(180deg)}.ang38 {transform: rotate(185deg)}.ang39 {transform: rotate(190deg)}.ang40 {transform: rotate(195deg)}.ang41 {transform: rotate(200deg)}.ang42 {transform: rotate(205deg)}.ang43 {transform: rotate(210deg)}.ang44 {transform: rotate(215deg)}.ang45 {transform: rotate(220deg)}.ang46 {transform: rotate(225deg)}.ang47 {transform: rotate(230deg)}.ang48 {transform: rotate(235deg)}.ang49 {transform: rotate(240deg)}.ang50 {transform: rotate(245deg)}.ang51 {transform: rotate(250deg)}.ang52 {transform: rotate(255deg)}.ang53 {transform: rotate(260deg)}.ang54 {transform: rotate(265deg)}.ang55 {transform: rotate(270deg)}.ang56 {transform: rotate(275deg)}.ang57 {transform: rotate(280deg)}.ang58 {transform: rotate(285deg)}.ang59 {transform: rotate(290deg)}.ang60 {transform: rotate(295deg)}.ang61 {transform: rotate(300deg)}.ang62 {transform: rotate(305deg)}.ang63 {transform: rotate(310deg)}.ang64 {transform: rotate(315deg)}.ang65 {transform: rotate(320deg)}.ang66 {transform: rotate(325deg)}.ang67 {transform: rotate(330deg)}.ang68 {transform: rotate(335deg)}.ang69 {transform: rotate(340deg)}.ang70 {transform: rotate(345deg)}.ang71 {transform: rotate(350deg)}.ang72 {transform: rotate(355deg)}
    .fanbox{position:relative;margin:13%;width: 74%; height: 74%;border-radius:50%;background:#80808061}
    
    #fan.active .blades{transform-origin:50% 50%;animation:blades 3s infinite linear;transform-box:fill-box!important}

    .blades div{position:absolute;margin:15% 0 0 15%;width:35%;height:35%;border-radius:100% 50% 0;background:#989898;transform-origin:100% 100%}
    .blades{width:100%;height:100%}
    
    .fan{top:0;transform-origin:0 250%}
    .fan,.fan1{position:absolute;left:0;margin-left:50%;width:1%;height:20%;background:#fff}
    .fan1{top:20%;transform-origin:0 150%}
    .c1{top:20%;left:20%;width:60%;height:60%;border:2px solid #fff;border-radius:50%;cursor:pointer;baskground:#ffffff00}
    .c1,.c2{position:absolute;box-sizing:border-box}
    .c2{top:-1%;left:-1%;width:102%;height:102%;border:6px solid #f7f7f7;border-radius:50%;background: #ffffff01;}
    .c3{position:absolute;top:40%;left:40%;box-sizing:border-box;width:20%;height:20%;border-radius:50%;background:#fff;color:#ddd}
    
    .c3 ha-icon{
      width: 80%;
      height: 80%;
      outline: none;
      --mdc-icon-size: 100%;
      top: 10%;
      right: 10%;
    }
    

    .c1 .wrapper{
      width: calc(50% + 2px);
      height: calc(100% + 4px);
      position: absolute;
      top:-2px;
      overflow: hidden;
    }
    .c1 .rightc{
      right:-2px;
    }
    .c1 .leftc{
      left:-2px;
    }
    .c1 .circle{
      width: 200%;
      height: 100%;
      box-sizing:border-box;
      border:2px solid transparent;
      border-radius: 50%;
      position: absolute;
      top:0;
      transform : rotate(-135deg);
    }
    .c1 .rightcircle{
      border-top:2px solid #63ff69;
      border-right:2px solid #63ff69;
      right:0;
    
    }
    .c1 .leftcircle{
      border-bottom:2px solid #63ff69;
      border-left:2px solid #63ff69;
      left:0;
    
    }
    .c1 .battery_charge{
      -webkit-animation: battery_charge 2s linear infinite;
    }
    .c1 .leftcircle.red{
      border-bottom:2px solid #ff5722;
      border-left:2px solid #ff5722;
    }
    .name {
      width: 100%;
      position: absolute;
      bottom: 0px;
      margin-bottom: 5px;
      text-align: center;
      opacity: 0.5;
    }
    .show{display: block;}
    .hidden{display: none;}
    
    .state{
      display: none;
    }
    .state.show{
      display: block;
    }
    mwc-slider.hidden{
      display: block;
      left: 100%;
    }
    @-webkit-keyframes circle_right{
      0%{
          -webkit-transform: rotate(-135deg);
      }
      50%,100%{
          -webkit-transform: rotate(45deg);
      }
    }
    @-webkit-keyframes circle_left{
      0%,50%{
          -webkit-transform: rotate(-135deg);
      }
      100%{
          -webkit-transform: rotate(45deg);
      }
    }
    
    @-webkit-keyframes battery_charge{
      50%{
        opacity:1;
    }
      0%,100%{
        opacity:0;
    }
    }
    
    @keyframes blades{0%{transform:translate(0,0) rotate(0)}
    to{transform:translate(0,0) rotate(3600deg)}
    }
    `
  }
  _mouseover(e){
    this.over=true;
  }
  _clickSlider(e){
    const target = e.target;
  }
  _changeManualLevel(e){
    
    const target = e.target;

    this.hass.callService("number", "set_value", {
      entity_id: "number.zhimi_cpa4_64ab_favorite_level",
      value: parseInt(target.value)
    });
    
    this._timer3 = setTimeout(() => {
      target.classList.add("hidden")
    },1500)
    
  }
  _action(e){
    const target = e.currentTarget;
    

    if (!this.config || !this.hass || !target ) {
        return;
    }
    let attr = this.hass.states[this.config.entity].attributes
    let state = this.hass.states[this.config.entity].state

    if(target.cmd == "toggle"){
      this.hass.callService('fan', 'toggle', {
        entity_id: this.config.entity
      });
    }else if(target.cmd == "sleep" || target.cmd == "auto" || target.cmd == "favorite"){
      
      this.hass.callService('fan', 'set_preset_mode', {
        entity_id: this.config.entity,
        preset_mode: target.cmd.charAt(0).toUpperCase() + target.cmd.slice(1)
      });
      
    }else if(target.cmd == "sound"){
      this.hass.callService("switch", "toggle", {
        entity_id: "switch.zhimi_cpa4_64ab_alarm"
      });
    }else if(target.cmd == "lock"){
      this.hass.callService("switch", "toggle", {
        entity_id: "switch.zhimi_cpa4_64ab_physical_control_locked"
      });
    }else if(target.cmd == "set_direction_left" && state=="on"){
      this.hass.callService('fan', 'set_direction', {
        entity_id: this.config.entity,
        direction: 'left'
      });
    }else if(target.cmd == "set_direction_right" && state=="on"){
      this.hass.callService('fan', 'set_direction', {
        entity_id: this.config.entity,
        direction: 'right'
      });
    }else if(target.cmd == "manualLevel"){
      clearTimeout(this._timer3);
      target.parentNode.parentNode.parentNode.querySelector("#manualSlider").classList.remove("hidden")
      this._timer2 = setTimeout(() => {
        target.parentNode.parentNode.parentNode.querySelector("#manualSlider").classList.add("hidden")
      },5000)
    }
  }
  onMouseMove (e) {
  }
  onMouseDown(e){
  }
  onMouseUp(e) {
  }
  
  fire(type, detail, options) {
  
    options = options || {}
    detail = detail === null || detail === undefined ? {} : detail
    const e = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed,
    })
    
    e.detail = detail
    this.dispatchEvent(e)
    return e
  }
}

customElements.define('fan-xiaomi', FanXiaomiCard);

export class FanXiaomiCardEditor extends LitElement {
  setConfig(config) {
    this.config = config;
  }

  static get properties() {
      return {
          hass: {},
          config: {}
      };
  }
  render() {
    var fanRE = new RegExp("fan\.")
    return html`
    <div class="card-config">
      <paper-input
          label="${this.hass.localize("ui.panel.lovelace.editor.card.generic.title")} (${this.hass.localize("ui.panel.lovelace.editor.card.config.optional")})"
          .value="${this.config.name}"
          .configValue="${"name"}"
          @value-changed="${this._valueChanged}"
      ></paper-input>
      <div class="side-by-side">
        <paper-input-container>
            <label slot="label">${this.hass.localize("ui.panel.lovelace.editor.card.generic.aspect_ratio")} (${this.hass.localize("ui.panel.lovelace.editor.card.config.optional")}) ${this.config.aspect_ratio?this.config.aspect_ratio:1}</label>
            
            <input type="range" class="aspect_ratio" value="${this.config.aspect_ratio?this.config.aspect_ratio:1}" min="0.3" max="1.0" step="0.01" slot="input" .configValue="${"aspect_ratio"}" @input="${this._valueChanged}">
        </paper-input-container>

        <paper-input-container>
            <label slot="label">
                Slider option
            </label>

            <input type="checkbox" 
                class="slider_option_toggle" 
                .configValue="${"slider_option"}" 
                ?checked=${this.config.slider_option}
                @change="${this._checkedChanged}">
        </paper-input-container>

        <paper-input-container>
            <label slot="label">Background Color</label>
            <input type="color" value="${this.config.background_color?this.config.background_color:""}" slot="input" .configValue="${"background_color"}" @input="${this._valueChanged}">
            <ha-icon-button slot="suffix" icon="${this.config.background_color?"mdi:palette":"mdi:palette-outline"}" title="${this.hass.localize("ui.panel.lovelace.editor.card.map.delete")}" .type="${"background_color"}" @click=${this._delEntity}></ha-icon-button>
        </paper-input-container>
      </div>
      <ha-entity-picker
        .label="${this.hass.localize(
          "ui.panel.lovelace.editor.card.generic.entity"
        )} (${this.hass.localize(
          "ui.panel.lovelace.editor.card.config.required"
        )})"
        .hass=${this.hass}
        .value=${this.config.entity}
        .configValue=${"entity"}
        .includeDomains=${includeDomains}
        @change=${this._valueChanged}
        allow-custom-entity
      ></ha-entity-picker>
    </div>
    `
  }
  static get styles() {
    return css `
    a{
      color: var(--accent-color);
    }
    .side-by-side {
        display: flex;
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .side-by-side > * {
        flex: 1;
        padding-right: 4px;
      }
      .info > * {
        flex: none;
        width: calc(33% - 10px);
        padding: 0 5px;
      }

      ha-switch{
        margin-right: 10px;
      }
      ha-icon{
        --mdc-icon-button-size: 24px;
      }
      .fs{
          flex:0.3;
      }
      .aspect_ratio{
        appearance: slider-horizontal;
        color: rgb(16, 16, 16);
        cursor: default;
        padding: initial;
        border: initial;
        margin: 2px;
      }
    `
  }
  _focusEntity(e){
    // const target = e.target;
    e.target.value = ''
  }

  _checkedChanged(e){
    const target = e.target;

    if (!this.config || !this.hass || !target ) {
        return;
    }
    let configValue = target.configValue
    let newConfig = {
        ...this.config
    };
    newConfig[configValue] = target.checked
    this.configChanged(newConfig)
  }

  _valueChanged(e){
    const target = e.target;

    if (!this.config || !this.hass || !target ) {
        return;
    }
    let configValue = target.configValue
    let newConfig = {
        ...this.config
    };
    console.log(target.value)
        newConfig[configValue] = target.value
    this.configChanged(newConfig)
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true
    });
    event.detail = {config: newConfig};
    this.dispatchEvent(event);
  }
}
customElements.define("fan-xiaomi-card-editor", FanXiaomiCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "fan-xiaomi",
  name: "Xiaomi AirPurifier Lovelace Card",
  preview: true, // Optional - defaults to false
  description: "Xiaomi AirPurifier" // Optional
});

