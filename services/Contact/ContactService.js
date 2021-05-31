var _ = require("lodash");
var contact_models = require("../../models/contact");

class CertificationService {
  constructor() {
    this.CON_MODELS = contact_models;
  }

  async SaveAndSendMsgService(data) {
    try {
      const saveMsg = await this.CON_MODELS.SaveAndSendMsgModel(data);
      if(saveMsg.status) {
          return {
            status: true,
            sucMsg : 'Message Send Successfully',
          }
      } else {
        return {
          status: false,
          errMsg: 'Message is not Send Successfully'
        }
      }
    } catch(err) {
      return {
        status: false,
        errMsg: err
      }
    }
  }
  async SubscribeEmailService(email) {
    try {
      const isEmailExist = await this.CON_MODELS.SubscribeEmailIsExistModel(email);
      console.log("isEmailExist", isEmailExist);
      if(isEmailExist.status && isEmailExist.result.length == 1) {
        return {
          status: false,
          errMsg: 'This email already subscribed'
        }
      } else {
        const subscribe = await this.CON_MODELS.SubscribeEmailModel(email);
        if(subscribe.status && subscribe.result.affectedRows == 1) {
            return {
              status: true,
              sucMsg : 'Your email subscribed successfully',
            }
        } else {
          return {
            status: false,
            errMsg: 'Not subscribe'
          }
        }
      }      
    } catch(err) {
      return {
        status: false,
        errMsg: err
      }
    }
  }
    
}

module.exports = CertificationService;