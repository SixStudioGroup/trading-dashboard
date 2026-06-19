// One-time storage migration for the Six Studio Group rebrand. Copies legacy
// zencloud.* records forward to the sixquant.* namespace (and renames the
// per-record fromZenCloud field) so no operator loses portfolio/journal data.
// Runs synchronously in <head>, before app.js / stocks.js read any key.
// Idempotent: guarded by a one-shot flag; old keys are removed after copy.
(() => {
    let ls;
    try { ls = window.localStorage; } catch { return; }
    try {
        if (ls.getItem("sixquant.nsMigrated.v1")) return;
        const MAP = {
            "zencloud.portalMode.v1": "sixquant.portalMode.v1",
            "zencloud.hideValues.v1": "sixquant.hideValues.v1",
            "zencloud.githubPat.v1": "sixquant.githubPat.v1",
            "zencloud.journalFilter.v1": "sixquant.journalFilter.v1",
            "zencloud.manualHoldings.v1": "sixquant.manualHoldings.v1",
            "zencloud.tradeJournal.v1": "sixquant.tradeJournal.v1",
            "zencloud.stocks.tradeJournal.v1": "sixquant.stocks.tradeJournal.v1",
            "zencloud.stocks.holdings.v1": "sixquant.stocks.holdings.v1",
            "zencloud.watchlist.v1": "sixquant.watchlist.v1",
            "zencloud.signalHistory.v1": "sixquant.signalHistory.v1",
            "zencloud.sessionChecklist.v1": "sixquant.sessionChecklist.v1"
        };
        Object.keys(MAP).forEach((oldKey) => {
            const newKey = MAP[oldKey];
            const oldVal = ls.getItem(oldKey);
            if (oldVal === null) return;
            if (ls.getItem(newKey) === null) ls.setItem(newKey, oldVal);
            ls.removeItem(oldKey);
        });
        ["sixquant.tradeJournal.v1", "sixquant.stocks.tradeJournal.v1"].forEach((key) => {
            const raw = ls.getItem(key);
            if (!raw) return;
            try {
                const records = JSON.parse(raw);
                if (!Array.isArray(records)) return;
                let changed = false;
                records.forEach((rec) => {
                    if (rec && typeof rec === "object" && "fromZenCloud" in rec && !("fromSixQuant" in rec)) {
                        rec.fromSixQuant = rec.fromZenCloud;
                        delete rec.fromZenCloud;
                        changed = true;
                    }
                });
                if (changed) ls.setItem(key, JSON.stringify(records));
            } catch { /* leave malformed record set untouched */ }
        });
        ls.setItem("sixquant.nsMigrated.v1", "1");
    } catch { /* storage off or quota reached — app still works on defaults */ }
})();

// SixQuant device-mode detector. Sets data-device="phone|tablet|desktop" on
// <html> from viewport width, unless the user locked a mode in Settings
// (sixquant.deviceMode.v1 = auto|phone|tablet|desktop). Loaded synchronously
// in <head> so mode-specific CSS applies before first paint.
(() => {
    const KEY = "sixquant.deviceMode.v1";
    const detect = () => window.innerWidth <= 640 ? "phone" : window.innerWidth <= 1180 ? "tablet" : "desktop";
    const stored = () => {
        try { return window.localStorage.getItem(KEY) || "auto"; } catch { return "auto"; }
    };
    const apply = () => {
        const pref = stored();
        document.documentElement.dataset.device = pref === "auto" ? detect() : pref;
        document.documentElement.dataset.devicePref = pref;
    };
    apply();
    let timer;
    window.addEventListener("resize", () => {
        clearTimeout(timer);
        timer = setTimeout(apply, 150);
    });
    window.SixQuantDeviceMode = { apply, KEY };
})();
