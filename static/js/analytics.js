// Load analytics data
document.addEventListener('DOMContentLoaded', async () => {
    await loadAnalytics();
});

async function loadAnalytics() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();
        
        if (history.length === 0) {
            document.getElementById('statsSummary').innerHTML = 
                '<div style="text-align: center; padding: 40px; color: white;"><p>Chưa có dữ liệu để hiển thị</p></div>';
            return;
        }
        
        // Tính tổng hợp thống kê
        const totalIn = history.reduce((sum, item) => sum + (item.stats?.in || 0), 0);
        const totalOut = history.reduce((sum, item) => sum + (item.stats?.out || 0), 0);
        const totalVehicles = totalIn + totalOut;
        const totalRecords = history.length;
        
        // Hiển thị summary
        document.getElementById('statsSummary').innerHTML = `
            <div class="summary-card">
                <h3>Tổng Xe Vào</h3>
                <div class="value">${totalIn}</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);">
                <h3>Tổng Xe Ra</h3>
                <div class="value">${totalOut}</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <h3>Tổng Cộng</h3>
                <div class="value">${totalVehicles}</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <h3>Số Bản Ghi</h3>
                <div class="value">${totalRecords}</div>
            </div>
        `;
        
        // Biểu đồ hướng di chuyển
        const directionCtx = document.getElementById('directionChart').getContext('2d');
        new Chart(directionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Xe Vào', 'Xe Ra'],
                datasets: [{
                    data: [totalIn, totalOut],
                    backgroundColor: ['#11998e', '#eb3349'],
                    borderWidth: 2,
                    borderColor: '#fff'
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
        
        // Biểu đồ phân loại phương tiện
        const vehicleTypes = {};
        history.forEach(item => {
            const stats = item.stats || {};
            const inItems = stats.in_items || {};
            const outItems = stats.out_items || {};
            
            Object.entries(inItems).forEach(([type, count]) => {
                vehicleTypes[type] = (vehicleTypes[type] || 0) + count;
            });
            Object.entries(outItems).forEach(([type, count]) => {
                vehicleTypes[type] = (vehicleTypes[type] || 0) + count;
            });
        });
        
        const vehicleTypeCtx = document.getElementById('vehicleTypeChart').getContext('2d');
        new Chart(vehicleTypeCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(vehicleTypes),
                datasets: [{
                    label: 'Số Lượng',
                    data: Object.values(vehicleTypes),
                    backgroundColor: '#667eea',
                    borderColor: '#764ba2',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Biểu đồ xu hướng theo thời gian
        const timeSeries = {};
        history.forEach(item => {
            const date = new Date(item.processed_at).toLocaleDateString('vi-VN');
            if (!timeSeries[date]) {
                timeSeries[date] = { in: 0, out: 0 };
            }
            timeSeries[date].in += item.stats?.in || 0;
            timeSeries[date].out += item.stats?.out || 0;
        });
        
        const dates = Object.keys(timeSeries).sort();
        const timeSeriesCtx = document.getElementById('timeSeriesChart').getContext('2d');
        new Chart(timeSeriesCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Xe Vào',
                    data: dates.map(d => timeSeries[d].in),
                    borderColor: '#11998e',
                    backgroundColor: 'rgba(17, 153, 142, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Xe Ra',
                    data: dates.map(d => timeSeries[d].out),
                    borderColor: '#eb3349',
                    backgroundColor: 'rgba(235, 51, 73, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

