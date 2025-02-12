;var BLOCKER_EXT=(function(my){
  if (my.inited) {
    return my;
  }
  my.inited = true;
  var removed = false;
  const selector = "script,iframe,body>a,#dontfoid,#alert-popup";
  var countOfTests = 0;


  var pollID = 0;
  const removeTags = function() {
    console.log("Removing tags");
    document.querySelectorAll(selector).forEach(x=>x.remove());
  }
  my.pollUntilExecuted = function() {
    pollID = setInterval(function() {
      console.log('polling');
      removeTags();
      if (document.querySelectorAll(selector).length === 0) {
        countOfTests++;
        if (countOfTests > 10) {
          clearInterval(pollID);
          console.log('polling done');
        }
      }
    }, 500);
  }

  return my;
  
}(BLOCKER_EXT||{}));

BLOCKER_EXT.pollUntilExecuted();
console.log('content.js loaded');