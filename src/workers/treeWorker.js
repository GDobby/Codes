// TreeStore 实现
class TreeStore {
  constructor() {
    this.nodeMap = new Map();
    this.childrenMap = new Map();
  }

  addNodes(nodes) {
    nodes.forEach(node => {
      this.nodeMap.set(node.key, {
        id: node.id,
        key: node.key,
        title: node.title,
        isLeaf: node.isLeaf
      });
    });
  }

  setChildren(parentKey, children) {
    this.childrenMap.set(parentKey, children.map(child => child.key));
    this.addNodes(children);
  }

  getVisibleNodes(startIndex, endIndex) {
    const visibleNodes = [];
    let currentIndex = 0;
    
    const traverse = (nodeKey, level = 0) => {
      const node = this.nodeMap.get(nodeKey);
      if (!node) return;

      if (currentIndex >= startIndex && currentIndex <= endIndex) {
        visibleNodes.push({
          ...node,
          level
        });
      }
      currentIndex++;

      if (this.childrenMap.has(nodeKey)) {
        const children = this.getChildren(nodeKey);
        children.forEach(child => traverse(child.key, level + 1));
      }
    };

    Array.from(this.nodeMap.keys())
      .filter(key => !key.includes('-'))
      .forEach(key => traverse(key));

    return visibleNodes;
  }

  getChildren(parentKey) {
    const childrenKeys = this.childrenMap.get(parentKey) || [];
    return childrenKeys.map(key => this.nodeMap.get(key));
  }

  clear() {
    this.nodeMap.clear();
    this.childrenMap.clear();
  }
}

const treeStore = new TreeStore();

// 处理来自主线程的消息
self.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'ADD_NODES':
      treeStore.addNodes(payload.nodes);
      self.postMessage({ type: 'NODES_ADDED' });
      break;

    case 'SET_CHILDREN':
      treeStore.setChildren(payload.parentKey, payload.children);
      self.postMessage({
        type: 'CHILDREN_SET',
        payload: { parentKey: payload.parentKey, children: treeStore.getChildren(payload.parentKey) }
      });
      break;

    case 'GET_VISIBLE_NODES': {
      const nodes = treeStore.getVisibleNodes(payload.startIndex, payload.endIndex);
      self.postMessage({
        type: 'VISIBLE_NODES',
        payload: { nodes }
      });
      break;
    }

    case 'CLEAR':
      treeStore.clear();
      self.postMessage({ type: 'CLEARED' });
      break;
  }
};
