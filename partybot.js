/**
* Application: partybot.js
* Version: 1.14
* Date: 11/03/2019
* Author: Liz (Klossi)
**/

/***Setup and Initialize Discord.io***/
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

/***Global Variables***/
var serverTimeZone = 'Pacific/Pitcairn';//'America/Anchorage'; //This is Scania's Server time. Modify as needed.
var motivationLocation = './motivations.txt'; 

var eventTime = true; //if there is a server event going on. Used by timer functions.
var timerChannel = '495002720370163713'; //the channel to send timer messages to. Defaulted to LT3 Party Channel. //Lt3: 495002720370163713 //sandbox: 604133794274082837

var guildID = ''; //the server ID to use when determining user's roles. Initialized on first message.

var partyLocation = './parties.json'; //where to export parties to.
var partylist = require(partyLocation);

var motivationNum = 0; //the current motivation to display. Cycles so we get new pics.
var motivationList = []; //the list of all motivations. Read in from file on bot initialization.

/************TIMERS******************/
/** The Timers MUST be global and cannot be inside a JS method. This puts them out of scope.**/
/** This REQUIRES cron npm to be installed **/
var CronJob = require('cron').CronJob;

var timersLocation = './timers.json'; //where to export the timers to.
var timerList = require(timersLocation);

//Because there is no way to make messages dynamic (inner scope of CronJob function() prevents message being passed in) - just making 2 static event timers manipulated by file.) 
//for(var i = 0; i < timerList.length; i++){
if(timerList[0].active){	
	console.log('Event Warning Timer Created: ' + timerList[0].cron + timerList[0].message);
	var eventWarningTimer = new CronJob(timerList[0].cron, function() {		
		if(timerChannel != undefined){			
			sendMsg(timerChannel, timerList[0].message);		
		}else{
			console.log('No Channel Defined. Unable to send special event message.');
		}
	}, null, true, serverTimeZone);

	eventWarningTimer.start();	
}

if(timerList[1].active){
	console.log('Event Timer Created: ' + timerList[1].cron + timerList[1].message);
		var eventTimer = new CronJob(timerList[1].cron, function() {		
		if(timerChannel != undefined){			
			sendMsg(timerChannel, timerList[1].message);		
		}else{
			console.log('No Channel Defined. Unable to send special event message.');
		}
	}, null, true, serverTimeZone);

	eventTimer.start();
}
//}
/** 1.10 KEMDI, 1.11 COMMENTED OUT KEMDI, 1.12 OVERWROTE FOR STORE **/
//11:00, 16:00, 19:00
/*
var specialEventMsg = ':gift: SURPRISE STORE IS NOW OPEN! @everyone';
var specialEventWarningMsg = ':gift: Surprise Store will open in 5 minutes! @here';
var specialEventTimer = new CronJob('00,55 10,11,15,16,18,19 * * *', function() { 
	if(timerChannel != undefined){			
		var serverTime = new Date().toLocaleString("en-US", {timeZone: serverTimeZone});
		serverTime = new Date(serverTime);			
			
		var minutes = serverTime.getMinutes();		
		var message = '';
		if(minutes == 55){
			var hour = serverTime.getHours();
			if (hour == 10 || hour == 15 || hour ==18){
				message = specialEventWarningMsg;
			}
		}else{
			if (hour == 11 || hour == 16 || hour == 19){
				message = specialEventMsg;
			}
		}
		
		sendMsg(timerChannel, message);		
	}else{
		console.log('No Channel Defined. Unable to send special event message.');
	}
}, null, true, serverTimeZone);

specialEventTimer.start();
*/

/** 1.7 CHECK IN RESET **/
//0:00
var resetTimer = new CronJob('0 0 * * *', function() { 
	for(var i = 0; i < partylist.length; i++){
		for( var j = 0; j < partylist[i].checkedin.length; j++){
			partylist[i].checkedin[j] = false;
		}
	}
}, null, true, serverTimeZone);

resetTimer.start();
/**END 1.7 **/

