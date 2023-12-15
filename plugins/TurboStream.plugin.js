/**
 * @name TurboStream
 * @description Stream in 1080p60 without Nitro
 * @version 0.3.4
 * @author Prevter
 * @authorId 400199033915965441
 * @updateUrl https://prevter.github.io/bd-plugins/plugins/TurboStream.plugin.js
 */

if (!global.PrevLib) throw new Error("PrevLib is required for this plugin to work.");

const config = {
    name: "TurboStream",
    description: "Stream in 1080p60 without Nitro",
    version: "0.3.4",
    changelog: `<p>Added update URL</p>`,
    updateUrl: "https://prevter.github.io/bd-plugins/plugins/TurboStream.plugin.js"
}

module.exports = global.PrevLib.create(config, ([Plugin, Api]) => {
    return {
        start: () => {
            Plugin.updater = setInterval(() => Api.getCurrentUser().premiumType = 2, 1000);
        },
        stop: () => {
            clearInterval(Plugin.updater);
        }
    }
});