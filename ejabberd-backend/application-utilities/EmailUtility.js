var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
// var transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: configurationHolder.config.emailFrom,
//         pass: configurationHolder.config.emailPassword
//     }
// });
module.exports.email = function(fromEmail, toEmail, subject, emailBody, htmlbody, attachment, callback) {
        // var transport = nodemailer.createTransport(smtpTransport({
        //     host: configurationHolder.config.emailHost,
        //     port: configurationHolder.config.sesSmtpPort,
        //     secure: true,
        //     auth: {
        //         user: configurationHolder.config.emailFrom,
        //         pass: configurationHolder.config.emailPassword
        //     }
        // }));

        // Create the transporter with the required configuration for Gmail
        // change the user and pass !
        var transporterObj={
            host: configurationHolder.config.emailHost,
            port: 465,
            secure: true, // use SSL
            auth: {
                user: configurationHolder.config.sesSmtpUserId,
                pass: configurationHolder.config.sesSmtpAccessKey
            }
        };
        // console.log("transporterObj: ",transporterObj);
        var transporter = nodemailer.createTransport(smtpTransport(transporterObj));

        var mailOptions = {
            from: fromEmail,
            to: toEmail,
            subject: subject,
            text: emailBody,
            html: htmlbody,
            attachments: attachment
        };
        // console.log("mailOptions: ",mailOptions);

        // transport.sendMail(mailOptions, function(error, info) {
        // 	var response={};
        //   if (error) {
        // 		response.error=true;
        // 		cb(response);
        //   }
        //   else{
        //     console.log('Message sent: ' + info.response);
        // 		response.error=false;
        // 		cb(response)
        //   }
        // });
        transporter.sendMail(mailOptions, function(err, success) {
            if (err) {
                console.log("error : ",err);
                callback(false);
            } else {
                Logger.info("mail sent");
                callback(true);
            }
        })
    }
    // module.exports.email = function (fromEmail, toEmail, subject, emailBody,html,attachment,callback) {
    //     transporter.sendMail({
    //         from: fromEmail,
    //         to: toEmail,
    //         subject: subject,
    //         text: emailBody,
    //         html: html,
    //         attachments: attachment
    //     },function(err,success){
    //         if(err){
    //           callback(false);
    //         }
    //         else{
    //           callback(true);
    //         }
    //     })
    // }