//Hot Time WARNINGs
var hottime30warning = ':raised_hands: HOT TIME WILL START IN 30 MINUTES @here';
var hottime15warning = ':raised_hands: HOT TIME WILL START IN 15 MINUTES @here';
	
//Timer for 07:30, 18:30, 07:45, 18:45 (15 and 30 til the hour hot times start up)
//Event Time (& Sa,Su) = 7,18; Otherwise (M-Tr) = 9,18
var timerHTWarn = new CronJob('30,45 7,9,18 * * *', function() { 
	if(timerChannel != undefined){			
		var serverTime = new Date().toLocaleString("en-US", {timeZone: serverTimeZone});
		serverTime = new Date(serverTime);			
			
		var minutes = serverTime.getMinutes();
		var message = '';
		if(minutes == 45){
			message = hottime15warning;
		}else{
			message = hottime30warning;
		}
			
		var hour = serverTime.getHours();
		if(isEventTime() && hour == 7){
			sendMsg(timerChannel, message);
		}else if(!isEventTime() && hour == 9){
			sendMsg(timerChannel, message);
		}else if (hour == 18){
			sendMsg(timerChannel, message);
		}
	}else{
		console.log('No Channel Defined. Unable to send hot time message.');
	}
}, null, true, serverTimeZone);

timerHTWarn.start();
	
//Hot Time has STARTED
var hottimestart = ':tada: HOT TIME HAS STARTED @everyone';
	
//Timer for 08:00, 10:00, 19:00
//Event Timer (& Sa,Su) = 8,19; Otherwise (M-Tr) = 10,19
var timerHTStart = new CronJob('0 8,10,19 * * *', function() { 
	if(timerChannel != undefined){
		var serverTime = new Date().toLocaleString("en-US", {timeZone: serverTimeZone});
		serverTime = new Date(serverTime);
		var hour = serverTime.getHours();
		if(isEventTime() && hour == 8){
			sendMsg(timerChannel, hottimestart);
		}else if(!isEventTime() && hour == 10){
			sendMsg(timerChannel, hottimestart);
		}else if (hour == 19){
			sendMsg(timerChannel, hottimestart);
		}
	}else{
		console.log('No Channel Defined. Unable to send hot time message.');
	}
}, null, true, serverTimeZone);

timerHTStart.start();

//Hot Time has ENDED
var hottimeend = ':sob: HOT TIME HAS ENDED @here';
	
//Timer for 14:00, 0:00, 2:00
//Event Timer (& Sa,Su) = 2,14; Otherwise (M-Tr) = 0,14
var timerHTEnd = new CronJob('0 0,2,14 * * *', function() {
	if(timerChannel != undefined){
		var serverTime = new Date().toLocaleString("en-US", {timeZone: serverTimeZone});
		serverTime = new Date(serverTime);
		var hour = serverTime.getHours();
		if(isEventTime() && hour == 2){
			sendMsg(timerChannel, hottimeend);
		}else if(!isEventTime() && hour == 0){
			sendMsg(timerChannel, hottimeend);
		}else if(hour == 14){
			sendMsg(timerChannel, hottimeend);
		}
	}else{
		console.log('No Channel Defined. Unable to send hot time message.');
	}
}, null, true, serverTimeZone);
	
timerHTEnd.start();

/************END TIMERS******************/

/** Bot Initialization **/
/*
* This is what fires up our bot.
* We store the guildID for use in getting a user's server roles (BM, SF 144, etc.)
* Role information is displayed when using the party detail command.
* Motivations are read in from file and stored to array for use in party motivate command.
*/
bot.on('ready', function (evt) {
    logger.info('PartyBot Connected');
	guildID = evt.d.guilds[0].id; 
	prepareMotivationList();
});

bot.on('disconnect', function(erMsg, code) {
    console.log('----- Bot disconnected from Discord with code', code, 'for reason:', erMsg, '-----');
    bot.connect();
});

/** Bot Listener **/

