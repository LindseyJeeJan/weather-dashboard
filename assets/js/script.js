var btnSearch = $('#btn-search');
var searchInput = $('#search');
var cityList = $('#city-list');
var cityNameDisplay = $('#cityName');
var todaysDate = $('#todaysDate');
var temperature = $('#temperature');
var humidity = $('#humidity');
var windSpeed = $('#wind-speed');
var uvIndex = $('.badge');
var weatherIcon = $('#h2-card-image');
var errorMessage = $('#error');
var errorCitySearch = $('#error-city');
var errorCommaIncluded = $('#error-comma');
var historyHeaderContainer = $('#history-header');
var emptyListMessage = $('.empty-list');
var clearHistoryLink = $('.clear-history');
var itemSelected = $('<i class="fas fa-check"></i>');
var searches = [];
var latLong = [];
var btnClicked = false;

// Click event to capture when user clicks search
btnSearch.on('click', function(event) {
    event.preventDefault();
    resetErrorMessages();
    var searchLocation = searchInput.val().trim();
    if (searchLocation === ""){
        // return if search empty
        errorMessage.show();
        return;
    } 
    if  (searchLocation.indexOf(',') > -1){ 
         // return if search includes state
        errorCommaIncluded.show();
        return;
    }
    $('li').removeClass('bg-warning');
    // function to retrieve the longitude and latitude of the city searched
    convertToLongLat(searchLocation);
    btnClicked = true;
});

// Click event to capture user clicking on a city
cityList.on('click', 'li:not(.empty-list)', function(event) {
    //  Get city name only for search
    var listLocation = $(this).find('.localCityName').text();
    
    // change background of selected city only
    $('li').removeClass('bg-warning');
    $(this).addClass('bg-warning').append(itemSelected);
    // function to retrieve the longitude and latitude of the city clicked
    convertToLongLat(listLocation);
    btnClicked = false;
});

historyHeaderContainer.on('click', '.clear-history', function(event){
    localStorage.clear();
    renderSearchHistory();
});

function renderSearchHistory () {
    // First clear the list
    cityList.find('li:not(.empty-list)').remove();

    // If there is no list, show the "No search history" message. If there is a list, show the clear link.
    if (searches.length === 0){
        emptyListMessage.show();
        clearHistoryLink.hide();
    } else {
        emptyListMessage.hide();
        clearHistoryLink.show();
    }

    // Get search phrases from the array of objects and print them onto the page
    for (var i = 0; i < searches.length; i++) {
        var search = searches[i];
        // create display elements
        var newListItem = $('<li class="list-group-item">');  
        var newListItemCity = $('<span class="localCityName">');   
        var newListItemOther = $('<span>'); 
        
        // get the values from the object in the array
        newListItemCity.text(search.city);
        newListItemOther.text(', ' + search.other);

        // display the city name and state or country in search history
        newListItem.append(newListItemCity).append(newListItemOther);
        cityList.append(newListItem);
    }   
     // If this is a new item added to the list and currently displaying, highlight it as selected yellow color
    if (btnClicked == true){
        cityList.find('li:last-child').addClass('bg-warning').append(itemSelected);
    }
}

function resetErrorMessages() {
    errorMessage.hide();
    errorCitySearch.hide();
    errorCommaIncluded.hide();
}

// Convert the city name to long and lat for the Open API
function convertToLongLat(city){
    var requestUrl = 'http://api.openweathermap.org/geo/1.0/direct?q=' +
    city + '&limit=5&appid=ce4222a2bf38275175e19449b4ee48a5';
    fetch(requestUrl)
        .then(function (response) {
            // If city information is not found, display error
            if (response.status === 404)  {
                errorCitySearch.show();
                return;
            } 
            return response.json();
        })
        .then(function (data) {
            if (data.length == 0)  {
                errorCitySearch.show();
                return;
            } 
            if ((data[0].country) == "US") {
                var cityStateCountry = (data[0].local_names.feature_name + ', ' + data[0].state);
            } else {
                var cityStateCountry = (data[0].local_names.feature_name + ', ' + data[0].country);
            }
            // Display location city, state (if US) and country
            cityNameDisplay.text(cityStateCountry);

            // Add city to search history only if new city is searched 
            if (btnClicked === true){
                // get specific location information
                cityName = (data[0].local_names.feature_name);
                var otherName;
                if ((data[0].country) == "US") {
                    otherName = data[0].state;
                } else {
                    otherName = data[0].country;
                }
               //  push search to searches array
                searches.push({
                    city: cityName,
                    other: otherName
                });
                //  push to local storage
                localStorage.setItem('searches', JSON.stringify(searches));
                renderSearchHistory(); 
            }
            // store longitude and latitude in array, but empty it first
            latLong[0] = data[0].lat;
            latLong[1] = data[0].lon;
            // retrieve weather data for this city from the API
            getApi(latLong);
        })
}
    
