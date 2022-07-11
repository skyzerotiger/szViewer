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
const localShortcut = require('electron-localshortcut');
var fs = require('fs');
var path = require('path');
const { config } = require('process');
const storage = require('electron-json-storage');
let CONFIG = {};
let language = {};
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
  
  var progId = new ProgId({
    appName : "szViewer",
    description: 'szViewer Image Files',     
    progExt : 'imagefiles', 
    icon: '', 
    extensions: supportExtenstion,
    shell: [
        new ShellOption({verb: ShellOption.OPEN}),
    ]
  });

  /*new ProgId({
    appName : "szViewer",
    description: 'szViewer Zip Files',     
    progExt : 'zipfiles', 
    icon: '',
    extensions: ['zip'],
    shell: [
        new ShellOption({verb: 'Open Zip With szViewer' }),
    ]
  });*/

  if(isInstall)
    Regedit.installAll().finally(() => { app.quit(); });
  else
    Regedit.uninstallAll().finally(() => { app.quit(); });
}

// ------------------------------------------------------------------------------------------------------------------
// Context Menu

function CreateContextMenu()
{
  contextMenu({
    menu: (actions, props, browserWindow, dictionarySuggestions) => [
      {
        label: language.NextImage,
        accelerator: 'Right',   
        click: () => { NextImage(); }
      },
      {
        label: language.PrevImage,
        accelerator: 'Left',   
        click: () => { PrevImage(); }
      },
      actions.separator(),

      {
        label: language.ViewMode,
        submenu: [
          {
            label: language.ViewMode_Fit,
            accelerator: '1',   
            click: () => {  }
          },
          {
            label: language.ViewMode_OriginalSize,
            accelerator: '2',   
            click: () => {  }
          },
          {
            label: language.ViewMode_Scale,
            accelerator: '3',   
            click: () => { }
          },
        ]
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
        click: () => { CopyImageToClipboard(); }
      },
      {
        label: CONFIG.showImageInfo ? language.ImageInfoHide : language.ImageInfoShow, 
        accelerator: 'CommandOrControl+I',   
        click: () =>  { ToggleImageInfo(); }
      },

      actions.separator(),
      {
        label: language.Quit,     
        accelerator: 'Alt+F4',   
        click: () => { app.quit(); }
      },
    ],
    showInspectElement: false,
  });

  localShortcut.register(mainWindow, ["Left", "Up", "PageUp",], () => { PrevImage(); });
  localShortcut.register(mainWindow, ["Right", "Down","PageDown", "Space"] , () => { NextImage(); });
  localShortcut.register(mainWindow, "Enter" , () => { mainWindow.setFullScreen(!mainWindow.isFullScreen()); });
  localShortcut.register(mainWindow, "CommandOrControl+C" , () => { CopyImageToClipboard(); });
  localShortcut.register(mainWindow, "CommandOrControl+I" , () => { ToggleImageInfo(); });
}

function ToggleImageInfo()
{
  CONFIG.showImageInfo = !CONFIG.showImageInfo;
  // 콘피그 값을 전달한다.
  mainWindow.webContents.send('config', CONFIG);  
  ShowImage();
  SaveConfig();
}

function CopyImageToClipboard()
{
  clipboard.writeImage(nativeImage.createFromPath(path.join(currentPath, imageFileNameList[currentImageFileIndex]))); 
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
      // 콘피그 값을 전달한다.
      mainWindow.webContents.send('config', CONFIG);

      // 인자로 전달되는 파일들.
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
  //mainWindow.webContents.openDevTools()
}

function LoadConfig()
{
    // 콘피그 값 얻어오기  
  CONFIG = storage.getSync("config");
  console.log("CONFIG: " + JSON.stringify(CONFIG));

  // 디폴트값 지정
  if(CONFIG.viewMode == undefined)
    CONFIG.scaleMode = 0; // 0: 화면에 맞추기, 1: 원본보기, 2: 스케일 모드

  if(CONFIG.scaleValue == undefined)
    CONFIG.scaleValue = 1.0; // 스케일 모드에서의 스케일 값. 다음 이미지로 넘어가도 유지된다.

  if(CONFIG.showImageInfo == undefined)
    CONFIG.showImageInfo = false; // 이미지 정보 보기

  if(CONFIG.language== undefined)
  {
    CONFIG.language = app.getLocale();
  }

  switch(CONFIG.language)
  {
    case "ko": language = require('./lang.ko.json'); break;
    default: language = require('./lang.en.json'); break;
  }

  console.log("CONFIG: " + JSON.stringify(CONFIG));  

  SaveConfig();
}

function SaveConfig()
{
  // 저장
  storage.set("config", CONFIG, function(error) {});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {  
  LoadConfig();
  CreateWindow();
  CreateContextMenu();  

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

ipcMain.on('log', (event, arg) => {
  console.log("renderer - " + arg);
});

function LoadImage(filename)
{ 
  currentImageFileIndex = 0;
  imageFileNameList=[];

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
    fs.rmSync(tempPath, {recursive: true});

    // reading archives
    var zip = new AdmZip(filename);
    zip.extractAllTo(tempPath, true);

    zip.getEntries().forEach(function(zipEntry) {
      imageFileNameList.push(zipEntry.entryName);     
      console.log(zipEntry.entryName);
    });

    currentZipFileName = filename;
    currentPath = tempPath;
    currentImageFileIndex = 0;
  }
  else
  {    
    currentZipFileName=undefined;
    currentPath = path.dirname(filename);

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
  }

  ShowImage();  
}

function ShowImage()
{
  let url = path.join(currentPath, imageFileNameList[currentImageFileIndex]);
  mainWindow.webContents.send("show-image", { 
    filename:"[" + (currentImageFileIndex+1) + "/" + imageFileNameList.length + "] " + imageFileNameList[currentImageFileIndex],
    url:url
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



