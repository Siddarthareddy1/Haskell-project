// dashboard.js
// Handles DOM interactions and API requests

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : '/api';

// DOM Elements
const cropSelector = document.getElementById('crop-selector');
const yearsSlider = document.getElementById('years-slider');
const tempSlider = document.getElementById('temp-slider');
const rainSlider = document.getElementById('rain-slider');
const co2Slider = document.getElementById('co2-slider');

const yearsVal = document.getElementById('years-val');
const tempVal = document.getElementById('temp-val');
const rainVal = document.getElementById('rain-val');
const co2Val = document.getElementById('co2-val');

const resilienceScoreEl = document.getElementById('resilience-score');
const gaugeFill = document.getElementById('gauge-fill');
const compareTableBody = document.querySelector('#compare-table tbody');

let debounceTimer;

// Init Chart
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('yieldChart').getContext('2d');
    initChart(ctx);

    // Attach event listeners
    [cropSelector, yearsSlider, tempSlider, rainSlider, co2Slider].forEach(el => {
        el.addEventListener('input', handleParamChange);
    });

    // Initial load
    fetchData();
});

function handleParamChange(e) {
    // Update displayed values immediately
    if (e.target === yearsSlider) yearsVal.textContent = yearsSlider.value;
    if (e.target === tempSlider) tempVal.textContent = tempSlider.value;
    if (e.target === rainSlider) rainVal.textContent = rainSlider.value;
    if (e.target === co2Slider) co2Val.textContent = co2Slider.value;

    // Debounce API calls
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchData, 300);
}

function getParams() {
    return {
        crop: cropSelector.value,
        params: {
            tempC: parseFloat(tempSlider.value),
            rainMm: parseFloat(rainSlider.value),
            co2Ppm: parseFloat(co2Slider.value)
        },
        years: parseInt(yearsSlider.value, 10)
    };
}

async function fetchData() {
    const requestData = getParams();

    try {
        // Fetch specific crop projection
        const [predictRes, compareRes] = await Promise.all([
            fetch(`${API_BASE}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            }),
            fetch(`${API_BASE}/compare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    compParams: requestData.params,
                    compYears: requestData.years
                })
            })
        ]);

        if (predictRes.ok && compareRes.ok) {
            const predictData = await predictRes.json();
            const compareData = await compareRes.json();

            updateDashboard(predictData, requestData.crop);
            updateCompareTable(compareData.metrics);
        } else {
            console.error("API error");
        }
    } catch (err) {
        console.error("Failed to fetch data", err);
    }
}

function updateDashboard(data, cropName) {
    // 1. Update Chart
    const labels = data.projections.map(p => `Year ${p.year}`);
    const yields = data.projections.map(p => p.yield.toFixed(2));
    updateChart(labels, yields, cropName);

    // 2. Update Gauge
    const score = data.resilienceScore;
    resilienceScoreEl.textContent = `${Math.round(score)}%`;

    // Gauge SVG stroke-dasharray is 125.6 total length
    // offset = length - (length * percentage)
    const offset = 125.6 - (125.6 * (score / 100));
    gaugeFill.style.strokeDashoffset = offset;

    // Color code gauge
    if (score >= 80) gaugeFill.style.stroke = '#2ea043'; // High
    else if (score >= 50) gaugeFill.style.stroke = '#d29922'; // Med
    else gaugeFill.style.stroke = '#f85149'; // Low
}

function updateCompareTable(metrics) {
    compareTableBody.innerHTML = '';

    metrics.forEach(m => {
        const tr = document.createElement('tr');

        // 1. Crop Name
        const tdCrop = document.createElement('td');
        tdCrop.textContent = m.compareCrop;

        // 2. Final Yield
        const tdYield = document.createElement('td');
        tdYield.textContent = m.finalYield.toFixed(2) + ' t/ha';

        // 3. Score
        const tdScore = document.createElement('td');
        const scoreVal = Math.round(m.score);
        tdScore.textContent = `${scoreVal}%`;

        if (scoreVal >= 80) tdScore.className = 'score-high';
        else if (scoreVal >= 50) tdScore.className = 'score-med';
        else tdScore.className = 'score-low';

        tr.appendChild(tdCrop);
        tr.appendChild(tdYield);
        tr.appendChild(tdScore);
        compareTableBody.appendChild(tr);
    });
}
