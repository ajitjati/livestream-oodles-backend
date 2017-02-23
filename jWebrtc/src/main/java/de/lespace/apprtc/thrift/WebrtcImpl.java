/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package de.lespace.apprtc.thrift;


import de.lespace.webrtclibs.jwebrtc2.Utils;
import java.util.Enumeration;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.thrift.TException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author nico
 */
public class WebrtcImpl implements Webrtc.Iface {

    public static ConcurrentHashMap<String,RegisterUserId> registry = new ConcurrentHashMap();
    private static final Logger log = LoggerFactory.getLogger(WebrtcImpl.class);
    
    @Override
    public CallResult call(Call call) throws TException {
        String findRegistration = call.toName;
        
        //workaround for EmpfängerId Problem 
        if(findRegistration.contains("99999")) findRegistration = "99999";
        if(findRegistration.contains("89000")) findRegistration = "0015537";
      
        Enumeration e = registry.keys();
        while(e.hasMoreElements()){
            log.info((String) e.nextElement());;
        }
        log.info("try to find "+findRegistration);
        RegisterUserId registerUserId =  registry.get(findRegistration);
        log.info("found registerUserId:"+registerUserId.userId+ " with token:"+registerUserId.firebaseToken);
        String toToken = registerUserId.firebaseToken;
        log.info("sending notification to token:"+toToken);
        Utils.sendGsmNotification(call,toToken);
        
        return new CallResult("Call from:"+call.fromName+"("+call.fromUUID+") to:"+call.toName+" ("+call.fromUUID+")");
    }

    @Override
    public RegisterResult registerUserId(RegisterUserId registerUserId) throws TException {
       String result = "hallo1 "+registerUserId.getUserId()+" du wurdest registriert! Dein Token ist:"+registerUserId.firebaseToken ;
       log.info(result);
       registry.put(registerUserId.getUserId(),registerUserId);
       // throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
       return new RegisterResult(result);
    }
    
    
    
}
