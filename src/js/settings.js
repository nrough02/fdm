// settings.js

function FDMsettings() {
    this.settings = {};
    this.skipHosts = [];
    this.activeTabInSkipList = false;
    this.pauseCatchingForAllSites = false;
    this.initializeState = {
        settings: false,
        buildVersion: false,
        pauseFlag: false
    };
}

FDMsettings.prototype.initialize = function () {
    // Add timeout for loading state
    setTimeout(() => {
        if (document.getElementById('fdm_loading').style.display !== 'none') {
            console.error("Settings load timeout");
            this.handleError();
        }
    }, 5000);

    // Get settings with error handling
    window.browser.runtime.sendMessage({
        type: "get_settings_for_page"
    }, (response) => {
        if (browser.runtime.lastError) {
            console.error("Settings error:", browser.runtime.lastError);
            this.handleError();
        } else {
            this.onGotSettings(response);
            this.initializeState.settings = true;
            this.checkInitComplete();
        }
    });

    // Get build version with error handling
    window.browser.runtime.sendMessage({
        type: "get_build_version_for_page"
    }, (response) => {
        if (browser.runtime.lastError) {
            console.error("Build version error:", browser.runtime.lastError);
            this.handleError();
        } else {
            this.onGotBuildVersion(response);
            this.initializeState.buildVersion = true;
            this.checkInitComplete();
        }
    });

    // Get pause flag with error handling
    window.browser.runtime.sendMessage({
        type: "get_pause_on_all_sites_flag"
    }, (response) => {
        if (browser.runtime.lastError) {
            console.error("Pause flag error:", browser.runtime.lastError);
            this.handleError();
        } else {
            this.onGotPauseOnAllSites(response);
            this.initializeState.pauseFlag = true;
            this.checkInitComplete();
        }
    });

    i18nHelper.localizePage();
    this.addEventListeners();
    this.setupDebugPanel();
};

FDMsettings.prototype.checkInitComplete = function () {
    if (this.initializeState.settings &&
        this.initializeState.buildVersion &&
        this.initializeState.pauseFlag) {
        this.updatePageState();
    }
};

FDMsettings.prototype.handleError = function () {
    document.getElementById('fdm_loading').innerHTML =
        '<span class="txt">Error loading settings. Please try again.</span>';
};

FDMsettings.prototype.onGotSettings = function (settings) {
    try {
        this.settings = settings;
        this.skipServersEnabled = this.settings.browser.monitor.skipServersEnabled === "1";
        this.skipHosts = fdmExtUtils.skipServers2array(this.settings.browser.monitor.skipServers);
        this.checkCurrentUrlInSkipList();
        customLogger.log("Settings loaded successfully: " + JSON.stringify(settings));
    } catch (error) {
        console.error("Error processing settings:", error);
        customLogger.log("Error processing settings: " + error.message);
        this.handleError();
    }
};

FDMsettings.prototype.onGotBuildVersion = function (build_version) {
    this.buildVersion = build_version;
    customLogger.log("Build version loaded: " + JSON.stringify(build_version));
};

FDMsettings.prototype.onGotPauseOnAllSites = function (paused_on_all_sites) {
    this.pauseCatchingForAllSites = paused_on_all_sites;
    customLogger.log("Pause state loaded: " + paused_on_all_sites);
};

FDMsettings.prototype.addEventListeners = function () {
    document.getElementById('activeTabInSkipList').addEventListener('click', this.clickActiveTabInSkipList.bind(this));
    document.getElementById('optionsLink').addEventListener('click', this.onUserOptionsClick.bind(this));
    document.getElementById('feedbackLink').addEventListener('click', this.onUserFeedbackClick.bind(this));
    document.getElementById('pauseCatchingForAllSites').addEventListener('click', this.clickPauseCatchingForAllSites.bind(this));

    // Add debug panel toggle
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            const debugPanel = document.getElementById('debug_panel');
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            document.getElementById('debug_log').innerHTML = customLogger.getLogs().join('<br>');
        }
    });
};

FDMsettings.prototype.setupDebugPanel = function () {
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug_panel';
    debugPanel.style.cssText = 'display:none; position:fixed; bottom:0; right:0; background:white; border:1px solid #ccc; padding:10px; max-height:200px; overflow-y:auto;';

    const debugLog = document.createElement('div');
    debugLog.id = 'debug_log';
    debugPanel.appendChild(debugLog);

    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Logs';
    exportButton.onclick = this.exportLogs.bind(this);
    debugPanel.appendChild(exportButton);

    document.body.appendChild(debugPanel);
};

