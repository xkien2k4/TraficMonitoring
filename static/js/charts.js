// Load charts data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadChartsData();
});

async function loadChartsData() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();
        
        if (history.length === 0) {
            document.getElementById('summaryCards').innerHTML = `
                <div class="summary-card" style="grid-column: 1/-1; padding: 40px;">
                    <p>Chưa có dữ liệu để hiển thị biểu đồ</p>
                </div>
            `;
            return;
        }
        
        // Tính tổng thống kê
        let totalIn = 0;
        let totalOut = 0;
        let totalRecords = history.length;
        const vehicleTypes = {};
        const timeData = [];
        
        history.forEach(item => {
            const stats = item.stats || {};
            totalIn += stats.in || 0;
            totalOut += stats.out || 0;
            
            // Tổng hợp theo loại phương tiện
            Object.entries(stats.in_items || {}).forEach(([type, count]) => {
                vehicleTypes[type] = (vehicleTypes[type] || 0) + count;
            });
            Object.entries(stats.out_items || {}).forEach(([type, count]) => {
                vehicleTypes[type] = (vehicleTypes[type] || 0) + count;
            });
            
            // Dữ liệu theo thời gian
            const date = new Date(item.processed_at);
            timeData.push({
                date: date.toLocaleDateString('vi-VN'),
                in: stats.in || 0,
                out: stats.out || 0
            });
        });
        
        // Hiển thị summary cards
        document.getElementById('summaryCards').innerHTML = `
            <div class="summary-card">
                <div class="summary-value">${totalIn + totalOut}</div>
                <div class="summary-label">Tổng Lưu Lượng</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
                <div class="summary-value">${totalIn}</div>
                <div class="summary-label">Tổng Phương Tiện Vào</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);">
                <div class="summary-value">${totalOut}</div>
                <div class="summary-label">Tổng Phương Tiện Ra</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div class="summary-value">${totalRecords}</div>
                <div class="summary-label">Số Bản Ghi</div>
            </div>
        `;
        
        // Vẽ biểu đồ
        drawInOutChart(totalIn, totalOut);
        drawVehicleTypeChart(vehicleTypes);
        drawTimeSeriesChart(timeData);
        drawRatioChart(totalIn, totalOut);
        
    } catch (error) {
        console.error('Error loading charts data:', error);
    }
}

function drawInOutChart(totalIn, totalOut) {
    const ctx = document.getElementById('inOutChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Phương Tiện Vào', 'Phương Tiện Ra'],
            datasets: [{
                label: 'Lưu Lượng',
                data: [totalIn, totalOut],
                backgroundColor: [
                    'rgba(17, 153, 142, 0.8)',
                    'rgba(235, 51, 73, 0.8)'
                ],
                borderColor: [
                    'rgba(17, 153, 142, 1)',
                    'rgba(235, 51, 73, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function drawVehicleTypeChart(vehicleTypes) {
    const labels = Object.keys(vehicleTypes);
    const data = Object.values(vehicleTypes);
    
    const ctx = document.getElementById('vehicleTypeChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(17, 153, 142, 0.8)',
                    'rgba(235, 51, 73, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function drawTimeSeriesChart(timeData) {
    const labels = timeData.map(d => d.date).slice(-10); // Lấy 10 bản ghi gần nhất
    const inData = timeData.map(d => d.in).slice(-10);
    const outData = timeData.map(d => d.out).slice(-10);
    
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vào',
                data: inData,
                borderColor: 'rgba(17, 153, 142, 1)',
                backgroundColor: 'rgba(17, 153, 142, 0.1)',
                tension: 0.4
            }, {
                label: 'Ra',
                data: outData,
                borderColor: 'rgba(235, 51, 73, 1)',
                backgroundColor: 'rgba(235, 51, 73, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function drawRatioChart(totalIn, totalOut) {
    const ctx = document.getElementById('ratioChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Phương Tiện Vào', 'Phương Tiện Ra'],
            datasets: [{
                data: [totalIn, totalOut],
                backgroundColor: [
                    'rgba(17, 153, 142, 0.8)',
                    'rgba(235, 51, 73, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

