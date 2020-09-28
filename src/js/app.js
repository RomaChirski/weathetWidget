import '../css/style.css';

// Промисификация колбэка на получение геоданных
function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

class WeatherWidget {
  async getWeather(apiKey) {
    const apiUrl = "https://api.openweathermap.org/data/2.5/";
    const icons = {
      "01d": "icon-sun",
      "01n": "icon-moon",
      "02d": "icon-cloud-sun",
      "02n": "icon-cloud-moon",
      "03d": "icon-cloud",
      "03n": "icon-cloud",
      "04d": "icon-cloud",
      "04n": "icon-cloud",
      "09d": "icon-rain",
      "09n": "icon-rain",
      "10d": "icon-rain",
      "10n": "icon-rain",
      "11d": "icon-cloud-flash-alt",
      "11n": "icon-cloud-flash-alt",
      "13d": "icon-snow-heavy",
      "13n": "icon-snow-heavy",
      "50d": "icon-mist",
      "50n": "icon-mist",
    };
    const months = [
      "Января",
      "Февраля",
      "Марта",
      "Апреля",
      "Мая",
      "Июня",
      "Июля",
      "Августа",
      "Сентября",
      "Октября",
      "Ноября",
      "Декабря",
    ];
    const places = [625144, 627907, 629634, 627904, 620127, 625665];
    //Функция на получение погоды в настоящее время, обязательно принимает в качестве параметра объекта coords, если coords не пустой, то получает погоду по координатам, если пустой, то по cityId
    async function getTodayWeather(place) {
      let response;
      if (place === "geolocation") {
        const coords = await fetchCoordinates();
        response = await fetch(
          `${apiUrl}weather?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&lang=ru&appid=${apiKey}`
        );
      } else {
        response = await fetch(
          `${apiUrl}weather?id=${place}&units=metric&lang=ru&appid=${apiKey}`
        );
      }
      if (response.ok === false) {
        throw new Error("Please try again later");
      }
      const data = response.json();
      return data;
    }

    //Функция на получение погоды на три дня, обязательно принимает в качестве параметра объекта coords, если coords не пустой, то получает погоду по координатам, если пустой, то по cityId
    async function getThreeDaysForecast(place) {
      let response;
      let city;

      if (place === "geolocation") {
        const coords = await fetchCoordinates();
        response = await fetch(
          `${apiUrl}forecast?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&lang=ru&appid=${apiKey}`
        );
        city = city = await fetchCity(coords);
      } else {
        response = await fetch(
          `${apiUrl}forecast?id=${place}&units=metric&lang=ru&appid=${apiKey}`
        );
        city = document.querySelector(`option[value="${place}"]`).textContent;
      }
      if (response.ok === false) {
        throw new Error("Please try again later");
      }
      const forecast = await response.json();
      const filteredForecast = forecast.list
        .filter((item) => item.dt_txt.includes("12:00:00"))
        .slice(0, 3);
      console.log(filteredForecast);
      return { filteredForecast, city };
    }
    // // Функция, которая получает ip и координаты пользователя
    // async function getIp() {
    //   const response = await fetch(
    //     "https://geo.ipify.org/api/v1?apiKey=at_5g4l6fmvZmO9arYppWOdSpQXur8ba"
    //   );
    //   const data = await response.json();
    //   const { lat: latitude, lng: longitude } = data.location;
    //   return {
    //     latitude,
    //     longitude,
    //   };
    // }
    // Функция которая получает координаты пользователя
    async function fetchCoordinates() {
      const { coords } = await getCurrentPosition();
      const { latitude, longitude } = coords;
      return {
        latitude,
        longitude,
      };
    }

    async function fetchCity(coords) {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=ru`
      );
      const data = await response.json();
      const city = data.principalSubdivision;
      return city;
    }
    // Функция, которая получает данные с сервера, в type передается dataset кнопки на которую нажал пользователь
    // Все ошибки, которые случаются в try - автоматически попадают в catch
    async function getData(type, place) {
      try {
        const widget = document.querySelector(".weather-widget");
        if (!widget) {
          createWidget();
        }
        //Запускаем loader
        createLoader();
        // Получаем данные с сервера
        // сюда будут сохранены данные с сервера
        let forecast;
        // Если type = today, то вызывается функция, которая получает погоду на сегодня, если type = 'threeDays' то получает погоду на три дня
        switch (type) {
          case "today":
            forecast = await getTodayWeather(place);
            createWeatherInfoForToday(forecast);
            break;
          case "threeDays":
            forecast = await getThreeDaysForecast(place);
            createWeatherInfoForThreeDays(forecast);
            break;
        }
      } catch (err) {
        console.log(err);
        createErrorNotification(err);
      } finally {
        removeLoader();
      }
    }

    function createWidget() {
      const container = document.querySelector(".weather-container");
      let fragment = `
            <div class='weather-widget'>
              <form class='forecast-type' name='forecast-type'>
                <div>
                  <label><input name="type" type="radio" value="today" checked>Сегодня</label>
                  <label><input name="type" type="radio" value="threeDays">3 дня</label>
                </div>
                <select class='weather-select' name='place'>
                  <option value='geolocation'>Определить местоположение</option>
                  <option value='625144'>Минск</option>
                  <option value='627907'>Гомель</option>
                  <option value='629634'>Брест</option>
                  <option value='627904'>Гродно</option>
                  <option value='620127'>Витебск</option>
                  <option value='625665'>Могилев</option>
                </select>
              </form>
            </div>
            `;
      container.insertAdjacentHTML("afterbegin", fragment);
      const weatherForm = document.forms[0];
      console.dir(weatherForm);
      weatherForm.addEventListener("change", (e) => {
        const type = weatherForm.elements.type.value;
        const place = weatherForm.elements.place.value;
        getData(type, place);
      });
    }
    // Создает блок с погодой для одного дня
    function createWeatherInfoForToday(forecast) {
      let {
        name,
        main: { temp, humidity },
        weather,
      } = forecast;
      const widget = document.querySelector(".weather-widget");
      const description =
        weather[0].description[0].toUpperCase() +
        weather[0].description.slice(1);
      const icon = icons[weather[0].icon];

      let fragment = `
              <div class='weather-information'>
                <div class='weather-info-column'>
                  <h3>${name}</h3>
                  <p>Температура: ${Math.round(temp)}&degC</p>
                  <p>Влажность: ${humidity}%</p>
                </div>
                <div class='weather-info-column'>
                  <p class='weather-icon'><i class='${icon}'></i></p>
                  <p>${description}</p>
                </div>
              </div>
              `;
      widget.insertAdjacentHTML("beforeend", fragment);
    }
    // Создает loader
    function createLoader() {
      const container = document.querySelector(".weather-widget");
      const weatherInfoContainer =
        document.querySelector(".weather-information") ||
        document.querySelector(".weather-error-notification");
      if (weatherInfoContainer) {
        weatherInfoContainer.remove();
      }
      const fragment = `
            <div class="weather-loader">
              <i></i>
              <i></i>
              <i></i>
            </div >`;
      container.insertAdjacentHTML("beforeend", fragment);
    }
    // Удаляет loader
    function removeLoader() {
      const loader = document.querySelector(".weather-loader");
      loader.remove();
    }
    function createErrorNotification(error) {
      const widget = document.querySelector(".weather-widget");
      let fragment = `
              <div class='weather-error-notification'>
                <p>${error.message}</p>
              </div>
              `;
      widget.insertAdjacentHTML("beforeend", fragment);
    }
    // Функция, которая склоняет название города
    function convertCityName(cityName) {
      const vowelLetters = ["а", "и", "е", "ё", "о", "у", "ы", "э", "ю", "я"];
      const lastLetter = cityName[cityName.length - 1];
      if (!vowelLetters.includes(lastLetter)) {
        cityName = cityName + "e";
      }
      return cityName;
    }
    // Создает блок с погодой на три дня
    function createWeatherInfoForThreeDays(forecast) {
      const cityName = convertCityName(forecast.city);
      const container = document.querySelector(".weather-widget");
      let fragment = `
            <div class='weather-information'>
              <table class='table-forecast'>
                <caption>Прогноз погоды в ${cityName} на ближайшие дни</caption>
                <tbody>
                  <tr>
                    <th>Когда:</th>
                    <th>Температура:</th>
                    <th>Погода:</th>
                  </tr>
            `;
      function temlplateRow({ dt_txt, main: { temp, humidity }, weather }) {
        dt_txt = dt_txt.replace(/-/g, "/");
        const date = new Date(dt_txt);
        const numberOfMonth = date.getMonth();
        const month = months[numberOfMonth];
        const day = date.getDate();
        const icon = icons[weather[0].icon];
        fragment += `
              <tr>
                <td>${day} ${month}</td>
                <td>${Math.round(temp)}&degC</td>
                <td>${weather[0].description} <i class='${icon}'></i></td>
              </tr`;
      }
      forecast.filteredForecast.map((forecast) => temlplateRow(forecast));
      fragment += `</tbody></table></div>`;
      container.insertAdjacentHTML("beforeend", fragment);
    }
    getData("today", "geolocation");
  }
}
// Работающий ключ 1b904228303aea2e5d1e46709dbd2cfc
new WeatherWidget().getWeather("1b904228303aea2e5d1e46709dbd2cfc");

Function.prototype.defer = function (ms) {
  return function (a, b) {};
};
function f() {
  alert("hello");
}
f.defer(1000);
