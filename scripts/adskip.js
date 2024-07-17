/**
 * This script automatically skips video Ads that appear while playing.
 */
(async () => {

  // Prevent the script to load multiple times
  if (window.vidooASL) return;
  window.vidooASL = true;

  // Check if Vidoo is On
  if (!(await chrome.storage.local.get({ vidooIsOn: true })).vidooIsOn) return;


  // Constants
  const url = new URL(window.location.href);
  const hostname = url.hostname.toLowerCase();
  const delay = 1000;
  const vidend = 120;


  // Detect the site from the URL hostname and call its appropriate function
  if (hostname.includes('aparat')) {
    aparat();
  } else if (hostname.includes('youtube')) {
    youtube();
  }


  /**
   * aparat.com
   */
  function aparat() {
    setInterval(() => {
      let es = document.querySelectorAll('.vast-skip-button, .ad-mode, .vast-ad, .vast-skip-counter');
      if (es.length > 0) {
        document.querySelectorAll('#videoPlayer video').forEach(v => {
          if (v.currentTime < vidend)
            v.currentTime = vidend;
        });
      }
      addHideStyle('.aparat-pause-ad, .aparat-pause-ad-xml, #sideAds, .aparat-slide-ad, .under-video-ad, #underVideoSync');
      es = document.querySelectorAll('.vast-skip-button');
      es.forEach(b => b.click());
    }, delay);
  }


  /**
   * youtube.com
   */
  function youtube() {
    setInterval(() => {
      if (document.hidden) return;
      let es = document.querySelectorAll('.video-ads');
      if (es.length > 0) {
        document.querySelectorAll('.ad-showing.playing-mode:not(.buffering-mode):not(.unstarted-mode) video').forEach(v => {
          if (v.currentTime < vidend)
            v.currentTime = vidend;
        });
      }
      addHideStyle('.ytp-ad-overlay-image, .ytp-ad-overlay-ad-info-button-container, #action-companion-click-target, #offer-module, #masthead-ad, ytd-ad-slot-renderer, #player-ads');
      es = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-overlay-close-container, .ytp-ad-skip-button-modern');
      es.forEach(b => b.click());
    }, delay);
  }


  /**
   * Add style tag to the end of body.
   * 
   * @param {string} ctx - Styles context 
   * @param {string} id - Specified id for the tag
   */
  function addStyle(ctx, id) {
    let style = document.createElement('style');
    style.innerHTML = ctx;
    style.id = id;
    document.body.appendChild(style);
  }


  /**
   * Hide the elements strictly.
   * 
   * @param {string} select - Element selector
   */
  function addHideStyle(select) {
    let id = 'vidoo-hide-style';
    let e = document.getElementById(id);
    if (e) return;
    addStyle(`
            ${select} {
                display: none !important;
                opacity: 0 !important;
                width: 0 !important;
                height: 0 !important;
                min-width: 0 !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                pointer-events: none !important;
            }
        `, id);
  }

})();