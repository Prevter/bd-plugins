/**
 * @name PrevLib
 * @description Contains shared methods for plugins
 * @version 1.3.0
 * @author Prevter
 * @authorId 400199033915965441
 * @updateUrl https://prevter.github.io/bd-plugins/plugins/0PrevLib.plugin.js
 */

const _config = {
    name: "PrevLib",
    description: "Contains shared methods for plugins",
    version: "1.3.0",
    changelog: `
        <b>Finally</b> implemented automatic updates for plugins.<br/>
        A popup will appear when an update is available. 
        You can change update frequency in the library settings, or disable it completely.<br/>
        These are big changes, so you might need to restart Discord for everything to work properly.<br/><br/>
        <button class="prevlib-setting" onclick="location.reload();">Restart Discord</button>
    `,
    updateUrl: "https://prevter.github.io/bd-plugins/plugins/0PrevLib.plugin.js",
}

const DEFAULT_SETTINGS = {
    checkForUpdates: true,
    checkForUpdatesInterval: 60 * 60 * 4, // 4 hours
};

class PrevLib {
    log() {
        console.log(`%c[${this._config.name}] %c(${this._config.version})`,
            'color: #7289da', 'color: #828284', ...arguments);
    }

    save(key, value, plugin_name = null) {
        BdApi.saveData(plugin_name || this._config.name, key, value);
    }

    saveSettings(settings = null, plugin_name = null) {
        // combine current settings with given settings
        if (settings) {
            if (this._settings == undefined) this._settings = {};
            for (let key of Object.keys(settings)) {
                this._settings[key] = settings[key];
            }
        }
        BdApi.saveData(plugin_name || this._config.name, "settings", this._settings);
    }

    loadSettings(defaults = {}, plugin_name = null) {
        const settings = BdApi.Data.load(plugin_name || this._config.name, "settings") || {};
        for (let key of Object.keys(defaults)) {
            if (settings[key] == undefined) settings[key] = defaults[key];
        }
        BdApi.saveData(plugin_name || this._config.name, "settings", settings);
        return settings;
    }

