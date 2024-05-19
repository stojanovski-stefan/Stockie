$(document).ready(function () {
  popDrop();
  $("#resultsTitle").hide();
  $("#searchButton").click(function (form) {
    form.preventDefault(); // Prevent the form from submitting
    getStocks();
  });
});

const URL = "https://api.polygon.io/v3/reference/tickers/";
const mattApiKey = "?apiKey=uRevdCw0PEFsfZeS0nT8_cuH2RlWW3sM";
const stefanApiKey = "?apiKey=VOj7tASWafJNnUTjG34sLBE5VIqqP6zB";

function toggleModal() {
  $(".modal-container").load("./errorModal.html", function () {
    $("#errorModal").modal("show");
  });
}

/**
 * Gets a searched stock's information.
 */
function getStocks() {
  a = $.ajax({
    url: URL + $("#searchBar").val().toUpperCase() + mattApiKey,
    type: "GET",
    contentType: "application/json",
  })
    .done(function (data) {
      console.log(data.results);
      if (data.status === "OK") {
        $("#resultsTitle").show();
        $("#searchResults").load("./stockCard.html", function () {
          $("#stockName").html(data.results.name);
          $("#stockTicker").html(data.results.ticker);
          $("#stockCard").attr(
            "data-bs-target",
            `#${data.results.ticker}-modal`
          );
          $("#modal").attr("id", `${data.results.ticker}-modal`);
          $("#modalLabel").html(data.results.name);
          $("#aboutSectionName").html(data.results.ticker);
          $("#aboutSection").html(data.results.description);
          $("#address").append(
            `${data.results.address.city},${data.results.address.state}`
          );
          $("#employees").append(data.results.total_employees);
        });
      } else {
        $("#signUpErrorMessage").show();
        console.log("Error: Stock not found.");
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
      toggleModal();
    });
}

var current_mic;
const exchangeMap = new Map();
const stockMap = new Map();

function popDrop() {
  a = $.ajax({
    url: "https://api.polygon.io/v3/reference/exchanges?asset_class=stocks&apiKey=uRevdCw0PEFsfZeS0nT8_cuH2RlWW3sM",
    type: "GET",
    contentType: "application/json",
  })
    .done(function (data) {
      if (data.status == "OK") {
        for (let i of data.results) {
          exchangeMap.set(i.name, i.operating_mic);
        }
        for (let i of data.results) {
          $("#exchangeDropdown").append(`<option>${i.name}</option>`);
        }
      } else {
        $("#logoutErrorMessage").show();
        console.log(data);
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
      toggleModal();
    });
}

function popNextDrop(exchange) {
  $("#exchangeDropdown2").html("<option>Select</option>");
  a = $.ajax({
    url: "https://api.polygon.io/v3/reference/tickers",
    type: "GET",
    contentType: "application/json",
    data: {
      exchange: exchangeMap.get(exchange),
      active: true,
      limit: 1000,
      apiKey: "VOj7tASWafJNnUTjG34sLBE5VIqqP6zB",
    },
  })
    .done(function (data) {
      if (data.status == "OK") {
        for (let i of data.results) {
          stockMap.set(i.name, i.ticker);
        }

        for (let i of data.results) {
          $("#exchangeDropdown2").append(`<option>${i.name}</option>`);
        }
      } else {
        $("#logoutErrorMessage").show();
        console.log(data);
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
      toggleModal();
    });
}

function getTickerDetails(name) {
  console.log(stockMap);
  let ticker = stockMap.get(name);
  a = $.ajax({
    url: URL + ticker + mattApiKey,
    type: "GET",
    contentType: "application/json",
  })
    .done(function (data) {
      let datesArray = getDates(7);
      getAggregateBars(ticker, datesArray[0], datesArray[1]);
      getNews(ticker);

      $("#stockInfoSection").load("./displayStock.html", function () {
        console.log(data.results.ticker);
        $("#aboutSectionName").html(name);
        $("#aboutSectionTicker").html(data.results.ticker);
        $("#aboutSection").html(data.results.description);
        $("#address").html(
          `${data.results.address.city}, ${data.results.address.state}`
        );
        $("#employees").html(data.results.total_employees);
        $("#tickerListing").html(data.results.ticker);
        $("#mktCap").html(data.results.market_cap);
        $("#favoriteButton").click(function () {
          console.log("Favorite button clicked");
          addFavorite(sessionStorage.getItem("username"), ticker, name);
        });
      });
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
      toggleModal();
    });
}

function getAggregateBars(ticker, fromDate, toDate) {
  a = $.ajax({
    url: `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=VOj7tASWafJNnUTjG34sLBE5VIqqP6zB`,
    type: "GET",
    contentType: "application/json",
  })
    .done(function (data) {
      let percentChange =
        ((data.results[4].c - data.results[4].o) / data.results[4].c) * 100;
      console.log(data);
      $("#openPrice").html(data.results[4].o);
      $("#volume").html(data.results[4].v);
      $("#closePrice").html(data.results[4].c);
      $("#highPrice").html(data.results[4].h);
      $("#lowPrice").html(data.results[4].l);
      $("#VWAP").html(data.results[4].vw);
      $("#percent").html(Math.abs(percentChange));
      if (percentChange < 0) {
        $("#percent").attr("class", "text-danger");
      } else {
        $("#percent").attr("class", "text-success");
      }

      let closings = [];
      for (let val of data.results) {
        closings.push(val.c);
      }
      console.log(closings);

      let lineColor = "";
      if (closings[closings.length - 1] >= closings[0]) {
        lineColor = "#4e6c50";
      } else {
        lineColor = "red";
      }
      let dates = getDates(7);

      const chartData = {
        labels: [1, 2, 3, 4, 5],
        datasets: [
          {
            label: "price",
            data: closings,
            fill: false,
            borderColor: lineColor,
            tension: 0.1,
          },
        ],
      };
      const config = {
        type: "line",
        data: chartData,
      };

      new Chart($("#chart"), config);
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
      toggleModal();
    });
}

function getDates(daysAgo) {
  let endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);

  let startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  return [formatDate(startDate), formatDate(endDate)];
}

function formatDate(date) {
  let year = date.getFullYear();
  let month = `0${date.getMonth() + 1}`.slice(-2);
  let day = `0${date.getDate()}`.slice(-2);

  return `${year}-${month}-${day}`;
}

function getNews(ticker) {
  a = $.ajax({
    url: `https://api.polygon.io/v2/reference/news?ticker=${ticker}&limit=5&apiKey=VOj7tASWafJNnUTjG34sLBE5VIqqP6zB`,
    type: "GET",
    contentType: "application/json",
  })
    .done(function (data) {
      for (let element of data.results) {
        $("#newsCardContainer").append(`
        <div class="col">
          <div id="${
            element.id
          }" class="card h-100" style="background-color: #4e6c50">
            <img src="${element.image_url}" class="card-img-top" alt="${
          element.title
        } picture" />
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${element.title}</h5>
              <p class="card-text">
                ${element.publisher.name}
              </p>
              <div class="mt-auto">
                <button style="background-color:#aa8b56; border-color: #aa8b56;" type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#${
                  element.id
                }-modal">
                  Read More
                </button>
              </div>
            </div>
            <div class="card-footer" style="background-color: #395144">
              <small style="color: #f0ebce">Published: ${element.published_utc.substring(
                0,
                10
              )}</small>
            </div>
          </div>
        </div>
        <div class="modal fade text-dark" id="${
          element.id
        }-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${element.title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <h6>Description</h6>
                ${element.description}
                <table class="table table-borderless">
                  <tbody>
                    <tr>
                      <td><span class="text-muted">Publisher</span><br>${
                        element.publisher.name
                      }</td>
                      <td><span class="text-muted">Author</span><br>${
                        element.author
                      }</td>
                  </tbody>
                </table>
              </div>
              <div class="modal-footer">
                <a href="${
                  element.article_url
                }" target="_blank" class="btn btn-secondary">
                <svg style="margin-top: -4px" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
                  <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
                </svg> 
                Article
                </a>
              </div>
            </div>
          </div>
        </div>
        `);
      }
    })
    .fail(function (error) {
      toggleModal();
    });
}

function addFavorite(username, ticker, name) {
  a = $.ajax({
    url: "../final.php/addFavorite",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
      ticker: ticker,
      name: name,
    },
  })
    .done(function (data) {
      if (data.status == 0) {
        console.log(`${ticker} added to favorites`);
        log(username, "Added To Favorites", ticker, name);
      }
    })
    .fail(function (error) {
      console.log("error", error.statusText);
      toggleModal();
    });
}

function log(username, action, ticker, name) {
  a = $.ajax({
    url: "../final.php/log",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
      action: action,
      ticker: ticker,
      name: name,
    },
  })
    .done(function (data) {
      console.log(data.message);
    })
    .fail(function (error) {
      console.log("error", error.statusText);
      toggleModal();
    });
}

