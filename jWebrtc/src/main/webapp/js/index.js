/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
console.log('version 0.5.7 built time: 05.01.2017 15:34');
/*
 * (C) Copyright 2016 Le Space UG
 */
var getCurrentScript = function () {
  if (document.currentScript) {
    return document.currentScript.src;
  } else {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length-1].src;

  }
};

var getCurrentServer = function(scriptPath){
      var l = document.createElement("a");
      l.href = scriptPath;
      return l.hostname;
}

var server = getCurrentServer(getCurrentScript()); //get server address from current scripts
if(server!='localhost' && server!='nicokrause.com') //development/integration/production server!
        server = "webrtc.a-fk.de"; // getCurrentServer(); //change it in status.js / index.js too

var ws = new WebSocket('wss://' +server + '/jWebrtc/ws');
var doLog = true;
var videoInput;
var videoOutput;
var webRtcPeer;
var response;
var callerMessage;

var isAudioEnabled = true;
var isWebcamEnabled = true;
var isScreenSharingEnabled; //current state of screensharing
var isScreensharingPressed = false; //was the screensharing pressed? switches back to false 
var isScreenSharingAvailable = false;
var isVideoStreamEnabled = isWebcamEnabled || isScreenSharingEnabled;

var chkAudioEnabled;
var chkWebcamEnabled;
var chkScreenEnabled;

var audioStream;

var from;
var to;

var configuration = {
    "iceServers": [{
        "urls": "stun:webrtc.a-fk.de:3478"
    }, {
        "urls": "turn:webrtc.a-fk.de:3478",
        "username": "webrtc",
        "credential": "fondkonzept"
    }]
};
var callbackqueue = [];
var registerName = null;
var registerState = null;
const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;


function setRegisterState(nextState) {
    switch (nextState) {
        case NOT_REGISTERED:
            enableButton('#register', 'register()');
            hideButton('#call');
            hideButton('#screenEnabled');
             hideButton('#peers');
            setCallState(NO_CALL);
            break;
        case REGISTERING:
            disableButton('#register');
            break;
        case REGISTERED:
            disableButton('#register');
            showButton('#terminate');
            showButton('#audioEnabled');
            showButton('#call');
            showButton('#peers');

            setCallState(NO_CALL);
            break;
        default:
            return;
    }
    registerState = nextState;
}

var callState = null;
const NO_CALL = 0; // client is idle
const PROCESSING_CALL = 1; // client is about to call someone (ringing the phone)
const IN_CALL = 2; // client is talking with someone
const IN_PLAY = 4; // client is replaying a record

function setCallState(nextState) {
    switch (nextState) {
        case NO_CALL:
            enableButton('#call', 'call()');
            disableButton('#terminate');
            enableButton('#peer', null);
            hideButton('#terminate');
            hideButton('#audioEnabled');
            hideButton('#videoEnabled');
            hideButton('#screenEnabled');
            disableButton('#play');
            break;
        case PROCESSING_CALL:
            disableButton('#call');
            disableButton('#play'); 
            break;
        case IN_CALL:
            disableButton('#call');
            disableButton('#peer');
            enableButton('#terminate', 'terminate()');
            showButton('#terminate');
            showButton('#audioEnabled');
            setAudioEnabled(isAudioEnabled);
            showButton('#videoEnabled');
            setWebcamEnabled(isWebcamEnabled);
            showButton('#screenEnabled');
          //  hideButton('#screenEnabled');
            disableButton('#play');
            break;
        case IN_PLAY:
            disableButton('#call');
            enableButton('#terminate', 'terminate()');
            disableButton('#play');
            break;
        default:
            return;
    }
    callState = nextState;
}

function log(message){
    if(doLog) console.log(message);
}



