var moment = require('moment');
const _ = require("lodash");
const MessageService = require( "../../services/SystemAdmin/Verification/MessageService");
const CommonService = require("../../services/Common/CommonService");

var self = (module.exports = {
	MessageAllView : async function (req, res, next) {
		try {
      const cmnIns = new CommonService();
      let user_info = await cmnIns.get_loged_in_user_info(req);
			let data = {
				title : 'All Messages',
				menu : 'Mail/Inbox',
				sub_menu: 'Message',
				route: '/message',
        moment: moment,
        _:_,
        user_info:user_info,
        messageList: []
			};
      const MsgIns = new MessageService();
			var activeMsgList = await MsgIns.GetAllNotRepliedMessagesService();
			data.messageList = activeMsgList.result;
			res.render('system_admin/show_message', data);		
		} catch ( err ) {
			console.log( err );
			res.status( 500 ).json( err );
		}
	},

});
