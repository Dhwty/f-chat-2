/**
 * Changelog 2.0 ---- As of 2/13/2014
 *
 * Fixed:
 * Bug with dates on persisting PM logs.
 * Various other fixes.
 *
 * New features/implementations:
 * Browser tab title notification of cumulative number of unread private messages/hits on keywords.
 * ^-> These only proc if the browser window tab is out of focus or the private message tab is out of focus.
 * Added a local syntax helpfile for every command.
 * Added a help command, which lists all the commands currently implemented in F-Chat 2.0.
 *
 * Refactorization/Optimization.
 * Completely redone parsing/handling of commands.
 */

 /**
 * Lexical scope protection for aliasing. (Wraps anonymous function throughout the entire file)
 */
(function () {

FList.Chat.Input = {};
FList.Chat.Input.Commands = {};

/**
 * Local Clear function
 */
var pass = function() {
    $('#message-field').val('');
},

/**
 * Socket Send alias.
 *
 * @param {String} msg The message to send to the server.
 */
wsSend = function(sendString) {
    FList.Connection.send(sendString);
},

/**
 * Current Tab alias.
 *
 * @define {Object} curTab The current tab in focus.
 */
curTab = FList.Chat.TabBar.activeTab,

/**
 * PrintMessage alias.
 *
 * @param {String} message The string to print
* @param {Boolean} type Message Type
 */
fprint = function(message, type) {
type = (type) ? 'error' : 'system';
FList.Chat.printMessage({msg: message, from: 'System', type: type, log: ((type === "system") ? true : false)});
},

/**
 * Local help display
 *
 * @param {String} cmd The command to display help for
 */
help = function(cmd) {
    var egParms = ' ',
        i;

    cmd = FList.Chat.Input.Commands[cmd];

fail('[b]Help reference for[/b]: ' + cmd.title);
fail('[b]Command description[/b]: ' + cmd.does);


    if (cmd.params) {
        for (i = 0, ii = cmd.params.length; i < ii; ++i) {
            egParms += cmd.params[i].ID.toLowerCase();

            if ((cmd.params[i].separate ||
                (cmd.params[i].type === 'character' && !cmd.params[i].onlineOnly)) &&
                (cmd.params.length > 1 && cmd.params.length !== (i + 1))) {
                egParms += ', ';
            } else {
                egParms += ' ';
            }

        }

    fail('[b]Syntax[/b]: /' + cmd.title.toLowerCase() + egParms);

    fail('[b]Parameters[/b]: ');

        for (i = 0;i < cmd.params.length;++i) {
        fail('<b style=\'margin-left:15px\'>' +
                   cmd.params[i].ID + '</b>: ' +
                   cmd.params[i].hint);
        }
    }

},

/**
 * Local Fail function, optional callHelp_ boolean to display help notifications on certain types of opt-outs.
 *
 * @param {String} err Error message
 * @param {String} [opt_callHelp] Optional display helpfile call.
 */
fail = function (err, opt_callHelp) {
fprint(err, true);

    if (opt_callHelp) {
        help(opt_callHelp);
    }

};

/**
 * Input sanitation for the user's own printed response.
 *
 * @param {String} input The message to sanitize/HTML break
 */
FList.Chat.Input.sanitize = function(input) {
    return input.replace(/</gi, '&lt;').replace(/>/gi, '&gt;');
};

/**
 * Parser function (Arg: raw user input string)
 * Parses a raw user input string, sends to appropriate function after parsing arguments to pass down in the specified formatting.
 * Seperation is handled by specific orders and type declarations.
 * Valid types are: 'string', 'character', 'word', and 'number'.
 * 'words' can have a oneOf declaration array.
 * To skip online checks simply do not define onlineOnly in the object as a true value. If it isn't set online only, it will require a comma separator if there is more than one argument, but this is automatically done, you do not need to also specify a separation:true.
 * To work with multiple strings, declare a separator in the param object.
 * You can set a parameter as optional within the specific parameter definition object, setting it to any value that returns true will cause the parser to consider it optional. Undefined will state it's optional.
 * Traditional separation is done with spacing unless there are multiple string declarations in the command, in which case you may need to declare seperation in the method mentioned above. This uses a comma to seperate strings and tell the parser where to split the string.
 *
 * @author Kali/Maw
 * @param {String} input The raw user input.
 * @this {FList.Chat.Input}
 */
FList.Chat.Input.parse = function(input) {
    var invoke = '',
        parameters = [],
        toSend = [],
        cmdObj = FList.Chat.Input.Commands,
        paramfmt,
        i,
        curfmt,
        num,
        lineStore,
        matchCount,
        matcherString,
        regx;

input = input.split(/ +/gi);

    invoke = input
             .shift()
             .replace('/','');

    if (!cmdObj[invoke]) {
        return fail('Unrecognized command.');
    }

    paramfmt = cmdObj[invoke].params;

    if (!paramfmt) {
        return cmdObj[invoke].func();
    }

    parameters = input;

    input = input.join(' ');

    if (parameters[0] === 'help') {
        return help(invoke);
    }

    for (i = 0;i < paramfmt.length;++i) {
        curfmt = paramfmt[i];

        if (parameters.length === 0 && !curfmt.optional) {
            return fail('Parameter missing for mandatory parameter number ' + (i + 1) + '.', invoke);
        }

        if (curfmt.type === 'word') {

            if (curfmt.oneOf && curfmt.oneOf.indexOf(parameters[0].toLowerCase()) === -1) {
                return fail('Parameter number ' + (i + 1) + ' is not one of the accepted inputs.', invoke);
            }

            toSend.push(parameters
                       .shift()
                       .toLowerCase());
        }

        if (curfmt.type === 'character') {

            if (curfmt.onlineOnly) {
                matchCount = 1;

                matcherString = FList.Chat.users.list.join('\n') + '\n';

                lineStore = parameters.shift();

                regx = new RegExp(('^' + lineStore + '[a-z0-9-_ ]*'), 'gmi');

                if (!regx.test(matcherString)) {
                    return fail('User is not currently online or does not exist. ' +
                                    '(No partial/full matches for: \'' + lineStore + '\')');
                }

                while (matchCount && parameters.length) {
                    lineStore += ' ' + parameters.shift();

                    regx = new RegExp(('^' + lineStore + '[a-z0-9-_ ]*'), 'gmi');

                    matchCount = matcherString.match(regx);
            }
            if (!matchCount && paramfmt.length === 1) {
                return fail('User is not currently online or does not exist. ' +
                                '(No partial/full matches for: \'' + lineStore + '\')');
                }

                if (!matchCount) {
                    lineStore = lineStore.split(' ');

                    parameters.unshift(lineStore.pop());

                    lineStore = lineStore.join(' ');
                }

                regx = new RegExp(('^' + lineStore + '[a-z0-9-_ ]*'), 'gmi');

                if (matcherString.match(regx).length !== 1) {
                    regx = new RegExp(('^' + lineStore + '$'), 'gmi');

                    if (!matcherString.match(regx)) {
                        return fail('More than one user with the name prefix \'' +
                                        lineStore + '\' exists.');
                    }

                    toSend.push(matcherString.match(regx)[0]);
                } else {
                    toSend.push(matcherString.match(regx)[0]);
                }

            } else if (paramfmt.length > 1) {
                parameters = (parameters
                             .join(' ')
                             .split(','));

                toSend.push(parameters
                             .shift()
                             .trim());

                parameters = (parameters
                             .join(',')
                             .trim()
                             .split(' '));
            } else {
                toSend.push(parameters.join(' '));
            }

        }

        if (curfmt.type === 'number') {
            num = parseInt(parameters[0], 10);

            if (isNaN(num)) {
                return fail('Parameter number ' + (i + 1) + ' is not an integer.', invoke);
            }

            if (!(curfmt.limit && num >= curfmt.limit[0] && num <= curfmt.limit[1])) {
                return fail('Parameter number ' + (i + 1) +
                                ' is out of range of specified numerical limits.', invoke);
            }

            parameters.shift();

            toSend.push(num);
        }

        if (curfmt.type === 'string') {

            if (curfmt.separate)
            {
                parameters = (parameters
                             .join(' ')
                             .split(','));

                toSend.push(parameters
                             .shift()
                             .trim());

                parameters = (parameters
                             .join(',')
                             .trim()
                             .split(' '));
            } else {
                toSend.push(parameters.join(' '));
            }

        }

    }
    cmdObj[invoke].func(toSend);
};

/**
 * Initial user input is handled here.
 *
 * @param {String} msg The user input
 */
FList.Chat.Input.handle = function(msg) {
    curTab = FList.Chat.TabBar.activeTab;
    var channeldata = FList.Chat.channels.getData(curTab.id),
    isRp = (msg.indexOf('/me') === 0),
        msgType = 'chat',
    isCmd = (msg.charAt(0) === '/'),
    isWarn = (msg.indexOf('/warn ') === 0);

if (isRp) msgType = 'rp';

    if (curTab.type === 'console') {

    if (isCmd && !isRp && !isWarn) return this.parse(msg);

    return FList.Common_displayError('You cannot chat in the console.');
    } else if (curTab.type === 'channel') {

    if (isCmd && !isRp && !isWarn) return this.parse(msg);

    if (channeldata.mode === 'ads')
                return FList.Chat.Roleplay.sendAd(curTab.id, msg);

            if (msg.trim()){

        if (FList.Chat.Settings.current.html5Audio)
                    FList.Chat.Sound.playSound('chat');

                wsSend('MSG ' +
                       JSON.stringify({channel: curTab.id, 'message': msg}));

        if (isRp) msg = msg.substr(3);

                msg = FList.Chat.Input.sanitize(msg);

        FList.Chat.printMessage({
            "msg": msg,
            to: FList.Chat.TabBar.getTabFromId('channel', curTab.id),
            from: FList.Chat.identity,
            type: msgType
        });

                pass();
            }

    } else {// User

    if (isCmd && !isRp && !isWarn) return this.parse(msg);

        if (msg.trim()){

        if (FList.Chat.Settings.current.html5Audio)
                FList.Chat.Sound.playSound('chat');

            wsSend('PRI ' +
                   JSON.stringify({recipient: curTab.id, 'message': msg}));

        if (isRp) msg = msg.substr(3);
        msg = FList.Chat.Input.sanitize(msg);
        FList.Chat.Logs.saveLogs(
            FList.Chat.identity,
            {
                msg: msg,
                kind: msgType,
                to: curTab.id.toLowerCase()
            }
        );

        FList.Chat.printMessage({
            msg: msg,
            from: FList.Chat.identity,
            type: msgType
        });

            pass();

            curTab.metyping = false;
            curTab.mewaiting = true;
        }

    }

};

/**
 * RWD
 * Reward command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.reward = {
    func: function(args) {
        wsSend('RWD ' +
               JSON.stringify({character:args[0]}));

        pass();
    },
    title: 'Reward',
    does: 'You must construct additional pylons.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid name of an existing character.'
        }
    ]
};

/**
 * Join command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.join = {
    func: function(args) {
        FList.Chat.openChannelChat(args[0], false);

        pass();
    },
    title: 'Join',
    does: 'This joins the channel id or name mentioned.',
    params: [
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid channel id/name. Public channels use their actual name, and private' +
                    ' (but open) channels use their room ID which you can get from typing \'/code\' in that room.'
        }
    ]
};

/**
 * Close command.
 */
FList.Chat.Input.Commands.close = {
    func: function() {

        if (curTab.type === 'console') {
            return fail('You can not close the console window.');
        }

        FList.Chat.TabBar.closeTab(curTab.tab);

        pass();
    },
    title: 'Close',
    does: 'Leaves the currently viewed channel. ([i]Note[/i]: Cannot be used on the ' +
          'console window.)'
};

/**
 * UPT
 * Uptime command.
 */
FList.Chat.Input.Commands.uptime = {
    func: function() {
        wsSend('UPT');

        pass();
    },
    title: 'Uptime',
    does: 'Reports how long the server has been running.'
};

/**
 * STA
 * Status command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.status = {
    func: function(args) {
        var sendString = 'STA ';

        if (args[1] && args[1].length > 255) {
            return fail('The status message cannot be more than 255 characters long.');
        }

        if (args[1]) {
            sendString += JSON.stringify({status:args[0], statusmsg:args[1]});
        } else {
            sendString += JSON.stringify({status:args[0]});
        }

        wsSend(sendString);

        pass();
    },
    title: 'Status',
    does: 'Sets your status and an optional message to accommodate it.',
    params: [
        {
            type: 'word',
            ID: 'Condition',
            hint: 'A valid status containing one of the following: [b]Online[/b], [b]Busy[/b]' +
                  ', [b]Looking[/b], [b]Away[/b], [b]DND[/b], [b]Idle[/b] or [b]Busy[/b].',
            oneOf: ['online', 'looking', 'away', 'dnd', 'idle', 'busy']
        },
        {
            type: 'string',
            ID: 'Message',
            hint: 'A message that defines your status. (Optional)',
            optional: true
        }
    ]
};

/**
 * Priv command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.priv = {
    func: function(args) {
        FList.Chat.openPrivateChat(args[0], false);

        pass();
    },
    title: 'Private Message',
    does: 'Opens a PM dialog with a user.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid name of a currently online character.',
            onlineOnly: true
        }
    ]
};

/**
 * CTU
 * Channel Timeout command
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.timeout = {
    func: function(args) {
        var channel = curTab;

        if(channel.type !== 'channel') {
            return fail('You can only time people out in a channel.');
        }

        wsSend('CTU ' +
               JSON.stringify({channel: channel.id, character: args[0], length: args[1]}));

        pass();
    },
    title: 'Timeout',
    does: 'Temporarily rejects access to the channel for a specified period of time.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid character name.',
            separate: true
        },
        {
            type: 'number',
            ID: 'Minutes',
            hint: 'The amount of time (in minutes) to temporarily reject access to the chat for the user.',
            limit: [1 , Infinity]
        }
    ]
};

/**
 * TMO
 * Global timeout command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.gtimeout = {
    func: function(args) {
        wsSend('TMO ' +
               JSON.stringify({time: args[1], character: args[0], reason: args[2]}));

        pass();
    },
    title: 'Gtimeout',
    does: 'Temporarily rejects access to the chat client for a specified period of time.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid character name.',
            separate: true
        },
        {
            type: 'number',
            ID: 'Minutes',
            hint: 'The amount of time (in minutes) to temporarily reject access to the chat for the user.',
            limit: [1 , Infinity],
		  separate: true 
        },
        {
            type: 'string',
            ID: 'Reason',
            hint: 'A brief string detailing the reason behind the disciplinary action.'
        }
    ]
};

/**
 * RLL
 * Roll command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.roll = {
    func: function(args) {
        var dice,
            tab,
            rolls,
            i,
            dt,
            r,
            d,
            message_body;

        tab = FList.Chat.TabBar.activeTab;

        if(tab.type === 'console') {
            return fail('You can not roll dice in the console.');
        }

        dice = args[0].replace(/ /g, '');

        if (!dice) {
            dice = '1d10';
        }

        rolls = dice.split(/[+\-]/);

        for (i = 0;i < rolls.length;++i) {

            if (!((/^[0-9]d[0-9]+$/).test(rolls[i]) || (/^[0-9]+$/.test(rolls[i])))) {
                return fail('Wrong dice format. Dice format is throw+throw+throw+...' +
                            ', where a throw is either [1-9]d[2-100] or just a number to be added.');
            }

            dt = rolls[i].split('d');
            r = parseInt(dt[0], 10);
            d = parseInt(dt[1], 10);
            if (dt.length > 1 && (r > 9 || d < 1 || d > 500)) {
                return fail('Dice integers out of valid range.');
            }
            if (parseInt(rolls[i], 10) > 10000) {
                return fail('Invalid modifier or modifier out of range.');
            }
        }

        message_body = {dice: dice};

        tab.type === 'channel' ? message_body.channel = tab.id : message_body.recipient = tab.id;

        wsSend('RLL ' + JSON.stringify(message_body));

        pass();
    },
    title: 'Roll',
    does: 'Rolls the dice and displays the result to the room. ' +
          '(You can add further dice rolls/integers with +)',
    params: [
        {
            type: 'string',
            ID: 'Formatted String',
            hint: 'Format is \'XdY\'. Where X is the amount of dice to roll with Y faces ' +
                  '(Limit: 9) and Y is the number of faces on the die. (Limit: 100). ' +
                  'You can do addition and subtraction on these rolls further as well. (Optional)',
            optional: true
        }
    ]
};

/**
 * CKU
 * Channel Kick command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.kick = {
    func: function(args) {

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            wsSend('CKU ' +
                   JSON.stringify({channel: args[1], character: args[0]}));
        } else {
            wsSend('CKU ' +
                   JSON.stringify({channel: curTab.id, character: args[0]}));
        }

        pass();
    },
    title: 'Kick',
    does: 'Kicks a user from a channel.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid online character.',
            onlineOnly: true
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'The channel to kick the character from. (Optional)',
            optional: true
        }
    ]
};

/**
 * COL
 * Channel Operator List command.
 */
FList.Chat.Input.Commands.coplist = {
    func: function() {

        if (curTab.type !== 'channel') {
            return fail('You must be in a channel to use this command.');
        }

        wsSend('COL ' +
               JSON.stringify({channel: curTab.id}));

        pass();
    },
    title: 'Coplist',
    does: 'Shows the channel operators for the channel in focus.'
};

/**
 * Global Operator List command.
 */
FList.Chat.Input.Commands.listops = {
    func: function() {
        var str = '',
            i;

        for (i = 0;i < FList.Chat.opList.length;++i) {
            str = str + '[user]' + FList.Chat.opList[i] + '[/user], ';
        }

        str = str.substring(0 , (str.length - 2));

        FList.Chat.printMessage({msg: 'Ops: ' + str, from: 'System', type: 'system'});

        pass();
    },
    title: 'Listops',
    does: 'Lists global operators currently online.'
};

/**
 * CBU
 * Channel ban command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.ban = {
    func: function(args) {

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            wsSend('CBU ' +
                   JSON.stringify({channel: args[0], character: args[1]}));
        } else {
            wsSend('CBU ' +
                   JSON.stringify({channel: curTab.id, character: args[0]}));
        }

        pass();
    },
    title: 'Ban',
    does: 'Ban a user from a specific channel.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character.'
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'The channel to ban the character from. (Optional)',
            optional: true
        }
    ]
};

/**
 * CUB
 * Channel Unban command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.unban = {
    func: function(args) {

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            wsSend('CUB ' +
                   JSON.stringify({channel: args[0], character: args[1]}));
        } else {
            wsSend('CUB ' +
                   JSON.stringify({channel: curTab.id, character: args[0]}));
        }

        pass();
    },
    title: 'Unban',
    does: 'Unban a user from a specific channel.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character.'
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'The channel to unban the character from. (Optional)',
            optional: true
        }
    ]
};

/**
 * UNB
 * Global Unban command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.gunban = {
    func: function(args) {

        if(!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        if (args[0]) {
            wsSend('UNB ' +
                   JSON.stringify({character:args[0]}));
        } else {
            wsSend('UNB ' +
                   JSON.stringify({character:curTab.id}));
        }

        pass();
    },
    title: 'Gunban',
    does: 'Unban a user from F-Chat.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character. (Optional)',
            optional: true
        }
    ]
};

/**
 * RLL
 * Bottle command.
 */
FList.Chat.Input.Commands.bottle = {
    func: function() {
        var message_body = {dice: 'bottle'};

        curTab.type === 'channel' ? message_body.channel = curTab.id : message_body.recipient = curTab.id;

        if(curTab.type === 'console') {
            return fail('You can not spin the bottle in the console.');
        }

        wsSend('RLL ' + JSON.stringify(message_body));

        pass();
    },
    title: 'Bottle',
    does: 'Spin the bottle toward a random character within the channel.'
};

/**
 * CSO
 * Set Channel Owner command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.setowner = {
    func: function(args) {

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            wsSend('CSO ' +
                   JSON.stringify({channel: args[1], character: args[0]}));
        } else {
            wsSend('CSO ' +
                   JSON.stringify({channel: curTab.id, character: args[0]}));
        }

        pass();
    },
    title: 'Setowner',
    does: 'Set the owner of a specific channel.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid online character.',
            onlineOnly: true
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid channel. (Optional)',
            optional: true
        }
    ]
};

/**
 * IGN
 * Ignore command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.ignore = {
    func: function(args) {
        if (FList.Rights.has("chat-chatop")) {
            return fail("As a chatop, you can't ignore chatters, and they cannot ignore you.");
        }
        
        if (!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        var name = (args[0] || curTab.id).toLowerCase();
        
        for (i = 0; i < FList.Chat.opList.length; i++) {
            if (name === FList.Chat.opList[i].toLowerCase()) {
                return fail("You can't ignore a global moderator, and they cannot ignore you.");
            }
        }

        wsSend('IGN ' +
            JSON.stringify({action: 'add', character: name}));

        pass();
    },
    title: 'Ignore',
    does: 'Ignore a character.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character. (Optional)',
            optional: true
        }
    ]
};

/**
 * Ignore List command.
 */
FList.Chat.Input.Commands.ignorelist = {
    func: function() {
        var user = '',
            i;

        if (!FList.Chat.ignoreList.length) {
            return fail('You are not ignoring anyone.');
        }

        for (i = 0;i < FList.Chat.ignoreList.length;++i) {
            user += '[user]' + FList.Chat.ignoreList[i] + '[/user], ';
        }

        fprint('You are ignoring: ' + user.substring(0,user.length-2));

        pass();
    },
    title: 'Ignorelist',
    does: 'Lists characters whom you have ignored.'
};

/**
 * IGN
 * Unignore command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.unignore = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        if (args[0]) {
            wsSend('IGN ' +
                   JSON.stringify({'action': 'delete', 'character': args[0]}));
        } else {
            wsSend('IGN ' +
                   JSON.stringify({'action': 'delete', 'character': curTab.id}));
        }

        pass();
    },
    title: 'Unignore',
    does: 'Unignore a user.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character. (Optional)',
            optional: true
        }
    ]
};

/**
 * CCR
 * Create Channel command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.makeroom = {
    func: function(args) {
        wsSend('CCR ' +
               JSON.stringify({channel: args[0]}));

        pass();
    },
    title: 'Makeroom',
    does: 'Creates a private channel.',
    params: [
        {
            type: 'string',
            ID: 'Name',
            hint: 'A name for the created private channel.'
        }
    ]
};

/**
 * AOP
 * Add Global Operator command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.gop = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        if (args[0]) {
            wsSend('AOP ' +
                   JSON.stringify({character: args[0]}));
        } else {
            wsSend('AOP ' +
                   JSON.stringify({character: curTab.id}));
        }

        pass();
    },
    title: 'Gop',
    does: 'Adds an operator.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character. (Optional)',
            optional: true
        }
    ]
};

/**
 * DOP
 * Global Remove Operator command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.gdeop = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        if (args[0]) {
            wsSend('DOP ' +
                   JSON.stringify({character: args[0]}));
        } else {
            wsSend('DOP ' +
                   JSON.stringify({character: curTab.id}));
        }

        pass();
    },
    title: 'Gdeop',
    does: 'Removes operator status from a specified character.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character. (Optional)',
            optional: true
        }
    ]
};

/**
 * RLD
 * Reload Config command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.reload = {
    func: function(args) {
        var word = args[0],
                o = {};

        if (word === 'save') {
            o.save = 'yes';
        }

        wsSend('RLD ' + JSON.stringify(o));

        pass();
    },
    title: 'Reload Config',
    does: 'Reloads server config files from disk.',
    params: [
        {
            type: 'word',
            ID: 'Parameter',
            hint: 'Specified file(?) or save state(?)'
        }
    ]
};

/**
 * COA
 * Add Channel Operator command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.op = {
    func: function(args) {

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            wsSend('COA ' +
                   JSON.stringify({channel: args[1], character: args[0]}));
        } else {
            wsSend('COA ' +
                   JSON.stringify({channel: curTab.id, character: args[0]}));
        }

        pass();
    },
    title: 'Op',
    does: 'Adds a Moderator/Channel Operator to the private room.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character.'
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid channel. (Optional)',
            optional: true
        }
    ]
};

/**
 * COR
 * Remove Channel Operator command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.deop = {
    func: function(args) {
        var sendString = 'COR ';

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            sendString += JSON.stringify({channel: args[1], character: args[0]});
        } else {
            sendString += JSON.stringify({channel: curTab.id, character: args[0]});
        }

        wsSend(sendString);

        pass();
    },
    title: 'Deop',
    does: 'Removes a Moderator/Channel Operator from the private room.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character.'
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid channel. (Optional)',
            optional: true
        }
    ]
};

/**
 * RST
 * Channel Closure command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.closeroom = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'channel') {
            return fail('Using this command without a parameter only works if you are in a channel.');
        }

        if (args[0]) {
            wsSend('RST ' +
                   JSON.stringify({channel: args[0], status: 'private'}));
        } else {
            wsSend('RST ' +
                   JSON.stringify({channel: curTab.id, status: 'private'}));
        }

        pass();
    },
    title: 'Closeroom',
    does: 'This will close an opened private room, removing it from the list, and making further entry invite-only.',
    params: [
        {
            type: 'string',
            ID: 'ID',
            hint: 'A valid private channel id. (Optional)',
            optional: true
        }
    ]
};

/**
 * RST
 * Open Private Channel command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.openroom = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'channel') {
            return fail('Using this command without a parameter only works if you are in a channel.');
        }

        if (args[0]) {
            wsSend('RST ' +
                   JSON.stringify({channel: args[0], status: 'public'}));
        } else {
            wsSend('RST ' +
                   JSON.stringify({channel: curTab.id, status: 'public'}));
        }

        pass();
    },
    title: 'Openroom',
    does: 'This will open a private room and adding it to the list of channels.',
    params: [
        {
            type: 'string',
            ID: 'ID',
            hint: 'A valid private channel id. (Optional)',
            optional: true
        }
    ]
};

/**
 * CBL
 * Channel Banlist command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.banlist = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'channel') {
            return fail('Using this command without a parameter only works if you are in a channel.');
        }

        if (args[0]) {
            wsSend('CBL ' +
                   JSON.stringify({channel: args[0]}));
        } else {
            wsSend('CBL ' +
                   JSON.stringify({channel: curTab.id}));
        }

        pass();
    },
    title: 'Banlist',
    does: 'Shows the channel\'s banlist.',
    params: [
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid channel id/name. (Optional)',
            optional: true
        }
    ]
};

/**
 * KIC
 * Kill Channel command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.killchannel = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'channel') {
            return fail('Using this command without a parameter only works if you are in a channel.');
        }

        if (args[0]) {
            wsSend('KIC ' +
                   JSON.stringify({channel: args[0]}));
        } else {
            wsSend('KIC ' +
                   JSON.stringify({channel: curTab.id}));
        }

        pass();
    },
    title: 'Killchannel',
    does: 'Nukes a channel from F-Chat. Watch out for falling debris and radioactive fallout.',
    params: [
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid channel id/name. (Optional)',
            optional: true
        }
    ]
};

/**
 * CRC
 * Create Private Channel command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.createchannel = {
    func: function(args) {
        wsSend('CRC ' +
               JSON.stringify({channel: args[0]}));

        pass();
    },
    title: 'Createchannel',
    does: 'Creates a channel with the specified name.',
    params: [
        {
            type: 'string',
            ID: 'Name',
            hint: 'A name for your channel.'
        }
    ]
};

/**
 * HTML5 Sound Settings command.
 */
FList.Chat.Input.Commands.soundon = {
    func: function() {
        FList.Chat.Settings.current.html5Audio=true;

        FList.Chat.Settings.save();

        fprint('HTML5 audio sound effects are now [b]on[/b].');

        pass();
    },
    title: 'Soundon',
    does: 'Turns on HTML5 audio.'
};

/**
 * HTML5 Sound Settings command.
 */
FList.Chat.Input.Commands.soundoff = {
    func: function() {
        FList.Chat.Settings.current.html5Audio=false;

        FList.Chat.Settings.save();

        fprint('HTML5 audio sound effects are now [b]off[/b].');

        pass();
    },
    title: 'Soundoff',
    does: 'Turns off HTML5 audio.'
};

/**
 * LCH
 * Leave Channel command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.leave = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'channel') {
            return fail('Using this command without a parameter only works if you are in a channel.');
        }

        if (args[0]) {
            wsSend('LCH ' +
                   JSON.stringify({channel: args[0]}));
        } else {
            wsSend('LCH ' +
                   JSON.stringify({channel: curTab.id}));
        }

        pass();
    },
    title: 'Leave',
    does: 'Leaves the specified channel.',
    params: [
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid channel id/name. (Optional)',
            optional: true
        }
    ]
};

/**
 * KIN
 * Display Kinks command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.kinks = {
    func: function(args) {
        var sendString = 'KIN ';

        if (!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        if (args[0]) {
            sendString += JSON.stringify({character: args[0]});
        } else {
            sendString += JSON.stringify({character: curTab.id});
        }

        wsSend(sendString);
        pass();
    },
    title: 'Kinks',
    does: 'Displays a list of kinks for a character.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid online character. (Optional)',
            onlineOnly: true,
            optional: true
        }
    ]
};

/**
 * PRO
 * Display Profile command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.profile = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        if (args[0]) {
            wsSend('PRO ' +
                   JSON.stringify({character: args[0]}));
        } else {
            wsSend('PRO ' +
                   JSON.stringify({character: curTab.id}));
        }

        pass();
    },
    title: 'Profile',
    does: 'Lists data from the Info tab of the character profile. ' +
          'Mostly only includes fields that have been filled out.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid online character. (Optional)',
            onlineOnly: true,
            optional: true
        }
    ]
};

/**
 * ACB
 * Global Ban command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.gban = {
    func: function(args) {
        wsSend('ACB ' +
               JSON.stringify({character: args[0]}));

        pass();
    },
    title: 'Gban',
    does: 'Bans a user\'s account from F-Chat.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid existing character.'
        }
    ]
};

/**
 * ORS
 * List Private Channels command.
 */
FList.Chat.Input.Commands.prooms = {
    func: function() {
        FList.Chat.getORS=true;

        wsSend('ORS');

        pass();
    },
    title: 'Prooms',
    does: 'Lists all open private channels.'
};

/**
 * CHA
 * List Channels command.
 */
FList.Chat.Input.Commands.channels = {
    func: function() {
        FList.Chat.getCHA=true;

        wsSend('CHA');

        pass();
    },
    title: 'Channels',
    does: 'Lists all public channels.'
};

/**
 * BRO
 * Broadcast command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.broadcast = {
    func: function(args) {
        wsSend('BRO ' +
               JSON.stringify({message: args[0]}));

        pass();
    },
    title: 'Broadcast',
    does: 'Broadcasts a message to everyone online in F-Chat.',
    params: [
        {
            type: 'string',
            ID: 'Message',
            hint: 'A message to broadcast.'
        }
    ]
};

/**
 * RMO
 * Setmode command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.setmode = {
    func: function(args) {

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            wsSend('RMO ' +
                   JSON.stringify({channel: args[1], mode: args[0]}));
        } else {
            wsSend('RMO ' +
                   JSON.stringify({channel: curTab.id, mode: args[0]}));
        }

        pass();
    },
    title: 'Setmode',
    does: 'Specifies which modes of messages (Ads/Chat/Both) are filtered to be hidden within the channel.',
    params: [
        {
            type: 'word',
            ID: 'Mode',
            oneOf: ['ads', 'chat', 'both'],
            hint: 'One of the types of chat within the channel. Either [b]ads[/b], [b]chat[/b], or [b]both[/b].'
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid public/private channel name/id. (Optional)',
            optional: true
        }
    ]
};

/**
 * Get Channel Description command.
 */
FList.Chat.Input.Commands.getdescription = {
    func: function() {
        var description = FList.Chat.channels.getData(curTab.id).description;

        if (curTab.type !== 'channel') {
            return fail('You are not in a channel.');
        }

        fprint('[noparse]' + description + '[/noparse]');

        pass();
    },
    title: 'Getdescription',
    does: 'Shows the channel description.'
};

/**
 * CDS
 * Set Channel Description command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.setdescription = {
    func: function(args) {

        wsSend('CDS ' +
            JSON.stringify({channel: curTab.id, description: args[0]}));

        pass();
    },
    title: 'Setdescription',
    does: 'Sets the description of a channel.',
    params: [
        {
            type: 'string',
            ID: 'Description',
            hint: 'A description of the channel.'
        }
    ]
};

/**
 * KIK
 * Global Kick command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.gkick = {
    func: function(args) {

        if (!args[0] && curTab.type !== 'user') {
            return fail('Using this command without a parameter only works if you are in a private chat tab.');
        }

        if (args[0]) {
            wsSend('KIK ' +
                   JSON.stringify({character: args[0]}));
        } else {
            wsSend('KIK ' +
                   JSON.stringify({character: curTab.id}));
        }

        pass();
    },
    title: 'Gkick',
    does: 'Global Kick',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid online character. (Optional)',
            onlineOnly: true,
            optional: true
        }
    ]
};

/**
 * Logout command.
 */
FList.Chat.Input.Commands.logout = {
    func: function() {
        FList.Connection.ws.close();
        pass();
    },
    title: 'Logout',
    does: 'Logs your current character out.'
};

/**
 * Clear Text Buffer command.
 */
FList.Chat.Input.Commands.clear = {
    func: function() {
        curTab.logs=[];

        FList.Chat.TabBar.printLogs(curTab,
            (curTab.type === 'channel') ?
            FList.Chat.channels.getData(curTab.id).userMode
                :
            'both');

        pass();
    },
    title: 'Clear',
    does: 'Clears the current tab history.'
};

/**
 * Online User List command.
 */
FList.Chat.Input.Commands.users = {
    func: function() {
        var namestring='',
            i;

        for (i = 0;i < FList.Chat.users.list.length;++i) {
                namestring += '[user]' + FList.Chat.users.list[i] + '[/user], ';
        }

        fprint('Users in the chat: ' + namestring.substring(0,namestring.length-2));

        pass();
    },
    title: 'Users',
    does: 'Shows you all the users currently online.'
};

/**
 * CIU
 * Invite command.
 *
 * @param {Array} args Array of requested arguments
 */
FList.Chat.Input.Commands.invite = {
    func: function(args) {

        if (!args[1] && curTab.type !== 'channel') {
            return fail('Using this command with one parameter only works if you are in a channel.');
        }

        if (args[1]) {
            wsSend('CIU ' +
                   JSON.stringify({channel: args[1], character: args[0]}));
        } else {
            wsSend('CIU ' +
                   JSON.stringify({channel: curTab.id, character: args[0]}));
        }

        pass();
    },
    title: 'Invite',
    does: 'Invites a character to the specified channel.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid online character.',
            onlineOnly: true
        },
        {
            type: 'string',
            ID: 'Channel',
            hint: 'A valid public/private channel name/id. (Optional)',
            optional: true
        }
    ]
};

