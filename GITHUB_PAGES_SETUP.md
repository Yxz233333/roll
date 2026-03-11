# GitHub Pages 快速设置指南

## 5分钟快速启动

### 1️⃣ Fork 仓库
在GitHub上点击 **Fork** 按钮，将项目复制到你的账户。

### 2️⃣ 启用 GitHub Pages
进入你fork的仓库：
```
设置 Settings → 页面 Pages
```

找到 **Source** 选项，选择：
```
Deploy from a branch → Branch: main (or master) → /(root)
```

或者选择（更推荐）：
```
GitHub Actions
```

### 3️⃣ 推送代码（自动部署）
```bash
# 如果还没有clone，先clone你的fork
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME

# 确保有最新代码并推送
git push origin main
```

### 4️⃣ 等待构建完成
1. 进入 **Actions** 选项卡
2. 等待 "Deploy to GitHub Pages" 工作流完成
3. 看到绿色✓就表示成功了！

### 5️⃣ 访问你的应用
打开浏览器访问：
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME
```

## 自定义域名（可选）

如果有自己的域名，可以配置自定义域：

1. 进入 **Settings → Pages**
2. **Custom domain** 输入你的域名
3. 在你的域名提供商配置DNS CNAME记录指向 `your-username.github.io`

## 常见问题

### Q: 为什么页面显示404？
**A:** 
- 等待构建完成（Actions中看到绿色✓）
- 检查URL是否正确：`https://username.github.io/repo-name`
- 硬刷新浏览器：Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)

### Q: 构建失败了怎么办？
**A:**
1. 进入 **Actions** 选项卡
2. 点击失败的工作流查看错误信息
3. 最常见原因：
   - Node版本问题（自动处理，通常不是问题）
   - 缺少依赖（运行 `npm install` 再push）

### Q: 如何自动部署我的修改？
**A:** 自动部署已启用！只需：
```bash
git add .
git commit -m "你的更改说明"
git push origin main
```
GitHub Actions 会自动构建和部署。

### Q: 我的数据会上传到云端吗？
**A:** 不会！所有数据都存储在**本地浏览器**中，完全离线可用。

### Q: 可以改仓库名吗？
**A:** 可以，但需要更新GitHub Pages设置中的源分支。仓库名会影响你的访问URL：
- 改名前：`https://username.github.io/old-name`
- 改名后：`https://username.github.io/new-name`

## 高级选项

### 禁用自动部署
如果不想自动部署，可以手动构建上传：

```bash
# 构建本地版本
npm install
npm run build

# dist/public/ 中的文件就是要部署的
# 可以手动上传到 GitHub Pages 或其他托管
```

### 使用 main 之外的分支
修改 `.github/workflows/deploy.yml` 第7-8行：
```yaml
on:
  push:
    branches: [ your-branch-name ]  # 改成你的分支名
```

---

**已经设置好了？** 现在可以：
1. 访问你的应用URL
2. 在浏览器中打开"安装应用"
3. 开始使用！🎉
