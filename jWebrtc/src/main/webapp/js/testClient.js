
window.onload = function() {
  if(doLog) console = new Console();
  setRegisterState(NOT_REGISTERED);
  var drag = new Draggabilly(document.getElementById('videoSmall'));
  videoInput = document.getElementById('videoInput');
  videoOutput = document.getElementById('videoOutput');

  document.getElementById('name').focus();
  ws.onopen = function() {
      log("ws connection now open");
      requestAppConfig();
  }
  isExtensionInstalled();
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox();
});