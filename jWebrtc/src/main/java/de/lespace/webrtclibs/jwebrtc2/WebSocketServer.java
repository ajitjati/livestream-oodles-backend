package de.lespace.webrtclibs.jwebrtc2;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import de.lespace.apprtc.thrift.JavaServer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ConcurrentHashMap;
import org.kurento.client.EndOfStreamEvent;
import org.kurento.client.EventListener;
import org.kurento.client.IceCandidate;
import org.kurento.client.MediaPipeline;
import org.kurento.client.OnIceCandidateEvent;
import org.kurento.jsonrpc.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @ServerEndpoint gives the relative name for the end point This will be
 *                 accessed via ws://localhost:8080/jWebrtc/ws Where
 *                 "localhost" is the address of the host, "jWebrtc" is the
 *                 name of the package and "ws" is the address to access this
 *                 class from the server
 */
@ServerEndpoint("/ws")
public class WebSocketServer {

	private static final Gson gson = new GsonBuilder().create();
	
        private static final ConcurrentHashMap<String, MediaPipeline> pipelines = new ConcurrentHashMap<String, MediaPipeline>();
	private static final ConcurrentHashMap<String, Date> pongs = new ConcurrentHashMap<String, Date>();
	private static final ConcurrentHashMap<String, List> followerSessionsOfUser = new ConcurrentHashMap<String, List>();
	
        public static UserRegistry registry = new UserRegistry();
	
        private static final String USER_STATUS_BUSY = "busy";
	private static final String USER_STATUS_OFFLINE = "offline";
	private static final String USER_STATUS_ONLINE = "online";
        
        private static final Logger log = LoggerFactory.getLogger(WebSocketServer.class);
        public static boolean started = false;
        
	@OnOpen
	public void onOpen(Session session) {
		log.debug("apprtcWs opened with sessionId {}", session.getId());
                UserSession newUser = new UserSession(session, "webuser@"+session.getId());
		registry.register(newUser);
		printCurrentUsage();
                
                if(!started){
                    new JavaServer().start();
                    started=true;
                }
                
                Utils.sendThriftRegistration(newUser.getName());
              
                Timer timer = new Timer();
                timer.schedule(new Ping(newUser), 0, 5000);
                
	}

        
	@OnError
	public void onError(Session session, Throwable error) {
		log.error("Websocket Error [{}]", session.getId());
		error.getStackTrace();
                log.error(error.getMessage());
                error.printStackTrace();
                printCurrentUsage();
                
		if (error != null) {
			// System.err.println(" error:"+ error);
			log.error("Error: {}", error.getLocalizedMessage());
		}
	}

	/**
	 * The user closes the connection. Note: you can't send messages to the
	 * client from this method
	 */
	@OnClose
	public void onClose(Session session) {
		log.debug("apprtcWs closed connection [{}]", session.getId());
                removeCompleteSessionAndInformParties(session);
	}
        
        public void removeCompleteSessionAndInformParties(Session session){
                
                printCurrentUsage();
                UserSession user = registry.getBySession(session);
               
                if(user!=null){ //only publish online status and kill session if user is still in the registry
                   deregisterFollower(user);
                    
                    try {
                            publishOnlineStatus(user.getName(), USER_STATUS_OFFLINE);
                    } catch (IOException e) {
                            log.error(e.getLocalizedMessage(), e);
                    }

                    try {
                            stop(session,false);
                            String sessionId = session.getId();
                            killUserSession(session);
                    } catch (IOException ex) {
                            log.error(ex.getLocalizedMessage(), ex);
                    }
                    printCurrentUsage();
                }
        }

