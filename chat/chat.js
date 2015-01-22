/**
 * Kali's Changelog: 17/01/15
 * --------------------------
 * >> Function Changed: printMessage @chat.js -- RLL @commands.js
 * >     Fix for ALL THE SYSTEM MESSAGES undergoing highlight checking. Limited to rolls now.
 */

WEB_SOCKET_SWF_LOCATION = "../WebSocket.swf";
WEB_SOCKET_DEBUG = false;

$(function () {
    FList.ChatParser = new FList.BBParser();
    //FList.ChatParser.replaceLongWordsWith("<span class=\"redfont\">- Word stretching detected. Message filtered by the chat. -</span>");
    FList.ChatParser.addCustomTag("user", false, function(content) {
    var cregex = /^[a-zA-Z0-9_\-\s]+$/;
    if(cregex.test(content))
        return '<a target="_blank" class="AvatarLink">' + content + '</a>';
    else return content;
    });
    FList.ChatParser.addCustomTag("icon", false, function(content) {
    var cregex = /^[a-zA-Z0-9_\-\s]+$/;
    if(cregex.test(content))
        return '<a href="' + domain + 'c/' + content + '" target="_blank"><img src="' + staticdomain + 'images/avatar/' + content.toLowerCase() + '.png" class="ParsedAvatar" /></a>';
    else return content;
    });
    FList.ChatParser.addCustomTag("channel", false, function(content) {
    var cregex = /^[a-zA-Z0-9\/_\-\s']+$/;
    if(cregex.test(content))
        return '<a class="ChannelLink" onclick=\'FList.Chat.openChannelChat("' + escape(content) + '",true);\'>' + content + '</a>';
    else return content;
    });
    FList.ChatParser.addCustomTag("session", false, function(content, title) {
    var cregex = /^[a-zA-Z0-9\/_\-\s']+$/;
    if(cregex.test(content))
        return '<a class="SessionLink" onclick=\'FList.Chat.openChannelChat("' + escape(content) + '",true);\'>' + title + '</a>';
    else return content;
    });
    FList.ChatParser.addCustomTag("color", true, function(content, attribute) {
        var cregex = /^(red|blue|white|yellow|pink|gray|green|orange|purple|black|brown|cyan)$/;
        if (cregex.test(attribute))
            return '<span class="' + attribute + 'font">' + content + '</span>';
        else return content;
    });
    window.onbeforeunload = function() { if(FList.Chat.identity!=="") return "Are you sure you want to leave the chat?"; };
    FList.Chat.Settings.init();
    FList.Chat.Settings.save();//extend cookie
    FList.Chat.Sound.init();
    FList.Chat.UI.buildBase();
    FList.Chat.UI.initLogin();
});

FList.Chat = {
    focused: true,
    bookmarksOnline: [],identity: "",opList: [], truncateChars: 1024, userListMode:false, friendsOnline: [],friendsList: [],serverVars: {},privateChannels: [],publicChannels: [],ignoreList: [],typingInterval: 3,debug:false,restoreTabs:[],lastIdentity:"",
    bookmarksList: [],commands: {},version: "0.8.2",//"2.0.1",

    getCHA:false, getORS:false,

    desanitize: function(str) {
        return str.replace(/\&lt\;/g, '<')
            .replace(/\&gt\;/g, '>')
            .replace(/\&amp\;/g, '&');
    },

    truncateVisible: function(){
        var amount=$(".chat-message").length;
        if(amount>FList.Chat.Settings.current.visibleLines){
            var excess=amount-FList.Chat.Settings.current.visibleLines;
            for(var i=0;i<excess;i++) $(".chat-message:first").remove();
        }
    },

    processMessage: function(_tabtype, _msgtype, _message){//todo: truncate, collapse. etc.
        if (FList.Chat.Settings.current.autoParseURLs === true) _message = _message.replace(/(?:[^=\]]|^)((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/g, "[url]$1[/url]");
        return FList.ChatParser.parseContent(_message);
    },

    rebuildChannelsTab: function(_type,_sort, _order){

        if(_type==="public"){
            $(".chatui-tab-channels .public").html("");
            if(_sort==="label"){
                FList.Chat.publicChannels = FList.Chat.publicChannels.sort(function (a, b){ if (a.title === b.title) return 0; return a.title < b.title ? 1 : -1; });
                $(".channels-tab-label span.sort:first").removeClass("list-item-important channel-sort-reverse");
                 $(".channels-tab-label span.label:first").addClass("list-item-important");
                 if(_order==="reverse") $(".channels-tab-label span.label:first").addClass("channel-sort-reverse"); else $(".channels-tab-label span.label:first").removeClass("channel-sort-reverse");
            }
            if(_sort==="users"){
                FList.Chat.publicChannels = FList.Chat.publicChannels.sort(function (a, b){ if (a.users === b.users) return 0; return a.users > b.users ? 1 : -1; });
                $(".channels-tab-label span.label:first").removeClass("list-item-important channel-sort-reverse");
                $(".channels-tab-label span.sort:first").addClass("list-item-important");
                 if(_order==="reverse") $(".channels-tab-label span.sort:first").addClass("channel-sort-reverse"); else $(".channels-tab-label span.sort:first").removeClass("channel-sort-reverse");
            }
            if(_order==="reverse") FList.Chat.publicChannels.reverse();
            $.each(FList.Chat.publicChannels, function(i,pc){
                $(".chatui-tab-channels .public").append('<div class="list-item channel-item panel list-highlight" id="user5"><span class="count">' + pc.users + '</span><span class="name">' + pc.title + '</span></div>');
                var tab=FList.Chat.TabBar.getTabFromId("channel", pc.id);
                if(tab!==false) {
                    if(!tab.closed) $(".chatui-tab-channels .public .channel-item:last").addClass("list-item-important");
                }
                var chanid=pc.id;
                $(".chatui-tab-channels .public .channel-item:last").click(function(){
                    var tab=FList.Chat.TabBar.getTabFromId("channel", chanid);
                    if(!$(this).hasClass("list-item-important")){
                        FList.Chat.openChannelChat(pc.id, false);
                        $(this).addClass("list-item-important");
                    }  else {
                        FList.Chat.TabBar.closeTab(tab.tab);
                        $(this).removeClass("list-item-important");
                    }
                });
            });
            $(".channels-tab-label span.sort:first").unbind("click").click(function(){ FList.Chat.rebuildChannelsTab("public", "users", _order==="default" ? "reverse"  : "default"); });
            $(".channels-tab-label span.label:first").unbind("click").click(function(){ FList.Chat.rebuildChannelsTab("public", "label", _order==="default" ? "reverse"  : "default"); });
        }
        if(_type==="private"){
            $(".chatui-tab-channels .private").html("");
            if(_sort==="label"){
                FList.Chat.privateChannels = FList.Chat.privateChannels.sort(function (a, b){ if (a.title === b.title) return 0; return a.title < b.title ? 1 : -1; });
                $(".channels-tab-label span.sort:last").removeClass("list-item-important channel-sort-reverse");
                 $(".channels-tab-label span.label:last").addClass("list-item-important");
                 if(_order==="reverse") $(".channels-tab-label span.label:last").addClass("channel-sort-reverse"); else $(".channels-tab-label span.label:last").removeClass("channel-sort-reverse");
            }
            if(_sort==="users"){
                FList.Chat.privateChannels = FList.Chat.privateChannels.sort(function (a, b){ if (a.users === b.users) return 0; return a.users > b.users ? 1 : -1; });
                $(".channels-tab-label span.label:last").removeClass("list-item-important channel-sort-reverse");
                $(".channels-tab-label span.sort:last").addClass("list-item-important");
                if(_order==="reverse") $(".channels-tab-label span.sort:last").addClass("channel-sort-reverse"); else $(".channels-tab-label span.sort:last").removeClass("channel-sort-reverse");
            }
            if(_order==="reverse") FList.Chat.privateChannels.reverse();
            $.each(FList.Chat.privateChannels, function(i,pc){
                $(".chatui-tab-channels .private").append('<div class="list-item channel-item panel list-highlight" id="user5"><span class="count">' + pc.users + '</span><span class="name">' + pc.title + '</span></div>');
                var tab=FList.Chat.TabBar.getTabFromId("channel", pc.id);
                if(tab!==false) {
                    if(!tab.closed) $(".chatui-tab-channels .private .channel-item:last").addClass("list-item-important");
                }
                var chanid=pc.id;
                $(".chatui-tab-channels .private .channel-item:last").click(function(){
                    var tab=FList.Chat.TabBar.getTabFromId("channel", chanid);
                    if(!$(this).hasClass("list-item-important")){
                        FList.Chat.openChannelChat(pc.id, false);
                        $(this).addClass("list-item-important");
                    }  else {
                        FList.Chat.TabBar.closeTab(tab.tab);
                        $(this).removeClass("list-item-important");
                    }
                });
            });
            $(".channels-tab-label span.sort:last").unbind("click").click(function(){ FList.Chat.rebuildChannelsTab("private", "users", _order==="default" ? "reverse"  : "default"); });
            $(".channels-tab-label span.label:last").unbind("click").click(function(){ FList.Chat.rebuildChannelsTab("private", "label", _order==="default" ? "reverse"  : "default"); });
        }


    },

    openPrivateChat: function(name, dounescape){
        if(name.toLowerCase()===FList.Chat.identity.toLowerCase()) return;
        if (dounescape === true) name = unescape(name);
        var tab=FList.Chat.TabBar.getTabFromId("user",name);
        if(tab===false){
            FList.Chat.TabBar.addTab("user",name,name.toLowerCase());
            tab=FList.Chat.TabBar.getTabFromId("user",name);
            FList.Chat.Activites.flash(tab.tab,255,255,255,300);
        } else {
            if(tab.closed){
                tab.tab.show();
                tab.closed=false;
                FList.Chat.Activites.flash(tab.tab,255,255,255,300);
            } else {
            FList.Chat.TabBar.setActive("user", name);
        }
    }
    if(FList.Chat.Settings.current.keepTypingFocus) $("#message-field").focus();
        if (!tab.initLogs) {
            FList.Chat.Logs.buildLogs(name);
        }
},
openChannelChat: function(channel, dounescape){
    if (dounescape === true) channel = unescape(channel);
    var channeldata=FList.Chat.channels.getData(channel);
    if(!channeldata.created) FList.Chat.channels.create(channel, channel);
    var tab=FList.Chat.TabBar.getTabFromId("channel",channel);
    if(tab===false){
        FList.Chat.TabBar.addTab("channel",channel,channel);
        tab=FList.Chat.TabBar.getTabFromId("channel",channel);
        FList.Chat.Activites.flash(tab.tab,255,255,255,300);
    } else {
        if(tab.closed){
            tab.tab.show();
            tab.closed=false;
            FList.Chat.Activites.flash(tab.tab,255,255,255,300);
        } else {
            FList.Chat.TabBar.setActive("channel", channel);
        }
    }
    if(!channeldata.joined) {
        FList.Connection.send("JCH " + JSON.stringify({ "channel": channel }));
    }
    if(FList.Chat.Settings.current.keepTypingFocus) $("#message-field").focus();
},
scrollDown: function(){ $("#chat-content-chatarea > div").scrollTop($("#chat-content-chatarea > div").prop("scrollHeight") - $('#chat-content-chatarea > div').height()); }
};

FList.Chat.Settings = {
    current: { },
    dlg: false,
    defaults: {
        autoParseURLs: true, keepTypingFocus:true, tabsOnTheSide: false, autoIdleTime: 600000, leftClickOpensFlist: true, mentionWords: [],visibleLines: 200, enableLogging: true, enablePMLogging: true, joinLeaveAlerts: false, alertsForFeatures: false, alertsForBugreports: false, alertsForTickets: false, alertsForGrouprequests:false, disableIconTag: false, autoIdle: false, idleTime: 30000,
        friendNotifications: true, html5Notifications: false, html5Audio: true, highLightMentions: true, highlightWords: [], colorizeOwnMessages: false,
         fontSize: 12, disableUserList: false, flashTabIndicate: true
    },
    init: function(){
        // Eventually remove this when people translate from cookies to localStorage
        if( typeof(Storage) !== "undefined" && localStorage["chat_settings"]===undefined ) localStorage["chat_settings"]=FList.Common_getCookie("chat_settings");
        //
        var settingsString=localStorage["chat_settings"];
        if(settingsString==="") FList.Chat.Settings.current=FList.Chat.Settings.defaults;
        else FList.Chat.Settings.current=JSON.parse(settingsString);
    },
    getPanel: function(){
        return "<div class='StyledForm'><div class='group'><div class='settings-tab-label'><span>Layout & Display</span></div><p><span class='label'>Display limit</span><span class='element'><input type='text' maxlength='5' size='5' class='ui-settings-visiblelines'/></span></p><p><span class='label'>Tabs on the side</span><span class='element'><input type='checkbox' class='ui-settings-tabsontheside'/></span></p><p><span class='label'>Disable userlist</span><span class='element'><input type='checkbox' class='ui-settings-disableuserlist'/></span></p><p><span class='label'>Keep focus on typing area.</span><span class='element'><input type='checkbox' class='ui-settings-keeptypingfocus'/></span></p><p><span class='label'>Font size</span><span class='element'><input type='text' maxlength='3' size='3' class='ui-settings-fontsize'/></span></p><p><span class='label'>Highlight messages</span><span class='element'><input type='checkbox' class='ui-settings-highlightmentions'/></span></p><p><span class='label'>Highlight Words</span><span class='element'><input type='text' maxlength='255' size='12' class='ui-settings-highlightwords'/></span></p><p><span class='label'>Auto-parse URLs</span><span class='element'><input type='checkbox' class='ui-settings-autoparseurls'/></span><p><span class='label'>System messages in console</span><span class='element'><input type='checkbox' class='ui-settings-consolertb'/></span></p></p></div><div class='group'><div class='settings-tab-label'><span>Functionality</span></div><p><span class='label'>HTML5 Audio</span><span class='element'><input type='checkbox' class='ui-settings-html5audio'/></span></p><p><span class='label'>Join/Leave messages</span><span class='element'><input type='checkbox' class='ui-settings-joinleavealerts'/></span></p><p><span class='label'>Disable [icon] tag</span><span class='element'><input type='checkbox' class='ui-settings-disableicontag'/></span></p><p><span class='label'>HTML5 Notifications</span><span class='element'><input type='checkbox' class='ui-settings-html5notifications'/></span></p><p><span class='label'>Auto Idle</span><span class='element'><input type='checkbox' class='ui-settings-autoidle'/></span></p><p><span class='label'>Idle time(ms)</span><span class='element'><input type='text' maxlength='7' size='6' class='ui-settings-autoidletime'/></span></p><p><span class='label'>Enable Logging</span><span class='element'><input type='checkbox' class='ui-settings-enablelogging'/></p><p><span class='label'>Enable PM Logging</span><span class='element'><input type='checkbox' class='ui-settings-enablepmlogging'/></span></p><p><span class='label'>Clear PM Logs</span><span class='element'><input type='button' onclick='FList.Chat.Logs.clearLogs()' class='ui-settings-clearStorage ui-button ui-widget ui-state-default ui-corner-all' value='clear' style='position:relative;height:100%;width:100%;padding:0px;'/></span></p><p><span class='label'>Friend notifications</span><span class='element'><input type='checkbox' class='ui-settings-friendnotifications'/></span></p><p><span class='label'>Alerts for bug reports</span><span class='element'><input type='checkbox' class='ui-settings-alertsforbugreports'/></span></p><p><span class='label'>Alerts for helpdesk tickets</span><span class='element'><input type='checkbox' class='ui-settings-alertsfortickets'/></span></p><p><span class='label'>Alerts for group requests</span><span class='element'><input type='checkbox' class='ui-settings-alertsforgrouprequests'/></span></p><p><span class='label'>Alerts for feature requests</span><span class='element'><input type='checkbox' class='ui-settings-alertsforfeatures'/></span></p><p><span class='label'>Left click opens f-list profile</span><span class='element'><input type='checkbox' class='ui-settings-leftclickopensflist'/></span></p><p><span class='label'>Animated Tab Activity</span><span class='element'><input type='checkbox' class='ui-settings-flashTabIndicate'/></span></p></div><div class='group'><p><input type='button' id='settings-panel-save' value='Save' onclick='FList.Chat.Settings.savePanel();'/><input type='button' id='settings-panel-reset' value='Reset' onclick='FList.Chat.Settings.resetPanel();'/></p></div></div>";
    },
    initPanel: function(){
        $(".ui-settings-fontsize").val(FList.Chat.Settings.current.fontSize);
        $(".ui-settings-visiblelines").val(FList.Chat.Settings.current.visibleLines);
        $(".ui-settings-disableicontag").attr("checked", FList.Chat.Settings.current.disableIconTag);
        $(".ui-settings-disableuserlist").attr("checked", FList.Chat.Settings.current.disableUserList);
        $(".ui-settings-autoparseurls").attr("checked", FList.Chat.Settings.current.autoParseURLs);
        $(".ui-settings-html5audio").attr("checked", FList.Chat.Settings.current.html5Audio);
        $(".ui-settings-joinleavealerts").attr("checked", FList.Chat.Settings.current.joinLeaveAlerts);
        $(".ui-settings-html5notifications").attr("checked", FList.Chat.Settings.current.html5Notifications);
        $(".ui-settings-autoidle").attr("checked", FList.Chat.Settings.current.autoIdle);
        $(".ui-settings-autoidletime").val(FList.Chat.Settings.current.autoIdleTime);
        $(".ui-settings-enablelogging").attr("checked", FList.Chat.Settings.current.enableLogging);
        $(".ui-settings-enablepmlogging").attr("checked", FList.Chat.Settings.current.enablePMLogging);
        $(".ui-settings-highlightmentions").attr("checked", FList.Chat.Settings.current.highLightMentions);
        $(".ui-settings-keeptypingfocus").attr("checked", FList.Chat.Settings.current.keepTypingFocus);
        $(".ui-settings-leftclickopensflist").attr("checked", FList.Chat.Settings.current.leftClickOpensFlist);
        $(".ui-settings-tabsontheside").attr("checked", FList.Chat.Settings.current.tabsOnTheSide);
        $(".ui-settings-friendnotifications").attr("checked", FList.Chat.Settings.current.friendNotifications);
	    $(".ui-settings-consolertb").attr("checked", FList.Chat.Settings.current.consoleRTB);
        $(".ui-settings-alertsforbugreports").attr("checked", FList.Chat.Settings.current.alertsForBugreports);
        $(".ui-settings-alertsfortickets").attr("checked", FList.Chat.Settings.current.alertsForTickets);
        $(".ui-settings-alertsforfeatures").attr("checked", FList.Chat.Settings.current.alertsForFeatures);
        $(".ui-settings-alertsforgrouprequests").attr("checked", FList.Chat.Settings.current.alertsForGrouprequests);
        $(".ui-settings-highlightwords").val(FList.Chat.Settings.current.highlightWords.join(","));
        $(".ui-settings-flashTabIndicate").attr("checked", FList.Chat.Settings.current.flashTabIndicate);
    },
    savePanel: function(){
        var fontSize=$(".ui-settings-fontsize").val();
        var visibleLines=$(".ui-settings-visiblelines").val();
        var disableIconTag=$(".ui-settings-disableicontag:checked").length>0 ? true : false;
        var disableUserList=$(".ui-settings-disableuserlist:checked").length>0 ? true : false;
        var autoParseURLs=$(".ui-settings-autoparseurls:checked").length>0 ? true : false;
        var html5Audio=$(".ui-settings-html5audio:checked").length>0 ? true : false;
        var joinLeaveAlerts=$(".ui-settings-joinleavealerts:checked").length>0 ? true : false;
        var html5Notifications=$(".ui-settings-html5notifications:checked").length>0 ? true : false;
        var autoIdle=$(".ui-settings-autoidle:checked").length>0 ? true : false;
        var autoIdleTime=$(".ui-settings-autoidletime").val();
        var enableLogging=$(".ui-settings-enablelogging:checked").length>0 ? true : false;
        var enablePMLogging=$(".ui-settings-enablepmlogging:checked").length>0 ? true : false;
        var highlightMentions=$(".ui-settings-highlightmentions:checked").length>0 ? true : false;
        var leftClickOpensFlist=$(".ui-settings-leftclickopensflist:checked").length>0 ? true : false;
        var friendNotifications=$(".ui-settings-friendnotifications:checked").length>0 ? true : false;
        var consoleRTB=$(".ui-settings-consolertb:checked").length>0 ? true : false;
        var alertsForBugreports=$(".ui-settings-alertsforbugreports:checked").length>0 ? true : false;
        var alertsForTickets=$(".ui-settings-alertsfortickets:checked").length>0 ? true : false;
        var alertsForFeatures=$(".ui-settings-alertsforfeatures:checked").length>0 ? true : false;
        var alertsForGrouprequests=$(".ui-settings-alertsforgrouprequests:checked").length>0 ? true : false;
        var keepTypingFocus=$(".ui-settings-keeptypingfocus:checked").length>0 ? true : false;
        var tabsOnTheSide=$(".ui-settings-tabsontheside:checked").length>0 ? true : false;
        var highlightWords=$(".ui-settings-highlightwords").val().split(",").map(function (key) {
            return key.trim();
        });
        var flashTabIndicate=$(".ui-settings-flashTabIndicate:checked").length>0 ? true : false;
        if(highlightWords[0]==="") highlightWords=[];
        FList.Chat.Settings.current.fontSize=fontSize;
        FList.Chat.Settings.current.visibleLines=visibleLines;
        FList.Chat.Settings.current.disableIconTag=disableIconTag;
        FList.Chat.Settings.current.disableUserList=disableUserList;
        FList.Chat.Settings.current.autoParseURLs=autoParseURLs;
        FList.Chat.Settings.current.html5Audio=html5Audio;
        FList.Chat.Settings.current.joinLeaveAlerts=joinLeaveAlerts;
        FList.Chat.Settings.current.html5Notifications=html5Notifications;
        FList.Chat.Settings.current.autoIdle=autoIdle;
        FList.Chat.Settings.current.autoIdleTime=autoIdleTime;
        FList.Chat.Settings.current.enableLogging=enableLogging;
        FList.Chat.Settings.current.enablePMLogging=enablePMLogging;
        FList.Chat.Settings.current.highlightMentions=highlightMentions;
        FList.Chat.Settings.current.friendNotifications=friendNotifications;
        FList.Chat.Settings.current.consoleRTB=consoleRTB;
        FList.Chat.Settings.current.leftClickOpensFlist=leftClickOpensFlist;
        FList.Chat.Settings.current.highlightWords=highlightWords;
        FList.Chat.Settings.current.tabsOnTheSide=tabsOnTheSide;
        FList.Chat.Settings.current.alertsForBugreports=alertsForBugreports;
        FList.Chat.Settings.current.alertsForTickets=alertsForTickets;
        FList.Chat.Settings.current.alertsForFeatures=alertsForFeatures;
        FList.Chat.Settings.current.keepTypingFocus=keepTypingFocus;
        FList.Chat.Settings.current.alertsForGrouprequests=alertsForGrouprequests;
        FList.Chat.Settings.current.flashTabIndicate=flashTabIndicate;
        FList.Chat.Settings.save();
        FList.Chat.Settings.apply();
        $("#chatui-tabs").tabs( "select" , 1 );
        FList.Chat.UI.resize();
    },
    resetPanel: function(){
        FList.Chat.Settings.current=FList.Chat.Settings.defaults;
        FList.Chat.Settings.initPanel();
    },

    save: function(){ localStorage["chat_settings"]=JSON.stringify(FList.Chat.Settings.current); },

    apply: function(){
        $("#chat-content-chatarea, #info-bar").css("font-size", FList.Chat.Settings.current.fontSize + "px");//apply fontSize
        FList.Chat.TabBar.printLogs(FList.Chat.TabBar.activeTab, FList.Chat.TabBar.activeTab.type ==="channel" ? FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id).userMode : "both");//apply visibleLines
        if(FList.Chat.Settings.current.disableIconTag){
            FList.ChatParser.addCustomTag("icon", false, function(content) {
            var cregex = /^[a-zA-Z0-9_\-\s]+$/;
            if(cregex.test(content))
                return '<a href="' + domain + 'c/' + content + '" target="_blank" class="AvatarLink">' + content + '</a>';
            else return content;
            });
        } else {
            FList.ChatParser.addCustomTag("icon", false, function(content) {
            var cregex = /^[a-zA-Z0-9_\-\s]+$/;
            if(cregex.test(content))
                return '<a href="' + domain + 'c/' + content + '" target="_blank"><img src="' + staticdomain + 'images/avatar/' + content.toLowerCase() + '.png" style="width:50px;height:50px;" class="ParsedAvatar" align="top" /></a>';
            else return content;
            });
        }

        if(!FList.Chat.Settings.current.enableLogging){
            $.each(FList.Chat.TabBar.list, function(i, tab){
                if(tab.logs.length>FList.Chat.Settings.current.visibleLines){
                    var excess=tab.logs.length-FList.Chat.Settings.current.visibleLines;
                    tab.logs.slice(excess-1);
                }
            });
        }

        if(FList.Chat.TabBar.activeTab.type==="channel"){
            if(FList.Chat.Settings.current.disableUserList) FList.Chat.UserBar.hide();
            else FList.Chat.UserBar.show();
        }
        FList.Chat.IdleTimer.init();

        if(FList.Chat.Settings.current.tabsOnTheSide){
            var temp=$("#tab-bar").detach();
            $("#chat-content-row").prepend(temp);
            $("#tab-bar").css({"display":"table-cell","width":"40px","height":"auto","white-space":"normal"});
            $("#tab-bar").addClass("tab-bar-vertical");
            FList.Chat.UI.resize();
        } else {
            var temp=$("#tab-bar").detach();
            $(".chatui-tab-chat").prepend(temp);
            $("#tab-bar").css({"display":"block","width":"auto","white-space":"nowrap", "height":"60px"});
            $(".tab-bar-content").css({"height":"auto"});
            $("#tab-bar").removeClass("tab-bar-vertical");
            FList.Chat.UI.resize();
        }
        FList.Chat.TabBar.makeSortable();

    }
};

FList.Chat.Status = {
    getPanel: function(){
        return "<div style='padding:10px;border-bottom:1px solid rgba(0,0,0,0.4);' class='panel'><img src='" + staticdomain + "images/noavatar.png' style='margin-right:10px;vertical-align:top;' id='status-avatar'/><span id='status-name' style='font-size:2em;margin-top:0px;vertical-align:top;'>Loading...</span></div><div style='padding:10px;'><p><span class='chat-field-label'>Status:</span><select class='ui-statusdlg-status select'><option value='online'>Online</option><option value='looking'>Looking</option><option value='busy'>Busy</option><option value='away'>Away</option><option value='dnd'>DND</option></select></p><p><span class='chat-field-label'>Message: </span><input type='text'  maxlength='256' class='ui-statusdlg-message'/></p><p><input type='button' id='status-panel-update' class='button' onclick='FList.Chat.Status.confirmStatus();' value='Update'/></p></div>";
    },
    confirmStatus: function(){
        var newstatus=$(".ui-statusdlg-status option:selected").text();
        var newmessage=$(".ui-statusdlg-message").val();
        FList.Chat.IdleTimer.idle=false;
        FList.Chat.IdleTimer.reset();
        FList.Connection.send("STA " + JSON.stringify({ status: newstatus, statusmsg: newmessage }));
        $("#chatui-tabs").tabs( "select" , 1 );
    },
    lastStatus: { status: "Online", statusMessage: "" },
    dialog: function(){
        var setstatusdlg= $("");
        setstatusdlg.dialog({
            autoOpen: true, title: 'Set your status', width: '250', height:'150', modal: true,
            buttons: {
                "Set": function(){

                },
                "Cancel": function(){ setstatusdlg.dialog("close"); }
            }
        });
        setstatusdlg.find(".ui-statusdlg-status").val(this.lastStatus.status.toLowerCase());
        setstatusdlg.find(".ui-statusdlg-message").val(this.lastStatus.statusMessage);
    },

    set: function(status, message){
        FList.Chat.printMessage({msg: 'Your status was set to ' + (((status === 'Crown') ? 'Cookie': status) +
                                ((message.length > 0) ? ', "' + FList.Chat.Input.sanitize(message) + '"' : '')),
                                from: 'System', type: 'system'});
        if(status!=="Idle"){
            this.lastStatus.status=status.toLowerCase();
        }
        this.lastStatus.statusMessage=message;
        $("#header-fchat").FlexMenu("set-icon","ui-menu-setstatus", staticdomain + "images/status/" + status.toLowerCase() + ".png");
    },

    restore: function(){
       FList.Connection.send("STA " + JSON.stringify({ status: this.lastStatus.status, statusmsg: this.lastStatus.statusMessage }));
    }

};

FList.Chat.ContextMenu = {
    currentUser : null,
    init: function(){
        if($("#CharacterMenu").length>0) return;
        $("<ul/>").attr("id","CharacterMenu").addClass("contextMenu").appendTo(document.body);
        $("#CharacterMenu").append('<li class="header"></li>');
        $("#CharacterMenu").append('<li class="ministatus"><img src="' + staticdomain + 'images/noavatar.png"/><span/><div style="clear:left;"/></li>');
        $("#CharacterMenu").append('<li class="priv"><a href="#priv">Private Message</a></li>');
        $("#CharacterMenu").append('<li class="flist"><a href="#flist">F-List</a></li>');
        $("#CharacterMenu").append('<li class="ignoreadd"><a href="#ignoreadd">Ignore</a></li>');
        $("#CharacterMenu").append('<li class="ignoredel"><a href="#ignoredel">Unignore</a></li>');
        $("#CharacterMenu").append('<li class="report"><a href="#report">Report</a></li>');

        $("#CharacterMenu").append('<li class="seperator cm-chanop">Chanop</li>');
        $("#CharacterMenu").append('<li class="chanban cm-chanop"><a href="#chanban">Channel Ban</a></li>');
        $("#CharacterMenu").append('<li class="chankick cm-chanop"><a href="#chankick">Channel Kick</a></li>');

        $("#CharacterMenu").append('<li class="seperator cm-chanown">Channel owner tools</li>');
        $("#CharacterMenu").append('<li class="chanopadd cm-chanown"><a href="#chanopadd">+Chanop</a></li>');
        $("#CharacterMenu").append('<li class="chanopdel cm-chanown"><a href="#chanopdel">-Chanop</a></li>');

        $("#CharacterMenu").append('<li class="seperator cm-chatop">Chatop tools</li>');
        $("#CharacterMenu").append('<li class="accountban cm-chatop"><a href="#accountban">Account Ban</a></li>');
        $("#CharacterMenu").append('<li class="ipban cm-chatop"><a href="#ipban">IP Ban</a></li>');
        $("#CharacterMenu").append('<li class="chatkick cm-chatop"><a href="#chatkick">Chat Kick</a></li>');
        $("#CharacterMenu").append('<li class="altwatch cm-chatop"><a href="#altwatch">Alt Watch</a></li>');
        $("#CharacterMenu").append('<li class="timeout cm-chatop"><a href="#timeout">Timeout...</a></li>');
    }
};

FList.Chat.createChannel = function(){
    FList.Connection.send("CCR " + JSON.stringify({ channel: $('.ui-newchan-text').val() }));
    $("#chatui-tabs").tabs( "select" , 1 );
};

FList.Chat.Search = {

    kinkFields: "",

    go: function(){
        $("#f-panel-go").val("Searching...").attr("disabled",true);
        var searchdata={};
            searchdata.kinks = [];
            $("#search-panel-kinks .list select").each(function(i,el){
                searchdata.kinks.push($(this).val());
            });
        if($("#search-panel-genders .list select > option:selected").length>0){
            searchdata.genders = [];
            $("#search-panel-genders .list select > option:selected").each(function(i,el){
                searchdata.genders.push($(this).text());
            });
        }
        if($("#search-panel-orientations .list select > option:selected").length>0){
            searchdata.orientations = [];
            $("#search-panel-orientations .list select > option:selected").each(function(i,el){
                searchdata.orientations.push($(this).text());
            });
        }
        if($("#search-panel-roles .list select > option:selected").length>0){
            searchdata.roles = [];
            $("#search-panel-roles .list select > option:selected").each(function(i,el){
                searchdata.roles.push($(this).text());
            });
        }
        if($("#search-panel-positions .list select > option:selected").length>0){
            searchdata.positions = [];
            $("#search-panel-positions .list select > option:selected").each(function(i,el){
                searchdata.positions.push($(this).text());
            });
        }
        if($("#search-panel-languages .list select > option:selected").length>0){
            searchdata.languages = [];
            $("#search-panel-languages .list select > option:selected").each(function(i,el){
                searchdata.languages.push($(this).text());
            });
        }
        FList.Connection.send("FKS " + JSON.stringify(searchdata));
    },

    addKink: function(){
        if(FList.Chat.Search.kinkFields!==""){
            if($("#search-panel-kinks .list select").length>=5){
                FList.Common_displayNotice("You already have the limit of five kinks added to your search.");
            } else {
                $("#search-panel-kinks .list").append(FList.Chat.Search.kinkFields);
            }
        } else {
            FList.Common_displayNotice("Search field values are still loading. Hold on a moment and try again.");
        }
    },

    removeKink: function() {
        var kinks = $("#search-panel-kinks .list select");

        if (FList.Chat.Search.kinkFields !== ""){
            if (kinks.length === 1) {
                $("#search-panel-kinks .list select")[0].remove();
            } else {
               kinks[kinks.length - 1].remove();
            }
        } else {
            FList.Common_displayNotice(
                "Search field values are still loading." +
                "Hold on a moment and try again."
            );
        }
    },

    getPanel: function(){
        return '<div class="settings panel">' +
            '<div id="search-panel-kinks" class="panel">' +
            '<div class="search-tab-label"><span>Kinks</span></div>' +
            '<div class="list"></div></div>' +
            '<div id="search-panel-genders" class="panel">' +
            '<div class="search-tab-label"><span>Genders</span></div>' +
            '<div class="list"></div></div>' +
            '<div id="search-panel-orientations" class="panel">' +
            '<div class="search-tab-label"><span>Orientations</span></div>' +
            '<div class="list"></div></div><div id="search-panel-roles">' +
            '<div class="search-tab-label"><span>Roles</span></div>' +
            '<div class="list"></div></div>' +
            '<div id="search-panel-positions" class="panel">' +
            '<div class="search-tab-label"><span>Positions</span></div>' +
            '<div class="list"></div></div>' +
            '<div id="search-panel-languages" class="panel">' +
            '<div class="search-tab-label"><span>Languages</span></div>' +
            '<div class="list"></div></div>' +
            '<div id="search-panel-buttons" class="panel">' +
            '<input type="button" value="Search" id="search-panel-go" ' +
            'onclick="FList.Chat.Search.go();"/><br/>' +
            '<input type="button" id="search-panel-kinkadd" ' +
            'onclick="FList.Chat.Search.addKink();" value="+Kink"/>' +
            '<input type="button" id="search-panel-kinkrem" ' +
            'onclick="FList.Chat.Search.removeKink();" value="-Kink"/>' +
            '</div></div><div class="results panel"></div>';
    }

};


FList.Chat.isChatop = function(user){
    user = (!user) ? FList.Chat.identity.toLowerCase(): user.toLowerCase();

    return FList.Chat.opList.indexOf(user) !== -1;
};

FList.Chat.isSubscribed = function(){
    return parseInt($("#iss").val())===1;
};

FList.Chat.isChanop = function(channel, user) {
    var tab  = FList.Chat.TabBar.getTabFromId("channel", channel);
    user = (!user) ? FList.Chat.identity.toLowerCase(): user.toLowerCase();
    if (tab.type !== "channel") return false;
    if (FList.Chat.isChatop(user)) return true;
    return FList.Chat.channels.getData(tab.id).oplist.indexOf(user) !== -1;
};

FList.Chat.isChanOwner = function(channel, user) {
    if (FList.Chat.TabBar.activeTab.type !== "channel") return false;
    if (FList.Chat.isChatop()) return true;
    var chanops = FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id).oplist;
    if(chanops.length<1) return false;
    return FList.Chat.identity === chanops[0];
};

FList.Chat.getPrintClasses = function(name, channel){
    var classstring="AvatarLink";
    var userdata=FList.Chat.users.getData(name);
    classstring+=" Gender" + userdata.gender;
    classstring+=" Status" + userdata.status;
    if (jQuery.inArray(name.toLowerCase(), FList.Chat.ignoreList) !== -1) classstring+=" AvatarBlocked";
    if(jQuery.inArray(name, FList.Chat.friendsList)!==-1) classstring+=" AvatarFriend";
    if(channel===false){
        if(FList.Chat.isChatop(name)) classstring+=" OpLink";
        //todo: friend, block.
    } else {
        var channeldata=FList.Chat.channels.getData(channel);
        if(channeldata.owner===name) classstring+=" ChanOwnerLink";
        if(FList.Chat.isChatop(name) && channeldata.owner!==name) classstring+=" OpLink";
        if(FList.Chat.isChanop(channel, name) && !FList.Chat.isChatop(name) && channeldata.owner!==name) classstring+=" ChanOpLink";
        //todo: friend, block.
    }
    return classstring;
};

FList.Chat.UserBar = new function UserBar() {
    this.hide = function(){ $("#user-bar").hide();};
    this.show = function(){ $("#user-bar").show();$( "#user-bar" ).resizable("destroy");$( "#user-bar" ).resizable({ handles: "w", maxWidth: 400, minWidth: 50, resize: function(){ $( "#user-bar" ).css("left", "0px");FList.Chat.UI.resize();$(".user-view-tab").css("width", (($("#user-bar").outerWidth()/2)-11) + 'px'); } });};

    this.removeUser = function(name){
        name=name.toLowerCase();
        if($("#user-bar span[rel='" + name + "']").length>0){
            $("#user-bar span[rel='" + name + "']").remove();
            var usrs=parseInt($("#user-view-avatars").html())-1;
            $("#user-view-avatars").html(usrs + '');
        }
    };

    this.updateUser = function(name){
        if($("#user-bar span[rel='" + name + "']").length>0){
            if($("#user-bar .section-ops span[rel='" + name + "']").length===0){//if not in the op list
                FList.Chat.UserBar.removeUser(name);
                FList.Chat.UserBar.insertSorted(name);
            } else {
                var linkclasses=FList.Chat.getPrintClasses(name, FList.Chat.TabBar.activeTab.id);
                $("#user-bar span[rel='" + name + "']").attr('class', linkclasses);
            }
        }
    };

    this.insertSorted = function(user){
        var channeldata=FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id);
        var isFriend=(jQuery.inArray(user, FList.Chat.friendsOnline)!==-1) || (jQuery.inArray(user, FList.Chat.bookmarksOnline)!==-1);
        var target=$("#user-bar .section-default");
        var linkclasses=FList.Chat.getPrintClasses(user, FList.Chat.TabBar.activeTab.id);
        if(user===channeldata.owner || FList.Chat.isChanop(FList.Chat.TabBar.activeTab.id, user) || FList.Chat.isChatop(user)) {
            html="<span class='" + linkclasses + "' rel='" + user.toLowerCase() + "'><span class='rank'></span>" + user + "</span>";
            target=$("#user-bar .section-ops");
        } else if(isFriend){
            html="<span class='" + linkclasses + "' rel='" + user.toLowerCase() + "'>" + user + "</span>";
            target=$("#user-bar .section-friends");
        } else if(linkclasses.indexOf("StatusLooking")>-1){
            html="<span class='" + linkclasses + "' rel='" + user.toLowerCase() + "'>" + user + "</span>";
            target=$("#user-bar .section-looking");
        } else {
            html="<span class='" + linkclasses + "' rel='" + user.toLowerCase() + "'>" + user + "</span>";
        }
        //alphabetically sorted insert.
        target.children("span").each(function(index){
            var elName=$(this).text().replace(/[^a-z0-9]/gi,'').toLowerCase();
            if(user.replace(/[^a-z0-9]/gi,'').toLowerCase()<elName){
                $(html).insertBefore(this);
                html="";
            }
        });
        var usrs=parseInt($("#user-view-avatars").html())+1;
        $("#user-view-avatars").html(usrs + '');
        if(html!=="") target.append(html);
    };

    this.renderTheWholeFuckingThing = function(renderavatars){
        FList.Chat.userListMode=renderavatars;
        $(".user-view-tab").removeClass("list-item-important");
        if(renderavatars)
            $("#user-view-avatars").addClass("list-item-important");
        else
            $("#user-view-default").addClass("list-item-important");
        if(FList.Chat.TabBar.activeTab.type==="channel"){
            var channeldata=FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id);
            var users=channeldata.userlist.sort(function (a, b) {
                var x = a.replace(/[^a-z0-9]/gi,'').toLowerCase();
                var y = b.replace(/[^a-z0-9]/gi,'').toLowerCase();
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });//sort();
            $("#user-view-avatars").html(users.length + '');

            $("#user-bar .user-bar-content").html(users.length===0 ? "&nbsp;" : "");
            var ophtml="";
            var html="";
            var friendhtml="";
            var lookinghtml="";
            $.each(users, function(i, user){
                var isFriend=(jQuery.inArray(user, FList.Chat.friendsOnline)!==-1) || (jQuery.inArray(user, FList.Chat.bookmarksOnline)!==-1);
                var linkclasses=FList.Chat.getPrintClasses(user, FList.Chat.TabBar.activeTab.id);
                if(user===channeldata.owner || FList.Chat.isChanop(FList.Chat.TabBar.activeTab.id, user) || FList.Chat.isChatop(user)) {
                    ophtml+="<span class='" + linkclasses + "' rel='" + user.toLowerCase() + "'><span class='rank'></span>" + user + "</span>";
                } else if(isFriend){
                        friendhtml+="<span class='" + linkclasses + "' rel='" + user.toLowerCase() + "'>" + user + "</span>";
                } else if(linkclasses.indexOf("StatusLooking")>-1){
                        lookinghtml+="<span class='" + linkclasses + "'  rel='" + user.toLowerCase() + "'>" + user + "</span>";
                } else {
                        html+="<span class='" + linkclasses + "' rel='" + user.toLowerCase() + "'>" + user + "</span>";
                }
            });
            $("#user-bar .user-bar-content").append((ophtml!=="" ? "<div class='user-view-section section-ops'>" + ophtml + "</div>" : "") + (friendhtml!=="" ? "<div class='user-view-section section-friends'>" + friendhtml + "</div>" : "")  + (lookinghtml!=="" ? "<div class='user-view-section section-looking'>" + lookinghtml + "</div>" : "")  + "<div class='user-view-section section-default'>" + html + "</div>");
        }
    };
    this.create = function(){
        $("#user-view-default").click(function(){
            FList.Chat.UserBar.renderTheWholeFuckingThing(false);
        });
        //$("#user-view-avatars").click(function(){
         //   FList.Chat.UserBar.renderTheWholeFuckingThing(true);
        //});

        if(FList.Chat.Settings.current.disableUserList){
            FList.Chat.UserBar.hide();
        } else {
            FList.Chat.UserBar.show();
        }
    };
};
/**
 * 81 Q BOLD 
 * 87 W ITALIC
 * 69 E UNDERLINE
 * 82 R STRIKE
 * 65 A SUBSCRIPT
 * 83 S SUPERSCRIPT
 * 68 D URL
 * 70 F ICON
 */
