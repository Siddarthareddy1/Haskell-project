// charts.js
// Handles Chart.js initialization and updates

let yieldChartInstance = null;

function initChart(ctx) {
    Chart.defaults.color = '#8b949e';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    yieldChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Years
            datasets: [{
                label: 'Projected Yield (t/ha)',
                data: [],
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88, 166, 255, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#238636',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#238636',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(22, 27, 34, 0.9)',
                    titleColor: '#e6edf3',
                    bodyColor: '#e6edf3',
                    borderColor: '#30363d',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(48, 54, 61, 0.5)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Projection Year'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(48, 54, 61, 0.5)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Yield (t/ha)'
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    return yieldChartInstance;
}

function updateChart(labels, dataPoints, cropName) {
    if (!yieldChartInstance) return;
    
    yieldChartInstance.data.labels = labels;
    yieldChartInstance.data.datasets[0].data = dataPoints;
    yieldChartInstance.data.datasets[0].label = `${cropName} Projected Yield (t/ha)`;
    
    // Change color based on crop
    let color = '#58a6ff'; // Default
    if (cropName === 'Rice') color = '#58a6ff';
    if (cropName === 'Wheat') color = '#d29922';
    if (cropName === 'Maize') color = '#2ea043';
    if (cropName === 'Soybean') color = '#bc8cff';
    
    yieldChartInstance.data.datasets[0].borderColor = color;
    yieldChartInstance.data.datasets[0].backgroundColor = color + '1A'; // 10% opacity hex
    
    yieldChartInstance.update();
}
