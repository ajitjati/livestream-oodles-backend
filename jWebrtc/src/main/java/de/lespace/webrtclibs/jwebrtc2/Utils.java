/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package de.lespace.webrtclibs.jwebrtc2;

import com.google.gson.JsonObject;
import de.lespace.apprtc.thrift.Call;
import de.lespace.apprtc.thrift.RegisterUserId;
import de.lespace.apprtc.thrift.Webrtc;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.logging.Level;
import javapns.Push;
import javapns.notification.PushNotificationBigPayload;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHeader;
import org.apache.http.params.HttpConnectionParams;
import org.apache.thrift.TException;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.protocol.TProtocol;
import org.apache.thrift.transport.TSocket;
import org.apache.thrift.transport.TTransport;
import org.json.JSONException;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author nico
 */
public class Utils {
    
    private static final Logger log = LoggerFactory.getLogger(Utils.class);
    public static KurentoClient kurentoClient() {
        
      String kmsURL =  System.getProperty("DEFAULT_KMS_WS_URI");
      
      if(kmsURL==null || kmsURL.equals("")){
           kmsURL = Config.DEFAULT_KMS_WS_URI;
      }
      log.debug("using kms.url:",kmsURL); 
      
      return KurentoClient.create(System.getProperty("kms.url", kmsURL));
    }
    
    public static MediaPipeline getPipeline(Room room){
        if(room == null || room.equals("")) throw new IllegalArgumentException("room is null");
        
        if(room.getPipeline() != null){
            log.debug("returning saved pipeline");
            return room.getPipeline();
        }
        
        log.debug("creating new pipeline to kurento server: ");
        room.pipeline = kurentoClient().createMediaPipeline();
        return room.pipeline; 
    }
    
    public static String getBody(HttpServletRequest request) throws IOException {

    String body = null;
    StringBuilder stringBuilder = new StringBuilder();
    BufferedReader bufferedReader = null;

    try {
        
        InputStream inputStream = request.getInputStream();
        if (inputStream != null) {
            bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
            char[] charBuffer = new char[128];
            int bytesRead = -1;
            while ((bytesRead = bufferedReader.read(charBuffer)) > 0) {
                stringBuilder.append(charBuffer, 0, bytesRead);
            }
        } else {
            stringBuilder.append("");
        }
        
    } catch (IOException ex) {
        throw ex;
    } finally {
        if (bufferedReader != null) {
            try {
                bufferedReader.close();
            } catch (IOException ex) {
                throw ex;
            }
        }
    }

    body = stringBuilder.toString();
    return body;
    }
    
    
    public static String[] toStringArray(com.google.gson.JsonArray array) {
        if(array==null)
            return null;

        String[] arr=new String[array.size()];

        for(int i=0; i<arr.length; i++) {
            arr[i]=array.get(i).getAsString();
        }
        return arr;
    }
    
    public static void sendThriftRegistration(String user) {
        try {
            TTransport transport;//"172.20.10.6"
            String THRIFT_SERVER = "192.168.43.151";
            int THRIFT_PORT = 9090;
            if (System.getProperty("THRIFT_SERVER") != null) {
                THRIFT_SERVER = System.getProperty("THRIFT_SERVER");
            }

            try {
                if (System.getProperty("THRIFT_PORT") != null) {
                    THRIFT_PORT = Integer.parseInt(System.getProperty("THRIFT_PORT"));
                }
            } catch (Exception ex) {
            }

            transport = new TSocket(THRIFT_SERVER, THRIFT_PORT);
            transport.open();

            TProtocol protocol = new TBinaryProtocol(transport);
            Webrtc.Client client = new Webrtc.Client(protocol);
            String registerResult = client.registerUserId(new RegisterUserId(user, "token")).getResponse();
            System.out.println("Result:" + registerResult);
            transport.close();
        } catch (TException x) {
            x.printStackTrace();
        }
    }
    
