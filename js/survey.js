myApp.factory('survey', [function() {
  //var mydb = new Pouch('http://db.wiflo.org:5984/survey-cus_sat');
  //Pouch.replicate('wiflo_current-users', 'http://db.wiflo.org:5984/wiflo_current-users', {continuous: true});
  //Pouch.replicate('http://db.wiflo.org:5984/wiflo_current-users', 'wiflo_current-users', {continuous: true});
  return mydb;
}]);

myApp.factory('surveyListener', ['$rootScope', 'survey', function($rootScope, survey) {

  survey.changes({
    continuous: true,
    onChange: function(change) {
    	//console.log(change.changes);
      if (!change.deleted) {
        $rootScope.$apply(function() {
          survey.get(change.id, function(err, doc) {
            $rootScope.$apply(function() {
              if (err) console.log(err);
              $rootScope.$broadcast('add_surveyItem', doc);
            })
          });
        })
      } else (change.deleted) 
        $rootScope.$apply(function() {
          $rootScope.$broadcast('rem_surveyItem', change.id);
        });
    }
  })
}]);

myApp.directive('fileDrag', function () {
  return {
    restrict: 'A',
    link: function (scope, elem) {
      elem.bind('drop', function(e){
        e.preventDefault();
        e..stopPropagation();
        var file = e.dataTransfer.files[0], reader = new FileReader();
          reader.onload = function (event) {
          console.log(event.target);
          elem.style.background = 'url(' + event.target.result + ') no-repeat center';
        };
        console.log(file);
        reader.readAsDataURL(file);

        return false;
      });
    }
  };
});

myApp.controller('surveyCtrl', ['$scope', 'surveyListener', '$window', '$timeout', function($scope, surveyListener, $window, $timeout) {

  //Dyanmic style function
  $scope.color = function (user) {
    if (user.status == "active") {
      return { backgroundColor: "#75FF75" }
    } else {
      return { backgroundColor: "#FF3333" }
    }
  };

  //Holds all the survey items
  $scope.surveyItems = [];
  
  
  // Holds the questions and their sums
  $scope.questions = [];

  //Holds comments
  $scope.comments = [];

  //Holds the current comment to view
  $scope.activeComment = "";

  //Holds all the survey IDs and their associated satisfaction indexes
  $scope.surveyIDs = {};

  //Filter to make sure questions are only kpu related questions
  $scope.type = "kpi";
  
	//Holds the metrics
  $scope.mean = "...";
  $scope.variance = "...";
  $scope.stdDev = "...";
  $scope.lowerBound = "...";
  $scope.upperBound = "...";

  //Holds the outlying data points
  $scope.outliers = [];
  
  //Listeners to broadcasts
  $scope.$on('add_surveyItem', function(event, surveyItemDoc) {
	var surveyItem = {
		_id: surveyItemDoc._id,
		type: surveyItemDoc.type,
		questionName: surveyItemDoc.questionName,
		questionId: surveyItemDoc.questionId,
		data: surveyItemDoc.data
	};
  //console.log(surveyItem);
	if(surveyItem.type == "kpi"){
  	$scope.surveyItems.push(surveyItem);
  	if(!(surveyItem.questionId in $scope.questions)){
			var question = {
        type: "kpi",
				questionId: surveyItemDoc.questionId,
				questionName: surveyItemDoc.questionName,
        questionHTMLName: surveyItemDoc.questionName.replace(/\s/g, ''),
				ratings: [0, 0, 0, 0, 0],
        percentages: [0, 0, 0 ,0, 0],
        total: 0
			}
			$scope.questions[surveyItem.questionId] = question;
			$scope.questions[surveyItem.questionId].ratings[surveyItem.data - 1] ++;
      $scope.questions[surveyItem.questionId].total ++;
      //Recalculate percentages
      for (var i=0;i<$scope.questions[surveyItem.questionId].percentages.length;i++) {
        $scope.questions[surveyItem.questionId].percentages[i] = (($scope.questions[surveyItem.questionId].ratings[i] / $scope.questions[surveyItem.questionId].total) * 100).toFixed(0);
      }
		} else {
			$scope.questions[surveyItem.questionId].ratings[surveyItem.data - 1] ++;
      $scope.questions[surveyItem.questionId].total ++;
      for (var i=0;i<$scope.questions[surveyItem.questionId].percentages.length;i++) {
        $scope.questions[surveyItem.questionId].percentages[i] = (($scope.questions[surveyItem.questionId].ratings[i] / $scope.questions[surveyItem.questionId].total) * 100).toFixed(0);
      }
		}
    //Add to the object that holds the satisfaction indexes
    if(surveyItemDoc.surveyId in $scope.surveyIDs){
      $scope.surveyIDs[surveyItemDoc.surveyId] =  $scope.surveyIDs[surveyItemDoc.surveyId] + surveyItem.data;
    } else {
      $scope.surveyIDs[surveyItemDoc.surveyId] =  surveyItem.data;
    }
	} else if(surveyItem.type == "comment" && surveyItem.questionName != "submit"){
    var comment = {
      type: "comment",
      surveyId: surveyItemDoc.surveyId,
      questionName: surveyItem.questionName,
      data: surveyItem.data
    }
    $scope.comments.push(comment);
  }
  });
  
  $scope.genMetrics = function()
  {
    //Calculate the mean
    var indexTotal = 0;
    var numIndexes = 0;
    var mean = 0;
    for(var key in $scope.surveyIDs) {
      if($scope.surveyIDs.hasOwnProperty(key)) {
        indexTotal = indexTotal + $scope.surveyIDs[key];
        numIndexes ++;
      }
    }
    mean = (indexTotal / numIndexes);
    //Calculate the variance
    var varianceSum = 0;
    var variance = 0;
    for(var key in $scope.surveyIDs) {
      if($scope.surveyIDs.hasOwnProperty(key)) {
        varianceSum = varianceSum + Math.pow(Math.abs($scope.surveyIDs[key] - mean), 2);
      }
    }
    //Get the outlying data points
    variance = (varianceSum / numIndexes);
    //Calculate standard deviation
    var stdDev = 0;
    stdDev = (Math.sqrt(variance));
    //Assign the variables
    $scope.mean = mean.toFixed(2);
    $scope.variance = variance.toFixed(2);
    $scope.stdDev = stdDev.toFixed(2);
    var lowerBound = (mean - stdDev).toFixed(2);
    var upperBound = (mean + stdDev).toFixed(2);
    $scope.lowerBound = lowerBound;
    $scope.upperBound = upperBound;
    //Collect the outlying data points
    $scope.outliers = [];
    for(var key in $scope.surveyIDs) {
      if($scope.surveyIDs.hasOwnProperty(key)) {
        if($scope.surveyIDs[key] < lowerBound){
          var outlier = {
            surveyId: key,
            satIndex: $scope.surveyIDs[key]
          }
          $scope.outliers.push(outlier);
        }
      }
    }
  };

  $scope.showComment = function(surveyId){
    console.log("HEyYYYYY");
    console.log($scope.comments);
    for(var i=0;i<$scope.comments.length;i++) {
      if($scope.comments[i].surveyId == surveyId){
        $scope.activeComment = "Comment: " + $scope.comments[i].data;
      }
    }
  }

}]);






