/**
 * 高级科学计算器 - Shunting-yard 算法实现
 */

class ScientificCalculator {
    constructor() {
        this.expression = '';
        this.result = 0;
        this.history = [];
        this.historyKey = 'calculator_history';
        this.loadHistory();
    }

    /**
     * 运算符优先级定义
     */
    getPrecedence(operator) {
        const precedences = {
            '^': 4,
            'func': 4,  // 函数调用
            '*': 3,
            '/': 3,
            '+': 2,
            '-': 2
        };
        return precedences[operator] || 0;
    }

    /**
     * 判断是否为右结合运算符
     */
    isRightAssociative(operator) {
        return operator === '^';
    }

    /**
     * 判断是否为运算符
     */
    isOperator(token) {
        return ['+', '-', '*', '/', '^'].includes(token);
    }

    /**
     * 判断是否为函数
     */
    isFunction(token) {
        return ['sin', 'cos', 'tan', 'log', 'sqrt', 'abs'].includes(token);
    }

    /**
     * 判断是否为常量
     */
    isConstant(token) {
        return token === 'PI' || token === 'E';
    }

    /**
     * 获取常量值
     */
    getConstant(token) {
        const constants = {
            'PI': Math.PI,
            'E': Math.E
        };
        return constants[token] || 0;
    }

    /**
     * 词法分析 - 将表达式转换为标记数组
     */
    tokenize(expression) {
        const tokens = [];
        let i = 0;
        const exp = expression.replace(/\s/g, '');

        while (i < exp.length) {
            let char = exp[i];

            // 处理数字（包括小数点）
            if (/[0-9.]/.test(char)) {
                let num = '';
                while (i < exp.length && /[0-9.]/.test(exp[i])) {
                    num += exp[i];
                    i++;
                }
                // 验证数字格式
                if (num.split('.').length > 2) {
                    throw new Error('无效的数字格式');
                }
                tokens.push({ type: 'number', value: parseFloat(num) });
                continue;
            }

            // 处理函数名
            if (/[a-zA-Z]/.test(char)) {
                let name = '';
                while (i < exp.length && /[a-zA-Z]/.test(exp[i])) {
                    name += exp[i];
                    i++;
                }

                if (this.isFunction(name)) {
                    tokens.push({ type: 'function', value: name });
                } else if (this.isConstant(name)) {
                    tokens.push({ type: 'number', value: this.getConstant(name) });
                } else {
                    throw new Error(`未知的函数或常量: ${name}`);
                }
                continue;
            }

            // 处理运算符
            if (this.isOperator(char)) {
                tokens.push({ type: 'operator', value: char });
                i++;
                continue;
            }

            // 处理括号
            if (char === '(') {
                tokens.push({ type: 'left_paren', value: char });
                i++;
                continue;
            }

            if (char === ')') {
                tokens.push({ type: 'right_paren', value: char });
                i++;
                continue;
            }

            throw new Error(`无效的字符: ${char}`);
        }

        return tokens;
    }

    /**
     * Shunting-yard 算法 - 将中缀表达式转换为后缀表达式（逆波兰表示法）
     */
    shuntingYard(tokens) {
        const output = [];
        const operators = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // 如果是数字，直接添加到输出队列
            if (token.type === 'number') {
                output.push(token);
            }
            // 如果是函数，压入运算符栈
            else if (token.type === 'function') {
                operators.push(token);
            }
            // 如果是运算符
            else if (token.type === 'operator') {
                while (
                    operators.length > 0 &&
                    operators[operators.length - 1].type === 'function'
                ) {
                    output.push(operators.pop());
                }

                while (
                    operators.length > 0 &&
                    operators[operators.length - 1].type === 'operator' &&
                    (
                        !this.isRightAssociative(token.value) &&
                        this.getPrecedence(token.value) <= this.getPrecedence(operators[operators.length - 1].value) ||
                        this.isRightAssociative(token.value) &&
                        this.getPrecedence(token.value) < this.getPrecedence(operators[operators.length - 1].value)
                    )
                ) {
                    output.push(operators.pop());
                }

                operators.push(token);
            }
            // 左括号
            else if (token.type === 'left_paren') {
                operators.push(token);
            }
            // 右括号
            else if (token.type === 'right_paren') {
                // 弹出运算符直到遇到左括号
                while (
                    operators.length > 0 &&
                    operators[operators.length - 1].type !== 'left_paren'
                ) {
                    output.push(operators.pop());
                }

                // 弹出左括号
                if (operators.length > 0) {
                    operators.pop();
                }

                // 如果栈顶是函数，弹出并添加到输出
                if (
                    operators.length > 0 &&
                    operators[operators.length - 1].type === 'function'
                ) {
                    output.push(operators.pop());
                }
            }
        }

        // 将剩余运算符全部弹出到输出队列
        while (operators.length > 0) {
            const op = operators.pop();
            if (op.type === 'left_paren' || op.type === 'right_paren') {
                throw new Error('括号不匹配');
            }
            output.push(op);
        }

