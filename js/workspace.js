//The pouchDB instancce for the work spaces
myApp.factory('spacePouch', [function() {

  var mydb = new Pouch('http://db.wiflo.org:5984/workflo_spaces');
  //Pouch.replicate('space-pouch', 'http://db.wiflo.org:5984/workflo_spaces', {continuous: true});
  //Pouch.replicate('http://db.wiflo.org:5984/workflo_spaces', 'space-pouch', {continuous: true});
  return mydb;

}]);

//The wrapper for the workspace pouchDB instance
myApp.factory('spacePouchWrapper', ['$q', '$rootScope', 'spacePouch', function($q, $rootScope, spacePouch){
  return {
    add: function(name,text) {
      function microtimeUID(){
        return new Date().getTime();
      }
      var deferred = $q.defer();
      spacePouch.get(name, function(err, docRetrieved) { 
        if(err == null){     //The workspace does exist
          uid = new Date().getTime().toString(16);
          spacePouch.get(name,  {revs: true}, function(err, docRetrieved) { 
            console.log(docRetrieved);
          });
          var doc = {
            _id: name,
            type: 'WorkSpace',
            name: name,
            content: text,
            _rev: docRetrieved._rev
          };
          spacePouch.put(doc, function(err, res) {
            $rootScope.$apply(function() {
              if (err) {
                deferred.reject(err)
              } else {
                deferred.resolve(res)
              }
            });
          });
          return deferred.promise;
        } else {          // The workspace does not exist
          console.log("error out");
          var doc = {
            _id: name,
            type: 'WorkSpace',
            name: name,
            content: text,
          };
          spacePouch.post(doc, function(err, res) {
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
      });
    },
    update: function(id) {
      var deferred = $q.defer();
      spacePouch.get(id, function(err, doc) {
        $rootScope.$apply(function() {
          if (err) {
            deferred.reject(err);
          } else {
            spacePouch.remove(doc, function(err, res) {
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

myApp.directive('markupView', function() {
    return {
      restrict: 'A', // only activate on element attribute
      require: '?ngModel', // get a hold of NgModelController
      link: function(scope, element, attrs, ngModel) {
        if(!ngModel) return; // do nothing if no ng-model
 
        // Specify how UI should be updated
        ngModel.$render = function() {
          element.html(ngModel.$viewValue || '');
        };
 
        // Listen for change events to enable binding
        element.on('blur keyup change', function() {
          scope.$apply(read);
        });
        read(); // initialize
 
        // Write data to the model
        function read() {
          var html = element.html();
          // When we clear the content editable the browser leaves a <br> behind
          // If strip-br attribute is provided then we strip this out
          if( attrs.stripBr && html == '<br>' ) {
            html = '';
          }
          ngModel.$setViewValue(html);
        }
      }
    };
  });

myApp.factory('workspaceListener', ['$rootScope', 'spacePouch', function($rootScope, spacePouch) {

  spacePouch.changes({
    continuous: true,
    onChange: function(change) {
      if (!change.deleted) {
        $rootScope.$apply(function() {
          spacePouch.get(change.id, function(err, doc) {
            $rootScope.$apply(function() {
              if (err) console.log(err);
              $rootScope.$broadcast('newWorkspace', doc);
            })
          });
        })
      } else {
        $rootScope.$apply(function() {
          $rootScope.$broadcast('delTodo', change.id);
        });
      }
    }
  })
}]);

myApp.controller('workspaceCtrl', ['$scope', '$window', '$timeout', 'spacePouchWrapper', 'workspaceListener', function($scope, $window, $timeout, spacePouchWrapper, workspaceListener) {

  //Dyanmic style function
  $scope.color = function (user) {
    if (user.status == "active") {
      return { backgroundColor: "#75FF75" }
    } else {
      return { backgroundColor: "#FF3333" }
    }
  };

  //Holds the raw markup
  $scope.markup = "";
  //Holds the sanitized markup
  $scope.markupSanitized= "";
  //The current active work space
  $scope.activeSpace = {};
  //Holds all the workspaces
  $scope.workspaces = {};

  //Watches the markup model for tags
  $scope.$watch('markup',function(){
    //Copy over the markup
    $scope.markupTranslated = $scope.markup;
    //Copy markup to pouch model
    $scope.activeSpace.content = $scope.markup;
    //Check for script tags
    if(($scope.markup.indexOf("<script>")) > -1){
      //Escape the script tags
      $scope.markupTranslated = $scope.markup.replace("<script>", '"<"script">"');
    }
    //Check for script tags
    if(($scope.markup.indexOf("</script>")) > -1){
      //Escape the script tags
      $scope.markupTranslated = $scope.markup.replace("</script>", '"<"/script">"');
    }
    else
      $scope.markupTranslated = $scope.markupTranslated.replace("#", "</h1>");
  });

  //Listens to broadcast for new workspaces from change listener
  $scope.$on('newWorkspace', function(event, workspace) {
    //console.log(workspace.name);
    if(workspace != null){
      $scope.workspaces[workspace.name] = workspace;
    }
  });

  //Create a new workspace in the database
  $scope.newSpace = function(){
    spacePouchWrapper.add($scope.activeSpace.name, $scope.markup)
    //console.log(new Date().getTime());
  };

  //Sync with workspace in the database
  $scope.sync = function(){
    if($scope.activeSpace.name != ""){
      spacePouchWrapper.add($scope.activeSpace.name, $scope.markup)
      //console.log(new Date().getTime());
    }
  };

  //Activate a workspace
  $scope.activate = function(workspace){
    $scope.activeSpace = workspace;
    $scope.markup = $scope.activeSpace.content;
  };

  //The synchronizing function
  $scope.syncData = function(){
    $timeout(function(){
      $scope.sync();
      $scope.syncData();
    }, 1000 * 1000 * 10)
  };

  $scope.syncData();
}]);






