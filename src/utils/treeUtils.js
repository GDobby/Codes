// 将树形数据扁平化存储
export class TreeStore {
  constructor() {
    this.nodeMap = new Map(); // 存储节点
    this.childrenMap = new Map(); // 存储父子关系
  }

  // 添加节点
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

  // 设置子节点
  setChildren(parentKey, children) {
    this.childrenMap.set(parentKey, children.map(child => child.key));
    this.addNodes(children);
  }

  // 获取节点
  getNode(key) {
    return this.nodeMap.get(key);
  }

  // 获取子节点
  getChildren(parentKey) {
    const childrenKeys = this.childrenMap.get(parentKey) || [];
    return childrenKeys.map(key => this.getNode(key));
  }

  // 获取可见节点
  getVisibleNodes(startIndex, endIndex) {
    const visibleNodes = [];
    let currentIndex = 0;
    
    const traverse = (nodeKey, level = 0) => {
      const node = this.getNode(nodeKey);
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
      .filter(key => !key.includes('-')) // 根节点
      .forEach(key => traverse(key));

    return visibleNodes;
  }

  // 清除数据
  clear() {
    this.nodeMap.clear();
    this.childrenMap.clear();
  }
}
