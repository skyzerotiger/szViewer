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

function ShowImage(imageData)
{
    //console.log("ShowImage - " + image.dataUrl);

    const element = document.getElementById("image-view")
    
    if (element) 
    {
        var img = new Image();
        img.src = imageData.url;
        img.onload = function()
        {
            document.title = "szViewer - " + imageData.filename;        
            element.innerHTML = "<img id='image' style='height:100vh; width:100vw; object-fit:contain' src='" + imageData.url + "'></img>";
            if(CONFIG.showImageInfo)
            {
                element.innerHTML += "<div class='info'>Image Size : " + this.width + " x " + this.height + "<br>" + "</div>";
            }
        
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