FList.Chat.TypingArea = {
    create: function(){
        $("#message-field").keydown(function(e){
            var linestore,
                start,
                end;

            $(".autocompletelink").each(function(i, el){ $(this).replaceWith($(this).text()); });
            if(e.which===9 && !e.ctrlKey){
                e.preventDefault();
                FList.Chat.AutoComplete.complete();
            }
            FList.Chat.TypeState.update();
            FList.Chat.TypingArea.indicate();
            if(e.which===38 && e.ctrlKey) { e.stopPropagation();FList.Chat.TabBar.tabToTheLeft(); }
            if(e.which===40 && e.ctrlKey) { e.stopPropagation();FList.Chat.TabBar.tabToTheRight(); }

            function formatStyle(el, tag) {
                start = el[0].selectionStart;
                end = el[0].selectionEnd;

                linestore = el.val().split("");

                linestore.splice(start, 0, "[" + tag + "]");
                linestore.splice(end + 1, 0, "[/" + tag + "]");

                el.val(linestore.join(""));
            }

            if (e.which === 81 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                formatStyle($(this), "b");
            } else if (e.which === 87 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                formatStyle($(this), "i");
            } else if (e.which === 69 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                formatStyle($(this), "u");
            } else if (e.which === 82 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                formatStyle($(this), "s");
            } else if (e.which === 65 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                formatStyle($(this), "sub");
            } else if (e.which === 83 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                formatStyle($(this), "sup");
            } else if (e.which === 68 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                start = $(this)[0].selectionStart;
                end = $(this)[0].selectionEnd;

                linestore = $(this).val().split("");

                linestore.splice(start, 0, "[url=");
                linestore.splice(end + 1, 0, "][/url]");

                $(this).val(linestore.join(""));
            } else if (e.which === 70 && e.altKey) {
                e.stopPropagation();
                e.preventDefault();

                formatStyle($(this), "icon");
            }
        });
        $("#message-field").keypress(function(e){
            FList.Chat.TypeState.update();
            FList.Chat.TypingArea.indicate();
            if(e.which===13 && !(e.shiftKey || e.ctrlKey)){
                e.preventDefault();
                FList.Chat.Input.handle($("#message-field").val());
            }
        });
        $("#message-field").keyup(function(e){
            FList.Chat.TypeState.update();
            FList.Chat.TypingArea.indicate();
            FList.Chat.IdleTimer.reset();
        });
        $( "#typing-area" ).resizable("destroy");
        $( "#typing-area" ).resizable({ handles: "n", maxHeight: 300, minHeight: 50, resize: function(){ FList.Chat.UI.resize(); } });
    },
    update: function(){
        $( "#typing-area" ).css("top","0px");$( "#typing-area textarea" ).css("height", $("#typing-area").height() -8 );$(".send-input-single").css("height",$("#typing-area").height()-4 + "px");$(".send-input-choice").css("height",(($("#typing-area").height())/2) + "px");$("#typing-send-actions").css("height", $("#typing-area").height());
        $("#typing-area").css("width", "auto");
    },
    indicate: function(){
        var maxheight=$("#message-field").outerHeight();
        var curlength=$("#message-field").val().length;
        var maxlength=0;
        var type=FList.Chat.TabBar.activeTab.type;
        maxlength=type==="channel" ? parseInt(FList.Chat.serverVars["chat_max"]) : parseInt(FList.Chat.serverVars["priv_max"]);
        if(type==="console") maxlength=1024;
        var percent=parseInt((curlength/maxlength)*100);
        $("#typing-indicator").css("height", parseInt((maxheight/100)*percent) + 'px');
        if(percent>95 && percent<100){
            $("#typing-indicator").css("background-color", '#f26d30');
        } else if(percent>90 && percent <=95){
            $("#typing-indicator").css("background-color", '#f2f252');
        } else if (percent===100){
            $("#typing-indicator").css("background-color", '#aa2032');
        } else {
            $("#typing-indicator").css("background-color", '#000000');
        }
    }
};

