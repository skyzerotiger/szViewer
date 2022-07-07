const { ipcRenderer } = require('electron')

let language = require("./lang.ko.json")
let CONFIG = {};

ipcRenderer.on("show-image", function (event,store) 
    {
        //console.log("ipc show-image " + store);
        ShowImage(store);
    }
);

ipcRenderer.on("copy-image", function (event,store) 
    {
        //console.log("ipc copy-image " );
        CopyImage();
    }
);

ipcRenderer.on("config", function (event,store) 
    {        
        CONFIG = store;      
        ipcRenderer.send("log", "config - " + JSON.stringify(CONFIG));   
    }
);

function ShowImage(imaegData)
{
    //console.log("ShowImage - " + image.dataUrl);

    const element = document.getElementById("image-view")
    
    if (element) 
    {
        var img = new Image();
        img.src = imaegData.url;
        img.onload = function()
        {
            document.title = "szViewer - " + imaegData.filename;        
            element.innerHTML = "<img id='image' style='height:100vh; width:100vw; object-fit:contain' src='" + imaegData.url + "'></img>"                 
        
            element.ondragstart = function() { return false; };         
        }
    }
}

document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();

    for (const f of event.dataTransfer.files)
    {
        // Using the path attribute to get absolute file path
        console.log('File Path of dragged files: ', f.path)
        
        ipcRenderer.send("load-image", f.path);        
        break;
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

// 단축키 설정
document.onkeydown = function(e) 
{
    console.log("onkeydown - " + e.key);
    
    switch(e.key)
    {
        case "PageDown":
        case "ArrowDown":
        case "ArrowRight":
            ipcRenderer.send("next-image");   
            break;

        case "PageUp":
        case "ArrowUp":
        case "ArrowLeft":
            ipcRenderer.send("prev-image");   
            break;

        case "Enter":
            if(document.fullscreenElement)
                document.exitFullscreen();
            else
                document.body.requestFullscreen();        
            break;

        case " ":
            ipcRenderer.send("next-image");  
            break;
    }
}