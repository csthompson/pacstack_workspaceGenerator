myApp.factory('schedule', [function() {
  var mydb = new Pouch('http://db.wiflo.org:5984/lab2102');
  //Pouch.replicate('wiflo_current-users', 'http://db.wiflo.org:5984/wiflo_current-users', {continuous: true});
  //Pouch.replicate('http://db.wiflo.org:5984/wiflo_current-users', 'wiflo_current-users', {continuous: true});
  return mydb;
}]);

myApp.factory('current_usersListener', ['$rootScope', 'current_users', function($rootScope, current_users) {

  current_users.changes({
    continuous: true,
    onChange: function(change) {
    	console.log(change.changes);
      if (!change.deleted) {
        $rootScope.$apply(function() {
          current_users.get(change.id, function(err, doc) {
            $rootScope.$apply(function() {
              if (err) console.log(err);
              $rootScope.$broadcast('new_user', doc);
            })
          });
        })
      } else (change.deleted) 
        $rootScope.$apply(function() {
          $rootScope.$broadcast('rem_user', change.id);
        });
    }
  })
}]);

myApp.controller('current_usersCtrl', ['$scope', 'current_usersWrapper', 'current_usersListener', '$window', 'shared', 'geoBubble', function($scope, current_usersWrapper, current_usersListener, $window, shared, geoBubble) {

  $scope.logon = function() {
      //Broadcast the userId to all the other controllers using the shared service
      shared.broadcastUserName($scope.username);
      current_usersWrapper.logon().then(function(res) {
      $scope.userId = res.id;
      $scope.userTimeout = $window.setTimeout(function(){$scope.logoff();}, 10000);
      //Get the position
      geoBubble.getBubble();
      jQuery(".login-page").slideUp('slow');
      jQuery(".main-page").css("display", "block");
    }, function(reason) {
      console.log(reason);
    });
  };

  $scope.logoff = function() {
	current_usersWrapper.inactivate($scope.userId).then(function(res) {
//      console.log(res);
    }, function(reason) {
      console.log(reason);
    })
  };

  $scope.setActive = function() {
  current_usersWrapper.activate($scope.userId).then(function(res) {
//      console.log(res);
    }, function(reason) {
      alert("User Timeout");
      location.reload();
    })
  };

  //Dyanmic style function
  $scope.color = function (user) {
    if (user.status == "active") {
      return { backgroundColor: "#75FF75" }
    } else {
      return { backgroundColor: "#FF3333" }
    }
  };

  //Holds all the current users
  $scope.users = [];

  //Will hold information about the geographical bubble
  $scope.bubble = {};

  //Listeners to broadcasts
  $scope.$on('resetUserActivity', function(){
    $scope.setActive();
    clearTimeout($scope.userTimeout);
    $scope.userTimeout = $window.setTimeout(function(){$scope.logoff();}, 10000);
  });

  $scope.$on('locationAquired', function(){
      $scope.bubble.north = geoBubble.north;
      $scope.bubble.east = geoBubble.east;
      $scope.bubble.south = geoBubble.south;
      $scope.bubble.west = geoBubble.west;
      console.log($scope.bubble);
      current_usersWrapper.setPosition($scope.userId, geoBubble.selfLat, geoBubble.selfLon).then(function(res) {
  //      console.log(res);
      }, function(reason) {
        console.log(reason);
      });
      $scope.inBubble = function(user){
        console.log("User lat:" + user.lat);
        console.log("User lon:" + user.lon);
        console.log("User low_lon:" + $scope.bubble.east);
        console.log("User high_lon:" + $scope.bubble.west);
        return (user.lon >= Math.min($scope.bubble.west, $scope.bubble.east) && user.lon <= Math.max($scope.bubble.west, $scope.bubble.east));};
  });

  $scope.$on('new_user', function(event, user) {
    $scope.users.push(user);
  });

  $scope.$on('rem_user', function(event, id) {
    for (var i = 0; i<$scope.users.length; i++) {
      if ($scope.users[i]._id === id) {
        $scope.users.splice(i,1);
      }
    }
  });


}]);






