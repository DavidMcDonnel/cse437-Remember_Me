var app = angular.module('rememberMe', ['ui.router']); //CHANGE

app.controller('MainCtrl', ['$scope', 'articles', function($scope, articles){
	$scope.newArticle = false;
	$scope.articles = articles.articles;
	$scope.remind_options = ['1 day', '1 week', '2 weeks']; 
	console.log($scope.remind_options);

	$scope.addArticle = function(){
		if($scope.name != ''){
			// Calculate new date based on text input of reminder timeframe 
			var addToDate = 0;
			switch($scope.remind_on){
				case $scope.remind_options[0]:
					addToDate = 1;
					break;
				case $scope.remind_options[1]:
					addToDate = 7;
					break;
				case $scope.remind_options[2]:
					addToDate = 14;
					break;
			}
			var date = new Date();
			date.setDate(date.getDate() + addToDate);

			articles.create({
				name: $scope.name,
				link: $scope.link,
				remind_me: {
					date: date.toDateString()	// FIXME: add time once we allow user preferences
				}
			});
			$scope.name = '';
			$scope.link = '';
			$scope.remind_on = '';
		}
	};

	$scope.snoozeReminder = function(article){
		articles.snooze(article);
	};
//UNCOMMENT
	// $scope.init = function(){
	// 	articles.getAll();
		
	// 	$scope.getCurrentTabUrl(function(url, title){
	// 		$scope.link = url;
	// 		//$scope.name = title; 
	// 	});
	// };

	// $scope.getCurrentTabUrl = function(callback){
	//   // Query filter to be passed to chrome.tabs.query - see
	//   // https://developer.chrome.com/extensions/tabs#method-query
	//   var queryInfo = {
	//     active: true,
	//     currentWindow: true
	//   };

	//   chrome.tabs.query(queryInfo, function(tabs) {
	//     // chrome.tabs.query invokes the callback with a list of tabs that match the
	//     // query. When the popup is opened, there is certainly a window and at least
	//     // one tab, so we can safely assume that |tabs| is a non-empty array.
	//     // A window can only have one active tab at a time, so the array consists of
	//     // exactly one tab.
	//     var tab = tabs[0];

	//     // A tab is a plain object that provides information about the tab.
	//     // See https://developer.chrome.com/extensions/tabs#type-Tab
	//     var url = tab.url;
	//     var title = tab.title;

	//     // tab.url is only available if the "activeTab" permission is declared.
	//     // If you want to see the URL of other tabs (e.g. after removing active:true
	//     // from |queryInfo|), then the "tabs" permission is required to see their
	//     // "url" properties.
	//     console.assert(typeof url == 'string', 'tab.url should be a string');

	//     callback(url, title);
	//   });
	// };

	// $scope.toggleNew = function() {
	// 	$scope.newArticle = !$scope.newArticle;
	// };
}]);

app.controller('ArticlesCtrl', ['$scope', '$stateParams', 'articles', function($scope, $stateParams, articles){
	$scope.articles = articles.articles[$stateParams.id];

	$scope.addReminder = function(){
		$scope.reminders.push($scope.datetime);
	}
}]);

app.factory('articles', ['$http', function($http){
	var o = {
		articles: []
	};

	o.getAll = function() {
		return $http.get('/articles').success(function(data){ //http://localhost:3000/articles
			angular.copy(data, o.articles);
		});
	};

	o.getToday = function(){
		return $http.get('/articles/today').success(function(data){
			angular.copy(data, o.articles);
		});
	};

	o.create = function(article){
		return $http.post('/articles', article).success(function(data){
			o.articles.push(data);
		});
	};

	o.snooze = function(article){
		return $http.put('/articles/' + article._id + '/snooze').success(function(data){
			var new_date = new Date(this.remind_me.date);
			new_date.setDate(new_date.getDate() + 1); // FIX ME - allow user-specified snooze-time
			article.remind_me.date = new_date.toDateString();
		});
	};

	return o;
}]);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$stateProvider
	.state('home', {
		url: '/home',
		templateUrl: '/home.html',
		controller: 'MainCtrl',
		resolve: {
			articlePromise: [ 'articles', function(articles){
				return articles.getAll();
			}]
		}
	})
	.state('articles', {
		url: '/articles/{id}',
		templateUrl: '/articles.html',
		controller: 'ArticlesCtrl'
	});

	$urlRouterProvider.otherwise('home');
}]);