// Get data from the Open Weather API; excluding some data and in imperial format
function getApi(locationCoordinates) {
    var latitudeVal = locationCoordinates[0];
    var longitudeVal = locationCoordinates[1];
    var requestUrl = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + latitudeVal + '&lon=' + longitudeVal + '&exclude=minutely,hourly,alerts&units=imperial&appid=ce4222a2bf38275175e19449b4ee48a5';
  fetch(requestUrl)
    .then(function (response) {
        if (response.status === 404) {
            // If city information is not found display error message
            errorCitySearch.show();
        }
        if (response.status === 200) {
            // If city information is found hide error message
            resetErrorMessages();
        }
      return response.json();
    })
    .then(function (data) {
        // Write information to the main weather card with data from API  
        humidity.text('Humidity: ' + data.current.humidity + '%');
        windSpeed.text('Wind Speed: ' + data.current.wind_speed + 'mph');
        $('#uv-index').text('UV Index: ');
        uvIndex.text(data.current.uvi);

        var icon = data.current.weather[0].icon;
        var iconLocation = ("http://openweathermap.org/img/wn/" + icon +"@2x.png");
        weatherIcon.attr('src', iconLocation);
        
       // Get the UV index and display the appropriate badge color according to the conditions
        var uvindex = data.current.uvi;
        renderUvIndexColor(uvindex);

        // Display temperature with one decimal point
        var temp = data.current.temp;
        temp = parseFloat(temp).toFixed(0);
        temperature.text(temp + 'ºF');

        // Store the array of forecasts
        var forecasts = data.daily;
        var counter = 0;
        // Loop through the forecast array. For the first 5, write the data to the bootstrap cards in the UI. Add temp, humidity and the icon from the forecast
        for (var i = 0; i < 5; i++) {
            // store the forecast data 
            var forecastTemp = forecasts[i].temp.day;
            forecastTemp = parseFloat(forecastTemp).toFixed(0);
            var forecastHumidity = forecasts[i].humidity;
            var forecastIcon = forecasts[i].weather[0].icon;
            var forecastIconLocation = ("http://openweathermap.org/img/wn/" + forecastIcon +"@2x.png");
            
            // write the forecast data to the page
            $('.forecast h2.mb-4').text('5-Day Forecast');
            $('.card').addClass('bg-success');
            var forecastContainer = $('.card')[counter];
            $(forecastContainer).find('.temperature').text(forecastTemp + 'ºF');
            $(forecastContainer).find('.humidity').text('Humidity: ' + forecastHumidity + '%');
            $(forecastContainer).find('img.card-image').attr('src', forecastIconLocation);

            // increment counter for looping
            counter++;
        }
        // display these values from moment
        showTodaysDate();
        showForecastDates();
    });
}

// color code the uv index
function renderUvIndexColor(uvindex) {
        uvIndex.removeClass('badge-success badge-warning badge-danger');

        if (uvindex <= 2){
             // Less than or equal to 2 is favorable, green
            uvIndex.addClass('badge-success');
        } else if (uvindex <= 7) {
            // Between 3-7 is moderate, yellow
            uvIndex.addClass('badge-warning');
        } else {
             // Over 8 is severe, red
            uvIndex.addClass('badge-danger');
        }
}

// display the date in the main weather card
function showTodaysDate(){
    var dateDisplay = moment().format('dddd MM/DD/YYYY');
    todaysDate.text(dateDisplay);
}

// display the 5-day forecast dates 
function showForecastDates() {
    var number = 1;
    $('h5.card-title').each(function(){
        var date = moment().format('dddd');
        date = moment(date, 'dddd').add(number, 'days').format('dddd');
        $(this).text(date);
        number = number + 1;
    })
}

function init() {
    // Get search history from localStorage
    var storedSearchHistory = JSON.parse(localStorage.getItem('searches'));
    // If search history exist in localStorage, update the searches array
    if (storedSearchHistory !== null) {
        searches = storedSearchHistory;
    }
    // render search history to the page
    btnClicked = false;
    renderSearchHistory();
}

init();