/**
 * @name PrevLib
 * @description Contains shared methods for plugins
 * @version 1.2.3
 * @author Prevter
 * @authorId 400199033915965441
 */

const _config = {
    name: "PrevLib",
    description: "Contains shared methods for plugins",
    version: "1.2.3",
    changelog: `
        <ul>
            <li>• Fixed minor bugs</li>
            <li>• Added shorthand for <code>BdApi.showToast</code></li>
        </ul>
    `,
}

class PrevLib {
    log() {
        console.log(`%c[${this._config.name}] %c(${this._config.version})`,
            'color: #7289da', 'color: #828284', ...arguments);
    }

    save(key, value) {
        BdApi.saveData(this._config.name, key, value);
    }

    saveSettings(settings = null) {
        if (settings) this._settings = settings;
        BdApi.saveData(this._config.name, "settings", this._settings);
    }

    loadSettings(defaults = {}) {
        const settings = BdApi.Data.load(this._config.name, "settings") || {};
        for (let key of Object.keys(defaults)) {
            if (settings[key] == undefined) settings[key] = defaults[key];
        }
        BdApi.saveData(this._config.name, "settings", settings);
        return settings;
    }

    createSettingsOption(key, type, label, callback = () => { }, useInputCallback = false) {
        const value = this._settings[key];
        const setting = Object.assign(document.createElement("div"), { className: "prevlib-setting" });
        const span = Object.assign(document.createElement("span"), { textContent: label });
        var input;
        if (type == "textarea")
            input = Object.assign(document.createElement("textarea"), { name: key, textContent: value, className: "prevlib-setting-value" });
        else
            input = Object.assign(document.createElement("input"), { type: type, name: key, value: value, className: "prevlib-setting-value" });
        if (type == "checkbox" && value) input.checked = true;
        if (useInputCallback && type != "checkbox") {
            input.addEventListener("input", () => {
                const newValue = type == "checkbox" ? input.checked : input.value;
                this._settings[key] = newValue;
                BdApi.saveData(this._config.name, "settings", this._settings);
                callback(newValue);
            });
        }
        else {
            input.addEventListener("change", () => {
                const newValue = type == "checkbox" ? input.checked : input.value;
                this._settings[key] = newValue;
                BdApi.saveData(this._config.name, "settings", this._settings);
                callback(newValue);
            });
        }
        setting.input = input;
        setting.append(span, input);
        return setting;
    }

    createSettingsCaption(label, value = () => { }) {
        const caption = Object.assign(document.createElement("div"), { className: "prevlib-setting" });
        const span = Object.assign(document.createElement("span"), { textContent: label });
        const valueSpan = Object.assign(document.createElement("span"), { textContent: value(), className: "prevlib-setting-value" });
        caption.append(span, valueSpan);
        caption.setValue = (newValue) => {
            valueSpan.textContent = newValue;
        };
        caption.setLabel = (newLabel) => {
            span.textContent = newLabel;
        };
        return caption;
    }

    createSettingsButton(label, callback) {
        const button = Object.assign(document.createElement("button"), { className: "prevlib-setting" });
        button.textContent = label;
        button.addEventListener("click", callback);
        return button;
    }

    static libLog() {
        console.log(`%c[${_config.name}] %c(${_config.version})`,
            'color: #8298ec', 'color: #828284', ...arguments);
    }

    static checkChangelog(config) {
        let versions = BdApi.Data.load("0PrevLib", "versions");
        if (!versions || !versions[config.name] || config.version !== versions[config.name]) {
            let container = document.createElement("p");
            container.innerHTML = config.changelog;
            container.style.color = "#ccc"
            let element = BdApi.React.createElement(BdApi.ReactUtils.wrapElement(container));
            BdApi.UI.alert(`Changelog for ${config.name} ${config.version}`, element);
            if (!versions) versions = {}
            versions[config.name] = config.version;
            BdApi.Data.save("0PrevLib", "versions", versions);
        }
    }

    constructor() { }
    start() { }
    stop() { }

    static create(config, callback) {
        return class extends PrevLib {
            constructor() {
                super();
                this._config = config;
                PrevLib.checkChangelog(config);
            }
            start() {
                this.log("Starting...");
                this._callbacks = callback([this, PrevLib]);
                this._settings = {};
                const settings = BdApi.Data.load(this._config.name, "settings");
                if (settings) this._settings = settings;

                for (let callbackName of Object.keys(this._callbacks)) {
                    if (callbackName === "start" || callbackName === "stop") continue;
                    this[callbackName] = this._callbacks[callbackName];
                }

                if (this._callbacks.start) this._callbacks.start();
            }
            stop() {
                this.log("Stopping...");
                if (this._callbacks.stop) this._callbacks.stop();
            }
        }
    }

    static getModules() {
        return this._modules || (() => {
            let m = []
            webpackChunkdiscord_app.push([[`PrevLib_${Math.random()}`], {}, e => {
                if (!e || !e.c) return;
                m = m.concat(Object.values(e.c))
            }]);
            this._modules = m;
            return m;
        })();
    }

    static findModule(filter) {
        const modules = this.getModules();
        return modules.find(m => {
            if (!m.exports) return false;
            if (!m.exports.default) return false;
            return m.exports.default[filter];
        }).exports.default;
    }

    static getCurrentUser() {
        return this.findModule("getCurrentUser").getCurrentUser();
    }

    static sendRequest(method, url, body, headers) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.open(method, url);
            if (headers) {
                for (let key in headers) {
                    req.setRequestHeader(key, headers[key]);
                }
            }
            req.onload = () => {
                if (req.status >= 200 && req.status < 300) {
                    resolve(req.response);
                } else {
                    reject(req);
                }
            };
            req.onerror = () => reject(req);
            req.send(body);
        });
    }

    static showToast(content, options = {}) {
        BdApi.UI.showToast(content, options);
    }

    static getUpdates(sourceUrl) {

    }
}

PrevLib.checkChangelog(_config);
global.PrevLib = PrevLib;

const css = `
    .prevlib-setting {
        display: flex;
        margin-bottom: 10px;
        color: white;
    }

    span.prevlib-setting-value {
        flex: 1;
        text-align: right;
    }

    .prevlib-setting > span {
        flex: 1;
        margin-right: 10px;
    }

    .prevlib-setting > input {
        flex: 1;
        background: #2f3136;
        border: 1px solid #36393f;
        color: #eee;
        padding: 5px;
        border-radius: 3px;
        font-size: 14px;
    }

    .prevlib-setting > input[type="checkbox"] {
        flex: 0;
    }

    .prevlib-setting > input[type="color"] {
        padding: 0;
        margin: 0;
        background: rgba(0, 0, 0, 0);
        height: 32px;
        border: 0px;
    }

    .prevlib-setting > textarea {
        flex: 2;
        height: 100px;
        background: #2f3136;
        border: 1px solid #36393f;
        color: #eee;
        padding: 5px;
        border-radius: 3px;
        font-size: 14px;
    }

    button.prevlib-setting {
        flex: 1;
        background: #3e82e5;
        border: 1px solid #36393f;
        color: #eee;
        padding: 5px 16px;
        border-radius: 4px;
        font-size: 14px;
    }

    button.prevlib-setting:hover {
        background: #3875ce;
    }
`;

if (!document.getElementById("PrevLibCSS")) {
    const style = document.createElement("style");
    style.id = "PrevLibCSS";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
} else {
    document.getElementById("PrevLibCSS").innerHTML = css;
}
