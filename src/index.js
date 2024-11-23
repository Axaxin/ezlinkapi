// 处理请求的主要函数
async function handleRequest(request, env) {
  const url = new URL(request.url);
  
  // 检查是否是订阅路由
  if (url.pathname.startsWith('/sub/')) {
    return handleSubscription(request, env);
  }
  
  // 检查登录状态
  const cookie = request.headers.get('Cookie') || '';
  const isLoggedIn = cookie.includes('session=');
  
  // 路由处理
  if (url.pathname === '/') {
    return isLoggedIn ? handleHome(request, env) : handleLoginPage(request);
  } else if (url.pathname === '/api/login') {
    return handleLogin(request, env);
  } else if (url.pathname === '/api/logout') {
    return handleLogout(request);
  } else if (url.pathname === '/api/config') {
    return handleConfig(request, env);
  }

  return new Response('Not Found', { status: 404 });
}

// 处理登录页面
async function handleLoginPage(request) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>登录 - EzLink Subscription Manager</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .login-form {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        input {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            opacity: 0.9;
        }
        .message {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
        }
        .error {
            background-color: #ffebee;
            color: #c62828;
        }
        .success {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
    </style>
</head>
<body>
    <div class="login-form">
        <h2>登录</h2>
        <form id="loginForm">
            <input type="password" id="password" placeholder="请输入密码" required>
            <button type="submit">登录</button>
        </form>
        <div id="message"></div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
            
            const result = await response.json();
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = result.message;
            messageDiv.className = 'message ' + (response.ok ? 'success' : 'error');
            
            if (response.ok) {
                window.location.href = '/';
            }
        });
    </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

