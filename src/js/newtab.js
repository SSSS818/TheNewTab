/**!
 * The New Tab
 * @author    tracyda
 * @licence
 */

(function newTabModule(factory) {
    "use strict";
    window["NewTab"] = factory();
})(function newTabFactory() {
    "use strict";
    let last,
        fileData,
        sortable,
        current_tabs = null,
        captureMode = false;

    /**
     * @const
     */
    let DEFAULT_SITES = {
            '微博': ['weibo.png', 'https://weibo.com'],
            '知乎': ['zhihu.png', 'https://zhihu.com'],
            'Google': ['google.png', 'https://google.com'],
            '什么值得买': ['smzdm.png', 'https://www.smzdm.com'],
            'Twitter': ['twitter.png', 'https://twitter.com'],
            'Facebook': ['facebook.png', 'https://facebook.com'],
            '哔哩哔哩': ['bilibili.png', 'https://www.bilibili.com'],
            'Dribbble': ['dribbble.png', 'https://dribbble.com'],
            'Stackoverflow': ['stackoverflow.png', 'https://stackoverflow.com'],
            'Tumblr': ['tumblr.png', 'https://tumblr.com'],
            'Github': ['github.png', 'https://github.com'],
            '淘宝': ['taobao.png', 'https://taobao.com'],
            '500px': ['500px.png', 'https://500px.com'],
            'Google+': ['googleplus.png', 'https://plus.google.com'],
            '斗鱼': ['douyu.png', 'https://douyu.com'],
            '豆瓣': ['douban.png', 'https://douban.com'],
            '图虫': ['tuchong.png', 'https://tuchong.com'],
            'v2ex': ['v2ex.png', 'https://v2ex.com'],
            'instagram': ['instagram.png', 'https://instagram.com'],
            'chiphell': ['chiphell.png', 'https://chiphell.com'],
            'Reddit': ['reddit.png', 'https://reddit.com']
        },
        DEFAULT_TABS = [
            '知乎', '微博', '哔哩哔哩', 'Twitter', 'Dribbble', '什么值得买', 'Stackoverflow', 'Tumblr', 'Github', '淘宝', '500px', 'Google+', '斗鱼', 'Reddit', '图虫', 'v2ex', 'instagram', 'chiphell'
        ],
        BORDER_COLOR = [
            'rgba(0, 209, 178, 0.7)',
            'rgba(50, 115, 220, 0.7)',
            'rgba(255, 56, 96, 0.7)',
            'rgba(30, 215, 96, 0.7)',
            'rgba(234, 198, 53, 0.7)',
            'rgba(255, 76, 192, 0.7)',
            'rgba(131, 45, 255, 0.7)',
            'rgba(58, 209, 255, 0.7)',
            'rgba(159, 212, 35, 0.7)',
            'rgba(255, 81, 29, 0.7)',
            'rgba(255, 29, 29, 0.7)',
            'rgba(29, 130, 255, 0.7)'
        ],
        BACKGROUND_COLOR = [
            'rgba(0, 209, 178, 0.4)',
            'rgba(50, 115, 220, 0.4)',
            'rgba(255, 56, 96, 0.4)',
            'rgba(30, 215, 96, 0.4)',
            'rgba(234, 198, 53, 0.4)',
            'rgba(255, 76, 192, 0.4)',
            'rgba(131, 45, 255, 0.4)',
            'rgba(58, 209, 255, 0.4)',
            'rgba(159, 212, 35, 0.4)',
            'rgba(255, 81, 29, 0.4)',
            'rgba(255, 29, 29, 0.4)',
            'rgba(29, 130, 255, 0.4)'
        ],
        UNKNOWN = 'unknown.jpg';

    /**
     * @class TrashButton
     * @param el HTML element
     * @constructor
     */
    function TrashButton(el) {
        this.el = el;

        this._dragEnd = (e) => {
            e.preventDefault();
        };

        this._onDelete = async (e) => {
            e.preventDefault();
            this.el.childNodes[1].style.width = 42;
            let chosen = document.getElementsByClassName('sortable-chosen')[0];
            if (chosen) {
                chosen.parentNode.removeChild(chosen);
                let index = current_tabs.indexOf(chosen.id);
                if (index > -1) {
                    current_tabs.splice(index, 1);
                }
            }

            this.el.classList.remove('trash-shake');
            void this.el.offsetWidth;
            this.el.classList.add('trash-shake');
            await browser.storage.local.set({
                tabs: current_tabs
            });
        };

        _on(this.el, 'dragend', this._dragEnd);
        _on(this.el, 'dragenter', this._onDelete);
    }

    /**
     * @class SuggestList
     * @param el
     * @constructor
     */
    function SuggestList(el) {
        this.el = el;

        this._oClick = (e) => {
            openSearchTab(e.target.textContent);
        };
        this._onMouseMove = (e) => {
            if (e.target.tagName === 'SPAN') {
                let id = e.target.id.slice(16);
                document.getElementById('selectedRow' + id).classList.add('selected');
                removeSelected(id)
            }
        };

        _on(this.el, 'mouseover', this._onMouseMove);
        _on(this.el, 'click', this._oClick);
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

        this._onFocus = () => {
            let table = document.getElementById('contentSearchSuggestionsList');
            if (table.childNodes[0].childNodes.length > 0) {
                table.style.display = 'block'
            }
        };
        this._getAutoComplete = (e) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", 'http://suggestqueries.google.com/complete/search?client=firefox&q=' + e.target.value);
            xhr.addEventListener("load", _genSuggests);
            xhr.send();
            this.current = -1;
            this.init = true;
        };
        this._onKeyDown = (e) => {
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
                if (lastRow && (this.current !== last || last !== 5))
                    lastRow.classList.remove('selected');
            }
        };

        _on(this.el, 'keypress', this._onKeyDown);
        _on(this.el, 'input', this._getAutoComplete);
        _on(this.el, 'focus', this._onFocus);
    }

    /**
     * @class DropZone
     * @param el
     * @constructor
     */
    function DropZone(el) {
        this.el = el;

        this._handleFileDrop = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            let f = evt.dataTransfer.files[0];
            if (f.size > 1024 * 60) {
                alert('Your image is too large, we suggest you use an image less than 100kb')
            } else {
                getBase64(f)
            }
        };

        this._handleDragOver = (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        };

        _on(this.el, 'dragover', this._handleDragOver);
        _on(this.el, 'drop', this._handleFileDrop);
    }

    /**
     * @class NewTab
     * @constructor
     */
    function NewTab() {
        _getUserConfig().then(_renderPage);
        // make sites sortable
        let el = document.getElementById('top-sites');
        sortable = Sortable.create(el);

        let searchInput = document.getElementById('newtab-search-text');
        let suggestList = document.getElementById('contentSearchSuggestionsList');
        let bin = document.getElementById('trash-button');
        let dropZone = document.getElementById('drop-zone');
        new DropZone(dropZone);
        new TrashButton(bin);
        new SearchInput(searchInput);
        new SuggestList(suggestList);

        // change resolution todo notify
        function changeResolution(e) {
            e.preventDefault();
            let resolute = {1280: '1280x720', 1920: '1920x1080', 2560: '2560x1440'}[this.id.slice(11)];
            browser.storage.local.set({
                resolution: resolute
            });
            document.getElementById('drop-down').textContent = resolute;
        }

        document.getElementById("resolution-1280").onclick = changeResolution;
        document.getElementById("resolution-1920").onclick = changeResolution;
        document.getElementById("resolution-2560").onclick = changeResolution;


        // settings button
        document.getElementById('settings-button').onclick = () => {
            document.getElementById('settings-dialog').style.display = "block";
        };
        // save button
        document.getElementById('save-button').onclick = saveBg;
        document.getElementById('refresh-button').onclick = () => {
            document.getElementById('loader').style.display = 'block';
            document.getElementById('bg').classList.add('frosting');
            browser.storage.local.get('resolution').then((r)=>{
                randomBackground(r.resolution)
            })

        };
        // reset button
        document.getElementById('resetNewTab').onclick = () => {
            browser.storage.local.set({
                is_1st: false,
                tabs: DEFAULT_TABS,
                isOpenNewTab: true,
                sites: DEFAULT_SITES,
                bgIsRandom: true
            });
            _renderPage({isOpenNewTab: true, sites: DEFAULT_SITES, tabs: DEFAULT_TABS})
        };
        // close settings
        document.getElementById('settings-close').onclick = () => {
            document.getElementById('settings-dialog').style.display = "none";
        };
        // set open in new tab
        document.getElementById('isOpenNewTab').onclick = function (e) {
            browser.storage.local.set({
                isOpenNewTab: e.target.checked
            });
        };
        // search submit
        document.getElementById('searchSubmit').onclick = () => {
            openSearchTab(document.getElementById('newtab-search-text').value);
        };

        // setup the drop listeners. todo store image to db
        let fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (evt) => {
            getBase64(evt.target.files[0]);
        }, false);

        let submitNewTab = document.getElementById('submitNewTab');
        submitNewTab.addEventListener('click', () => {
            let newTabName = document.getElementById('newTabName');
            let newTabUrl = document.getElementById('newTabUrl');
            if (!validateUrl(newTabUrl.value)) {
                document.getElementById('newTabUrl-error').innerHTML = 'Invalid url';
                document.getElementById('newTabUrl-error').style.display = 'block';
                return
            }
            browser.storage.local.get({tabs: DEFAULT_TABS, sites: DEFAULT_SITES, isOpenNewTab: true}).then((r) => {
                if (!newTabName.value) {
                    document.getElementById('newTabName-error').innerHTML = 'Please type your site name';
                    document.getElementById('newTabName-error').style.display = 'block';
                } else if (newTabName.value in r.tabs) {
                    document.getElementById('newTabName-error').innerHTML = 'Site name already exist';
                    document.getElementById('newTabName-error').style.display = 'block';
                } else {
                    let tmp_sites = r.sites, tmp_tabs = r.tabs;
                    tmp_sites[newTabName.value] = [fileData, newTabUrl.value];
                    tmp_tabs.push(newTabName.value);
                    browser.storage.local.set({
                        tabs: tmp_tabs,
                        sites: tmp_sites,
                    });
                    document.getElementById('top-sites').innerHTML += _genAtom(newTabName.value, newTabUrl.value, fileData, r.isOpenNewTab);
                    console.log(tmp_tabs, tmp_sites, fileData)
                    // reset fileData
                    fileData = null;
                }
            });
        });
    }

    NewTab.create = () => {
        return new NewTab();
    };

    // TODO add cloud sync
    let _getUserConfig = async () => {
        let r = await browser.storage.local.get({
            is_1st: true,
            tabs: DEFAULT_TABS,
            isOpenNewTab: true,
            sites: DEFAULT_SITES,
            bgIsRandom: true,
            today_bg: [],
            resolution: '1920x1080'
        });
        if (r.is_1st) {
            await browser.storage.local.set({
                is_1st: false,
                tabs: DEFAULT_TABS,
                isOpenNewTab: true,
                sites: DEFAULT_SITES,
                bgIsRandom: true,
                today_bg: [],
                resolution: '1920x1080'
            });
        }
        current_tabs = r.tabs;
        console.log(r)
        return r;
    };

    let _genAtom = (title, link, img, isOpenNewTab) => {
        let bg = 'url(./images/sites/unknown.jpg);';
        if (img) {
            bg = img.startsWith('data:image') ? 'url(' + img + ')' : 'url(./images/sites/' + img + ');';
        }
        if (!link.startsWith('http')) {
            link = 'http://' + link
        }
        let target = isOpenNewTab ? "_blank" : '';
        return `<li class="top-site-outer" id="` + title + `">
                <a href="` + link + `" target=` + target + `>
                    <div title="` + title + `" class="tile fade-in">
                        <div class="logo" style="background-image: ` + bg + `"></div>
                    </div>
                </a>
            </li>`;
    };

    let _renderPage = (r) => {
        let sites = '', openNewTabToggle = document.getElementById('isOpenNewTab'),drop = document.getElementById('drop-down');
        openNewTabToggle.checked = r.isOpenNewTab;
        drop.textContent = r.resolution;

        if (r.bgIsRandom) {
            setBackground(r.today_bg,r.resolution);
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

    let randomBackground = (resolution) => {
        let _today_ = new Date();
        let dd = _today_.getDate(), mm = _today_.getMonth() + 1, yyyy = _today_.getFullYear();
        let xhr = new XMLHttpRequest();
        xhr.open("GET", 'https://source.unsplash.com/user/tracyda/likes/'+resolution);
        xhr.addEventListener("load", function storeRedirectUrl() {
            let bg = document.getElementById('bg');
            bg.style.backgroundImage = 'url(' + this.responseURL + ')';
            // set time out to fetch image data
            setTimeout(() => {
                bg.classList.remove('frosting');
                document.getElementById('loader').style.display = 'none';
            }, 500);
            browser.storage.local.set({
                today_bg: [[yyyy, mm, dd].join('-'), this.responseURL]
            })
        });
        xhr.send();
    };

    let setBackground = async (today_bg,resolution) => {
        let _today_ = new Date();
        let dd = _today_.getDate(), mm = _today_.getMonth() + 1, yyyy = _today_.getFullYear();
        if (!today_bg || today_bg[0] !== [yyyy, mm, dd].join('-')) {
            randomBackground(resolution)
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
                document.getElementById('drop-zone').innerHTML = '<img class="thumb shadow" style="border-radius: 50%" src="' + reader.result + '"/>';
                document.getElementById('drop-zone').className = '';
                fileData = reader.result;
                console.log(fileData)
            };
        }

    };

    let saveBg = () => {
        let download_url = document.getElementById('bg').style.backgroundImage.slice(5, -2);
        let tmp = download_url.split('=');
        browser.downloads.download({
            url: download_url,
            filename: tmp[tmp.length - 1] + '.jpg',
        });
    };

    let sortDict = (dict) => {
        let items = Object.keys(dict).map(function (key) {
            return [key, dict[key]];
        });
        items.sort(function (first, second) {
            return second[1] - first[1];
        });
        return items;
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