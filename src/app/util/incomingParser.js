const axios = require('axios');
const postResult = result => console.log(result.data);
const qs = require('querystring');


const parsePayload = (req) => {
  const textPayload = req.body.text.trim();

  //team_id of the Slack team where the app is installed.  Used for Auth.
  const team_id = req.body.team_id;

  //user_id of the @<user_name> typed with the slash command (if any).
  const target_user_id = textPayload.substring(textPayload.lastIndexOf("@")+1, textPayload.lastIndexOf("|"));

  //public/private channel_id typed with the slash command (if any).
  //Msgs sent here will be in-channel, and the bot_user needs permissions/join for it.
  var target_channel_id;
  if (textPayload.lastIndexOf("#") > -1) {
    target_channel_id = textPayload.substring(textPayload.lastIndexOf("#")+1, textPayload.indexOf("|"));
  } else {
    target_channel_id = '';
  }
  console.log(target_channel_id);
  
  //The command word (if any) typed.
  //If there's no legitimate command (or if it's blank), sent Msg should default to "help".
  const action_request = target_user_id || target_channel_id ? textPayload.substring(textPayload.indexOf(''),textPayload.indexOf("<")-1) : req.body.text;

  //user_id of the user who typed the slash command
  //If no other info is specified, the Msg should go back to this user on the DM channel_id.
  const default_user_id = req.body.user_id;

  //The DM channel id. Default if no target_channel_id is specified.
  //Msgs sent here will come from the bot_user as a DM.
  const default_channel_id = req.body.channel_id;

  const parsedList = { team_id, target_user_id, target_channel_id, action_request, default_user_id, default_channel_id }


    //If there isIn  a target user and channel, send both.
    // channel=yes AND DM=yes....so two seperate messages here?!??!)
    if (parsedList.target_channel_id && parsedList.target_user_id) {
    

      const target_user_dm_chan = findDmChannel(target_user_id);
      return { target_user_id: target_user_dm_chan, target_channel_id: target_channel_id, action: action_request, payload: textPayload }
    }

    //If there is a target user only, send target_user_dm_chan and omit the default_channel_id
    else if (parsedList.target_user_id && !parsedList.target_channel_id) {
      const target_user_dm_chan = findDmChannel(parsedList.target_user_id);

      console.log(`target user dm: ${target_user_dm_chan}`);
      return { target_user_id: target_user_dm_chan, target_channel_id: '', action: action_request, payload: textPayload }
    }

    //If there is a target channel only, send tartget_channel_id and omit default_user_id
    else if (parsedList.target_channel_id && !parsedList.target_user_id) {
      
      return { target_user_id: '', target_channel_id: target_channel_id, action: action_request, payload: textPayload }
    }

    //send default_channel_id
    //message will be a DM uder Applications as the bot_user
    else {
      
      return { target_user_id: '', target_channel_id: default_user_id, action: action_request, payload: textPayload }
    }
};


const findDmChannel = (userId) => {
  console.log(userId)
  const dmRequest = {token: process.env.SLACK_TOKEN, user: userId };
  const params = qs.stringify(dmRequest);
  const sendDmRequest = axios.post('https://slack.com/api/im.open', params);
  sendDmRequest.then(result => { console.log(result.data.channel.id); return result.data.channel.id; });
  
  
  //sendDmRequest.then(function(res){
   // console.log(res);
    //if (res.ok === true) {
     // return res.channel.id
    //} else {
      //If something goes wrong, we'll default to the bot_user DM channel.
     // return default_channel_id
    //}
  //});
};

module.exports = { parsePayload };