$(function() {
  // Handler for .ready() called.

  chkAudioEnabled = $("#audioEnabled");
  chkWebcamEnabled = $("#videoEnabled");
  chkScreenEnabled = $("#screenEnabled");

  chkAudioEnabled.on("click", function () {
    toggleAudio();
  });
  //setAudioEnabled(true);

  chkWebcamEnabled.on("click", function() {
    toggleWebcam();
  })
  //setWebcamEnabled(true);

  chkScreenEnabled.on("click", function() {
    toggleScreenSharing();
  })
  //setScreenSharingEnabled(false);
});

window.onbeforeunload = function() {
    ws.close();
}

ws.onmessage = function(message) {
    
    var parsedMessage = JSON.parse(message.data);
    log('Received message: ' + message.data);

    if (parsedMessage.params) {
        readAppConfig(parsedMessage);
    } else {
        switch (parsedMessage.id) {
            case 'ping':
                  var response = {
                            id: 'pong'  
                  };
                 sendMessage(response);
            break;
            case 'registerResponse':
                registerResponse(parsedMessage);
                break;
            case 'registeredUsers':
                updateRegisteredUsers(JSON.parse(parsedMessage.response));
                break;
            case 'callResponse':
                callResponse(parsedMessage);
                break;
            case 'incomingCall':
                incomingCall(parsedMessage);
                break;
            case 'startCommunication':
                startCommunication(parsedMessage);
                break;
                
            case 'stopCommunication':
                log('Communication ended by remote peer');
                
                stop(true,false); //message came from peer (true) we don't need a callback (false)
                
                if(parsedMessage.callback){
                    var message = {
                            id: "callback"
                    };
                    sendMessage(message);
                }
                
                break;
            case 'callback':
                log('starting functions in callbackqueu - e.g. screensharing')
                while (callbackqueue.length > 0) {
                    (callbackqueue.shift())();   
                }
                break;
            case 'iceCandidate':
                webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
                    if (error)
                        return console.error('Error adding candidate: ' + error);
                });
                break;
            case 'responseOnlineStatus':
                try{
                    setOnlineStatus(parsedMessage);
                }catch(err){console.log('method not found'+err);}
                break;
            case 'playResponse':
                playResponse(parsedMessage);
                break;
            case 'playEnd':
                playEnd();
                break;
            default:
                console.error('Unrecognized message', parsedMessage);
        }
    }
}

function requestAppConfig() {
    log('requesting app config');
    var message = {
        id: 'appConfig',
        type: 'browser'
    };
    sendMessage(message);
}


function readAppConfig(message) {
    if (message.params) {
        configuration = message.params.pc_config;
    }
    if (message.result == "SUCCESS") return true;
}

function registerResponse(message) {
    if (message.response == 'accepted') {
        setRegisterState(REGISTERED);
        log(message.message);
    } else {
        setRegisterState(NOT_REGISTERED);
        var errorMessage = message.message ? message.message :
            'Unknown reason for register rejection.';
        log(errorMessage);
        alert('Error registering user. See console for further information.');
    }
}

function updateRegisteredUsers(userList) {
    log("User list: " + userList);
    var peers = $("#peer").find('option').remove().end();
    var name;
    for (var i = 0; i < userList.length; i++) {
        //options += '<option value="' + result[i].ImageFolderID + '">' + result[i].Name + '</option>';
        name = userList[i];
        if (name != $('#name').val()) {
            peers.append($("<option />").val(name).text(name));
        }
    }
    $('#peer option:contains('+to+')').prop('selected', true);
}

// toggle audio stream
function toggleAudio() {
    setAudioEnabled(!isAudioEnabled);
}

