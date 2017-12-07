function addTabs(e) {
    // getCurrentab dont't work
    let gettingCurrent = browser.tabs.query({
        active:true,
        currentWindow:true
    });
    gettingCurrent.then(onGot,onError);
    function onGot(c) {
        if (c){
            c = c[0];
        }else{
            return
        }
        browser.storage.local.get(['tabs', 'sites']).then((r) => {
            let _tabs = r.tabs, _sites = r.sites;
            if (e.target.checked) {
                let t = [];
                for (let i in r.sites){
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

let gettingCurrent  = browser.tabs.query({
    active:true,
    currentWindow:true
});

gettingCurrent.then(onSuccess,onError);
function onSuccess(c) {
    browser.storage.local.get(['tabs', 'sites']).then((r)=>{
        if (c){
            c = c[0];
        }else{
            return
        }
        let t = [];
        for (let i in r.sites){
            t.push(r.sites[i][1])
        }
        if (t.includes(c.url)){
            document.getElementById('addTo').checked = true;
        }
    })
}