/**
 * Get Channel Code command.
 */
FList.Chat.Input.Commands.code = {
    func: function() {
        var channeldata=FList.Chat.channels.getData(curTab.id),
            bbcode = '';

        if (curTab.type !== 'channel') {
            return fail('You have to be in a channel.');
        }

        if (curTab.id
            .toLowerCase()
            .substring(0,4) === 'adh-') {
            bbcode = '[session=' + channeldata.title + ']' +
                     curTab.id + '[/session]';
        } else {
            bbcode = '[channel]' + curTab.id + '[/channel]';
        }

        fprint('BBCode: [noparse]' +  bbcode + '[/noparse]');

        pass();
    },
    title: 'Code',
    does: 'Retrieves a private channel\'s code.'
};

/**
 * Channel User List command.
 */
FList.Chat.Input.Commands.who = {
    func: function() {
        var namestring = '',
            users = FList.Chat.channels.getData(curTab.id).userlist,
            i;

        if (curTab.type !== 'channel') {
            return fail('You have to be in a channel.');
        }

        for (i = 0;i < users.length;++i) {
            namestring = namestring + '[user]' + users[ i ] + '[/user], ';
        }

        fprint(namestring.substring(0,namestring.length-2));

        pass();
    },
    title: 'Who',
    does: 'Retrieves the currently online users in the channel.'
};

