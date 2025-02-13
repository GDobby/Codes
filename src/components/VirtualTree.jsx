import React, { useEffect, useState, useCallback, useRef } from 'react';
import Tree from 'rc-tree';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { dbService } from '../services/indexedDBService';
import { cacheService } from '../services/cacheService';
import 'rc-tree/assets/index.css';
import './VirtualTree.css';

const VirtualTree = () => {
  const [treeData, setTreeData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const treeRef = useRef(null);
  const workerRef = useRef(null);

  // 初始化 Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      /* @vite-ignore */
      new URL('../workers/treeWorker.js', import.meta.url), 
      { type: 'module' }
    );
    
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      
      switch (type) {
        case 'VISIBLE_NODES':
          setTreeData(payload.nodes);
          break;
        case 'CHILDREN_SET':
          setTreeData(prevData => {
            return prevData.map(node => {
              if (node.key === payload.parentKey) {
                return { ...node, children: payload.children };
              }
              return node;
            });
          });
          break;
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // 加载节点数据
  const loadData = useCallback(async (parentId = null, page = 1) => {
    const cacheKey = cacheService.generateKey(parentId, page);
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // 尝试从 IndexedDB 获取数据
    try {
      const dbData = await dbService.getNodes(parentId, page);
      if (dbData.nodes.length > 0) {
        cacheService.set(cacheKey, dbData);
        console.log('从 IndexedDB 获取数据:', cacheKey, dbData);
        return dbData;
      }
    } catch (error) {
      console.warn('Failed to get data from IndexedDB:', error);
    }

    // 如果缓存和 IndexedDB 都没有，从服务器获取
    const params = new URLSearchParams({
      parentId: parentId || '',
      page,
      pageSize: 50
    });
    
    const response = await fetch(`http://localhost:3001/api/nodes?${params}`);
    const data = await response.json();
    
    // 存储到 IndexedDB 和缓存
    await dbService.addNodes(data.nodes, parentId);
    console.log('数据已存储到 IndexedDB:', parentId, data.nodes);
    cacheService.set(cacheKey, data);
    
    return data;
  }, []);

  // 加载更多数据
  const loadMore = useCallback(async (nextPage) => {
    const { nodes, hasMore } = await loadData(null, nextPage);
    
    // 将数据发送给 Worker 处理
    workerRef.current.postMessage({
      type: 'ADD_NODES',
      payload: { nodes }
    });

    workerRef.current.postMessage({
      type: 'GET_VISIBLE_NODES',
      payload: {
        startIndex: 0,
        endIndex: nextPage * 50
      }
    });
    
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
      
      workerRef.current.postMessage({
        type: 'ADD_NODES',
        payload: { nodes }
      });

      setTreeData(nodes);
      setInitialLoading(false);
    };

    initializeTree();
    
    return () => {
      cacheService.clear();
      workerRef.current?.postMessage({ type: 'CLEAR' });
    };
  }, [loadData]);

  // 异步加载子节点
  const onLoadData = async ({ key }) => {
    const { nodes } = await loadData(key);
    
    workerRef.current.postMessage({
      type: 'SET_CHILDREN',
      payload: { parentKey: key, children: nodes }
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
