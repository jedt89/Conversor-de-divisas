const BASE_API = 'https://mindicador.cl/api/';
const clpInput = document.querySelector('.clp-input');
const currencySelect = document.querySelector('.currency-select');
const conversionButton = document.querySelector('.conversion-button');
const currencyInfo = document.querySelector('.currency-info');
const chartContainer = document.querySelector('#chart-container');
const currencyName = document.querySelector('.currency-name');
const currencyValue = document.querySelector('.currency-value');
const currencyUpdate = document.querySelector('.currency-update');
const totalContainer = document.querySelector('.total');
const canvasContainer = document
  .getElementById('indicator-chart')
  .getContext('2d');

let currentIndicator = {};
let currentMount = 0;

const init = async () => {
  hideInfo();
  const indicators = await getIndicators();
  renderIndicators(indicators);
  setListeners(indicators);
};

const getIndicators = async (indicator) => {
  try {
    const response = await fetch(`${BASE_API}${indicator || ''}`);
    const data = await response.json();
    return indicator
      ? data.serie || []
      : Object.values(data).filter((item) => typeof item == 'object');
  } catch (error) {
    console.debug('Fetch error', error);
    currencyInfo.textContent = 'Error al cargar los datos. Por favor, actualice la página.' 
    return [];
  }
};

const renderIndicators = (currencies) => {
  currencies.forEach(({ codigo, nombre }) => {
    const option = `<option id="${codigo}" value="${codigo}">${nombre}</option>`;
    currencySelect.insertAdjacentHTML('beforeend', option);
  });
};

const setListeners = (indicators) => {
  currencySelect.addEventListener('change', async (event) => {
    const selectedCode = event.target.value;
    if (selectedCode != '') {
      currentIndicator = indicators.find((ind) => ind.codigo == selectedCode);
      if (currentIndicator) {
        updateCurrencyInfo();
      }
    } else {
      hideInfo();
    }
  });
  clpInput.addEventListener('change', (event) => {
    currentMount = parseFloat(event.target.value);
  });
  conversionButton.addEventListener('click', convertCurrency);
};

const updateCurrencyInfo = async () => {
  const { valor, nombre, fecha } = currentIndicator;
  currencyName.textContent = nombre;
  currencyValue.textContent = `$${parseInt(valor).toLocaleString('es-CL')}`;
  currencyUpdate.textContent = `Fecha de actualización: ${new Date(
    fecha
  ).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`;
  const indicatorHistory = await getIndicators(currentIndicator.codigo);
  generateChart(
    indicatorHistory.slice(-10).map(({ fecha, valor }) => ({
      fecha: new Date(fecha).toLocaleDateString(),
      valor
    }))
  );
  showInfo();
  totalContainer.textContent = '$0';
};

const convertCurrency = () => {
  if (clpInput.value != '' && currencySelect.value != '') {
    const result = currentMount / currentIndicator.valor;
    totalContainer.textContent = `$${parseInt(result).toLocaleString('es-CL')}`;
  }
};

const generateChart = (history) => {
  history.reverse();
  const labels = history.map((item) => item.fecha);
  const data = history.map((item) => parseFloat(item.valor.toFixed(0)));
  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Valores de los últimos 10 días',
          data,
          pointRadius: 7,
          borderColor: 'white',
          borderWidth: 1,
          pointBackgroundColor: 'orange',
          pointBorderColor: 'transparent',
          datalabels: {
            color: 'white'
          }
        }
      ]
    },
    options: {
      responsive: true,
      devicePixelRatio: window.devicePixelRatio,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: 'white', callback: value => '$' + value } },
        x: { ticks: { color: 'white' } }
      },
      plugins: { legend: { labels: { color: 'white' } } }
    }
  };

  const existingChart = Chart.getChart(canvasContainer);
  if (existingChart) {
    existingChart.destroy();
  }
  new Chart(canvasContainer, config);
};

const hideInfo = () => {
  currencyInfo.style.display = 'none';
  currencyUpdate.style.display = 'none';
};

const showInfo = () => {
  currencyInfo.style.display = 'flex';
  currencyUpdate.style.display = 'flex';
};

init();
