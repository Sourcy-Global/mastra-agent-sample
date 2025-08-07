export async function getEmbeddings(text) {
  // Mock embedding - return array of random numbers based on text length
  const dimension = 1536; // Common embedding dimension
  return Array.from({ length: dimension }, (_, i) => 
    Math.sin(i * text.length) * Math.cos(i * 0.1)
  );
}