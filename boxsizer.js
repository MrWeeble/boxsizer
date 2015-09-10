var key = 'y5ecu7mz8ketv9f';
var client = new Dropbox.Client({ key: key });
var sizes=[];
console.log('initialising Chart');
google.load("visualization", "1", {packages:["treemap"]});
google.setOnLoadCallback(init);

function init() {
	client.authenticate({interactive: false}, function(error, client) {
	  if (error) {
		return handleError(error);
	  }
	  if (client.isAuthenticated()) {
		// Cached credentials are available, make Dropbox API calls.
		run();
	  } else {
		// show and set up the "Sign into Dropbox" button
		var button = document.querySelector("#signin-button");
		button.setAttribute("class", "visible");
		button.addEventListener("click", function() {
		  // The user will have to click an 'Authorize' button.
		  client.authenticate(function(error, client) {
			if (error) {
			  return handleError(error);
			}
			run();
		  });
		});
	  }
	});
}


function run() {
	var folders=[['/', null]]
	next();
	
	function next() {
		var folder = folders.shift();
		var path = folder[0];
		document.getElementById('status').innerHTML='Scanning '+path;
		var name = path.split('/').pop() || 'Your Dropbox';
		sizes.push([{v:path,f:name}, folder[1], 0, 0]);
		
		client.readdir(path, function(error, entries, dirstat, contents) {
			if (error) {
				return showError(error);  // Something went wrong.
			}
			var item;
			for (var i=0, j=contents.length; i<j; i++) {
				item=contents[i];
				if (item.isFile) {
					sizes.push([{v:item.path,f:item.name}, path, item.size, 1])
				} else if (item.isFolder) {
					folders.unshift([item.path, path]);
				}
			}
			if (folders.length>0) {
				console.debug(folders.length);
				next();
			} else {
				document.getElementById('status').innerHTML='Generating Map...';
				drawChart()
			}
		});
	}
}

function handleError() {}

function showError(error) {
  switch (error.status) {
  case Dropbox.ApiError.INVALID_TOKEN:
    // If you're using dropbox.js, the only cause behind this error is that
    // the user token expired.
    // Get the user through the authentication flow again.
    break;

  case Dropbox.ApiError.NOT_FOUND:
    // The file or folder you tried to access is not in the user's Dropbox.
    // Handling this error is specific to your application.
    break;

  case Dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    break;

  case Dropbox.ApiError.RATE_LIMITED:
    // Too many API requests. Tell the user to try again later.
    // Long-term, optimize your code to use fewer API calls.
    break;

  case Dropbox.ApiError.NETWORK_ERROR:
    // An error occurred at the XMLHttpRequest layer.
    // Most likely, the user's network connection is down.
    // API calls will not succeed until the user gets back online.
    break;

  case Dropbox.ApiError.INVALID_PARAM:
  case Dropbox.ApiError.OAUTH_ERROR:
  case Dropbox.ApiError.INVALID_METHOD:
  default:
    // Caused by a bug in dropbox.js, in your application, or in Dropbox.
    // Tell the user an error occurred, ask them to refresh the page.
  }
};

function drawChart() {
	var dataArray = [['Path', 'Parent', 'Size (bytes)', 'Type']].concat(sizes);
	console.table(dataArray);
	var data = google.visualization.arrayToDataTable(dataArray);

	tree = new google.visualization.TreeMap(document.getElementById('chart_div'));

	tree.draw(data, {
		minColor: '#f00',
		midColor: '#ddd',
		maxColor: '#0d0',
		headerHeight: 15,
		fontColor: 'black',
		showScale: true
	});

}
