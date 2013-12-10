myApp.factory('shared', ['$rootScope', function($rootScope) {
	var shared = {};

	shared.username = '';

	//Broadcast the userId to all controllers
	shared.broadcastUserName = function(username){
		this.username = username;
		$rootScope.$broadcast('userNameBroadcast');
	}

	//Broadcast a message to reset the user activity
	shared.resetUserActivity = function(){
		$rootScope.$broadcast('resetUserActivity');
	}

	return shared;
}]);