FList.Chat.InfoBar = new function InfoBar() {

    this.update = function(){
        if(FList.Chat.TabBar.activeTab.type==="channel"){
            if(FList.Rights.has("admin") || FList.Rights.has("chat-chatop") || FList.Chat.isChanop(FList.Chat.TabBar.activeTab.id, FList.Chat.identity)){
                $("#info-bar-channel").show();
                if(!FList.Chat.isChanOwner() && !FList.Rights.has("admin") && !FList.Rights.has("chat-chatop")){
                    $("info-bar-channel").FlexMenu("item-disable", "channel-tools-delete");
                } else {
                    $("info-bar-channel").FlexMenu("item-enable", "channel-tools-delete");
                }
            }
            var data=FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id);
            var chanlink=$('<a class="ChannelLink">' + data.title + '</a>');
            if(FList.Chat.TabBar.activeTab.id.toLowerCase().substring(0,4)==="adh-") chanlink=$('<a class="SessionLink">' + data.title + '</a>');
            $("#info-bar-actions").html(chanlink);
            $("#info-bar-actions").append("<br/><div class='actions'><input type='radio' value='both' id='showboth' name='showmode' checked='checked' /><label for='showboth'>Both</label><input type='radio' id='showchat' name='showmode' value='chat'/><label for='showchat'>Chat</label><input type='radio' id='showads' name='showmode' value='ads'/><label for='showads'>Ads</label></div>");
            $("#info-bar-actions .actions").buttonset();
            $("#info-bar-actions .actions input").attr("disabled",false);
            $("#show" + data.userMode).attr("checked", true);
            if(data.mode==="chat") $("#showads, #showboth").attr("disabled",true);
            if(data.mode==="ads") $("#showchat, #showboth").attr("disabled",true);
            $("input[name='showmode']").change(function(event){
                data.userMode=$(this).val().toLowerCase();
                FList.Chat.TabBar.printLogs(FList.Chat.TabBar.activeTab, data.userMode);
            });
            $("#info-bar-actions .actions input").button("refresh");
            $("#info-bar-actions a").css("white-space","nowrap").click(function(){ FList.Chat.openChannelChat(FList.Chat.TabBar.activeTab.id, false); });
            $("#info-bar-main > div").html(data.joined ? FList.ChatParser.parseContent(data.description) : data.title);
            if(data.joined===false) $("#info-bar-main > div").append("<br/><b>This room no longer exists or is not joined.</b>");
        } else if(FList.Chat.TabBar.activeTab.type==="user"){
            $("#info-bar-channel").hide();
            var data=FList.Chat.users.getData(FList.Chat.TabBar.activeTab.id);
            var classes=FList.Chat.getPrintClasses(data.name, false);
            $("#info-bar-actions").html("<span class='" + classes + "'><span class='rank'></span>" + data.name + "</span><br/><div class='actions'><button id='info-bar-flist' title='F-List Profile'></button></div>");
            if(FList.Chat.isSubscribed()){
                $("#info-bar-actions .actions").append("<button id='info-bar-memo' title='Memo'></button>");
                $("#info-bar-memo").button({text:false, icons: { primary: "ui-icon-document-b"}}).click(function(){ FList.Memo.prepareData(data.name); });
            }
            $("#info-bar-flist").button({ text: false, icons: { primary: "ui-icon-person" }
            }).click(function(){ window.open(domain + "c/" + data.name.toLowerCase() + "/"); });
            $("#info-bar-actions .actions").buttonset();
            $("#info-bar-main > div").html((data.status==="Crown" ? "Cookie" : data.status) + (data.statusmsg!=="" ? (", " + FList.ChatParser.parseContent(data.statusmsg)) : ""));
        } else {
            $("#info-bar-channel").hide();
            $("#info-bar-actions").html(FList.Chat.users.count + " users connected.");
            $("#info-bar-main > div").html("");
            $("#info-bar-main > div").append("You are viewing the console.");
        }
        $( "#info-bar-main > div" ).resizable("destroy");
        $( "#info-bar-main > div" ).resizable({ handles: "s", maxHeight: 300, minHeight: 50, resize: function(){
        $( "#info-bar-main > div" ).css({"top":"0px","width":"auto"});FList.Chat.UI.resize(); } });
    };

};

