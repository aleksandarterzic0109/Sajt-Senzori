// Fixed sensor colors (consistent across loads)
const sensorColors = {
    "Sensor1": "red",
    "Sensor2": "blue",
    "Sensor3": "green",
    "Sensor4": "orange",
    "Sensor5": "purple",
    "Sensor6": "brown"
};

let chart = null;

// Parse the uploaded CSV file
document.getElementById("csvFile").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function (results) {
                const data = results.data;
                renderChart(data);
                renderTable(data);
            }
        });
    }
});

// Render chart with Chart.js
function renderChart(data) {
    const labels = data.map(row => row.Time || row.time || row.timestamp);
    const datasets = [];

    const sensors = Object.keys(data[0]).filter(k => k !== "Time" && k !== "time" && k !== "timestamp");

    sensors.forEach(sensor => {
        datasets.push({
            label: sensor,
            data: data.map(row => row[sensor]),
            borderColor: sensorColors[sensor] || getRandomColor(),
            backgroundColor: "transparent",
            borderWidth: 2
        });
    });

    const ctx = document.getElementById("myChart").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Render table with colored cells
function renderTable(data) {
    const container = document.getElementById("parsedData");
    container.innerHTML = "";

    if (!data.length) return;

    const table = document.createElement("table");
    table.className = "table table-bordered table-sm";

    // Build header row
    const header = document.createElement("tr");
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement("th");
        th.textContent = key;
        th.style.backgroundColor = sensorColors[key] || "lightgray";
        th.style.color = "white";
        header.appendChild(th);
    });
    table.appendChild(header);

    // Build data rows
    data.forEach(row => {
        const tr = document.createElement("tr");
        Object.keys(row).forEach(key => {
            const td = document.createElement("td");
            td.textContent = row[key];

            // Apply color per cell based on sensor
            if (sensorColors[key]) {
                td.style.backgroundColor = sensorColors[key];
                td.style.color = "white";
            }

            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);
}

// Utility fallback color
function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
}