myApp.factory('geoBubble', ['$rootScope', function($rootScope) {

      //Creat a new object that will hold the constraining coordinates
      geoBubble = {};
      geoBubble.selfLon = '';
      geoBubble.selfLat = '';
      //Specify the constraining coordinate
      geoBubble.north = '';
      geoBubble.east = '';
      geoBubble.south = '';
      geoBubble.west = '';

      geoBubble.getBubble = function(){
        navigator.geolocation.getCurrentPosition(calculateBubble);
      }

      function calculateBubble(position)
      {
          //Radius of the earth
          var R = 6371;
          //Distance for bubble (km)
          var d = 1;
          var lat1 = position.coords.latitude;
          var lon1 = position.coords.longitude;
          geoBubble.selfLat = lat1;
          geoBubble.selfLon = lon1;

          function calculateNorth(lat1){
              geoBubble.north = Math.asin( Math.sin(lat1)*Math.cos(d/R) + 
                      Math.cos(lat1)*Math.sin(d/R)*Math.cos(0));
          }
          function calculateEast(lon1){

            var lat1 = position.coords.latitude;
            var lon1 = position.coords.longitude;
            var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + 
                    Math.cos(lat1)*Math.sin(d/R)*Math.cos(90) );
            geoBubble.east = lon1 + Math.atan2(Math.sin(90)*Math.sin(d/R)*Math.cos(lat1), 
                           Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
          }
          function calculateSouth(lat1){
              geoBubble.south = Math.asin( Math.sin(lat1)*Math.cos(d/R) + 
                      Math.cos(lat1)*Math.sin(d/R)*Math.cos(180) );
          }
          function calculateWest(lon1){
            var lat1 = position.coords.latitude;
            var lon1 = position.coords.longitude;
            var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + 
                    Math.cos(lat1)*Math.sin(d/R)*Math.cos(270) );
            geoBubble.west =  lon1 + Math.atan2(Math.sin(270)*Math.sin(d/R)*Math.cos(lat1), 
                           Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
          }
          calculateNorth();
          calculateEast();
          calculateSouth();
          calculateWest();
          $rootScope.$broadcast('locationAquired');
      }
      return geoBubble;
  }]);