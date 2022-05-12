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
const {app, BrowserWindow, clipboard, nativeImage, ipcMain, globalShortcut  } = require('electron')
const contextMenu = require('electron-context-menu');
var fs = require('fs');
var language = require("./lang.ko.json")
var currentImageFilename = "";

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
      RegistrySetup(true);
      //app.quit();
      return true;

    case '--squirrel-uninstall':
      RegistrySetup(false);
      //app.quit();
      return true;

    case '--squirrel-firstrun':
    case '--squirrel-updated':
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
      extensions: ['png','jpg','jpeg', 'jfif', 'pjpeg', 'pjp', 'svg', 'webp','gif', 'apng', 'avif'],
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

        click: () => {
          console.log("NextImage");
        }
      },
      {
        label: language.PrevImage,
        click: () => {
          console.log("PrevImage");
        }
      },
      actions.separator(),
      {
        label: language.CopyClipBoard,     
        accelerator: 'CommandOrControl+C',   
        click: () => {
          console.log("CopyClipBoard");
          CopyImageToClipboard();
        }
      },
    ],
    showInspectElement: false,
  });

  // register short cut
  globalShortcut.register("CommandOrControl+C", () => { CopyImageToClipboard() });
}

function CopyImageToClipboard()
{
  clipboard.writeImage(nativeImage.createFromPath(currentImageFilename)); 
}

// ------------------------------------------------------------------------------------------------------------------
// Main Window

function CreateWindow () 
{  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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
          mainWindow.webContents.send("load-image", process.argv[1]);
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

// save image filename
ipcMain.on("set-image-filename", (event, arg) => {
  currentImageFilename = arg;
});