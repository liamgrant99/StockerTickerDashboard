//Parsing local storage. Tickers are stored in browser, not in a file on the server. 
var tickers = JSON.parse(localStorage.getItem('tickers')) || [] 
var lastPrices = {}

//How often we will reload in seconds
const refreshRate = 30
var counter = refreshRate

function beginUpdateCycle(){
    refreshPrices()
    //Set interval function runs this function every Timeout number of milliseconds
    
    setInterval(handler = function(){
        counter--
        //Getting the counter element from the html document off of id, then setting the text
        $('#counter').text(counter)

        if (counter <= 0){
            refreshPrices()
            counter = refreshRate
        }
    }, timeOut=1000)
}

//Now we are requesting the document. .ready refers to when the document is ready - this will run
$(document).ready(function(){
    //we loaded tickers above, now we are iterating through and adding them to the grid
    tickers.forEach(function(ticker){
        addTickerToGrid(ticker)
    })

    //Refresh prices when we load the page
    refreshPrices()

    //When ticker form is submitted - e is the even inputted. 
    $('#create-ticker-form').submit(function (e) {
        //This prevents the default functionality of submitting a form from happening
        e.preventDefault()
        //What we will do instead is get the value of the submitted content
        var newTicker = $('#new-ticker').val().toUpperCase()
        //If ticker is not already part of tickers, add it to the list and 
        if (!tickers.includes(newTicker)){
            tickers.push(newTicker)
            //After adding it to the list we need to update the local storage to include the new ticker. 
            localStorage.setItem('tickers', JSON.stringify(tickers))
            addTickerToGrid(newTicker)
        }   
        //Clear the ticker with an empty value
        $('#new-ticker').val('')
        //Refresh the prices after adding a new ticker
        refreshPrices()
    })

    //We will have individual ticker boxes in the grid. When the remove button is pressed, this will remove the ticker box
    $('#tickers-grid').on('click', '.remove-btn', function(){
        //Retreive ticker that needs to be removed. 
        var tickerToRemove = $(this).data('ticker')
        //For every ticker in tickers, it is allowed to stay in the list if it is not the ticker we are removing. 
        tickers = tickers.filter(t => t !== tickerToRemove)
        //Update the storage. 
        localStorage.setItem('tickers', JSON.stringify(tickers))
        $(`#${tickerToRemove}`).remove()
    })

    $('#tickers-grid').on('click', '.toggle-graph-btn', function (){
        var ticker = $(this).data('ticker')

        //If chart exists, remove it from html, other wise add chart to html and refresh screen. 
        if ($(`#${ticker}-chart-canvas`).length!==0){
            $(`#${ticker}-chart-canvas`).remove()
        }else{
            $(`#${ticker}-chart`).append(`<canvas id="${ticker}-chart-canvas" width="100" height="100"></canvas>`)
            refreshPrices()
        }

    })

    beginUpdateCycle()
})

function addTickerToGrid(ticker){
    //Retreives the ticker grid and adds html for the ticker box. 
    //We have data ticker since we are using a class. data-ticker allows us to know which ticker we are using. 
    $('#tickers-grid').append(`<div id="${ticker}" class="stock-box"><h2>${ticker}</h2><p id="${ticker}-price"></p><p id="${ticker}-pct"></p><button class="remove-btn" data-ticker="${ticker}">Remove</button><button class="toggle-graph-btn" data-ticker="${ticker}">Toggle Graph</button><div id = "${ticker}-chart" style = "position: relative;"><canvas id="${ticker}-chart-canvas" width="100" height="100"></canvas></div></div>`)
                                                                                                                    //The data ticker here is the what we targeted in the remove ticker function    
                                                                                                                    //Multiple remove buttons, so we use a class instead of an id.     
                                                                                                                }

