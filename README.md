# Line Todo

一个基于 Next.js 和 Electron 的时间轴待办事项管理应用。

## 功能特点

- 时间轴式展示待办事项
- 支持里程碑节点和普通节点
- 节点可拖拽定位
- 待办事项状态可视化
- 支持添加、编辑、删除待办事项
- 支持节点编辑和删除
- 数据本地持久化存储

## 技术栈

- Next.js
- Electron
- TypeScript
- Tailwind CSS
- SQLite
- Zustand (状态管理)

## 开发环境设置

1. 克隆项目
```bash
git clone [your-repository-url]
cd line-todo
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

4. 启动 Electron 应用
```bash
npm run electron-dev
# 或
yarn electron-dev
```

## 构建应用

```bash
npm run build
# 或
yarn build
```

## 使用说明

1. 点击时间轴上的节点可以展开/收起待办事项列表
2. 在待办事项列表中可以添加、编辑、删除待办事项
3. 点击待办事项前的复选框可以标记完成状态
4. 拖拽节点标题可以调整位置
5. 点击编辑按钮可以修改节点信息

## 许可证

MIT

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