	/**
	 * When a user sends a message to the server, this method will intercept the
	 * message and allow us to react to it. For now the message is read as a
	 * String.
	 * 
	 * @param _message
	 *            the json message
	 * @param session
	 *            the websocket session
	 */
	@OnMessage
	public void onMessage(String _message, Session session) {

		log.info("apprtcWs [{}] received message: {}", session.getId(), _message);
		JsonObject jsonMessage = gson.fromJson(_message, JsonObject.class);
		UserSession userSession = registry.getBySession(session);

		if (userSession != null) {
			log.debug("Incoming message from user '{}': {}", userSession.getName(), jsonMessage);
		} else {
			log.debug("Incoming message from new user: {}", jsonMessage);
		}

		switch (jsonMessage.get("id").getAsString()) {
                    
                case "pong":
                        if(userSession!=null){
                            
                            if(pongs.containsKey(userSession))
                                pongs.replace(userSession.getSessionId(), new Date());
                            else
                                pongs.put(userSession.getSessionId(), new Date());
                              log.debug("got pong from peer size:"+pongs.size()+" "+pongs.toString());
                        }
                        break;
                        
		case "appConfig":
			try {
				appConfig(session, jsonMessage);
                                log.debug("appConfig requested...");
			} catch (IOException e) {
				handleErrorResponse(e, session, "appConfigResponse");
			}
			break;
                        
		case "register":
			try {
                            
                                boolean registered = register(session, jsonMessage);
                                
				if(registered) {
					userSession = registry.getBySession(session);
					sendRegisteredFollowers(userSession);
					publishOnlineStatus(userSession.getName(), USER_STATUS_ONLINE);
				}
				
			} catch (Exception e) {
				handleErrorResponse(e, session, "registerResponse");
			}
			break;
		case "call":
                    
			try {
				call(userSession, jsonMessage);
                                printCurrentUsage();
			} catch (Exception e) {
				handleErrorResponse(e, session, "callResponse");
			}
                        
			break;
		case "incomingCallResponse":
			try {
				incomingCallResponse(userSession, jsonMessage);
			} catch (IOException ex) {
				// Logger.getLogger(WebSocketServer.class.getName()).log(Level.SEVERE,
				// null, ex);
				log.error(ex.getLocalizedMessage(), ex);
			}
			break;
		case "onIceCandidate":

			if (userSession != null) {
				JsonObject candidateJson = null;
				IceCandidate candidate = null;

				if (jsonMessage.has("sdpMLineIndex") && jsonMessage.has("sdpMLineIndex")) {
					// this is how it works when it comes from a android
					log.debug("apprtcWs candidate is coming from android or ios");
					candidateJson = jsonMessage;

				} else {
					// this is how it works when it comes from a browser
					log.debug("apprtcWs candidate is coming from web");
					candidateJson = jsonMessage.get("candidate").getAsJsonObject();
				}
                              //  log.info(jsonMessage.toString());

				candidate = new IceCandidate(candidateJson.get("candidate").getAsString(),
						candidateJson.get("sdpMid").getAsString(), candidateJson.get("sdpMLineIndex").getAsInt());
				
                                log.debug(candidate.getCandidate());
                                userSession.addCandidate(candidate);
			}
			break;
		case "stop":
			try {
                                log.debug("received stop closing media piplines callback:"+jsonMessage.has("callback"));
				stop(session,jsonMessage.has("callback"));
                                printCurrentUsage();
                            } catch (IOException ex) {
                                ex.printStackTrace();
				log.error(ex.getLocalizedMessage(), ex);
                            }
			break;
                case "callback":
                        log.debug("got callback myName is:"+userSession.getName()+" originalCall from:"+userSession.getCallingFrom()+" to:"+userSession.getCallingTo());
                        String from = userSession.getCallingFrom();
                        String to =  userSession.getCallingTo();
                        String myName = userSession.getName();
                       
                        JsonObject callBackMessage = new JsonObject();
                        callBackMessage.addProperty("id", "callback");
                        try {
                            if(from==null || myName.equals(from)){  //this from seems to be null sometimes... not clear why!
                                registry.getByName(to).sendMessage(callBackMessage);
                            }else{
                                registry.getByName(from).sendMessage(callBackMessage);
                            }
                        } catch (IOException ex) {
				log.error(ex.getLocalizedMessage(), ex);
                        }
                
			break;        
                case "checkOnlineStatus":
			try {
				queryOnlineStatus(session, jsonMessage);
                                
			} catch (IOException e) {
                            log.error(e.getLocalizedMessage(), e);
                            e.printStackTrace();
			}
			break;
		case "play":
			play(userSession, jsonMessage);
			break;
		case "stopPlay":
			releasePipeline(userSession);
			break;
		default:
			break;
		}
	}
        
	private void releasePipeline(UserSession user) {
		MediaPipeline pipeline = pipelines.remove(user.getSessionId());
		if (pipeline != null) {
			pipeline.release();
		}
	}

	private void play(final UserSession userSession, JsonObject jsonMessage) {
		String user = jsonMessage.get("user").getAsString();
		log.debug("Playing recorded call of user [{}]", user);

		JsonObject response = new JsonObject();
		response.addProperty("id", "playResponse");

		if (registry.getByName(user) != null && registry.getBySession(userSession.getSession()) != null) {
			final PlayMediaPipeline playMediaPipeline = new PlayMediaPipeline(Utils.kurentoClient(), user,
					userSession.getSession());

			String sdpOffer = jsonMessage.get("sdpOffer").getAsString();

			userSession.setPlayingWebRtcEndpoint(playMediaPipeline.getWebRtc());

			playMediaPipeline.getPlayer().addEndOfStreamListener(new EventListener<EndOfStreamEvent>() {
				@Override
				public void onEvent(EndOfStreamEvent arg0) {
					UserSession user = registry.getBySession(userSession.getSession());
					releasePipeline(user);
					playMediaPipeline.sendPlayEnd(userSession.getSession());
				}
			});

			playMediaPipeline.getWebRtc().addOnIceCandidateListener(new EventListener<OnIceCandidateEvent>() {
				@Override
				public void onEvent(OnIceCandidateEvent event) {
					JsonObject response = new JsonObject();
					response.addProperty("id", "iceCandidate");
					response.add("candidate", JsonUtils.toJsonObject(event.getCandidate()));

					try {
						synchronized (userSession) {
							userSession.sendMessage(response);
						}
					} catch (IOException e) {
						log.error(e.getMessage());
					}
				}
			});

			String sdpAnswer = playMediaPipeline.generateSdpAnswer(sdpOffer);

			response.addProperty("response", "accepted");
			response.addProperty("sdpAnswer", sdpAnswer);

			playMediaPipeline.play();
			pipelines.put(userSession.getSessionId(), playMediaPipeline.getPipeline());

			playMediaPipeline.getWebRtc().gatherCandidates();
		} else {
			response.addProperty("response", "rejected");
			response.addProperty("error", "No recording for user [" + user + "]. Please request a correct user!");
		}

		try {
			synchronized (userSession) {
				userSession.sendMessage(response);
			}
		} catch (IOException e) {
			log.error(e.getMessage());
		}
	}