// enable or disable the audio stream
function setAudioEnabled(enabled) {
  isAudioEnabled = enabled;
  if (webRtcPeer != undefined) {
    var localStreams = webRtcPeer.peerConnection.getLocalStreams();

    localStreams.forEach(function(localStream, index, array) {
      var audioTracks = localStream.getAudioTracks();

      log(audioTracks.length + " audio tracks");

      // if MediaStream has reference to microphone
      if (audioTracks[0]) {
          audioTracks[0].enabled = enabled;
      } else {
        console.error("No reference to microphone set!");
      }
    })

  } else {
    console.error("webRtcPeer is undefined! Cannot mute.");
  }

  $(chkAudioEnabled).toggleClass('active', isAudioEnabled);
  $(chkAudioEnabled).toggleClass('focus', false);

  log("Audio enabled: " + isAudioEnabled);
}

// toggle video stream
function toggleWebcam() {
  setWebcamEnabled(!isWebcamEnabled);
}

// enable or disable the video stream
function setWebcamEnabled(enabled) {
  isWebcamEnabled = enabled;

  $(chkWebcamEnabled).toggleClass('active', isWebcamEnabled);

  log("Video enabled: " + isWebcamEnabled);

  setVideoStreamEnabled(isWebcamEnabled || isScreenSharingEnabled);
 // if(callState == IN_CALL && !isScreenSharingEnabled) setScreenSharingEnabled(true);
}

// toggle screen sharing
function toggleScreenSharing() {
  setScreenSharingEnabled(!isScreenSharingEnabled);
}

// enable or disable screen sharing
function setScreenSharingEnabled(enabled) {
 
  isScreensharingPressed = true;
  isScreenSharingEnabled = enabled; //&& isScreenSharingAvailable;

  $(chkScreenEnabled).toggleClass('btn-danger', isScreenSharingEnabled);
  
  log("Screen sharing enabled: " + isScreenSharingEnabled);

  if(isScreenSharingEnabled) {
      if (!DetectRTC.isWebRTCSupported) {
        log("WebRTC not supported");
        showCompatibilityWarning("#rtc-area");
      }
  }
  
    call(); //always call when sombody hits that button (one time with one time without
}

function setVideoStreamEnabled(enabled) {
  isVideoStreamEnabled = enabled;
  if (webRtcPeer != undefined) {
    webRtcPeer.peerConnection.getLocalStreams()[0].getVideoTracks()[0].enabled = isVideoStreamEnabled;
  }
}

function playResponse(message) {
    if (message.response != 'accepted') {
        hideSpinner(videoOutput);
        document.getElementById('videoSmall').style.display = 'block';
        alert(message.error);
        document.getElementById('peer').focus();
        setCallState(NO_CALL);
    } else {
        setCallState(IN_PLAY);
        webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
            if (error)
                return console.error(error);
        });
    }
}

// Start streaming on callers side, if accepted
function callResponse(message) {
    if (message.response != 'accepted') {
        log('Call not accepted by peer. Closing call');
        var errorMessage = message.message ? message.message :
            'Unknown reason for call rejection.';
        log(errorMessage);
        alert(errorMessage);
        stop(false,false);
    } else {
      log("call accepted");
        setCallState(IN_CALL);
        webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
            if (error)
                return console.error(error);
        });
        log("answer processed");
    }
}

function startCommunication(message) {
  log("startCommunication");
    setCallState(IN_CALL);

    webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
        if (error)
            return console.error(error);
    });
    log("answer processed");
}

function incomingCall(message) {
    if (callState != NO_CALL) {
        var response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'bussy'
        };
        return sendMessage(response);
    }
    
    
    from = message.from;
    $('#peer option:contains('+from+')').prop('selected', true);
    if(message.screensharing){  //always accept the call if the screensharing button was pressed
          acceptingCall();
    }
    else{
      
        if (confirm('User ' + message.from +
                ' is calling you. Do you accept the call?')) {
           
            acceptingCall();
            log("accepting call");
            showSpinner(videoInput, videoOutput);

        } else {
            var response = {
                id: 'incomingCallResponse',
                from: message.from,
                callResponse: 'reject',
                message: 'user declined'
            };
            sendMessage(response);
            stop(false,false);
        }
    }
}

