var myApp = angular.module('myApp', []);

myApp.factory('current_users', [function() {

  var mydb = new Pouch('wiflo_current-users');
  Pouch.replicate('wiflo_current-users', 'http://db.wiflo.org:5984/wiflo_current-users', {continuous: true});
  Pouch.replicate('http://db.wiflo.org:5984/wiflo_current-users', 'wiflo_current-users', {continuous: true});
  return mydb;
}]);

myApp.factory('current_usersWrapper', ['$q', '$rootScope', 'current_users', function($q, $rootScope, current_users) {
  return {
    activate: function(username) {
      var deferred = $q.defer();
      var doc = {
        username: username,
        ip: codehelper_ip.IP,
        timestamp: new Date(),
        active: "true"
      };
      current_users.post(doc, function(err, res) {
        $rootScope.$apply(function() {
          if (err) {
            deferred.reject(err)
          } else {
            deferred.resolve(res)
          }
        });
      });
      return deferred.promise;
    },
    inactivate: function(id) {
      var deferred = $q.defer();
      current_users.get(id, function(err, doc) {
        $rootScope.$apply(function() {
          if (err) {
            deferred.reject(err);
          } else {
          	doc.active = "false";
            current_users.post(doc, function(err, res) {
              $rootScope.$apply(function() {
                if (err) {
                  deferred.reject(err)
                } else {
                  deferred.resolve(res)
                }
              });
            });
          }
        });
      });
      return deferred.promise;
    }
  }
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
      } else if(change.active === "false") {
        $rootScope.$apply(function() {
          $rootScope.$broadcast('rem_user', change.id);
        });
      }
    }
  })
}]);

myApp.controller('current_usersCtrl', ['$scope', 'current_usersWrapper', 'current_usersListener', function($scope, current_usersWrapper, current_usersListener) {

  $scope.logon = function() {
    current_usersWrapper.activate($scope.username).then(function(res) {
      $scope.username = '';
      $scope.userId = res.id;
    }, function(reason) {
      console.log(reason);
    })
  };

  $scope.logoff = function() {
    current_usersWrapper.inactivate($scope.userId).then(function(res) {
//      console.log(res);
    }, function(reason) {
      console.log(reason);
    })
  };

  $scope.users = [];

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

