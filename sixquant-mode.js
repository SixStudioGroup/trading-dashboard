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