    public static void sendApplePushkitNotification(final Call call, final String toToken){
        try {
             log.info("sending pushkit notification to token:"+toToken+" length:"+toToken.length());
            PushNotificationBigPayload payload = PushNotificationBigPayload.complex();
            payload.addCustomDictionary("fromName", call.fromName);
            payload.addCustomDictionary("toName", call.toName);
            payload.addCustomDictionary("fromUUID", call.fromUUID);
            payload.addCustomDictionary("toUUID", call.toUUID);

            String p12File = "~/certificate.p12";              
            File fileP12File = new File(p12File);
            if(!fileP12File.exists()){
               
                java.util.logging.Logger.getLogger(
                        Utils.class.getName()).log(Level.INFO, "looking in prooperties of sytem environment for certificate file"
                        + "because it was not found in path:"+p12File);
                  
                if (System.getProperty("PUSHKIT_CERTIFICATE_P12_FILE") != null) {
                    p12File = System.getProperty("PUSHKIT_CERTIFICATE_P12_FILE");
                    fileP12File = new File(p12File);
                    if(!fileP12File.exists()){
                        throw new Exception("certificate does not exist in configured location:"+p12File);
                    }
                    java.util.logging.Logger.getLogger(
                     Utils.class.getName()).log(Level.INFO, "using certificate configuredin system environment "
                     + "because certificate file is not found in path:"+p12File);
                }
            }
            if(!fileP12File.canRead())
                throw new Exception("certificate does exist, but server cannot read:"+p12File);  
            
            String password = System.getProperty("PUSHKIT_CERTIFICATE_PASSWORD");
            boolean production =  (System.getProperty("PUSHKIT_PRODUCTION")==null)?false:(System.getProperty("PUSHKIT_PRODUCTION").equalsIgnoreCase("true"))?true:false;
            Push.payload(payload, p12File, password, production, toToken);
            
        } catch (JSONException ex) {
            log.error("problem with JSON format:",ex);
            java.util.logging.Logger.getLogger(Utils.class.getName()).log(Level.SEVERE, null, ex);
        } catch (Exception ex) {
              log.error("Error durring posting to pushkit message to apple",ex);
        }
        
    }
    
    public static void sendGsmAndroidFirebaseNotification(final Call call, final String toToken) {
        log.info("sending firebase notification to token:"+toToken+" length:"+toToken.length());
        Thread t = new Thread() {
            public void run() {
                log.info("sendGsmNotification to:"+call.toName);
                HttpClient client = new DefaultHttpClient();
                HttpConnectionParams.setConnectionTimeout(client.getParams(), 1000); //Timeout Limit
                HttpResponse response;
                JsonObject json = new JsonObject();
                
                /*
                curl -X POST \
                    -H "Authorization: key=  write here api_key" \
                    -H "Content-Type: application/json" \
                    -d '{ 
                    "registration_ids": [ 
                    "write here reg_id generated by gcm"
                    ], 
                    "data": { 
                    "message": "Manual push notification from Rajkumar"
                    },
                    "priority": "high"
                    }' \
                    https://android.googleapis.com/gcm/send
                */
                try {
                    HttpPost post = new HttpPost("https://fcm.googleapis.com/fcm/send");
               
                    json.addProperty("to", toToken);
                    
                    JsonObject jsonNotification = new JsonObject();
                    jsonNotification.addProperty("title", "call from "+call.fromName);
                    jsonNotification.addProperty("body", "video call from "+call.fromName);
                    //json.add("notification", jsonNotification);
                     
                    JsonObject jsonData = new JsonObject();
                    jsonData.addProperty("fromName", call.fromName);
                    jsonData.addProperty("toName", call.toName);
                    jsonData.addProperty("fromUUID", call.fromUUID);
                    jsonData.addProperty("toUUID", call.toUUID);
                    json.add("data", jsonData);
                    StringEntity se = new StringEntity(json.toString());
                    se.setContentType("application/json");
                    String key = System.getProperty("FIREBASE_GSM_KEY");; //"key=AAAAiV24asc:APA91bEdIbyGOgpJHVHZ9CgWqxozNjDbXjUt5GeRb7m87iASljWlXwuLEGxozkcY0VD7h6RbuZj5YWU5wlKwqxS11QVuvl0K164W2nfenvQcyR-FMuFctSmtGXouW1AT2ux2zOXxId0a";
            
                    post.setHeader(new BasicHeader("Authorization",key));
                    post.setEntity(se);
                    response = client.execute(post);

                    /*Checking response */
                    if (response != null) {
                        InputStream inputStream = response.getEntity().getContent(); //Get the data in the entity
                        String responseString = IOUtils.toString(inputStream, "UTF-8");
                        log.info("google cloud messaging response:"+responseString);
                    }
                    
                } catch (Exception e) {
                    log.error("Error durring posting to google firebase cloud messaging",e);
                } 
        }  
     };
     
        t.start();
        
     }
}
