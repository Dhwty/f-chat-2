FList.Chat.UI = {

    busyTimer: 0,

    setBusy: function(message, timeout){
        $("#chatui-modal-overlay").remove();
        var element = $("<div></div>");
        element.attr("id","chatui-modal-overlay").addClass("ui-widget-overlay").css("display","none");
        element.append("<div style='position:absolute;left:50%;width:200px;margin-left:-100px;height:48px;background-position:center center !important;top:50%;margin-top:-100px;text-align:center;padding-top:152px;' class='BusyTab'><span class='ui-corner-all' style='padding:10px;background-color:rgba(255,255,255,0.1);'>" + FList.ChatParser.parseContent(message) + "</span></div>");
        $(document.body).append(element);
        $("#chatui-modal-overlay").fadeIn("fast");
        clearTimeout(FList.Chat.UI.busyTimer);
        FList.Chat.UI.busyTimer=setTimeout(function(){ FList.Chat.UI.setDone(); }, timeout);
    },

    setDone: function(){
        $("#chatui-modal-overlay").fadeOut("fast", function(){ $(this).remove(); });
    },

    resize: function(){ 
        var tbh=0;
        if(!FList.Chat.Settings.current.tabsOnTheSide) tbh=$("#tab-bar").outerHeight(true);
        var tabheight=$(window).height();
        $("#chatui-tabs").css("height", tabheight);//outer tab container
        var tab_innerheight=tabheight-$("#chatui-tabs > .ui-tabs-nav").outerHeight(true);
        $(".chatui-tab-inner").css("height", tab_innerheight);
        $(".chatui-tab-friends .bookmarks , .chatui-tab-friends .friends").css("height", tab_innerheight-$(".friends-tab-label:first").outerHeight(true));
        $(".chatui-tab-channels .private , .chatui-tab-channels .public").css("height", tab_innerheight-$(".chatui-tab-channels .create").outerHeight(true)-$(".channels-tab-label:first").outerHeight(true));
        $(".chatui-tab-search .results").css("height", tab_innerheight-$(".chatui-tab-search .settings").outerHeight(true));
        $(".chatui-tab-settings .group").css("height", tab_innerheight-$(".settings-tab-label:first").outerHeight(true));
        $("#ads-panel-list").css("height", tab_innerheight-$(".ads-tab-label:first").outerHeight(true));
        var chatcontent_height=tab_innerheight-$("#info-bar").outerHeight(true)-$("#typing-area").outerHeight(true)-tbh;
        $("#chat-content-chatarea > div").css("height", chatcontent_height-10);//minus padding.
        $(".user-bar-content").css("height", (chatcontent_height-30) + 'px');
        $("#user-bar").css("height", (chatcontent_height) + 'px');
        var blah=$("#info-bar-main").height()-10;


        if(FList.Chat.Settings.current.tabsOnTheSide){
            $("#tab-bar").css("height",chatcontent_height);
            $(".tab-bar-content").css("height", chatcontent_height);
        }
        $("#chat-content").css("height", chatcontent_height);
        FList.Chat.TypingArea.update();
    },

    buildBase : function(){
        $("#chat-body").html("");
        $(window).unbind("resize").bind("resize", FList.Chat.UI.resize);
        $(window).bind( "focus", function(){
            if(FList.Chat.TabBar.activeTab!==false){
                FList.Chat.focused=true;
                //FList.Chat.TabBar.printLogs(FList.Chat.TabBar.activeTab, FList.Chat.TabBar.activeTab.type =="channel" ? FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id).userMode : "both");//apply visibleLines
                FList.Chat.scrollDown(); 
                FList.Chat.Activites.noIndicate(FList.Chat.TabBar.activeTab.tab);
                FList.Chat.TabBar.activeTab.pending=0;
                FList.Chat.TabBar.activeTab.mentions=0;
                FList.Chat.TabBar.refreshClosed();
            }
        });
        $(window).bind( "blur", function(){
            if(FList.Chat.TabBar.activeTab!==false){
                FList.Chat.focused=false;
            }
        });
        var login=FList.Common_getCharacterSelectbox("chatlogin-identity");
        //<p style='height:20px;margin:10px 0px 10px 0px;'><input type='checkbox' id='chat-login-debug'/><label for='chat-login-debug'>Debug mode.</label></p>   
        var contentbody=$('<div id="chatui-tabs"><a id="header-flist" class="list-highlight list-item-important" href="' + domain + '" target="_blank"><span class="sprite sprite-home"></span></a><a id="header-fchat" class="list-highlight" title="F-Chat Menu"><span class="sprite sprite-icon-fchat"></span></a><ul><li class="tab-buttons-login"><a href="#tabs-1" title="Log In"><span class="sprite sprite-key"></span></a></li><li><a href="#tabs-2" title="Chat"><span class="sprite sprite-balloons-white"></span></a></li><li><a href="#tabs-3" title="Set your status"><span class="sprite sprite-card-address"></span></a></li><li><a href="#tabs-4" title="Browse/Open channels"><span class="sprite sprite-hash"></span></a></li><li><a href="#tabs-5" title="See which friends/bookmarks are on"><span class="sprite sprite-users"></span></a></li><li><a href="#tabs-6" title="Find roleplay partners"><span class="sprite sprite-magnifier"></span></a></li><li><a href="#tabs-7" title="Incoming roleplay ads"><span class="sprite sprite-newspaper"></span></a></li><li><a href="#tabs-8" title="Browse/Save/Download chatlogs"><span class="sprite sprite-book-bookmark"></span></a></li><li><a href="#tabs-9" title="Configure F-Chat\'s settings"><span class="sprite sprite-wrench-screwdriver"></span></a></li><li><a href="#tabs-10" title="Help and documentation"><span class="sprite sprite-question"></span></a></li></ul><div id="tabs-1" class="StyledForm chatui-tab-login chatui-tab-inner"><div id="login-body"><div id="chat-login"><p><span class="chat-field-label">Log In As</span>' + login + '<input type="Button" class="button" value="Enter Chat" onclick="FList.Connection.login();" id="chat-login-go"/></p></div><span id="chat-login-version">F-Chat 2.0</span></div></div><div id="tabs-2" class="StyledForm chatui-tab-chat chatui-tab-inner"><div id="tab-bar" class="panel"><div class="tab-bar-content"></div></div><div id="info-bar" class="panel"><div><div id="info-bar-actions">test</div><div id="info-bar-main"><a id="info-bar-channel"><span class="sprite sprite-wrench"></span></a><div></div></div></div></div><div id="chat-content"><div id="chat-content-row"><div id="chat-content-chatarea"><div>&nbsp;</div></div><div id="user-bar" class="panel"><div class="user-bar-header"><span id="user-view-default" class="user-view-tab panel list-item-important list-highlight">Users</span><span id="user-view-avatars" class="user-view-tab panel list-highlight">0</span></div><div class="user-bar-content">&nbsp;</div></div></div></div><div id="typing-send-actions" class="panel">&nbsp;</div><div id="typing-area" class="panel"><div id="typing-indicator"></div><textarea id="message-field"></textarea></div></div><div id="tabs-3" class="chatui-tab-status StyledForm chatui-tab-inner">' + FList.Chat.Status.getPanel() + '</div><div id="tabs-4" class="StyledForm chatui-tab-channels chatui-tab-inner"><div class="create panel"><div style="padding:10px;"><span class="chat-field-label">Channel </span> <input type="text" maxlength="50" class="ui-newchan-text"/></span> <input type="button" onclick="FList.Chat.createChannel();" id="channel-panel-create" value="Create"/></div></div><div class="channels-tab-label panel"><span class="sort list-highlight"><span></span>Users</span><span class="label list-highlight"><span></span>Public</span></div><div class="channels-tab-label panel"><span class="sort list-highlight"><span></span>Users</span><span class="label list-highlight"><span></span>Private</span></div><div class="public"></div><div class="private"></div></div><div id="tabs-5" class="StyledForm chatui-tab-friends chatui-tab-inner"><div class="friends-tab-label"><span>Friends</span></div><div class="friends-tab-label"><span>Bookmarks</span></div><div class="friends"></div><div class="bookmarks"></div></div><div id="tabs-6" class="StyledForm chatui-tab-search chatui-tab-inner">' + FList.Chat.Search.getPanel() + '</div><div id="tabs-7" class="StyledForm chatui-tab-ads chatui-tab-inner"><div class="ads-tab-label"><span>Incoming roleplay ads</span></div><div id="ads-panel-list"><div style="margin:10px;" class="DisplayedMessage">There are no incoming roleplay ads. Open a few channels first, and any ads posted in those channels will be displayed here!</div></div></div><div id="tabs-8" class="StyledForm chatui-tab-logs chatui-tab-inner">' + FList.Chat.Logs.getPanel() + '</div><div id="tabs-9" class="StyledForm chatui-tab-settings chatui-tab-inner"><div style="padding:10px;">' + FList.Chat.Settings.getPanel() + '</div></div><div id="tabs-10" class="StyledForm chatui-tab-help chatui-tab-inner">' + FList.Chat.Help.getPanel() + '</div></div>');    
        $("#chat-body").append(contentbody);
        $("#chatui-tabs").tabs({
            show: function(event, ui) {
                switch(ui.index){
                    case 1:
                        FList.Chat.TabBar.refreshClosed();
                        FList.Chat.scrollDown();
                        if(FList.Chat.Settings.current.keepTypingFocus) $("#message-field").focus();
                        break;
                    case 3:
                        FList.Connection.send("CHA");
                        FList.Connection.send("ORS");
                        break;
                    case 4:
                        $(".chatui-tab-friends .friends, .chatui-tab-friends .bookmarks").html("");

                        FList.Chat.friendsOnline = FList.Chat.friendsOnline.sort();//function (a, b) { if (a.text == b.text) return 0;return a.text > b.text ? 1 : -1;}
                FList.Chat.bookmarksOnline = FList.Chat.bookmarksOnline.sort();//function (a, b) { if (a.text == b.text) return 0;return a.text > b.text ? 1 : -1;}

                $.each(FList.Chat.friendsOnline, function(i,f){
                    var html=FList.Chat.users.getToggleLink(f);
                    $(".chatui-tab-friends .friends").append(html);
                });
                $.each(FList.Chat.bookmarksOnline, function(i,f){
                    var html=FList.Chat.users.getToggleLink(f);
                    $(".chatui-tab-friends .bookmarks").append(html);
                });
                break;
                    case 5:


                if(FList.Chat.Search.kinkFields==""){
                    $.ajax({
                        type: "GET",
                        url: domain + "json/chat-search-getfields.json",
                        dataType: "json",
                        timeout: (timeoutsec * 1000),
                        data: ({
                            ids: true
                        }),
                            success: function (data) {
                                var kinkboxhtml="<div class='search-field-kink'><select>";
                                $.each(data.kinks, function(i, kink){
                                    kinkboxhtml += "<option value = '" + kink.fetish_id + "'>" + kink.name + "</option>";
                                });
                                kinkboxhtml+="</select></div>";
                                FList.Chat.Search.kinkFields=kinkboxhtml;

                                $("#search-panel-genders .list").html("");
                                var genderboxhtml="<div class='search-field-gender'><select multiple='multiple' size='5'>";
                                $.each(data.genders, function(i, gender){
                                    genderboxhtml += "<option value = '" + gender + "'>" + gender + "</option>";
                                });
                                genderboxhtml+="</select></div>";
                                $("#search-panel-genders .list").html(genderboxhtml);

                                $("#search-panel-positions .list").html("");
                                var positionboxhtml="<div class='search-field-position'><select multiple='multiple' size='5'>";
                                $.each(data.positions, function(i, position){
                                    positionboxhtml += "<option value = '" + position + "'>" + position + "</option>";
                                });
                                positionboxhtml+="</select></div>";
                                $("#search-panel-positions .list").html(positionboxhtml);

                                $("#search-panel-roles .list").html("");
                                var roleboxhtml="<div class='search-field-role'><select multiple='multiple' size='5'>";
                                $.each(data.roles, function(i, role){
                                    roleboxhtml += "<option value = '" + role + "'>" + role + "</option>";
                                });
                                roleboxhtml+="</select></div>";
                                $("#search-panel-roles .list").html(roleboxhtml);

                                $("#search-panel-orientations .list").html("");
                                var orientationboxhtml="<div class='search-field-orientation'><select multiple='multiple' size='5'>";
                                $.each(data.orientations, function(i, orientation){
                                    orientationboxhtml += "<option value = '" + orientation + "'>" + orientation + "</option>";
                                });
                                orientationboxhtml+="</select></div>";
                                $("#search-panel-orientations .list").html(orientationboxhtml);

                                $("#search-panel-languages .list").html("");
                                var languageboxhtml="<div class='search-field-languages'><select multiple='multiple' size='5'>";
                                $.each(data.languages, function(i, language){
                                    languageboxhtml += "<option value = '" + language + "'>" + language + "</option>";
                                });
                                languageboxhtml+="</select></div>";
                                $("#search-panel-languages .list").html(languageboxhtml);
                            },
                            error: function (objAJAXRequest, strError, errorThrown) {

                            }
                    });
                }

                break;
                    case 7:
                $(".chat-logs-list-content").html("");
                $.each(FList.Chat.TabBar.list, function(i, tab){
                    var title = (tab.type === 'channel') ?
                        FList.Chat.channels.getData(tab.id).title
                        :
                        FList.Chat.users.getData(tab.id).name;
                    if (tab.logs.length > 0 && tab.type !== 'console') {
                        $(".chat-logs-list-content").append(
                            '<div class="panel chat-log-item"><input id="' +
                            escape(title).replace(/\%/g, '_') + '" type="checkbox">' +
                            '<a class="view"><a class="download"></a>' +
                            (tab.type=="channel" ? '#' + title : title) +
                            '</div>'
                        );
                        $(".chat-log-item:last").children("a.view:last").click(function(){
                            var doc=FList.Chat.Logs.getLogDocument(tab);
                            window.open("data:text/html;filename="+escape(tab.id)+".html;charset=utf-8," + escape(doc));
                        });      
                        $(".chat-log-item:last").children("a.download:last").click(function(){
                            var doc=FList.Chat.Logs.getLogDocument(tab);
                            window.open("data:application/octet-stream;filename="+escape(tab.id)+".html;charset=utf-8," + escape(doc));
                            FList.Common_displayNotice("Download started. Rename the \"download(n)\" file to \"something.html\", and you will be able to open it for later viewing.");
                        });                      

                    }
                });
                break;
                    case 8:
                FList.Chat.Settings.initPanel();
                break;
                    default:

                }
                $(".ui-tabs-nav > li > a").removeClass("list-item-important");
                $(".ui-tabs-nav > li.ui-state-active > a").addClass("list-item-important");
            }
        });
        $("#status-panel-update, #channel-panel-create, #chat-login-go, #search-panel-go, #search-panel-kinkadd, #settings-panel-save, #settings-panel-reset").button();


        $("#info-bar-channel").button().FlexMenu(
                { offset: "-1 1",
                    items: [
        {
            text: "Channel moderation",
            type: "menu-header"
        }, /*{

             also, mod list menu option, ban list menu option.

             text: "Delete channel",
             type: "menu-action",
             id: "channel-tools-delete",
             handler: function(){
            //alert("this is where a killchannel command would happen.");
            FList.Common_displayNotice("Unimplemented.");
            $("#info-bar-channel").FlexMenu("hide");
            },
            icon: staticdomain + "images/icons/cross.png"
            },*/
            {
                text: "Delete Room",
                type: "menu-action",
                id: "channel-tools-delete",
                handler: function(){
                    if(confirm("Are you sure? Everyone will be kicked, and the room will be deleted forever.")){
                        FList.Connection.send("KIC " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id }));
                    }
                    $("#info-bar-channel").FlexMenu("hide");
                },
                icon: staticdomain + "images/icons/cross.png"
            },            
            {
                text: "Open Room",
                type: "menu-action",
                id: "channel-tools-open",
                handler: function(){
                    FList.Connection.send("RST " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, status: "public" }));
                    $("#info-bar-channel").FlexMenu("hide");
                },
                icon: staticdomain + "images/icons/lock-unlock.png"
            },
            {
                text: "Close Room",
                type: "menu-action",
                id: "channel-tools-close",
                handler: function(){
                    FList.Connection.send("RST " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, status: "private" }));
                    $("#info-bar-channel").FlexMenu("hide");
                },
                icon:  staticdomain + "images/icons/lock.png"
            },
            {
                text: "Room settings",
                type: "menu-action",
                handler: function(){
                    var chandescriptiondlg= $("<div class='StyledForm'><span class='chat-field-label'>Owner</span><input type='text' class='chantools-setowner-text'/><br/><span class='chat-field-label'>Room type</span><span class='chantools-type-label'>Private/Public</span><br/><span class='chat-field-label'>Description</span><textarea class='chantools-setdescription-text' style='width:300px;'></textarea><br/><span class='chat-field-label'>Content</span><select class='chantools-content-select'><option value='chat'>Chat</option><option value='ads'>Ads</option><option value='both'>Both</option></select></div>");
                    chandescriptiondlg.dialog({
                        autoOpen: true, title: 'Edit channel settings', width: '450', height:'350', modal: true,
                        buttons: {
                            "Save": function(){
                                var channeldata=FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id);
                                var newdescription=chandescriptiondlg.find(".chantools-setdescription-text").val();
                                if(channeldata.description!==newdescription) {
                                    FList.Connection.send("CDS " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, description: newdescription }));  
                                }
                                var newmode=$(".chantools-content-select").val();
                                if(newmode!==channeldata.mode) {
                                    FList.Connection.send("RMO " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, mode: newmode }));  
                                }
                                chandescriptiondlg.dialog("close");
                            },
                        "Cancel": function(){
                            chandescriptiondlg.dialog("close");
                        }
                        }
                    });
                    var ops=FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id).oplist;
                    if(ops.length>0){
                        $(".chantools-setowner-text").val(ops[0]);
                        //if(!FList.Chat.isChanOwner() && !FList.Chat.isChatop() && !FList.Chat.isAdmin()){
                        $(".chantools-setowner-text").attr("disabled", true);
                        // } else {
                        //    $(".chantools-setowner-text").attr("disabled", false);
                        //  }
                    } else {
                        $(".chantools-setowner-text").attr("disabled", true).val("");
                    }
                    $(".chantools-type-label").text(FList.Chat.TabBar.activeTab.id.substring(0,4).toLowerCase()=="adh-" ? "Private" : "Public");
                    $(".chantools-content-select").val(FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id).mode);
                    //set chantools-access-select -> open or closed.
                    chandescriptiondlg.find(".chantools-setdescription-text").val(FList.Chat.channels.getData(FList.Chat.TabBar.activeTab.id).description);
                    $("#info-bar-channel").FlexMenu("hide");
                },
                fixed: true,
                icon: staticdomain + "images/icons/edit.png"
            }]
                });


        if(parseInt($("#def").val())!==0) $("#chatlogin-identity").val(parseInt($("#def").val()));
        FList.Chat.UI.resize();
        FList.Chat.TabBar.create();
        FList.Chat.TabBar.addTab("console","Console","console");
        FList.Chat.Menu.init();
        $("#header-fchat").FlexMenu("item-disable", "mnu-tab-undo");
    },

    initLogin: function(){
        $(".tab-buttons-login").fadeIn("fast");
        $("#header-flist").fadeIn("fast");
        $("#header-fchat").hide("fast");
        $('#chatui-tabs').tabs("option","disabled", []);
        $("#chatui-tabs").tabs( "select" , 0 );
        $('#chatui-tabs').tabs("option","disabled", [1, 2, 3,4,5,6,7]);
        if(parseInt($("#chat-default-id").val())!==0) $("#chatlogin-identity").val(parseInt($("#chat-default-id").val()));
        FList.Chat.UI.resize();
    },


    initChat : function(){
        $('#chatui-tabs').tabs("option","disabled",[]);
        $("#chatui-tabs").tabs( "select" , 1 );
        $("#chatui-tabs").tabs( "disable" , 0 );
        //FList.Chat.debug=$("#chat-login-debug:checked").length>0 ? true : false;
        $(".tab-buttons-login").fadeOut("fast");
        $("#header-flist, #header-fchat").fadeIn("fast");

        //draw the main area.
        FList.Chat.UserBar.create();
        FList.Chat.UserBar.hide();
        FList.Chat.TypingArea.create();
        FList.Chat.TabBar.setActive("console", "console");
        FList.Chat.Activites.init();
        FList.Chat.ContextMenu.init();
        $(document.body).unbind("click.avatars").bind("click.avatars", function (e) {
            if($(e.target).hasClass("AvatarLink") || $(e.target).hasClass("InactiveAvatarLink")){
                if($(e.target).hasClass("AvatarLink")) {
                    e.stopPropagation();
                    if(FList.Chat.Settings.current.leftClickOpensFlist){ 
                        window.open(domain + "c/" + $(e.target).text().toLowerCase() + "/");
                    } else {
                        FList.Chat.openPrivateChat($(e.target).text(), false);
                    }
                }
            }
        });

        $(document.body).unbind("mousedown.avatars").bind("mousedown.avatars", function(e){
            if($(e.target).hasClass("AvatarLink") || $(e.target).hasClass("InactiveAvatarLink")){
                if(e.which==3){
                    e.stopPropagation();
                    var name=$(e.target).text();
                    if($(e.target).hasClass("InactiveAvatarLink")){
                        name=$(e.target).children("a:first").text();
                    }
                    $(e.target).contextMenu({ inSpeed : 150, outSpeed: 75, menu: "CharacterMenu", beforeOpen: function(){
                        var currentUser=name;
                        $("#CharacterMenu .header").html("<h3 id='ContextMenuHeader'>" + currentUser + "</h3>");
                        $("#CharacterMenu .ministatus img").replaceWith("<img src='" + staticdomain + "images/noavatar.png'/>");
                        $("#CharacterMenu .ministatus img").attr("src", staticdomain + "images/avatar/" + currentUser.toLowerCase() + ".png");
                        var sm = FList.Chat.users.getData(currentUser).statusmsg;
                        $("#CharacterMenu .ministatus").css("display", "block");
                        //if inactive avatarlink, not in chattab, so hide op stuff
                        if(FList.Chat.isChatop() && $(e.target).hasClass("AvatarLink")){
                            $(".cm-chatop").show();
                        } else {
                            $(".cm-chatop").hide();
                        }
                        if(FList.Chat.isChanop(FList.Chat.TabBar.activeTab.id, currentUser)){
                            $(".chatopadd").hide();$(".chatopdel").show();
                        } else {
                            $(".chatopdel").hide();$(".chatopadd").show();
                        }
                        if(FList.Chat.TabBar.activeTab.type=="channel"){
                            if((FList.Chat.isChanop(FList.Chat.TabBar.activeTab.id) || FList.Chat.isChatop()) && $(e.target).hasClass("AvatarLink")){
                                $(".cm-chanop").show();
                            } else {
                                $(".cm-chanop").hide();
                            }
                            if((FList.Chat.isChanOwner() || FList.Chat.isChatop())  && $(e.target).hasClass("AvatarLink")){
                                $(".cm-chanown").show();
                            } else {
                                $(".cm-chanown").hide();
                            }
                        } else {
                            $(".cm-chanop, .cm-chanown").hide();
                        }
                        if (typeof(sm) == "string" && sm !== "") $("#CharacterMenu .ministatus span").html(FList.ChatParser.parseContent(sm));
                        else  $("#CharacterMenu .ministatus span").html("");
                        $("#CharacterMenu .ignoreadd, #CharacterMenu .ignoredel").hide();
                        if(jQuery.inArray(currentUser.toLowerCase(),FList.Chat.ignoreList)!==-1) $("#CharacterMenu .ignoredel").show();
                        else $("#CharacterMenu .ignoreadd").show();
                    },callback: function(action, el, pos) {
                        var currentUser=$(el).text();
                        if($(el).hasClass("InactiveAvatarLink")){
                            currentUser=$(el).children("a:first").text();
                        }
                        switch(action){
                            case 'priv': 
                                FList.Chat.openPrivateChat(currentUser, false);
                                break;	
                            case 'flist': 
                                window.open(domain + "c/" + currentUser.toLowerCase() + "/");
                                break;	
                            case 'ignoreadd': 
                                FList.Connection.send("IGN " + JSON.stringify({ "action": "add", "character": currentUser }));
                                $(el).addClass("AvatarBlocked");
                                break;	
                            case 'ignoredel': 
                                FList.Connection.send("IGN " + JSON.stringify({ "action": "delete", "character": currentUser }));
                                $(el).removeClass("AvatarBlocked");
                                break;	                    
                            case "report":
                                FList.Chat.staffAlert.dialog();
                                $(".ui-report-user").val(currentUser);
                                break;
                            case "chanban":
                                FList.Connection.send("CBU " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, character: currentUser }));  
                                break;
                            case "chankick":
                                FList.Connection.send("CKU " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, character: currentUser }));             
                                break;
                            case "chanopadd":
                                FList.Connection.send("COA " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, character: currentUser }));  
                                break;
                            case "chanopdel":
                                FList.Connection.send("COR " + JSON.stringify({ channel: FList.Chat.TabBar.activeTab.id, character: currentUser }));  
                                break;
                            case "accountban":
                                if(confirm("Are you sure you want to ban this user's account?")){
                                    FList.Connection.send("ACB " + JSON.stringify({ character: currentUser }));  
                                }
                                break;
                            case "ipban":
                                if(confirm("Are you sure you want to ban this user's IP address?")){
                                    FList.Connection.send("IPB " + JSON.stringify({ character: currentUser }));  
                                }
                                break;
                            case "chatkick":
                                if(confirm("Are you sure you want to kick this user from the chat?")){
                                    FList.Connection.send("KIK " + JSON.stringify({ character: currentUser }));  
                                }
                                break;
                            case "altwatch":
                                FList.Connection.send("AWC " + JSON.stringify({ character: currentUser }));  
                                break;
                            case "timeout":
                                if(confirm("Are you sure you want to time this user out for 30 minutes?")){
                                    FList.Connection.send("TMO " + JSON.stringify({ time: 30, character: currentUser, reason: "" }));  
                                }
                                break;
                        }}});
                }
            } 
        });
        FList.Chat.Settings.apply();
    }

};
