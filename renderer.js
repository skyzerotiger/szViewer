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
        //ipcRenderer.send("log", "config - " + JSON.stringify(CONFIG));   
        console.log("config - " + JSON.stringify(CONFIG));
    }
);

function ShowImage(imageData)
{
    //console.log("ShowImage - " + image.dataUrl + ", " + CONFIG.viewMode);

    const element = document.getElementById("image-view")
    
    if (element) 
    {
        var img = new Image();
        img.src = imageData.url;
        img.onload = function()
        {
            switch(CONFIG.viewMode)
            {
                case 0:// 스케일 유지가 아니면 값을 초기화 한다
                    if(imageData.transfromReset)
                    {
                        pointX = pointY = 0;
                        scale = 1.0;
                        setTransform();
                    }
                    
                    break;

                case 1: // 원본 사이즈면 화면 중앙으로 이미지 이동
                    if(imageData.transfromReset)
                    {   
                        pointX = (window.innerWidth-this.width) / 2; 
                        pointY = (window.innerHeight-this.height) / 2;

                        scale = 1;
                        setTransform();
                    }
                    
                    break;
            }
            
            document.title = "szViewer - " + imageData.filename;        

            let style = "height:100vh; width:100vw;";
            if(CONFIG.viewMode == 1)
                style = "height:"+this.height+"px; width:"+this.width+"px;";

            if(CONFIG.filterMode == 1)
                style += "image-rendering: pixelated;";

            element.innerHTML = "<img id='image' style='" + style + " object-fit:contain; ' src='" + imageData.url + "'></img>";
            if(CONFIG.showImageInfo)
            {
                let infoElement = document.getElementById("image-info")
                infoElement.innerHTML = "<div class='info'>Image Size : " + this.width + " x " + this.height + "<br>" + "</div>";
            }
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

let scale = 1,
    panning = false,
    pointX = 0,
    pointY = 0,
    start = { x: 0, y: 0 },
    zoom = document.getElementById("image-view");

    
function setTransform() 
{    
    zoom.style.transform = "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";
}

document.onmousedown = function (e) 
{
    if(e.buttons == 2)
        return;

    e.preventDefault();
    start = { x: e.clientX - pointX, y: e.clientY - pointY };
    panning = true;
}

document.onmouseup = function (e) 
{
    if(e.buttons == 2)
        return;

    panning = false;
}

document.onmousemove = function (e) 
{
    e.preventDefault();
    if (!panning) 
    {
        return;
    }

    pointX = (e.clientX - start.x);
    pointY = (e.clientY - start.y);
    setTransform();
}

document.onwheel = function (e) 
{
    e.preventDefault();
    var xs = (e.clientX - pointX) / scale,
        ys = (e.clientY - pointY) / scale,
        delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);

    (delta > 0) ? (scale *= 1.2) : (scale /= 1.2);
    pointX = e.clientX - xs * scale;
    pointY = e.clientY - ys * scale;

    setTransform();
}