function stockApi(stockListRaw) {

  // Properties
  var maxColumns = 5;
  var innerDivTitleHeight = 15;
  var innerDivListItemHeight = 4.2;
  var popUpHeight = 200;
  var popUpWidth = 500;

  // State
  var stockObjModel = {};

  function getStockObjModel() {
    return stockObjModel;
  }

  /* Create an object model with the sector at the outer
     level, industry and the next level and the list of
     stocks at the lowest level */
  function createObjectModelFromRawData() {
    var stockData = {};
    for (var i = 1; i < stockListRaw.length; i++) {

      // Add the sector if not already there
      var sector = stockListRaw[i][3];
      var existingSector = stockData[sector];
      if (existingSector === undefined || existingSector === null) {
        // Add the sector
        stockData[sector] = {};
      }
      var mySector = stockData[sector];

      // Add the industry if not already there
      var industry = stockListRaw[i][4];

      var existingIndustry = mySector[industry]
      if (existingIndustry === undefined || existingIndustry === null) {
        // Add the sector
        stockData[sector][industry] = {};
      }

      // Add the stock
      stockName = stockListRaw[i][1];
      stockTicker = stockListRaw[i][0];
      stockData[sector][industry][stockName] = {
        "stockTicker": stockTicker
      };
    }

    stockObjModel = stockData;
  };

  /* Use the object model data to create a GUI object model
     which encapsulates the layout. The GUI object model involves
     2 layers of 2 dimensional arrays, which reflect the gui div
     elements. The 2 dimensions represent the rows and columns of
     the divs used in the dom. The outer 2 dim array contains the list of
     sectors, the inner 2 dim array contains the list of industries.
     Inside the inner objects is the list of stocks present in
     the sector. */
  function createGUIObjectModel(stockData) {
    var guiObjModel = [];
    var sectors = Object.getOwnPropertyNames(stockData);
    var currentCol = 0;
    var currentRow = 0;
    guiObjModel.push([]);
    for (var i = 0; i < sectors.length; i++) {
      var sectorName = sectors[i];
      var sectorObj = stockData[sectorName];
      if (currentCol >= maxColumns) {
        currentCol = 0;
        currentRow++;
        guiObjModel.push([]);
      }
      guiObjModel[currentRow][currentCol] = buildSectorObjModel(sectorName, sectorObj);
      currentCol++;
    }
    return guiObjModel;
  };

  function buildSectorObjModel(sector, sectorData) {
    var sectorObj = {
      "sector": sector,
      "industries": []
    };

    var guiDom = sectorObj.industries;
    var industries = Object.getOwnPropertyNames(sectorData);
    var currentCol = 0;
    var currentRow = 0;
    guiDom.push([]);
    for (var i = 0; i < industries.length; i++) {
      var industryName = industries[i];
      var industryObj = sectorData[industries[i]];
      if (currentCol >= maxColumns) {
        currentCol = 0;
        currentRow++;
        guiDom.push([]);
      }
      guiDom[currentRow][currentCol] =
        {
          "industry": industryName,
          "stocks": industryObj
        };
      currentCol++;
    }
    return sectorObj;
  };

  /* Renders the GUI Object model into the dom */
  function render(guiObjModel) {    
    if ((guiObjModel !== undefined) && (guiObjModel.length > 0)) {
      var numRow = guiObjModel.length;

      var maxCol = guiObjModel[0].length;
      
      // Set the width of each outer div based on the
      // maximum number of columns in the dataset
      var widthPerc = Math.floor(100 / maxCol - 2);

      // create sector divs and then delegate for inner objects (industries)
      for (var i = 0; i < numRow; i++) {
        var sectorRow = $('<div></div>').addClass('grid-row');

        var numCols = guiObjModel[i].length;
        for (var j = 0; j < numCols; j++) {
          var sectorId = "sector" + "-" + i + "-" + j;
          var sectorPill = $('<div></div>').attr('id', sectorId).addClass('outer center-align ' 
          + getTransitionOrigin(i, j, numRow, maxCol));
          var sectorTitle = $('<div></div>').text(guiObjModel[i][j].sector).addClass('outer-title valign');
          sectorPill.append(sectorTitle);
          renderIndustries(sectorPill, guiObjModel[i][j].industries);
          sectorRow.append(sectorPill);
        }
        $("#sectors").append(sectorRow);
      }
      $(".outer").css("width", widthPerc + "%");
    }
        
    // Global rendering code
    initializeChartPopover();
  }
  
  function renderIndustries(sectorPill, guiDom) {
    var sectorId = sectorPill.attr('id');
    if ((guiDom !== undefined) && (guiDom.length > 0)) {
      var numRow = guiDom.length;
      var maxCol = guiDom[0].length;
      // Set the width of each outer div based on the
      // maximum number of columns in the dataset
      var widthPerc = Math.floor(100 / maxCol - 2);
      if (widthPerc > 30) {
        widthPerc = 30;
      }
      var heightPx = Math.floor(180 / numRow - 2);
      if (heightPx > 50) {
        heightPx = 50;
      }

      // Loop over each Industry row
      for (var i = 0; i < numRow; i++) {
        var numCols = guiDom[i].length;
        var industryRow = $('<div></div>').addClass('grid-row');
        
        // Loop over each Industry column in this row
        for (var j = 0; j < numCols; j++) {
          var industryId = sectorId + "industry" + "-" + i + "-" + j;
          var industryPill = $('<div></div>').attr('id', industryId).addClass('inner ' + getTransitionOrigin(i, j, numRow, maxCol));
          var industryName = guiDom[i][j].industry;
          var industryTitle = $('<div></div>').addClass('inner-title valign').text(industryName);
          industryPill.append(industryTitle);
          
          var stockListLength = renderStocks(industryPill, guiDom[i][j].stocks);
          
          // If we hover over the Industry Pill and the height
          // isn't big enough to display all of the stocks,
          // make the height bigger
          var innerDivHeight = Math.floor(innerDivTitleHeight +
               (stockListLength * innerDivListItemHeight));
               
          if (innerDivHeight > heightPx) {
            
            // Create a closure to handle dynamic height
            var newHeightFunction = (function(divHeight){
              return function() {
                $(this).css("height", divHeight + "px");
              }
            })(innerDivHeight);
            
            // Bind the functions to make the height bigger on
            // hover and back to normal on non-hover to the
            // DOM element (industryPill)
            industryPill.hover(newHeightFunction,
            function () {
              $(this).css('height', heightPx + "px");
            });
          }
          industryRow.append(industryPill);
        }
        sectorPill.append(industryRow);
      }

      // Set the width for the outer divs
      sectorPill.find('.inner').css('width', widthPerc + "%").css("height", heightPx + "px");
    }
  }

  // Render the list of stocks in this industry
  function renderStocks(industryPill, stocks) {
    industryId = industryPill.attr('id');
    //console.log(stocks);
    var stockListLength = 0;
    if (stocks !== undefined) {
      stockList = Object.getOwnPropertyNames(stocks);
      stockListLength = stockList.length;
      var htmlStockListDiv = $('<div></div').addClass('stock-list left-align');
      var htmlStockList = $('<ul></ul>').addClass('list-unstyled');
 
      for (var i = 0; i < stockListLength; i++) {
        var stockTicker = stocks[stockList[i]].stockTicker;
        var stockId = industryId + "-" + stockTicker;
        var htmlStock = $('<li>').addClass("no-wrap chart-popover")
                                 .attr('data-popover', stockTicker)
                                 .attr('id', stockId)
                                 .text(stockList[i]);
        htmlStockList.append(htmlStock);
      }
      
      htmlStockListDiv.append(htmlStockList);
      industryPill.append(htmlStockListDiv);
    }
    return stockListLength;
  }

  // Create the popover with the chart
  function initializeChartPopover() {
    hiConfig = {
      sensitivity: 9,
      interval: 100,
      timeout: 100,
      over: function (e) {
        var stockTicker = $(this).attr("data-popover");
        var viewPortHeight = $(window).height();
        var viewPortWidth = $(window).width();
        var xOffset = e.pageX;
        var yOffset = e.pageY;

        // Reposition chart so it's always
        // on the screen but slightly away
        // from the cursor
        if (yOffset > viewPortHeight / 2) {
          yOffset -= popUpHeight + 20;
        } else {
          yOffset += 20;
        }
        if (xOffset > viewPortWidth / 2) {
          xOffset -= popUpWidth + 20;
        } else {
          xOffset += 20;
        }

        var smallChartDiv = $('<div/>',
          {
            'style': "top:" + yOffset + "px; left: " + xOffset + "px;" + "height:" + (popUpHeight + 20) + "px; width:" + popUpWidth + "px;",
            'class': 'small-chart',
            'id' : 'popup-chart-div'
          });

        var smallChart = $('<img/>',
          {
            'style': "height:" + popUpHeight + "px; width:" + popUpWidth + "px;",
            //'class': 'small-chart',
            src: "http://www.barchart.com/imagechart.php?sym=" + stockTicker + "&notitle=false&width=" + popUpWidth
            + "&height=" + popUpHeight + "&type=basic&plot=CANDLE"
          });
          
        var smallChartContainer = $('<span/>')
                                    .addClass("footer")
                                    .text("Charts provided by ")
                                    .append($('<a\>')
                                    .attr('href', "http://bigcharts.com").text('BigCharts.com'));
                                    
        // Add the chart to the DOM
        smallChartContainer.prepend(smallChart);
        smallChartDiv.append(smallChartContainer);
        $(".outer-container").after(smallChartDiv);
      },
      out: function () {
        $('.small-chart').remove();
      }
    }
    $(".chart-popover").hoverIntent(hiConfig)
  }
  
  function getTransitionOrigin(row, col, maxRow, maxCol) {
    if ((row === 0) && (col === 0)) {
      return "top-left-origin";
    } else if ((row === 0) && (col === maxCol - 1)) {
      return "top-right-origin";
    } else if (row === 0) {
      return "top-origin";
    } else if ((row === maxRow - 1) && (col === 0)) {
      return "bottom-left-origin";
    } else if ((row === maxRow - 1) && (col === maxCol - 1)) {
      return "bottom-right-origin";
    } else if (row === maxRow - 1) {
      return "bottom-origin";
    } else if (col === 0) {
      return "left-origin";
    } else if (col === maxCol - 1) {
      return "right-origin";
    }
    return "center-origin";
  }
    
  // Return public methods
  return {
    createObjectModelFromRawData: createObjectModelFromRawData,
    getStockObjModel: getStockObjModel,
    createGUIObjectModel: createGUIObjectModel,
    render: render
  };
};

/*
 * The main runner
 */
(function main() {
  
  // Initialize the stockApi object with the raw data S&P 500 data
  // from wikipedia
  var sAndPStocks = stockApi(stockDataRaw);

  // Create the stock object model from the raw data
  sAndPStocks.createObjectModelFromRawData();
  var stockObjModel = sAndPStocks.getStockObjModel();

  // Create the GUI object model from the stock object model
  var guiObjModel = sAndPStocks.createGUIObjectModel(stockObjModel);

  // Render the GUI object model into the DOM
  sAndPStocks.render(guiObjModel);
}());
