
let sentimentChart = null;

async function analyzeReviews() {
    const input = document.getElementById("reviewsInput");
    const button = document.getElementById("analyzeBtn");
    const error = document.getElementById("errorMessage");

    const reviews = input.value
        .split("\n")
        .map(review => review.trim())
        .filter(review => review.length > 0);

    error.textContent = "";

    if (reviews.length === 0) {
        error.textContent = "Please enter at least one review.";
        return;
    }

    if (reviews.length > 50) {
        error.textContent = "Maximum 50 reviews allowed.";
        return;
    }

    button.disabled = true;
    button.textContent = "Analyzing...";

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reviews: reviews })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed.");
        }

        updateDashboard(data);

    } catch (err) {
        error.textContent = err.message || "Unable to connect to server.";
    } finally {
        button.disabled = false;
        button.textContent = "Analyze Reviews →";
    }
}


function updateDashboard(data) {
    const distribution = data.distribution;

    document.getElementById("totalCount").textContent = data.total;
    document.getElementById("positiveCount").textContent =
        distribution.Positive;

    document.getElementById("negativeCount").textContent =
        distribution.Negative;

    document.getElementById("neutralCount").textContent =
        distribution.Neutral;

    updateChart(distribution);
    updateSummary(distribution, data.total);
    updateResults(data.results);
}


function updateChart(distribution) {
    const ctx = document.getElementById("sentimentChart");

    if (sentimentChart) {
        sentimentChart.destroy();
    }

    sentimentChart = new Chart(ctx, {
        type: "doughnut",

        data: {
            labels: ["Positive", "Negative", "Neutral"],

            datasets: [{
                data: [
                    distribution.Positive,
                    distribution.Negative,
                    distribution.Neutral
                ],

                backgroundColor: [
                    "#20a779",
                    "#e45c69",
                    "#e6ad35"
                ],

                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


function updateSummary(distribution, total) {
    const positive = distribution.Positive;
    const negative = distribution.Negative;
    const neutral = distribution.Neutral;

    const positivePercent = ((positive / total) * 100).toFixed(1);
    const negativePercent = ((negative / total) * 100).toFixed(1);
    const neutralPercent = ((neutral / total) * 100).toFixed(1);

    document.getElementById("summary").innerHTML = `
        <p>🟢 Positive reviews: <strong>${positivePercent}%</strong></p>
        <p>🔴 Negative reviews: <strong>${negativePercent}%</strong></p>
        <p>🟡 Neutral reviews: <strong>${neutralPercent}%</strong></p>
        <p>Total reviews analyzed: <strong>${total}</strong></p>
    `;
}


function updateResults(results) {
    const table = document.getElementById("resultsTable");

    table.innerHTML = "";

    results.forEach(item => {
        const row = document.createElement("tr");

        const reviewCell = document.createElement("td");
        reviewCell.textContent = item.review;

        const sentimentCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = `sentiment ${item.sentiment}`;
        badge.textContent = item.sentiment;

        sentimentCell.appendChild(badge);

        const reasonCell = document.createElement("td");
        reasonCell.textContent = item.reason;

        row.appendChild(reviewCell);
        row.appendChild(sentimentCell);
        row.appendChild(reasonCell);

        table.appendChild(row);
    });
}
