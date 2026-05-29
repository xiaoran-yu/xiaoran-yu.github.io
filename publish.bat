@echo off
echo === 大鲸鱼网站 · 发布工具 ===
echo.
echo 1. 从 Obsidian 构建文章...
node build.js
if %errorlevel% neq 0 (
    echo 构建失败，请检查错误信息
    pause
    exit /b
)
echo.
echo 2. 推送到 GitHub...
git add -A
git commit -m "更新: %date% %time%"
git push
echo.
echo === 发布完成！===
echo 网站: https://xiaoran-yu.github.io
echo 30 秒后生效
echo.
pause
