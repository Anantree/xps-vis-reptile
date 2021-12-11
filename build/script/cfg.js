const fs = require('fs');
const { name } = require('../../package.json');
const config = require('../cfg/build.json');
const updateConfig = require('../../src/cfg/update.json');

/**  config配置  **/
config.publish = [
  {
    provider: updateConfig.provider,
    url: updateConfig.url
  }
];
config.productName = name;
config.appId = `org.${name}`;
config.npmRebuild = true; //是否Rebuild编译
config.asar = true; //是否asar打包

/** win配置 */
config.nsis.displayLanguageSelector = false; //安装包语言提示
config.nsis.menuCategory = false; //是否创建开始菜单目录
config.nsis.shortcutName = name; //快捷方式名称(可中文)
config.nsis.allowToChangeInstallationDirectory = true; //是否允许用户修改安装为位置
config.win.requestedExecutionLevel = ['asInvoker', 'highestAvailable'][0]; //应用权限
config.win.target = [];
// config.win.target.push({ //单文件
//     "target": "portable"
//     // "arch": ["x64"]
// });
config.win.target.push({
  //nsis打包
  target: 'nsis',
  arch: ['ia32', 'x64']
});

//更新配置
updateConfig.dirname = `${name.toLowerCase()}-updater`;
let update =
  'provider: ' +
  updateConfig.provider +
  '\n' +
  'url: ' +
  updateConfig.url +
  '\n' +
  'updaterCacheDirName: ' +
  updateConfig.dirname +
  '';

let nsh = '';
if (config.nsis.allowToChangeInstallationDirectory) {
  nsh =
    '!macro customHeader\n' +
    '\n' +
    '!macroend\n' +
    '\n' +
    '!macro preInit\n' +
    '\n' +
    '!macroend\n' +
    '\n' +
    '!macro customInit\n' +
    '    ReadRegStr $0 HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall" "UninstallString"\n' +
    '    ${If} $0 != ""\n' +
    '       # ExecWait $0 $1\n' +
    '    ${EndIf}\n' +
    '!macroend\n' +
    '\n' +
    '!macro customInstall\n' +
    '\n' +
    '!macroend\n' +
    '\n' +
    '!macro customInstallMode\n' +
    '   # set $isForceMachineInstall or $isForceCurrentInstall\n' +
    '   # to enforce one or the other modes.\n' +
    '   #set $isForceMachineInstall\n' +
    '!macroend';
} else {
  nsh =
    '; Script generated by the HM NIS Edit Script Wizard.\n' +
    '\n' +
    '; HM NIS Edit Wizard helper defines custom install default dir\n' +
    '!macro preInit\n' +
    '    SetRegView 64\n' +
    '    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\\' +
    name +
    '"\n' +
    '    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\\' +
    name +
    '"\n' +
    '    SetRegView 32\n' +
    '    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\\' +
    name +
    '"\n' +
    '    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\\' +
    name +
    '"\n' +
    '!macroend';
}

/** linux配置 **/
config.linux.target = ['AppImage', 'snap', 'deb', 'rpm', 'pacman'][0];
config.linux.executableName = name;

fs.writeFileSync('./build/cfg/app-update.yml', update);
fs.writeFileSync('./build/cfg/build.json', JSON.stringify(config, null, 2));
fs.writeFileSync('./build/cfg/installer.nsh', nsh);
fs.writeFileSync('./src/cfg/update.json', JSON.stringify(updateConfig, null, 2));