/*
* Fired whenever our bot reads a message.
* The FIRST TIME we read a message we store the channelID, this is used for sending hot time messages. Pick a good channel to execute the first command (like, party channel.)
* If that messages started with !party or !Party - the bot tries to run a command.
* If no command is found, the bot displays a list of available commands to the user.
*/
bot.on('message', function (user, userID, channelID, message, evt) {
	//Stores the channel for sending hot time messages. REMOVED 1.6 -> changed to default to LT3 Party Ch.
	//if(timerChannel == undefined){
	//	timerChannel = channelID;
	// }
	//if a party command is found, execute the appropriate method.
    if (message.substring(0, 6) == '!party' || message.substring(0,6) == '!Party') {		
        //var args = message.substring(6).split(' ');
		var splitArgs = message.substring(6).replace(/\s/,'&').split('&');
        var cmd = splitArgs[0];
		var params = splitArgs[1];
        switch(cmd) {
			case 'detail':
				if(params == undefined){
					sendMsg(channelID, ':no_entry: Usage: partydetail {PartyID}.');
				}else {
					sendPartyDetail(channelID, params);
				}
				break;
            case 'list':
				sendPartyList(channelID);  
				break;
			case 'create':
				if(params != undefined){
					createPartyWithID(channelID, params);
				}else{
					createParty(channelID);
				}
				break;
			case 'join':
				if(params == undefined){
					sendMsg(channelID, ':no_entry: Usage: partyjoin {PartyID}.');
				}else { 
					var splitParms = params.replace(/\s/,'&').split('&');
					if(splitParms[1] != undefined){ //joining as someone else.
						signupForParty(channelID,splitParms[0],splitParms[1],[]); 
					}else if (evt.d.member.nick != null ){ //joining as yourself (has a server nickname)
						signupForParty(channelID,params,evt.d.member.nick,evt.d.member.roles);
					}else{ //joining as yourself (no server nickname)
						signupForParty(channelID,params,user,evt.d.member.roles);
					}
				}
				break;
			case 'autojoin':
				if(params != undefined){
					autojoinParty(channelID,params);
				}else if (evt.d.member.nick != null ){
					autojoinParty(channelID,evt.d.member.nick,evt.d.member.roles);
				}else{
					autojoinParty(channelID,user,evt.d.member.roles);
				}
				break;
			case 'leave':
				if(params != undefined){ //leaving as someone else
					leaveParty(channelID,params); 
				} else if (evt.d.member.nick != null ){ //leaving as yourself (has a server nickname)
					leaveParty(channelID,evt.d.member.nick);
				} else { //leaving as yourself (no server nickname)
					leaveParty(channelID,user);
				}
				break;
			case 'disband':
				if(params == undefined){
					sendMsg(channelID, ':no_entry: Usage: partydisband {PartyID}.');
				}else {
					disbandParty(channelID,params);
				}
				break;
			case 'disbandall':
				disbandAllParties(channelID);
				break;
			case 'motivate':
				if(motivationList.length > 0 ){
					motivateParty(channelID);
				}else{
					sendMsg(channelID, ':no_entry: No motivations available.');
				}
				break;
			case 'addmotivation':
				if(params == undefined){
					sendMsg(channelID, ':no_entry: Usage: partyaddmotivation {URL/Text}.');
				}else {
					addMotivation(channelID,params);
				}
				break;
			case 'toggleevent':
				toggleEvent(channelID);
				break;
			case 'resize':				
				if(params == undefined){ 
					sendMsg(channelID, ':no_entry: Usage: partyresize {Party ID} {Party Size}.');
				}else{
					var splitParms = params.replace(/\s/,'&').split('&');
					if(splitsParms[1] == undefined){
						sendMsg(channelID, ':no_entry: Usage: partyresize {Party ID} {Party Size}.');
					}else{
						resizeParty(channelID, splitsParms[0], splitsParms[1]);
					}
				}
				break;
			case 'sethtch':
				setAnnouncementChannel(channelID);
				break;
			case 'export':
				exportParties(channelID);
				break;
			case 'check':
				if(params == undefined){
					if (evt.d.member.nick != null ){
						changeCheckStatus(channelID, evt.d.member.nick);
					}else{
						changeCheckStatus(channelID, user);
					}	
				} else {
					changeCheckStatus(channelID, params);
				}
				break;
			default:
				listCommands(channelID);
         }
	 } else if(message.substring(0,9) == '!hottommy'){
		 hotTommy(channelID);
	 }
});

