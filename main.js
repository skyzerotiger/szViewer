const isDev = require('electron-is-dev');

if (isDev) {
  console.log('Running in development');
} else {
  console.log('Running in production');
  require('update-electron-app')( { notifyUser :false });
}

// Modules to control application life and create native browser window
const {app, BrowserWindow } = require('electron')
var fs = require('fs');

var handleStartupEvent = function() {
  if (process.platform !== 'win32') {
    return false;
  }
  
  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':    
      RegistrySetup(true);
      //app.quit();
      return true;

    case '--squirrel-uninstall':
      RegistrySetup(false);
      //app.quit();
      return true;

    case '--squirrel-firstrun':
    case '--squirrel-update':
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

function createWindow () {  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  if(!isDev)  
    mainWindow.setMenu(null)

  mainWindow.once('ready-to-show', () => {
    if(process.argv.length>=2)
    {    
      //console.log("load-image main.js" + process.argv.length + ", " + process.argv[0] + ", " +process.argv[1]);
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
  createWindow()

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
