const { ipcRenderer } = require('electron')

language = require("./lang.ko.json")

ipcRenderer.on("load-image", function (event,store) 
    {
        console.log("ipc load-image " + store);
        LoadImage(store);
    }
);

function LoadImage(filename)
{
    const element = document.getElementById("image-view")
    if (element) 
    {
        document.title = "szViewer - " + filename.replace(/^.*[\\\/]/, '');
        element.innerHTML = "<img id='image' style='height:100vh; width:100vw; object-fit:contain' src='" + filename + "'></img>"         
        // disable drag
        element.ondragstart = function() { return false; }; 
    }
}

document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();

    for (const f of event.dataTransfer.files)
    {
        // Using the path attribute to get absolute file path
        console.log('File Path of dragged files: ', f.path)
        
        LoadImage(f.path);
        break;
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.onkeydown = function(e)
{
    console.log("onkeydown - " + e.key);

    switch(e.key)
    {
        case "ArrowRight":
            break;

        case "ArrowLeft":
            break;

        case "ArrowUp":
            break;
        case "ArrowDown":
            break;
    }
}

// 단축키 설정
document.onkeyup = function(e) 
{
    console.log("onkeyup - " + e.key);
    
    switch(e.key)
    {
        case "Enter":
            if(document.fullscreenElement)
                document.exitFullscreen();
            else
                document.body.requestFullscreen();        
            break;

        case " ":
            
            break;
    }
}