FList.Chat.Tab = function (_tab,_type,_id){
    this.tab=_tab;//jquery element of the tab.
    this.type=_type;
    this.id=_id;
    this.logs=[];
    this.pending=0;
    this.mentions=0;
    this.closed=false;
    this.textfield="";
    this.pinned=false;
    this.metyping = false;
    this.lastAd=0;
};

FList.Chat.TabBar = new function TabBar() {

    this.list= [];
    this.activeTab=false;//otherwise contains a reference to the active tab with ALL data. handy :3
    this.lastClose=false;

    this.printLogs = function(tab, mode){
        var html,logs,cutoff;
        html = "";
        logs = [];//grab last amount of visible logs
        $("#chat-content-chatarea > div").html(tab.logs.length===0 ? "&nbsp;" : "");
        if(tab.logs.length>0){
            cutoff=tab.logs.length>=FList.Chat.Settings.current.visibleLines ? tab.logs.length-FList.Chat.Settings.current.visibleLines : 0;
            for(var i = tab.logs.length-1;i>=cutoff;i--){
                logs.push(tab.logs[i]);
            }
            logs.reverse();//fix order
            $.each(logs, function(i, log){
                if(mode==="chat") {
                    if(log.type!=="ad") html+=log.html;
                } else if(mode==="ads"){
                    if(log.type!=="chat" && log.type!=="rp") html+=log.html;
                } else {
                    html+=log.html;
                }
            });
            $("#chat-content-chatarea > div").append(html);
            FList.Chat.scrollDown();
        }
    };

    this.setActive = function (_type, _id) {

        if(this.activeTab!==false){
            FList.Chat.TypeState.check(true);
            if(this.activeTab.type==="channel" && _type!=="channel") FList.Chat.UserBar.hide();
            if(this.activeTab.type!=="channel" && _type==="channel" && !FList.Chat.Settings.current.disableUserList) FList.Chat.UserBar.show();
        }

        var tab=this.getTabFromId(_type, _id);
        tab.pending=0;
        tab.mentions=0;
        FList.Chat.Activites.noIndicate(tab.tab);
        $(".tab-item").removeClass("list-item-important");
        tab.tab.addClass("list-item-important");

        if(this.activeTab!==false){
            this.activeTab.textfield=$("#message-field").val();
            $("#message-field").val(tab.textfield);
        }

        this.activeTab=tab;

        if(tab.type==="channel"){
            $("#message-field").attr("maxlength",parseInt(FList.Chat.serverVars["chat_max"]));
            $("#typing-send-actions").html("<input type='button' class='send-input-choice send-input-chat' value='Send Chat'><input type='button' class='send-input-choice send-input-ad' value='Send Ad'>");
            if(FList.Chat.channels.getData(_id).mode==="ads") $(".send-input-chat").attr("disabled", true);
            if(FList.Chat.channels.getData(_id).mode==="chat") $(".send-input-ad").attr("disabled", true);
        } else if(tab.type==="user"){
            $("#message-field").attr("maxlength",parseInt(FList.Chat.serverVars["priv_max"]));
            $("#typing-send-actions").html("<input type='button' class='send-input-single send-input-chat' value='Send Chat'>");
        } else {
            $("#message-field").attr("maxlength",1024);
            $("#typing-send-actions").html("<input type='button' class='send-input-single send-input-chat' value='Send Chat'>");
        }

        $("#typing-send-actions input").button();
        $(".send-input-chat").click(function(){ FList.Chat.Input.handle($("#message-field").val()); });
        $(".send-input-ad").click(function(){ FList.Chat.Roleplay.sendAd(FList.Chat.TabBar.activeTab.id, $("#message-field").val()); });
        this.printLogs(tab, _type ==="channel" ? FList.Chat.channels.getData(_id).userMode : "both");
        if(_type==="channel") FList.Chat.UserBar.renderTheWholeFuckingThing(FList.Chat.userListMode);
        FList.Chat.InfoBar.update();
        if(FList.Chat.Settings.current.keepTypingFocus) $("#message-field").focus();
        FList.Chat.TypingArea.indicate();
        FList.Chat.TypingArea.update();
        FList.Chat.Roleplay.update(_type==="channel" ? _id : "");

        if (_id.toLowerCase() in FList.tNotice.tabTally) {
            FList.tNotice.readMsg(_id.toLowerCase());
        }

    };

    /**
     * Tab repopulation. (For both soft and hard logins)
     */
    this.loadSavedTabs = function(){
        var userString = FList.Chat.identity.toLowerCase().replace(/ /g,"_"),
            saveString = localStorage["tabs_" + userString],
            saveData = (saveString) ? JSON.parse(saveString): undefined;

        if (!window.Storage) return;
        if (!saveString) {
            localStorage['tabs_' + userString] = '[]';
            saveData = [];
        }
        if (!saveString && !FList.Chat.restoreTabs.length) {
            return;
                }
        if (!FList.Chat.restoreTabs.length && saveData) {
            $.each(saveData,
                function(i, curTab) {
                    var local = FList.Chat.TabBar,
                        chan,
                        tabObj,
                        isPinned;
                    if (curTab.type === 'channel')
                        FList.Chat.openChannelChat(curTab.id, false);
                    if (curTab.type === 'user')
                        FList.Chat.openPrivateChat(curTab.title, false);

                    tabObj = local.getTabFromId(curTab.type, curTab.id).tab;
                    isPinned = local.getTabFromElement(tabObj).pinned;
                    if (isPinned) {
                        tabObj.children(".pin")
                              .addClass("pin-enabled");
                } else {
                        local.togglePin(tabObj);
                }
            });
        } else {
            $.each(FList.Chat.restoreTabs,
                function(i, curTab) {
                    console.log(curTab, 'restore');
                    if (curTab.type === "channel") {
                        FList.Chat.openChannelChat(curTab.id, false)
                    } else if (curTab.type === "user") {
                        FList.Chat.openPrivateChat(curTab.id, false);
                }
            });
            FList.Chat.restoreTabs=[];
        }
    };

    this.saveTabs = function(){
        var savedata = [];
        $("#tab-bar > div").children().each(function(){
            var tab=$(this);
            var tabdata=FList.Chat.TabBar.getTabFromElement(tab);
            if(!tabdata.closed && tabdata.pinned){
                if(tabdata.type==="user") { savedata.push({"type":tabdata.type,"id":tabdata.id,"title":FList.Chat.users.getData(tabdata.id).name});}
                if(tabdata.type==="channel"){

                    if(tabdata.id.toLowerCase()!=="adh-staffroomforstaffppl" && tabdata.id.toLowerCase()!=="adh-uberawesomestaffroom"){
                        savedata.push({"type":tabdata.type,"id":tabdata.id,"title":FList.Chat.channels.getData(tabdata.id).name});
                    }
                }
            }
        });
        localStorage["tabs_" + FList.Chat.identity.toLowerCase().replace(/ /g,"_")]=JSON.stringify(savedata);
    };

    this.tabToTheLeft = function(){
        var tab=false;var lastTab=false;
        $("#tab-bar > div").children().each(function(){
            if(tab!==false  && FList.Chat.TabBar.getTabFromElement(tab).closed===false) lastTab=tab;
            tab=$(this);
            if(FList.Chat.TabBar.activeTab.tab[0]===tab[0]) return false;
        });
        if(lastTab!==false){
            var tabdata=FList.Chat.TabBar.getTabFromElement(lastTab);
            this.setActive(tabdata.type, tabdata.id);
        }
    };

    this.tabToTheRight = function(){
        var tab=false;var found=false;
        $("#tab-bar > div").children().each(function(){
            tab=$(this);
            if(found  && FList.Chat.TabBar.getTabFromElement(tab).closed===false) return false;
            if(FList.Chat.TabBar.activeTab.tab[0]===tab[0]) found=true;
        });
        if(found){
            var tabdata=FList.Chat.TabBar.getTabFromElement(tab);
            this.setActive(tabdata.type, tabdata.id);
        }
    };

    this.create = function(){
        $("#tab-bar > div").unbind("mouseenter mouseleave mousemove");
        clearInterval(FList.Chat.TabBar.scrollInterval);
        FList.Chat.TabBar.scrollInterval = null;
        FList.Chat.TabBar.scrollFunction = function(){
            if(FList.Chat.Settings.current.tabsOnTheSide){
                $("#tab-bar > div").scrollTop($("#tab-bar > div").scrollTop() + FList.Chat.TabBar.scrollSpeed);
            } else {
                $("#tab-bar > div").scrollLeft($("#tab-bar > div").scrollLeft() + FList.Chat.TabBar.scrollSpeed);
            }
        };
        $("#tab-bar > div").mouseenter(function(e) {
            e.preventDefault();
            if (FList.Chat.TabBar.scrollInterval) return;
            FList.Chat.TabBar.scrollInterval = setInterval(FList.Chat.TabBar.scrollFunction, 20);
        });
        $("#tab-bar > div").mouseleave(function(e) {
            e.preventDefault();
            clearInterval(FList.Chat.TabBar.scrollInterval);
            FList.Chat.TabBar.scrollInterval = null;
        });
        $("#tab-bar > div").mousemove(function(e){
            e.preventDefault();
            var t = $("#tab-bar > div");
            if(FList.Chat.Settings.current.tabsOnTheSide){
                var y = e.pageY - t.offset().top;
                var tabh=40;//40
                var offs = 80;//3 x tabh, 120
                if (y < offs) {
                    FList.Chat.TabBar.scrollSpeed = 0 - parseInt((1 - (y / offs)) * tabh);
                } else if (y > t.height() - offs) {
                    FList.Chat.TabBar.scrollSpeed = parseInt((1 - ((t.height() - y) / offs)) * tabh);
                } else {
                    FList.Chat.TabBar.scrollSpeed = 0;
                }
            } else {
                var x = e.pageX - t.offset().left;
                var offs = 120;
                var tabw=40;
                if (x < offs) {
                    FList.Chat.TabBar.scrollSpeed = 0 - parseInt((1 - (x / offs)) * tabw);
                } else if (x > t.width() - offs) {
                    FList.Chat.TabBar.scrollSpeed = parseInt((1 - ((t.width() - x) / offs)) * tabw);
                } else {
                    FList.Chat.TabBar.scrollSpeed = 0;
                }
            }
        });
    };

    this.getTabFromId = function(_type, _id){
        var found=false;
        _id=_id.toLowerCase();
        $.each(this.list, function(i, item){
            if(item.type===_type && item.id.toLowerCase()===_id){
                found=item;
                return false;
            }
        });
        return found;
    };
    this.makeSortable = function(){
        if($("#tab-bar > div").sortable) { $("#tab-bar > div").sortable( "destroy" ); }
        $("#tab-bar > div").sortable({
            update: function(event, ui){ FList.Chat.TabBar.saveTabs(); },
            placeholder: 'tab-sortable-temp',
            items: '.tab-item-sortable',
            helper: function(e, ui) { ui.children().each(function() { $(this).width($(this).width()); }); return ui; },
            distance: '20',
            axis: FList.Chat.Settings.current.tabsOnTheSide ? 'y' : 'x'
        });
    };
    this.getTabFromElement = function(el){
        var found=false;
        $.each(this.list, function(i, item){
            if(item.tab[0]===el[0]){
                found=item;
                return false;
            }
        });
        return found;
    };

    this.togglePin = function(tab){
        var tabdata=FList.Chat.TabBar.getTabFromElement(tab);
        tabdata.pinned=!tabdata.pinned;
        if(tabdata.pinned) tab.children(".pin").addClass("pin-enabled");
        else tab.children(".pin").removeClass("pin-enabled");
        FList.Chat.TabBar.saveTabs();
    };

    this.addTab = function(_type, _title, _id){
        var tabEl=$("<div></div>");
        if(_type==="user") tabEl.append("<a class='tpn' style='display:none;'></a>");
        if(_type!=="console") {
            if(!((_id.toLowerCase()==="adh-staffroomforstaffppl" || _id.toLowerCase()==="adh-uberawesomestaffroom") && _type==="channel")){
                tabEl.append("<a class='pin'></a>");
                tabEl.children(".pin").mousedown(function(e){
                    e.stopPropagation();
                    FList.Chat.TabBar.togglePin(tabEl);
                });
            } else {
                tabEl.append("<a class='pin-ph'></a>");
            }
            tabEl.append("<a class='close'></a>");
            tabEl.children(".close").mousedown(function(e){
                e.stopPropagation();
                FList.Chat.TabBar.closeTab(tabEl);
            });
        }
        tabEl.addClass("panel list-highlight tab-item tab-type-" + _type);
        if(_type!=="console") tabEl.addClass("tab-item-sortable");
        if(_type==="user") tabEl.append("<img src='" + staticdomain + "images/avatar/" + _id.toLowerCase() + ".png'/>");
        if(_type==="channel") tabEl.append("<img src='" + staticdomain + "images/icons/" + (_type==="channel" && _id.toLowerCase().substring(0,4)==="adh-" ? "key.png" : "hash.png") + "'/>");
        if(_type==="console") tabEl.append("<img src='" + staticdomain + "images/icons/console.png'/>");
        this.list.push(new FList.Chat.Tab(tabEl, _type, _id));
        FList.Chat.TabBar.updateTooltip(this.getTabFromId(_type, _id));
        $("#tab-bar > div").append(tabEl);
        tabEl.mousedown(function(){ FList.Chat.TabBar.setActive(_type,_id); });
        FList.Chat.TabBar.makeSortable();
    };

    this.closeTab = function(el){
        var tabdata=this.getTabFromElement(el);
        if(FList.Chat.TabBar.activeTab.type===tabdata.type && FList.Chat.TabBar.activeTab.id===tabdata.id) this.tabToTheLeft();
        if(tabdata.type==="channel") {
            var channeldata=FList.Chat.channels.getData(tabdata.id);
            if(channeldata.joined){
                FList.Connection.send("LCH " + JSON.stringify({ "channel": tabdata.id }));

                channeldata.joined = false;
            } else {
                this.removeTab(tabdata.type, tabdata.id);
            }
        }

        if(tabdata.type==="user") {
            this.removeTab(tabdata.type, tabdata.id);

        }

        if (tabdata.id.toLowerCase() in
           FList.tNotice.tabTally) {
            FList.tNotice.readMsg(tabdata.id.toLowerCase());
        }

    };

    this.removeTab = function(_type, _id){
        var tab=this.getTabFromId(_type, _id);
        FList.Chat.Activites.noIndicate(tab.tab);
        tab.tab.fadeOut("fast");
        $(tab.tab).qtip('toggle', false);
        tab.mentions=0;
        tab.pending=0;
        tab.closed=true;
        if(tab.pinned) FList.Chat.TabBar.saveTabs();
        lastClose=tab;
        $("#header-fchat").FlexMenu("item-enable", "mnu-tab-undo");
    };

    this.undoClose = function(){
        if(lastClose!==false){
            if(lastClose.type==="channel") FList.Chat.openChannelChat(lastClose.id, false);
            else FList.Chat.openPrivateChat(lastClose.id, false);
            lastClose=false;
            $('#Notice').hide();
            $("#header-fchat").FlexMenu("item-disable", "mnu-tab-undo");
            $("#header-fchat").FlexMenu("hide");
        }
    };

    this.refreshClosed = function(){
        $.each(this.list, function(i, item){
            if(item.closed){
                item.tab.hide();
            } else {
                item.tab.show();
            }
        });
    };

    this.updateTooltip = function(tab){
        if(tab!==false){
            var title=tab.id;
            var content="";
            if(tab.type==="channel"){
                var channeldata=FList.Chat.channels.getData(tab.id);
                title=channeldata.title;
                content=channeldata.description;
                if(content.length>255) content=content.substring(0,255) + " (...)";
                content = FList.ChatParser.parseContent(content.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ '' +'$2'));
            }
            if(tab.type==="user"){
                var userdata=FList.Chat.users.getData(tab.id);
                var tab=FList.Chat.TabBar.getTabFromId("user", tab.id);
                if(tab!==false){
                    title=userdata.name;
                    content=userdata.status + (userdata.statusmsg!=="" ? ", " + userdata.statusmsg : "");
                    content = FList.ChatParser.parseContent(content.replace(/\[icon\].*\[\/icon\]/g, ""));
                }
            }
            if(tab.type==="console"){
                title="Console";
                content="You are looking at the console. Developers: To enable raw output of F-Chat network activity in the console, set FList.Chat.debug to true.";
            }
            tab.tab.attr("title", title);
        }
    };
};

