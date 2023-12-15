/**
 * @name Invisicord
 * @description Disable Discord's telemetry and tracking
 * @version 0.0.2
 * @author Prevter
 * @authorId 400199033915965441
 * @updateUrl https://prevter.github.io/bd-plugins/plugins/Invisicord.plugin.js
 */

if (!global.PrevLib) throw new Error("PrevLib is required for this plugin to work.");

const config = {
    name: "Invisicord",
    description: "Disable Discord's telemetry and tracking",
    version: "0.0.2",
    changelog: `<b>Added update URL</b>`,
    updateUrl: "https://prevter.github.io/bd-plugins/plugins/Invisicord.plugin.js"
}

const originalOpen = window.XMLHttpRequest.prototype.open;
const originalSetRequestHeader = window.XMLHttpRequest.prototype.setRequestHeader;

module.exports = global.PrevLib.create(config, ([Plugin, Api]) => ({
    start: async () => {
        // Replace functions
        XMLHttpRequest.prototype.open = function (method, url, async) {
            const parameters = url.split('/').pop().split('?')[0];
            if (['science'].includes(parameters)) return false;
            try {
                const host = new URL(url).hostname;
                if (['sentry.io'].includes(host)) return false;
            }
            catch (e) { Plugin.log(url, e); }
            return originalOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
            if (['X-Track', 'X-Fingerprint'].includes(header)) return false;
            return originalSetRequestHeader.apply(this, arguments);
        };
    },
    stop: async () => {
        // Restore original functions
        XMLHttpRequest.prototype.open = originalOpen;
        XMLHttpRequest.prototype.setRequestHeader = originalSetRequestHeader;
    },
}));