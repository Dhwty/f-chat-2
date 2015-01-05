
function CommandHelp(syntax, description, rights){
    this.syntax=syntax;
    this.description=description;
    this.rights=rights;//admin, debug, chatop, chanop, owner.
}

FList.Chat.Help = {

    openBBCodeHelp: function(){
        var bbcodedialog= $("<div><h3>BBCode reference</h3>[b]bold[/b] = <b>bold</b><br/>[i]italic[/i] = <i>italic</i><br/>[u]underline[/u] = <u>underline</u><br/>[s]strikethrough[/s] = <s>strikethrough</s><br/>[url=http://www.example.com]url tag[/url] = <a href='http://www.example.com' target='_blank'>url tag</a><br/>[icon]lif[/icon] = <a href='" + domain + "c/lif/' target='_blank'><img src='" + staticdomain + "images/avatar/lif.png' class='ParsedAvatar'/></a><br/>[user]Lif[/user] = <a href='" + domain + "c/lif' target='_blank' class='AvatarLink'>lif</a><br/>[session=Size Queens]ADH-727c0351b0d42f7c45aa[/session] = <a onclick='alert(\"This is a demo of a session link.\");' target='_blank' class='SessionLink'>Size Queens</a><br/>[channel]Frontpage[/channel] = <a onclick='alert(\"This is a demo of a channel link.\");' target='_blank' class='ChannelLink'>Frontpage</a><br/>[sub]sub tag[/sub] = <sub>sub tag</sub><br/>[sup]sup tag[/sup] = <sup>sup tag</sup><br/>[noparse][b]bbcode example[/b][/noparse] = [b]bbcode example[/b]<br/></div>");
        bbcodedialog.dialog({
            autoOpen: true, title: 'BBCode reference', width: '400', height:'400', modal: true,
            buttons: {
                "Close": function(){
                    bbcodedialog.dialog("close");
                }
            }
        });
    },
    
    getPanel: function(){
        return '<div style="padding:10px;"><h2>Help</h2>To ask a question to F-Chat\'s staff, ask your question in the <a class="ChannelLink" onclick="FList.Chat.openChannelChat(\'Helpdesk\', false);$(\'#chatui-tabs\').tabs( \'select\' , 1 );">helpdesk channel</a>. If that doesn\'t work out, you can submit a <a href="../tickets.php" target="_blank">helpdesk ticket</a> on the site.<h3>Other resources</h3><a onclick="FList.Chat.Help.openBBCodeHelp();">BBCode help</a><br/><br/><a href="#" onclick="FList.Chat.Help.openLegendHelp();">Color Legend</a><br/><a href="https://wiki.f-list.net/Frequently_Asked_Questions">Troubleshooting/FAQ</a><br/><a href="https://wiki.f-list.net/Rules">Rules</a><br/></div>';
    },

    openLegendHelp: function(){
        var legenddialog= $("<div><h3>Symbols</h3><span class='AvatarLink OpLink'><span class='rank'></span>Lif</span> = chatop<br/><span class='AvatarLink ChanOpLink'><span class='rank'></span>Lif</span> = chanop<br/><span class='AvatarLink ChanOwnerLink'><span class='rank'></span>Lif</span> = channel owner<br/> <h3>Gender colors</h3><span class='AvatarLink GenderNone'>No Gender</span><br/><span class='AvatarLink GenderMale'>Male</span><br/><span class='AvatarLink GenderFemale'>Female</span><br/><span class='AvatarLink GenderHerm'>Herm</span><br/><span class='AvatarLink GenderTransgender'>Transgender</span><br/><span class='AvatarLink GenderShemale'>Shemale</span><br/><span class='AvatarLink GenderMale-Herm'>Male-Herm</span><br/><span class='AvatarLink GenderCunt-boy'>Cunt-boy</span></div>");
        legenddialog.dialog({
            autoOpen: true, title: 'Colors and symbols', width: '250', height:'350', modal: true,
            buttons: {
                "Close": function(){
                    legenddialog.dialog("close");
                }
            }
        });
    }
};