FList.Chat.Roleplay = {
    timer: 0,

    isRoleplay: function(message){ return (message.substring(0,4)=="/me " || message.substring(0,4)=="/me'") ? true : false; },

    sendAd: function(channel, message){
        var tab=FList.Chat.TabBar.getTabFromId("channel", channel);
        if(this.canPost(channel)<=0){
            this.setPosted(channel);
            if(jQuery.trim(message).length>0){
                if(FList.Chat.Settings.current.html5Audio) FList.Chat.Sound.playSound("chat");
                FList.Connection.send("LRP " + JSON.stringify({ "channel": channel, "message": message }));
                FList.Chat.printMessage({msg: FList.Chat.Input.sanitize(message),
                                        to: tab, from: FList.Chat.identity, type: "ad", log: true});
                $("#message-field").val("");
            } else {
                FList.Common_displayError("You didn't enter a message.");
            }
        } else {
            FList.Common_displayError("You have to wait " + (this.canPost(channel)/1000) + " seconds before you can post another ad here.");
        }
    },

    timerClock: function(channel){
        this.update(channel);
    },

    setPosted: function(channel){
        var tab=FList.Chat.TabBar.getTabFromId("channel", channel);
        tab.lastAd = new Date().getTime();
        this.update(channel);
        clearTimeout(FList.Chat.Roleplay.timer);
        FList.Chat.Roleplay.timer=setTimeout(function(){ FList.Chat.Roleplay.timerClock(channel); }, FList.Chat.serverVars["lfrp_flood"] * 1000);
    },

    canPost: function(channel){
        var tab=FList.Chat.TabBar.getTabFromId("channel", channel);
        var remaining = parseInt(tab.lastAd-(new Date().getTime() - FList.Chat.serverVars["lfrp_flood"] * 1000));
        return remaining>0 ? remaining : 0;
    },

    //tab switch
    update: function(channel){
        clearTimeout(FList.Chat.Roleplay.timer);
        if(FList.Chat.TabBar.activeTab.type!=="channel") return;
        if(FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id).mode=="chat") return;
        if(this.canPost(channel)>0){
            $(".send-input-ad").attr("disabled", true);
            $(".send-input-ad").addClass("Busy").css({"background-repeat":"no-repeat","background-position":"left center"});
            FList.Chat.Roleplay.timer=setTimeout(function(){ FList.Chat.Roleplay.timerClock(channel); }, this.canPost(channel)+1000);
        } else {
            $(".send-input-ad").button("enable").removeClass("Busy");
        }
    }


};