function removeFavorite(username, ticker, name) {
  a = $.ajax({
    url: "../final.php/removeFavorite",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
      ticker: ticker,
    },
  })
    .done(function (data) {
      console.log(`${ticker} removed from favorites`);
      $(`#${ticker}`).hide();
      log(username, "Removed From Favorites", ticker, name);
    })
    .fail(function (error) {
      console.log("error", error.statusText);
      toggleModal();
    });
}

function getFavorites(username) {
  a = $.ajax({
    url: "../final.php/getFavorites",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
    },
  })
    .done(function (data) {
      if (data.status == 0) {
        if (stockMap.size == 0) {
          for (let i of data.data) {
            stockMap.set(i.stock_name, i.ticker);
          }
        }
        for (let i of data.data) {
          $("#favorites").append(
            `<div class="card text-dark mb-3" id="${
              i.ticker
            }" style="width: 18rem;">
                <div class="card-body">
                  <button type="button" class="btn-close position-absolute top-0 end-0 m-2" aria-label="Close" onclick="removeFavorite('${sessionStorage.getItem(
                    "username"
                  )}', '${i.ticker}', '${i.stock_name}')"></button>
                  <h5 class="card-title pe-3">${i.stock_name}</h5>
                  <p class="card-text">
                    <span class="text-muted">Ticker symbol: </span>${
                      i.ticker
                    }</p>
                  <button class="btn btn-primary" onclick="getTickerDetails('${
                    i.stock_name
                  }')">View details</button>
                </div>
              </div>`
          );
          console.log(data);
        }
      } else {
        console.log("Error");
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
    });
}