/** PARTY BOT COMMANDS **/

//Lists all the partybot usages.
//Executed: for any !party/!Party command not otherwise recognized.
function listCommands(channelID){
	var helpMsg = ':tada: PartyBot commands: \n';
	helpMsg += '**!partylist**: This will list all currently created parties.\n';
	helpMsg += '**!partydetail {Party ID}**: This will list details for the specified party.\n';
	helpMsg += '**!partycreate** *{OPTIONAL: Party ID}*: This will allow creation of a new party.\n';
	helpMsg += '**!partyresize {Party ID} {Party Size}**: This will set the size of the party (default 6.)\n'
	helpMsg += '**!partydisband {Party ID}**: This will disband the specified party.\n';
	helpMsg += '**!partydisbandall**: This will disband all parties.\n';
	helpMsg += '**!partyjoin {Party ID}** *{OPTIONAL: User}*: This will allow the user to join the specified party.\n';
	helpMsg += '**!partyautojoin** *{OPTIONAL: User}*: This will enroll the user in the first available party slot.\n';
	helpMsg += '**!partyleave** *{OPTIONAL: User}*: This will allow the user to leave their party.\n';
	helpMsg += '**!partytoggleevent** : This will toggle the hot time event for timer purposes.\n';
	helpMsg += '**!partysethtch** : This will set hot time announcements to display on the current channel.\n';
	helpMsg += '**!partycheck** *{OPTIONAL: User}*: This will toggle the party status of you (or the specified user).\n';
	if(motivationList.length > 0){
		helpMsg += '**!partymotivate**: Motivate your party!\n';
		helpMsg += '**!hottommy** Motivate your party NSFW!\n';
	}
	helpMsg += '**!partyaddmotivation {URL/Text}**: This will add a motivation.';
	sendMsg(channelID, helpMsg);
}

//This will toggle on/off if an event is currently happening (for hot time timers.)
//Executed: toggleevent
function toggleEvent(channelID){
	eventTime = !eventTime;
	var msg = 'off.';
	if(eventTime){
		msg = 'on.'
	}
	sendMsg(channelID, 'Event Time is turned ' + msg);
}

//find partyID for first party with < [party size] members. Join it.
//Executed: autojoin
function autojoinParty(channelID, user, roles){
	var partyID = -1;
	for (var i = 0; i < partylist.length; i++){
		if(partylist[i].members.length < partylist[i].partysize){
			partyID = i;
			break;
		}
	}
	
	if(partyID == -1){
		sendMsg(channelID, ':scream: Party autojoin failed. There are no parties available to join.');
	} else {
		signupForParty(channelID, partyID, user, roles);
	}
}

//find specified party (by ID). Join it.
//Executed: join
function signupForParty(channelID, partyID, user, roles){	
	var partyNum = getPartyNum(partyID);
	
	if(partylist[partyNum] == undefined){
		sendMsg(channelID, ':scream: Party join failed. Party **' + partyID +'** does not exist.');
	} else {	
		if(partylist[partyNum].members.length == partylist[partyNum].partysize){
			sendMsg(channelID, ':scream: Party join failed. Party **' + partyID +'** is full.');
		} else {
			//var inPartyID = ''; /**V 1.8 Removing single party condition due to statics **/
			
			//for(var p = 0; p < partylist.length; p++){
				//for (var i = 0; i < partylist[p].members.length; i++){
					//if(partylist[p].members[i] == user) {
					//	inPartyID = partylist[p].id;
					//}
				//}
			//}
			
			//if(inPartyID != ''){
				//sendMsg(channelID, ':scream: Party join failed. You are already in party **' + inPartyID +'**.');
			//}else{
				partyMemberID = partylist[partyNum].members.length;
				partylist[partyNum].members[partyMemberID] = user;
				partylist[partyNum].roles[partyMemberID] = roles;
				partylist[partyNum].checkedin[partyMemberID] = false;
				var members = partyMemberID + 1;
				if(members == partylist[partyNum].partysize){
					sendMsg(channelID, ':heart: **' + user + '** has joined the party! Party **' + partyID + '** is now full!');
				}else{
					sendMsg(channelID, ':heart: **' + user + '** has joined the party! Party **' + partyID + '** now has ' + members + ' member(s).');
				}
			//}
		}
	}
}

