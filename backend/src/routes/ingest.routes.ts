import { Router, Request, Response } from 'express';
import { Post } from '../models/Post';
import { addToQueue } from '../services/queue.service';

const router = Router();

interface IngestPost {
  text: string;
  source: string;
  region: string;
}

interface IngestBody {
  posts: IngestPost[];
}

router.post('/', async (req: Request<{}, {}, IngestBody>, res: Response): Promise<void> => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      res.status(400).json({ error: 'Invalid request: posts array is required' });
      return;
    }

    const savedPosts = [];

    for (const postData of posts) {
      const post = new Post({
        text: postData.text,
        source: postData.source,
        region: postData.region,
        createdAt: new Date(),
      });

      const saved = await post.save();
      savedPosts.push(saved);
    }

    // Add to processing queue
    addToQueue(savedPosts as any);

    res.status(201).json({
      message: `Successfully ingested ${savedPosts.length} posts`,
      posts: savedPosts.map(p => ({
        id: (p as any)._id,
        text: p.text,
        source: p.source,
        region: p.region,
      })),
    });
  } catch (error) {
    console.error('Error ingesting posts:', error);
    res.status(500).json({ error: 'Failed to ingest posts' });
  }
});

export default router;
