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
const canvasContainer = document.getElementById('indicator-chart').getContext('2d');

let currentIndicator = {};
let currentMount = 0;

const init = async () => {
  const indicators = await getIndicators(null);
  renderIndicators(indicators);
  setListeners(indicators);
  hideInfo();
};

const getIndicators = async (indicator) => {
  try {
    const response = await fetch(`${BASE_API}${indicator || ''}`);
    const data = await response.json();

    if (!indicator) {
      return Object.values(data).filter(item => typeof item == 'object');
    } else {
      return data.serie || [];
    }
  } catch (error) {
    console.debug('Fetch error', error);
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
      currentIndicator = indicators.find(ind => ind.codigo === selectedCode);

      if (currentIndicator) {
        const dateConfig = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };
        const { valor, nombre, fecha } = currentIndicator;
        const parsedValue = valor.toFixed(0)
        currencyName.textContent = nombre;
        currencyValue.textContent = valor.toLocaleString('es-CL');
        currencyUpdate.textContent = `Fecha de actualización: ${new Date(fecha).toLocaleDateString('es-ES', dateConfig)}`;
        const indicatorHistory = await getIndicators(selectedCode);
        const mappedIndicators = indicatorHistory.map(({ fecha, valor }) => ({
          fecha: fecha.split('T')[0], 
          valor
        }));
        generateChart(mappedIndicators.slice(-10));
        showInfo();
      }
    } else {
      hideInfo();
    }
  });

  clpInput.addEventListener('change', (event) => {
    currentMount = parseFloat(event.target.value);
  });

  conversionButton.addEventListener('click', () => {
    convertCurrency();
  });
};

const convertCurrency = () => {
  const result = currentIndicator.valor * currentMount;
  totalContainer.textContent = result.toLocaleString('es-CL');
};

const generateChart = (history) => {
  history.reverse();
  const labels = history.map(item => item.fecha);
  const data = history.map(item => parseFloat(item.valor.toFixed(0)));
  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Valores',
        data: data,
        pointRadius: 5,
        borderColor: 'dodgerblue',
        borderWidth: 1,
        pointBackgroundColor: 'orange',
        pointBorderColor: 'transparent',

      }]
    }
  };

  if (Chart.getChart(canvasContainer)) {
    Chart.getChart(canvasContainer).destroy();
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
