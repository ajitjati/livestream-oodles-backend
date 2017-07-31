/**
 * [[This method is used to encrypt value parameter using salt parameter]]
 * @param {[[String]]} salt  [[String use as salt in encrption process]]
 * @param {[[String]]} value [[String which will be encrypted]]
 */

module.exports = function(salt,value){
	var encryptedValue = crypto.createHmac('sha1',salt).update(value).digest('hex')
    return encryptedValue
}