const mockCohere = {
  reRank: async (query, documents, limit) => {
    // Mock reranking by returning indexes in reverse order
    return documents.map((_, index) => ({ index: documents.length - 1 - index }));
  }
};

export default mockCohere;