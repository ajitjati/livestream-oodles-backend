var encrypt = require('../../../application-utilities/EncryptionUtility');

module.exports = function () {

  var getConversation = function(req, res, callback){
    console.log("in controller");
    var username = req.params.username;
    var peer = req.params.peer;
    console.log(req.params);
//console.log(userName);
    this.services.chatService.getConversation(username,peer,callback)
  }
  var getOfflineMessage = function(req, res, callback){
    console.log("in controller");
    var username = req.params.username;
    var peer = req.params.bare_peer;
    console.log(req.params);
//console.log(userName);
    this.services.chatService.getOfflineMessage(username,peer,callback)
  }
  var home = function(req, res, callback){
    console.log("in home controller");
    callback(null,"this is home api");
  }
return {

  getConversation:getConversation,
  home:home,
  getOfflineMessage:getOfflineMessage
}
};
