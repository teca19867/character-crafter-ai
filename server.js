// Security Warning: This proxy server handles API keys, please ensure not to commit configurations containing real keys to version control
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { execSync } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3001;

// 检查并清理端口占用
function checkAndClearPort(port) {
  try {
    console.log(`🔍 检查端口 ${port} 占用情况...`);
    
    // Windows系统使用netstat检查端口占用
    const result = execSync(`netstat -ano | findstr :${port}`).toString();
    
    if (result.trim()) {
      console.log(`⚠️  端口 ${port} 被占用，正在清理...`);
      
      // 提取PID并终止进程
      const lines = result.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const match = line.trim().split(/\s+/);
        if (match.length >= 5) {
          const pid = match[match.length - 1];
          pids.add(pid);
        }
      });
      
      pids.forEach(pid => {
        try {
          console.log(`🛑 终止进程 PID: ${pid}`);
          execSync(`taskkill /PID ${pid} /F`);
          console.log(`✅ 成功终止进程 ${pid}`);
        } catch (killError) {
          console.warn(`⚠️  无法终止进程 ${pid}:`, killError.message);
        }
      });
      
      // 等待一小段时间让系统释放端口
      console.log('⏳ 等待端口释放...');
      execSync('timeout /t 2 /nobreak >nul');
    } else {
      console.log(`✅ 端口 ${port} 空闲`);
    }
    
  } catch (error) {
    // netstat没有找到占用端口是正常情况
    if (error.status === 1) {
      console.log(`✅ 端口 ${port} 空闲`);
    } else {
      console.warn(`⚠️  端口检查失败:`, error.message);
    }
  }
}

// 在启动前检查并清理端口
checkAndClearPort(PORT);

// 启用CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// 解析JSON请求体
app.use(express.json());

// BFL API代理
app.use('/api/bfl', createProxyMiddleware({
  target: 'https://api.bfl.ml',
  changeOrigin: true,
  pathRewrite: {
    '^/api/bfl': '/v1'
  },
  timeout: 60000, // 增加到60秒超时
  proxyTimeout: 60000,
  secure: false, // 允许自签名证书
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 [PROXY] 代理请求:', req.method, req.url);
    console.log('📤 [PROXY] 目标URL:', proxyReq.path);
    console.log('📋 [PROXY] 请求头:', proxyReq.getHeaders());
    console.log('📦 [PROXY] 请求体长度:', req.body ? JSON.stringify(req.body).length : 0);
    
    // 记录请求体内容（调试用）
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📝 [PROXY] 请求体预览:', JSON.stringify(req.body).substring(0, 200) + '...');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('📡 [PROXY] 响应状态:', proxyRes.statusCode);
    console.log('📋 [PROXY] 响应头:', Object.keys(proxyRes.headers));
    
    // 记录响应内容长度
    const contentLength = proxyRes.headers['content-length'];
    if (contentLength) {
      console.log('📄 [PROXY] 响应内容长度:', contentLength);
    }
  },
  onError: (err, req, res) => {
    console.error('❌ [PROXY] 代理错误:', err.message);
    console.error('❌ [PROXY] 错误代码:', err.code);
    console.error('❌ [PROXY] 错误堆栈:', err.stack);
    
    // 记录请求详情以便调试
    console.error('📝 [PROXY] 错误发生时的请求:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      bodyLength: req.body ? JSON.stringify(req.body).length : 0
    });
    
    let errorMessage = 'Proxy error: ' + err.message;
    if (err.code === 'ECONNRESET') {
      errorMessage = 'BFL服务器连接被重置。可能原因：请求过大、服务器负载高、API密钥问题或网络不稳定。建议：1) 检查API密钥有效性 2) 减少请求内容 3) 稍后重试';
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = 'BFL服务器拒绝连接。服务器可能宕机或维护中。';
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = '请求超时。BFL服务器响应时间过长，建议稍后重试。';
    } else if (err.code === 'HPE_INVALID_HEADER_TOKEN') {
      errorMessage = '无效的HTTP头格式。请检查请求头设置。';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      code: err.code,
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// BFL API测试端点
app.post('/test-bfl', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    console.log('🧪 [TEST] 测试BFL API连接...');
    console.log('🔑 [TEST] API密钥长度:', apiKey.length);
    
    const testResponse = await fetch('https://api.bfl.ml/v1/flux-pro-1.1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key': apiKey,
      },
      body: JSON.stringify({
        prompt: 'test image',
        width: 512,
        height: 512,
        safety_tolerance: 6,
        output_format: 'jpeg'
      }),
    });
    
    console.log('📡 [TEST] 响应状态:', testResponse.status);
    console.log('📋 [TEST] 响应头:', Object.fromEntries(testResponse.headers.entries()));
    
    const responseText = await testResponse.text();
    console.log('📄 [TEST] 响应内容:', responseText);
    
    if (testResponse.ok) {
      const result = JSON.parse(responseText);
      res.json({ 
        success: true, 
        status: testResponse.status,
        taskId: result.id,
        message: 'BFL API connection successful'
      });
    } else {
      res.json({ 
        success: false, 
        status: testResponse.status,
        error: responseText,
        message: 'BFL API returned error'
      });
    }
    
  } catch (error) {
    console.error('❌ [TEST] 测试失败:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      code: error.code,
      message: 'Failed to test BFL API connection'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [PROXY] 代理服务器启动在端口 ${PORT}`);
  console.log(`🌐 [PROXY] 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔗 [PROXY] BFL代理: http://localhost:${PORT}/api/bfl`);
});
