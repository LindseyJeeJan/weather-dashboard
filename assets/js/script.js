var btnSearch = $('#btn-search');
var searchInput = $('#search');
var cityList = $('#city-list');
var cityName = $('#cityName');
var todaysDate = $('#todaysDate');
var temperature = $('#temperature');
var humidity = $('#humidity');
var windSpeed = $('#wind-speed');
var uvIndex = $('#uv-index .badge');
var weatherIcon = $('#h2-card-image');
var errorMessage = $('#error');

var latLong = [];

// Click event to capture when user clicks search
btnSearch.on('click', function(event) {
    event.preventDefault();
    errorMessage.hide();
    var searchLocation = searchInput.val().trim();
    if (searchLocation === ""){
        // return if search empty
        errorMessage.show();
        return;
    }
    // function to retrieve the longitude and latitude of the city searched
    var coordinates = convertToLongLat(searchLocation);
});

// Click event to capture user clicking on a city
cityList.on('click', 'li', function(event) {
    var listLocation = $(this).attr('data-location');

    $('li').removeClass('bg-primary');
    $(this).addClass('bg-primary');
    // function to retrieve the longitude and latitude of the city clicked
    convertToLongLat(listLocation);
});

// Convert the city name to long and lat for the Open API
function convertToLongLat(cityName){
    var requestUrl = 'http://api.openweathermap.org/geo/1.0/direct?q=' +
    cityName + '&limit=5&appid=ce4222a2bf38275175e19449b4ee48a5';
    fetch(requestUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // store longitude and latitude in array
            latLong.push(data[0].lat);
            latLong.push(data[0].lon);
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
      return response.json();
    })
    .then(function (data) {
        // Write information to the main weather card with data from API
        console.log(data);
        cityName.text(data.timezone);
        humidity.text(data.current.humidity);
        windSpeed.text(data.current.wind_speed);
        uvIndex.text(data.current.uvi);

        var icon = data.current.weather[0].icon;
        var iconLocation = ("http://openweathermap.org/img/wn/" + icon +"@2x.png");
        weatherIcon.attr('src', iconLocation);
        
       // Get the UV index and display the appropriate badge color according to the conditions
        var uvindex = data.current.uvi;
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

        // Display temperature with one decimal point
        var temp = data.current.temp;
        temp = parseFloat(temp).toFixed(1);
        temperature.text(temp);

        // TODO: determine if own icon will be used or pull one from the API
        var condition = data.current.weather[0].main;
        console.log('condition', condition);

        // Store the array of forecasts
        var forecasts = data.daily;
        var counter = 0;
        // Loop through the forecast array. For the first 5, write the data to the bootstrap cards in the UI. Add temp, humidity and the icon from the forecast
        for (var i = 0; i < 5; i++) {
            // store the forecast data 
            var forecastTemp = forecasts[i].temp.day;
            forecastTemp = parseFloat(forecastTemp).toFixed(1);
            var forecastHumidity = forecasts[i].humidity;
            var forecastIcon = forecasts[i].weather[0].icon;
            var forecastIconLocation = ("http://openweathermap.org/img/wn/" + forecastIcon +"@2x.png");
            
            // write the forecast data to the page
            var forecastContainer = $('.card')[counter];
            $(forecastContainer).find('.temperature').text(forecastTemp);
            $(forecastContainer).find('.humidity').text(forecastHumidity);
            $(forecastContainer).find('.humidity').text(forecastHumidity);
            $(forecastContainer).find('img.card-image').attr('src', forecastIconLocation);

            // increment counter for looping
            counter++;
        }
        // display these values from moment
        showForecastDates();
    });
}

// display the date in the main weather card
function showTodaysDate(){
    var dateDisplay = moment().format('MM/DD/YYYY');
    todaysDate.text(dateDisplay);
}

// display the 5-day forecast dates 
function showForecastDates() {
    var number = 1;
    $('h5.card-title').each(function(){
        var date = moment().format('MM/DD/YYYY');
        date = moment(date, 'MM/DD/YYYY').add(number, 'days').format('MM/DD/YYYY');
        $(this).text(date);
        number = number + 1;
    })
}

function init() {
   showTodaysDate();
}

init();