function acceptingCall(){
        setCallState(PROCESSING_CALL);
        var options = {
            localVideo: videoInput,
            remoteVideo: videoOutput,
            onicecandidate: onIceCandidate,
            onerror: onError
        }
        options.configuration = configuration;
        webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
            function(error) {
                if (error) {
                    return console.error(error);
                }
                webRtcPeer.generateOffer(onOfferIncomingCall);
            });
}

function onOfferIncomingCall(error, offerSdp) {
    if (error)
        return console.error("Error generating the offer");
        var response = {
            id: 'incomingCallResponse',
            from: from,
            callResponse: 'accept',
            sdpOffer: offerSdp
        };
    sendMessage(response);
}

function register() {
    var name = document.getElementById('name').value;
    if (name == '') {
        window.alert('You must insert your user name');
        return;
    }
    setRegisterState(REGISTERING);

    var message = {
        id: 'register',
        name: name
    };
    sendMessage(message);
    document.getElementById('peer').focus();
}
// Function wrapping code.
// fn - reference to function.
// context - what you want "this" to be.
// params - array of parameters to pass to function.
var wrapFunction = function(fn, context, params) {
    return function() {
        fn.apply(context, params);
    };
}

var newCall = function(options){
    setCallState(PROCESSING_CALL);
    showSpinner(videoInput, videoOutput);
    webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
    function(error) {
        if (error) {
            return console.error(error);
        }
        webRtcPeer.generateOffer(onOfferCall);
    });
};

function call() {
    
    if (document.getElementById('peer').value == '') {
        window.alert('You must specify the peer name');
        return;
    }
    else{
        to = document.getElementById('peer').value;
    }
    
    showSpinner(videoInput, videoOutput);

    if (isScreenSharingEnabled) {
        var audioConstraints = {
          audio: true,
          video: false
        };

        navigator.getUserMedia(audioConstraints, function(stream) {
            audioStream = stream;
            initiateScreenSharing();
        }, function(error) {
            console.error("Could not get audio stream! " + error);
        });

    } else {
        var options = {
            localVideo: videoInput,
            remoteVideo: videoOutput,
            onicecandidate: onIceCandidate,
            onerror: onError,
        }
        
        options.configuration = configuration;
        
        var newCallWrap = wrapFunction(newCall, this, [options]);
        
        if(callState == IN_CALL) stop(false,newCallWrap);   //stop the current call what ever it is false: no peer was stopping it - true means we want a callback
        else newCall(options);
    }
   
}

function initiateScreenSharing() {
  getScreenId(function(error, sourceId, screen_constraints) {
      // error    == null || 'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
      // sourceId == null || 'string' || 'firefox'

      navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
      navigator.getUserMedia(screen_constraints, function(stream) {

          var options = {
              localVideo: videoInput,
              remoteVideo: videoOutput,
              videoStream: stream,
              audioStream: audioStream,
              onicecandidate: onIceCandidate,
              onError: onError,
              sendSource: 'window',
               //				mediaConstraints: constraints
          }
          options.configuration = configuration;
          
          var newCallWrap = wrapFunction(newCall, this, [options]);
          
          if(callState == IN_CALL) stop(false,newCallWrap);   //stop the current call what ever it is
          else newCall(options);
        /*  webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
              function(error) {
                  if (error) {
                      return console.error(error);
                  }
                  webRtcPeer.generateOffer(onOfferCall);
              });*/

      }, function(error) {
          console.error(error);
      });
  });
}

function onOfferCall(error, offerSdp) {
    if (error) {
        return console.error('Error generating the offer');
    }
    log('Invoking SDP offer callback function');
    var message = {
        id: 'call',
        from: document.getElementById('name').value,
        to: to, //$('#peer').val()
        sdpOffer: offerSdp
    };
    
    if(isScreensharingPressed) {
        message.screensharing = "true";
        isScreensharingPressed = false;
    }
    
    sendMessage(message);
}

