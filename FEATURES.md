# 功能特性与扩展方向

## ✅ 已实现功能

### 1. 用户系统
- ✅ 用户注册/登录
- ✅ JWT 认证
- ✅ 密码加密存储
- ✅ 用户信息管理

### 2. Docker 容器管理
- ✅ 独立容器创建
- ✅ 容器生命周期管理
- ✅ 资源限制（CPU/内存）
- ✅ 非 root 用户运行
- ✅ 用户与容器绑定

### 3. Web Terminal
- ✅ 实时终端交互
- ✅ WebSocket 通信
- ✅ 终端大小自适应
- ✅ 多会话支持
- ✅ VS Code 风格界面

### 4. 实验系统
- ✅ Markdown 题目渲染
- ✅ 题目管理接口
- ✅ 左右分屏布局
- ✅ Tab 切换（Terminal/VNC）

### 5. UI/UX
- ✅ 深色主题
- ✅ 现代化设计
- ✅ 响应式布局
- ✅ 流畅动画

## 🚧 待实现功能

### 1. VNC 远程桌面

#### 实现方案

```typescript
// backend/src/vnc/vnc.service.ts
import * as net from 'net';
import { WebSocketServer } from 'ws';

export class VncService {
  createVncProxy(containerId: string, vncPort: number) {
    const wss = new WebSocketServer({ port: 6080 });
    
    wss.on('connection', (ws) => {
      const vncSocket = net.connect({
        host: 'localhost',
        port: vncPort
      });
      
      ws.on('message', (data) => {
        vncSocket.write(data);
      });
      
      vncSocket.on('data', (data) => {
        ws.send(data);
      });
    });
  }
}
```

#### 容器配置

```dockerfile
# 安装 VNC 服务
RUN apt-get install -y \
    x11vnc \
    xvfb \
    fluxbox \
    websockify

# 启动脚本
CMD Xvfb :1 -screen 0 1024x768x16 & \
    fluxbox & \
    x11vnc -display :1 -forever -shared
```

#### 前端集成

```bash
npm install @novnc/novnc
```

```typescript
// frontend/src/components/VncViewer.tsx
import RFB from '@novnc/novnc/core/rfb';

export default function VncViewer({ vncUrl }: { vncUrl: string }) {
  useEffect(() => {
    const rfb = new RFB(canvasRef.current, vncUrl);
    return () => rfb.disconnect();
  }, [vncUrl]);
  
  return <canvas ref={canvasRef} />;
}
```

### 2. 自动判题系统

#### 架构设计

```typescript
// backend/src/judge/judge.service.ts
export class JudgeService {
  async runTest(containerId: string, testCase: TestCase) {
    // 1. 执行测试命令
    const result = await this.dockerService.execCommand(
      containerId,
      testCase.command
    );
    
    // 2. 验证输出
    const passed = this.validateOutput(
      result,
      testCase.expectedOutput
    );
    
    // 3. 记录结果
    return {
      passed,
      output: result,
      score: passed ? testCase.score : 0
    };
  }
  
  private validateOutput(actual: string, expected: string): boolean {
    // 支持正则匹配、精确匹配、包含匹配
    return actual.includes(expected);
  }
}
```

#### 题目配置

```json
{
  "id": "lab-001",
  "title": "Linux 文件操作",
  "testCases": [
    {
      "name": "创建目录",
      "command": "test -d workspace && echo 'PASS' || echo 'FAIL'",
      "expectedOutput": "PASS",
      "score": 20
    },
    {
      "name": "创建文件",
      "command": "test -f workspace/hello.txt && echo 'PASS' || echo 'FAIL'",
      "expectedOutput": "PASS",
      "score": 30
    }
  ]
}
```

### 3. 实验录制与回放

#### 实现方案

```typescript
// backend/src/recording/recording.service.ts
export class RecordingService {
  private recordings = new Map<string, Recording>();
  
  startRecording(sessionId: string) {
    this.recordings.set(sessionId, {
      events: [],
      startTime: Date.now()
    });
  }
  
  recordEvent(sessionId: string, event: TerminalEvent) {
    const recording = this.recordings.get(sessionId);
    recording.events.push({
      timestamp: Date.now() - recording.startTime,
      type: event.type,
      data: event.data
    });
  }
  
  async saveRecording(sessionId: string) {
    const recording = this.recordings.get(sessionId);
    await this.recordingRepository.save(recording);
  }
}
```

#### 回放功能

```typescript
// frontend/src/components/RecordingPlayer.tsx
export default function RecordingPlayer({ recordingId }: Props) {
  const playRecording = async () => {
    const recording = await api.getRecording(recordingId);
    
    for (const event of recording.events) {
      await sleep(event.timestamp);
      terminal.write(event.data);
    }
  };
  
  return (
    <div>
      <Terminal ref={terminalRef} />
      <button onClick={playRecording}>播放</button>
    </div>
  );
}
```