	private void handleErrorResponse(Exception throwable, Session session, String responseId) {
		try {
			stop(session,false);
		} catch (IOException ex) {
			log.error(ex.getLocalizedMessage(), ex);
		}
		log.debug(throwable.getMessage(), throwable);
		JsonObject response = new JsonObject();
		response.addProperty("id", responseId);
		response.addProperty("response", "rejected");
		response.addProperty("message", throwable.getMessage());
		try {
			session.getBasicRemote().sendText(response.toString());
		} catch (IOException ex) {
			log.error(ex.getLocalizedMessage(), ex);
		}
	}

	/**
	 * Sends the configuration to android client.
	 * 
	 * @param session
	 * @param jsonMessage
	 * @throws IOException
	 */
            private void appConfig(Session session, JsonObject jsonMessage) throws IOException {
 
                String turnUsername = System.getProperty("TURN_USERNAME");
                if(turnUsername==null || turnUsername.equals("")) turnUsername = "akashionata";
                
                String turnPassword = System.getProperty("TURN_PASSWORD");
                if(turnPassword==null || turnPassword.equals("")) turnPassword = "silkroad2015";
                
                String turnUrl = System.getProperty("TURN_URL");
                if(turnUrl==null || turnUrl.equals("")) turnUrl = "turn:5.9.154.226:3478";
                
                String stunUrl = System.getProperty("STUN_URL");
                if(stunUrl==null || stunUrl.equals("")) stunUrl = "stun:5.9.154.226:3478";
               
                boolean turnEnabled = true;
                boolean stunEnabled = true;
                
                String type = "";
               
                if(jsonMessage.has("type")) type = jsonMessage.get("type").getAsString(); 
                if(jsonMessage.has("module")) registry.getBySession(session).setModule(jsonMessage.get("module").getAsInt());
                else registry.getBySession(session).setModule(UserSession.MODULE_DEFAULT);
                
               String stun = "{"+
                            "\"username\":\"\"," +
                            "\"password\":\"\"," +
                            "\"urls\":[" +"\""+stunUrl+"?transport=udp\",\""+stunUrl+"?transport=tcp\"";
               
               String stun2 = ""; /*,\"stun:stun.l.google.com:19302\",";
                            stun2 += "\"stun:stun1.l.google.com:19302\",";
                            stun2 += "\"stun:stun2.l.google.com:19302\",";
                            stun2 += "\"stun:stun3.l.google.com:19302\",";
                            stun2 += "\"stun:stun4.l.google.com:19302\",";
                            stun2 += "\"stun:stun.ekiga.net\",";
                            stun2 += "\"stun:stun.ideasip.com\",";
                            stun2 += "\"stun:stun.schlund.de\",";
                            stun2 += "\"stun:stun.voiparound.com\",";
                            stun2 += "\"stun:stun.voipbuster.com\",";
                            stun2 += "\"stun:stun.voipstunt.com\",";
                            stun2 += "\"stun:stun.voxgratia.org\",";
                            stun2 += "\"stun:stun.services.mozilla.com\"";*/
                           
                            stun += stun2+"]}"; 
               
                String turn = "{" +
                             "\"username\":\""+turnUsername+"\"," +
                             "\"password\":\""+turnPassword+"\"," +
                             "\"urls\":[" 
                                          //  +"\""+turnUrl+"?transport=udp\"," 
                                          //  +"\""+turnUrl+"?transport=tcp\"" +
                                            +"\""+turnUrl+"\"" +
                                       "]}";
               
                          
                if(type!=null && type.equals("browser")){
                    turn =    "{\"urls\":[" 
                                         +"\""+turnUrl+"\"" +
                                           // +"\""+turnUrl+"?transport=udp\"," 
                                           // +"\""+turnUrl+"?transport=tcp\"" +
                                       "],\"username\":\""+turnUsername+"\",\"credential\":\""+turnPassword+"\"}";
                    stun =    "{\"urls\":[" 
                            +"\""
                            +stunUrl+"\""
                            //+stunUrl+"?transport=udp\",\""
                            //+stunUrl+"?transport=tcp\""
                            +stun2+"]}";
                }
                
                 String iceConfig = "[";
                      if(stunEnabled) iceConfig+=stun;
                      if(stunEnabled && turnEnabled) iceConfig+=",";
                      if(turnEnabled) iceConfig+=turn;
                      iceConfig+= "]";
                
		String responseJSON = "{" + "\"params\" : {" 
				+ "\"pc_config\": {\"iceServers\": "+ iceConfig + "}" + //, \"iceTransportPolicy\": \"relay\"
				"}," + "\"result\": \"SUCCESS\"" + "}";
                
                log.debug(responseJSON);
		session.getBasicRemote().sendText(responseJSON);

		log.info("send app config to: {}", session.getId());
	}

