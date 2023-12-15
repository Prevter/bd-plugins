/**
 * @name DeadRussians
 * @description Set discord status to russian losses in war with Ukraine
 * @version 1.0.0
 * @author Prevter
 * @authorId 400199033915965441
 */

if (!global.PrevLib) throw new Error("PrevLib is required for this plugin to work.");

const config = {
    name: "DeadRussians",
    description: "Set discord status to russian losses in war with Ukraine",
    version: "1.0.0",
    changelog: `<p>Complete rewrite</p>`
}

/** This function fetches stats from russianwarship.rip */
const fetchStats = async () => {
    const response = await fetch("https://russianwarship.rip/api/v2/statistics/latest");
    const json = await response.json();
    return json.data;
}

/** This function formats number to string with thousands separator */
const formatNumber = (number, options) => {
    const thousand_sep = options.thousand_sep || " ";
    const decimal_sep = options.decimal_sep || ".";
    const decimals = options.decimals || 0;
    const prefix = options.prefix || "";
    const suffix = options.suffix || "";
    const negative = number < 0;
    number = Math.abs(number);
    const rounded = number.toFixed(decimals);
    const parts = rounded.split(".");
    const integer = parts[0];
    const decimal = parts[1];
    const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousand_sep);
    return `${negative ? "-" : ""}${prefix}${formatted}${decimal ? `${decimal_sep}${decimal}` : ""}${suffix}`;
}

module.exports = global.PrevLib.create(config, ([Plugin, Api]) => ({
    start() {
        // get authentication token for making requests
        Plugin.AuthToken = Api.findModule("getToken").getToken();

        // run check every hour
        Plugin.checker = setInterval(async () => {
            await this.reCheck();
        }, 1000 * 60 * 60);

        // run check on startup
        this.reCheck();
    },
    stop() {
        clearInterval(Plugin.checker);
    },
    /** This function constructs status from stats */
    constructStatus(data) {
        const num = formatNumber(data.stats.personnel_units, {
            thousand_sep: ","
        });
        const change = formatNumber(data.increase.personnel_units, {
            thousand_sep: ",",
            prefix: "+",
        });
        return {
            emoji_id: null,
            emoji_name: "💀",
            expires_at: null,
            text: `${num} (${change}) День ${data.day}`,
        };
    },
    /** This function checks if status needs to be changed */
    async reCheck() {
        // Get current date in form of YYYY-MM-DD
        const date = new Date();
        const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        
        // Check if we already changed status today (checking saved date)
        const settings = Plugin.loadSettings();
        const savedDate = settings.lastCheckedDate;
        if (savedDate == dateString) return;

        // Get current stats
        const stats = await fetchStats();

        // Check if date in stats is the same as current date
        if (stats.date == savedDate) return;

        // Save new date
        Plugin._settings.lastCheckedDate = stats.date;
        Plugin.saveSettings();
        
        // Change status
        await this.changeStatus(stats);
    },
    /** This function constructs new status and sets it, if it's different from current one */
    async changeStatus(stats) {
        // Create status
        const status = this.constructStatus(stats);
        Plugin.log(status);

        // Get current status
        const currentStatus = await this.getCurrentStatus();

        // Check if status is already set
        if (currentStatus 
            && currentStatus.text == status.text 
            && currentStatus.emoji_name == status.emoji_name) 
            return;

        // Set status
        await this.setStatus(status);

        // Notify user
        Api.showToast(`Status changed to ${status.text}`, {
            type: "success",
            timeout: 5000
        });
    },
    /** This function is used to manually reset status, to apply changes */
    async hardResetStatus() {
        // Get stats
        const stats = await fetchStats();

        // Create status
        const status = this.constructStatus(stats);

        // Set status
        await this.setStatus(status);
    },
    /** Gets current profile status from discord api */
    async getCurrentStatus() {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.open("GET", "https://discord.com/api/v9/users/@me/settings", false);
            req.setRequestHeader("Authorization", Plugin.AuthToken);
            req.setRequestHeader("content-type", "application/json");
            req.onload = () => {
                if (req.status >= 200 && req.status < 300) {
                    const json = JSON.parse(req.response);
                    resolve(json.custom_status);
                } else {
                    reject(req);
                }
            };
            req.send();
        });
    },
    /** Sets current profile status using discord api */
    async setStatus(status) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.open("PATCH", "https://discord.com/api/v9/users/@me/settings", false);
            req.setRequestHeader("Authorization", Plugin.AuthToken);
            req.setRequestHeader("content-type", "application/json");
            req.onload = () => {
                if (req.status >= 200 && req.status < 300) {
                    resolve(req.response);
                } else {
                    reject(req);
                }
            };
            req.send(JSON.stringify({
                custom_status: status
            }));
        });
    },
}));