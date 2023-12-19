/**
 * @name TurboStream
 * @description Stream in 1080p60 without Nitro
 * @version 0.4.0
 * @author Prevter
 * @authorId 400199033915965441
 * @updateUrl https://prevter.github.io/bd-plugins/plugins/TurboStream.plugin.js
 */

if (!global.PrevLib) throw new Error("PrevLib is required for this plugin to work.");

const config = {
    name: "TurboStream",
    description: "Stream in 1080p60 without Nitro",
    version: "0.4.0",
    changelog: `<p>Added soundboard bypass</p>`,
    updateUrl: "https://prevter.github.io/bd-plugins/plugins/TurboStream.plugin.js"
}

module.exports = global.PrevLib.create(config, ([Plugin, Api]) => ({
    start() {
        Plugin.updater = setInterval(() => Api.getCurrentUser().premiumType = 2, 1000);
        const style = document.createElement('style');
        style.id = 'TurboStream';
        style.innerHTML = `.unavailableTooltip__58709 { display: none !important; } .premiumDisabled__07ada { opacity: 1 !important; }`;
        document.head.appendChild(style);
    },
    stop() {
        clearInterval(Plugin.updater);
        document.getElementById('TurboStream').remove();
    }
}));