myApp.factory('feed', [function() {
  var mydb = new Pouch('http://db.wiflo.org:5984/wiflo_feed');
  //Pouch.replicate('wiflo_current-users', 'http://db.wiflo.org:5984/wiflo_current-users', {continuous: true});
  //Pouch.replicate('http://db.wiflo.org:5984/wiflo_current-users', 'wiflo_current-users', {continuous: true});
  return mydb;
}]);

myApp.factory('feedWrapper', ['$q', '$rootScope', 'feed', 'shared', function($q, $rootScope, feed, shared) {
  return {
    post: function(text) {
      var deferred = $q.defer();
      var doc = {
        type: "post",
        message: text,
        ip: codehelper_ip.IP,
        timestamp: new Date(),
        username: shared.username
      };
      feed.post(doc, function(err, res) {
        $rootScope.$apply(function() {
          if (err) {
            deferred.reject(err)
          } else {
            deferred.resolve(res)
          }
        });
      });
      return deferred.promise;
    }
  }
}]);

myApp.factory('feedListener', ['$rootScope', 'feed', function($rootScope, feed) {

  feed.changes({
    continuous: true,
    onChange: function(change) {
    	console.log(change.changes);
      if (!change.deleted) {
        $rootScope.$apply(function() {
          feed.get(change.id, function(err, doc) {
            $rootScope.$apply(function() {
              if (err) console.log(err);
              $rootScope.$broadcast('new_post', doc);
            })
          });
        })
      } else (change.deleted) 
        $rootScope.$apply(function() {
          $rootScope.$broadcast('rem_post', change.id);
        }); 
    }
  })
}]);

myApp.controller('feedCtrl', ['$scope', 'feedWrapper', 'feedListener', '$window', 'shared', function($scope, feedWrapper, feedListener, $window, shared) {

  $scope.post = function() {
    feedWrapper.post($scope.text).then(function(res) {
      $scope.text = '';
      //Broadcast a message to reset the user activity timer
      shared.resetUserActivity();
      console.log("POST");
    }, function(reason) {
      console.log(reason);
    })
  };

  $scope.posts = [];

  //$scope.test = $window.setTimeout(function(){shared.resetUserActivity();}, 20000);

	$scope.isActive = function(user){
		return (user.active == "true");
	};

  $scope.$on('userNameBroadcast', function(){
    $scope.username = shared.username;
  });

  $scope.$on('new_post', function(event, post) {
    $scope.posts.push(post);
    console.log(post);
    console.log($scope.posts);
  });

  $scope.$on('rem_post', function(event, id) {
    for (var i = 0; i<$scope.posts.length; i++) {
      if ($scope.posts[i]._id === id) {
        $scope.posts.splice(i,1);
      }
    }
  });
}]);






