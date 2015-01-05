FList.Chat.Menu = {

    init: function(){
        $("#header-fchat").FlexMenu(
        { offset: "1 8",
            items: [
            {
                text: "F-Chat",
                type: "menu-header"
            }, {
                text: "Undo close tab",
                type: "menu-action",
                id: "mnu-tab-undo",
                handler: function(){
                    FList.Chat.TabBar.undoClose();
                }
            },{
                text: "Alert Staff",
                type: "menu-action",
                handler: function(){
                    FList.Chat.staffAlert.dialog();
                },
                icon: staticdomain + "images/icons/flag.png"
            },{
                text: "Open chat with...",
                type: "menu-action",
                handler: function(){
                    var openchatdlg= $("<div class='StyledForm'><p><span class='label'>Character name</span><span class='element'><input type='text' maxlength='50' class='ui-openchat-text'/></span></p></div>");
                    openchatdlg.dialog({
                        autoOpen: true, title: 'Open chat with...', width: '350', height:'150', modal: true,
                        buttons: {
                            "Open": function(){
                                var charname=openchatdlg.find(".ui-openchat-text").val();
                                var data=FList.Chat.users.getData(charname);
                                if(data.status=="Offline"){
                                    FList.Common_displayError("This user is currently offline, or doesn't exist.");
                                } else {
                                    FList.Chat.openPrivateChat(data.name, false); 
                                    openchatdlg.dialog("close");
                                }
                            },
                            "Cancel": function(){
                                openchatdlg.dialog("close");
                            }
                        }
                    });
                    $("#header-fchat").FlexMenu("hide");
                },
                fixed: true
            },{
                text: "Logout",
                type: "menu-action",
                handler: function ()
                {
                    FList.Connection.ws.close();
                    $("#header-fchat").FlexMenu("hide");
                }
            }]
        });

        
    }

};
