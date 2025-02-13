import { useState, useCallback, useRef } from 'react';

const useInfiniteScroll = ({ 
  loadMore, 
  threshold = 80,
  initialPage = 1,
  initialHasMore = true 
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const loadingRef = useRef(false);

  const handleScroll = useCallback(async (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    
    if (scrollHeight - scrollTop - clientHeight < threshold && hasMore && !loadingRef.current) {
      loadingRef.current = true;
      setLoading(true);
      
      try {
        const { items, hasMore: more } = await loadMore(currentPage + 1);
        setCurrentPage(prev => prev + 1);
        setHasMore(more);
        return { items, hasMore: more };
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }
    return null;
  }, [currentPage, hasMore, loadMore, threshold]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setHasMore(initialHasMore);
    setLoading(false);
    loadingRef.current = false;
  }, [initialPage, initialHasMore]);

  return {
    currentPage,
    loading,
    hasMore,
    handleScroll,
    reset
  };
};

export default useInfiniteScroll;
