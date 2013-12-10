myApp.factory('schedule', [function() {
  var mydb = new Pouch('http://db.wiflo.org:5984/lab2102');
  //Pouch.replicate('wiflo_current-users', 'http://db.wiflo.org:5984/wiflo_current-users', {continuous: true});
  //Pouch.replicate('http://db.wiflo.org:5984/wiflo_current-users', 'wiflo_current-users', {continuous: true});
  return mydb;
}]);

myApp.factory('scheduleListener', ['$rootScope', 'schedule', function($rootScope, schedule) {

  schedule.changes({
    continuous: true,
    onChange: function(change) {
    	console.log(change.changes);
      if (!change.deleted) {
        $rootScope.$apply(function() {
          schedule.get(change.id, function(err, doc) {
            $rootScope.$apply(function() {
              if (err) console.log(err);
              $rootScope.$broadcast('add_scheduleItem', doc);
            })
          });
        })
      } else (change.deleted) 
        $rootScope.$apply(function() {
          $rootScope.$broadcast('rem_scheduleItem', change.id);
        });
    }
  })
}]);

myApp.controller('scheduleCtrl', ['$scope', 'scheduleListener', '$window', '$timeout', function($scope, scheduleListener, $window, $timeout) {

	$scope.minutesToTime = function (minutes){
		function pad(n) {
			return (n < 10) ? ("0" + n) : n;
		}
		var totalMin = minutes;
		var hours = Math.floor(totalMin / 60); 
		var amPm = "am";
		if( hours >= 12 && hours != 24)
			amPm = "pm";
		if(hours == 0)
			hours = 12;
		if (hours > 12)
			hours = hours -12;
		var minutes = totalMin % 60;
		minutes = pad(minutes);
		return hours + ":" + minutes + " " + amPm;
	};


  //Dyanmic style function
  $scope.color = function (user) {
    if (user.status == "active") {
      return { backgroundColor: "#75FF75" }
    } else {
      return { backgroundColor: "#FF3333" }
    }
  };

  //Holds all the schedule items
  $scope.scheduleItems = [];
  
  //Current status of the room
  $scope.status = "Aquiring Status...";
  
  // Holds the occupied times
  $scope.times = [];
  
	$scope.TodayDate = new Date().toISOString().substring(0,10);
  
    //Date Updating Function
	$scope.updateDate = function(){
		$scope.TodayDate = new Date().toISOString().substring(0,10);
		//console.log($scope.TodayDate + "CURRENT DATE");
		$scope.setStatus();
		$timeout($scope.updateDate, 1000);
	};
	$timeout($scope.updateDate, 10000);
	
	$scope.setStatus = function(){
		var currentTime = new Date;
		var currentHours = currentTime.getHours();
		var currentMinutes = currentTime.getMinutes();
		var totalMinutes = (currentHours * 60) + currentMinutes;
		
		//If the current time in minutes is greater than the next time slot in the array, dequeue it
		if($scope.times.length > 0)
		{
			console.log($scope.times[0].EndMinute);
			if(totalMinutes > $scope.times[0].EndMinute)
				$scope.times.shift();
			//Check to make sure the array still has values
			if($scope.times.length > 0)
			{
				var StartMinutes = $scope.times[0].StartMinute;
				var EndMinutes = $scope.times[0].EndMinute;

				if(StartMinutes <= totalMinutes && totalMinutes <= EndMinutes)
					$scope.status = "Occupied";
				else
					$scope.status = "Available";
				console.log(totalMinutes);
				console.log($scope.times);
			} else {
				$scope.status = "Available";
			}
		}
		else
			$scope.status = "Available";
	};
		
 /*
  //Current Date Filter
  $scope.currentDate = function(scheduleItem){
		//Create new Date object from the start date
		var StartDate = new Date(scheduleItem.StartDate);
		//Set the time to zero so it is only the date
		StartDate.setHours(0,0,0,0);
		//Convert to an ISO 8601 compatible date string
		StartDate = StartDate.toISOString();
		console.log(StartDate.substring(0,10));
		var EndDate = new Date(scheduleItem.EndDate);
		EndDate.setHours(0,0,0,0);
		EndDate = EndDate.toISOString();
		console.log(EndDate.substring(0,10));
		var currentDate = $scope.TodayDate;
		//currentDate = currentDate.setHours(0,0,0,0);
		console.log(currentDate.substring(0,10));
		return (StartDate.substring(0,10) == currentDate.substring(0,10) || EndDate.substring(0,10) == currentDate.substring(0,10));
	};
	*/

  //Listeners to broadcasts
  $scope.$on('add_scheduleItem', function(event, scheduleItemDoc) {
	var scheduleItem = {
		_id: scheduleItemDoc._id,
		Type: scheduleItemDoc.Type,
		Instructor: scheduleItemDoc.Instructor,
		EventName: scheduleItemDoc.EventName,
		StartDate: scheduleItemDoc.StartDate.substring(0,10),
		StartMinute: scheduleItemDoc.StartMinute,
		EndDate: scheduleItemDoc.EndDate.substring(0,10),
		EndMinute: scheduleItemDoc.EndMinute,
		StartTime: $scope.minutesToTime(scheduleItemDoc.StartMinute),
		EndTime: $scope.minutesToTime(scheduleItemDoc.EndMinute),
	};
	var time = {
		StartMinute: scheduleItemDoc.StartMinute,
		EndMinute: scheduleItemDoc.EndMinute,
	};		
    $scope.scheduleItems.push(scheduleItem);
	//Push the time on to the end of the array
	$scope.times.push(time);
	//Sort if need be
	$scope.times = $scope.times.sort(function(a,b) { return parseFloat(a.EndMinute) - parseFloat(b.EndMinute) } );
	console.log(time);
  });

  $scope.$on('rem_scheduleItem', function(event, id) {
    for (var i = 0; i<$scope.scheduleItems.length; i++) {
      if ($scope.scheduleItems[i]._id === id) {
        $scope.scheduleItems.splice(i,1);
      }
    }
  });


}]);






