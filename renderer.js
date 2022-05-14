const { ipcRenderer } = require('electron')

var language = require("./lang.ko.json")

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
document.onkeyup = function(e) 
{
    console.log("onkeyup - " + e.key);
    
    switch(e.key)
    {
        case "ArrowRight":
            ipcRenderer.send("next-image");   
            break;

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
            
            break;
    }
}