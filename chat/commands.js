//todo: FLN needs to remove from all channels. and refresh the active channels' userlist.

FList.Chat.parseCommand = function (line)
{
    line = line.replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    if (!jQuery.trim(line))
    {
        return;
    }

    if (FList.Chat.debug) {
        FList.Chat.printMessage({msg: line,
                                to: FList.Chat.TabBar.getTabFromId('console', 'console'),
                                from: 'Server', type: 'system'});
    }

    var type = line.substr(0, 3);
    var params = line.length > 4 ? JSON.parse(line.substr(4)) : {};
    if (typeof (FList.Chat.commands[type]) == "function")
    {
        FList.Chat.commands[type](params);
    }
    else
    {
        FList.Chat.printMessage({msg: 'Unhandled command: ' + line,
                                to: this.TabBar.getTabFromId('console', 'console'),
                                from: 'Server', type: 'error'});
    }
};

FList.Chat.commands['STA'] = function (params) {
    var user = params.character;
    var sta = FList.Chat.users.sanitizeStatus(params.status);
    var data = FList.Chat.users.getData(user);
    var alert=true;
    if(data.status=="idle" || sta=="Idle") alert=false;
    params.statusmsg = params.statusmsg.replace(/\[icon\].*\[\/icon\]/g, "");
    data.status = sta;
    data.statusmsg = params.statusmsg;
    FList.Chat.users.setData(user, data);
    if (params.character === FList.Chat.identity) {
        FList.Chat.Status.set(sta, FList.Chat.desanitize(params.statusmsg));
    }
    var printtab=FList.Chat.TabBar.getTabFromId("user", params.character);
    var active=params.character.toLowerCase()==FList.Chat.TabBar.activeTab.id && FList.Chat.TabBar.activeTab.type=="user";
    var message="[user]" + params.character + "[/user] changed status to " + sta + (params.statusmsg!=="" ? ", " + params.statusmsg : "");
    if (!printtab) {//there is no tab open with this guy.
        if(FList.Chat.users.isTracked(params.character) && FList.Chat.Settings.current.friendNotifications && alert){//but we want notifications.
		if(FList.Chat.Settings.current.consoleRTB === false){
            FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});//print stuff in the active tab.
		}
		  FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
        }
    }  else {//there is a tab open.
        if(active){//are we looking at it?
            if(alert){//FList.Chat.users.isTracked(params.character) && FList.Chat.Settings.current.friendNotifications &&
			if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});//print stuff in the active tab.
			}
			 FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            }
            FList.Chat.InfoBar.update();
        } else {
            if (FList.Chat.users.isTracked(params.character) && FList.Chat.Settings.current.friendNotifications && alert) {
                if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});//also print it in the active tab.
			 }
			 FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            }

            if (!printtab.closed && alert === true) {
                if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message,to: FList.Chat.TabBar.getTabFromId(printtab.type, printtab.id),from: 'System', type: 'system'});//print stuff in the printtab
			 }
			FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            }

        }
        FList.Chat.TabBar.updateTooltip(printtab);
    }

    if(FList.Chat.TabBar.activeTab.type === "channel"){
        FList.Chat.UserBar.updateUser(data.name);
    }
};

