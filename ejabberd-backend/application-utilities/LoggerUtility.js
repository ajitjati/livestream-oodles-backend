var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ handleExceptions: true,
      json: true}),
      new (winston.transports.File)({ filename: 'seedInfo.log' ,json:true})
    ],
    exitOnError: false
  });


module.exports.logger = logger