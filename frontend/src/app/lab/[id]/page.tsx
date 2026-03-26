'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { labAPI, containerAPI } from '@/lib/api';
import LoadingBar from '@/components/LoadingBar';
import { Terminal, Monitor, Play, Square, Save, RotateCcw, Laptop } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function LabPage() {
  const router = useRouter();
  const params = useParams();
  const labId = params.id as string;
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [lab, setLab] = useState<any>(null);
  const [container, setContainer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'vnc' | 'ssh' | 'rdp'>('ssh');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [command, setCommand] = useState('');

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
      setTerminalOutput((prev) => [...prev, `✅ 容器已创建: ${res.data.id}`]);
    } catch (error) {
      console.error('Failed to start container:', error);
      setTerminalOutput((prev) => [...prev, `❌ 容器创建失败`]);
    }
  };

  const handleStopContainer = async () => {
    if (!container) return;
    try {
      await containerAPI.stop(container.id);
      setTerminalOutput((prev) => [...prev, `⏹️ 容器已停止`]);
      setContainer(null);
    } catch (error) {
      console.error('Failed to stop container:', error);
    }
  };

  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!container || !command.trim()) return;

    setTerminalOutput((prev) => [...prev, `$ ${command}`]);
    
    try {
      const res = await containerAPI.exec(container.id, command);
      setTerminalOutput((prev) => [...prev, res.data.output || '']);
    } catch (error) {
      setTerminalOutput((prev) => [...prev, `❌ 命令执行失败`]);
    }
    
    setCommand('');
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
          <p className="text-sm text-on-surface-variant">{lab.description}</p>
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
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('vnc')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'vnc'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <Monitor className="w-4 h-4" />
              VNC
            </button>
            <button
              onClick={() => setActiveTab('ssh')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'ssh'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <Terminal className="w-4 h-4" />
              SSH
            </button>
            <button
              onClick={() => setActiveTab('rdp')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'rdp'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              <Laptop className="w-4 h-4" />
              RDP
            </button>
          </div>

          <div className="flex gap-2">
            {!container ? (
              <button
                onClick={handleStartContainer}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                启动容器
              </button>
            ) : (
              <>
                <button
                  onClick={handleStopContainer}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  停止容器
                </button>
                <button
                  onClick={() => setTerminalOutput([])}
                  className="bg-surface-container text-on-surface-variant px-4 py-2 rounded-lg hover:bg-surface-bright transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  清空
                </button>
              </>
            )}
          </div>
        </div>

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
          ) : (
            <div className="h-full bg-black flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                {terminalOutput.length === 0 ? (
                  <div className="text-gray-500">
                    {container ? '终端已就绪，输入命令开始...' : '请先启动容器'}
                  </div>
                ) : (
                  terminalOutput.map((line, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {line}
                    </div>
                  ))
                )}
              </div>

              {container && (
                <form onSubmit={handleExecuteCommand} className="border-t border-gray-700 p-4 flex gap-2">
                  <span className="text-green-400 font-mono">$</span>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="输入命令..."
                    className="flex-1 bg-transparent text-green-400 font-mono outline-none"
                  />
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