//creates a new party.
//Executed: create
function createParty(channelID){
	var partyID = findFreePartyID();
	createPartyWithID(channelID, partyID);
}

//creates a party using the user-given ID.
//Executed: create
function createPartyWithID(channelID, partyID){
	var partyExists = false;
	
	for(var i = 0; i < partylist.length; i++){
		if(partylist[i].id == partyID){
			partyExists = true;
			sendMsg(channelID, ':scream: Party creation failure. Party ' + partyID + ' already exists.');
			break;
		}
	}
	
	if(!partyExists){
		sendMsg(channelID, ':thumbsup: Your party has been created and has 0 members. Your Party ID is: **' + partyID + '**');
		var newparty = {id: partyID, members:[], roles:[], checkedin:[], partysize: 6};
		partylist.push(newparty);
	}
}

//Kicks the specified user from a party.
//Executed: leave
function leaveParty(channelID, user){
	var partyNum = getPartyIDNum(user);
	if(partyNum == -1){
		sendMsg(channelID, ':scream: Party leave failed. User does not exist in any party.');
	} else {	
		for (var i = 0; i < partylist[partyNum].members.length; i++){
			if(partylist[partyNum].members[i].toLowerCase() == user.toLowerCase()){
				partylist[partyNum].members.splice(i,1);
				partylist[partyNum].roles.splice(i,1);
				partylist[partyNum].checkedin.splice(i,1);
			}
		}
		var members = partylist[partyNum].members.length;
		sendMsg(channelID, ':broken_heart: **' + user + '** has left the party! Party **' + partylist[partyNum].id + '** now has ' + members + ' member(s).');
	}	
}

//Disbands the specified party.
//Executed: disband
function disbandParty(channelID, partyID){
	var partyNum = getPartyNum(partyID);
	if(partyNum != -1){
		partylist.splice(partyNum,1);
		sendMsg(channelID, ':thumbsdown: Party **' + partyID + '** has been disbanded.');	
	}else{
		sendMsg(channelID, ':scream: Party disband failed. Unable to find Party **' + partyID +'**!');
	}
}

//Disbands all existing parties.
//Executed: disbandall
function disbandAllParties(channelID){
	partylist = [];
	sendMsg(channelID, ':thumbsdown: All parties have been disbanded.');
}

//Sends a list of all parties and their members to discord.
//Executed: list
//NOTE: This is done as a SINGLE String. This is necessary as discord does NOT like being spammed. 
////Messages may get lost (or arrive out of order) if too many are sent at once.
function sendPartyList(channelID){
	if(partylist.length == 0){
		sendMsg(channelID, ':sweat: There are no current parties. Create one with: !partycreate');
	} else {
		var partyListMsg = '';
		
		if(partylist.length == 1){
			partyListMsg = 'There is currently 1 registered party.';
		}else{
			partyListMsg = 'There are currently ' + partylist.length + ' registered parties.';
		}
		
		for(var party = 0; party < partylist.length; party++){	
			partyListMsg = partyListMsg + '\n Party **' + partylist[party].id + '** ('+partylist[party].members.length+'\\'+ partylist[party].partysize +')' 
			if(partylist[party].members.length > 0){
				partyListMsg += ': ';
			}
			for(var m = 0; m < partylist[party].members.length; m++){
				partyListMsg = partyListMsg + partylist[party].members[m];
				if( m+1 != partylist[party].members.length){
					partyListMsg += ', ';
				}
			}		
		}
		sendMsg(channelID, partyListMsg);
	}
}

