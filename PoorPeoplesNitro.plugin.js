/**
 * @name TestPlugin
 * @authorLink https://github.com/Cosmiiko
 * @source https://github.com/Cosmiiko/BD-PoorPeoplesNitro
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();
@else@*/

module.exports = (() => {
    const config = {
        "info": {
            "name":"PoorPeople'sNitro",
            "authors": [
                {
                    "name":"Cosmiiko#5700",
                    "discord_id":"201040955858616320",
                    "github_username":"Cosmiiko"
                }
            ],
            "version":"1.0.0",
            "description":
            "A plugin that sends emotes' links when you click on them. Useful if you don't have nitro but still want to use custom emotes. Caveat is that you can't use them in messages, only as stickers. Also their size will differ from actual Discord emotes.",
            "github":"https://github.com/Cosmiiko/BD-PoorPeoplesNitro",
            "github_raw":"https://raw.githubusercontent.com/Cosmiiko/BD-PoorPeoplesNitro/main/PoorPeoplesNitro.plugin.js"
        },
        "changelog":[
            {
                "title": 'Poor Gang',
                "type": 'added',
                "items": ['You too huh?']
            }
        ],
        "main":"index.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {

            const {Logger, DiscordAPI, Settings} = Library;

            return class PoorNitroPlugin extends Plugin {
                constructor() {
                    super();
                    this.defaultSettings = {};
                    this.defaultSettings.onlyDisabled = true;
                    this.defaultSettings.emojiSize = 64;
                    this.defaultSettings.hideAdDelay = 0;
                }

                onStart() {
                    Logger.log("Started");

                    document.body.onclick = (mouseEv) => {
                        let el = mouseEv.target;

                        if (!el.className || (typeof el.className) != "string") return; // No class name
                        if (el.className.indexOf("emojiItem") == -1) return; // Not an emoji
                        if (!el.children[0]) return; // Emoji not yet loaded

                        let disabled = el.className.indexOf("emojiItemDisabled") > -1;

                        if (!disabled && this.settings.onlyDisabled) return;

                        let link = el.children[0].src;
                        
                        DiscordAPI.currentChannel.sendMessage(
                            this.settings.emojiSize > -1 ? link + "&size=" + this.settings.emojiSize : link
                        );

                        if (disabled)
                        {
                            // Hide the discord nitro ad
                            // Do it as an interval in case the computer is very slow (check if popup is there every X time)
                            let hidePromoInterval = setInterval(() => {
                                let promo = document.querySelector("[class*=premiumPromo]");
                                if (promo)
                                {
                                    promo.style.display = "none";
                                    clearInterval(hidePromoInterval);
                                }
                            }, this.settings.hideAdDelay);
                        }
                    };
                }

                onStop() {
                    Logger.log("Stopped");
                }

                getSettingsPanel() {
                    return Settings.SettingPanel.build(
                        this.saveSettings.bind(this),
                        new Settings.SettingGroup("General Settings").append(
                            new Settings.Dropdown(
                                "Emoji Size",
                                "The size to which the emojis will be resized. Discord's default is 48px but that is not possible here.",
                                this.settings.emojiSize,
                                [
                                    {label: "16px", value: 16},
                                    {label: "32px", value: 32},
                                    {label: "64px", value: 64},
                                    {label: "Original", value: -1}
                                ],
                                (e) => {this.settings.emojiSize = e}
                            ),
                            new Settings.Dropdown(
                                "Hide Nitro Ad Delay",
                                "Delay before attempting to hide the Nitro popup when you click on a grayed out emote. Increase this if it doesn't hide at all or if you notice lag when you click on an emote (should only happen on very slow computers).",
                                this.settings.hideAdDelay,
                                [
                                    {label: "Instantaneous", value: 0},
                                    {label: "10 ms", value: 10},
                                    {label: "100 ms", value: 100},
                                    {label: "1000 ms", value: 1000}
                                ],
                                (e) => {this.settings.hideAdDelay = e}
                            ),
                            new Settings.Switch(
                                "Only Disabled Emojis", 
                                "Enable only for disabled emojis (grayed out emojis that you can't normally use because you don't have nitro).", 
                                this.settings.onlyDisabled, 
                                (e) => {this.settings.onlyDisabled = e}
                            )
                        )
                    );
                }
            };

        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/