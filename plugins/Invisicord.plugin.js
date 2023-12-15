/**
 * @name Invisicord
 * @description Disable Discord's telemetry and tracking
 * @version 0.0.1
 * @author Prevter
 * @authorId 400199033915965441
 */

if (!global.PrevLib) throw new Error("PrevLib is required for this plugin to work.");

const config = {
    name: "Invisicord",
    description: "Disable Discord's telemetry and tracking",
    version: "0.0.1",
    changelog: `<b>Initial release</b>`,
}

const originalOpen = window.XMLHttpRequest.prototype.open;
const originalSetRequestHeader = window.XMLHttpRequest.prototype.setRequestHeader;

module.exports = global.PrevLib.create(config, ([Plugin, Api]) => ({
    async start() {
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
    async stop() {
        // Restore original functions
        XMLHttpRequest.prototype.open = originalOpen;
        XMLHttpRequest.prototype.setRequestHeader = originalSetRequestHeader;
    },
}));