/**
 * Print message on tab's window buffer.
 *
 * @param {{msg:String, [to]:Object, from:String, type:String, [log]:*}} args
 * Optional arguments will be allotted with the current active tab (to) and logging (persistence) will be true by default.
 */
FList.Chat.printMessage = function(args) {
    var scrollDown = false,
        highlight = false,
        isDefault = (!args.to || args.to === {} ||
                    args.to.id.toLowerCase() === this.TabBar.activeTab.id.toLowerCase()) ?
                        true: false,
        classList = (
            "chat-message chat-type-" +
            (args.type === "roll" ? "system":args.type)
        ),
        tabFocus = FList.Chat.TabBar.activeTab.id.toLowerCase(),
        ct = new Date(),
        time = (ct.getHours() < 10 ? "0" + ct.getHours(): ct.getHours()) + ":" +
               (ct.getMinutes() < 10 ? "0" + ct.getMinutes(): ct.getMinutes()),
        regx,
        avatarclasses,
        html = "",
        tab,
        showmode,
        display,
        isTracked;

    args.to = (isDefault) ? this.TabBar.activeTab: args.to;

    args.log = (args.log === undefined) ? true: args.log;

    if (!args.from || !args.msg || !args.type) {
        throw "Mandatory arguments missing on printMessage call.";
    }

    if (args.from === this.identity) {
        classList += " chat-type-own";
    }

    if ($("#chat-content-chatarea > div").prop("scrollTop") >=
       ($("#chat-content-chatarea > div").prop("scrollHeight") -
        $('#chat-content-chatarea > div').height()) - 50) {
            scrollDown=true;
    }

    if(args.msg.substring(0, 6) === "/warn " && args.to.type === "channel") {
        if (this.isChanop(args.to.id, args.from)) {
                args.msg = args.msg.substring(6);
                classList += " chat-type-warn";
        }
    }

    args.msg = this.processMessage(args.to.type, args.type, args.msg);

    if (this.Settings.current.highlightMentions && args.type !== "system") {
            for (i = 0; i < this.Settings.current.highlightWords.length; ++i) {
                regx = new RegExp("\\b" +
                                this.Settings.current.highlightWords[i] +
                                "('s)?\\b", "i");

                if (regx.test(args.msg) && args.from !== this.identity &&
                    args.to.type === "channel") {
                        highlight = true;
                }
            }

            regx = new RegExp("\\b" + this.identity + "('s)?\\b", "i");

            if (!highlight && regx.test(args.msg) &&
                this.from !== this.identity && args.to.type === "channel") {
                    highlight = true;
            }
    }

    if (highlight) {
        classList += " chat-type-mention";
    }

    avatarclasses = this.getPrintClasses(
        args.from,
        ((args.to.type === "channel") ? args.to.id: false)
    );

    if (args.type !== "chat" && args.type !== "ad" && args.type !== "rp") {
        avatarclasses = "";
    }

    if (args.type === "rp") {
        html = "<div class='" + classList + "'><span class='timestamp'>[" +
                time + "]</span> <i><span class='" + avatarclasses +
                "'><span class='rank'></span>" + args.from + "</span>" +
                args.msg + "</i></div>";
    }

    if (args.type === "chat" || args.type === "error" || args.type === "system" ||
        args.type === "ad") {
            html = "<div class='" + classList + "'><span class='timestamp'>[" +
                    time + "]</span> <span class='" + avatarclasses +
                    "'><span class='rank'></span>" + args.from + "</span>: " +
                    args.msg + "</div>";
    }

    tab = this.TabBar.getTabFromId(args.to.type, args.to.id);

    showmode = (args.to.type === "channel") ? this.channels.getData(args.to.id).userMode: "both";

    display = ((showmode === "ads" && (args.type === "chat" || args.type === "rp")) ||
                (showmode === "chat" && args.type === "ad")) ? false: true;

    if (isDefault) {
            if (display) {
                if (!tab.logs.length) {
                    $("#chat-content-chatarea > div").html("");
                }

                $("#chat-content-chatarea > div").append(html);

                if (scrollDown) {
                    this.scrollDown();
                }

                this.truncateVisible();
            }
    }

    if (!isDefault || (tabFocus !== args.to.id.toLowerCase()) || !wfocus) {

        if (args.to.type === "channel") {
            if (display) {
                tab.pending += 1;
                if (highlight) {
                    tab.mentions += 1;
                    if (this.Settings.current.html5Audio) {
                        FList.Chat.Sound.playSound("attention");
                    }

                    if (this.Settings.current.html5Notifications) {
                        this.Notifications.message("A word/name was highlighted, by " + args.from +
                                                   " in " + args.to.id, args.msg.substring(0,100), staticdomain +
                                                   "images/avatar/" + args.from.toLowerCase() + ".png",
                                                   function(){
                                                        FList.Chat.TabBar.setActive(args.to.type, args.to.id);
                                                   });
                    }
                } else if (tab.tracking && args.type !== 'system') {
                    tab.mentions += 1;
                    if (this.Settings.current.html5Audio) {
                        FList.Chat.Sound.playSound("attention");
                    }
                }
            }
        }
        if (args.to.type === "user" && args.from !== FList.Chat.identity) {
            if (args.type === "chat" || args.type === "rp") {
                tab.mentions += 1;

                if (this.Settings.current.html5Audio) {
                    this.Sound.playSound("attention");
                }

                if (this.Settings.current.html5Notifications) {
                    this.Notifications.message("You received a private message from " +
                                               args.from, args.msg.substring(0,100), staticdomain + "images/avatar/" +
                                               args.from.toLowerCase() + ".png",
                                               function() {
                                                   FList.Chat.TabBar.setActive(args.to.type, args.to.id);
                                               });
                }

            } else {
                tab.pending += 1;
            }
        }
    }

    if (args.log && tab.logs.length && tab.logs[tab.logs.length-1].scheduledDeletion) {
        tab.logs.pop();
    }

    if (args.log) {
        tab.logs.push({"type": args.type ,"by": args.from, "html": html});
        if(!this.Settings.current.enableLogging){
            if(tab.logs.length > this.Settings.current.visibleLines) {
                tab.logs.shift();
            }
        }
    } else if (!args.log && tab.logs.length === 0) {
        // This is here because if an unlogged printmessage is on the first line of the window,
        // it replaces all concurrent unlogged printmessages before it.
        tab.logs.push({"type": args.type ,"by": args.from, "html": html, scheduledDeletion: true});
    }


    if (args.from !== "System" &&
       (args.to.type === "user" || highlight || isTracked) &&
       (!wfocus || tabFocus !== args.to.id.toLowerCase())) {
            FList.tNotice.newMsg(args.to.id.toLowerCase());
    }

};

