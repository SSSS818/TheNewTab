/**!
 * The New Tab
 * @author    tracyda
 * @licence
 */

(function newTabModule(factory) {
    "use strict";
    window.NewTab = factory();
})(function newTabFactory() {
    "use strict";
    /**
     * @const
     */
    let DEFAULT_SITES = {
            "微博": ["weibo.png", "https://weibo.com"],
            "知乎": ["zhihu.png", "https://www.zhihu.com"],
            "什么值得买": ["smzdm.png", "https://www.smzdm.com"],
            "Twitter": ["twitter.png", "https://twitter.com"],
            "哔哩哔哩": ["bilibili.png", "https://www.bilibili.com"],
            "Dribbble": ["dribbble.png", "https://dribbble.com"],
            "Stackoverflow": ["stackoverflow.png", "https://stackoverflow.com"],
            "Tumblr": ["tumblr.png", "https://tumblr.com"],
            "Github": ["github.png", "https://github.com"],
            "淘宝": ["taobao.png", "https://taobao.com"],
            "500px": ["500px.png", "https://500px.com"],
            "Google+": ["googleplus.png", "https://plus.google.com"],
            "斗鱼": ["douyu.png", "https://douyu.com"],
            "图虫": ["tuchong.png", "https://tuchong.com"],
            "v2ex": ["v2ex.png", "https://www.v2ex.com"],
            "instagram": ["instagram.png", "https://instagram.com"],
            "chiphell": ["chiphell.png", "https://chiphell.com"],
            "Reddit": ["reddit.png", "https://reddit.com"]
        },
        DEFAULT_TABS = [
            "知乎", "微博", "哔哩哔哩", "Twitter", "Dribbble", "什么值得买", "Stackoverflow", "Tumblr", "Github", "淘宝", "500px", "Google+", "斗鱼", "Reddit", "图虫", "v2ex", "instagram", "chiphell"
        ],
        DEFAULT_CONFIG = {
            is_1st: true,
            isOpenNewTab: true,
            tabs: DEFAULT_TABS,
            sites: DEFAULT_SITES,
            bgIsRandom: true,
            today_bg: [],
            resolution: '1920x1080'
        },
        MAX_IMG_SIZE = 100,
        UNKNOWN = "unknown.jpg",
        INFO = "info",
        SUCCESS = "success",
        ERROR = "error";

    let fileData = null,
        currentTabs = DEFAULT_TABS,
        captureMode = false,
        notificationTimer = null;
    let download = browser.downloads.download, local = browser.storage.local;


    /**
     * @class TrashButton
     * @param el HTML element
     * @constructor
     */
    function TrashButton(el) {
        this.el = el;

        this.dragEnd = (e) => {
            e.preventDefault();
        };

        this.onDelete = async (e) => {
            e.preventDefault();
            this.el.childNodes[1].style.width = 42;
            let chosen = document.getElementsByClassName('sortable-chosen')[0];
            if (chosen) {
                chosen.parentNode.removeChild(chosen);
                let index = currentTabs.indexOf(chosen.id);
                if (index > -1) {
                    currentTabs.splice(index, 1);
                }
            }

            this.el.classList.remove('trash-shake');
            void this.el.offsetWidth;
            this.el.classList.add('trash-shake');
            await local.set({
                tabs: currentTabs
            });
        };

        _on(this.el, 'dragend', this.dragEnd);
        _on(this.el, 'dragenter', this.onDelete);
    }

    /**
     * @class SuggestList
     * @param el
     * @constructor
     */
    function SuggestList(el) {
        this.el = el;

        this.onClick = (e) => {
            openSearchTab(e.target.textContent);
        };
        this.onMouseMove = (e) => {
            if (e.target.tagName === 'SPAN') {
                let id = e.target.id.slice(16);
                document.getElementById('selectedRow' + id).classList.add('selected');
                removeSelected(id)
            }
        };

        _on(this.el, 'mouseover', this.onMouseMove);
        _on(this.el, 'click', this.onClick);
    }


    /**
     * @class SearchInput
     * @param el
     * @constructor
     */
    function SearchInput(el) {
        this.el = el;
        this.current = -1;
        this.init = true;

        this.onFocus = () => {
            let table = document.getElementById('contentSearchSuggestionsList');
            if (table.childNodes[0].childNodes.length > 0) {
                table.style.display = 'block';
            }
        };
        this.getAutoComplete = (e) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", 'http://suggestqueries.google.com/complete/search?client=firefox&q=' + e.target.value);
            xhr.addEventListener("load", _genSuggests);
            xhr.send();
            this.current = -1;
            this.init = true;
        };
        this.onKeyDown = (e) => {
            let KEY_RETURN = 13;
            let KEY_UP = 38;
            let KEY_DOWN = 40;
            let last = this.current;

            switch (e.keyCode) {
                case KEY_UP:
                    if (!this.init) {
                        this.current--;
                    }
                    break;
                case KEY_DOWN:
                    this.current++;
                    break;
                case KEY_RETURN:
                    openSearchTab(this.el.value);
                    break;
                default:
                    return;
            }
            this.init = false;
            if (this.current !== last || (this.current === last && last === -1)) {
                this.current = this.current % 6;
                this.current = this.current < 0 ? this.current + 6 : this.current;
                last = last % 6;
                last = last < 0 ? last + 6 : last;
                let select = document.getElementById('searchSuggestion' + this.current);
                this.el.value = select.textContent;
                let currentRow = document.getElementById('selectedRow' + this.current);
                let lastRow = document.getElementById('selectedRow' + last);
                currentRow.classList.add('selected');
                if (lastRow && (this.current !== last || last !== 5)) {
                    lastRow.classList.remove('selected');
                }
            }
        };

        _on(this.el, 'keypress', this.onKeyDown);
        _on(this.el, 'input', this.getAutoComplete);
        _on(this.el, 'focus', this.onFocus);
    }

    /**
     * @class DropZone
     * @param el
     * @constructor
     */
    function DropZone(el) {
        this.el = el;

        this.handleFileDrop = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            let f = evt.dataTransfer.files[0];
            if (this.el.id === 'drop-bg-zone') {
                //console.log(evt.dataTransfer.items[0])
            } else {
                if (f.size > 1024 * MAX_IMG_SIZE) {
                    alert('Your image is too large, we suggest you use an image less than ' + MAX_IMG_SIZE + 'kb')
                } else {
                    getBase64(f)
                }
            }
        };

        this.handleDragOver = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        };

        _on(this.el, 'dragover', this.handleDragOver);
        _on(this.el, 'drop', this.handleFileDrop);
    }

    /**
     * @class NewTab
     * @constructor
     */
    function NewTab() {
        "use strict";
        _getUserConfig().then(_renderPage);
        // make sites sortable
        let el = document.getElementById('top-sites');
        Sortable.create(el);

        let searchInput = document.getElementById('newtab-search-text');
        let suggestList = document.getElementById('contentSearchSuggestionsList');
        let bin = document.getElementById('trash-button');
        let dropSite = document.getElementById('drop-site-zone');
        new DropZone(dropSite);
        new TrashButton(bin);
        new SearchInput(searchInput);
        new SuggestList(suggestList);


        // change resolution
        function changeResolution(e) {
            e.preventDefault();
            let resolute = {1280: '1280x720', 1920: '1920x1080', 2560: '2560x1440'}[this.id.slice(11)];
            document.getElementById('drop-down').textContent = resolute;
            local.set({
                resolution: resolute
            }).then(() => {
                showMessage('Success', 'Current resolution is ' + resolute, SUCCESS);
            });
        }

        document.getElementById("resolution-1280").onclick = changeResolution;
        document.getElementById("resolution-1920").onclick = changeResolution;
        document.getElementById("resolution-2560").onclick = changeResolution;

        document.getElementById('notifications-tc').onclick = () => {
            let no = document.getElementById('notification');
            no.classList.remove('bounceInDown');
            no.classList.add('bounceOutUp');
            if (notificationTimer) {
                clearTimeout(notificationTimer);
            }
        };

        // settings button
        document.getElementById('settings-button').onclick = () => {
            let settingsDialog = document.getElementById('settings-dialog');
            settingsDialog.style.display = "block";
        };
        // save button
        document.getElementById('save-button').onclick = saveBg;
        document.getElementById('refresh-button').onclick = () => {
            document.getElementById('loader').style.display = 'block';
            document.getElementById('bg').classList.add('frosting');
            local.get('resolution').then((r) => {
                randomBackground(r.resolution);
            });
        };
        // reset button
        document.getElementById('resetNewTab').onclick = () => {
            local.set(DEFAULT_CONFIG);
            _renderPage(DEFAULT_CONFIG);
            showMessage('Success', 'Settings have been reset', SUCCESS)
        };
        // close settings
        document.getElementById('settings-close').onclick = () => {
            document.getElementById('settings-dialog').style.display = "none";
            // clear form
            document.getElementById('tab-form').reset();
            let zone = document.getElementById('drop-site-zone');
            zone.innerHTML = `<img src="images/upload.svg" style="width: 47px;padding-top: 12px;"/><p>Drop files here</p>`
            zone.classList.add('drop-site-zone');

            let urlError = document.getElementById('newTabUrl-error');
            urlError.innerHTML = '';
            urlError.style.display = 'block';
            let nameError = document.getElementById('newTabName-error');
            nameError.innerHTML = '';
            nameError.style.display = 'block';
        };
        // todo local image
        // set open in new tab
        document.getElementById('isOpenNewTab').onclick = function (e) {
            local.set({
                isOpenNewTab: e.target.checked
            }).then(() => {
                showMessage('Success', 'Takes effect next time', SUCCESS)
            });
        };
        // search submit
        document.getElementById('searchSubmit').onclick = () => {
            openSearchTab(document.getElementById('newtab-search-text').value);
        };

        // setup the drop listeners. todo store image to db
        let siteInput = document.getElementById('file-site-input');
        siteInput.addEventListener('change', (evt) => {
            if (evt.target.files[0].size > 1024 * MAX_IMG_SIZE) {
                alert('Your image is too large, we suggest you use an image less than ' + MAX_IMG_SIZE + 'kb')
            } else {
                getBase64(evt.target.files[0]);
            }
        }, false);

        let submitNewTab = document.getElementById('submitNewTab');
        submitNewTab.addEventListener('click', () => {
            let newTabName = document.getElementById('newTabName');
            let newTabUrl = document.getElementById('newTabUrl');
            if (!validateUrl(newTabUrl.value)) {
                let urlError = document.getElementById('newTabUrl-error');
                urlError.innerHTML = 'Invalid url';
                urlError.style.display = 'block';
                showMessage('Error', 'Invalid input', ERROR);
                return;
            }
            local.get({tabs: DEFAULT_TABS, sites: DEFAULT_SITES, isOpenNewTab: true}).then((r) => {
                if (!newTabName.value) {
                    let nameError = document.getElementById('newTabName-error');
                    nameError.innerHTML = 'Please type your site name';
                    nameError.style.display = 'block';
                    showMessage('Error', 'Invalid input', ERROR);
                } else if (newTabName.value in r.tabs) {
                    let nameError = document.getElementById('newTabName-error');
                    nameError.innerHTML = 'Site name already exist';
                    nameError.style.display = 'block';
                    showMessage('Error', 'Invalid input', ERROR);
                } else {
                    let tmp_sites = r.sites, tmp_tabs = r.tabs;
                    tmp_sites[newTabName.value] = [fileData, newTabUrl.value];
                    tmp_tabs.push(newTabName.value);
                    local.set({
                        tabs: tmp_tabs,
                        sites: tmp_sites,
                    });
                    document.getElementById('top-sites').innerHTML += _genAtom(newTabName.value, newTabUrl.value, fileData, r.isOpenNewTab);
                    // reset fileData
                    fileData = null;
                }
            });
        });
    }

    NewTab.create = () => {
        "use strict";
        return new NewTab();
    };

    // todo add cloud sync
    let _getUserConfig = async () => {
        return await local.get(DEFAULT_CONFIG);
    };

    let _genAtom = (title, link, img, isOpenNewTab) => {
        let bg = 'url(./images/sites/unknown.jpg);';
        if (img) {
            bg = img.startsWith('data:image') || img.startsWith('http') ? 'url(' + img + ')' : 'url(./images/sites/' + img + ');';
        }
        if (!link.startsWith('http')) {
            link = 'http://' + link
        }
        let target = isOpenNewTab ? "_blank" : '';
        return `<li class="top-site-outer" id="` + title + `">
                <a href="` + link + `" target=` + target + `>
                    <div title="` + title + `" class="tile">
                        <div class="logo" style="background-image: ` + bg + `"></div>
                    </div>
                </a>
            </li>`;
    };

    let _renderPage = (r) => {
        let sites = '', openNewTabToggle = document.getElementById('isOpenNewTab'),
            drop = document.getElementById('drop-down');
        openNewTabToggle.checked = r.isOpenNewTab;
        drop.textContent = r.resolution;
        if (r.is_1st) {
            document.getElementById('bg').style.backgroundImage = 'url(./images/bg1.jpg)';
            let _today_ = new Date();
            let dd = _today_.getDate(), mm = _today_.getMonth() + 1, yyyy = _today_.getFullYear();
            let tmp = {
                is_1st: false,
                isOpenNewTab: true,
                tabs: DEFAULT_TABS,
                sites: DEFAULT_SITES,
                bgIsRandom: true,
                today_bg: [[yyyy, mm, dd].join('-'), 'http://liubai.qiniudn.com/0001.jpg'],
                resolution: '1920x1080'
            };
            local.set(tmp);
        } else if (r.bgIsRandom) {
            setBackground(r.today_bg, r.resolution);
        } else {
            // todo custom image
        }
        r.tabs.forEach((val) => {
            let img = r.sites[val][0] ? r.sites[val][0] : UNKNOWN;
            sites += _genAtom(val, r.sites[val][1], img, r.isOpenNewTab);
        });
        document.getElementById('top-sites').innerHTML = sites;
    };

    let _on = (el, event, fn) => {
        el.addEventListener(event, fn, captureMode);
    };

    // search
    function _genSuggests() {
        let suggest = document.getElementById('contentSearchSuggestionsList');
        if (this.responseText.startsWith('[')) {
            let data = JSON.parse(this.responseText);
            let item = '';
            data[1].forEach((val, index) => {
                // select first 6 items
                if (index < 6) {
                    item += `<tr id="selectedRow` + index + `" dir="auto" class="contentSearchSuggestionRow remote" role="presentation">
                        <td class="contentSearchSuggestionEntry" role="option" aria-selected=false>
                            <span id="searchSuggestion` + index + `">` + val + `</span>
                        </td>
                     </tr>`;
                }
            });
            suggest.innerHTML = item;
            suggest.style.display = 'block';

        } else {
            suggest.innerHTML = '';
            suggest.style.display = 'none';
        }
    }

    let showMessage = (title, message, type = INFO) => {
        let _notify = document.getElementById('notifications-tc');
        _notify.innerHTML = `<div id="notification" class="notification animated bounceInDown notification-` + type + `">
                             <h4 id="notification-title" class="notification-title" googl="true">` + title + `</h4>
                             <div id="notification-message" class="notification-message">` + message + `</div>
                             </div>`;
        notificationTimer = setTimeout(function () {
            let no = document.getElementById('notification');
            no.classList.remove('bounceInDown');
            no.classList.add('bounceOutUp');
        }, 2000);
    };

    let randomBackground = (resolution) => {
        let _today_ = new Date();
        let dd = _today_.getDate(), mm = _today_.getMonth() + 1, yyyy = _today_.getFullYear();
        let xhr = new XMLHttpRequest();
        xhr.open("GET", 'https://source.unsplash.com/user/tracyda/likes/' + resolution);
        xhr.addEventListener("load", function storeRedirectUrl() {
            let bg = document.getElementById('bg');
            bg.classList.add('fade-in');
            bg.style.backgroundImage = 'url(' + this.responseURL + ')';
            setTimeout(() => {
                bg.classList.remove('fade-in');
            }, 500);
            bg.classList.remove('frosting');
            document.getElementById('loader').style.display = 'none';
            local.set({
                today_bg: [[yyyy, mm, dd].join('-'), this.responseURL]
            })
        });
        xhr.send();
    };

    let setBackground = async (today_bg, resolution) => {
        let _today_ = new Date();
        let dd = _today_.getDate(), mm = _today_.getMonth() + 1, yyyy = _today_.getFullYear();
        if (!today_bg || today_bg[0] !== [yyyy, mm, dd].join('-')) {
            await randomBackground(resolution);
        } else {
            document.getElementById('bg').style.backgroundImage = 'url(' + today_bg[1] + ')';
        }
    };

    let openSearchTab = (text, url = null, engine = 'google') => {
        let SearchMap = {
            google: (key) => 'https://www.google.com/search?q=' + key + '&ie=utf-8&oe=utf-8',
        };
        switch (engine) {
            case 'google':
                window.open(SearchMap.google(text));
                break;
        }
        document.getElementById('contentSearchSuggestionsList').style.display = 'none'
    };

    let getBase64 = (file) => {
        let reader = new FileReader();
        if (file) {
            reader.readAsDataURL(file);
            reader.onload = () => {
                document.getElementById('drop-site-zone').innerHTML = '<img class="thumb shadow" style="border-radius: 50%" src="' + reader.result + '"/>';
                document.getElementById('drop-site-zone').className = '';
                fileData = reader.result;
                //console.log(fileData)
            };
        }

    };

    let saveBg = () => {
        let download_url = document.getElementById('bg').style.backgroundImage.slice(5, -2);
        let tmp = download_url.split('=');
        download({
            url: download_url,
            filename: tmp[tmp.length - 1] + '.jpg',
        }).then(() => {
            showMessage('Success', 'File name is ' + tmp[tmp.length - 1] + '.jpg', SUCCESS)
        });
    };

    let validateUrl = (str) => {
        let pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return pattern.test(str);
    };

    let removeSelected = (select) => {
        for (let i of ['0', '1', '2', '3', '4', '5']) {
            if (i !== select) {
                document.getElementById('selectedRow' + i).classList.remove('selected')
            }
        }
    };

    NewTab.version = '1.0.0';
    return NewTab;
});

NewTab.create();