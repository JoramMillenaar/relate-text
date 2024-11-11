import { XenovaEmbeddingService } from '../text-to-embedding/index.js';
import { VectraDatabaseController, QueryResult } from './databaseController.js';
import { EmbeddingAlreadyExists } from './errors.js';


export class TextToEmbeddingController {
    private embedder: XenovaEmbeddingService;
    private db: VectraDatabaseController;

    constructor() {
        this.embedder = new XenovaEmbeddingService();
        this.db = new VectraDatabaseController();
    }
    async ready(): Promise<void> {
        await this.embedder.ready();
        await this.db.ready();
    }

    async create(id: string, text: string, metadata: Record<string, string>): Promise<void> {
        if (await this.db.exists(id)) {
            throw new EmbeddingAlreadyExists(`Embedding with ID '${id}' already exists`);
        }
        const embeddingChunks = await this.embedder.generateEmbeddingChunks(text);
        for (const embeddingChunk of embeddingChunks) {
            this.db.create(id, embeddingChunk.embedding, metadata);
        }
    }
    async update(id: string, text: string, metadata: object): Promise<void> {

    }
    async destroy(id: string): Promise<void> {

    }
    async destroyAll(): Promise<void> {
        await this.db.dropDatabase();
        await this.db.ready();
    }
    async retrieveSimilar(text: string, limit: number): Promise<QueryResult[]> {
        const embeddingChunks = await this.embedder.generateEmbeddingChunks(text);
        const aggregatedResults: QueryResult[] = [];

        for (const embeddingChunk of embeddingChunks) {
            const results = await this.db.querySimilar(embeddingChunk.embedding, limit);
            aggregatedResults.push(...results);
        }

        const topResults = aggregatedResults
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return topResults;
    }
}