### 4. 协作编程

#### WebRTC 实时协作

```typescript
// backend/src/collaboration/collaboration.gateway.ts
@WebSocketGateway()
export class CollaborationGateway {
  @SubscribeMessage('join-session')
  handleJoinSession(client: Socket, sessionId: string) {
    client.join(sessionId);
    this.server.to(sessionId).emit('user-joined', client.id);
  }
  
  @SubscribeMessage('terminal-input')
  handleInput(client: Socket, data: { sessionId: string, input: string }) {
    // 广播给同一会话的所有用户
    this.server.to(data.sessionId).emit('terminal-output', data.input);
  }
}
```

### 5. 资源监控

#### 实时监控面板

```typescript
// backend/src/monitoring/monitoring.service.ts
export class MonitoringService {
  async getContainerStats(containerId: string) {
    const container = this.docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    return {
      cpu: this.calculateCpuPercent(stats),
      memory: stats.memory_stats.usage / stats.memory_stats.limit * 100,
      network: {
        rx: stats.networks.eth0.rx_bytes,
        tx: stats.networks.eth0.tx_bytes
      }
    };
  }
}
```

```typescript
// frontend/src/components/ResourceMonitor.tsx
export default function ResourceMonitor({ containerId }: Props) {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await api.getContainerStats(containerId);
      setStats(data);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [containerId]);
  
  return (
    <div className="stats-panel">
      <div>CPU: {stats?.cpu.toFixed(2)}%</div>
      <div>Memory: {stats?.memory.toFixed(2)}%</div>
    </div>
  );
}
```

### 6. 多租户支持

#### 组织管理

```typescript
// backend/src/organization/entities/organization.entity.ts
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  name: string;
  
  @OneToMany(() => User, user => user.organization)
  members: User[];
  
  @Column('json')
  resourceQuota: {
    maxContainers: number;
    maxCpuPerContainer: number;
    maxMemoryPerContainer: number;
  };
}
```

### 7. 实验市场

#### 题目分享平台

```typescript
// backend/src/marketplace/marketplace.service.ts
export class MarketplaceService {
  async publishLab(labId: string, userId: string) {
    const lab = await this.labService.findOne(labId);
    
    return this.marketplaceRepository.save({
      lab,
      author: userId,
      published: true,
      downloads: 0,
      rating: 0
    });
  }
  
  async searchLabs(query: string) {
    return this.marketplaceRepository
      .createQueryBuilder('marketplace')
      .where('marketplace.lab.title LIKE :query', { query: `%${query}%` })
      .orderBy('marketplace.rating', 'DESC')
      .getMany();
  }
}
```

### 8. AI 助手

#### 集成 AI 编程助手

```typescript
// backend/src/ai/ai.service.ts
import OpenAI from 'openai';

export class AiService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  async getHint(labId: string, userCode: string) {
    const lab = await this.labService.findOne(labId);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一个编程导师，帮助学生完成实验'
        },
        {
          role: 'user',
          content: `实验要求：${lab.content}\n\n当前代码：${userCode}\n\n请给出提示`
        }
      ]
    });
    
    return response.choices[0].message.content;
  }
}
```

## 🎯 优先级排序

### P0 (核心功能)
1. ✅ 用户认证
2. ✅ 容器管理
3. ✅ Web Terminal
4. ✅ 题目展示

### P1 (重要功能)
1. 🚧 VNC 远程桌面
2. 🚧 自动判题
3. 🚧 资源监控

### P2 (增强功能)
1. 📋 实验录制回放
2. 📋 协作编程
3. 📋 实验市场

### P3 (扩展功能)
1. 📋 多租户支持
2. 📋 AI 助手
3. 📋 数据分析

## 📊 技术债务

### 需要优化的地方

1. **错误处理**: 增加全局异常过滤器
2. **日志系统**: 集成 Winston 或 Pino
3. **测试覆盖**: 添加单元测试和 E2E 测试
4. **性能优化**: 添加 Redis 缓存
5. **安全加固**: 添加速率限制、CSRF 保护
6. **文档完善**: 添加 Swagger API 文档

## 🔧 技术选型替代方案

### 前端
- **状态管理**: Zustand → Redux Toolkit / Jotai
- **UI 框架**: Tailwind → Ant Design / Material-UI
- **终端**: xterm.js → ttyd / wetty

### 后端
- **框架**: NestJS → Express / Fastify
- **ORM**: TypeORM → Prisma / Sequelize
- **容器**: dockerode → Kubernetes Client

### 基础设施
- **数据库**: PostgreSQL → MySQL / MongoDB
- **缓存**: Redis → Memcached
- **消息队列**: RabbitMQ / Kafka (用于异步任务)