        return output;
    }

    /**
     * 计算后缀表达式
     */
    evaluateRPN(rpnTokens) {
        const stack = [];

        for (const token of rpnTokens) {
            if (token.type === 'number') {
                stack.push(token.value);
            } else if (token.type === 'operator') {
                if (stack.length < 2) {
                    throw new Error('表达式无效');
                }

                const b = stack.pop();
                const a = stack.pop();
                let result;

                switch (token.value) {
                    case '+':
                        result = a + b;
                        break;
                    case '-':
                        result = a - b;
                        break;
                    case '*':
                        result = a * b;
                        break;
                    case '/':
                        if (Math.abs(b) < Number.EPSILON) {
                            throw new Error('除数不能为零');
                        }
                        result = a / b;
                        break;
                    case '^':
                        result = Math.pow(a, b);
                        break;
                    default:
                        throw new Error(`未知运算符: ${token.value}`);
                }

                stack.push(result);
            } else if (token.type === 'function') {
                if (stack.length < 1) {
                    throw new Error('表达式无效');
                }

                const a = stack.pop();
                let result;

                switch (token.value) {
                    case 'sin':
                        result = Math.sin(a);
                        break;
                    case 'cos':
                        result = Math.cos(a);
                        break;
                    case 'tan':
                        result = Math.tan(a);
                        break;
                    case 'log':
                        if (a <= 0) {
                            throw new Error('对数函数的参数必须大于零');
                        }
                        result = Math.log10(a);
                        break;
                    case 'sqrt':
                        if (a < 0) {
                            throw new Error('负数不能开平方根');
                        }
                        result = Math.sqrt(a);
                        break;
                    case 'abs':
                        result = Math.abs(a);
                        break;
                    default:
                        throw new Error(`未知函数: ${token.value}`);
                }

                stack.push(result);
            }
        }

        if (stack.length !== 1) {
            throw new Error('表达式无效');
        }

        return stack[0];
    }

    /**
     * 计算表达式
     */
    calculate(expression) {
        try {
            if (!expression || expression.trim() === '') {
                return { result: 0, error: null };
            }

            // 词法分析
            const tokens = this.tokenize(expression);

            // 转换为后缀表达式
            const rpnTokens = this.shuntingYard(tokens);

            // 计算结果
            const result = this.evaluateRPN(rpnTokens);

            // 处理精度问题
            const finalResult = this.handlePrecision(result);

            return { result: finalResult, error: null };
        } catch (error) {
            return { result: 0, error: error.message };
        }
    }

    /**
     * 处理浮点数精度问题
     */
    handlePrecision(num) {
        // 处理接近整数的浮点数
        const precision = 1e-10;
        if (Math.abs(num - Math.round(num)) < precision) {
            return Math.round(num);
        }

        // 处理特殊的浮点数情况
        if (Math.abs(num) < precision) {
            return 0;
        }

        // 保留合理的小数位数
        return parseFloat(num.toPrecision(12));
    }

    /**
     * 添加到历史记录
     */
    addToHistory(expression, result) {
        const historyItem = {
            expression,
            result,
            timestamp: new Date().toLocaleString('zh-CN')
        };

        this.history.unshift(historyItem);

        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history.pop();
        }

        this.saveHistory();
    }

    /**
     * 保存历史记录到本地存储
     */
    saveHistory() {
        try {
            localStorage.setItem(this.historyKey, JSON.stringify(this.history));
        } catch (e) {
            console.warn('无法保存历史记录到本地存储');
        }
    }

    /**
     * 从本地存储加载历史记录
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.historyKey);
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('无法从本地存储加载历史记录');
            this.history = [];
        }
    }

    /**
     * 清除历史记录
     */
    clearHistory() {
        this.history = [];
        try {
            localStorage.removeItem(this.historyKey);
        } catch (e) {
            console.warn('无法清除本地存储的历史记录');
        }
    }

    /**
     * 获取历史记录
     */
    getHistory() {
        return this.history;
    }

    /**
     * 格式化结果显示
     */
    formatResult(num) {
        if (Number.isNaN(num)) {
            return 'NaN';
        }

        if (!Number.isFinite(num)) {
            return num > 0 ? '∞' : '-∞';
        }

        // 科学记数法处理
        if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(6);
        }

        return String(num);
    }

    /**
     * 验证表达式语法
     */
    validateExpression(expression) {
        if (!expression || expression.trim() === '') {
            return { valid: false, error: '表达式为空' };
        }

        // 检查括号匹配
        let parenCount = 0;
        for (const char of expression) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (parenCount < 0) {
                return { valid: false, error: '括号不匹配' };
            }
        }

        if (parenCount !== 0) {
            return { valid: false, error: '括号不匹配' };
        }

        // 检查连续运算符
        if (/[+\-*/^]{2,}/.test(expression.replace(/\s/g, ''))) {
            return { valid: false, error: '连续的运算符' };
        }

        return { valid: true, error: null };
    }
}

// 导出为全局对象
window.ScientificCalculator = ScientificCalculator;
