function hide_msg(msg_id) {
  if($(msg_id).is(':visible')) {
    setTimeout(function(){
      $(msg_id).find('.close').trigger('click');
    }, 4000);
  }
}