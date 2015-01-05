
FList.Connection = {
    ws: false,
    host: "wss://chat.f-list.net:9799/",//chat.f-list.net
    pingTimeout: 0,
    getTicket: function(callback){
		var faccount=$("#chat-account").val();
        $.ajax({
            type: "GET",
            url: domain + "json/getApiTicket.php",
            dataType: "json",
            timeout: timeoutsec * 1000,
            data: { },
            success: function (data) {
                if(data.error==""){
                    callback(faccount, data.ticket, data.friends, data.bookmarks);
                } else {
                    FList.Common_displayError(data.error);
                }
            },
            error: function (objAJAXRequest, strError, errorThrown) {
                FList.Common_displayError(strError + ", " + errorThrown);
            }
        });
    },

    logout: function(){
        if(FList.Chat.TabBar.activeTab!==false){
            FList.Chat.TabBar.textfield=$("#message-field").val();
            $("#message-field").val(FList.Chat.TabBar.activeTab.textfield);
        }
        if(FList.Chat.Settings.current.html5Audio) FList.Chat.Sound.playSound("logout");
        FList.Chat.Activites.stop();
        clearInterval(FList.Connection.pingTimeout);
        clearInterval(FList.Chat.TypeState.interval);
        FList.Chat.lastIdentity=FList.Chat.identity;
        FList.Chat.identity="";
        //loop through all channeltabs,set joined to false.
        FList.Chat.channels.list=[];
        FList.Chat.TabBar.saveTabs();//Save the tabs' pinned status. Above kind of seems a little redundant. ~Kali
        for(var key in FList.Chat.TabBar.list) {
            var tab=FList.Chat.TabBar.list[key];
            if(!tab.closed && tab.type!=="console" && !tab.pinned){
                //FList.Chat.restoreTabs.push(tab);
                tab.closed=true;
            }
        }
        //FList.Chat.channels.list=[];
        FList.Chat.users.list=[];
        FList.Chat.users.userdata={};
        FList.Chat.UI.initLogin();
        FList.Chat.IdleTimer.disable();
    },

    open: function(_ticket, _account, _character){
        if(FList.Chat.lastIdentity!=="" && _character!==FList.Chat.lastIdentity) FList.Chat.restoreTabs=[];//the user logged in previously, but discard the old tabs. this is a different character.
        FList.Chat.identity=_character;
        $("#status-avatar").attr("src", staticdomain + "images/avatar/" + FList.Chat.identity.toLowerCase() + ".png");
        $("#status-name").text(FList.Chat.identity);
        if(FList.Connection.ws) FList.Connection.ws.close();
        if(window.location.href.indexOf("useDev") != -1) FList.Connection.host="wss://chat.f-list.net:8799/";
        if(window.location.href.indexOf("useLocal") != -1) FList.Connection.host="ws://127.0.0.1:9722/";
        if(window.location.href.indexOf("useHexxy") != -1) FList.Connection.host="ws://94.212.51.157:9722/";
        if ('MozWebSocket' in window)
            FList.Connection.ws = new MozWebSocket(FList.Connection.host);
        else
            FList.Connection.ws = new WebSocket(FList.Connection.host);
        FList.Connection.ws.onopen = function() {
            FList.Chat.Sound.playSound("login");
            clearInterval(FList.Connection.pingTimeout);
            FList.Connection.pingTimeout = setInterval(function ()
            {
                if (FList.Connection.ws !== 0)
                {
                    FList.Connection.send("PIN");
                }
            }, 45*1000);
            FList.Connection.send("IDN " + JSON.stringify({
                "method": "ticket",
                "ticket": _ticket,
                "account": _account,
                "character": _character,
                cname: "F-List Web Chat",
                cversion: FList.Chat.version
            }));
        };
        FList.Connection.ws.onmessage = function (evt) {
            FList.Chat.parseCommand(evt.data);
        };
        FList.Connection.ws.onclose = function(e) {
            FList.Chat.Sound.playSound("logout");
            FList.Connection.logout();
        };
        FList.Connection.ws.onerror = function(e) {
            FList.Common_displayError("Connection error.");
            FList.Connection.ws.close();
        };
    },

    send: function(line) {
        if (FList.Chat.debug) {
            FList.Chat.printMessage({msg: line, to: FList.Chat.TabBar.getTabFromId('console', 'console'),
                                    from: 'Client', type: 'system'});
        }

        FList.Connection.ws.send(line);
    },

    login: function(){
        FList.Chat.Notifications.init();
        var character=$("#chatlogin-identity option:selected").text();
        FList.Chat.characterId=$("#chatlogin-identity").val();
        if(typeof(WebSocket)=="undefined" && typeof(MozWebSocket)=="undefined"){
            if (!swfobject.hasFlashPlayerVersion("10.0.0")) {
                FList.Common_displayError("Please <a href='http://get.adobe.com/flashplayer'>Install Flash Player 10+</a>, or Disable Ad blocker to use F-Chat.");
                return;
            }
		}
        FList.Chat.UI.setBusy("Connecting...", 10000);
        FList.Connection.getTicket(function(account, ticket, friends, bookmarks){
            $.each(friends, function(i, friend){
                if(jQuery.inArray(friend.source_name, FList.Chat.friendsList)== -1){
                    FList.Chat.friendsList.push(friend.source_name);
                }
            });
            $.each(bookmarks, function(i, mark){
                FList.Chat.bookmarksList.push(mark.name);
            });
            FList.Connection.open(ticket, account, character);
        });
        FList.Chat.UI.initChat();
    }
};
