
FList.Chat.Channel = function(name, title, description){
	this.name=name;
    this.title = title;
	this.description=description;
	this.userlist=[];
    this.oplist=[];
    this.mode="both";//channel mode limitation, ads, chat, both
    this.userMode="both";//user override setting, limited by this.mode.
    this.joined=false;
    this.created=true;//is this an instance, or is this default data (getData), for joining an noexistant room
    this.owner="";
};

FList.Chat.channels = new function ChatChannels() {

	this.list = [];
	
    this.create = function(channel, title){
        this.list[channel.toLowerCase()] = new FList.Chat.Channel(channel, title, "");
	};
    
    this.getData = function(name){
        if (this.list[name.toLowerCase()]) return this.list[name.toLowerCase()];
        else return { name: name, joined: false, created: false, mode: "both", userMode: "both", title: name, description: "This room no longer exists or is not joined.", userlist: [],oplist:[],owner:"" };
	};
    
    this.addUser = function(channel, user){
		var channel=this.getData(channel);
		if(channel.joined){
			if(jQuery.inArray(user,channel.userlist)==-1) {
				channel.userlist.push(user);
			}
		}
	};
    
    this.removeUser = function(channel,user){
		var channel=this.getData(channel);
		var name=user.toLowerCase();
		if(channel.joined){
			for(var i in channel.userlist){
				if(channel.userlist[i].toLowerCase()==name){
					channel.userlist.splice(i, 1);
					break;
				}
			}
		}
	};

};



FList.Chat.users = new function ChatUsers() {
//global userlist.
	this.list = [];
    this.userdata = {};
    this.count=0;
    this.t_i=1;
    
    this.toggleLink = function(el){
        var userid=$(el).children("a:first").text();
        var tab=FList.Chat.TabBar.getTabFromId("user", userid);
        if(!$(el).hasClass("list-item-important")){
            FList.Chat.openPrivateChat(userid, false);
            $(el).addClass("list-item-important");
        } else {
            FList.Chat.TabBar.closeTab(tab.tab);
            $(el).removeClass("list-item-important");
        }
    };
    
    this.getToggleLink = function(name){
        var classes="InactiveAvatarLink " + FList.Chat.getPrintClasses(name, false).substring(11);
        var status=FList.Chat.users.getData(name).status;
        var tab=FList.Chat.TabBar.getTabFromId("user", name);
        if(tab!==false) {
            if(!tab.closed){
                classes = classes + " list-item-important";
            }
        }
        var htmlstring="<div class='list-highlight panel " + classes + " toggle-item' id='toggle-item-" + FList.Chat.users.t_i + "' onclick=\"FList.Chat.users.toggleLink($('#toggle-item-" + FList.Chat.users.t_i + "'));\"><img src='" + staticdomain + "images/avatar/" + name.toLowerCase() + ".png'/><a>" + name + "</a><br/><span>" + FList.ChatParser.parseContent(FList.Chat.users.getData(name).statusmsg) + "</span></div>";
        FList.Chat.users.t_i+=1;
        return htmlstring;
    };
    
    this.isTracked = function(name){
        var tracked=false;
        if (jQuery.inArray(name, FList.Chat.bookmarksList) !== -1){
            tracked=true;
        }
        if (jQuery.inArray(name, FList.Chat.friendsList) !== -1){
            tracked=true;
        }
        return tracked;
    },
    
    this.add = function(name){
		if(jQuery.inArray(name, this.list)==-1){
            this.list.push(name);
            this.userdata[name.toLowerCase()] = this.getData(name);//get default data :3
        }
        if (jQuery.inArray(name, FList.Chat.friendsList) !== -1)
        {
            FList.Chat.friendsOnline.push(name);
        }
        if (jQuery.inArray(name, FList.Chat.bookmarksList) !== -1)
        {
            FList.Chat.bookmarksOnline.push(name);
        }
	};
    
    this.remove = function(name){
		for(var i in this.list){
			if(this.list[i]==name) this.list.splice(i, 1);
		}
        delete this.userdata[name.toLowerCase()];
        if (jQuery.inArray(name, FList.Chat.friendsList) !== -1)
        {
            $.each(FList.Chat.friendsOnline, function(i,item){
                if(typeof(item)!=="undefined"){
                    if(item==name) FList.Chat.friendsOnline.splice(i, 1);
                }
            });
        }
        if (jQuery.inArray(name, FList.Chat.bookmarksList) !== -1)
        {
            $.each(FList.Chat.bookmarksOnline, function(i,item){
                if(typeof(item)!=="undefined"){
                    if(item==name) FList.Chat.bookmarksOnline.splice(i, 1);
                }
            });
        }
        for(var key in FList.Chat.channels.list) { 
            var channel=FList.Chat.channels.list[key].name;
            var userlist=FList.Chat.channels.list[key].userlist;
            if (jQuery.inArray(name, userlist) !== -1){
                FList.Chat.channels.removeUser(channel,name);
            }
        }
	};
    
    this.setData = function(user, data) {
        var olddata=this.getData(user);
        if (typeof(data.status) == "string") {
			olddata.status = this.sanitizeStatus(data.status);
        }    
        if (typeof(data.gender) == "string") {
			olddata.gender = data.gender;
        }            
        if (typeof(data.statusmsg) == "string") olddata.statusmsg = data.statusmsg.replace(/\[icon\].*\[\/icon\]/g, "");
        this.userdata[user.toLowerCase()] = olddata;
    };
    
    this.sanitizeStatus = function(status) {
        if (status.toLowerCase() == "looking") return "Looking";
        else if (status.toLowerCase() == "busy") return "Busy";
        else if (status.toLowerCase() == "idle") return "Idle";
        else if (status.toLowerCase() == "away") return "Away";
        else if (status.toLowerCase() == "dnd") return "DND";
        else if (status.toLowerCase() == "crown") return "Crown";
        else return "Online";
	};
    
    this.getData = function(user) {
        if (this.userdata[user.toLowerCase()]) return this.userdata[user.toLowerCase()];
        else return { name: user, status: "Offline", gender: "None", statusmsg: "" };
    };
    
};

