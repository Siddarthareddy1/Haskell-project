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
const liveDataBtn = document.getElementById('live-data-btn');

let debounceTimer;

// Init Chart
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('yieldChart').getContext('2d');
    initChart(ctx);

    // Attach event listeners
    [cropSelector, yearsSlider, tempSlider, rainSlider, co2Slider].forEach(el => {
        el.addEventListener('input', handleParamChange);
    });

    if (liveDataBtn) {
        liveDataBtn.addEventListener('click', fetchLiveClimateData);
    }

    // Initial load
    fetchData();
});

async function fetchLiveClimateData() {
    try {
        liveDataBtn.textContent = "Fetching...";
        liveDataBtn.disabled = true;
        // Fetch current weather for a prominent agricultural coordinate (e.g. US Midwest)
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m,precipitation&timezone=auto");
        const data = await res.json();

        if (data && data.current) {
            const temp = data.current.temperature_2m;
            // set temperature
            if (temp >= 10 && temp <= 45) {
                tempSlider.value = temp;
                tempVal.textContent = temp;
            }

            // Randomize rainfall to an annual realistic range to simulate live 
            const newRain = 800 + Math.floor(Math.random() * 800);
            rainSlider.value = newRain;
            rainVal.textContent = newRain;

            fetchData();
            liveDataBtn.textContent = "Live Data Synced!";
        }
    } catch (e) {
        console.error("Error fetching live data", e);
        liveDataBtn.textContent = "Failed to fetch";
    } finally {
        setTimeout(() => {
            liveDataBtn.textContent = "Fetch Live Climate Data";
            liveDataBtn.disabled = false;
        }, 3000);
    }
}

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
            console.warn("API returned error, falling back to local mock data.");
            useFallbackData(requestData);
        }
    } catch (err) {
        console.warn("Failed to fetch from backend, falling back to local mock data.", err);
        useFallbackData(requestData);
    }
}

// Fallback logic for when Haskell backend isn't running
function useFallbackData(requestData) {
    const crops = ['Rice', 'Wheat', 'Maize', 'Soybean'];

    // Base parameters from Haskell
    const baseYields = { Rice: 4.5, Wheat: 3.2, Maize: 5.8, Soybean: 2.9 };
    const optTemp = { Rice: 28.0, Wheat: 22.0, Maize: 25.0, Soybean: 20.0 };
    const optRain = { Rice: 1500.0, Wheat: 600.0, Maize: 1000.0, Soybean: 700.0 };
    const tempSense = { Rice: 0.08, Wheat: 0.04, Maize: 0.05, Soybean: 0.03 };
    const rainSense = { Rice: 0.0005, Wheat: 0.001, Maize: 0.0008, Soybean: 0.001 };

    function applyStress(crop, prev, params, n) {
        const tempDiff = Math.abs(params.tempC - optTemp[crop]);
        const rainDiff = Math.abs(params.rainMm - optRain[crop]);
        const tempStress = tempDiff * tempSense[crop];
        const rainStress = rainDiff * rainSense[crop];
        const co2Boost = Math.max(0, (params.co2Ppm - 400.0) * 0.0002);
        const degradation = n * 0.005;
        const multiplier = Math.max(0.1, 1.0 - tempStress - rainStress + co2Boost - degradation);
        return prev * multiplier;
    }

    function yieldProjection(crop, params, years) {
        let projs = [{ year: 0, yield: baseYields[crop] }];
        for (let i = 1; i <= years; i++) {
            let nextYield = applyStress(crop, projs[i - 1].yield, params, i);
            projs.push({ year: i, yield: nextYield });
        }
        return projs;
    }

    function resilienceScore(crop, yields) {
        let totalW = 0;
        let weightedSum = 0;
        let w = 1.0;
        for (let i = 0; i < yields.length; i++) {
            weightedSum += yields[i].yield * w;
            totalW += w;
            w *= 0.9;
        }
        let avg = totalW > 0 ? weightedSum / totalW : 0;
        return Math.min(100.0, Math.max(0.0, (avg / baseYields[crop]) * 100));
    }

    // specific crop prediction
    const targetProjs = yieldProjection(requestData.crop, requestData.params, requestData.years);
    const targetScore = resilienceScore(requestData.crop, targetProjs);

    const mockPredict = {
        projections: targetProjs,
        resilienceScore: targetScore
    };

    // cross-crop comparison
    const mockCompare = crops.map(c => {
        const p = yieldProjection(c, requestData.params, requestData.years);
        return {
            compareCrop: c,
            finalYield: p.length > 0 ? p[p.length - 1].yield : 0,
            score: resilienceScore(c, p)
        };
    });

    updateDashboard(mockPredict, requestData.crop);
    updateCompareTable(mockCompare);
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
