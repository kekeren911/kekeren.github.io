/**
 * 函数绘图器 - 使用 HTML Canvas 绘制数学函数
 */

class FunctionPlotter {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scale = 50;  // 每单位的像素数
        this.offsetX = 0; // X轴偏移
        this.offsetY = 0; // Y轴偏移
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentFunction = null;

        this.initCanvas();
        this.setupEventListeners();
    }

    /**
     * 初始化画布
     */
    initCanvas() {
        // 设置画布尺寸
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // 设置高分辨率画布
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = 400 * dpr;

        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = '400px';

        this.ctx.scale(dpr, dpr);

        // 设置原点为中心
        this.offsetX = rect.width / 2;
        this.offsetY = 200;

        // 绘制初始网格
        this.draw();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 鼠标拖动
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

        // 触摸支持
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.onMouseUp());

        // 缩放控制
        document.querySelectorAll('.btn-zoom').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const zoom = e.target.dataset.zoom;
                if (zoom === 'in') this.zoomIn();
                else if (zoom === 'out') this.zoomOut();
                else if (zoom === 'reset') this.reset();
            });
        });

        // 窗口大小改变
        window.addEventListener('resize', () => this.initCanvas());
    }

    /**
     * 鼠标按下事件
     */
    onMouseDown(e) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * 鼠标移动事件
     */
    onMouseMove(e) {
        if (!this.isDragging) {
            // 显示坐标
            this.showCoordinates(e);
            return;
        }

        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;

        this.offsetX += dx;
        this.offsetY += dy;

        this.lastX = e.clientX;
        this.lastY = e.clientY;

        this.draw();
    }

    /**
     * 鼠标释放事件
     */
    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
    }

    /**
     * 触摸开始事件
     */
    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isDragging = true;
            this.lastX = touch.clientX;
            this.lastY = touch.clientY;
        }
    }

    /**
     * 触摸移动事件
     */
    onTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - this.lastX;
        const dy = touch.clientY - this.lastY;

        this.offsetX += dx;
        this.offsetY += dy;

        this.lastX = touch.clientX;
        this.lastY = touch.clientY;

        this.draw();
    }

    /**
     * 显示当前位置的坐标
     */
    showCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 转换为数学坐标
        const mathX = (x - this.offsetX) / this.scale;
        const mathY = -(y - this.offsetY) / this.scale;

        this.canvas.title = `x: ${mathX.toFixed(2)}, y: ${mathY.toFixed(2)}`;
    }

    /**
     * 放大
     */
    zoomIn() {
        this.scale *= 1.5;
        this.draw();
    }

    /**
     * 缩小
     */
    zoomOut() {
        this.scale /= 1.5;
        this.draw();
    }

    /**
     * 重置视图
     */
    reset() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        this.scale = 50;
        this.offsetX = rect.width / 2;
        this.offsetY = 200;
        this.draw();
    }

    /**
     * 绘制图表
     */
    draw() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // 清除画布
        this.ctx.clearRect(0, 0, width, height);

        // 绘制网格
        this.drawGrid(width, height);

        // 绘制坐标轴
        this.drawAxes(width, height);

        // 绘制函数
        if (this.currentFunction) {
            this.drawFunction(width, height);
        }
    }

    /**
     * 绘制网格
     */
    drawGrid(width, height) {
        this.ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--canvas-grid').trim() || '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // 计算网格间距
        let gridSize = this.scale;
        while (gridSize < 20) gridSize *= 2;
        while (gridSize > 100) gridSize /= 2;

        // 绘制垂直线
        const startX = this.offsetX % gridSize;
        for (let x = startX; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        // 绘制水平线
        const startY = this.offsetY % gridSize;
        for (let y = startY; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    /**
     * 绘制坐标轴
     */
    drawAxes(width, height) {
        const axisColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--canvas-axis').trim() || '#999999';

        this.ctx.strokeStyle = axisColor;
        this.ctx.lineWidth = 2;

        const rect = this.canvas.getBoundingClientRect();

        // X轴
        if (this.offsetY >= 0 && this.offsetY <= height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.offsetY);
            this.ctx.lineTo(width, this.offsetY);
            this.ctx.stroke();
        }

        // Y轴
        if (this.offsetX >= 0 && this.offsetX <= rect.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, 0);
            this.ctx.lineTo(this.offsetX, height);
            this.ctx.stroke();
        }

        // 绘制刻度标签
        this.drawAxisLabels(width, height, gridSize = this.scale);
    }

    /**
     * 绘制坐标轴标签
     */
    drawAxisLabels(width, height, gridSize) {
        this.ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-secondary').trim() || '#666666';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        // X轴标签
        let labelStep = 1;
        if (this.scale < 20) labelStep = 5;
        if (this.scale < 10) labelStep = 10;

        for (let i = -100; i <= 100; i += labelStep) {
            if (i === 0) continue;

            const x = this.offsetX + i * this.scale;
            if (x < -50 || x > width + 50) continue;

            // 标签位置
            let labelY = this.offsetY + 5;
            if (labelY < 0) labelY = 5;
            if (labelY > height - 20) labelY = height - 20;

            this.ctx.fillText(i.toString(), x, labelY);
        }

        // Y轴标签
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (let i = -100; i <= 100; i += labelStep) {
            if (i === 0) continue;

            const y = this.offsetY - i * this.scale;
            if (y < -50 || y > height + 50) continue;

            // 标签位置
            let labelX = this.offsetX - 5;
            if (labelX < 30) labelX = 30;
            if (labelX > width - 10) labelX = width - 10;

            this.ctx.fillText(i.toString(), labelX, y);
        }

        // 原点标签
        if (this.offsetX > 0 && this.offsetX < width &&
            this.offsetY > 0 && this.offsetY < height) {
            this.ctx.fillText('O', this.offsetX - 5, this.offsetY + 5);
        }
    }

    /**
     * 绘制函数曲线
     */
    drawFunction(width, height) {
        if (!this.currentFunction) return;

        this.ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-color').trim() || '#4a90d9';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        let isFirstPoint = true;
        let lastY = null;

        // 绘制多个点以形成平滑曲线
        for (let pixelX = 0; pixelX < width; pixelX += 1) {
            // 将像素坐标转换为数学坐标
            const mathX = (pixelX - this.offsetX) / this.scale;

            try {
                // 计算函数值
                const mathY = this.evaluateFunction(mathX);

                // 验证结果
                if (!isFinite(mathY) || isNaN(mathY) || Math.abs(mathY) > 1000) {
                    isFirstPoint = true;
                    continue;
                }

                // 转换为像素坐标
                const pixelY = this.offsetY - mathY * this.scale;

                // 检测不连续点（如tan函数的渐近线）
                if (lastY !== null && Math.abs(pixelY - lastY) > height / 2) {
                    isFirstPoint = true;
                }

                if (isFirstPoint) {
                    this.ctx.moveTo(pixelX, pixelY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(pixelX, pixelY);
                }

                lastY = pixelY;
            } catch (error) {
                isFirstPoint = true;
                lastY = null;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 计算函数值（使用计算器的解析器）
     */
    evaluateFunction(x) {
        if (!window.calculator) {
            throw new Error('计算器未初始化');
        }

        // 将函数中的 x 替换为实际值
        let expr = this.currentFunction.replace(/x/g, `(${x})`);

        // 使用计算器计算
        const result = window.calculator.calculate(expr);

        if (result.error) {
            throw new Error(result.error);
        }

        return result.result;
    }

    /**
     * 设置要绘制的函数
     */
    setFunction(expression) {
        // 标准化表达式
        expr = expression.toLowerCase().replace(/\s/g, '');

        // 验证表达式包含 x
        if (!expr.includes('x')) {
            throw new Error('函数必须包含变量 x');
        }

        // 简单验证
        try {
            // 测试计算
            this.currentFunction = expr;
            this.evaluateFunction(0);
        } catch (error) {
            this.currentFunction = null;
            throw error;
        }

        this.draw();
    }

    /**
     * 清除函数
     */
    clear() {
        this.currentFunction = null;
        this.draw();
    }

    /**
     * 导出为图片
     */
    exportAsImage() {
        const link = document.createElement('a');
        link.download = `function_plot_${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// 导出为全局对象
window.FunctionPlotter = FunctionPlotter;