	/**
	 * 
         * Registers a user with the given session on the server.
	 * 
	 * @param session
	 * @param jsonMessage
	 * @return true, if registration was successful. False, if user could not be
	 *         registered.
	 * @throws IOException
	 */
	private boolean register(Session session, JsonObject jsonMessage) throws IOException {
 
		String name = jsonMessage.getAsJsonPrimitive("name").getAsString();
                String[] followers ={"chrome","firefox","nandi","system1","system2","system3"} ;
               
                if(jsonMessage.has("followers")){
                     followers = Utils.toStringArray(jsonMessage.getAsJsonArray("followers"));
                }
                            
                if(registry.exists(name)){
                    checkIfSessionIsAlive(registry.getByName(name));
                }
                    
		log.debug("register called: {}", name);

		boolean registered = false;
                
		UserSession newUser = new UserSession(session, name);
		String response = "accepted";
		String message = "";
		
                if (name.isEmpty()) {
                    
                    response = "rejected";
                    message = "empty user name";
                
		//} else if (registry.exists(name)) { if this username already existed in a different session check if it's still alive (send message) if error kill it
           
		//	response = "skipped";
		//	message = "user " + name + " already registered";
		} else {
                        if (registry.exists(name)){
                                registry.getByName(name).clearWebRtcSessions();
                        }
                        
			registry.register(newUser);
                        
                        for(int i = 0; i<followers.length;i++){
                                
                                if(!newUser.getName().equals(followers[i])){
                                    log.info("register default follower {}", followers[i]);
                                     registerFollower(newUser,followers[i]);
                                 }else
                                      log.info("did not  register default follower {}", followers[i]);
                        }
			registered = true;
		}

		JsonObject responseJSON = new JsonObject();
		responseJSON.addProperty("id", "registerResponse");
		responseJSON.addProperty("response", response);
		responseJSON.addProperty("message", message);
                responseJSON.addProperty("myUsername",name);
		newUser.sendMessage(responseJSON);

		log.debug("Sent response: {}", responseJSON);
		return registered;
	}
        
        private void checkIfSessionIsAlive(UserSession userSession){
            
                 JsonObject responseJSON = new JsonObject();
                 
                 responseJSON.addProperty("id", "ping");
                           // responseJSON.addProperty("response", userListJson);
                          //  responseJSON.addProperty("message", "");
                 log.error("sending ping: {}",responseJSON.toString());
                 
          /*  try {
                userSession.sendMessage(responseJSON);
            } catch (IOException ex) {
               
                log.error("problem with session",ex.getMessage());
                registry.removeBySession(userSession.getSession());
            }*/
            
        }
        
        /**
         * Find current User in all UserSess
         * @param navigatingUser 
         */
        private void deregisterFollower(UserSession navigatingUser){
            log.debug("deregistering me as follower from all current Sessions {}", navigatingUser.getName());
            Enumeration<String> e = followerSessionsOfUser.keys();
            while(e.hasMoreElements()){
                 String currentUsername  = e.nextElement();
                 if(followerSessionsOfUser.get(currentUsername).contains(navigatingUser)){
                     followerSessionsOfUser.get(currentUsername).remove(navigatingUser);
                     log.debug("found me ({}) in user: {}",navigatingUser.getName(),currentUsername );
                        try {
                            if(registry.getByName(currentUsername)!=null)
                            sendRegisteredFollowers(registry.getByName(currentUsername));
                        } catch (IOException ex) {
                            log.error("could not sendRegisteredFollowers {}",currentUsername);
                        }
                 }   
            }     
        }
         