    createSettingsOption(key, type, label, callback = null, plugin_name = null) {
        if (this._settings == undefined) this._settings = this.loadSettings({}, plugin_name);
        const value = this._settings[key];
        const setting = Object.assign(document.createElement("div"), { className: "prevlib-setting" });
        const span = Object.assign(document.createElement("span"), { textContent: label });
        var input;
        if (type == "textarea")
            input = Object.assign(document.createElement("textarea"), { name: key, textContent: value, className: "prevlib-setting-value" });
        else
            input = Object.assign(document.createElement("input"), { type: type, name: key, value: value, className: "prevlib-setting-value" });
        if (type == "checkbox" && value) input.checked = true;
        input.addEventListener("change", () => {
            const newValue = type == "checkbox" ? input.checked : input.value;
            this._settings[key] = newValue;
            BdApi.saveData(plugin_name || this._config.name, "settings", this._settings);
            if (callback) callback(newValue);
        });
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
    start() {
        this._config = _config;
        this.loadSettings(DEFAULT_SETTINGS, "0PrevLib");
    }
    stop() { }

    getSettingsPanel() {
        const panel = document.createElement("div");

        const checkForUpdates = this.createSettingsOption("checkForUpdates", "checkbox", "Check for updates automatically", (value) => {
            if (value) {
                this.checkForUpdatesInterval = setInterval(() => {
                    this.checkForUpdates(_config);
                }, this._settings.checkForUpdatesInterval * 1000);
                for (let plugin of PrevLibPlugins) {
                    plugin.checkForUpdatesInterval = setInterval(() => {
                        PrevLib.checkForUpdates(plugin._config);
                    }, this._settings.checkForUpdatesInterval * 1000);
                }
            } else {
                clearInterval(this.checkForUpdatesInterval);
                const prevLibPlugins = PrevLib.getPrevLibPlugins();
                for (let plugin of prevLibPlugins) {
                    clearInterval(plugin.checkForUpdatesInterval);
                }
            }
        }, "0PrevLib");

        const checkForUpdatesInterval = this.createSettingsOption("checkForUpdatesInterval", "number", "Check for updates every (seconds)", (value) => {
            if (this._settings.checkForUpdates) {
                clearInterval(this.checkForUpdatesInterval);
                this.checkForUpdatesInterval = setInterval(() => {
                    this.checkForUpdates(_config);
                }, value * 1000);

                const prevLibPlugins = PrevLib.getPrevLibPlugins();
                for (let plugin of prevLibPlugins) {
                    clearInterval(plugin.checkForUpdatesInterval);
                    plugin.checkForUpdatesInterval = setInterval(() => {
                        PrevLib.checkForUpdates(plugin._config);
                    }, value * 1000);
                }
            }
        }, "0PrevLib");
        checkForUpdatesInterval.input.min = 60;

        const checkForUpdatesButton = this.createSettingsButton("Check for updates now", () => {
            PrevLib.checkForUpdates(_config, true);
            const prevLibPlugins = PrevLib.getPrevLibPlugins();
            console.log(prevLibPlugins);
            for (let plugin of prevLibPlugins) {
                PrevLib.checkForUpdates(plugin._config, true);
            }
        });

        panel.append(checkForUpdates, checkForUpdatesInterval, checkForUpdatesButton);

        return panel;
    }

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
                this._isPrevLib = true;
                this._settings = {};
                const settings = BdApi.Data.load(this._config.name, "settings");
                if (settings) this._settings = settings;

                for (let callbackName of Object.keys(this._callbacks)) {
                    if (callbackName === "start" || callbackName === "stop") continue;
                    this[callbackName] = this._callbacks[callbackName];
                }

                if (!this._callbacks.getSettingsPanel) this["getSettingsPanel"] = undefined;

                this.checkForUpdatesInterval = PrevLib.checkForUpdates(config);

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

    static getUpdates(sourceUrl) {
        return this.sendRequest("GET", sourceUrl).then(source => {
            const version = source.match(/@version\s+([^\s]+)/)[1];
            return {
                version: version,
                filename: sourceUrl.split("/").pop(),
                source,
            };
        });
    }

    static checkForUpdates(config, force = false) {
        let libSettings = BdApi.Data.load("0PrevLib", "settings");
        if (!libSettings) {
            // save default settings
            BdApi.Data.save("0PrevLib", "settings", DEFAULT_SETTINGS);
            libSettings = DEFAULT_SETTINGS;
        }
        if (!force && !libSettings.checkForUpdates) return;

        if (!config.updateUrl) return;
        const update = this.getUpdates(config.updateUrl);
        update.then(update => {
            if (update.version !== config.version) {
                BdApi.UI.showConfirmationModal(
                    "Update available",
                    `There is an update available for **${config.name}** (${config.version} -> ${update.version}).  \nDo you want to update?`,
                    {
                        confirmText: "Update",
                        cancelText: "Cancel",
                        onConfirm: () => {
                            this.installUpdate(config.name, update);
                        }
                    }
                );
            }
        });

        return setInterval(() => {
            this.checkForUpdates(config);
        }, libSettings.checkForUpdatesInterval * 1000);
    }

    static installUpdate(name, update) {
        const plugin = BdApi.Plugins.get(name);
        if (!plugin) return;
        const pluginPath = this.getPluginsDir() + "/" + update.filename;
        const fs = require("fs");
        fs.writeFileSync(pluginPath, update.source);
    }

    static getPluginsDir() {
        // Determine platform
        const platform = process.platform;
        let dir;
        if (platform == "win32") {
            dir = process.env.APPDATA;
        } else if (platform == "darwin") {
            dir = process.env.HOME + "/Library/Preferences";
        } else {
            dir = process.env.XDG_CONFIG_HOME
                || process.env.HOME + "/.config";
        }
        dir += "/BetterDiscord/plugins";
        return dir;
    }

    static getPrevLibPlugins() {
        const plugins = BdApi.Plugins.getAll();
        const filtered = plugins.filter(plugin => {
            if (plugin.name === "PrevLib") return false;
            if (!plugin.instance._isPrevLib) return false;
            return true;
        });
        return filtered.map(plugin => plugin.instance);
    }
}

PrevLib.checkChangelog(_config);
PrevLib.checkForUpdates(_config);
global.PrevLib = PrevLib;

PrevLib.getPrevLibPlugins();

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