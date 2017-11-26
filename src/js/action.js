let init = ()=>{
    var gettingCurrent = browser.tabs.getCurrent();
    gettingCurrent.then((r)=>{
        document.getElementById('website').textContent = r
    })

};
//init();
document.getElementById('openNewTab').onclick = ()=>{
    window.open('index.html');
};