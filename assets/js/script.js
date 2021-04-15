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

// Click event to capture when user clicks search
btnSearch.on('click', function(event) {
    event.preventDefault();
    var location = searchInput.val().trim();
    if (location === ""){
        // return if search empty
        return;
    }
    getApi(location); 
});

// Click event to capture user clicking on a city
cityList.on('click', 'li', function(event) {
    var location = $(this).attr('data-location');
    getApi(location);
});

// Get data from the Open Weather API; excluding some data and in imperial format
function getApi(location) {
  var requestUrl = 'https://api.openweathermap.org/data/2.5/onecall?lat=33.441792&lon=-94.037689&exclude=minutely,hourly,alerts&units=imperial&appid=ce4222a2bf38275175e19449b4ee48a5';
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
        
        // If the UV index is less than or equal to 2, it is safe, green
        var uvindex = data.current.uvi;
        if (uvindex <= 2){
            uvIndex.addClass('badge-success');
        } else if (uvindex <= 7) {
            // Between 3-7, it is moderate, yellow
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
        // Loop through the forecast array. For the first 5, write the data to the bootstrap cards in the UI.
        for (var i = 0; i < 5; i++) {
            var forecastTemp = forecasts[i].temp.day;
            forecastTemp = parseFloat(forecastTemp).toFixed(1);
            var forecastHumidity = forecasts[i].humidity;
            var tempContainer = $('.card')[counter];
            var humidityContainer = $('.card')[counter];
            $(tempContainer).find('.temperature').text(forecastTemp);
            $(humidityContainer).find('.humidity').text(forecastHumidity);
            counter++
        }
        // display these values from moment
        showForecastDates();
        showTodaysDate();
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
   
}

init();