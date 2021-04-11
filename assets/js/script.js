var btnSearch = $('#btn-search');
var cityList = $('#city-list');

// Click event to capture when user clicks search
btnSearch.on('click', function(event) {
    console.log('clicked search');
});

// Click event to capture user clicking on a city
cityList.on('click', 'li', function(event) {
    var city = $(this).attr('data-location');
    console.log(city);
});