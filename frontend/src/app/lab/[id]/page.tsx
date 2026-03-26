'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { labAPI, containerAPI } from '@/lib/api';
import { snapshotAPI } from '@/lib/api';
import LoadingBar from '@/components/LoadingBar';
import { Terminal, Monitor, Play, Square, Save, RotateCcw, Laptop, Camera, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function LabPage() {
  const router = useRouter();
  const params = useParams();
  const labId = params.id as string;
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [lab, setLab] = useState<any>(null);
  const [container, setContainer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'vnc' | 'ssh' | 'rdp' | 'web'>('ssh');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webLoadError, setWebLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && labId) {
      loadLab();
    }
  }, [isAuthenticated, labId]);

  // 当容器启动时，设置默认 Web URL
  useEffect(() => {
    if (container) {
      setWebUrl(`http://localhost:${container.port || '8080'}`);
      setWebLoadError(false);
    } else {
      setWebUrl('');
      setWebLoadError(false);
    }
  }, [container]);

  // 检测 iframe 加载状态
  useEffect(() => {
    if (!webUrl || webLoadError || activeTab !== 'web') return;

    const checkIframeLoad = setTimeout(() => {
      if (iframeRef.current) {
        try {
          // 尝试访问 iframe 的 contentWindow，如果失败说明加载有问题
          const iframeDoc = iframeRef.current.contentDocument;
          if (!iframeDoc) {
            setWebLoadError(true);
          }
        } catch (e) {
          // 跨域或加载失败
          setWebLoadError(true);
        }
      }
    }, 3000); // 3秒后检查

    return () => clearTimeout(checkIframeLoad);
  }, [webUrl, webLoadError, activeTab]);

  // 初始化 xterm.js 终端
  useEffect(() => {
    if (activeTab === 'ssh' && container && terminalRef.current && !xtermRef.current) {
      const term = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: '#000000',
          foreground: '#ffffff',
          cursor: '#ffffff',
          selection: 'rgba(255, 255, 255, 0.3)',
        },
        rows: 30,
        cols: 80,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      // 欢迎信息
      term.writeln('Welcome to Spark Lab Container Terminal');
      term.writeln('Container ID: ' + container.id.slice(0, 12));
      term.writeln('Type your commands below:');
      term.writeln('');
      term.write('$ ');

      let currentLine = '';

      // 处理用户输入
      term.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter 键
          term.write('\r\n');
          if (currentLine.trim()) {
            executeCommand(currentLine.trim(), term);
          } else {
            term.write('$ ');
          }
          currentLine = '';
        } else if (code === 127) {
          // Backspace 键
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code >= 32) {
          // 可打印字符
          currentLine += data;
          term.write(data);
        }
      });

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // 窗口大小改变时调整终端大小
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
      };
    }
  }, [activeTab, container]);

  const executeCommand = async (cmd: string, term: XTerm) => {
    if (!container) return;

    try {
      const res = await containerAPI.exec(container.id, cmd);
      const output = res.data.output || '';
      
      // 输出结果
      if (output) {
        output.split('\n').forEach((line: string) => {
          term.writeln(line);
        });
      }
    } catch (error) {
      term.writeln('Error: Command execution failed');
    }
    
    term.write('$ ');
  };

  const loadLab = async () => {
    try {
      const res = await labAPI.getOne(labId);
      setLab(res.data);
    } catch (error) {
      console.error('Failed to load lab:', error);
    }
  };

  const handleStartContainer = async () => {
    try {
      const res = await containerAPI.create(labId);
      setContainer(res.data);
    } catch (error) {
      console.error('Failed to start container:', error);
      alert('容器创建失败，请重试');
    }
  };

  const handleStopContainer = async () => {
    if (!container) return;
    try {
      await containerAPI.stop(container.id);
      
      // 清理终端
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
      }
      
      setContainer(null);
    } catch (error) {
      console.error('Failed to stop container:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      await labAPI.submit(labId);
      alert('实验已提交！');
    } catch (error) {
      console.error('Failed to submit lab:', error);
      alert('提交失败，请重试');
    }
  };

  const handleSaveSnapshot = async () => {
    if (!container) {
      alert('请先启动容器');
      return;
    }

    const name = prompt('请输入快照名称：');
    if (!name) return;

    const description = prompt('请输入快照描述（可选）：');

    try {
      await snapshotAPI.create({
        containerId: container.id,
        name,
        description: description || undefined,
      });
      alert('快照保存成功！');
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      alert('快照保存失败，请重试');
    }
  };

  // 测试函数：模拟容器启动（在浏览器控制台使用）
  if (typeof window !== 'undefined') {
    (window as any).testStartContainer = () => {
      const mockContainer = {
        id: 'test-container-' + Date.now(),
        labId: labId,
        status: 'running',
        port: 8080,
        createdAt: new Date().toISOString(),
      };
      setContainer(mockContainer);
      console.log('测试容器已启动:', mockContainer);
      return mockContainer;
    };

    (window as any).testStopContainer = () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
      }
      setContainer(null);
      console.log('测试容器已停止');
    };

    console.log('测试函数已加载:');
    console.log('- testStartContainer() - 模拟启动容器');
    console.log('- testStopContainer() - 模拟停止容器');
  }

  if (isLoading) {
    return <LoadingBar />;
  }

  if (!isAuthenticated || !lab) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">
      {/* 左侧：实验内容 - 35% */}
      <div className="w-[35%] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h1 className="text-2xl font-bold text-primary mb-2">{lab.title}</h1>
          <p className="text-sm text-on-surface-variant mb-4">{lab.description}</p>
          
          {/* 容器控制按钮 */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleStartContainer}
              disabled={!!container}
              className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                container
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <Play className="w-4 h-4" />
              启动容器
            </button>
            <button
              onClick={handleStopContainer}
              disabled={!container}
              className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                !container
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <Square className="w-4 h-4" />
              停止容器
            </button>
            <button
              onClick={handleSaveSnapshot}
              disabled={!container}
              className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                !container
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Camera className="w-4 h-4" />
              保存快照
            </button>
            <button
              onClick={() => setTerminalOutput([])}
              disabled={!container}
              className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                !container
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              清空
            </button>
          </div>

          {/* 连接方式选择 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('ssh')}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm ${
                activeTab === 'ssh'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <Terminal className="w-4 h-4" />
              SSH
            </button>
            <button
              onClick={() => setActiveTab('vnc')}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm ${
                activeTab === 'vnc'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <Monitor className="w-4 h-4" />
              VNC
            </button>
            <button
              onClick={() => setActiveTab('rdp')}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm ${
                activeTab === 'rdp'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <Laptop className="w-4 h-4" />
              RDP
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm ${
                activeTab === 'web'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <Globe className="w-4 h-4" />
              Web
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{lab.content || '# 实验内容\n\n暂无内容'}</ReactMarkdown>
          </div>

          {lab.tasks && lab.tasks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-primary mb-4">实验任务</h3>
              <div className="space-y-3">
                {lab.tasks.map((task: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 bg-surface-container-high rounded-lg p-4">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-on-surface-variant flex-1">{task}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-surface-container text-on-surface-variant px-4 py-2.5 rounded-lg hover:bg-surface-bright transition-all text-sm"
          >
            返回大厅
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-primary text-on-primary px-4 py-2.5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            提交实验
          </button>
        </div>
      </div>

      {/* 右侧：VNC/SSH/RDP 终端 - 65% */}
      <div className="w-[65%] flex flex-col">
        <div className="flex-1 overflow-hidden">
          {activeTab === 'vnc' ? (
            <div className="h-full bg-surface-container flex items-center justify-center">
              {container ? (
                <div className="text-center">
                  <Monitor className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-on-surface-variant mb-2">VNC 连接</p>
                  <p className="text-xs text-on-surface-variant">
                    容器 ID: {container.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-4">
                    VNC 功能开发中...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Monitor className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                  <p className="text-on-surface-variant">请先启动容器</p>
                </div>
              )}
            </div>
          ) : activeTab === 'rdp' ? (
            <div className="h-full bg-surface-container flex items-center justify-center">
              {container ? (
                <div className="text-center">
                  <Laptop className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-on-surface-variant mb-2">RDP 连接</p>
                  <p className="text-xs text-on-surface-variant">
                    容器 ID: {container.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-4">
                    RDP 功能开发中...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Laptop className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                  <p className="text-on-surface-variant">请先启动容器</p>
                </div>
              )}
            </div>
          ) : activeTab === 'web' ? (
            <div className="h-full bg-surface-container flex flex-col">
              {container ? (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-on-surface-variant mb-1">Web 访问地址</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={webUrl}
                          onChange={(e) => setWebUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setWebLoadError(false);
                            }
                          }}
                          placeholder="输入 Web 访问地址"
                          className="flex-1 bg-surface-container-high text-on-surface px-3 py-1.5 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(webUrl);
                            alert('已复制到剪贴板');
                          }}
                          className="px-3 py-1.5 bg-primary text-on-primary rounded text-sm hover:opacity-90 transition-all"
                        >
                          复制
                        </button>
                        <button
                          onClick={() => setWebLoadError(false)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-all"
                        >
                          刷新
                        </button>
                        <a
                          href={webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-all"
                        >
                          新窗口
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white relative">
                    {webLoadError ? (
                      <div className="h-full bg-surface-container flex items-center justify-center">
                        <div className="text-center">
                          <Globe className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                          <p className="text-on-surface-variant mb-2">无法连接到 Web 服务</p>
                          <p className="text-xs text-on-surface-variant mb-4">
                            请检查容器是否已启动 Web 服务
                          </p>
                          <p className="text-xs text-on-surface-variant mb-4">
                            当前地址: {webUrl}
                          </p>
                          <button
                            onClick={() => setWebLoadError(false)}
                            className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all"
                          >
                            重新加载
                          </button>
                        </div>
                      </div>
                    ) : (
                      <iframe
                        ref={iframeRef}
                        key={webUrl}
                        src={webUrl}
                        className="w-full h-full border-0"
                        title="Container Web Access"
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                    <p className="text-on-surface-variant">请先启动容器</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {!container ? (
                <div className="h-full bg-surface-container flex items-center justify-center">
                  <div className="text-center">
                    <Terminal className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                    <p className="text-on-surface-variant">请先启动容器</p>
                  </div>
                </div>
              ) : (
                <div ref={terminalRef} className="h-full w-full bg-black" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
