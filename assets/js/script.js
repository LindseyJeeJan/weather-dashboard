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
    var requestUrl = 'https://api.openweathermap.org/geo/1.0/direct?q=' +
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
                var cityStateCountry = (data[0].name + ', ' + data[0].state);
            } else {
                var cityStateCountry = (data[0].name + ', ' + data[0].country);
            }
            // Display location city, state (if US) and country
            cityNameDisplay.text(cityStateCountry);

            // Add city to search history only if new city is searched
            if (btnClicked === true){
                // get specific location information
                cityName = data[0].name;
                var otherName;
                if ((data[0].country) == "US") {
                    otherName = data[0].state;
                } else {
                    otherName = data[0].country;
                }
               //  push search to searches array only if not already in history
                var alreadyInHistory = searches.some(function(s) {
                    return s.city === cityName && s.other === otherName;
                });
                if (!alreadyInHistory) {
                searches.push({
                    city: cityName,
                    other: otherName
                });
                }
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
    
// Get data from the Open Weather API in imperial format
// Uses data/2.5/weather (current) and data/2.5/forecast (5-day) — both free tier
function getApi(locationCoordinates) {
    var latitudeVal = locationCoordinates[0];
    var longitudeVal = locationCoordinates[1];
    var apiKey = 'ce4222a2bf38275175e19449b4ee48a5';
    var weatherUrl = 'https://api.openweathermap.org/data/2.5/weather?lat=' + latitudeVal + '&lon=' + longitudeVal + '&units=imperial&appid=' + apiKey;
    var forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + latitudeVal + '&lon=' + longitudeVal + '&units=imperial&appid=' + apiKey;

    Promise.all([fetch(weatherUrl), fetch(forecastUrl)])
        .then(function(responses) {
            return Promise.all([responses[0].json(), responses[1].json()]);
        })
        .then(function(results) {
            var current = results[0];
            var forecastData = results[1];

            if (current.cod !== 200) {
                errorCitySearch.show();
                return;
            }
            resetErrorMessages();

            // Current weather
            humidity.text('Humidity: ' + current.main.humidity + '%');
            windSpeed.text('Wind Speed: ' + current.wind.speed + ' mph');
            $('#uv-index').text('UV Index: N/A');
            uvIndex.text('');
            uvIndex.removeClass('badge-success badge-warning badge-danger');

            var icon = current.weather[0].icon;
            weatherIcon.attr('src', 'https://openweathermap.org/img/wn/' + icon + '@2x.png');

            var temp = parseFloat(current.main.temp).toFixed(0);
            temperature.text(temp + 'ºF');

            // 5-day forecast: pick the first reading per future day
            var today = moment().format('YYYY-MM-DD');
            var dailyForecasts = [];
            var seenDates = {};
            for (var j = 0; j < forecastData.list.length && dailyForecasts.length < 5; j++) {
                var entry = forecastData.list[j];
                var dateStr = entry.dt_txt.split(' ')[0];
                if (dateStr > today && !seenDates[dateStr]) {
                    seenDates[dateStr] = true;
                    dailyForecasts.push(entry);
                }
            }

            $('.forecast h2.mb-4').text('5-Day Forecast');
            $('.card').addClass('bg-success');
            for (var i = 0; i < dailyForecasts.length; i++) {
                var forecastTemp = parseFloat(dailyForecasts[i].main.temp).toFixed(0);
                var forecastHumidity = dailyForecasts[i].main.humidity;
                var forecastIcon = dailyForecasts[i].weather[0].icon;
                var forecastContainer = $('.card')[i];
                $(forecastContainer).find('.temperature').text(forecastTemp + 'ºF');
                $(forecastContainer).find('.humidity').text('Humidity: ' + forecastHumidity + '%');
                $(forecastContainer).find('img.card-image').attr('src', 'https://openweathermap.org/img/wn/' + forecastIcon + '@2x.png');
            }

            showTodaysDate();
            showForecastDates();
        })
        .catch(function() {
            errorCitySearch.show();
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