//Sends details of the specified party to discord.
//Executed: detail
function sendPartyDetail(channelID, partyID){
	var partyIndex = getPartyNum(partyID);
	if(partyIndex == -1){
		sendMsg(channelID, ':scream: Unable to find Party **' + partyID +'**!');
	}else{
		partyListMsg = 'Party **' + partyID + '** (' + partylist[partyIndex].members.length + '\\'+ partylist[partyIndex].partysize +')';
		for(var i = 0 ; i < partylist[partyIndex].members.length; i++){
			memberNum = i + 1;
			partyListMsg += '\n**' + getIcon(partylist[partyIndex].checkedin[i]) + partylist[partyIndex].members[i] + '**';
			if(partylist[partyIndex].roles[i].length > 0){
				partyListMsg += ': *'+ getRoleList(partylist[partyIndex].roles[i]) + '*'; //convert number to server role?
			}
		}
		sendMsg(channelID, partyListMsg);
	}
}

//Checks you in to or out of your party. This is reset at server time to being checked out.
//Executed: checkin, checkout
function changeCheckStatus(channelID, name){
	var found = false;
	var newStatus;
	
	for(var p = 0; p < partylist.length; p++){
		for (var i = 0; i < partylist[p].members.length; i++){
			if(partylist[p].members[i].toLowerCase() == name.toLowerCase()) {
				newStatus = !partylist[p].checkedin[i];
				partylist[p].checkedin[i] = newStatus;
				found = true;
			}
		}
	}
	
	if(found){
		phrase = newStatus ? 'in to' : 'out of';
		sendMsg(channelID, getIcon(newStatus) + name + ' has been checked ' + phrase + ' the party!');
	} else {
		sendMsg(channelID, ':scream: Unable to find **' + name +'** in any party!');
	}
}


/** HELPER METHODS **/

//Get the correct checkedin icon.
function getIcon(checkedin){
	if(checkedin){
		return ':white_check_mark:';
	} else {
		return ':x:';
	}
}

//Helper method. takes the partyID and gets the array index.
function getPartyNum(partyID){
	var partyNum = -1;
	for(var i = 0; i < partylist.length; i++){
		if(partylist[i].id == partyID){
			partyNum = i;
			break;
		}
	}
	return partyNum;
}

//Helper method for autojoin. Find the first free party.
function findFreePartyID(){
	var partyNum = 0
	var partyID = partyNum + "";
	
	var freeIDFound = false;
	
	while(!freeIDFound){	
		var foundID = false;
		for(var i = 0; i < partylist.length; i++){
			if(partylist[i].id == partyID){
				partyNum++;
				partyID = partyNum + "";
				foundID = true;
				break;
			}
		}
		if(!foundID){
			freeIDFound = true;
		}
	}
	
	return partyID;
}

//Helper method: takes in the user and finds the array index of the party they are in.
function getPartyIDNum(user){
	var partyIDNum = -1;
	for(var p = 0; p < partylist.length; p++){
		for (var i = 0; i < partylist[p].members.length; i++){
			if(partylist[p].members[i].toLowerCase() == user.toLowerCase()) {
				partyIDNum = p;
			}
		}
	}
	return partyIDNum;
}

//A helper method used by the party detail command. Gets all the roles of a user on the server.
function getRoleList(roleIDs){
	var roleList = '';
	for(var i = 0; i < roleIDs.length; i++){
		var serverRole = bot.servers[guildID].roles[roleIDs[i]];
		if(serverRole != undefined){
			roleList += bot.servers[guildID].roles[roleIDs[i]].name;
		}
		if( i+1 != roleIDs.length){
			roleList += ', ';
		}
	}
	return roleList;
}

//Helper method to send a message to the specified Discord channel.
function sendMsg(channelID, amessage){
	bot.sendMessage({		
                    to: channelID,
                    message: amessage
                });								
}