        /**
         * A status widget comes online and registeres its resupport users
         * 
         * 
         * @param navigatingUser
         * @param supportUser 
         */
        private void registerFollower(UserSession navigatingUser, String supportUsername){
            
            List<UserSession> favourites = null;
            if(followerSessionsOfUser.get(supportUsername)==null){
                favourites = new ArrayList<UserSession>();
                favourites.add(navigatingUser);
            }else{
                  favourites = followerSessionsOfUser.get(supportUsername);
                  if(!favourites.contains(navigatingUser)) 
                    favourites.add(navigatingUser);
            }
            
            followerSessionsOfUser.put(supportUsername,favourites);
            try {
                if(registry.getByName(supportUsername)!=null)
                sendRegisteredFollowers(registry.getByName(supportUsername));
            } catch (IOException ex) {
                log.error("could not sendRegisteredFollowers {}",supportUsername);
            }
        }
                /**
         * determine one of the status OFFLINE, BUSY, or ONLINE of 
         * the user given in the jsonMessage
         * and sends the answer back to the calling session (wether or not the user is registered)
         * 
         * the querying user must be registered as "favourite"
        */ 
	private void queryOnlineStatus(Session session, JsonObject jsonMessage) throws IOException {
            
		String supportUser = jsonMessage.get("user").getAsString();
		JsonObject responseJSON = new JsonObject();
		responseJSON.addProperty("id", "responseOnlineStatus");
                UserSession myUserSession = registry.getBySession(session);
                responseJSON.addProperty("myUsername",myUserSession.getName());
		UserSession supportUserSession = registry.getByName(supportUser);
               
                registerFollower(myUserSession,supportUser);
		log.info("adding myUserSession {} to favourites of {} now: {} elements",
                myUserSession.getName(),supportUser,
                followerSessionsOfUser.size());
                
                if (supportUserSession == null) {
			responseJSON.addProperty("response", USER_STATUS_OFFLINE);
		} else {                                
			if (supportUserSession.isBusy()) {
				responseJSON.addProperty("response", USER_STATUS_BUSY);
			} else {
				responseJSON.addProperty("response", USER_STATUS_ONLINE);
			}
		}
		responseJSON.addProperty("message", supportUser);

                if(session.isOpen()){
                     log.debug("sending message:"+responseJSON.toString());
                     session.getBasicRemote().sendText(responseJSON.toString());//responseJSON.getAsString()

                }  
                else log.debug("session {} is closed.", session.getId());
	}
	
	/**
	 * Publishes the online status of the given user to all online related users. (follower)
	 * if a status user goes offline unregister as follower
	 * @param user
	 * @param status
	 * @throws IOException
	 */
	public void publishOnlineStatus(String user, String status) throws IOException {
            
                UserSession ourSession = registry.getByName(user);

		JsonObject responseJSON = new JsonObject();
		responseJSON.addProperty("id", "responseOnlineStatus");
		responseJSON.addProperty("response", status);
		responseJSON.addProperty("message", user);
                
                List follower  = followerSessionsOfUser.get(ourSession.getName());
                if(follower!=null){
                     Iterator<UserSession> i = follower.iterator();
                     while(i.hasNext()) {
                         
                        UserSession currentFollower = i.next();
                        log.info("MODULE_SUPPORT_WIDGET: publishing online status to client: {}",currentFollower.getName());
                        
                        if(currentFollower.getSession().isOpen()){ 
                            responseJSON.addProperty("myUsername",currentFollower.getName()); //include my online sessinID
                            currentFollower.sendMessage(responseJSON);
                        }
                    }
                }
                else{
                    log.info("{} does not have any followers",ourSession.getName());
                        
                }
                   
               
              //  log.info("publishing online status to clients: {}",responseJSON);

           /*     UserSession ourSession = registry.getByName(user);
                log.info("our session:"+ourSession.getName());
                //we are posting our status to all other people
                //if its the status widget we post it only our connected peers
                //(peers which requested our online status)
                //= we post the online status to all favourites of a user
		if(ourSession.getModule()==UserSession.MODULE_DEFAULT){
                     for (UserSession userSession : registry.getUserSessions()) {
                        responseJSON.addProperty("myUsername",userSession.getName()); //include my online sessinID
			userSession.sendMessage(responseJSON);
                        log.info("MODULE_DEFAULT: sent message to client ");
                    }
                }
                else if(ourSession.getModule()==UserSession.MODULE_SUPPORT_WIDGET){
                    List follower  = followerSessionsOfUser.get(ourSession.getSessionId());
                    Iterator<UserSession> i = follower.iterator();
                     while(i.hasNext()) {
                        
                        UserSession currentFollower = i.next();
                        
                        log.info("MODULE_SUPPORT_WIDGET: publishing online status to client: {}",currentFollower.getName());
                        
                        if(currentFollower.getSession().isOpen()){ 
                            responseJSON.addProperty("myUsername",currentFollower.getName()); //include my online sessinID
                            currentFollower.sendMessage(responseJSON);
                        }
                    }
                }*/
	}
	/**
         * 
	 * Updates the list of registered followers of the current UserSession. (default)
         * 
	 * @throws IOException
	 */
	private void sendRegisteredFollowers(UserSession myUserSession) throws IOException {
                log.info("sendRegisteredFollowers");
                //if status widget - get
                //we are sending all registeredUsers
                List followerList  = followerSessionsOfUser.get(myUserSession.getName());

                if(followerList!=null){
                    Iterator<UserSession> i = followerList.iterator();
                    List publicationList = new ArrayList();
                    while(i.hasNext()){
                            UserSession thisSession = i.next();
                        publicationList.add(thisSession.getName());
                    }
                    String userListJson = new Gson().toJson(publicationList);
                    JsonObject responseJSON = new JsonObject();
                    responseJSON.addProperty("id", "registeredUsers");
                    responseJSON.addProperty("response", userListJson);
                    responseJSON.addProperty("message", "");
                    log.debug("sending userlist: {}",responseJSON.toString());
                    myUserSession.sendMessage(responseJSON);
                }
        
               
                
		//List<String> userList = registry.getRegisteredUsers();
               
                //go through all user sessions and send userlist
		/*for (UserSession userSession : registry.getUserSessions()) {
                    log.info("in loop");
                       if(userSession.getSession().isOpen()){
                           log.info("is open"+userSession.getName());
                            ArrayList publicationUserList = new ArrayList();
                            
                            if(myUserSession!=null && myUserSession.getModule()==UserSession.MODULE_DEFAULT) //also see publishOnlineStatus!
                               publicationUserList.addAll(userList);
                            
                            log.info("userSession: {}",userSession.getName());
                     
                            if(myUserSession!=null && myUserSession.getSessionId()==userSession.getSessionId()){
                                    log.info("adding sessions.."); 
                                      List favourites  = followerSessionsOfUser.get(myUserSession.getSessionId());
                                  //  Iterator<String> i = userList.iterator();
                                  //  while(i.hasNext()){
                                         String session2add = i.next();
                                         log.info("adding session:"+session2add); 
                                       
                                         if(myUserSession.getFavourites().contains(registry.getByName(session2add)))
                                         publicationUserList.add(session2add);
                                  //  }
                            }
                            
                            publicationUserList.remove(userSession.getName()); //don't send own username
                            String userListJson = new Gson().toJson(publicationUserList);

                            JsonObject responseJSON = new JsonObject();
                            responseJSON.addProperty("id", "registeredUsers");
                            responseJSON.addProperty("response", userListJson);
                            responseJSON.addProperty("message", "");
                            log.debug("sending userlist: {}",responseJSON.toString());
                            userSession.sendMessage(responseJSON);
                       }else{
                           log.info("removing session id from registry because it's not open {}", userSession.getSessionId());
                           registry.removeBySession(userSession.getSession());
                       }
		}*/
	}

