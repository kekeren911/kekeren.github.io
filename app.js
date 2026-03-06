/**
 * 应用程序主文件 - 集成所有功能
 */

// 初始化计算器
const calculator = new ScientificCalculator();
window.calculator = calculator; // 暴露给绘图器使用

// 初始化绘图器
let plotter;
let isHistoryVisible = false;

// DOM 元素引用
const elements = {
    expression: document.getElementById('expression'),
    result: document.getElementById('result'),
    errorMessage: document.getElementById('error-message'),
    historyList: document.getElementById('history-list'),
    historyPanel: document.getElementById('history-panel'),
    toggleHistoryBtn: document.getElementById('toggle-history'),
    functionInput: document.getElementById('function-input')
};

// 当页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeCalculator();
    initializeTheme();
    initializeKeyboard();
    initializePlotter();
    renderHistory();
});

/**
 * 初始化计算器功能
 */
function initializeCalculator() {
    // 为所有按钮添加事件监听器
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });

    // 历史记录切换
    elements.toggleHistoryBtn.addEventListener('click', toggleHistory);

    // 清除历史记录
    document.getElementById('clear-history').addEventListener('click', clearHistory);

    // 绘图按钮
    document.getElementById('plot-btn').addEventListener('click', plotFunction);
    document.getElementById('clear-plot-btn').addEventListener('click', clearPlot);
}

/**
 * 处理按钮点击
 */
function handleButtonClick(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const value = button.dataset.value;

    switch (action) {
        case 'number':
            inputNumber(value);
            break;
        case 'operator':
            inputOperator(value);
            break;
        case 'function':
            inputFunction(value);
            break;
        case 'constant':
            inputConstant(value);
            break;
        case 'equals':
            calculate();
            break;
        case 'clear':
            clearAll();
            break;
        case 'backspace':
            backspace();
            break;
    }

    updateDisplay();
}

/**
 * 输入数字
 */
function inputNumber(num) {
    calculator.expression += num;
}

/**
 * 输入运算符
 */
function inputOperator(op) {
    calculator.expression += op;
}

/**
 * 输入函数
 */
function inputFunction(func) {
    calculator.expression += func;
}

/**
 * 输入常量
 */
function inputConstant(constant) {
    calculator.expression += constant;
}

/**
 * 计算结果
 */
function calculate() {
    const expression = calculator.expression;

    // 验证表达式
    const validation = calculator.validateExpression(expression);
    if (!validation.valid) {
        showError(validation.error);
        return;
    }

    // 计算
    const { result, error } = calculator.calculate(expression);

    if (error) {
        showError(error);
        return;
    }

    // 添加到历史记录
    calculator.addToHistory(expression, result);

    // 更新显示
    calculator.expression = result.toString();
    clearError();

    // 更新历史记录显示
    renderHistory();
}

/**
 * 清除所有
 */
function clearAll() {
    calculator.expression = '';
    elements.result.textContent = '0';
    elements.expression.textContent = '';
    clearError();
}

/**
 * 退格
 */
function backspace() {
    calculator.expression = calculator.expression.slice(0, -1);
}

/**
 * 更新显示
 */
function updateDisplay() {
    elements.expression.textContent = calculator.expression || '';
}

/**
 * 显示错误
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.display?.classList.add('error');

    // 3秒后自动清除错误
    setTimeout(() => {
        clearError();
    }, 3000);
}

/**
 * 清除错误
 */
function clearError() {
    elements.errorMessage.textContent = '';
    elements.display?.classList.remove('error');
}

/**
 * 切换历史记录显示
 */
function toggleHistory() {
    isHistoryVisible = !isHistoryVisible;
    elements.historyPanel.classList.toggle('hidden', !isHistoryVisible);
    elements.toggleHistoryBtn.classList.toggle('active', isHistoryVisible);
}

/**
 * 渲染历史记录
 */
