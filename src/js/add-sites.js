let fileData = null;
getBase64 = (file) => {
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

handleFileDrop = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    let f = evt.dataTransfer.files[0];
    if (f.size > 1024 * 60) {
        alert('Your image is too large, we suggest you use an image less than 100kb')
    } else {
        getBase64(f)
    }
};

handleDragOver = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
};

handleFileSelect = (evt) => {
    getBase64(evt.target.files[0]);
};

// setup the drop listeners.
let fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', handleFileSelect, false);

let dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileDrop, false);