//Will send a random motivational message to the discord channel.
function motivateParty(channelID){
	if(motivationNum == 0 && isNSFW()){ //adding 1.5 for Halli. May need ability to flag individual pics as NSFW in future.
		motivationNum++;
	}
	var apic = motivationList[motivationNum];
	motivationNum++;
	if(motivationNum == motivationList.length){
		motivationNum = 0;
	}
	sendMsg(channelID, ':tada::tada: VAMOS :tada::tada: \n' + apic);
}

//called once on bot start. Reads in the motivation.txt and stores them to array.
function prepareMotivationList(){
	var fs = require('fs');
	var readline = require('readline'); 
	var readInterface = readline.createInterface({  
		input: fs.createReadStream(motivationLocation),
	});
	
	readInterface.on('line', function(line) { 		
		addToMotivationList(line);
	});
	
}

/* Helper function to determine which hot time hours to use.
* If it is Sunday (0) or Saturday (6), OR if it is an EVENT TIME hot times are longer. 
* The party bot function toggleevent will let the user set if it is an event period or not (can't programmatically know this.) 
*/
function isEventTime(){
	var serverTime = new Date().toLocaleString("en-US", {timeZone: serverTimeZone});
	serverTime = new Date(serverTime);
	var dayOfWeek = serverTime.getDay();
	return eventTime || dayOfWeek == 6 || dayOfWeek == 0; 
}

// This will store to motivation array
function addToMotivationList(line){
	motivationList.push(''+line);
}

//writes out to the motivation text file
function writeToMotivationFile(motivation){
	var fs = require('fs');
	fs.appendFile(motivationLocation, '\r\n' + motivation, 
		function (err) {
			return err;
	});
}

//adds a new motivation to the array and out to file (txt.)
function addMotivation(channelID, motivation){
		
		var error = writeToMotivationFile(motivation);
		if(error){
			sendMsg(channelID, ':no_entry: Unable to add to the motivation list.');
		}else{
			addToMotivationList(motivation);
			sendMsg(channelID, ':thumbsup: This motivation has been added.');
		}
}

/** Added for v 1.1 **/
//sets a party size.
function resizeParty(channelID, partyID, partySize){
	var partyIndex = getPartyNum(partyID);
	if(partyIndex == -1){
		sendMsg(channelID, ':scream: Unable to find Party **' + partyID +'**!');
	}else if(Number.isNaN(partySize) || partySize < 1){
		sendMsg(channelID, ':scream: Provided party size must be a number > 0**!');
	}else{
		partylist[partyIndex].partysize = partySize;
		sendMsg(channelID, ':thumbsup: Party ' + partyID +' has been set to allow for ' + partySize +' members.');
	}
}

/** Added for v 1.2 **/
//sets the channel for timer announcements.
function setAnnouncementChannel(channelID){
	timerChannel = channelID;
	sendMsg(channelID, ':thumbsup: Announcements will now display in this channel.');
}

/** Added for v 1.3 **/
//command to display hot tommy specifically.
function hotTommy(channelID){
	if(!isNSFW()){
		var apic = motivationList[0];
		sendMsg(channelID, apic);
	} else {
		sendMsg(channelID, ':thumbsdown: Hot Tommy respects the workplace environment.');
	}
}

/** Added for v 1.5 **/
//Per Halli, work time is M-F 7AM PST - 5PM PST. Starting at 6AM PST to accomodate east coasters. (9AM EST - 8PM EST)
function isNSFW(){
	var eastCoast = new Date().toLocaleString("en-US", {timeZone: 'America/New_York'});
	eastCoast = new Date(eastCoast);
	return eastCoast.getHours() > 8 && eastCoast.getHours() < 21 && eastCoast.getDay()!= 6 && eastCoast.getDay()!=0;
}

/** Added for v 1.6 - Parties will write/read to file. Sick of re-adding every time. **/
function exportParties(channelID){
	var exported = true;
	require('fs').writeFile(
		partyLocation, JSON.stringify(partylist, null, 4), 'utf-8',

    function (err) {
        if (err) {
            sendMsg(channelID, ':scream: Unable to export parties.');
			exported = false;
        }
    }
	
	);
	
	if(exported){
		sendMsg(channelID, ':thumbsup: Parties successfully exported to server file.');
	}
}