function renderHistory() {
    const history = calculator.getHistory();

    if (history.length === 0) {
        elements.historyList.innerHTML = '<div class="empty-history">暂无历史记录</div>';
        return;
    }

    elements.historyList.innerHTML = history.map((item, index) => `
        <div class="history-item" data-index="${index}">
            <div class="history-expression">${escapeHtml(item.expression)} =</div>
            <div class="history-result">${calculator.formatResult(item.result)}</div>
            <div class="history-time">${item.timestamp}</div>
        </div>
    `).join('');

    // 添加历史记录项点击事件
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            const historyItem = history[index];
            calculator.expression = historyItem.result.toString();
            updateDisplay();
        });
    });
}

/**
 * 清除历史记录
 */
function clearHistory() {
    if (confirm('确定要清除所有历史记录吗？')) {
        calculator.clearHistory();
        renderHistory();
    }
}

/**
 * 初始化主题系统
 */
function initializeTheme() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('calculator_theme') || 'light';

    // 设置初始主题
    setTheme(savedTheme);

    // 为主题按钮添加事件监听器
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
        });
    });
}

/**
 * 设置主题
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calculator_theme', theme);

    // 更新主题按钮状态
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    // 重新绘制图表以应用新主题
    if (plotter) {
        plotter.draw();
    }
}

/**
 * 初始化键盘支持
 */
function initializeKeyboard() {
    document.addEventListener('keydown', handleKeyPress);
}

/**
 * 处理键盘按键
 */
function handleKeyPress(event) {
    const key = event.key;

    // 阻止某些默认行为
    if (['Enter', 'Escape', 'Backspace'].includes(key)) {
        event.preventDefault();
    }

    // 数字和运算符
    if (/^[0-9.+\-*/^()]$/.test(key)) {
        calculator.expression += key;
        updateDisplay();
        return;
    }

    // Enter 或 = 计算结果
    if (key === 'Enter' || key === '=') {
        calculate();
        return;
    }

    // Escape 清除
    if (key === 'Escape') {
        clearAll();
        return;
    }

    // Backspace 退格
    if (key === 'Backspace') {
        backspace();
        updateDisplay();
        return;
    }

    // Delete 清除
    if (key === 'Delete') {
        clearAll();
        return;
    }

    // 函数快捷键
    const functionKeys = {
        's': 'sin(',
        'c': 'cos(',
        't': 'tan(',
        'l': 'log(',
        'r': 'sqrt(',
        'p': 'PI',
        'e': 'E'
    };

    if (event.ctrlKey || event.metaKey) {
        if (functionKeys[key.toLowerCase()]) {
            event.preventDefault();
            calculator.expression += functionKeys[key.toLowerCase()];
            updateDisplay();
        }
    }
}

/**
 * 初始化绘图器
 */
function initializePlotter() {
    plotter = new FunctionPlotter('plotter-canvas');

    // 回车键绘图
    elements.functionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            plotFunction();
        }
    });
}

/**
 * 绘制函数
 */
function plotFunction() {
    const expression = elements.functionInput.value.trim();

    if (!expression) {
        alert('请输入函数表达式');
        return;
    }

    try {
        plotter.setFunction(expression);
    } catch (error) {
        alert(`绘图错误: ${error.message}`);
    }
}

/**
 * 清除绘图
 */
function clearPlot() {
    plotter.clear();
}

/**
 * HTML转义（防止XSS攻击）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 平滑滚动到元素
 */
function scrollToElement(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 为移动设备添加触摸反馈
if ('ontouchstart' in window) {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        });

        button.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
    });
}

// 防止移动设备双击缩放
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

let lastTouchEnd = 0;

// 导出API供外部使用
window.CalculatorApp = {
    calculate: (expr) => calculator.calculate(expr),
    setTheme: setTheme,
    plot: (expr) => plotter.setFunction(expr),
    clearPlot: () => plotter.clear(),
    getHistory: () => calculator.getHistory(),
    clearHistory: () => {
        calculator.clearHistory();
        renderHistory();
    }
};
