/**
 * This script, adds control panel to videos and audios.
 */
(() => {

    // Prevent the script to load multiple times
    if (window.vidooCL) return;
    window.vidooCL = true;


    // Constants
    const iconUrl = chrome.runtime.getURL('icons/vidoo.png');
    const delay = 3000;

    let counter = 1;
    let mdata = {};
    let checkInterval = setInterval(check, delay);


    // Change video panel position when fullscreenchange is fired.
    document.addEventListener('fullscreenchange', e => {
        let parent = e.target;
        let video = parent.querySelector('video');
        let panel = parent.querySelector('.vidoo-panel-video');
        if (!video || !video.hasAttribute('vidoo-id')) return;
        let id = video.getAttribute('vidoo-id');
        if (panel) {
            if (!document.fullscreenElement) document.body.appendChild(panel);
            setPanelPos(panel, video);
            return;
        }
        panel = document.querySelector(`.vidoo-panel-video[vidoo-id="${id}"]`);
        if (panel) {
            setPanelPos(panel, video);
            parent.appendChild(panel);
        }
    });


    /**
     * Main interval
     */
    function check() {
        checkMedias('video');
        checkMedias('audio');
    }


    /**
     * Find all videos and audios and add control panel to each one.
     * 
     * @param {string} ms - audio | video
     */
    function checkMedias(ms) {
        document.querySelectorAll(`.vidoo-panel-${ms}`).forEach(panel => {
            let id = panel.getAttribute('vidoo-id');
            let media = document.querySelector(`${ms}[vidoo-id="${id}"]`);
            if (!media) {
                panel.remove();
                if (id in mdata) delete mdata[id];
            } else {
                setPanelPos(panel, media);
                updateMedia(media, mdata[id]);
            }
        });

        document.querySelectorAll(ms).forEach(media => {
            if (media.hasAttribute('vidoo-id') || isHidden(media)) return;
            let panel = createPanel(media, counter);
            panel.setAttribute('vidoo-id', counter);
            media.setAttribute('vidoo-id', counter);
            setPanelPos(panel, media);
            document.body.appendChild(panel);
            counter++;
        });
    }


    /**
     * Create control panel.
     * 
     * @param {Element} media 
     * @param {number} cntid
     * @returns {Element}
     */
    function createPanel(media, cntid) {
        let panel = document.createElement('div');
        let button = document.createElement('button');
        let dropdown = document.createElement('div');
        let dpc = document.createElement('div');
        let reset = document.createElement('button');
        let ms = media.tagName.toLowerCase();
        let isVideo = ms === 'video';
        let data = {};
        let defs;
        mdata[cntid] = data;

        if (isVideo) {
            defs = {
                speed: 1,
                brightness: 1,
                contrast: 1,
                grayscale: 0,
                invert: 0,
                opacity: 1,
                saturate: 1,
                sepia: 0,
                blur: 0,
                'hue-rotate': 0,
                rotate: 0,
                fh: 1,
                fv: 1,
                scale: 1,
                controls: media.hasAttribute('controls'),
            };
        } else {
            defs = {
                speed: 1,
            };
        }

        let flipChange = e => {
            let val = e.target.checked ? -1 : 1;
            data[e.target.name] = val;
            media.style.transform = `scale(${data.fh * data.scale}, ${data.fv * data.scale}) rotate(${data.rotate}deg)`;
            updateMedia(media, data);
        }

        resetData(data, defs);


        // Toggle dropdown button
        button.className = 'vidoo-button';
        button.innerHTML = `<img src="${iconUrl}">`;
        button.addEventListener('click', e => {
            if (dropdown.classList.contains('vidoo-dropdown-show')) {
                button.innerHTML = `<img src="${iconUrl}">`;
                dropdown.classList.remove('vidoo-dropdown-show');
            } else {
                button.innerHTML = '&#10006;';
                dropdown.classList.add('vidoo-dropdown-show');
            }
        });
        panel.appendChild(button);


        // Reset button
        reset.innerText = 'Reset';
        reset.addEventListener('click', e => {
            resetData(data, defs);
            dropdown.querySelectorAll('input').forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else {
                    let key = input.getAttribute('vidoo-key');
                    input.value = data[key];
                }
            });
            updateMedia(media, data);
        });
        dpc.appendChild(reset);


        // Control fields
        dpc.appendChild(createField(0.3, 4, 0.1, 'speed', data, media));
        if (isVideo) {
            dpc.appendChild(createField(0, 5, 0.1, 'brightness', data, media));
            dpc.appendChild(createField(0, 5, 0.1, 'contrast', data, media));
            dpc.appendChild(createField(0, 1, 0.01, 'saturate', data, media));
            dpc.appendChild(createField(0, 1, 0.01, 'opacity', data, media));
            dpc.appendChild(createField(0, 1, 0.01, 'sepia', data, media));
            dpc.appendChild(createField(0, 1, 0.01, 'grayscale', data, media));
            dpc.appendChild(createField(0, 1, 0.01, 'invert', data, media));
            dpc.appendChild(createField(0, 50, 1, 'blur', data, media));
            dpc.appendChild(createField(0, 360, 1, 'hue-rotate', data, media));
            dpc.appendChild(createField(0, 360, 1, 'rotate', data, media));
            dpc.appendChild(createField(0.3, 4, 0.1, 'scale', data, media));
        }


        // Flip checkboxes
        if (isVideo) {
            dpc.appendChild(createCheckbox('fh', 'Flip Horizontal', flipChange));
            dpc.appendChild(createCheckbox('fv', 'Flip Vertical', flipChange));
        }


        // Show controls
        if (isVideo) {
            dpc.appendChild(createCheckbox('controls', 'Show Native Controls', e => {
                data.controls = e.target.checked;
                if (data.controls) media.setAttribute('controls', '');
                else media.removeAttribute('controls');
                if (data.controls) media.requestFullscreen();
                updateMedia(media, data);
            }));
        }


        // Panel
        panel.lang = 'en';
        panel.className = `vidoo-panel vidoo-panel-${ms}`;
        dropdown.className = 'vidoo-dropdown';
        dpc.className = 'vidoo-dpc';
        dropdown.appendChild(dpc);
        panel.appendChild(dropdown);

        return panel;
    }


    /**
     * Create control field.
     * 
     * @param {number} min 
     * @param {number} max 
     * @param {number} step 
     * @param {string} key
     * @param {object} data
     * @param {Element} media  
     * @returns {Element}
     */
    function createField(min, max, step, key, data, media) {
        let field = document.createElement('div');
        let label = document.createElement('label')
        let range = document.createElement('input');
        let number = document.createElement('input');


        // Handle input change
        let onChange = e => {
            let val = e.target.value;
            data[key] = val;
            range.value = val;
            number.value = val;
            updateMedia(media, data);
        }


        // Label
        label.innerText = key;
        label.className = 'vidoo-label';
        field.appendChild(label);


        // Range input
        range.setAttribute('type', 'range');
        range.className = 'vidoo-range';
        range.min = min;
        range.max = max;
        range.step = step;
        range.value = data[key];
        range.setAttribute('vidoo-key', key);
        range.addEventListener('input', onChange);
        field.appendChild(range);


        // Number input
        number.setAttribute('type', 'number');
        number.className = 'vidoo-number';
        number.lang = 'en';
        number.min = min;
        number.max = max;
        number.step = step;
        number.size = 3;
        number.value = data[key];
        number.setAttribute('vidoo-key', key);
        number.addEventListener('input', onChange);
        field.appendChild(number);


        field.className = 'vidoo-field';
        return field;
    }


    /**
     * Generate value for "filter" style property of video.
     * 
     * @param {object} data 
     * @returns {string} 
     */
    function videoFilter(data) {
        let filter = '';
        for (let k in data) {
            if (k === 'speed' || k === 'rotate' || k === 'fh' || k === 'fv' || k === 'scale' || k === 'controls') continue;
            let unit;
            switch (k) {
                case 'blur':
                    unit = 'px';
                    break;
                case 'hue-rotate':
                    unit = 'deg';
                    break;
                default:
                    unit = '';
                    break;
            }
            filter += ` ${k}(${data[k]}${unit})`;
        }
        return filter;
    }


    /**
     * Reset changes to defaults.
     * 
     * @param {object} data 
     * @param {object} defs 
     */
    function resetData(data, defs) {
        for (let k in defs) {
            data[k] = defs[k];
        }
    }


    /**
     * Create a checkbox.
     * 
     * @param {string} name 
     * @param {string} title 
     * @param {Function} change 
     * @returns {Element}
     */
    function createCheckbox(name, title, change) {
        let div = document.createElement('div');
        let input = document.createElement('input');
        let label = document.createElement('label');
        div.className = 'vidoo-checkbox';
        input.setAttribute('type', 'checkbox');
        input.setAttribute('name', name);
        input.addEventListener('click', change);
        label.innerText = title;
        div.appendChild(input);
        div.appendChild(label);
        return div;
    }


    /**
     * Calculate the offset of the element.
     * 
     * @param {Element} el 
     * @returns {object}
     */
    function offset(el) {
        let elRect = el.getBoundingClientRect();
        let offset = {};
        if (el.hasAttribute('vidoo-transformed') && el.offsetParent) {
            elRect = el.offsetParent.getBoundingClientRect();
        }
        if (document.fullscreenElement && document.fullscreenElement.contains(el)) {
            offset.top = elRect.top;
            offset.left = elRect.left;
        } else {
            offset.top = elRect.top + window.scrollY;
            offset.left = elRect.left + window.scrollX;
        }
        return offset;
    }


    /**
     * Set panel position depend on media position.
     * 
     * @param {Element} panel 
     * @param {Element} media 
     */
    function setPanelPos(panel, media) {
        let vo = offset(media);
        let tg = media.tagName === 'VIDEO' ? 7.5 : -39.5;
        let lg = media.tagName === 'VIDEO' ? 7.5 : 0;
        panel.style.top = (vo.top + tg) + 'px';
        panel.style.left = (vo.left + lg) + 'px';
        if (media.tagName === 'AUDIO') {
            if ((media.offsetParent === null || media.style.display === 'none' || !media.clientHeight || !media.clientWidth || !vo.left || !vo.top)) {
                panel.style.setProperty('position', 'fixed', 'important');
                panel.style.top = 'auto';
                panel.style.bottom = 50 + 'px';
                panel.style.left = 15 + 'px';
                if (media.paused || media.ended || media.readyState < 3) {
                    panel.style.setProperty('display', 'none', 'important');
                } else {
                    panel.style.setProperty('display', 'block', 'important');
                }
            }
        }
    }


    /**
     * Check if the element is hidden.
     * 
     * @param {Element} el 
     * @returns {boolean}
     */
    function isHidden(el) {
        return (el.readyState < 3);
    }


    /**
     * Set media attributes.
     * 
     * @param {Element} media
     * @param {object} data
     */
    function updateMedia(media, data) {
        if (media.tagName === 'VIDEO') {
            media.style.filter = videoFilter(data);
            media.style.transform = `scale(${data.fh * data.scale}, ${data.fv * data.scale}) rotate(${data.rotate}deg)`;
            if (data.rotate || data.scale != 1) media.setAttribute('vidoo-transformed', '');
            else media.removeAttribute('vidoo-transformed');
            if (data.controls) media.setAttribute('controls', '');
            else media.removeAttribute('controls');
        }
        media.playbackRate = data.speed;
    }

})();