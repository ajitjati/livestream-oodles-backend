var responseHandler = function(res,responseObject,message,error,status){
    //console.log(responseObject);
    //console.log(status1);
	res.status(status).send({
		"error":error,
		"message":message,
		"response":responseObject,
		"status": status
	});
    res.end();
};

module.exports.responseHandler = responseHandler;
