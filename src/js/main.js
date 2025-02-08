
if (browser.runtime.onMessageExternal){ // TODO: support it in FF

    browser.runtime.onMessageExternal.addListener(function (request, sender, sendResponse)
    {
        if (sender.url.toLowerCase().indexOf("https://files2.freedownloadmanager.org") == -1)
            return;
        if (request == "uninstall")
        {
            browser.management.uninstallSelf();
        }
    });
}

function startExtension()
{
    var fdmext = new FdmExtension;
    fdmext.initialize();
}

browser.declarativeNetRequest.getDynamicRules(previousRules => {
    const previousRuleIds = previousRules.map(rule => rule.id);
    browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: previousRuleIds,
        addRules: []
    }).then(startExtension());
})

