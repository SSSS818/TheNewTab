function addTabs(e) {
    // getCurrentab dont't work
    let gettingCurrent = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    gettingCurrent.then(onGot, onError);

    function onGot(c) {
        if (c) {
            c = c[0];
        } else {
            return
        }
        browser.storage.local.get(['tabs', 'sites']).then((r) => {
            let _tabs = r.tabs, _sites = r.sites;
            if (e.target.checked) {
                let t = [];
                for (let i in r.sites) {
                    t.push(r.sites[i][1])
                }
                if (!(t.includes(c.url))) {
                    _tabs.push(c.title);
                    _sites[c.title] = [c.favIconUrl, c.url];
                }
            } else {
                // remove
                delete _sites[c.title];
                let index = _tabs.indexOf(c.title);
                if (index > -1) {
                    _tabs.splice(index, 1);
                }
            }
            browser.storage.local.set({
                tabs: _tabs,
                sites: _sites
            })
        })
    }

}

function onError(error) {
    console.log(`Error: ${error}`);
}

document.getElementById('addTo').onclick = addTabs;

let gettingCurrent = browser.tabs.query({
    active: true,
    currentWindow: true
});

gettingCurrent.then(onSuccess, onError);

function onSuccess(c) {
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
        ];
    browser.storage.local.get({
        tabs: DEFAULT_TABS,
        sites: DEFAULT_SITES
    }).then((r) => {
        if (c) {
            c = c[0];
        } else {
            return
        }
        let t = [];
        for (let i in r.sites) {
            t.push(r.sites[i][1])
        }
        let _url_ = c.url.endsWith('/') ? c.url.slice(0, -1) : c.url;
        if (t.includes(_url_)) {
            document.getElementById('addTo').checked = true;
        }
    })
}