// 处理主页请求
async function handleHome(request, env) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>EzLink API 配置管理</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .button-group {
            display: flex;
            gap: 10px;
        }
        input, textarea {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button.secondary {
            background-color: #757575;
        }
        button.danger {
            background-color: #f44336;
        }
        button:hover {
            opacity: 0.9;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
            background-color: white;
            margin: 10% auto;
            padding: 20px;
            width: 80%;
            max-width: 600px;
            border-radius: 8px;
        }
        .close {
            float: right;
            cursor: pointer;
            font-size: 24px;
        }
        .config-list {
            margin-top: 20px;
        }
        .config-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .error {
            color: #f44336;
            margin-top: 5px;
            font-size: 14px;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EzLink API 配置管理</h1>
            <div class="button-group">
                <button onclick="showConfigModal()">新建配置</button>
                <button class="danger" onclick="logout()">登出</button>
            </div>
        </div>
        
        <div id="configList" class="config-list">
            <!-- 配置列表将通过JavaScript动态加载 -->
        </div>
    </div>

    <!-- 配置表单模态框 -->
    <div id="configModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="hideConfigModal()">&times;</span>
            <h2 id="modalTitle">新建配置</h2>
            <form id="configForm" onsubmit="saveConfig(event)">
                <input type="hidden" id="configId">
                <div>
                    <label for="name">配置名称</label>
                    <input type="text" id="name" required pattern="[^\\p{P}\\s]+" title="不允许包含标点符号和空格">
                    <div class="error" id="nameError"></div>
                </div>
                <div>
                    <label for="backendUrl">后端地址</label>
                    <input type="url" id="backendUrl" required placeholder="请输入后端服务器地址">
                </div>
                <div>
                    <label for="subscribeUrls">订阅地址（每行一个）</label>
                    <textarea id="subscribeUrls" rows="5" required></textarea>
                </div>
                <div>
                    <label for="proxyTag">链式代理tag</label>
                    <input type="text" id="proxyTag" pattern="[^\\p{P}\\s]+" title="不允许包含标点符号和空格">
                    <div class="error" id="proxyTagError"></div>
                </div>
                <div class="button-group">
                    <button type="submit">保存</button>
                    <button type="button" class="secondary" onclick="hideConfigModal()">取消</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // 检查登录状态
        async function checkAuth() {
            const response = await fetch('/api/config');
            if (response.status === 401) {
                window.location.href = '/';
            }
        }

        // 加载配置列表
        async function loadConfigs() {
            const response = await fetch('/api/config');
            if (response.ok) {
                const configs = await response.json();
                const listHtml = configs.map(config => \`
                    <div class="config-item">
                        <div>
                            <strong>\${config.name}</strong>
                            <br>
                            <small>最后更新: \${new Date(config.lastSaved).toLocaleString()}</small>
                        </div>
                        <div class="button-group">
                            <button onclick="editConfig('\${config.id}')">编辑</button>
                            <button class="danger" onclick="deleteConfig('\${config.id}')">删除</button>
                        </div>
                    </div>
                \`).join('');
                document.getElementById('configList').innerHTML = listHtml;
            }
        }

        // 显示配置模态框
        function showConfigModal(config = null) {
            document.getElementById('configModal').style.display = 'block';
            document.getElementById('modalTitle').textContent = config ? '编辑配置' : '新建配置';
            document.getElementById('configForm').reset();
            
            if (config) {
                document.getElementById('configId').value = config.id;
                document.getElementById('name').value = config.name;
                document.getElementById('backendUrl').value = config.backendUrl;
                document.getElementById('subscribeUrls').value = config.subscribeUrls.join('\\n');
                document.getElementById('proxyTag').value = config.proxyTag || '';
            } else {
                document.getElementById('configId').value = '';
            }
        }

        // 隐藏配置模态框
        function hideConfigModal() {
            document.getElementById('configModal').style.display = 'none';
            document.getElementById('configForm').reset();
            document.getElementById('nameError').textContent = '';
            document.getElementById('proxyTagError').textContent = '';
        }

        // 保存配置
        async function saveConfig(event) {
            event.preventDefault();
            const form = event.target;
            const configId = document.getElementById('configId').value;
            
            const config = {
                name: form.name.value,
                backendUrl: form.backendUrl.value,
                subscribeUrls: form.subscribeUrls.value.split('\\n').filter(url => url.trim()),
                proxyTag: form.proxyTag.value
            };

            const response = await fetch(\`/api/config\${configId ? '?id=' + configId : ''}\`, {
                method: configId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                hideConfigModal();
                await loadConfigs();  // 重新加载配置列表
            } else {
                const error = await response.json();
                if (error.field) {
                    document.getElementById(\`\${error.field}Error\`).textContent = error.message;
                }
            }
        }

        // 编辑配置
        async function editConfig(id) {
            const response = await fetch(\`/api/config?id=\${id}\`);
            if (response.ok) {
                const config = await response.json();
                showConfigModal(config);
            }
        }

        // 删除配置
        async function deleteConfig(id) {
            if (confirm('确定要删除这个配置吗？')) {
                const response = await fetch(\`/api/config?id=\${id}\`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    await loadConfigs();  // 重新加载配置列表
                }
            }
        }

        // 登出
        async function logout() {
            const response = await fetch('/api/logout', { method: 'POST' });
            if (response.ok) {
                window.location.reload();
            }
        }

        // 初始化
        checkAuth();
        loadConfigs();
    </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

// 处理登出请求
async function handleLogout(request) {
  return new Response(JSON.stringify({ message: 'Logged out' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    },
  });
}

// 处理配置API请求
async function handleConfig(request, env) {
  // 验证cookie
  const cookie = request.headers.get('Cookie') || '';
  if (!cookie.includes('session=')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const configId = url.searchParams.get('id');

  switch (request.method) {
    case 'GET':
      if (configId) {
        // 获取单个配置
        const config = await env.CONFIG_STORE.get(`config:${configId}`);
        if (!config) {
          return new Response(JSON.stringify({ message: 'Config not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(config, {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // 获取所有配置列表
        const list = await env.CONFIG_STORE.list({ prefix: 'config:' });
        const configs = await Promise.all(
          list.keys.map(async (key) => JSON.parse(await env.CONFIG_STORE.get(key.name)))
        );
        // 按最后保存时间降序排序
        configs.sort((a, b) => new Date(b.lastSaved) - new Date(a.lastSaved));
        return new Response(JSON.stringify(configs), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

    case 'POST':
    case 'PUT':
      const config = await request.json();
      
      // 验证配置名称
      if (!/^[^\p{P}\s]+$/u.test(config.name)) {
        return new Response(JSON.stringify({
          field: 'name',
          message: '配置名称不能包含标点符号和空格'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 验证链式代理tag
      if (config.proxyTag && !/^[^\p{P}\s]+$/u.test(config.proxyTag)) {
        return new Response(JSON.stringify({
          field: 'proxyTag',
          message: '链式代理tag不能包含标点符号和空格'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 处理新建或更新配置
      let configToSave = {
        ...config,
        lastSaved: new Date().toISOString()
      };

      if (configId) {
        // 更新现有配置
        configToSave.id = configId;
      } else {
        // 新建配置，生成新的ID
        const list = await env.CONFIG_STORE.list({ prefix: 'config:' });
        const maxId = list.keys.reduce((max, key) => {
          const id = parseInt(key.name.split(':')[1]);
          return isNaN(id) ? max : Math.max(max, id);
        }, 0);
        configToSave.id = (maxId + 1).toString();
      }

      await env.CONFIG_STORE.put(`config:${configToSave.id}`, JSON.stringify(configToSave));
      return new Response(JSON.stringify(configToSave), {
        headers: { 'Content-Type': 'application/json' },
      });

    case 'DELETE':
      if (!configId) {
        return new Response(JSON.stringify({ message: 'Config ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await env.CONFIG_STORE.delete(`config:${configId}`);
      return new Response(JSON.stringify({ message: 'Config deleted' }), {
        headers: { 'Content-Type': 'application/json' },
      });

    default:
      return new Response(JSON.stringify({ message: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

// 处理登录请求
async function handleLogin(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await request.json();
  if (data.password === env.ADMIN_PASSWORD) {
    // 创建一个简单的会话token
    const token = crypto.randomUUID();
    
    return new Response(JSON.stringify({ message: 'Login successful' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=10800`, // 3小时过期
      },
    });
  }

  return new Response(JSON.stringify({ message: 'Invalid password' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// 处理API请求
async function handleAPI(request, env) {
  // 验证cookie
  const cookie = request.headers.get('Cookie') || '';
  if (!cookie.includes('session=')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 这里可以添加更多的API路由处理
  return new Response(JSON.stringify({ message: 'API endpoint' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 处理订阅请求
async function handleSubscription(request, env) {
  const url = new URL(request.url);
  const configName = url.pathname.replace('/sub/', '');

  // 在KV中查找配置
  const list = await env.CONFIG_STORE.list({ prefix: 'config:' });
  let targetConfig = null;

  // 遍历所有配置找到匹配的名称
  for (const key of list.keys) {
    const config = JSON.parse(await env.CONFIG_STORE.get(key.name));
    if (config.name === configName) {
      targetConfig = config;
      break;
    }
  }

  if (!targetConfig) {
    return new Response(JSON.stringify({ 
      error: 'Configuration not found',
      message: '未找到对应的配置' 
    }), {
      status: 404,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }

  let finalUrl = '';
  try {
    // 构建后端URL
    const backendUrl = targetConfig.backendUrl.replace(/\/+$/, ''); // 移除末尾的斜杠
    const subscribeUrls = targetConfig.subscribeUrls.join('\n');
    const encodedUrls = encodeURIComponent(subscribeUrls);
    
    finalUrl = `${backendUrl}/singbox?config=${encodedUrls}&selectedRules=%5B%5D&customRules=%5B%5D&pin=false`;

    // 请求后端服务
    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error(`Backend request failed with status ${response.status}`);
    }

    // 获取并解析JSON数据
    const jsonData = await response.json();

    // 如果有链式代理tag，为每个outbound添加detour
    if (targetConfig.proxyTag && targetConfig.proxyTag.trim() !== '') {
      if (jsonData.outbounds && Array.isArray(jsonData.outbounds)) {
        jsonData.outbounds = jsonData.outbounds.map(outbound => ({
          ...outbound,
          detour: [targetConfig.proxyTag]
        }));
      }
    }

    // 返回处理后的数据
    return new Response(JSON.stringify(jsonData), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    // 错误处理
    return new Response(JSON.stringify({ 
      error: 'Processing Error',
      message: error.message,
      debug: {
        requestUrl: finalUrl,
        config: {
          name: targetConfig.name,
          backendUrl: targetConfig.backendUrl,
          subscribeUrls: targetConfig.subscribeUrls,
          proxyTag: targetConfig.proxyTag
        }
      }
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

// 导出处理函数
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