function getLogDates(username) {
  a = $.ajax({
    url: "../final.php/getLogDates",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
    },
  })
    .done(function (data) {
      $("#dateDropdown").html("<option>Select</option>");
      for (let date of data.dates) {
        $("#dateDropdown").append(
          `<option value="${date.date}">${date.date}</option>`
        );
      }
    })
    .fail();
}

function getLog(username, date) {
  a = $.ajax({
    url: "../final.php/getLog",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
      date: date,
    },
  })
    .done(function (log) {
      console.log(date);
      console.log(username);
      $("#cardContainer").html("");
      $("#dateHeader").html(date);
      for (let entry of log.data) {
        if (entry.action == "Added To Favorites") {
          $("#cardContainer").append(`
          <div class="card mb-2 bg-dark" style="border: 2px #4e6c50 solid">
              <div
                class="card-body d-flex align-items-center justify-content-between"
              >
                <div class="d-flex align-items-center">
                  <i style="font-size: 20px" class="bi bi-bookmark-check"></i>
                  <h5 class="card-title mb-0 mx-2">Added To Favorites:</h5>
                  <span style="color: #f0ebce; margin-top: 1px">
                    ${entry.name} (${entry.ticker})
                  </span>
                </div>
                <span>${entry.time}</span>
              </div>
            </div>
          `);
        } else {
          $("#cardContainer").append(`
            <div
              class="card mb-2 bg-dark"
              style="border: 2px rgb(196, 44, 44) solid"
            >
              <div
                class="card-body d-flex align-items-center justify-content-between"
              >
                <div class="d-flex align-items-center">
                  <i style="font-size: 20px" class="bi bi-trash3"></i>
                  <h5 class="card-title mb-0 mx-2">Removed From Favorites:</h5>
                  <span style="color: #f0ebce; margin-top: 1px">
                    ${entry.name} (${entry.ticker})
                  </span>
                </div>
                <span>${entry.time}</span>
              </div>
            </div>
          `);
        }
        getFavoritesOnDate(username, date);
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
    });
}

function getFavoritesOnDate(username, date) {
  a = $.ajax({
    url: "../final.php/getFavoritesOnDate",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
      date: date,
    },
  })
    .done(function (favorites) {
      $("#favoritesContainer").html("");
      for (let element of favorites.data) {
        $("#favoritesContainer").append(`
            <div class="card mb-2 bg-dark" style="border: 2px #aa8b56 solid">
              <div
                class="card-body d-flex align-items-center justify-content-between"
              >
                <div class="d-flex align-items-center">
                  <h5 id="favoritesName" class="card-title mb-0 mx-2">
                    ${element.stock_name}
                  </h5>
                  <span
                    id="favoritesTicker"
                    style="color: #f0ebce; margin-top: 1px"
                  >
                    ${element.ticker}
                  </span>
                </div>
                <span id="time">${element.date} ${element.time}</span>
              </div>
            </div>`);
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
    });
}

