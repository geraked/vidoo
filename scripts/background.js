/**
 * This script handles browser actions.
 * One-click toggle extension ON/OFF
 */
(async () => {

    updateIcon();
    chrome.action.onClicked.addListener(toggleStatus);

    async function updateIcon() {
        let obj = await chrome.storage.local.get({ vidooIsOn: true });
        if (obj.vidooIsOn) {
            await chrome.action.setIcon({ path: "/icons/vidoo.png" });
        } else {
            await chrome.action.setIcon({ path: "/icons/vidoo-gs.png" });
        }
    }

    async function toggleStatus() {
        let obj = await chrome.storage.local.get({ vidooIsOn: true });
        await chrome.storage.local.set({ vidooIsOn: !obj.vidooIsOn });
        await updateIcon();
    }

})();