FList.Chat.Activites = {
    init: function(){
        clearInterval(FList.Chat.Activites.interval);
        FList.Chat.Activites.interval = null;
        FList.Chat.Activites.interval = setInterval(FList.Chat.Activites.indicate, 2000);
    },
    stop: function(){
        clearInterval(FList.Chat.Activites.interval);
    },
    noIndicate: function(el){
        el.stop();
        el.clearQueue();
        el.removeAttr('style');
    },
    flash: function(el,r,g,b,t){
        FList.Chat.Activites.noIndicate(el);
        el.css({"background":"none", "background-image":"none", "background-color":"rgba(" + r + ", " + g + ", " + b + ", 0)"});
            if(FList.Chat.Settings.current.flashTabIndicate === true){
                el.animate({ "backgroundColor": "rgba(" + r + ", " + g + ", " + b + ", 1)" }, t, function(){ el.animate({ "backgroundColor": "rgba(" + r + ", " + g + ", " + b + ", 0)" }, t, function(){ FList.Chat.Activites.noIndicate(el); }); });
            }else{
                FList.Chat.Activites.noIndicate(el);
                if(r === 255 && g === 255 && b === 255) return;
                el.css({"background":"none", "background-image":"none", "background-color":"rgba(" + r + ", " + g + ", " + b + ", 1)"});
            }
    },

    indicate: function(){
        $.each(FList.Chat.TabBar.list, function(i, item){
            if(item.closed===false){
                if(item.pending>0 && item.mentions===0) FList.Chat.Activites.flash(item.tab, 123, 137, 34, 1000);
                if(item.mentions>0) FList.Chat.Activites.flash(item.tab, 168, 31, 168, 1000);
            }
        });
    }
};

FList.Chat.Sound = {
    audiosupport: "none",
    sounds: [],
    init: function(){
        var audiotest=document.createElement('audio');
        if(typeof(Audio) === "function" && audiotest.canPlayType){
            FList.Chat.Sound.audiosupport="wav"
            if(("no" !== audiotest.canPlayType("audio/mpeg")) && ("" !== audiotest.canPlayType("audio/mpeg"))) FList.Chat.Sound.audiosupport="mp3";
            if(FList.Chat.Sound.audiosupport!="mp3" && ("no" != audiotest.canPlayType("audio/ogg")) && ("" !== audiotest.canPlayType("audio/ogg"))) FList.Chat.Sound.audiosupport="ogg";
            var pth= staticdomain + "sound/";
            var ext=FList.Chat.Sound.audiosupport;
            FList.Chat.Sound.sounds=[{id:"login","file":new Audio(pth + 'login.' + ext)},{id:"newnote","file":new Audio(pth + 'newnote.' + ext)}, {id:"attention","file":new Audio(pth + 'attention.' + ext)},{id:"chat","file":new Audio(pth + 'chat.' + ext)},{id:"system","file":new Audio(pth + 'system.' + ext)},{id:"modalert","file":new Audio(pth + 'modalert.' + ext)},{id:"logout","file":new Audio(pth + 'logout.' + ext)}];
        }
    },
    playSound : function(soundname){
        if(FList.Chat.Sound.audiosupport!=="none") {
            $.each(FList.Chat.Sound.sounds,function(i,snd){
                if(snd.id===soundname) snd.file.play();
            });
        }
    }
};

FList.Chat.Notifications = {
    init: function(){
        if (window.webkitNotifications) {
            window.webkitNotifications.requestPermission();
        } else if (window.Notification) {
            Notification.requestPermission(function (status) {
                    if (Notification.permission !== status) {
                        Notification.permission = status;
                    }
                });
        } else if (window.chrome && window.chrome.notifications) {
            chrome.notifications.onClicked.addListener(function (){
                    tabInstance();
                    window.focus();
                });
        }
    },
    message: function(title, message, image, tabInstance) {
        var valid;

        if (window.webkitNotifications) {
            if(window.webkitNotifications.checkPermission() === 0){
                var instance=window.webkitNotifications.createNotification(image,title, message.substr(0,100));
                instance.onclick = function() {
                    tabInstance();
                    window.focus();
                    this.cancel();
                };
                setTimeout(function(){
                    instance.cancel();//hide after ten secs.
                }, '10000');

                instance.show();
            }
        } else if (window.Notification) {
            if (Notification.permission === "granted") {
                (function() {
                    var instance = new Notification(
                        title,
                        {
                            icon: image,
                            body: message.substr(0,100)
                        }
                    );
                    instance.onclick = function() {
                        tabInstance();
                        window.focus();
                    };
                    setTimeout(function(){
                        instance.close();
                    }, 10000);
                }());
            }
        } else if (window.chrome && window.chrome.notifications) {
            valid = chrome.notifications.getPermissionLevel(function(status) {
                    return status === 'granted';
                });

            if (valid) {
                valid = chrome.notifications.create(
                        'F-Chat 2.0',
                        {
                            type: 'basic',
                            title: title,
                            message: message.substr(0,97) + '...',
                            iconUrl: image
                        },
                        function (notificationId) {
                            return notificationId;
                    });

                setTimeout(function(){
                        chrome.notifications.clear(valid, function(){});
                    }, 10000);
            }
        }
    }
};


FList.Chat.TypeState = {
    interval: null,
    update: function() {
        if (FList.Chat.TabBar.activeTab.type !== "user") return;
        FList.Chat.TabBar.activeTab.typetime = new Date().getTime();
        if (FList.Chat.TabBar.activeTab.mewaiting === true) {
            FList.Chat.TabBar.activeTab.mewaiting = false;
            return;
        }
        if (FList.Chat.TabBar.activeTab.metyping === false && $("#message-field").val().length > 0) {
            FList.Chat.TabBar.activeTab.metyping = true;
            FList.Connection.send("TPN " + JSON.stringify({ character: FList.Chat.TabBar.activeTab.id, status: "typing" }));
        }
    },
    check: function(force) {
        var minTypeTime = new Date().getTime() - FList.Chat.typingInterval * 1000 + 10;
        if (FList.Chat.TabBar.activeTab.type !== "user") return;
        if (force === true || (FList.Chat.TabBar.activeTab.typetime < minTypeTime && FList.Chat.TabBar.activeTab.metyping === true)) {
            FList.Chat.TabBar.activeTab.metyping = false;
            var tst = "paused";
            if ($("#message-field").val().length === 0) tst = "clear";
            FList.Connection.send("TPN " + JSON.stringify({ character: FList.Chat.TabBar.activeTab.id, status: tst }));
        }
    }
};

FList.Chat.IdleTimer = {
    timer: 0,
    idle: false,
    init: function(){
        FList.Chat.IdleTimer.disable();
        if(FList.Chat.Settings.current.autoIdle) FList.Chat.IdleTimer.enable();
    },
    enable: function(){
        if(FList.Chat.Settings.current.autoIdle){
        FList.Chat.IdleTimer.timer = setTimeout(function () {
                FList.Chat.IdleTimer.timer=0;
                var tempstate={};
                tempstate.status="Idle";
                tempstate.statusmsg = FList.Chat.Status.lastStatus.statusMessage;
                FList.Connection.send("STA " + JSON.stringify(tempstate));
                FList.Chat.IdleTimer.idle=true;
            }, FList.Chat.Settings.current.autoIdleTime);
        }
    },
    reset: function(){
        if(FList.Chat.Settings.current.autoIdle && FList.Chat.IdleTimer.idle===false){
            FList.Chat.IdleTimer.disable();
            FList.Chat.IdleTimer.enable();
        }
        if(FList.Chat.IdleTimer.idle===true){
            FList.Chat.IdleTimer.idle=false;
            FList.Chat.Status.restore();//restore old status
        }
    },
    disable: function(){ clearTimeout(FList.Chat.IdleTimer.timer); }
};

FList.Chat.AutoComplete = {

        complete: function(){
            var matches=FList.Chat.AutoComplete.findMatches(true);
            var matches2=FList.Chat.AutoComplete.findMatches(false);
            if(matches===-1 && matches2===-1) {
                FList.Common_displayError("Too short to autocomplete.");
            } else {
                if(matches === -1) matches=[];
                if(matches2===-1) matches2=[];
                var names=[];
                $.each(matches, function(key,match){ names.push(match["name"]); });
                $.each(matches2, function(key,match){ if(jQuery.inArray(match["name"],names)===-1) matches.push(match); });
                if(matches.length>1){
                    var matchstring="";
                    for(var i in matches){
                        matchstring=matchstring+"<a href='#' class='autocompletelink' onclick=\"FList.Chat.AutoComplete.completeName(" + matches[i]["start"] + ", '"+matches[i]["name"] + "', '"+ $("#message-field").val() + "');\">"+matches[i]["name"] + "</a>, ";
                    }
                    FList.Chat.printMessage({msg: 'Several matches found: ' +
                                            matchstring.substring(0,matchstring.length-2),
                                            from: 'System', type: 'system'});
                } else if(matches.length===1){
                    FList.Chat.AutoComplete.completeName(matches[0]["start"], matches[0]["name"], $("#message-field").val());
                } else {
                    FList.Chat.printMessage({msg: 'No matches found.', from: 'System', type: 'system'});
                }
            }
            if(FList.Chat.Settings.current.keepTypingFocus) $("#message-field").focus();
        },

        completeName: function(startpos, name, fulltext){
            if(startpos===0){ name=name + " "; }
            if(fulltext.substr(startpos, 1)===" " || fulltext.substr(startpos, 1)==="\""){ startpos++; }
            var endpos=startpos+name.length;
            fulltext=fulltext.substring(0, startpos) + name + fulltext.substring(endpos);
            $("#message-field").val(fulltext);
        },

        findMatches: function(skipspaces){
            var text=$("#message-field").val();
            var endpos=$("#message-field").caret().start;
            var startpos=0;
            var scount=0;
            for(var i=endpos;i>=0;i--){
                var character=text.substr(i,1);
                startpos=i;
                if(character===" ") {
                    if(skipspaces){
                        break;
                    } else {
                        scount=scount+1;
                        if(scount===2) break;//allow one space.
                    }
                }
                if(character==="\"") break;
            }
            var completetext=text.substring(startpos, endpos).toLowerCase();
            if(completetext.substring(0,1)===" " || completetext.substring(0,1)==="\"")
                completetext=completetext.substring(1);
            if(completetext.length<=1){
                return -1;
            } else {
                var list=FList.Chat.users.list;
                var match=[];
                var matches=0;
                for(var i in list){
                    if(list[i].toLowerCase().substring(0,completetext.length)===completetext){
                        match.push({"name": list[i], "start": startpos, "search": completetext});
                        matches++;
                    }
                }
                if(matches===0) return [];
                else return match;
            }
        }
};

