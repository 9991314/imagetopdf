    const state = { images: [] };
    const input = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const imageList = document.getElementById('imageList');
    const queueFooter = document.getElementById('queueFooter');
    const fileCount = document.getElementById('fileCount');
    const exportButton = document.getElementById('exportButton');
    const pageMini = document.getElementById('pageMini');
    const previewLabel = document.getElementById('previewLabel');
    const previewDetail = document.getElementById('previewDetail');
    const errorMessage = document.getElementById('errorMessage');
    const statusMessage = document.getElementById('statusMessage');
    let dragSourceIndex = null;

    lucide.createIcons();

    function formatSize(bytes) {
      if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    function getSettings() {
      return {
        size: document.getElementById('pageSize').value,
        orientation: document.querySelector('input[name="orientation"]:checked').value,
        fit: document.querySelector('input[name="fit"]:checked').value,
        margin: Math.max(0, Math.min(50, Number(document.getElementById('margin').value) || 0)),
        name: document.getElementById('pdfName').value.trim() || '我的图片文档'
      };
    }

    function renderPreview() {
      const settings = getSettings();
      const sizeName = { a4: 'A4', a5: 'A5', letter: 'Letter' }[settings.size];
      const orientationName = { auto: '自动方向', portrait: '纵向', landscape: '横向' }[settings.orientation];
      previewDetail.textContent = `${sizeName} · ${orientationName} · ${settings.margin} mm 边距`;
      pageMini.textContent = state.images.length;
      previewLabel.textContent = state.images.length ? `将导出 ${state.images.length} 页 PDF` : '等待添加图片';
    }

    function render() {
      fileCount.textContent = `${state.images.length} 张图片`;
      exportButton.disabled = state.images.length === 0;
      queueFooter.hidden = state.images.length === 0;
      dropZone.hidden = state.images.length > 0;
      imageList.innerHTML = '';
      state.images.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'image-card';
        card.draggable = true;
        card.dataset.index = index;
        card.innerHTML = `
          <div class="drag-handle" title="拖动调整顺序" aria-hidden="true"><i data-lucide="grip-vertical"></i></div>
          <div class="thumbnail-wrap"><img class="thumbnail" src="${item.url}" alt="${escapeHtml(item.file.name)}" style="transform: rotate(${item.rotation}deg) scale(${item.rotation % 180 ? 1.25 : 1})" /></div>
          <div class="file-meta"><div class="file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</div><div class="file-info">第 ${index + 1} 页 · ${formatSize(item.file.size)} · ${item.rotation ? `${item.rotation}°` : '原始方向'}</div></div>
          <div class="card-actions">
            <button class="icon-button" type="button" data-action="rotate" data-index="${index}" title="顺时针旋转 90 度" aria-label="顺时针旋转 ${escapeHtml(item.file.name)}"><i data-lucide="rotate-cw"></i></button>
            <button class="icon-button remove" type="button" data-action="remove" data-index="${index}" title="移除此图片" aria-label="移除 ${escapeHtml(item.file.name)}"><i data-lucide="x"></i></button>
          </div>`;
        imageList.appendChild(card);
      });
      lucide.createIcons();
      renderPreview();
    }

    function escapeHtml(value) {
      return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }

    function showStatus(message) {
      statusMessage.textContent = message;
      statusMessage.classList.add('show');
      window.clearTimeout(showStatus.timeout);
      showStatus.timeout = window.setTimeout(() => statusMessage.classList.remove('show'), 2800);
    }

    function addFiles(files) {
      const selected = Array.from(files).filter(file => file.type.startsWith('image/'));
      const rejected = Array.from(files).length - selected.length;
      selected.forEach(file => state.images.push({ file, url: URL.createObjectURL(file), rotation: 0 }));
      if (rejected) errorMessage.textContent = `已跳过 ${rejected} 个非图片文件。`;
      else errorMessage.textContent = '';
      if (selected.length) showStatus(`已添加 ${selected.length} 张图片`);
      render();
    }

    function openFileDialog() { input.click(); }
    document.getElementById('selectButton').addEventListener('click', event => { event.stopPropagation(); openFileDialog(); });
    document.getElementById('addMoreButton').addEventListener('click', openFileDialog);
    input.addEventListener('change', event => { addFiles(event.target.files); input.value = ''; });
    dropZone.addEventListener('click', openFileDialog);
    dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFileDialog(); } });
    ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('is-dragover'); }));
    ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('is-dragover'); }));
    dropZone.addEventListener('drop', event => addFiles(event.dataTransfer.files));

    imageList.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const index = Number(button.dataset.index);
      if (button.dataset.action === 'rotate') state.images[index].rotation = (state.images[index].rotation + 90) % 360;
      if (button.dataset.action === 'remove') {
        URL.revokeObjectURL(state.images[index].url);
        state.images.splice(index, 1);
        showStatus('已从队列中移除图片');
      }
      render();
    });

    imageList.addEventListener('dragstart', event => {
      const card = event.target.closest('.image-card');
      if (!card) return;
      dragSourceIndex = Number(card.dataset.index);
      card.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
    });
    imageList.addEventListener('dragend', event => { const card = event.target.closest('.image-card'); if (card) card.classList.remove('dragging'); });
    imageList.addEventListener('dragover', event => event.preventDefault());
    imageList.addEventListener('drop', event => {
      event.preventDefault();
      const card = event.target.closest('.image-card');
      if (!card || dragSourceIndex === null) return;
      const destination = Number(card.dataset.index);
      if (destination !== dragSourceIndex) {
        const [moved] = state.images.splice(dragSourceIndex, 1);
        state.images.splice(destination, 0, moved);
        render();
      }
      dragSourceIndex = null;
    });

    document.querySelectorAll('#pageSize, #margin, #pdfName, input[name="orientation"], input[name="fit"]').forEach(control => control.addEventListener('input', renderPreview));
    document.querySelectorAll('input[name="orientation"], input[name="fit"]').forEach(control => control.addEventListener('change', renderPreview));

    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      });
    }

    function rotatedDataUrl(image, rotation) {
      if (!rotation) return image.src;
      const canvas = document.createElement('canvas');
      const sideways = rotation % 180 !== 0;
      canvas.width = sideways ? image.naturalHeight : image.naturalWidth;
      canvas.height = sideways ? image.naturalWidth : image.naturalHeight;
      const context = canvas.getContext('2d');
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(rotation * Math.PI / 180);
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
      return canvas.toDataURL('image/jpeg', .92);
    }

    async function exportPdf() {
      errorMessage.textContent = '';
      if (!window.jspdf) { errorMessage.textContent = 'PDF 组件未能加载。请检查网络连接后重试。'; return; }
      const settings = getSettings();
      exportButton.disabled = true;
      exportButton.innerHTML = '<i data-lucide="loader-circle" class="spin"></i>正在生成 PDF';
      lucide.createIcons();
      try {
        const { jsPDF } = window.jspdf;
        let pdf;
        for (let index = 0; index < state.images.length; index += 1) {
          const item = state.images[index];
          const image = await loadImage(item.url);
          const source = rotatedDataUrl(image, item.rotation);
          const imageWidth = item.rotation % 180 ? image.naturalHeight : image.naturalWidth;
          const imageHeight = item.rotation % 180 ? image.naturalWidth : image.naturalHeight;
          const orientation = settings.orientation === 'auto' ? (imageWidth > imageHeight ? 'landscape' : 'portrait') : settings.orientation;
          if (!pdf) pdf = new jsPDF({ orientation, unit: 'mm', format: settings.size, compress: true });
          else pdf.addPage(settings.size, orientation);
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = Math.min(settings.margin, Math.max(0, pageWidth / 2 - 1), Math.max(0, pageHeight / 2 - 1));
          const usableWidth = pageWidth - margin * 2;
          const usableHeight = pageHeight - margin * 2;
          let drawWidth = usableWidth;
          let drawHeight = usableHeight;
          if (settings.fit === 'contain') {
            const scale = Math.min(usableWidth / imageWidth, usableHeight / imageHeight);
            drawWidth = imageWidth * scale;
            drawHeight = imageHeight * scale;
          } else if (settings.fit === 'cover') {
            const scale = Math.max(usableWidth / imageWidth, usableHeight / imageHeight);
            drawWidth = imageWidth * scale;
            drawHeight = imageHeight * scale;
          }
          const x = margin + (usableWidth - drawWidth) / 2;
          const y = margin + (usableHeight - drawHeight) / 2;
          pdf.addImage(source, 'JPEG', x, y, drawWidth, drawHeight, undefined, 'FAST');
        }
        pdf.save(`${settings.name.replace(/[\\/:*?"<>|]/g, '-')}.pdf`);
        showStatus('PDF 已开始下载');
      } catch (error) {
        console.error(error);
        errorMessage.textContent = '无法生成 PDF。请尝试使用 JPG、PNG 或较小的图片文件。';
      } finally {
        exportButton.innerHTML = '<i data-lucide="download"></i>导出 PDF';
        exportButton.disabled = state.images.length === 0;
        lucide.createIcons();
      }
    }
    exportButton.addEventListener('click', exportPdf);
