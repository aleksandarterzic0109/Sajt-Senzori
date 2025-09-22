let chart = document.getElementById('myChart');

// fixed colors for first six sensors
const sensorColors = {
    0: 'red',     // first sensor
    1: 'blue',    // second sensor
    2: 'green',   // third sensor
    3: 'orange',  // fourth sensor
    4: 'purple',  // fifth sensor
    5: 'brown',   // sixth sensor
};

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
    let dataArray = parsedData.data;
    let dataMatrix = [];
    let headingArray = [];

    for (let i = 0; i < dataArray[0].length; i++) {
        dataMatrix[i] = [];
        headingArray.push({
            title: dataArray[0][i],
            unit: dataArray[1][i],
        });
    }

    for (let i = 0; i < dataArray.length; i++) {
        for (let j = 0; j < dataArray[i].length; j++) {
            if (!dataArray[i][j]) {
                dataArray[i][j] = null;
            }
            dataMatrix[j][i] = dataArray[i][j];
        }
    }

    // fix duplicate Pressure Run 1
    let pressureIndices = headingArray
        .map(h => h.title)
        .map((title, idx) => title === "Pressure Run 1" ? idx : -1)
        .filter(idx => idx !== -1);

    if (pressureIndices.length > 1) {
        headingArray[pressureIndices[1]].title = "Pressure Run 2";
    }

    // remove Comment column if exists
    let commentIndex = headingArray.findIndex(el => el.title === 'Comment');
    if (commentIndex !== -1) {
        dataMatrix.splice(commentIndex, 1);
        headingArray.splice(commentIndex, 1);
    }

    /* ===== TABLE (Bootstrap, no GIFs) ===== */
    let html = '';
    html += '<table class="table table-bordered table-striped table-hover"><tbody>';

    parsedData.data.forEach((row, rowIdx) => {
        if (row.some(el => el !== null)) {
            html += '<tr>';
            row.forEach((cell, colIdx) => {
                let value = (cell !== null ? cell : '');
                let style = '';

                // Apply sensor colors for first 6 sensors (skip Time column)
                if (rowIdx > 1 && colIdx > 0) {
                    let color = sensorColors[colIdx - 1];
                    if (color) {
                        style = ` style="color:${color}; font-weight:bold;"`;
                    }
                }

                html += `<td${style}>${value}</td>`;
            });
            html += '</tr>';
        }
    });
    html += '</tbody></table>';
    $('#parsedData').html(html);

    /* ===== CHART ===== */
    Chart.defaults.global.defaultFontFamily = 'Consolas';
    Chart.defaults.global.defaultFontSize = 18;
    Chart.defaults.global.defaultFontColor = 'black';
    Chart.defaults.global.elements.line.backgroundColor = 'transparent';

    let labels = dataMatrix[0];
    labels.splice(0, 3);

    let datasets = [];

    for (let i = 1; i < dataMatrix.length; i++) {
        let label = dataMatrix[i][0];

        let datasetData = dataMatrix[i].slice(); // clone
        datasetData.splice(0, 3);

        datasets.push({
            label: label,
            data: datasetData,
            borderColor: sensorColors[i - 1] || 'gray',
            borderWidth: 1,
            pointRadius: 0,
        });
    }

    let ctx = document.getElementById('myChart').getContext('2d');
    let type = 'line';
    let data = { labels, datasets };
    let options = {
        title: {
            display: true,
            text: ['Display of measurement results'],
            fontSize: 23,
        },
        legend: {
            position: 'bottom',
            labels: { fontColor: 'black' }
        },
        tooltips: {
            intersect: false,
            callbacks: {
                title: (toolTipItem) => {
                    return headingArray[0].title + ": " + toolTipItem[0].label + " " + headingArray[0].unit;
                },
                label: (toolTipItem) => {
                    return toolTipItem.yLabel + " " + headingArray[toolTipItem.datasetIndex + 1].unit;
                },
            },
        },
    };

    if (chart != null) chart.destroy();
    chart = new Chart(ctx, { type, data, options });
}

function upload(evt) {
    if (chart != null) {
        chart.destroy();
    }
    let file = evt.target.files[0];
    let reader = new FileReader();
    try { reader.readAsText(file); } catch (e) { console.log(e) }
    reader.onload = function (event) {
        let csvData = event.target.result;
        if (csvData && csvData.length > 0) {
            console.log('Imported -' + csvData.length + '- rows successfully!');
            dataToArrays(csvData);
        } else {
            console.log('No data to import!');
        }
    };
    reader.onerror = function () {
        console.log('Unable to read ' + file.fileName);
    };
}