FList.Chat.staffAlert = {
    confirm: function(callid){
        var call = {};
        call.action = "confirm";
        call.moderator = FList.Chat.identity;
        call.callid = callid;
        FList.Connection.send("SFC " + JSON.stringify(call));
    },

    dialog: function(){
        var alertdialog= $("<div class='StyledForm'><p>This report will include the active tab's logs. Please ensure you're looking at the tab you mean to report.</p><p><span class='label'>Reporting user</span><span class='element'><input type='text' class='ui-report-user'/></span></p><p><span class='label'>Details</span><span class='element'><textarea class='ui-report-text'></textarea></span></p></div>");
        alertdialog.dialog({
            autoOpen: true, title: 'Send Staff Alert', width: '350', height:'420', modal: true,
            buttons: {
                "Send alert": function(){
                    var includeLogs=true;
                    var reportText=alertdialog.find(".ui-report-text").val();
                    var reportUser=alertdialog.find(".ui-report-user").val();
                    var logs="";
                    logs = JSON.stringify(FList.Chat.TabBar.activeTab.logs);
                    FList.Chat.printMessage({msg: 'Hang on, the chat is uploading your chat log...',
                                            from: 'System', type: 'system'});
                    jQuery.post("https://" + window.location.host + "/fchat/submitLog.php", { character: FList.Chat.identity, log: logs, reportText: reportText, reportUser: reportUser, channel: FList.Chat.TabBar.activeTab.id  }, function(data) {
                        if (typeof(data.log_id) != "string" || parseInt(data.log_id) === 0) {
                            FList.Chat.printMessage({msg: 'Error uploading your chat log. Mod alert aborted.',
                                                    from: 'System', type: 'error'});
                            return;
                        }
                        var report = "Current Tab/Channel: " + FList.Chat.TabBar.activeTab.id + " | Reporting User: " + reportUser + " | " + reportText;
                        var call = {};
                        call.action = "report";
                        call.character = FList.Chat_identity;
                        call.report = report;
                        if (typeof(parseInt(data.log_id)) === "number") call.logid = parseInt(data.log_id);
                        FList.Connection.send("SFC " + JSON.stringify(call));
                        alertdialog.dialog("close");

                    }, "json");
                },
                "Cancel": function(){
                    alertdialog.dialog("close");
                }
            }
        });
    }
};

/**
 * Offline logging/Log-getters
 */
FList.Chat.Logs = (function (local) {
    return {
        /**
         * Append private messaging logs to offline file.
         * This function is passed raw PRI data.
         * PRI is already HTML sanitized server-side prior to sending.
         * @params {String} [user] -- Not lowercase.
         * @params {Object} [msgData]
         */
        saveLogs: function (user, msgData) {
            var LS_PTR = local.identity + '_' + msgData.to,
                NEW_LOG_OBJ = {
                    at: new Date().getTime(),
                    msg: msgData.msg,
                    from: user,
                    kind: msgData.kind
                },
                BUFFER_LIMIT = parseInt(
                    local.Settings.current.visibleLines, 10
                ),
                isValid = (
                    local.Settings.current.enablePMLogging &&
                    typeof Storage !== 'undefined'
                ),
                isCorrectFormat = (
                    localStorage[LS_PTR] &&
                    localStorage[LS_PTR].charAt(0) === '{'
                ),
                lsData;
            if (!isValid) return;

            if (!isCorrectFormat) {
                localStorage[LS_PTR] = '{"logs":[],"last":0}';
                }
            lsData = JSON.parse(localStorage[LS_PTR]);
            if (lsData.logs.length + 1 > BUFFER_LIMIT) {
                lsData.logs = lsData.logs.slice(0, BUFFER_LIMIT - 1);
            }
            lsData.logs.unshift(NEW_LOG_OBJ);
            lsData.last = new Date().getTime();
            return localStorage[LS_PTR] = JSON.stringify(lsData);
        },
        /**
         * Build tab log object from offline data prior to rendering
         * Requires BBCode/HTML parsing on appended log entries. (For now)
         * @params {String} [user] -- Not lowercase
         */
        buildLogs: function (user) {
            var TARGET_TAB = local.TabBar.getTabFromId(
                    'user',
                    user.toLowerCase()
                ),
                LS_PTR = local.identity + '_' + user.toLowerCase(),
                lsData,
                bufferLimit,
                curMsg;
            /**
             * Integer padding and conversion
             * @params {Number} [n]
             * @returns {String}
             */
            function paddedItoa(n) {
                return ((n < 10) ? '0' + n : '' + n);
                }
            /**
             * Building of message HTML per log message.
             * @params {Object} [time]
             * @params {String} [type]
             * @params {String} [user] -- Not lowercase
             * @params {String} [message]
             * @returns {String}
             */
            function buildMessage(time, type, user, message) {
                var container = $('<div>'),
                    timestamp = $('<span>'),
                    userClass = $('<span>'),
                    msgContainer,
                    htmlString = '';

                container.addClass('chat-message');
                timestamp.addClass('timestamp');
                userClass.addClass(
                    local.getPrintClasses(user.toLowerCase(), false)
                );

                userClass.html(user);

                timestamp.html(
                    '[' + time.getFullYear() + '/' +
                    paddedItoa(time.getMonth() + 1) + '/' +
                    paddedItoa(time.getDate()) + ']'
                );

                container.append(timestamp);

                message = local.processMessage('user', type, message);

                if (type === 'rp') {
                    container.addClass('chat-type-rp');
                    container.append($('<i>'));
                    msgContainer = container.children('i');
                } else {
                    container.addClass('chat-type-chat');
                    msgContainer = container;
                }

                msgContainer.append(userClass);
                msgContainer.append(
                    (type === 'rp' ? '': ': ')
                    + message
                );

                htmlString = $('<div>').append(container).html();

                return htmlString;
            }

            TARGET_TAB.initLogs = true;
            
            if (!localStorage[LS_PTR])
                return;

            lsData = JSON.parse(localStorage[LS_PTR]);

            bufferLimit = Math.min(
                parseInt(local.Settings.current.visibleLines, 10),
                lsData.logs.length
            );

            for (var i = 0; i < bufferLimit; i++) {
                curMsg = lsData.logs[i];
                TARGET_TAB.logs.unshift({
                    type: curMsg.kind,
                    by: curMsg.user,
                    html: buildMessage(
                        new Date(curMsg.at),
                        curMsg.kind,
                        curMsg.from,
                        curMsg.msg
                    )
                });
        }
    },
        /**
         * Clearing of offline logs (Character Specific)
         */
        clearLogs: function () {
            if (typeof Storage !== 'undefined') {
                for (var cur in localStorage) {
                    if (cur.indexOf(local.identity) === 0)
                        delete localStorage[cur];
                }
            }
        },
        element: 0,
        getPanel: function() {
            return '<div id="chat-logs-list"><h2>Download Logs</h2>' +
                '<p style="padding:10px;">Formerly saved logs can be ' +
                'viewed in <a href="logs.php" target="_blank">' +
                'the log viewer</a>. Alternatively, ' +
                '<a onclick="FList.Chat.Logs.generateZip();" href="#">' +
                'download a zip file with all your tab\'s logs</a>' +
                '.</p><div class="chat-logs-list-content"></div></div>';
    },
        generateZip: function generateZip() {
            var zip = new JSZip(),
                folder,
                tabs = local.TabBar.list,
                tabLogs = {},
                selectedTabs;
            /**
             * Populates an array with the person's custom zip selections.
             * @returns {Array}
             */
            function getCustomSelected() {
                var selection = [],
                    defaultSelection = [];

                $('.chat-log-item').each(function (i, el) {
                    var element_id = $(el).children('input').attr('id'),
                        element_ref = unescape(element_id.replace(/\_/g, '%'));
                    if ($('#' + element_id + ':checked').length) {
                        selection.push(element_ref);
                }

                    defaultSelection.push(element_ref);
                });
                if (!selection.length) {
                    return defaultSelection;
                    }
                return selection;
                }

            selectedTabs = getCustomSelected();

            /**
             * Generates an optimized and easier-to-navigate Object.
             */
            for (var i = 0, ii = tabs.length; i < ii; i++) {
                if (selectedTabs.indexOf(tabs[i].tab[0].title) !== -1) {
                        tabLogs[tabs[i].tab[0].title] = tabs[i].logs;
                    }
                }

            /**
             * Generates raw log-file contents
             * @params {String} [tab]
             */
            function generateLogFile(tab) {
                var fileContents = ""; // Large String File Output
                tab = tabLogs[tab];
                for (var i = 0, ii = tab.length; i < ii; i++) {
                    fileContents += '>> ' +
                        tab[i].html.replace(/\<[^\>]+\>/g, '')
                            .replace(/\&lt\;/gi, '<')
                            .replace(/\&gt\;/gi, '>')
                            .replace(/\&amp\;/gi, '&')
                        + '\n';
                        }

                return fileContents;
                }

            for (var i = 0, ii = selectedTabs.length; i < ii; i++) {
                folder = zip.folder(
                    selectedTabs[i].replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                );
                folder.add(
                    ~~(new Date().getTime() / 1000) + '_' +
                    selectedTabs[i]
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>') + '.txt',
                    generateLogFile(selectedTabs[i])
                );
        }

            zip = zip.generate();

            window.open(
                'data:application/zip;filename=logs.zip;base64,' + zip
            );

            FList.Common_displayNotice(
                'Download started. Rename the "download(n)" file to ' +
                '"something.zip", and you will be able to open it ' +
                'for later viewing.'
            );
    },
    getLogDocument: function(tab){
            var tabname = tab.id,
                doc = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 ' +
                    'Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1' +
                    '-strict.dtd">\n<html xmlns="http://www.w3.org/1999/' +
                    'xhtml" xml:lang="en" lang="en">\n<head><title>F-lis' +
                    't - Chat</title>\n<style>\nh1{color:white;margin-bo' +
                    'ttom:10px;font-size:14pt;}\nbody{background-color:#' +
                    '1F5284;font-family:verdana,helvetica;font-size:10pt' +
                    ';}\nbody{color:#FFFFFF;font-family:verdana,helvetic' +
                    'a;font-size:10pt;}\n</style>\n</head>\n<body>\n<h1>' +
                    'F-Chat Log: ' + tabname + ', ' + new Date() + '</h1' +
                    '>\n<div id="LogContainer">\n';
            if (tab.type === 'channel')
                tabname = FList.Chat.channels.getData(tab.id).title;
            if (tab.type === 'user')
                tabname=FList.Chat.users.getData(tab.id).name;
        for (var l = 0; l < tab.logs.length; l++) {
            doc+=tab.logs[l].html;
        }
        doc += '</div></body></html>';
        return doc;
    }
};
}(FList.Chat));

/**
 * Adds a notification in the browser tab title that you have unread private messages.
 * If you wish to use this feature prior to it being pushed onto the 2.0 client live
 * just copy this code and paste it into your browser's console within the F-Chat tab.
 * Just keep in mind there could be minor bugs. Let me know if you find any.
 *
 * If you encounter any issues using this feature, you can remove it manually or
 * refresh your page to get rid of it. To manually remove this feature, open your browser's
 * console and delete the namespace associated with it by typing 'delete Kali' and pressing enter.
 *
 * Enjoy, and as always, have fun!
 *
 * @author Kali/Maw
 */
FList.tNotice = {
    tabTally: {}
};

var wfocus; /**@define {Boolean} wfocus Global window focus variable*/

/**
 * Title draw function.
 */
FList.tNotice.draw = function() {
    document.title = '(' + this.tabTally.sum + ') F-list - Chat (' + FList.Chat.identity + ')';
};

/**
 * Title tally function.
 * @param {string} tab Current tab ID
 */
FList.tNotice.newMsg = function(tab) {

    if (tab in this.tabTally) {
        this.tabTally[tab] += 1;
    } else {
        this.tabTally[tab] = 1;
    }

    if (this.tabTally.sum) {
        this.tabTally.sum += 1;
    } else {
        this.tabTally.sum = 1;
    }

    this.draw();
};

/**
 * On focus, subtract total unread messages from newly viewed tab from the title, then draw.
 * @param {string} tab Current tab ID
 */
FList.tNotice.readMsg = function(tab) {

    this.tabTally.sum -= this.tabTally[tab];

    delete this.tabTally[tab];

    if (this.tabTally.sum) {
        this.draw();
    } else {
        delete this.tabTally.sum;
        document.title = "F-list - Chat (" + FList.Chat.identity + ")";
    }

};

/**
 * Sets a global 'wfocus' variable, which sets a true/false value to check if the user is currently focused on this window.
 * Checks if on wfocus will allow the person to read backlogged notifications.
 */
window.onfocus = function() {
    wfocus = true;

    if (FList.Chat.TabBar.activeTab.id &&
            FList.Chat.TabBar.activeTab.id.toLowerCase() in FList.tNotice.tabTally) {
        FList.tNotice.readMsg(FList.Chat.TabBar.activeTab.id.toLowerCase());
    }
};

/**
 * Sets a global 'wfocus' variable
 */
window.onblur = function() {
    wfocus = false;
};
