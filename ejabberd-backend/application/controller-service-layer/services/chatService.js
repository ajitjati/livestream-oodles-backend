var BaseService = require('./BaseService');
//var AuthenticationService = require('./common/AuthenticationService').AuthenticationService;
//var AuthenticationService = require('./AuthenticationService')(app);



ChatService = function (app) {
    this.app = app;
};

ChatService.prototype = new BaseService();

ChatService.prototype.getConversation = function (username,peer,callback) {
  console.log("in chat service",username,peer);
  knex('archive').select('txt').where({
    'username':username,
    'peer':peer
  })
  .then(function(results){
    //    if (err) throw err
        console.log("fetched data from  database",results)
        callback(null,results);

})
}
ChatService.prototype.getOfflineMessage = function (username,peer,callback) {
  console.log("in chat service",username,peer);
  knex('spool').select('txt').where({
    'username':username,
    'peer':peer
  })
  .then(function(results){
    //    if (err) throw err
        console.log("fetched data from  database",results)
        callback(null,results);

})


}

module.exports = function (app) {
    return new ChatService(app);
};