function onOfferPlay(error, offerSdp) {
    if (error) {
        return console.error('Error generating the offer');
    }
    log('Invoking SDP offer callback function');
    var message = {
        id: 'play',
        user: document.getElementById('peer').value,
        sdpOffer: offerSdp
    };
    sendMessage(message);
}

function playEnd() {
    setCallState(NO_CALL);
    hideSpinner(videoInput, videoOutput);
    document.getElementById('videoSmall').style.display = 'block';
}
function terminate(){
    isScreenSharingEnabled = false;
    $(chkScreenEnabled).toggleClass('btn-danger', isScreenSharingEnabled);
    stop(null,false);
}


function stop(message, callback) {
   
    var stopMessageId = (callState == IN_CALL || callState == PROCESSING_CALL) ? 'stop' : 'stopPlay';    
    setCallState(NO_CALL);
    if (webRtcPeer) {
    
               // isScreenSharingEnabled=false; //don't do that here... only when stop was really pressed locally
        log('message is:' + (message)?'sending hangup message':'');
        if (!message) { //we send a message to the peer if we stop the connection
            var message = {
                id: stopMessageId
            };
            if(callback) message.callback = true;
            
            sendMessage(message);
        }
        
        
        isScreenSharingEnabled = false;
        $(chkScreenEnabled).toggleClass('btn-danger', isScreenSharingEnabled); 
        hideSpinner(videoInput, videoOutput);
        webRtcPeer.dispose();
        webRtcPeer = null;
        
        if(document.getElementById('videoSmall'))
            document.getElementById('videoSmall').display = 'block';
    }
    if(callback) callbackqueue.push(callback);
}

function onError() {
    setCallState(NO_CALL);
}

function onIceCandidate(candidate) {

    var message = {
        id: 'onIceCandidate',
        candidate: candidate
    };
    sendMessage(message);
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    log('Sending message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './img/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './img/webrtc.png';
        arguments[i].style.background = '';
    }
}
function hideButton(id){
    $(id).addClass("hidden");
}
function showButton(id){
    $(id).removeClass( "hidden" );
}

function disableButton(id) {
    $(id).attr('disabled', true);
    $(id).removeAttr('onclick');
    $(id).toggleClass("disabled", true);
}

function enableButton(id, functionName) {
    
    $(id).attr('disabled', false);
    if(functionName)$(id).attr('onclick', functionName);
    $(id).toggleClass("disabled", false);
}

function showCompatibilityWarning(id) {
  $(id).html("Please use a browser that supports WebRTC, like Firefox or Chrome or install WebRTC-Plugin https://github.com/sarandogou/webrtc-everywhere");
}



function isExtensionInstalled() {
  if (DetectRTC.browser.isChrome) {
    // Check for chrome extension
    getChromeExtensionStatus(function(status) {
      log("Chrome extension: " + status);

        if(status == 'installed') {
          // chrome extension is installed.
          handleScreenSharingAvailable();
      }

      if(status == 'installed-disabled') {
          // chrome extension is installed but disabled.
          handleMissingChromeExtension();
      }

      if(status == 'not-installed') {
          // chrome extension is not installed
          handleMissingChromeExtension();
      }

      if(status == 'not-chrome') {
          // using non-chrome browser
          handleMissingChromeExtension();
      }
    });
  }

  if (DetectRTC.browser.isFirefox) {
      
    // Check for firefox add on
    // request addon to enable screen capturing for your domains
    window.postMessage({
        enableScreenCapturing: true,
        domains: ['localhost', '127.0.0.1','*.a-fk.de', '*.le-space.de', '*.nicokrause.com']
    }, "*");

   
    // watch addon's response
    // addon will return "enabledScreenCapturing=true" for success
    // else "enabledScreenCapturing=false" for failure (i.e. user rejection)
 
    window.addEventListener("message", function(event) {
        var addonMessage = event.data;

        if(!addonMessage || typeof addonMessage.enabledScreenCapturing === 'undefined') {
          console.warn("Firefox AddOn not available");
          handleMissingFirefoxAddon();
          return;
        }

        if(addonMessage.enabledScreenCapturing === true) {
            // addonMessage.domains === [array-of-your-domains]
            log("Firefox AddOn available");
            log(JSON.stringify(addonMessage.domains) + ' are enabled for screen capturing.');
            $("#warningScreenSharingFirefox").hide();
            handleScreenSharingAvailable();
        }
        else {
            // reason === 'user-rejected'
            console.warn("Firefox AddOn: " + addonMessage.reason);
            handleMissingFirefoxAddon();
        }
    }, false); 
  }

  return false;
}

