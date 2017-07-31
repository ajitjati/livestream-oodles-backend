	module.exports = function(app) {
	    var controllers = app.controllers,
	        views = app.views;

	    return {
				"/api/v2.0.0/app/user/message/:username/:peer": [{
						method: 'GET',
						action: controllers.chatController.getConversation,
						//middleware: [configurationHolder.security.authority("user")],
						views: {
								json: views.jsonView
						}
				}],
				"/api/v2.0.0/app/user/offlineMessage/:username/:peer": [{
						method: 'GET',
						action: controllers.chatController.getOfflineMessage,
						//middleware: [configurationHolder.security.authority("user")],
						views: {
								json: views.jsonView
						}
				}],
				"/": [{
						method: 'GET',
						action: controllers.chatController.home,
						//middleware: [configurationHolder.security.authority("user")],
						views: {
								json: views.jsonView
						}
				}],


			// "/api/v1/user/sendemail": [{
			// 		method: "GET",
			// 		action: controllers.adminController.sendemail,
			// 		// middleware: [configurationHolder.security.preferedLanguage()],
			// 		views: {
			// 				json: views.jsonView
			// 		}
			// }],

	    };
	};