	private void call(UserSession caller, JsonObject jsonMessage) throws IOException {
                
    		String to = jsonMessage.get("to").getAsString();
		String from = jsonMessage.get("from").getAsString();
                                
                boolean isScreensharing =  jsonMessage.has("screensharing");
		// System.out.println("call from :" + from + " to:" + to);
		log.info("call from [{}] to [{}]", from, to, isScreensharing);

		JsonObject response = new JsonObject();

		UserSession callee = registry.getByName(to);

		if (callee != null && !callee.isBusy()) {
			caller.setSdpOffer(jsonMessage.getAsJsonPrimitive("sdpOffer").getAsString());
			caller.setCallingTo(to);

			response.addProperty("id", "incomingCall");
                        if(isScreensharing) response.addProperty("screensharing", "true");  
			response.addProperty("from", from);

			log.debug("Sending response [{}] to callee [{}]", response.toString(), callee.getName());

			callee.sendMessage(response);
			callee.setCallingFrom(from);
		} 
                else if(callee.isBusy()){
                    
                        log.debug("Callee [{}] does not exist! Rejecting call.", to);

			response.addProperty("id", "callResponse");
                        response.addProperty("response","rejected");
			response.addProperty("message", "rejected: user '" + to + "' is busy!");

			caller.sendMessage(response);
                    
                }
                else {
			log.debug("Callee [{}] does not exist! Rejecting call.", to);

			response.addProperty("id", "callResponse");
                        response.addProperty("response","rejected");
			response.addProperty("message", "rejected: user '" + to + "' is not registered");

			caller.sendMessage(response);
		}
	}