function handleMissingChromeExtension() {
  $("#screen-call").toggleClass("disabled", true);
  isScreenSharingAvailable = false;

  // show message "install extension"
  var buttonStr = "<button id='installButton' onclick='installChromeExtension()' id='install-button' class='btn btn-warning' title='Install Screen Sharing extension to present your desktop'><i class='fa fa-download fa-fw'></i></button>";

  $("#warningScreenSharingChrome").removeClass("hidden");
  $("#screenEnabled").hide();
  $("#screenEnabled").after(buttonStr);

  $("#installScreenSharingLink").on("click", function() {
    installChromeExtension();
  });

}

function handleMissingFirefoxAddon() {
  $("#screen-call").toggleClass("disabled", true);
  isScreenSharingAvailable = false;

  // show message "install addon"
  var buttonStr = "<button id='installButton' onclick='installFirefoxAddOn(); this.disabled = true;' class='btn btn-warning' title='Install Screen Sharing extension to present your desktop'><i class='fa fa-download fa-fw'></i></button>";
  $("#warningScreenSharingFirefox").removeClass("hidden");
  $("#screenEnabled").hide();
  $("#screenEnabled").after(buttonStr);

  $("#installScreenSharingLink").on("click", function() {
    installFirefoxAddOn();
  });
  $("#warningScreenSharingFirefox").show();
}

function handleScreenSharingAvailable() {
  $("#screenEnabled").show();
  $("#installButton").remove();
  $("#warningScreenSharing").hide();
  isScreenSharingAvailable = true;
}

function installFirefoxAddOn() {
    InstallTrigger.install({
        'Foo': {
            URL: 'https://addons.mozilla.org/firefox/downloads/latest/enable-screen-capturing/addon-655146-latest.xpi?src=dp-btn-primary',
            toString: function() {
                return this.URL;
            }
        }
    });
}

function installChromeExtension() {
  !!navigator.webkitGetUserMedia && !!window.chrome && !!chrome.webstore && !!chrome.webstore.install && chrome.webstore.install('https://chrome.google.com/webstore/detail/cpnlknclehfhfldcbmcalmobceenfjfd',
  function() {
    location.reload();
  },
  function(error) {
    console.error("Unable to install extension! " + error);
  });
}

function getChromeExtensionStatus(callback) {
    // https://chrome.google.com/webstore/detail/screen-capturing/cpnlknclehfhfldcbmcalmobceenfjfd
    var extensionid = 'cpnlknclehfhfldcbmcalmobceenfjfd';

    $.get('chrome-extension://' + extensionid + '/icon.png', function(data) {
      callback('installed');
    }).fail(function() {
      callback('not-installed');
    });
}


function play() {
    var peer = document.getElementById('peer').value;
    if (peer == '') {
        window.alert('You must specify the peer name');
        document.getElementById('peer').focus;
        return;
    }

    document.getElementById('videoSmall').display = 'none';
    setCallState(IN_PLAY);
    showSpinner(videoOutput);

    var options = {
        remoteVideo: videoOutput,
        onicecandidate: onIceCandidate
    }
    webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function(error) {
            if (error) {
                return console.error(error);
            }
            this.generateOffer(onOfferPlay);
        }
    )

}

