# 🛠️ 51 Microcontroller Simulation
> A lightweight, Python-powered emulator for the 8051 microcontroller.
> **Fast to simulate. Easy to debug. Simple to extend. Hard to beat.**
<p align="center">
  <!-- TODO: Replace with your preview image / GIF -->
  <img src="assets/preview.gif" alt="preview" width="720">
</p>
<p align="center">
  <!-- TODO: Replace links -->
  <a href="https://51-simulator-buwenjiayou.netlify.app">Live Demo</a>
</p>
<p align="center">
  <!-- Badges (optional) -->
  <img alt="license" src="https://img.shields.io/badge/license-MIT-informational">
  <img alt="status" src="https://img.shields.io/badge/status-stable-success">
  <img alt="made-with" src="https://img.shields.io/badge/made%20with-python%20%26%20passion-3776AB">
</p>


## ✨ What is this?
`51-Microcontroller-Simulation` 是一个基于Python的8051单片机模拟器项目：模拟经典51系列微控制器的指令执行、寄存器状态和内存操作。
它的目标不是“功能全”，而是：
- **开箱即用**：clone 后几步跑起来
- **调试优先**：实时寄存器查看/断点/步进执行
- **可维护**：模块化设计、可扩展指令集
- **可部署**：支持本地运行或Web版本（可选）
> If it’s not accurate, it’s not emulated.


## 🧩 Features
- 快速启动：支持汇编代码直接加载（.asm / .hex）
- 核心模拟：指令解码/执行/标志位更新（覆盖常见操作码）
- 调试工具：寄存器监视/内存转储/周期计数
- 扩展支持：自定义外设模拟（定时器/中断可选）
- 跨平台：纯Python，无依赖复杂库
- 离线可用：静态资源打包（CLI 或 GUI 模式）
---
