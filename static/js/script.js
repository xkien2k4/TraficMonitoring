const uploadArea = document.getElementById('uploadArea');
const videoInput = document.getElementById('videoInput');
const uploadBox = document.getElementById('uploadBox');
const progressSection = document.getElementById('progressSection');
const resultsSection = document.getElementById('resultsSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const downloadStatsBtn = document.getElementById('downloadStatsBtn');
const downloadSpeedBtn = document.getElementById('downloadSpeedBtn');
const backBtn = document.getElementById('backBtn');
const videoStats = document.getElementById('videoStats');
const videoSpeed = document.getElementById('videoSpeed');

let currentStatsFilename = null;
let currentSpeedFilename = null;
let checkInterval = null;

// Event listeners
uploadArea.addEventListener('click', () => videoInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
videoInput.addEventListener('change', handleFileSelect);
downloadStatsBtn.addEventListener('click', () => handleDownload(currentStatsFilename));
downloadSpeedBtn.addEventListener('click', () => handleDownload(currentSpeedFilename));
backBtn.addEventListener('click', handleBack);

function handleDragOver(e) {
    e.preventDefault();
    uploadBox.style.borderColor = '#764ba2';
    uploadBox.style.background = '#f0f2ff';
}

function handleDrop(e) {
    e.preventDefault();
    uploadBox.style.borderColor = '#667eea';
    uploadBox.style.background = '#f8f9ff';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

async function handleFile(file) {
    // Validate file type
    const allowedExtensions = ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        alert('Định dạng file không được hỗ trợ!\n\nVui lòng chọn file: MP4, AVI, MOV, MKV, FLV, WMV');
        return;
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
        alert('File quá lớn!\n\nKích thước tối đa: 500MB\nKích thước file của bạn: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB');
        return;
    }

    // Show progress
    uploadBox.style.display = 'none';
    progressSection.style.display = 'block';
    progressFill.style.width = '10%';
    progressText.textContent = 'Đang tải lên file...';

    // Upload file
    const formData = new FormData();
    formData.append('video', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            // Nếu response không phải JSON, đọc text
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server trả về lỗi không hợp lệ');
        }
        
        if (response.ok) {
            currentStatsFilename = data.output_stats_filename;
            currentSpeedFilename = data.output_speed_filename;
            progressFill.style.width = '30%';
            progressText.textContent = 'File đã tải lên. Đang xử lý...';
            
            // Start checking status
            checkProcessingStatus(data.output_stats_filename);
        } else {
            const errorMsg = data.error || 'Không thể tải file lên';
            alert('Lỗi: ' + errorMsg);
            console.error('Upload error:', data);
            resetUpload();
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Lỗi khi tải file lên:\n\n' + error.message + '\n\nVui lòng kiểm tra kết nối và thử lại.');
        resetUpload();
    }
}

function checkProcessingStatus(filename) {
    progressFill.style.width = '50%';
    progressText.textContent = 'Đang phân tích demo...';
    let checkCount = 0;
    const maxChecks = 300; // Tối đa 10 phút (300 * 2 giây)

    checkInterval = setInterval(async () => {
        checkCount++;
        if (checkCount > maxChecks) {
            clearInterval(checkInterval);
            progressText.textContent = 'Xử lý mất quá nhiều thời gian. Vui lòng thử lại.';
            setTimeout(() => resetUpload(), 3000);
            return;
        }

        try {
            const response = await fetch(`/status/${filename}`);
            const data = await response.json();

            if (data.status === 'completed') {
                clearInterval(checkInterval);
                progressFill.style.width = '100%';
                progressText.textContent = 'Hoàn thành!';
                
                setTimeout(() => {
                    displayResults(data.stats, data.stats_filename, data.speed_filename);
                }, 500);
            } else if (data.status === 'processing') {
                const currentWidth = parseInt(progressFill.style.width);
                if (currentWidth < 90) {
                    progressFill.style.width = (currentWidth + 2) + '%';
                }
                progressText.textContent = `Đang xử lý... (${Math.round(currentWidth)}%)`;
            } else if (data.status === 'not_found') {
                // Chờ thêm
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    }, 2000);
}

function displayResults(stats, statsFilename, speedFilename) {
    // Hide progress, show results
    progressSection.style.display = 'none';
    resultsSection.style.display = 'block';

    // Update stats
    document.getElementById('countIn').textContent = stats.in || 0;
    document.getElementById('countOut').textContent = stats.out || 0;
    document.getElementById('countTotal').textContent = stats.total || 0;

    // Display classification
    displayClassification('inList', stats.by_class || {}, stats.in_items || {});
    displayClassification('outList', stats.by_class || {}, stats.out_items || {});

    // Set video sources - thử MP4 trước, sau đó AVI nếu không được
    if (statsFilename && videoStats) {
        const sourceStats = document.getElementById('videoStatsSource');
        const sourceStatsAvi = document.getElementById('videoStatsSourceAvi');
        const videoUrl = `/video/${statsFilename}`;
        
        if (sourceStats) {
            sourceStats.src = videoUrl;
            // Nếu MP4 không được, thử AVI
            if (sourceStatsAvi) {
                sourceStatsAvi.src = videoUrl.replace('.mp4', '.avi');
            }
        } else {
            videoStats.src = videoUrl;
        }
        
        videoStats.load();
        videoStats.play().catch(e => {
            console.log('Auto-play blocked, user needs to click play');
            // Thử load AVI nếu MP4 fail
            if (sourceStatsAvi) {
                sourceStatsAvi.src = videoUrl.replace('.mp4', '.avi');
                videoStats.load();
            }
        });
    }
    
    if (speedFilename && videoSpeed) {
        const sourceSpeed = document.getElementById('videoSpeedSource');
        const sourceSpeedAvi = document.getElementById('videoSpeedSourceAvi');
        const videoUrl = `/video/${speedFilename}`;
        
        if (sourceSpeed) {
            sourceSpeed.src = videoUrl;
            // Nếu MP4 không được, thử AVI
            if (sourceSpeedAvi) {
                sourceSpeedAvi.src = videoUrl.replace('.mp4', '.avi');
            }
        } else {
            videoSpeed.src = videoUrl;
        }
        
        videoSpeed.load();
        videoSpeed.play().catch(e => {
            console.log('Auto-play blocked, user needs to click play');
            // Thử load AVI nếu MP4 fail
            if (sourceSpeedAvi) {
                sourceSpeedAvi.src = videoUrl.replace('.mp4', '.avi');
                videoSpeed.load();
            }
        });
    }
}

function displayClassification(listId, byClass, items) {
    const listElement = document.getElementById(listId);
    listElement.innerHTML = '';

    if (!items || Object.keys(items).length === 0) {
        listElement.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Chưa có dữ liệu</p>';
        return;
    }

    // Sắp xếp theo số lượng giảm dần
    const sortedItems = Object.entries(items).sort((a, b) => b[1] - a[1]);

    for (const [className, count] of sortedItems) {
        const item = document.createElement('div');
        item.className = 'classification-item';
        item.innerHTML = `
            <span class="classification-name">${className}</span>
            <span class="classification-count">${count}</span>
        `;
        listElement.appendChild(item);
    }
}

function handleDownload(filename) {
    if (filename) {
        window.location.href = `/download/${filename}`;
    }
}

function handleBack() {
    // Reset everything
    currentStatsFilename = null;
    currentSpeedFilename = null;
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
    
    // Hide results, show upload
    resultsSection.style.display = 'none';
    uploadBox.style.display = 'block';
    progressSection.style.display = 'none';
    progressFill.style.width = '0%';
    videoInput.value = '';
    
    // Reset videos
    if (videoStats) {
        videoStats.src = '';
    }
    if (videoSpeed) {
        videoSpeed.src = '';
    }
}

function resetUpload() {
    handleBack();
}

