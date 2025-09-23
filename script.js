let chart = null;

// Fixed colors for first six sensors
const sensorColors = ['red', 'blue', 'green', 'orange', 'purple', 'brown'];

$(document).ready(function () {
    if ($('#myChart').html() === "") {
        $.get('sensors.csv', function (data) { dataToArrays(data) }, 'text');
    }
    document.getElementById('csvFile').addEventListener('change', upload, false);
});

function dataToArrays(data) {
    let rawData = Papa.parse(data);
    createChart(rawData);
}

function createChart(parsedData) {
    const dataArray = parsedData.data;
    const dataMatrix = [];
    const headingArray = [];

    // Create headingArray and dataMatrix
    for (let i = 0; i < dataArray[0].length; i++) {
        dataMatrix[i] = [];
        headingArray.push({ title: dataArray[0][i], unit: dataArray[1][i] });
    }

    for (let i = 0; i < dataArray.length; i++) {
        for (let j = 0; j < dataArray[i].length; j++) {
            dataMatrix[j][i] = dataArray[i][j] || null;
        }
    }

    // Fix duplicate Pressure Run 1
    const pressureIndices = headingArray
        .map(h => h.title)
        .map((t, idx) => t === "Pressure Run 1" ? idx : -1)
        .filter(idx => idx !== -1);
    if (pressureIndices.length > 1) headingArray[pressureIndices[1]].title = "Pressure Run 2";

    // Remove Comment column
    const commentIndex = headingArray.findIndex(h => h.title === "Comment");
    if (commentIndex !== -1) {
        dataMatrix.splice(commentIndex, 1);
        headingArray.splice(commentIndex, 1);
    }

    /* ===== TABLE ===== */
    let html = '<table class="table"><tbody>';

    // Table header row
    html += '<tr>';
    headingArray.forEach((h, idx) => {
        let color = idx > 0 && idx <= 6 ? sensorColors[idx - 1] : 'black';
        html += `<th style="color:${color}; font-weight:bold;">${h.title}</th>`;
    });
    html += '</tr>';

    // Table data rows
    for (let rowIdx = 2; rowIdx < dataArray.length; rowIdx++) {
        html += '<tr>';
        for (let colIdx = 0; colIdx < dataArray[rowIdx].length; colIdx++) {
            let value = dataArray[rowIdx][colIdx] || '';
            let color = colIdx > 0 && colIdx <= 6 ? sensorColors[colIdx - 1] : 'black';
            html += `<td style="color:${color}; font-weight:bold;">${value}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    $('#parsedData').html(html);

    /* ===== CHART ===== */
    Chart.defaults.global.defaultFontFamily = 'Consolas';
    Chart.defaults.global.defaultFontSize = 18;
    Chart.defaults.global.defaultFontColor = 'black';
    Chart.defaults.global.elements.line.backgroundColor = 'transparent';

    const labels = dataMatrix[0].slice(3); // skip first 3 columns (Time, unit rows)
    const datasets = [];

    for (let i = 1; i < dataMatrix.length; i++) {
        const label = headingArray[i].title;
        const dataValues = dataMatrix[i].slice(3); // skip headers/units
        const color = sensorColors[i - 1] || 'gray';

        datasets.push({
            label: label,
            data: dataValues,
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0,
        });
    }

    const ctx = document.getElementById('myChart').getContext('2d');

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            title: {
                display: true,
                text: 'Display of measurement results',
                fontSize: 23,
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: { fontColor: 'black' }
            },
            tooltips: {
                intersect: false,
                callbacks: {
                    title: function (tooltipItem) {
                        return headingArray[0].title + ": " + tooltipItem[0].label + " " + headingArray[0].unit;
                    },
                    label: function (tooltipItem) {
                        return tooltipItem.yLabel + " " + headingArray[tooltipItem.datasetIndex + 1].unit;
                    }
                }
            },
            scales: {
                xAxes: [{ display: true }],
                yAxes: [{ display: true }]
            }
        }
    });
}

function upload(evt) {
    if (chart) chart.destroy();
    const file = evt.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function (event) {
        const csvData = event.target.result;
        if (csvData && csvData.length > 0) dataToArrays(csvData);
    };
    reader.onerror = function () {
        console.log('Unable to read ' + file.fileName);
    };
}