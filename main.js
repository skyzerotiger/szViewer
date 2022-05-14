const isDev = require('electron-is-dev');

if (isDev) 
{
  console.log('Running in development');
} 
else 
{
  console.log('Running in production');
  require('update-electron-app')( { notifyUser :false });
}

// Modules to control application life and create native browser window
const {app, BrowserWindow, clipboard, nativeImage, ipcMain  } = require('electron')
const contextMenu = require('electron-context-menu');
var fs = require('fs');
var path = require('path');
var language = require("./lang.ko.json");
var mainWindow = undefined;

var currentImageFileIndex = 0;
var imageFileNameList = undefined;
var currentZipFileName = undefined;
var currentPath = undefined;


var supportExtenstion = ['png','jpg','jpeg', 'jfif', 'pjpeg', 'pjp', 'svg', 'webp','gif', 'apng', 'avif'];

// ------------------------------------------------------------------------------------------------------------------
// Install, Update

var handleStartupEvent = function() 
{
  if (process.platform !== 'win32') 
  {
    return false;
  }
  
  var squirrelCommand = process.argv[1];
  switch (squirrelCommand)
  {
    case '--squirrel-install':    
    case '--squirrel-updated':
      RegistrySetup(true);
      //app.quit();
      return true;

    case '--squirrel-uninstall':
      RegistrySetup(false);
      //app.quit();
      return true;

    case '--squirrel-firstrun':    
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
};

handleStartupEvent();

function RegistrySetup(isInstall)
{
  const {ProgId, ShellOption, Regedit} = require('electron-regedit')
  
  new ProgId({
      appName : "szViewer",
      description: 'szViewer.ImageFiles',
      
      icon: '',
      extensions: supportExtenstion,
      shell: [
          new ShellOption({verb: ShellOption.OPEN}),
      ]
  })
    
  if(isInstall)
    Regedit.installAll().then(() => { app.quit(); });
  else
    Regedit.uninstallAll().then(() => { app.quit(); });
}

// ------------------------------------------------------------------------------------------------------------------
// Context Menu

function CreateContextMenu()
{
  contextMenu({
    menu: (actions, props, browserWindow, dictionarySuggestions) => [
      {
        label: language.NextImage,
        accelerator: 'Left',   
        click: () => { NextImage(); }
      },
      {
        label: language.PrevImage,
        accelerator: 'Right',   
        click: () => { PrevImage(); }
      },
      actions.separator(),
      {
        label: language.FullScreen,     
        accelerator: 'Enter',   
        click: () => { browserWindow.setFullScreen(!browserWindow.isFullScreen()); }
      },
      actions.separator(),
      {
        label: language.CopyClipBoard,     
        accelerator: 'CommandOrControl+C',   
        click: () => { CopyImageToClipboard();}
      },
      actions.separator(),
      {
        label: language.Quit,     
        accelerator: 'Alt+F4',   
        click: () => {
          app.quit();
        }
      },
    ],
    showInspectElement: false,
  });
}

function CopyImageToClipboard()
{
  clipboard.writeImage(nativeImage.createFromPath(imageFileNameList[currentImageFileIndex])); 
}

// ------------------------------------------------------------------------------------------------------------------
// Main Window

function CreateWindow () 
{  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  mainWindow.setMenu(null)

  mainWindow.once('ready-to-show', () => {
    if(process.argv.length>=2)
    { 
      if(fs.existsSync(process.argv[1]))
      {
        // directory check
        var stats = fs.lstatSync(process.argv[1]);
        if (!stats.isDirectory()) {
          LoadImage(process.argv[1]);          
        }        
      }
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  CreateContextMenu();
  CreateWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on("load-image", (event, arg) => {
  console.log("load-image  " + arg);
  LoadImage(arg);
});

ipcMain.on("next-image", (event, arg) => {
  NextImage();
});

ipcMain.on("prev-image", (event, arg) => {
  PrevImage();
});

function LoadImage(filename)
{ 
  // if zip file?
  if(filename.toLowerCase().includes(".zip"))
  { 
    var AdmZip = require("adm-zip");

    // extract all files from zip to temp folder
    let tempPath = app.getPath("temp")
    console.log(tempPath)

    if(!fs.existsSync(tempPath + "/szviewer"))
      fs.mkdirSync(tempPath + "/szviewer");
    if(!fs.existsSync(tempPath + "/szviewer/zip-temp"))
      fs.mkdirSync(tempPath + "/szviewer/zip-temp");

    tempPath = tempPath + "/szviewer/zip-temp";
    
    // delete all exist files in tempPath;
    fs.readdirSync(tempPath).forEach(file => {
      fs.unlinkSync(path.join(tempPath, file));
    });

    // reading archives
    var zip = new AdmZip(filename);
    zip.extractAllTo(tempPath, true);

    currentZipFileName = filename;
    currentPath = tempPath;
  }
  else
  {    
    currentZipFileName=undefined;
    currentPath = path.dirname(filename);
  }

  currentImageFileIndex = 0;
  imageFileNameList=[];

  // make image file list from same path
  fs.readdirSync(currentPath).forEach(element => {
    if(supportExtenstion.includes(path.extname(element).toLowerCase().replace(".","")))
    {
        imageFileNameList.push(element);
    }
  });

  // find fileIndex
  for(var i=0; i<imageFileNameList.length; i++)
  {
    if(imageFileNameList[i]==path.basename(filename))
    {
      currentImageFileIndex = i;
      break;
    }
  }


  ShowImage();  
}

function ShowImage()
{
  mainWindow.webContents.send("show-image", { 
    filename:"[" + (currentImageFileIndex+1) + "/" + imageFileNameList.length + "] " + imageFileNameList[currentImageFileIndex],
    url:path.join(currentPath, imageFileNameList[currentImageFileIndex])
  });
}

function NextImage()
{
  currentImageFileIndex++;
    if(currentImageFileIndex>=imageFileNameList.length)
      currentImageFileIndex=imageFileNameList.length-1;
      
  ShowImage();
}

function PrevImage()
{
  currentImageFileIndex--;
    if(currentImageFileIndex<0)
      currentImageFileIndex=0;

  ShowImage();
}