FList.Chat.commands['LIS'] = function (params)
{
    var users = params.characters;
    for (var i in users)
    {
        FList.Chat.users.add(users[i][0]);
        var data = {
            gender: users[i][1],
            status: users[i][2],
            statusmsg: users[i][3]
        };
        FList.Chat.users.setData(users[i][0], data);
    }
};
FList.Chat.commands['FLN'] = function (params)
{
    var local = FList.Chat,
        key,
        chan;

    if (local.Settings.current.joinLeaveAlerts) {
        for (key in local.channels.list) {
            chan = local.channels.list[key];
            if (chan.userlist.indexOf(params.character) !== -1) {
                local.printMessage({
                    from: 'System',
                    to: FList.Chat.TabBar.getTabFromId('channel', chan.name),
                    msg: '<a class="AvatarLink">' + params.character +
                        '</a> left ' + chan.title +
                        '. <i>[Disconnected]</i>',
                    type: 'system'
                });
            }
        }
    }
    FList.Chat.users.remove(params.character);
    FList.Chat.users.count-=1;
    if(FList.Chat.TabBar.activeTab.type=="console"){
        $("#info-bar-actions").html(FList.Chat.users.count + " users connected.");
    }
    if(FList.Chat.TabBar.activeTab.type === "channel"){
        FList.Chat.UserBar.removeUser(params.character);
    }
    var printtab=FList.Chat.TabBar.getTabFromId("user", params.character);
    var active=params.character.toLowerCase()==FList.Chat.TabBar.activeTab.id && FList.Chat.TabBar.activeTab.type=="user";
    var message="[user]" + params.character + "[/user] is offline.";
    if(!printtab){//there is no tab open with this guy.
        if((FList.Chat.users.isTracked(params.character) && FList.Chat.Settings.current.friendNotifications)){//but we want notifications.
            if(FList.Chat.Settings.current.consoleRTB === false){
			  FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});//print stuff in the active tab.
		  }
		  FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
        }
    }  else {//there is a tab open.
        printtab.tab.children(".tpn").removeClass("tpn-paused").hide();
        if(active){//are we looking at it?
            //if(FList.Chat.users.isTracked(params.character) && FList.Chat.Settings.current.friendNotifications){
                if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});//print stuff in the active tab.
			 }
			 FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            //}
            FList.Chat.InfoBar.update();
        } else {
            if(FList.Chat.users.isTracked(params.character) && FList.Chat.Settings.current.friendNotifications){
                if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message, type: 'System', from: 'system'});//also print it in the active tab.
			 }
			 FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            }
            if(FList.Chat.Settings.current.consoleRTB === false){
			  if(!printtab.closed) FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId(printtab.type, printtab.id), from: 'System', type: 'system'});//print stuff in the printtab
		  }
		FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
        }
        FList.Chat.TabBar.updateTooltip(printtab);
    }
};
FList.Chat.commands['CDS'] = function (params)
{
    FList.Chat.channels.getData(params.channel).description = params.description;
    if(FList.Chat.TabBar.activeTab.type=="channel" && FList.Chat.TabBar.activeTab.id==params.channel){
        FList.Chat.InfoBar.update();
    }
    FList.Chat.TabBar.updateTooltip(FList.Chat.TabBar.getTabFromId("channel", params.channel));
};
FList.Chat.commands['CIU'] = function(params) {
    var message = params.sender + " has invited you to join [session=" + params.title + "]" + params.name + "[/session].";
    if(FList.Chat.Settings.current.consoleRTB === false){
	    FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});
    }
    FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
};
FList.Chat.commands['VAR'] = function (params)
{
    FList.Chat.serverVars[params.variable] = params.value;
};
FList.Chat.commands['HLO'] = function (params)
{
FList.Chat.printMessage({msg: params.message + '\n\nClick the \'channels\' button up top to choose a channel,' +
                        ' or try [channel]Sex Driven LFRP[/channel] or [channel]Story Driven LFRP[/channel]' +
                        ' to advertise for RP partners, [channel]RP Bar[/channel], [channel]RP Dark City[/channel]' +
                        ' or [channel]RP Nudist Camp[/channel] for general RP, or [channel]Frontpage[/channel]' +
                        ' for general OOC chatter.\n\nFor more help, type /help for command info, or join the [channel]Helpdesk[/channel]' +
                        ' channel.\n\nRemember to follow the [url=https://wiki.f-list.net/index.php/Rules]site rules[/url]!',
                        to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'});
};
FList.Chat.commands['COL'] = function (params)
{
    FList.Chat.channels.getData(params.channel).oplist=params.oplist.map(function (op) {
        return op.toLowerCase();
    });
FList.Chat.channels.getData(params.channel).owner=params.oplist[0];
};
FList.Chat.commands['ORS'] = function (params)
{
    var channels = params.channels;
    var namestring = "";
    if(FList.Chat.getORS){
        FList.Chat.getORS=false;
        $.each(channels, function (i, channel){
            namestring=namestring+"[session=" + channel.title + "]" + channel.name + "[/session], ";
        });
        FList.Chat.printMessage({msg: namestring.substring(0,namestring.length-2),
                                from: 'System', type: 'system'});
    } else {
        FList.Chat.privateChannels.splice(0, FList.Chat.privateChannels.length);
        $.each(channels, function (i, channel)
        {
            FList.Chat.privateChannels.push(
            {
                id: channel.name,
                title: channel.title,
                users: channel.characters
            });
        });
        FList.Chat.rebuildChannelsTab("private","label","reverse");
    }
};

/**
 * FKS
 * Returned search results
 *
 * @params {Object} [data]
 *   @params {Array} [characters]
 *   @params {Array} [kinks] (Enumerated)
 */
FList.Chat.commands['FKS'] = function(data) {
    var reshtml="";
    $(".chatui-tab-search .results").html("Processing results.");
    $.each(data.characters,
        function(i, character) {
            if (FList.Chat.users.userdata[character.toLowerCase()].status === "Looking") {
                data.characters.splice(i, 1);
                data.characters.unshift(character);
            }
        });
    $.each(data.characters,
        function(i, character) {
            reshtml += FList.Chat.users.getToggleLink(character);
    });
    $(".chatui-tab-search .results").html(reshtml);
    $("#search-panel-go").val("Search").attr("disabled",false);
};



FList.Chat.commands['CHA'] = function (params)
{
    var channels = params.channels;
    var namestring = "";
    if(FList.Chat.getCHA){
        FList.Chat.getCHA=false;
        $.each(channels, function (i, channel){
            namestring=namestring+"[channel]" + channel.name + "[/channel], ";
        });
        FList.Chat.printMessage({msg: namestring.substring(0,namestring.length-2),
                                from: 'System', type: 'system'});
    }else {
        FList.Chat.publicChannels.splice(0, FList.Chat.publicChannels.length);
        $.each(channels, function (i, channel)
        {
            FList.Chat.publicChannels.push(
            {
                id: channel.name,
                title: channel.name,
                users: channel.characters,
            });
        });
        FList.Chat.rebuildChannelsTab("public","label","reverse");
    }
};
FList.Chat.commands['FRL'] = function (params)
{

};
FList.Chat.commands['CON'] = function(params) {
    FList.Chat.users.count=parseInt(params.count);
    if(FList.Chat.TabBar.activeTab.type=="console"){
        $("#info-bar-actions").html(FList.Chat.users.count + " users connected.");
    }
    setTimeout(function(){
        FList.Chat.UserBar.renderTheWholeFuckingThing(false);
    },5000);
};
FList.Chat.commands['ADL'] = function (params)
{
    FList.Chat.opList=params.ops.map(function (op) {
        return op.toLowerCase();
    });
};
FList.Chat.commands['AOP'] = function (params)
{
    FList.Chat.opList.push(params.character.toLowerCase());
    if(FList.Chat.TabBar.activeTab.type=="user" && FList.Chat.TabBar.activeTab.id==params.character.toLowerCase()){
        FList.Chat.InfoBar.update();
    }
};
FList.Chat.commands['DOP'] = function (params)
{
    FList.Chat.opList = jQuery.grep(FList.Chat.opList, function(value) { return value != params.character.toLowerCase();});
    if(FList.Chat.TabBar.activeTab.type=="user" && FList.Chat.TabBar.activeTab.id==params.character.toLowerCase()){
        FList.Chat.InfoBar.update();
    }
};
FList.Chat.commands['ERR'] = function (params)
{
    switch(params.number){
    case 3://before signin
        FList.Common_displayError("Error code " + params.number + ", " + params.message);
    break;
    case 62://before signin
        FList.Common_displayError("Error code " + params.number + ", " + params.message);
    break;
    case 72://too many search results.
        $(".chatui-tab-search .results").html("<div class='DisplayedMessage'>" + params.message + "</div>");
        $("#search-panel-go").val("Search").attr("disabled",false);
    break;
    case 50://wait a moment between searches
        $(".chatui-tab-search .results").html("<div class='DisplayedMessage'>" + params.message + "</div>");
        $("#search-panel-go").val("Search").attr("disabled",false);
    break;
    case 18://no search results.
        $(".chatui-tab-search .results").html("<div class='DisplayedMessage'>" + params.message + "</div>");
        $("#search-panel-go").val("Search").attr("disabled",false);
    break;
    case 61://too many search results.
        $(".chatui-tab-search .results").html("<div class='DisplayedMessage'>" + params.message + "</div>");
        $("#search-panel-go").val("Search").attr("disabled",false);
    break;
    default:
        FList.Chat.printMessage({msg: 'Error code ' + params.number + ', ' + params.message,
                                from: 'System', type: 'error', log: false});
    }
};
FList.Chat.commands['ICH'] = function (params)
{
    var data = FList.Chat.channels.getData(params.channel);
    data.userlist = [];
    $.each(params.users, function (i, user)
    {
        FList.Chat.channels.addUser(params.channel, user.identity);
    });
    if (typeof (params.mode) !== "undefined") {
        data.mode = params.mode;
        data.userMode = params.mode;
    }
};
FList.Chat.commands['LCH'] = function (params)
{
    FList.Chat.channels.removeUser(params.channel, params.character);

    if (params.character == FList.Chat.identity)
    {
        FList.Chat.TabBar.removeTab("channel", params.channel);
        var data = FList.Chat.channels.getData(params.channel);
        data.userlist = [];
        data.joined = false;
    } else {
        if(FList.Chat.Settings.current.joinLeaveAlerts){
            var title=FList.Chat.channels.getData(params.channel).title;
            FList.Chat.printMessage({msg: '<a class="AvatarLink">' + params.character + '</a> left ' +
                                    title + '. <i>[Left]</i>',
                                    to: FList.Chat.TabBar.getTabFromId('channel', params.channel),
                                    from: 'System', type: 'system'});
        }
        if(FList.Chat.TabBar.activeTab.type=="channel" && FList.Chat.TabBar.activeTab.id==params.channel){
            FList.Chat.UserBar.removeUser(params.character);
        }
    }
};
FList.Chat.commands['JCH'] = function (params)
{
    if (params.character.identity == FList.Chat.identity)
    {
        var data = FList.Chat.channels.getData(params.channel);
        if (!data.created)
        {
            FList.Chat.channels.create(params.channel, params.title);
            data = FList.Chat.channels.getData(params.channel);
            data.joined = true;
            FList.Chat.openChannelChat(params.channel, false); //open tab too.
        }
        data.joined = true;
        data.title = params.title;
        FList.Chat.TabBar.getTabFromId("channel", params.channel).tab.attr("title", params.title);
    } else {
        if(FList.Chat.Settings.current.joinLeaveAlerts){
            var title=FList.Chat.channels.getData(params.channel).title;
            FList.Chat.printMessage({msg: '<a class="AvatarLink">' + params.character.identity +
                                    '</a> joined ' + title + '.',
                                    to: FList.Chat.TabBar.getTabFromId('channel', params.channel),
                                    from: 'System', type: 'system'});
        }
        if(FList.Chat.TabBar.activeTab.type=="channel" && FList.Chat.TabBar.activeTab.id==params.channel){
            FList.Chat.UserBar.insertSorted(params.character.identity);
        }
    }
    FList.Chat.channels.addUser(params.channel, params.character.identity);
};
FList.Chat.commands['CKU'] = function (params){
    if(params.character==FList.Chat.identity){
        FList.Chat.TabBar.setActive("console","console");
        FList.Chat.printMessage({msg: 'You were kicked from ' + params.channel + ' by <a class="AvatarLink">' +
                                params.operator + '</a>. You may access logs from the logs tab.',
                                from: 'System', type: 'system'});
    } else {
        FList.Chat.printMessage({msg: '<a class="AvatarLink">' + params.character + '</a> was kicked from ' +
                                params.channel + ' by <a class="AvatarLink">' + params.operator + '</a>.',
                                to: FList.Chat.TabBar.getTabFromId('channel', params.channel),
                                from: 'System', type: 'system'});
    }
};
FList.Chat.commands['CTU'] = function (params){
if(params.character==FList.Chat.identity){
    FList.Chat.TabBar.setActive("console","console");
    FList.Chat.printMessage({msg: 'You were kicked and timed out from ' + params.channel +
                            ' by <a class="AvatarLink">' + params.operator +
                            '</a> for ' + params.length + ' minute(s). You may access logs from the logs tab.',
                            from: 'System', type: 'system'});
} else {
    FList.Chat.printMessage({msg: '<a class="AvatarLink">' + params.character +
                            '</a> was kicked and timed out from ' + params.channel +
                            ' by <a class="AvatarLink">' + params.operator +
                            '</a> for ' + params.length + ' minute(s).',
                            to: FList.Chat.TabBar.getTabFromId('channel', params.channel),
                            from: 'System', type: 'system'});
}
};
FList.Chat.commands['COA'] = function (params){ };
FList.Chat.commands['ACB'] = function (params){ };
FList.Chat.commands['COR']=FList.Chat.commands['COA'];
FList.Chat.commands['IDN'] = function (params)
{
    FList.Chat.bookmarksOnline.splice(0, FList.Chat.bookmarksOnline.length);
    FList.Chat.friendsOnline.splice(0, FList.Chat.friendsOnline.length);
    FList.Chat.TabBar.loadSavedTabs();
    FList.Connection.send("UPT");
    clearInterval(FList.Chat.TypeState.interval);
    FList.Chat.TypeState.interval = setInterval(FList.Chat.TypeState.check, FList.Chat.typingInterval * 1000);
    FList.Chat.printMessage({msg: 'Your status was set to ' + FList.Chat.Status.lastStatus.status,
                            to: FList.Chat.TabBar.getTabFromId('console', 'console'),from: 'System', type: 'system'});
    $(window).unbind("mousemove").bind("mousemove", function() {
        FList.Chat.IdleTimer.reset();
    });
    FList.Chat.IdleTimer.init();
    $("#message-field").focus();
    FList.Chat.UI.setDone();
    document.title = "F-list - Chat (" + FList.Chat.identity + ")";
    /**
     * Offline Log Cleaner
     */
    (function (local) {
        var WEEK = 604800000,
            curObj,
            LS_KEYS = Object.keys(localStorage);
        if (window.Storage) {
            $.each(localStorage, function (cur) {
                cur = LS_KEYS[cur];
                if (cur.indexOf(local.identity) === 0) {
                    if (localStorage[cur].charAt(0) !== '{') {
                        delete localStorage[cur];
                    } else {
                        curObj = JSON.parse(localStorage[cur]);
                        if (new Date().getTime() - curObj.last > WEEK) {
                            delete localStorage[cur];
                        }
                    }
                }
            });
        }
    }(FList.Chat));
};
FList.Chat.commands['UPT'] = function(params) {
    var message = "Server has been running since " + params.startstring + ", there are " + params.channels.toString() + " channels, " + params.users + " users, " + params.accepted + " accepted connections, " + params.maxusers + " users was the maximum number of users connected at some point since the last server restart.";
    FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'});
};
FList.Chat.commands['SYS'] = function(params) {
    FList.Chat.printMessage({msg: params.message, from: 'System', type: 'system'});
};
FList.Chat.commands['MSG'] = function (params) {
    if (jQuery.inArray(params.character.toLowerCase(), FList.Chat.ignoreList) !== -1) return;
    var message = params.message;
    if(params.channel.toLowerCase()=="frontpage"){
        message=message.replace(/\[icon\]/g, "[user]");message=message.replace(/\[\/icon\]/g, "[/user]");
    }
    var messagetype = "chat";
    if (FList.Chat.Roleplay.isRoleplay(message))
    {
        message = message.substring(3);
        messagetype = "rp";
    }
    FList.Chat.printMessage({msg: message,
                            to: FList.Chat.TabBar.getTabFromId('channel', params.channel),
                            from: params.character, type: messagetype});
};
FList.Chat.commands['BRO'] = function (params)
{ //Admin/Op/Server broadcast, or shutdown notification
    var message = params.message;
    FList.Chat.printMessage({msg: message, from: params.character, type: 'system', log:false});
    FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
};
FList.Chat.commands['LRP'] = function (params)
{
    if (jQuery.inArray(params.character.toLowerCase(), FList.Chat.ignoreList) !== -1) return;
    var message = params.message;
    FList.Chat.printMessage({msg: message,
                            to: FList.Chat.TabBar.getTabFromId('channel', params.channel),
                            from: params.character, type: 'ad'});
    var linkclasses=FList.Chat.getPrintClasses(params.character, params.channel);$("#ads-panel-list .DisplayedMessage").remove();
    $("#ads-panel-list").append("<div class='panel'><span class='" + linkclasses + "'><span class='rank'></span>" + params.character + "</span>:" + FList.ChatParser.parseContent(message) + "</div>");
    if($("#ads-panel-list > div").length>25){ $("#ads-panel-list:first").remove(); }
};
FList.Chat.commands['PRI'] = function (params)
{
    var local = FList.Chat,
        message,
        messagetype,
        tab,
        isIgnored = (
            $.inArray(
                params.character.toLowerCase(), local.ignoreList
            ) !== -1
        );
    if (isIgnored)
        return FList.Connection.send(
            'IGN ' + JSON.stringify({
                action: 'notify',
                character: params.character
            })
        );
    message = params.message;
    messagetype = 'chat';
    if (local.Roleplay.isRoleplay(message)) {
        message = message.substring(3);
        messagetype = 'rp';
    }
    tab = local.TabBar.getTabFromId('user', params.character.toLowerCase());
    if (!tab) {
        local.openPrivateChat(params.character, false);
    } else {
        tab.tab.children(".tpn").removeClass("tpn-paused").hide();
        if (tab.closed) {
            tab.tab.show();
            tab.closed = false;
        }
    }
    local.Logs.saveLogs(
        params.character,
        {
            msg: message,
            kind: messagetype,
            to: params.character.toLowerCase()
        }
    );
    local.printMessage({
        msg: message,
        to: local.TabBar.getTabFromId('user', params.character),
        from: params.character, type: messagetype
    });
};
FList.Chat.commands['NLN'] = function (params)
{
    FList.Chat.users.add(params.identity);
    var data = FList.Chat.users.getData(params.identity);
    data.status="Online";
    data.gender=params.gender;
    FList.Chat.users.setData(params.identity, data);

    if (params.identity !== FList.Chat.identity)
    {
        FList.Chat.users.count+=1;
        if(FList.Chat.TabBar.activeTab.type=="console"){
            $("#info-bar-actions").html(FList.Chat.users.count + " users connected.");
        }
    }

    var printtab=FList.Chat.TabBar.getTabFromId("user", params.identity);
    var active=params.identity.toLowerCase()==FList.Chat.TabBar.activeTab.id && FList.Chat.TabBar.activeTab.type=="user";
    var message="[user]" + params.identity + "[/user] is online.";
    if (!printtab) {//there is no tab open with this guy.
        if ((FList.Chat.users.isTracked(params.identity) && FList.Chat.Settings.current.friendNotifications)) {//but we want notifications.
            if(FList.Chat.Settings.current.consoleRTB === false){
			  FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});
		  }
		  FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
        }
    }  else {//there is a tab open.
        if (active) {//are we looking at it?
            //if(FList.Chat.users.isTracked(params.identity) && FList.Chat.Settings.current.friendNotifications){
                if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});
			 }
			 FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            //}
            FList.Chat.InfoBar.update();
        } else {
            if(FList.Chat.users.isTracked(params.identity) && FList.Chat.Settings.current.friendNotifications){
                if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});
			 }
			 FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            }

            if (!printtab.closed) {
                if(FList.Chat.Settings.current.consoleRTB === false){
				 FList.Chat.printMessage({msg: message, to: printtab, from: 'System', type: 'system'});
			 }
			 FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
            }

        }
        FList.Chat.TabBar.updateTooltip(printtab);
    }
};

