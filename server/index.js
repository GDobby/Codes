import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 生成树节点数据
function generateNodes(parentId, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  return Array.from({ length: pageSize }, (_, index) => {
    const currentIndex = startIndex + index;
    const id = parentId ? `${parentId}-${currentIndex}` : `${currentIndex}`;
    return {
      id,
      key: id,
      title: `节点 ${id}`,
      isLeaf: false,
    };
  });
}

// 获取树节点的API
app.get('/api/nodes', (req, res) => {
  const { parentId, page = 1, pageSize = 100 } = req.query;
  const total = parentId ? 1000 : 400000; // 根节点40万个，子节点1000个
  
  setTimeout(() => {
    const nodes = generateNodes(parentId, parseInt(page), parseInt(pageSize));
    const hasMore = (page * pageSize) < total;
    
    res.json({
      nodes,
      total,
      hasMore
    });
  }, 100); 
});



const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
