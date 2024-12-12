document.getElementById("calculate-btn").addEventListener("click", () => {
    const dataX = document.getElementById("data-x").value.split(",").map(Number);
    const dataY = document.getElementById("data-y").value.split(",").map(Number);
    const alpha = parseFloat(document.getElementById("alpha").value);
    const alternative = document.getElementById("alternative").value;

    if (dataX.length !== dataY.length || dataX.some(isNaN) || dataY.some(isNaN)) {
        alert("Por favor, ingrese datos válidos y asegúrese de que ambas muestras tengan el mismo tamaño.");
        return;
    }

    // Calcular diferencias
    const differences = dataX.map((x, i) => x - dataY[i]);

    // Media de las diferencias
    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;

    // Varianza y desviación estándar de las diferencias
    const varianceDiff = differences
        .map(d => Math.pow(d - meanDiff, 2))
        .reduce((a, b) => a + b, 0) / (differences.length - 1);

    const stdDevDiff = Math.sqrt(varianceDiff);

    // Validar que la desviación estándar no sea 0
    if (stdDevDiff === 0) {
        alert("Error: Las diferencias entre las muestras tienen varianza cero. Revise los datos.");
        return;
    }

    // Estadístico t
    const tStat = meanDiff / (stdDevDiff / Math.sqrt(differences.length));

    // Grados de libertad
    const df = differences.length - 1;

    // Calcular el intervalo de confianza (95%)
    const tCritical = jStat.studentt.inv(1 - alpha / 2, df); // t crítico para nivel de confianza 95%
    const marginOfError = tCritical * (stdDevDiff / Math.sqrt(differences.length));
    const confidenceInterval = [meanDiff - marginOfError, meanDiff + marginOfError];

    // Calcular p-valor y decisión
    const pValue = calcPValue(tStat, df, alternative);
    const decision = pValue < alpha ? "Rechazar H₀" : "No Rechazar H₀";

    // Mostrar resultados
    document.getElementById("result-text").innerHTML = `
        <strong>Estadístico t:</strong> ${tStat.toFixed(4)}<br>
        <strong>p-Valor:</strong> ${pValue.toFixed(4)}<br>
        <strong>Decisión:</strong> ${decision}<br>
        <strong>Intervalo de Confianza (95%):</strong> [${confidenceInterval[0].toFixed(4)}, ${confidenceInterval[1].toFixed(4)}]<br>
        <strong>Media de las diferencias:</strong> ${meanDiff.toFixed(4)}<br>
        <strong>Desviación estándar de las diferencias:</strong> ${stdDevDiff.toFixed(4)}<br>
    `;

    // Generar gráfica
    plotChart(tStat, df, alpha);
});

// Función para calcular p-valor
function calcPValue(t, df, alternative) {
    const cdf = jStat.studentt.cdf(t, df);

    if (alternative === "left") {
        return cdf;
    } else if (alternative === "right") {
        return 1 - cdf;
    } else {
        return 2 * Math.min(cdf, 1 - cdf);
    }
}

// Generar gráfica
function plotChart(tStat, df, alpha) {
    const ctx = document.getElementById("chart").getContext("2d");

    // Crear datos para la gráfica
    const dataPoints = [];
    const labels = [];
    for (let t = -4; t <= 4; t += 0.1) {
        labels.push(t.toFixed(1));
        dataPoints.push(jStat.studentt.pdf(t, df));
    }

    const criticalLeft = jStat.studentt.inv(alpha, df);
    const criticalRight = jStat.studentt.inv(1 - alpha, df);

    // Crear gráfico
    const chart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Distribución T-Student",
                    data: dataPoints,
                    borderColor: "blue",
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: "t Calculado",
                    data: Array(labels.length).fill(tStat),
                    borderColor: "red",
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                },
                {
                    label: "Valor Crítico Izquierda",
                    data: Array(labels.length).fill(criticalLeft),
                    borderColor: "green",
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                },
                {
                    label: "Valor Crítico Derecha",
                    data: Array(labels.length).fill(criticalRight),
                    borderColor: "orange",
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "t",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "f(t)",
                    },
                },
            },
        },
    });

    // Botón para descargar la imagen
    document.getElementById("download-btn").addEventListener("click", () => {
        const imgURL = chart.toBase64Image();
        const link = document.createElement("a");
        link.href = imgURL;
        link.download = "grafico_t_student.png";
        link.click();
    });
}

// Función para cargar CSV
document.getElementById("csv-upload").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split("\n");
            const dataX = [];
            const dataY = [];

            lines.forEach((line) => {
                const [x, y] = line.split(",");
                if (x && y) {
                    dataX.push(parseFloat(x));
                    dataY.push(parseFloat(y));
                }
            });

            // Poner los datos cargados en los campos del formulario
            document.getElementById("data-x").value = dataX.join(", ");
            document.getElementById("data-y").value = dataY.join(", ");
        };
        reader.readAsText(file);
    } else {
        alert("Por favor, seleccione un archivo CSV válido.");
    }
});