/**
 * Display All Commands command.
 */
FList.Chat.Input.Commands.help = {
    func: function(args) {
        var listArr = [],
            i;

        if (args[0] && FList.Chat.Input.Commands[args[0]]) {
            help(args[0]);
        } else {

            for (i in FList.Chat.Input.Commands) {
                  listArr.push(i);
            }

            listArr.sort();

        fail('[b]Currently implemented commands[/b]:');
        fail(listArr.join(', '));
        fail('For more information about command descriptions, ' +
                   'use and syntax elaboration, please refer to the command\'s individual helpfiles.' +
                   ' Syntax: \'/command help\' or \'/help command\'.');
        }

        pass();
    },
    title: 'Help',
    does: 'I\'m sorry, ' + FList.Chat.identity + ', I just can\'t help you anymore.',
    params: [
        {
            type: 'string',
            ID: 'Command',
            hint: 'The command to display the helpfile for. (Optional)',
            optional: true
        }
    ]
};

/**
 * force-priv command.
 *
 * @params {Array} [args] Array of requested arguments
 */
FList.Chat.Input.Commands.fpriv = {
    func: function(args) {
        FList.Chat.openPrivateChat(args[0], false);

        pass();
    },
    title: 'Force Private Message',
    does: 'Opens a PM dialog with an offline or online user.',
    params: [
        {
            type: 'character',
            ID: 'Character',
            hint: 'A valid name of a currently online character.'
        }
    ]
};

/**
* Set the default idle auto-response.
*
* @params {Array} [args] Array of requested arguments
*/
FList.Chat.Input.Commands.defaultresponse = {
func: function(args) {
    if (args[0].length > 255) {
        return fail('Your auto-response\'s length cannot exceed 255 characters in length.');
    }
    if (args[0].length === 0) {
        delete FList.Chat.Settings.current.defaultResponse;
        FList.Chat.Status.response.default = undefined;
        return fprint('Default auto-response cleared.');
    }
    FList.Chat.Status.response.default = args[0];
    fprint('Your default idle auto-response was set to: \'' +
           FList.Chat.Input.sanitize(args[0]) + '\'');
    FList.Chat.Settings.defaultResponse = args[0];
    pass();
},
title: 'DefaultResponse',
does: 'Changes the default response to users that message you when you are idle.',
params: [
    {
        type: 'string',
        ID: 'Message',
        hint: 'A message to display as an auto-response to a user if they message you ' +
        'while you\'re idle. (Character limit: 255)'
    }
]
};
}());
