// drag and delete
let bin = document.getElementById('trash-button');

bin.addEventListener('dragend', (e) => {
    e.preventDefault();
});

bin.addEventListener('dragenter', async (e) => {
    e.preventDefault();
    bin.childNodes[1].style.width = 42;
    let chosen = document.getElementsByClassName('sortable-chosen')[0];
    let r = await browser.storage.local.get({
        tabs:[]
    });
    let current_tabs = r.tabs;
    console.log(current_tabs)
    if (chosen) {
        chosen.parentNode.removeChild(chosen);
        let index = current_tabs.indexOf(chosen.id);
        if (index > -1) {
            current_tabs.splice(index, 1);
        }
    }
    bin.classList.remove('trash-shake');
    //  magic
    void bin.offsetWidth;
    bin.classList.add('trash-shake');
    browser.storage.local.set({
        tabs: current_tabs
    });
});