// Add ticker will take ticker as input, request the api info, and then add the ticker to the grid. 
function refreshPrices(){
    tickers.forEach(function (ticker){
        //Sends post request to backend
        $.ajax({
            url: '/retrieve_stock_data',
            type: 'POST',
            data: JSON.stringify({'ticker':ticker}), 
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json',
            //Defining what happens if request is a success. Data is the returned. 
            success: function (data) {

                var percentDelta = ((data.currentPrice - data.openPrice) / data.openPrice) * 100
                //Color class will be used to determine what color shade our text will be
                var colorClass 
                if (percentDelta <= -2){
                    colorClass = 'dark-red'
                }else if (percentDelta < 0){
                    colorClass = 'red'
                }else if (percentDelta == 0){
                    colorClass = 'gray'
                }else if (percentDelta <= 2){
                    colorClass = 'green'
                }else{
                    colorClass = 'dark-green'
                }
                
                //Setting the ticker price to the current 
                $(`#${ticker}-price`).text(`$${data.currentPrice.toFixed(2)}`)
                //First dollar sign in text above is for the actual dollar symbol we will see in the text stock amount
                //Set the percent changed 
                $(`#${ticker}-pct`).text(`${percentDelta.toFixed(2)}%`)
                
                //We want to add classes, so we want to change color 
                //Removing every class that ticker price could potentionally have currently so we can change the color to what color it currently is
                $(`#${ticker}-price`).removeClass('dark-red red gray green dark-green').addClass(colorClass)
                $(`#${ticker}-pct`).removeClass('dark-red red gray green dark-green').addClass(colorClass)

                //Compare the current price to previous refresh price for animation when stock is refreshed. 
                var flashClass
                if(lastPrices[ticker] > data.currentPrice){
                    flashClass = 'red-flash'
                } else if(lastPrices[ticker] < data.currentPrice){
                    flashClass = 'green-flash'
                }else{
                    flashClass = 'gray-flash'
                }
                
                //If the canvas html box exists on the page, then refresh the graph.
                if ($(`#${ticker}-chart-canvas`).length!==0){
                    $(`#${ticker}-chart-canvas`).remove()
                    $(`#${ticker}-chart`).append(`<canvas id="${ticker}-chart-canvas" width="100" height="100"></canvas>`)
                    
                    //Returns the date of the corresponding index in the data. 
                    var label = data.df.map(function(e){
                        return e.date.toString();
                    })

                    //Returns the price of the corresponding index in the data. 
                    var chartData = data.df.map(function(e){
                        return e.price;
                    })

                    let start = data.df[0].price

                    //Sets the color of the line based on the first price in the chart versus the latest. 
                    let lineColor;
                    if (start>data.currentPrice){
                        lineColor = 'red'
                    }else if (start==data.currentPrice){
                        lineColor = 'gray'
                    }else{
                        lineColor = 'green'
                    }

                    //Creates chart using chart.js
                    let c = new Chart($(`#${ticker}-chart-canvas`), {
                        type: 'line',
                        data: {
                        labels: label,
                        datasets: [{
                            label: 'Price',
                            data: chartData,
                            borderWidth: 1,
                            backgroundColor: lineColor,
                            borderColor: lineColor
                        }]
                        },
                        options: {
                        plugins : { legend : {display : false}},
                        responsive: true,
                        scales: {
                            //We will not show x axis labels or lines. 
                            x: {
                              display: false,
                              title: {
                                display: true,
                                text: 'Day'
                              }
                            },
                            y: {
                            beginAtZero: false
                            }
                        }
                        }
                    });
                }

                //Update the last price to be the current price
                lastPrices[ticker] = data.currentPrice

                //Create the flash animation
                //We add the flash to the screen
                //Adding to entire ticker, not just individual classes. 
                $(`#${ticker}`).addClass(flashClass)
                //Keep flash for one second then remove
                setTimeout(function (){
                    $(`#${ticker}`).removeClass(flashClass)
                }, 1000)

            }
        })
    })
}