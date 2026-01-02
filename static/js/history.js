// Load history on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

async function loadHistory() {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    try {
        const response = await fetch('/api/history');
        const history = await response.json();
        
        if (history.length === 0) {
            emptyState.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                </svg>
                <h3>Chưa có dữ liệu giám sát nào</h3>
                <p>Hãy tải lên file để bắt đầu giám sát!</p>
            `;
            return;
        }
        
        emptyState.style.display = 'none';
        historyList.innerHTML = '';
        
        history.forEach((item, index) => {
            const historyItem = createHistoryItem(item);
            historyList.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error loading history:', error);
        emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
            </svg>
            <h3>Lỗi khi tải lịch sử</h3>
            <p>${error.message}</p>
        `;
    }
}

function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.id = `history-item-${item.stats_filename}`;
    
    const date = new Date(item.processed_at);
    const dateStr = date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const stats = item.stats || {};
    const inItems = stats.in_items || {};
    const outItems = stats.out_items || {};
    
    div.innerHTML = `
        <div class="history-item-header">
            <div>
                <div class="history-item-title">Camera: ${item.original_filename || 'Không tên'}</div>
                <div class="history-item-date">${dateStr}</div>
            </div>
            <div class="history-item-actions">
                <button class="btn-delete" onclick="deleteItem('${item.stats_filename}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Xóa
                </button>
            </div>
        </div>
        
        <div class="history-stats">
            <div class="history-stat">
                <div class="history-stat-value">${stats.in || 0}</div>
                <div class="history-stat-label">Phương Tiện Vào</div>
            </div>
            <div class="history-stat">
                <div class="history-stat-value">${stats.out || 0}</div>
                <div class="history-stat-label">Phương Tiện Ra</div>
            </div>
            <div class="history-stat">
                <div class="history-stat-value">${stats.total || 0}</div>
                <div class="history-stat-label">Tổng Lưu Lượng</div>
            </div>
        </div>
        
        <div class="history-cameras">
            <div class="history-camera-box">
                <h4>Bản Ghi Thống Kê</h4>
                <video controls style="width: 100%; border-radius: 8px; background: #000; margin-bottom: 10px;">
                    <source src="/video/${item.stats_filename}" type="video/mp4">
                    <source src="/video/${item.stats_filename.replace('.mp4', '.avi')}" type="video/x-msvideo">
                    Trình duyệt không hỗ trợ video
                </video>
                <div class="history-actions">
                    <button class="btn-download btn-small" onclick="downloadCamera('${item.stats_filename}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Tải Xuống
                    </button>
                </div>
            </div>
            
            <div class="history-camera-box">
                <h4>Bản Ghi Tốc Độ</h4>
                <video controls style="width: 100%; border-radius: 8px; background: #000; margin-bottom: 10px;">
                    <source src="/video/${item.speed_filename}" type="video/mp4">
                    <source src="/video/${item.speed_filename.replace('.mp4', '.avi')}" type="video/x-msvideo">
                    Trình duyệt không hỗ trợ video
                </video>
                <div class="history-actions">
                    <button class="btn-download btn-small" onclick="downloadCamera('${item.speed_filename}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Tải Xuống
                    </button>
                </div>
            </div>
        </div>
        
        ${Object.keys(inItems).length > 0 || Object.keys(outItems).length > 0 ? `
        <details class="details-toggle">
            <summary style="cursor: pointer; font-weight: 600; color: #667eea; font-size: 1.05rem; list-style: none;">
                <span style="user-select: none;">Xem Chi Tiết Phân Loại</span>
            </summary>
            <div class="details-content">
                ${Object.keys(inItems).length > 0 ? `
                <div>
                    <h4 style="color: #11998e; margin-bottom: 15px; font-weight: 600;">Phương Tiện Vào:</h4>
                    ${Object.entries(inItems).map(([name, count]) => 
                        `<div style="display: flex; justify-content: space-between; padding: 12px; background: #f0f0f0; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #11998e;">
                            <span style="font-weight: 500;">${name}</span>
                            <strong style="color: #11998e; font-size: 1.1rem;">${count}</strong>
                        </div>`
                    ).join('')}
                </div>
                ` : ''}
                ${Object.keys(outItems).length > 0 ? `
                <div>
                    <h4 style="color: #eb3349; margin-bottom: 15px; font-weight: 600;">Phương Tiện Ra:</h4>
                    ${Object.entries(outItems).map(([name, count]) => 
                        `<div style="display: flex; justify-content: space-between; padding: 12px; background: #f0f0f0; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #eb3349;">
                            <span style="font-weight: 500;">${name}</span>
                            <strong style="color: #eb3349; font-size: 1.1rem;">${count}</strong>
                        </div>`
                    ).join('')}
                </div>
                ` : ''}
            </div>
        </details>
        ` : ''}
    `;
    
    return div;
}

function downloadCamera(filename) {
    window.location.href = `/download/${filename}`;
}

async function deleteItem(filename) {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/delete/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const item = document.getElementById(`history-item-${filename}`);
            if (item) {
                item.style.transition = 'opacity 0.3s';
                item.style.opacity = '0';
                setTimeout(() => item.remove(), 300);
            }
        } else {
            alert('Lỗi khi xóa bản ghi');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Lỗi khi xóa bản ghi: ' + error.message);
    }
}