FList.Chat.commands['TPN'] = function(params) {

    if(jQuery.inArray(params.character.toLowerCase(),FList.Chat.ignoreList)!==-1) return;
    var printtab=FList.Chat.TabBar.getTabFromId("user", params.character);
    if (!printtab) return;
    printtab.tab.children(".tpn").removeClass("tpn-paused");
    switch(params.status){
        case "clear":
            printtab.tab.children(".tpn").hide();
        break;
        case "paused":
            printtab.tab.children(".tpn").addClass("tpn-paused");
            printtab.tab.children(".tpn").show();
        break;
        case "typing":
            printtab.tab.children(".tpn").show();
        break;
    }
    //FList.Chat_tabs.list[printtab].status = params.status;
};

FList.Chat.commands['PIN'] = function (params)
{
    clearTimeout(FList.Connection.pingTimeout);
    FList.Connection.pingTimeout = setTimeout(function ()
    {
        if (FList.Connection.ws !== 0)
        {
            FList.Connection.ws.close();
        }
    }, 300000);
    FList.Connection.send("PIN");
};
FList.Chat.commands['IGN'] = function (params)
{
    var character = params.character;
    var action = params.action;
    if (action == "add")
    {
        if (FList.Chat.isChatop(character))
        {
            FList.Chat.printMessage({msg: 'You cannot ignore a global moderator.',
                                    from: 'System', type: 'system'});
        }
        else
        {
            FList.Chat.printMessage({msg: character + ' has been added to your ignore list.',
                                    from: 'System', type: 'system'});
            FList.Chat.ignoreList.push(character.toLowerCase());
        }
    }
    if (action == "delete")
    {
        FList.Chat.printMessage({msg: character + ' has been removed from your ignore list.',
                                from: 'System', type: 'system'});
        character = character.toLowerCase();
        for (var i in FList.Chat.ignoreList)
        {
            if (FList.Chat.ignoreList[i] == character) FList.Chat.ignoreList.splice(i, 1);
        }
    }
    if (action == "list")
    {
        var list = params.characters;
        FList.Chat.ignoreList = params.characters;
        if (!list.length)
        {
            FList.Chat.printMessage({msg: 'You aren\'t ignoring anybody.',
                                    from: 'System', type: 'system'});
            return;
        }
        var liststring = "Your ignorelist: ";
        for (var i in list)
        {
            liststring += "[user]" + list[i] + "[/user], ";
        }
        liststring = liststring.substring(0, liststring.length - 2);
        FList.Chat.printMessage({msg: liststring, from: 'System', type: 'system'});
    }
    if (action == "init")
    {
        FList.Chat.ignoreList = [];
        $.each(params.characters, function (i, chara)
        {
            FList.Chat.ignoreList.push(chara.toLowerCase());
        });
    }
};
FList.Chat.commands['RMO'] = function(params) {
    var channel = params.channel;
    channel=FList.Chat.channels.getData(channel);
    if(channel!=-1){
        channel.mode = params.mode;
        FList.Chat.printMessage({msg: 'Room mode for room ' + channel.title + ' has been set to ' + channel.mode + '.',
                                to: FList.Chat.TabBar.getTabFromId('channel', params.channel), from: 'System', type: 'system'});
        channel.mode=params.mode;
        if((channel.mode=="ads" || channel.mode=="chat") && channel.userMode=="both") channel.userMode=channel.mode;
        if(channel.userMode=="chat" && channel.mode=="ads") channel.userMode=channel.mode;
        if(channel.userMode=="ads" && channel.mode=="chat") channel.userMode=channel.mode;
        if(FList.Chat.TabBar.activeTab.type=="channel" && FList.Chat.TabBar.activeTab.id==params.channel){

                $(".send-input-ad, .send-input-chat").attr("disabled", false);
                if(channel.mode=="ads") $(".send-input-chat").attr("disabled", true);
                if(channel.mode=="chat") $(".send-input-ad").attr("disabled", true);
                FList.Chat.InfoBar.update();
                FList.Chat.TabBar.printLogs(FList.Chat.TabBar.activeTab, channel.userMode);
                FList.Chat.Roleplay.update(FList.Chat.TabBar.activeTab.id);

        }
    }
};
FList.Chat.commands['KID'] = function(params) {

    if (params.type === 'start' || params.type === 'end') {
        FList.Chat.printMessage({msg: params.message, from: 'System', type: 'system'});
    }

    if (params.type === 'custom') {
        FList.Chat.printMessage({msg: '<b>' + params.key + ':</b> ' + params.value,
                                from: 'System', type: 'system'});
    }

};
FList.Chat.commands['PRD'] = function(params) {

    if (params.type === 'start' || params.type === 'end') {
        FList.Chat.printMessage({msg: params.message, from: 'System', type: 'system'});

    }
    if (params.type === 'info' || params.type === 'select') {
        FList.Chat.printMessage({msg: '<b>' + params.key + ':</b> ' + params.value,
                                from: 'System', type: 'system'});
    }

};
FList.Chat.commands['RLL'] = function(params) {
    var target = typeof(params.channel) === 'undefined' ? params.recipient : params.channel;
    var type = typeof(params.channel) === 'undefined' ? 'user' : 'channel';
    var printtab=FList.Chat.TabBar.getTabFromId(type, target);
    if(printtab !== false){
        FList.Chat.printMessage({msg: params.message, to: printtab, from: 'System', type: 'roll'});
    }
};
FList.Chat.commands['SFC'] = function(params) {
    if (params.action == "report") {
        var message = 'MODERATOR ALERT. [user]' + params.character + '[/user] writes:\n' + params.report + '\nThings you can do: ';
        message += '<a href="javascript:FList.Chat.staffAlert.confirm(\'' + params.callid + '\')">Confirm Alert</a>';
        if (typeof(params.logid) == "number") message += ', [url=' + domain + 'fchat/getLog.php?log=' + params.logid + ']View Attached Log[/url]';
        if(FList.Chat.Settings.current.consoleRTB === false){
		   FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});
	   }
        if(FList.Chat.Settings.current.html5Audio) FList.Chat.Sound.playSound("modalert");
	   FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
    } else if (params.action == "confirm") {
        message = 'ALERT CONFIRMED. [user]' + params.moderator + '[/user] is handling [user]' + params.character + '[/user]\'s report.';
        if(FList.Chat.Settings.current.consoleRTB === false){
		   FList.Chat.printMessage({msg: message, from: 'System', type: 'system'});
	   }
	   FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
    }
};
FList.Chat.commands['RTB'] = function(params) {
    // we've received a site notification via realtime bridge
    if (params.type == "note") {
        var message='<b>Note from ' + params.sender + ':</b> <a href="/view_note.php?note_id=' + params.id + '" target="_blank">' + params.subject + '</a>';
        FList.Chat.Sound.playSound("newnote");
    }
    else if (params.type == "comment") {
        //FList.Chat_users.addTrack(params.name);
        var url="";
        switch(params.target_type){
            case "newspost":
                url=domain + "newspost/" + params.target_id + "/#Comment" + params.id;
            break;
            case "bugreport":
                url=domain + "view_bugreport.php?id=" + params.target_id + "#" + params.id;
            break;
            case "changelog":
                url=domain + "log.php?id=" + params.target_id + "#" + params.id;
            break;
            case "feature":
                url=domain + "vote.php?fid=" + params.target_id + "#" + params.id;
            break;
            default:
        }
        if(params.parent_id==0){
            var message='<a class="AvatarLink">' + params.name + '</a> commented on your ' + params.target_type + ', "[url=' + url + ']' + params.target + '[/url]"';
        } else {
            var message='<a class="AvatarLink">' + params.name + '</a> replied to your comment on a ' + params.target_type + ', "[url=' + url + ']' + params.target + '[/url]"';
        }
    }else if (params.type == "grouprequest") {
        if(FList.Chat.Settings.current.alertsForGrouprequests){
            var message='<a class="AvatarLink">' + params.name + '</a> requested a group named \"[url=' + domain + 'panel/group_requests.php]' + params.title + '[/url]"';
        }
    }else if (params.type == "trackadd") {
        var message='Added <a class="AvatarLink">' + params.name + '</a> to your bookmarks';
        FList.Chat.bookmarksList.push(params.name);

    }else if (params.type == "bugreport") {
        if(FList.Chat.Settings.current.alertsForBugreports){
        //FList.Chat_users.addTrack(params.name);
        var url=domain + "view_bugreport.php?id=" + params.id;
        var message='<a class="AvatarLink">' + params.name + '</a> submitted a bugreport, "[url=' + url + ']' + params.title + '[/url]"';
        }
    }else if (params.type == "helpdeskticket") {
        if(FList.Chat.Settings.current.alertsForTickets){
        //FList.Chat_users.addTrack(params.name);
        var url=domain + "view_ticket.php?id=" + params.id;
        var message='<a class="AvatarLink">' + params.name +'</a> submitted a helpdesk ticket, "[url=' + url + ']' + params.title + '[/url]"';
        }
    }else if (params.type == "helpdeskreply") {
        if(FList.Chat.Settings.current.alertsForTickets){
        //FList.Chat_users.addTrack(params.name);
        var url=domain + "view_ticket.php?id=" + params.id;
        var message='<a class="AvatarLink">' + params.name + '</a> submitted a reply to a helpdesk ticket you were involved in, [url=' + url + ']located here[/url]';
        }
    }else if (params.type == "featurerequest") {
        if(FList.Chat.Settings.current.alertsForFeatures){
        //FList.Chat_users.addTrack(params.name);
        var url=domain + "vote.php?fid=" + params.id;
        var message='<a class="AvatarLink">' + params.name +
                                '</a> submitted a feature request, "[url=' + url + ']' +
                                params.title + '[/url]"';
        }
    }
    else if (params.type == "trackrem") {
        //FList.Chat_users.removeTrack(params.name);
        var message='Removed <a class="AvatarLink">' + params.name + '</a> from your bookmarks';
        for(var i in FList.Chat.bookmarksList){
            if(FList.Chat.bookmarksList[i]== params.name){
                FList.Chat.bookmarksList.splice(i, 1);
            }
        }
    }
    else if (params.type == "friendrequest") {
        var message='<a class="AvatarLink" target="_blank" href="../messages.php">' + params.name + '</a> requested to be your friend. ';
    } else if (params.type == "friendadd") {
        //FList.Chat_users.addTrack(params.name);
        var message='<a class="AvatarLink">' + params.name + '</a> was added to your friends list.';
        FList.Chat.friendsList.push(params.name);

    }
    if(FList.Chat.Settings.current.consoleRTB === false){
	FList.Chat.printMessage({msg: message, from: 'System', type: 'system'}); //to active tab
    }
    FList.Chat.printMessage({msg: message, to: FList.Chat.TabBar.getTabFromId('console', 'console'), from: 'System', type: 'system'}); //and the console
};

FList.Chat.commands['CBU'] = function(params) {
    if(params.character === FList.Chat.identity){
        if (FList.Chat.TabBar.activeTab.id === params.channel) {
            FList.Chat.TabBar.setActive('console', 'console');
        }

        FList.Chat.printMessage({msg: 'You were banned from ' + params.channel + ' by <a class="AvatarLink">' +
                                params.operator + '</a>. You may access logs from the logs tab.',
                                from: 'System', type: 'system'});
    } else {
        FList.Chat.printMessage({msg: '<a class="AvatarLink">' + params.character + '</a> was banned from ' +
                                params.channel + ' by <a class="AvatarLink">' + params.operator + '</a>.',
                                to: FList.Chat.TabBar.getTabFromId('channel', params.channel),
                                from: 'System', type: 'system'});
    }
};
