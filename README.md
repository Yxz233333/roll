# Random Student Picker 🎯

一个课堂友好的随机学生选择器，支持PWA离线使用，可直接在GitHub Pages上运行。

**[在线体验 Live Demo](https://your-username.github.io/your-repo-name)** (将此链接替换为你的GitHub Pages地址)

## 功能特性 ✨

- ✅ **快速导入名单** - 支持粘贴/手动输入、上传TXT/CSV/Excel
- ✅ **本地存储** - 名单自动保存在浏览器，刷新不丢失
- ✅ **PWA离线支持** - 安装为本地应用，无需浏览器
- ✅ **滚动动画** - 快速滚动效果，自动停止在选中的学生
- ✅ **防重复机制** - 已抽取的学生不会再被选中
- ✅ **实时统计** - 显示剩余/已抽/总人数
- ✅ **一键重置** - 恢复已抽学生回名单
- ✅ **投屏友好** - 大号字体，适合课堂投屏显示

## 快速开始 🚀

### 方式1：在GitHub上直接使用（推荐）

1. **Fork 这个项目** 到你的GitHub账户
2. **进入Settings → Pages**
3. **Source** 选择 `GitHub Actions`
4. **Push代码**，GitHub会自动构建并部署
5. 等待构建完成（绿色✓ 出现），即可访问你的GitHub Pages URL

### 方式2：本地运行

```bash
# 克隆项目
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

# 安装依赖
npm install

# 启动开发服务器
npm run dev:client

# 浏览器打开 http://localhost:5000
```

### 方式3：构建静态版本

```bash
# 构建生成静态文件
npm run build

# 输出目录: dist/public/
# 可直接上传到任何静态托管服务（GitHub Pages、Vercel等）
```

## 如何安装为APP 📱

### Windows / Mac (Chrome 和 Edge)
1. 打开应用URL
2. 地址栏右侧寻找 **安装** 按钮，或点击菜单(⋮) → **安装应用**
3. 应用将作为桌面程序运行

### iPhone / iPad (Safari)
1. 打开应用URL
2. 点击底部 **分享** 按钮
3. 选择 **添加到主屏幕**
4. 确认即可

### Android (Chrome)
1. 打开应用URL
2. 点击菜单(⋮)
3. 选择 **安装应用** 或 **添加到主屏幕**

## 使用教程 📖

### 添加学生名单

1. 点击 **Manage Roster**
2. **Paste / Type** - 每行一个名字，或用逗号分隔
3. **Upload File** - 支持 .txt, .csv, .xlsx, .xls
   - Excel: 会自动读取第一列的名字
4. 点击 **Add Students** 添加

### 开始抽取

1. 点击大黄色按钮 **START DRAW**
2. 名字会快速滚动，约2.5秒后停止
3. 被选中的学生会：
   - 从剩余名单中移除
   - 出现在已抽取列表中
   - 触发彩纸庆祝效果 🎉

### 管理名单

- **Reset List** - 把已抽学生放回剩余名单，可重新抽取
- **Clear All** - 删除所有学生（询问确认）

## 自动部署 🔄

项目使用 GitHub Actions 自动构建和部署：

- **触发条件**：代码推送到 main 或 master 分支
- **构建过程**：自动编译前端代码
- **部署位置**：GitHub Pages (你的仓库设置中)
- **访问地址**：`https://your-username.github.io/your-repo-name`

`.github/workflows/deploy.yml` 文件已配置完毕，无需其他操作。

## 浏览器兼容性 🌐

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## 离线功能 📡

首次访问后，应用会缓存所有资源：

- 完全离线可用（安装后）
- Service Worker 自动管理缓存
- 数据存储在浏览器本地（不涉及云端）

## 数据隐私 🔒

- ✅ 所有数据存储在**浏览器本地**
- ✅ **无服务器**，无云端存储
- ✅ **无网络请求**（离线完全可用）
- ✅ **无追踪**，无分析

## 故障排除 ❓

### GitHub Pages 不显示？
1. 检查 Settings → Pages → Source 是否设置为 GitHub Actions
2. 检查 Actions 选项卡是否有构建错误
3. 清空浏览器缓存，或使用无痕模式访问

### 名单保存丢失？
1. 检查浏览器是否允许本地存储
2. 尝试清空浏览器数据，但要先备份名单（复制粘贴导出）
3. 使用无痕模式测试

### PWA 安装失败？
1. 需要使用 Chrome/Edge/Safari 浏览器
2. 应用必须通过 HTTPS 访问（GitHub Pages 自动支持）
3. 手机请检查是否启用了"添加到主屏幕"权限

## 技术栈 🛠️

- **前端框架**：React 19 + Vite
- **UI组件**：Shadcn/UI + Tailwind CSS
- **文件解析**：XLSX（支持Excel）
- **动画**：Framer Motion + Canvas Confetti
- **路由**：Wouter
- **PWA**：Service Worker + Web App Manifest

## 许可证 📄

MIT License - 自由使用和修改

## 贡献 🤝

欢迎提交 Issue 和 Pull Request！

---

**需要帮助？** 检查上面的 **故障排除** 部分或提交 Issue。
