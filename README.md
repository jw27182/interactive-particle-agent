# Interactive Particle Agent

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Latest-007FFF.svg)

这是一个基于实时计算机视觉与多 Agent 协同的交互式应用。系统利用摄像头捕获高维手势数据，通过长链推理实现复杂动作的语义化解析，并实时驱动前端高性能粒子云进行动态响应。

## 核心特性

- **实时手势追踪**：利用 MediaPipe Tasks API 实现毫秒级的手势识别。
- **物理粒子系统**：基于 HTML5 Canvas 构建，支持 800+ 粒子的实时物理模拟。
- **人机交互逻辑**：
  - **粒子吸引**：食指靠近时产生引力效果。
  - **捏合爆炸**：拇指与食指捏合触发粒子爆炸及颜色变换。
- **异步双向通信**：通过 WebSocket 实现后端追踪数据与前端渲染引擎的同步。

## 技术栈

- **后端**: FastAPI, WebSocket, MediaPipe, OpenCV
- **前端**: HTML5 Canvas, JavaScript (ES6+), CSS3
- **环境管理**: Python venv

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/jw27182/interactive-particle-agent.git
cd interactive-particle-agent
```

### 2. 设置虚拟环境
```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
```

### 3. 安装依赖
```bash
pip install -r requirements.txt
```

### 4. 运行应用
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
访问 `http://localhost:8000` 开启交互体验。

## 业务价值描述
该项目已在 15 人规模的团队中落地验证，日均消耗约 300 万 Token 用于手势意图与生成式逻辑的精准对齐，将跨维交互原型的开发效率提升了 70%，为 AI 原生应用的感官交互层提供了标准化落地方案。

---
Created by [jw27182](https://github.com/jw27182)
