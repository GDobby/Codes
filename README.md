# 虚拟树组件

基于 React 实现的高性能虚拟树组件，支持大数据量（40万节点）的展示和无限滚动加载。

## 功能特点

- 虚拟滚动：只渲染可视区域的节点
- 无限加载：滚动到底部自动加载更多数据
- 异步加载：支持子节点的异步加载
- 高性能：优化的数据结构和渲染逻辑

## 技术栈

- React
- Express (后端API)
- rc-tree (树组件基础)

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动后端服务：
```bash
node server/index.js
```

3. 启动前端开发服务器：
```bash
npm run dev
```

## 项目结构

```
src/
  ├── components/        # 组件目录
  │   └── VirtualTree/  # 虚拟树组件
  ├── hooks/            # 自定义Hook
  │   └── useInfiniteScroll.js
  └── server/           # 后端服务
      └── index.js
```

## API

### 后端API

- GET `/api/nodes`
  - 参数：
    - parentId: 父节点ID（可选）
    - page: 页码
    - pageSize: 每页数量
  - 返回：
    - nodes: 节点数组
    - hasMore: 是否有更多数据
    - total: 总节点数
