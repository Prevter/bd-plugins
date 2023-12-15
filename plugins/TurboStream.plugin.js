/**
 * @name TurboStream
 * @description Stream in 1080p60 without Nitro
 * @version 0.3.3
 * @author Prevter
 * @authorId 400199033915965441
 */

if (!global.PrevLib) throw new Error("PrevLib is required for this plugin to work.");

const config = {
    name: "TurboStream",
    description: "Stream in 1080p60 without Nitro",
    version: "0.3.3",
    changelog: `<p>Fixed issue with automatic reload</p>`
}

module.exports = global.PrevLib.create(config, ([Plugin, Api]) => ({
    start() {
        Plugin.updater = setInterval(() => Api.getCurrentUser().premiumType = 2, 1000);
    },
    stop() {
        clearInterval(Plugin.updater);
    }
}));