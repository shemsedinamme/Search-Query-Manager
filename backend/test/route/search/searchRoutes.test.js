// backend/test/routes/searchRoutes.test.js
const request = require('supertest');
const app = require('../../index'); // Assuming app is exported from your main server file
const pool = require('../../database'); // Database connection for mocking
const { mockDbResponse } = require('../testHelper')

jest.mock('../../utils', () => ({
  handleError: jest.fn((res, error, status, message) => {
    res.status(status).json({ message });
  }),
}));

describe('Search Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await pool.end();
  });
  describe('GET /articles', () => {
    it('should return a list of articles by search query', async () => {
      pool.queryByRawSql = mockDbResponse([[{ article_id: '123', title: 'test article' }]]);
      const res = await request(app)
        .get('/articles')
        .set('Authorization', 'Bearer validToken')
        .query({ query: 'test' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ article_id: '123', title: 'test article' })]));
    });
    it('should return error if no query is provided', async () => {
      const res = await request(app)
        .get('/articles')
        .set('Authorization', 'Bearer validToken');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Search query is required, and must be a string not more than 1000 characters.');
    });
  });
  describe('GET /search/query-builder', () => {
    it('should return all saved queries', async () => {
      pool.getAllRecord = mockDbResponse([{ query_id: '123', full_query: 'test query' }])
      const res = await request(app)
        .get('/search/query-builder')
        .set('Authorization', 'Bearer validToken');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ query_id: '123', full_query: 'test query' })]));
    });
    it('should return 401 when token is not provided', async () => {
      const res = await request(app).get('/search/query-builder');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Access token missing.');
    });
  });
  describe('POST /search/query-builder', () => {
    it('should save a search query successfully', async () => {
      pool.insertRecord = mockDbResponse([{ query_id: '123', full_query: 'test query' }]);
      const res = await request(app)
        .post('/search/query-builder')
        .set('Authorization', 'Bearer validToken')
        .send({
          database: 'testdb',
          full_query: 'test query',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('query_id');
      expect(res.body).toHaveProperty('full_query', 'test query');
    });
    it('should return 400 if parameters are not provided', async () => {
      const res = await request(app)
        .post('/search/query-builder')
        .set('Authorization', 'Bearer validToken')
        .send({ database: 'testdb' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Search query is required, and must be a string not more than 1000 characters.');
    });
  });
  describe('POST /search/generate-query', () => {
    it('should generate a search query successfully', async () => {
      const res = await request(app)
        .post('/search/generate-query')
        .set('Authorization', 'Bearer validToken')
        .send({ keywords: 'test,key,word' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('query', 'test OR key OR word');
    });
    it('should return error if no keyword provided', async () => {
      const res = await request(app)
        .post('/search/generate-query')
        .set('Authorization', 'Bearer validToken')
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Keywords parameter is required, and must be a string not more than 1000 characters.');
    });
  });

  describe('POST /search/translate-query', () => {
    it('should return translated queries successfully', async () => {
      const res = await request(app)
        .post('/search/translate-query')
        .set('Authorization', 'Bearer validToken')
        .send({
          query: 'test query',
          databases: ['pubmed', 'scopus', 'wos', 'ovid', 'cochrane', 'embase', 'cinahl', 'proquest', 'sportdiscus', 'hinari', 'lens', 'google'],
        });
      expect(res.status).toBe(200);
      expect(res.body.translatedQueries).toHaveProperty('pubmed', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('scopus', 'TITLE-ABS(test query)');
      expect(res.body.translatedQueries).toHaveProperty('wos', '(ALL=test query)');
      expect(res.body.translatedQueries).toHaveProperty('ovid', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('cochrane', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('embase', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('cinahl', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('proquest', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('sportdiscus', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('hinari', 'test query');
      expect(res.body.translatedQueries).toHaveProperty('lens', 'publication.title:test query');
      expect(res.body.translatedQueries).toHaveProperty('google', 'test query');

    });
    it('should return 400 if parameters are not provided', async () => {
      const res = await request(app)
        .post('/search/translate-query')
        .set('Authorization', 'Bearer validToken')
        .send({
          query: 'test query'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Databases parameter is required, and must be an array.');
    });
  });
  describe('GET /search/results/export', () => {
    it('should return a search results message if format provided', async () => {
      const res = await request(app)
        .get('/search/results/export')
        .set('Authorization', 'Bearer validToken')
        .query({ format: 'csv' });

      expect(res.status).toBe(200);
      expect(res.text).toBe('Search results will be exported in csv format');
    });
    it('should return error when format is not specified', async () => {
      const res = await request(app)
        .get('/search/results/export')
        .set('Authorization', 'Bearer validToken')

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Format parameter is required and must be csv, excel, xml, word, or pdf.');
    });
  });
  describe('POST /citation/format', () => {
    it('should format a citation successfully', async () => {
      const res = await request(app)
        .post('/citation/format')
        .set('Authorization', 'Bearer validToken')
        .send({ citation: 'test citation', style: 'APA' });
      expect(res.status).toBe(200);
      expect(res.body.formattedCitation).toBe('Citation formatted to APA: test citation');
    });
    it('should return error if no citation or style provided', async () => {
      const res = await request(app)
        .post('/citation/format')
        .set('Authorization', 'Bearer validToken');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Citation and style parameters are required.');
    });
    it('should return error if style is invalid', async () => {
      const res = await request(app)
        .post('/citation/format')
        .set('Authorization', 'Bearer validToken')
        .send({ citation: 'test citation', style: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Style parameter is required and must be APA, MLA, Chicago, or Vancouver.');
    });
  });
  describe('POST /citation/bibliography', () => {
    it('should generate a bibliography successfully', async () => {
      const res = await request(app)
        .post('/citation/bibliography')
        .set('Authorization', 'Bearer validToken')
        .send({ citations: ['test citation'], style: 'APA' });

      expect(res.status).toBe(200);
      expect(res.body.bibliography).toBe('Generated bibliography using APA style is: test citation');
    });
    it('should return error if style or citations is not provided', async () => {
      const res = await request(app)
        .post('/citation/bibliography')
        .set('Authorization', 'Bearer validToken')

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Citations and style parameters are required.');
    });
    it('should return error if style is invalid', async () => {
      const res = await request(app)
        .post('/citation/bibliography')
        .set('Authorization', 'Bearer validToken')
        .send({ citations: ['test citation'], style: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Style parameter is required and must be APA, MLA, Chicago, or Vancouver.');
    });
  });
  describe('POST /citation/link', () => {
    it('should return citation link if doi or pmid provided', async () => {
      const res = await request(app)
        .post('/citation/link')
        .set('Authorization', 'Bearer validToken')
        .send({ doi: '12312', pmid: '2343234' });
      expect(res.status).toBe(200);
      expect(res.body.link).toBe('Article full text is available at https://test.com/12312');
    });
    it('should return error if no doi or pmid provided', async () => {
      const res = await request(app)
        .post('/citation/link')
        .set('Authorization', 'Bearer validToken')
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Either DOI or PMID is required.');
    });
  });
});