	private void incomingCallResponse(final UserSession callee, JsonObject jsonMessage) throws IOException {
		String callResponse = jsonMessage.get("callResponse").getAsString();
		String from = jsonMessage.get("from").getAsString();
		final UserSession caller = registry.getByName(from);
		String to = caller.getCallingTo();

		if ("accept".equals(callResponse)) {
			log.info("Accepted call from [{}] to [{}]", from, to);

			CallMediaPipeline pipeline = null;
			try {
				pipeline = new CallMediaPipeline(Utils.kurentoClient(), from, to);
				pipelines.put(caller.getSessionId(), pipeline.getPipeline());
				pipelines.put(callee.getSessionId(), pipeline.getPipeline());
				log.debug("created both pipelines...");

				// give the callee his webRtcEp from the pipeline
				callee.setWebRtcEndpoint(pipeline.getCalleeWebRtcEp());

				pipeline.getCalleeWebRtcEp().addOnIceCandidateListener(new EventListener<OnIceCandidateEvent>() {
					@Override
					public void onEvent(OnIceCandidateEvent event) {
						JsonObject response = new JsonObject();
						response.addProperty("id", "iceCandidate");
						response.add("candidate", JsonUtils.toJsonObject(event.getCandidate()));
						try {
							synchronized (callee.getSession()) {
                                                              log.debug(response.toString());
								callee.getSession().getBasicRemote().sendText(response.toString());
							}
						} catch (IOException e) {
							log.error(e.getMessage(), e);
						}
					}
				});

                                
                                //add filter 
                                      // Media logic

                                
                                
				caller.setWebRtcEndpoint(pipeline.getCallerWebRtcEp());

				pipeline.getCallerWebRtcEp().addOnIceCandidateListener(new EventListener<OnIceCandidateEvent>() {

					@Override
					public void onEvent(OnIceCandidateEvent event) {
						JsonObject response = new JsonObject();
						response.addProperty("id", "iceCandidate");
						response.add("candidate", JsonUtils.toJsonObject(event.getCandidate()));
						try {
							synchronized (caller.getSession()) {
                                                            log.debug(response.toString());
                                                            caller.getSession().getBasicRemote().sendText(response.toString());
							}
						} catch (IOException e) {
							log.error(e.getMessage(), e);
						}
					}
				});
				log.debug("created both webrtcendpoints...");

				log.debug("preparing sending startCommunication to called person...");

				String calleeSdpOffer = jsonMessage.get("sdpOffer").getAsString();
				String calleeSdpAnswer = pipeline.generateSdpAnswerForCallee(calleeSdpOffer);

				log.debug("we have callee offer and answer as it seems");

				JsonObject startCommunication = new JsonObject();
				startCommunication.addProperty("id", "startCommunication");
				startCommunication.addProperty("sdpAnswer", calleeSdpAnswer);

				synchronized (callee) {
					log.debug("sending startCommunication message to callee");
					callee.sendMessage(startCommunication);
				}

				pipeline.getCalleeWebRtcEp().gatherCandidates();

				String callerSdpOffer = registry.getByName(from).getSdpOffer();
				String callerSdpAnswer = pipeline.generateSdpAnswerForCaller(callerSdpOffer);
				JsonObject response = new JsonObject();
				response.addProperty("id", "callResponse");
				response.addProperty("response", "accepted");
				response.addProperty("sdpAnswer", callerSdpAnswer);

				synchronized (caller) {
					log.debug("sending callResponse message to caller");
					caller.sendMessage(response);
				}

				pipeline.getCallerWebRtcEp().gatherCandidates();

				pipeline.record();
                                
   /*     MediaPipeline mediaPipeline = pipeline.getPipeline();
        FaceOverlayFilter faceOverlayFilterCaller = new FaceOverlayFilter.Builder(mediaPipeline).build();
        FaceOverlayFilter faceOverlayFilterCallee = new FaceOverlayFilter.Builder(mediaPipeline).build();

     // String appServerUrl = System.getProperty("app.server.url", "https://localhost/jWebrtc/");
        faceOverlayFilterCaller.setOverlayedImage("https://192.168.178.22/jWebrtc/img/santa-overlay.png", 0F, 0F, 1.0F, 1.0F);
        faceOverlayFilterCallee.setOverlayedImage("https://192.168.178.22/jWebrtc/img/santa-overlay.png", 0F, 0F, 1.0F, 1.0F);
      //faceOverlayFilter2.setOverlayedImage(appServerUrl + "/img/santa-overlay.png", -0.35F, -1.2F, 1.6F, 1.6F);

        pipeline.getCallerWebRtcEp().connect(faceOverlayFilterCaller);
        faceOverlayFilterCaller.connect(pipeline.getCalleeWebRtcEp());
           
        pipeline.getCalleeWebRtcEp().connect(faceOverlayFilterCallee);
        faceOverlayFilterCallee.connect(pipeline.getCallerWebRtcEp());
     // log.error("added overlay");
       
     // faceOverlayFilter2.connect(pipeline.getCalleeWebRtcEp());
        log.error("overlay connected");*/

			} catch (Throwable t) {

				log.error("Rejecting call! Reason: {}", t.getMessage());

				if (pipeline != null) {
					pipeline.release();
				}

				pipelines.remove(caller.getSessionId());
				pipelines.remove(callee.getSessionId());

				JsonObject response = new JsonObject();
				response.addProperty("id", "callResponse");
                                response.addProperty("message", t.getMessage());
				response.addProperty("response", "rejected");
				caller.sendMessage(response);

				response = new JsonObject();
				response.addProperty("id", "stopCommunication");
				callee.sendMessage(response);
			}

		} else { // "reject"
			JsonObject response = new JsonObject();
			response.addProperty("id", "callResponse");
			response.addProperty("response", "rejected");
			caller.sendMessage(response);
		}
	}
        
        public void killUserSession(Session session) throws IOException{
            String sessionId = session.getId();
            
            log.debug("Killing usersession from of websocket id [{}]", sessionId);
           // sendRegisteredFollowers(registry.getBySession(session));
            registry.removeBySession(session);            
            
        }
        
