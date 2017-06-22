


var app = angular.module('BulgeApp', ['ngMap']);




app.controller("MapController", 
	
	function($scope, EarthquakeService, $timeout,NgMap  ) {
    $scope.taxiData = [];
		var earthquakes = {};
		 var layer;
		var current3dChart;
		var current2dChart;

		$scope.numberOfEarthquakesDisplayedInTable = 50;
		
		$scope.graphDisplayHours = 48;
		$scope.graphDisplayQuakeSize =0;
		$scope.graphDisplayOnlyVerified = true;
		$scope.radiusheatmap = 50;
		$scope.refreshRate =60;

		$scope.earthquakes = [];
		$scope.earthquakes2 = [];
		function earthquakeIsEqualOrLargerThanFilter(earthquake) {
			return earthquake.size >= $scope.graphDisplayQuakeSize;
		}

		function earthquakeOccuredInLessThanHours(earthquake, nowInUnixTime) {
			var hoursInMs = $scope.graphDisplayHours * 3600 * 1000;
			var hoursAgo = nowInUnixTime - hoursInMs;

			if(earthquake.occuredAt >= hoursAgo) {
				return true;
			}
			return false;
		}

		function earthquakeMatchesFilters(earthquake, nowInUnixTime) {
			if(earthquakeOccuredInLessThanHours(earthquake, nowInUnixTime)) {
				if(earthquakeIsEqualOrLargerThanFilter(earthquake)) {
					if(!$scope.graphDisplayOnlyVerified) {
						return true;
					}
					else {
						return earthquake.verified;
					}
				}
			}
			return false;
		}

		function redrawWithFilter() {
			var earthquakesMatchingFilter = getChartCoordinatesForEarthquakes($scope.earthquakes);
			
			//domapstuff($scope.earthquakes);
			makeNew3dChart(earthquakesMatchingFilter);
			
		}
		
		function domapstuff(data){
		
		for(var i = 0; i < data.length; ++i) {
				var currentEarthquake = data[i];
		
							 var lat =   currentEarthquake.latitude;
            var lng = currentEarthquake.longitude;
          
	
            var latlng = new google.maps.LatLng(lng, lat);
			
			
			 markers[i] = new google.maps.Marker({
          position: latlng,
          title: currentEarthquake.humanReadableLocation +" mag: "  + currentEarthquake.size
        });
	  
	  

			

			
			//markers[i].setTitle(currentEarthquake.humanReadableLocation);
            markers[i].setPosition(latlng);
					
			    markers[i].setMap($scope.map);	

		}
		
		}
		function markerClick(){
    console.log('click in the marker');
}
		
		function get3dCoordinatesAs2d(data) {
			var result = [];

			for(var i = 0; i < data.length; ++i) {
				var currentCoordinate = data[i];
				var coordinate2d = create2dCoordinateFrom3dCoordinate(currentCoordinate);

				result.push(coordinate2d);
			}

			return result;
		}

		var redrawTimeout;
		$scope.graphFilterChange = function() {
			if(redrawTimeout) {
				$timeout.cancel(redrawTimeout);
				redrawTimeout = undefined;
			}
			redrawTimeout = $timeout(redrawWithFilter, 1000);
		};

		function create2dCoordinateFrom3dCoordinate(coordinate3d) {

			var result = {
				x: coordinate3d.x,
				y: latitudeLimits.min + (latitudeLimits.max - coordinate3d.z),
				depth: coordinate3d.y,
				richter: coordinate3d.richter,
				timeAgo: coordinate3d.timeAgo,
				marker: angular.copy(coordinate3d.marker)
			};
			result.marker.radius = 1 + (coordinate3d.richter / 6) * 8;
			return result;
		}



		function createCoordinateFromEarthquake(earthquake, nowInUnixTime) {
			var drawRadius = Math.pow(0.8 + earthquake.size, 2);
			return {
				x: longitudeLimits.min + (longitudeLimits.max -earthquake.longitude),
				y: earthquake.depth, 
				z: latitudeLimits.min + (latitudeLimits.max -earthquake.latitude),
				richter: earthquake.size,
				timeAgo: $scope.timeSince(earthquake.occuredAt),
				marker: {
					fillColor: earthquake.color(nowInUnixTime),
					lineColor: "#123F3F",
					lineWidth: 1,
					radius: drawRadius
				}
			}
		}

		function getChartCoordinatesForEarthquakes(data) {
			var nowInUnixTime = new Date().getTime();

			var result = [];
var result2 = [];
var result3 = [];
			for(var i = 0; i < data.length; ++i) {
				var currentEarthquake = data[i];

			 var lat =   currentEarthquake.latitude;
            var lng = currentEarthquake.longitude;
          
	
            var latlng = new google.maps.LatLng(lng, lat);			


			result3.push({location:latlng});
				
					
				
				if(earthquakeMatchesFilters(currentEarthquake, nowInUnixTime)) {
			
				result2.push(currentEarthquake);	
					earthquakes[currentEarthquake.occuredAt].coordinateId = result.length;
					
					result.push(createCoordinateFromEarthquake(currentEarthquake, nowInUnixTime));
				}
			}
			$scope.earthquakes2 = result2.reverse();
				$scope.taxidata  = result3;

	NgMap.getMap().then(function(map) {


          layer = $scope.map.heatmapLayers.taxiDataMap;
         layer.setData(result3);

  });
				
				
			return result.reverse();
		}
		


		function addEarthquakesToChart() {
			if(!current3dChart  ) {
				return;
			}

			redrawWithFilter();
		}

		var latitudeLimits = {
			min: 100000000,
			max: -100000000
		};

		var longitudeLimits = {
			min: 100000000,
			max: -100000000
		};

		var depthLimits = {
			min: 100000000,
			max: -100000000
		};

		function updateLimitsForObject(value, limit) {
			if(value < limit.min) {
				limit.min = value;
			}
			if(value > limit.max) {
				limit.max = value;
			}
		}

		function updateLimits(latitude, longitude, depth) {
			updateLimitsForObject(latitude, latitudeLimits);
			updateLimitsForObject(longitude, longitudeLimits);
			updateLimitsForObject(depth, depthLimits);
		}

		$scope.allowShaking = true;
		$scope.shaking = false;

		// To not shake the webcam at page load
		var firstShake = true;

		function shakeWebCam(magnitude) {
			if(firstShake) {
				firstShake = false;
				return;
			}

			if($scope.allowShaking) {
				if(!$scope.shaking) {
					$scope.shaking = true;
					$timeout(function() {
						$scope.shaking = false;
					}, 1000 * magnitude);
				}
			}
		}

		function registerNewEarthquakes(data) {
			var biggestNewEarthquakeMagnitude = -100000;
			var newEarthquake = false;

			for(var i = 0; i < data.length; ++i) {
				var currentEarthquake = data[i];

				
				
				
				if(earthquakes[currentEarthquake.occuredAt] === undefined) {
					newEarthquake = true;

					if(currentEarthquake.size > biggestNewEarthquakeMagnitude) {
						biggestNewEarthquakeMagnitude = currentEarthquake.size;
					}
					
					
					

					$scope.earthquakes.push(currentEarthquake);
					earthquakes[currentEarthquake.occuredAt] = currentEarthquake;
					updateLimits(currentEarthquake.latitude, currentEarthquake.longitude, currentEarthquake.depth);
				}
			}

			if(newEarthquake) {
				shakeWebCam(biggestNewEarthquakeMagnitude);
			}
			return newEarthquake;
		}

		function updateEarthquake(earthquakeInMemory, newData) {
			earthquakeInMemory.size = newData.size;
			earthquakeInMemory.longitude = newData.longitude;
			earthquakeInMemory.latitude = newData.latitude;
			earthquakeInMemory.depth = newData.depth;
			earthquakeInMemory.humanReadableLocation = newData.humanReadableLocation;
			earthquakeInMemory.quality = newData.quality;
			earthquakeInMemory.verified = newData.verified;
		}

		function newEarthquakeDataShouldBeSkipped(currentEarthquakeData, newEarthquakeData) {
			if(currentEarthquakeData.quality > newEarthquakeData.quality) {
				return true;
			}
			else {
				return false;
			}
		}

		function updateEarthquakes(data) {
			var earthQuakesWereUpdated = false;
			for(var i = 0; i < data.length; ++i) {
				var currentEarthquake = data[i];
				
				
				

				if(earthquakes[currentEarthquake.occuredAt]) {
					var currentEarthquakeVerified = currentEarthquake.verified;
					var currentVersionOfThisEarthquakeVerified = earthquakes[currentEarthquake.occuredAt].verified;
					
					
2
					
					

					if(newEarthquakeDataShouldBeSkipped(earthquakes[currentEarthquake.occuredAt], currentEarthquake)) {
						continue;
					}
					earthQuakesWereUpdated = true;
					updateEarthquake(earthquakes[currentEarthquake.occuredAt], currentEarthquake);
				}
			}

			if(registerNewEarthquakes(data)) {
				earthQuakesWereUpdated = true;
			}

			return earthQuakesWereUpdated;
		}

		function getEarthquakes() {
			EarthquakeService.getEarthquakesLastHours(2).then(function(data) {
				if(updateEarthquakes(data)) {
					console.log("New earthquakes detected from last update. Updating chart.");

					addEarthquakesToChart();
				}
				$timeout(getEarthquakes, $scope.refreshRate * 1000);
			});
		}

		function setInitialEarthquakeData(data) {
			updateEarthquakes(data);
			makeNew3dChart([]);
		
			if(data.length > 0) {
				addEarthquakesToChart();
			}

			$scope.loading = false;
		}

		$scope.loading = true;
		function init() {
			EarthquakeService.getEarthquakesLastHours(48).then(function(data) {
				setInitialEarthquakeData(data);
				$timeout(getEarthquakes, $scope.refreshRate * 1000);
			});
		}
		init();

		$scope.mouseOverEarthquake = function(e,earthquake) {
	
			var nowInUnixTime = new Date().getTime();

			if(earthquakeMatchesFilters(earthquake, nowInUnixTime)) {
				var index = (current3dChart.series[0].data.length-1) - earthquake.coordinateId;
				var coordinate3d = createCoordinateFromEarthquake(earthquake, nowInUnixTime);
				


				

				coordinate3d.marker.fillColor = "#33CC33";
				coordinate3d.marker.radius *= 1.5;

				current3dChart.series[0].data[index].update(coordinate3d);

				var coordinate2d = create2dCoordinateFrom3dCoordinate(coordinate3d);
				coordinate2d.marker.radius *= 2;
				//current2dChart.series[0].data[index].update(coordinate2d);
			}
		}

		$scope.mouseOutEarthquake = function(e,earthquake) {
			var nowInUnixTime = new Date().getTime();

			if(earthquakeMatchesFilters(earthquake, nowInUnixTime)) {
				var index = (current3dChart.series[0].data.length-1) - earthquake.coordinateId;

				var coordinate3d = createCoordinateFromEarthquake(earthquake, nowInUnixTime);
				current3dChart.series[0].data[index].update(coordinate3d);

				var coordinate2d = create2dCoordinateFrom3dCoordinate(coordinate3d);
				//current2dChart.series[0].data[index].update(coordinate2d);
			}
		}

		var alphaOn3dGraph, betaOn3dGraph;
		function registerClickEventOnChart(chart) {
			$(chart.container).bind('mousedown.hc touchstart.hc', function (e) {
				e = chart.pointer.normalize(e);

				var posX = e.pageX,
				posY = e.pageY,
				alpha = chart.options.chart.options3d.alpha,
				beta = chart.options.chart.options3d.beta,
				newAlpha,
				newBeta,
				sensitivity = 5; // lower is more sensitive

				$(document).bind({
					'mousemove.hc touchdrag.hc': function (e) {
						// Run beta
						newBeta = beta + (posX - e.pageX) / sensitivity;
						newBeta = Math.min(100, Math.max(-100, newBeta));
						chart.options.chart.options3d.beta = newBeta;

						// Run alpha
						newAlpha = alpha + (e.pageY - posY) / sensitivity;
						newAlpha = Math.min(100, Math.max(-100, newAlpha));
						chart.options.chart.options3d.alpha = newAlpha;

						alphaOn3dGraph = newAlpha;
						betaOn3dGraph = newBeta;

						chart.redraw(false);
					},
					'mouseup touchend': function () {
						$(document).unbind('.hc');
					}
				});
			});
		}

		function makeNew3dChart(data) {
			if(current3dChart) {
				current3dChart.destroy();
			}

			if(!alphaOn3dGraph && !betaOn3dGraph) {
				alphaOn3dGraph = 10;
				betaOn3dGraph = 30;
			}

			current3dChart = new Highcharts.Chart({
				chart: {
					renderTo: 'volcano-chart',
					
                         backgroundColor:'rgba(42, 42, 43, 0.0 )',
					margin: 100,
					type: 'scatter',
					options3d: {
						enabled: true,
						alpha: alphaOn3dGraph,
						beta: betaOn3dGraph,
						depth: 275,
						viewDistance: 5,

						frame: {
							bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
							back: { size: 1, color: 'rgba(0,0,0,0.04)' },
							side: { size: 1, color: 'rgba(0,0,0,0.06)' }
						}
					},
					height: window.innerHeight - 160,
				},
				tooltip: {
					formatter: function () {
						var result = "";
		
						result += "<p><strong>Happened</strong> " + this.point.timeAgo + ", ";
						result += "<strong>magnitude</strong> " + this.point.richter + "</p> ";

						return result;
					}
				},
				title: {
					text: null
				},
				plotOptions: {
					scatter: {
						animation: true,
						width: 10,
						height: 10,
						depth: 10,
						marker: {
							states: {
								hover: {
									enabled: true,
									radius: null,
									radiusPlus: 0,
									lineWidth: 1,
									lineWidthPlus: 0,
									fillColor: "#0f0",
								}
							}
						}
					}
				},
				yAxis: {
					reversed: true,
					min: depthLimits.min,
					max: depthLimits.max,
					labels: {
						format: '{value} km',
						enabled: true
					},
					title: "Depth"
				},
				xAxis: {
				
					labels: {
						enabled: true
					},
					gridLineWidth: 1,
					title: {
						text: "Longitude"
					}
				},
				zAxis: {
					
					min: latitudeLimits.min,
					max: latitudeLimits.max,
					gridLineWidth: 1,
					title: {
						text: "Latitude"
					},
				},
				legend: {
					enabled: true
				},
				series: [{
					name: 'Earthquake location',
					colorByPoint: false,
					data: data,
					turboThreshold: 13337
				}],
			});

			registerClickEventOnChart(current3dChart);
		}

		

          
		$scope.earthquakeTableColor = function(earthquake) {
			if(earthquake.size >= 3) {
				return "danger";
			}
			else if(earthquake.size >= 2) {
				return "warning";
			}
			else {
				return "";
			}
		};

		$scope.timeSince = function(unix) {

		
			return moment(unix).fromNow();
		};
		
        $scope.map = {center: {latitude: 44, longitude: -111 }, zoom: 4 };
        $scope.options = {scrollwheel: false};
        $scope.circles = [
            {
                id: 1,
                center: {
                    latitude: 44,
                    longitude: -111
                },
                radius: 500000,
                stroke: {
                    color: '#08B21F',
                    weight: 2,
                    opacity: 1
                },
                fill: {
                    color: '#08B21F',
                    opacity: 0.5
                },
                geodesic: true, // optional: defaults to false
                draggable: true, // optional: defaults to false
                clickable: true, // optional: defaults to true
                editable: true, // optional: defaults to false
                visible: true, // optional: defaults to true
                control: {}
            }
        ];
	
	
	


$scope.map = { center: { latitude: 44, longitude: -111 }, zoom: 5 };
		$scope.registerEvent = function(type, action, label) {
			ga("send", "event", type, action, label, 1);
		}

		// I know jQuery in angular controllers is a sin, sorry.
		
		
		$(".webcam-wrapper").height($(".webcam-wrapper").width() * 0.56);
		
		
		
	
    var markers = [];

		

		
		    $scope.toggleHeatmap= function(event) {
        layer.setMap(layer.getMap() ? null : $scope.map);
    };

    $scope.changeGradient = function() {
      var gradient = [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
      layer.set('gradient', layer.get('gradient') ? null : gradient);
    }

    $scope.changeRadius = function() {
      layer.set('radius',  $scope.radiusheatmap);
	  $scope.graphFilterChange();
    }

     $scope.changeOpacity = function() {
      layer.set('opacity', layer.get('opacity') ? null : 0.2);
    }
		
		 







		
		
		
		
		
		
		
	}
	
);






