import React, { useEffect, useState, useCallback, useRef } from 'react';
import Tree from 'rc-tree';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import 'rc-tree/assets/index.css';
import './VirtualTree.css';

// 更新树节点数据
const updateTreeData = (list, key, children) => {
  return list.map(node => {
    if (node.key === key) {
      return { ...node, children };
    }
    if (node?.children) {
      return { ...node, children: updateTreeData(node.children, key, children) };
    }
    return node;
  });
};
const VirtualTree = () => {
  const [treeData, setTreeData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const treeRef = useRef(null);

  // 加载节点数据
  const loadData = useCallback(async (parentId = null, page = 1) => {
    const params = new URLSearchParams({
      parentId: parentId || '',
      page,
      pageSize: 50
    });
    const response = await fetch(`http://localhost:3001/api/nodes?${params}`);
    const data = await response.json();
    return data;
  }, []);

  // 加载更多数据
  const loadMore = useCallback(async (nextPage) => {
    const { nodes, hasMore } = await loadData(null, nextPage);
    setTreeData(prev => [...prev, ...nodes]);
    return { items: nodes, hasMore };
  }, [loadData]);

  const { loading, hasMore, handleScroll } = useInfiniteScroll({
    loadMore,
    threshold: 80
  });

  // 初始加载
  useEffect(() => {
    const initializeTree = async () => {
      const { nodes } = await loadData();
      setTreeData(nodes);
      setInitialLoading(false);
    };
    initializeTree();
  }, [loadData]);

  // 异步加载子节点
  const onLoadData = async ({ key }) => {
    const { nodes } = await loadData(key);
    setTreeData(prevData => {
      return updateTreeData(prevData, key, nodes);
    });
  };

  if (initialLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="tree-container">
      <h1>虚拟树组件</h1>
      <div className="tree-wrapper">
        <Tree
          ref={treeRef}
          loadData={onLoadData}
          treeData={treeData}
          height={600}
          virtual
          itemHeight={24}
          style={{ fontSize: '16px' }}
          onScroll={handleScroll}
        />
        {loading && <div className="loading-more">加载中...</div>}
        {hasMore && !loading && <div className="loading-more">下滑加载更多</div>}
      </div>
    </div>
  );
};

export default VirtualTree;