FList.Chat.helpData = [];
FList.Chat.helpData["setdescription"]=new CommandHelp(["channel description"],"Sets the description in a channel.",["chatop","chanop"]);
FList.Chat.helpData["me"]=new CommandHelp(["chatmessage"],"Use this command to make your message appear in-character.",["all"]);
FList.Chat.helpData["clear"]=new CommandHelp([],"Clears the active tab's history.",["all"]);
FList.Chat.helpData["channels"]=new CommandHelp([],"Prints a list of all channels.",["all"]);
FList.Chat.helpData["join"]=new CommandHelp(["channel"],"Joins a channel.",["all"]);
FList.Chat.helpData["getdescription"]=new CommandHelp([],"Get the raw, unparsed channel description of the active channel.",["chanop","chatop"]);
FList.Chat.helpData["users"]=new CommandHelp([],"Displays a list of all users connected to F-Chat.",["all"]);
FList.Chat.helpData["close"]=new CommandHelp([],"Closes the active tab.",["all"]);
FList.Chat.helpData["who"]=new CommandHelp([],"Get a list of who is in the active channel.",["all"]);
FList.Chat.helpData["priv"]=new CommandHelp(["character"],"Opens a private conversation with a user.",["all"]);
FList.Chat.helpData["ignore"]=new CommandHelp(["character"],"Adds someone to your ignore-list.",["all"]);
FList.Chat.helpData["unignore"]=new CommandHelp(["character"],"Removes someone from your ignore-list.",["all"]);
FList.Chat.helpData["ignorelist"]=new CommandHelp([],"Displays your ignore-list.",["all"]);
FList.Chat.helpData["code"]=new CommandHelp([],"Displays the linking code for a private channel.",["all"]);
FList.Chat.helpData["logout"]=new CommandHelp([],"Logs out of the chat.",["all"]);
FList.Chat.helpData["profile "]=new CommandHelp(["character"],"Displays basic profile info about a character.",["all"]);
FList.Chat.helpData["soundon"]=new CommandHelp([],"Turns HTML5 audio effects on.",["all"]);
FList.Chat.helpData["soundoff"]=new CommandHelp([],"Turns HTML5 audio effects off.",["all"]);
FList.Chat.helpData["roll"]=new CommandHelp(["1d10"],"Roll a dice. Generate a random number between two given numbers.",["all"]);
FList.Chat.helpData["kinks"]=new CommandHelp(["character"],"Return kink data about a character.",["all"]);
FList.Chat.helpData["status"]=new CommandHelp(["Online|Looking|Busy|DND","message"],"Change your status light, and set your status message.",["all"]);
FList.Chat.helpData["makeroom"]=new CommandHelp(["name"],"Create a new private channel.",["all"]);
FList.Chat.helpData["invite"]=new CommandHelp(["character"],"Invite a user to your last created private channel.",["chanop"]);
FList.Chat.helpData["openroom"]=new CommandHelp([],"Opens a private room for public access.",["owner"]);
FList.Chat.helpData["closeroom"]=new CommandHelp([],"Close the active room off for public access, making it invitation-only.",["owner"]);
FList.Chat.helpData["setmode"]=new CommandHelp(["ads|chat|both"],"Set the message mode for a channel to only show ads, chats, or both.",["chanop","owner"]);
FList.Chat.helpData["forceop"]=new CommandHelp([],"What is this, then?",["debug"]);
FList.Chat.helpData["bottle"]=new CommandHelp([],"Spins the bottle and lands it on a random person in the active channel.",["all"]);
FList.Chat.helpData["reload"]=new CommandHelp([],"I dunno what this does.",["debug"]);
FList.Chat.helpData["slots"]=new CommandHelp([],"Displays the number of available login slots.",["debug"]);
FList.Chat.helpData["debugop"]=new CommandHelp([],"Turn yourself into an op for debugging purposes. (Won't do anything on the server, just the visual effects.)",["debug"]);
FList.Chat.helpData["debugoff"]=new CommandHelp([],"Disable fake-op mode. :U",["debug"]);
FList.Chat.helpData["prooms"]=new CommandHelp([],"Display a list of all private channels.",["all"]);
FList.Chat.helpData["reward"]=new CommandHelp(["character"],"Sets someone's status light to a cookie. Playful silly little thing.",["admin","chatop"]);
FList.Chat.helpData["broadcast"]=new CommandHelp(["message"],"Broadcasts a message to all users, in all tabs.",["admin"]);
FList.Chat.helpData["op"]=new CommandHelp(["character"],"Promotes a character to chatop.",["admin"]);
FList.Chat.helpData["deop"]=new CommandHelp(["character"],"Removes chatop status from a character.",["admin"]);
FList.Chat.helpData["gkick"]=new CommandHelp(["character"],"Kick someone from F-Chat.",["chatop"]);
FList.Chat.helpData["timeout"]=new CommandHelp(["character","name","reason"],"Times someone out from the chat.",["chatop"]);
FList.Chat.helpData["ctimeout"]=new CommandHelp(["channel","character","minutes"],"Times someone out from a specific channel.",["chanop","chatop"]);
FList.Chat.helpData["ipban"]=new CommandHelp(["character"],"Kicks someone from F-Chat and permanently bans their IP address from entering again.",["chatop"]);
FList.Chat.helpData["accountban"]=new CommandHelp(["character"],"Kicks someone from F-Chat and permanently bans their account from entering again.",["chatop"]);
FList.Chat.helpData["gunban"]=new CommandHelp(["character"],"Removes an IP/accountban from a given character.",["chatop"]);
FList.Chat.helpData["createchannel"]=new CommandHelp(["channelname"],"Create a new public channel.",["admin"]);
FList.Chat.helpData["killchannel"]=new CommandHelp(["channel"],"Destructinates a channel. Does not properly destructinate private channels.",["admin"]);
FList.Chat.helpData["altwatch"]=new CommandHelp(["character"],"Some kind of chatop thing that watches alts?",["chatop"]);
FList.Chat.helpData["warn"]=new CommandHelp(["chatmessage"],"Displays a message in a scary red color for extra attentions.",["chatop","chanop"]);
FList.Chat.helpData["kick"]=new CommandHelp(["character"],"Kick someone from a channel.",["chanop","chatop"]);
FList.Chat.helpData["ban"]=new CommandHelp(["character"],"Bans a character from a private channel.",["chanop","chatop"]);
FList.Chat.helpData["unban"]=new CommandHelp(["character"],"Unbans a character from a private channel.",["chanop","chatop"]);
FList.Chat.helpData["banlist"]=new CommandHelp([],"Display the list of characters banned in the active channel.",["chanop","chatop"]);
FList.Chat.helpData["coplist"]=new CommandHelp([],"Display list of chan-ops of the active channel.",["chanop"]);
FList.Chat.helpData["cop"]=new CommandHelp(["character"],"Promote someone to chan-op.",["chanop","owner"]);
FList.Chat.helpData["cdeop"]=new CommandHelp(["character"],"Remove chan-op status from someone.",["chanop","owner"]);
FList.Chat.helpData["help"]=new CommandHelp(["command"],"Get help about commands, or get a list of all commands.",["all"]);
FList.Chat.helpData["listops"]=new CommandHelp([],"List all global ops.",["chatop","admin"]);