	public void stop(Session session, boolean sendCallback) throws IOException {

		String sessionId = session.getId();
                log.debug("trying to find session id: {} in piplines:\n{}",sessionId,pipelines.keySet().toString());
                
		
                // Both users can stop the communication. A 'stopCommunication'
                // message will be sent to the other peer.
                UserSession stopperUser = registry.getBySession(session);
                log.info("stopperUser: "+stopperUser.getName());

                if (stopperUser != null) {

                    UserSession stoppedUserFrom = (stopperUser.getCallingFrom() != null) ? registry.getByName(stopperUser.getCallingFrom()) : null;

                    UserSession stoppedUserTo = (stopperUser.getCallingTo() != null )? registry.getByName(stopperUser.getCallingTo()) : null;
                    UserSession stopUser = null;

                    if(stoppedUserFrom !=null && stoppedUserFrom.getSession()!=null && !stoppedUserFrom.getSession().getId().equals(session.getId())){
                        log.debug("die id des stoppenden ist NICHT! die des anrufenden"); //wenn der angerufene auflegt

                        stopUser = stoppedUserFrom;
                        JsonObject message = new JsonObject();
                        message.addProperty("id", "stopCommunication");
                        if(sendCallback==true) message.addProperty("callback", "true");
                        stopUser.sendMessage(message);
                      //  if(!sendCallback)
                         stopUser.clearWebRtcSessions();                       
                    }      
                    else if(stoppedUserTo!=null && stoppedUserTo.getSession()!=null){
                        log.debug("die id des stoppenden IST! die des anrufenden");
                        //wenn der anrufer auflegt. (wird anschließend, die pipeline des anrufenden gesucht und exisitert nicht mehr) 
                        stopUser = stoppedUserTo;
                        JsonObject message = new JsonObject();
                        message.addProperty("id", "stopCommunication");
                        if(sendCallback==true) message.addProperty("callback", "true");
                            stopUser.sendMessage(message);
                     //  if(!sendCallback)
                        stopUser.clearWebRtcSessions();                  
                   }
                   

                    if (pipelines.containsKey(sessionId)) {
                        log.debug("Stopping media connection of websocket id [{}]", sessionId);
                        log.debug("send stop to stoppedUserFrom:",stopUser.getName());
                        MediaPipeline pipeline1 = pipelines.remove(sessionId);
                        pipeline1.release();

                        MediaPipeline pipeline2 = pipelines.remove(stopUser.getSession().getId());
                        pipeline2.release();
                    }
                    //if(!sendCallback) 
                        stopperUser.clearWebRtcSessions();
                    log.debug("Stopped", sessionId);
                    
                    sendRegisteredFollowers(stopperUser); 
                }
		//}
                //else{ //piplines not yet have been created - but a user tried to call another and the other hangs up instead of answers the call
            
               // }
	}
        
        public class Ping extends TimerTask {
            
            public UserSession session;
            public Ping(UserSession session){
                this.session = session;
            }
            
            public void run() {
              log.debug("ping:"+this.session.getSessionId()); 
               
               try {
                    JsonObject responseJSON = new JsonObject();
                    responseJSON.addProperty("id", "ping");
                    
                    this.session.sendMessage(responseJSON);
                    
                } catch (IOException ex) {
                     log.error("removing session and stopping ping"+this.session.getSessionId());  
                }
                
               
                if(pongs.get(this.session.getSessionId()) !=null){
                   log.debug("last pong:"+pongs.get(this.session.getSessionId()));
                }
                
                //if no pong is inside add at least one so we can cancel wrong connections
                if(pongs.get(this.session.getSessionId()) ==null)pongs.put(this.session.getSessionId(), new Date());
                    
                
                if(pongs.get(this.session.getSessionId()) !=null && 
                       pongs.get(this.session.getSessionId()).getTime()+10000 < new Date().getTime()){
                   try {
          

                       this.session.getSession().close();
                   } catch (IOException ex) {
                       log.error("closing session");
                   }
                    
                    pongs.remove(this.session.getSessionId());
                    this.cancel();
                }
                
            }
        }
        
        private void printCurrentUsage(){
            try{
                Enumeration<MediaPipeline> e = pipelines.elements();
                
                log.debug("current pipelines size():"+pipelines.size());
                
                while(e.hasMoreElements()){
                    MediaPipeline mp = e.nextElement();
                    if(mp!=null) 
                        log.debug("current pipeline:"+((mp.getName()!=null)?mp.getName():"NULL" )+ " : "+mp.getId());
                }
                
                log.debug("current sessions keys:"+registry.getRegisteredUsers());
                log.debug("current UserSession size:"+registry.getUserSessions().size());
                Iterator<UserSession> i  = registry.getUserSessions().iterator();
                while(i.hasNext()){
                    UserSession us = i.next();
                    if(us!=null) log.debug("current user:"+us.getName()+" -  "+us.getSessionId());
                }
             }catch(Exception ex){
                         log.debug("General printCurrentUsage Error:"+ex.getMessage());
             }
        }

}