FDMsettings.prototype.exportLogs = function () {
    const logs = customLogger.getLogs();
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fdm_debug_logs.txt';
    a.click();
    URL.revokeObjectURL(url);
};

FDMsettings.prototype.clickActiveTabInSkipList = function () {
    this.activeTabInSkipList = !this.activeTabInSkipList;
    window.browser.runtime.sendMessage({
        type: "change_active_tab_in_skip_list",
        checked: this.activeTabInSkipList
    });
    this.updatePageState();
    customLogger.log("Skip list toggled: " + this.activeTabInSkipList);
};

FDMsettings.prototype.onUserOptionsClick = function () {
    window.browser.runtime.sendMessage({
        type: "on_user_options_click"
    }, () => {
        window.close();
    });
};

FDMsettings.prototype.onUserFeedbackClick = function () {
    window.open('https://www.freedownloadmanager.org/support.htm');
};

FDMsettings.prototype.clickPauseCatchingForAllSites = function () {
    this.pauseCatchingForAllSites = !this.pauseCatchingForAllSites;
    window.browser.runtime.sendMessage({
        type: "set_pause_on_all_sites_flag",
        pause: this.pauseCatchingForAllSites
    });
    this.updatePageState();
    customLogger.log("Pause all sites toggled: " + this.pauseCatchingForAllSites);
};

FDMsettings.prototype.checkCurrentUrlInSkipList = function () {
    window.browser.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        if (this.skipServersEnabled && tabs.length) {
            this.activeTabInSkipList = fdmExtUtils.urlInSkipServers(this.skipHosts, tabs[0].url);
            customLogger.log("Current URL in skip list: " + this.activeTabInSkipList);
        } else {
            this.activeTabInSkipList = false;
        }
        this.updatePageState();
    });
};

FDMsettings.prototype.updatePageState = function () {
    try {
        document.getElementById('fdm_loading').style.display = "none";

        const skipListElement = document.getElementById('activeTabInSkipList');
        const pauseCatchingElement = document.getElementById('pauseCatchingForAllSites');

        if (skipListElement) {
            skipListElement.classList.toggle('checked', this.activeTabInSkipList);
        }

        if (pauseCatchingElement) {
            pauseCatchingElement.classList.toggle('checked', this.pauseCatchingForAllSites);
        }

        const settingsElement = document.getElementById('fdm_settings');
        const optionsElement = document.getElementById('optionsLink');
        const updateElement = document.getElementById('fdm_update');

        if (!this.buildVersion || this.buildVersion.old) {
            if (settingsElement) settingsElement.style.display = "none";
            if (optionsElement) optionsElement.style.display = "none";
            if (updateElement) updateElement.style.display = "block";
        } else {
            if (updateElement) updateElement.style.display = "none";
            if (settingsElement) settingsElement.style.display = "block";
            if (optionsElement) optionsElement.style.display = "block";
        }

        customLogger.log("Page state updated successfully");
    } catch (error) {
        console.error("Error updating page state:", error);
        customLogger.log("Error updating page state: " + error.message);
        this.handleError();
    }
};

FdmSettingsPageHelper.prototype.setIcon = function (in_pause) {
    try {
        if (in_pause) {
            chrome.action.setIcon({ path: "/assets/icons/fdm16d.png" })
                .catch(err => console.error("Error setting paused icon:", err));
        } else {
            chrome.action.setIcon({ path: "/assets/icons/fdm16.png" })
                .catch(err => console.error("Error setting active icon:", err));
        }
    } catch (error) {
        console.error("Error in setIcon:", error);
    }
};

// Custom logger implementation
const customLogger = {
    logs: [],
    log: function (message) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp}: ${message}`;
        this.logs.push(logEntry);
        localStorage.setItem('fdm_debug_logs', JSON.stringify(this.logs));
        console.log(message);
    },
    getLogs: function () {
        return this.logs;
    },
    clear: function () {
        this.logs = [];
        localStorage.removeItem('fdm_debug_logs');
    }
};

// Initialize settings
var fdmsettings = new FDMsettings();
fdmsettings.initialize();