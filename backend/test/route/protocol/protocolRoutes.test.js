// backend/test/routes/protocolRoutes.test.js
const request = require('supertest');
const app = require('../../index'); // Assuming app is exported from your main server file
const pool = require('../../database'); // Database connection for mocking
const { mockDbResponse } = require('../testHelper')


jest.mock('../../utils', () => ({
    handleError: jest.fn((res, error, status, message) => {
        res.status(status).json({ message });
    }),
}));

describe('Protocol Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(async () => {
        await pool.end();
   });
    describe('GET /protocols', () => {
         it('should return a list of all protocols', async () => {
             pool.getAllRecord = mockDbResponse([{ protocol_id: '123', title: 'test protocol' }])
             const res = await request(app)
                .get('/protocols')
               .set('Authorization', 'Bearer validToken');
            expect(res.status).toBe(200);
              expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ protocol_id: '123', title: 'test protocol' })]));
       });
         it('should return error if authentication fails', async () => {
           const res = await request(app).get('/protocols');
          expect(res.status).toBe(401);
          expect(res.body.message).toBe('Access token missing.');
        });
    });
    describe('POST /protocols', () => {
        it('should create a new protocol successfully', async () => {
           pool.insertRecord = mockDbResponse([{ protocol_id:'123', template_id:'345', project_id: '456', title: 'test title' }]);
           pool.query = mockDbResponse([[]]) //mock section query result
          const res = await request(app)
               .post('/protocols')
                .set('Authorization', 'Bearer validToken')
                 .send({ template_id: '345', project_id: '456', title: 'test title' });

            expect(res.status).toBe(201);
           expect(res.body).toHaveProperty('protocol_id');
            expect(res.body).toHaveProperty('title', 'test title');
            expect(pool.insertRecord).toHaveBeenCalledTimes(1)
         });
         it('should return 400 if input values is missing', async () => {
           const res = await request(app)
              .post('/protocols')
              .set('Authorization', 'Bearer validToken')
             .send({ template_id: '345', title: 'test title' });
              expect(res.status).toBe(400);
           expect(res.body.message).toBe('Project id is required, and must be a valid uuid.');
        });
      it('should return 401 if authentication fails', async () => {
         const res = await request(app).post('/protocols');
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Access token missing.');
      });
     });
      describe('GET /protocols/:protocol_id', () => {
          it('should return a protocol by id successfully', async () => {
              pool.getRecordById = mockDbResponse([{ protocol_id: '123', template_id: '345', project_id: '456', title: 'test protocol' }])
              pool.query = mockDbResponse([[]]);
             const res = await request(app)
                  .get('/protocols/123')
                   .set('Authorization', 'Bearer validToken');
              expect(res.status).toBe(200);
               expect(res.body).toHaveProperty('protocol_id', '123');
             expect(res.body).toHaveProperty('title', 'test protocol');
               expect(pool.query).toHaveBeenCalledTimes(1);
        });
         it('should return 404 if protocol not found', async () => {
              pool.getRecordById= mockDbResponse([null])
             const res = await request(app)
               .get('/protocols/123')
                 .set('Authorization', 'Bearer validToken');
            expect(res.status).toBe(404);
          expect(res.body.message).toBe('Protocol with id 123 not found.');
       });
        it('should return 400 for invalid parameters', async () => {
         const res = await request(app)
               .get('/protocols/invalidId')
                .set('Authorization', 'Bearer validToken')
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid protocol id format');
     });
      it('should return 401 if authentication fails', async () => {
         const res = await request(app).get('/protocols/123');
          expect(res.status).toBe(401);
          expect(res.body.message).toBe('Access token missing.');
      });
 });

     describe('PUT /protocols/:protocol_id', () => {
         it('should update a protocol successfully', async () => {
            pool.updateRecord = mockDbResponse([{ affectedRows: 1 }]);
             pool.getRecordById = mockDbResponse([{ protocol_id: '123', title: 'updated title' }]);
              pool.query = mockDbResponse([[]]);
              const res = await request(app)
                .put('/protocols/123')
                 .set('Authorization', 'Bearer validToken')
                 .send({ title: 'updated title' });
             expect(res.status).toBe(200);
           expect(res.body).toHaveProperty('protocol_id', '123');
              expect(res.body).toHaveProperty('title', 'updated title');
         });
        it('should return 404 if protocol does not exist', async () => {
           pool.updateRecord = mockDbResponse([{ affectedRows: 0 }]);
          const res = await request(app)
               .put('/protocols/123')
                 .set('Authorization', 'Bearer validToken')
                 .send({ title: 'updated title' });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Protocol with id 123 not found');
        });
       it('should return 400 for invalid parameters', async () => {
           const res = await request(app)
               .put('/protocols/invalidId')
                .set('Authorization', 'Bearer validToken')
                .send({title: 'test title'});
          expect(res.status).toBe(400);
           expect(res.body.message).toBe('Invalid protocol id format');
       });
       it('should return error if no token', async () => {
            const res = await request(app).put('/protocols/123');
           expect(res.status).toBe(401);
           expect(res.body.message).toBe('Access token missing.');
       });
      });
      describe('DELETE /protocols/:protocol_id', () => {
         it('should delete a protocol successfully', async () => {
              pool.deleteRecord = mockDbResponse([{affectedRows: 1}]);
            const res = await request(app)
                 .delete('/protocols/123')
                .set('Authorization', 'Bearer validToken');
             expect(res.status).toBe(200);
           expect(res.body.message).toBe('Protocol deleted successfully.');
       });
       it('should return error if protocol does not exist', async () => {
          pool.deleteRecord = mockDbResponse([{affectedRows: 0}])
            const res = await request(app)
                .delete('/protocols/123')
                 .set('Authorization', 'Bearer validToken');
            expect(res.status).toBe(404);
           expect(res.body.message).toBe('Protocol with id 123 not found');
        });
          it('should return error when no token provided', async () => {
              const res = await request(app).delete('/protocols/123');
              expect(res.status).toBe(401);
           expect(res.body.message).toBe('Access token missing.');
          });
      });
  describe('GET /templates', () => {
       it('should return a list of all templates', async () => {
          pool.getAllRecord= mockDbResponse([{ template_id: '123', template_name: 'test template' }])
            const res = await request(app)
                .get('/templates')
                .set('Authorization', 'Bearer validToken')
           expect(res.status).toBe(200);
          expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ template_id: '123', template_name: 'test template' })]));
        });
         it('should return 401 if authentication fails', async () => {
          const res = await request(app).get('/templates')
           expect(res.status).toBe(401);
          expect(res.body.message).toBe('Access token missing.');
        });
    });
     describe('POST /templates', () => {
       it('should create a template successfully', async () => {
           pool.insertRecord = mockDbResponse([{template_id:'123', template_name: 'test template', template_description: 'test template desc' }]);
            pool.query = mockDbResponse([[],[],[],[]]) //mock query call, section and data fields

            const res = await request(app)
                .post('/templates')
                .set('Authorization', 'Bearer validToken')
               .send({ template_name: 'test template', template_description: 'test template desc' });

            expect(res.status).toBe(201);
             expect(res.body).toHaveProperty('template_id');
           expect(res.body).toHaveProperty('template_name', 'test template');
           expect(res.body).toHaveProperty('template_description', 'test template desc');
       });
         it('should return 400 error if name is missing', async () => {
           const res = await request(app)
               .post('/templates')
             .set('Authorization', 'Bearer validToken')
                .send({ template_description: 'test template desc' });
           expect(res.status).toBe(400);
            expect(res.body.message).toBe('Template name is required and must be a string not more than 255 characters.');
       });
        it('should return 401 if authentication fails', async () => {
         const res = await request(app).post('/templates');
           expect(res.status).toBe(401);
          expect(res.body.message).toBe('Access token missing.');
       });
    });

     describe('GET /templates/:template_id', () => {
        it('should get a specific template by template_id successfully', async () => {
             pool.getRecordById = mockDbResponse([{ template_id: '123', template_name: 'test template', template_description: 'test template desc' }]);
          pool.query = mockDbResponse([[],[]]); // mock data fetch from template_sections, and data_field table queries

           const res = await request(app)
                .get('/templates/123')
               .set('Authorization', 'Bearer validToken');
          expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('template_id', '123');
          expect(res.body).toHaveProperty('template_name', 'test template');
            expect(res.body).toHaveProperty('template_description', 'test template desc');
           expect(pool.query).toHaveBeenCalledTimes(2);
        });
         it('should return 404 if template does not exits', async () => {
               pool.getRecordById = mockDbResponse([null]);
            const res = await request(app)
                 .get('/templates/123')
                 .set('Authorization', 'Bearer validToken');
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Template with id 123 not found.');
        });
         it('should return error for invalid template id parameter', async () => {
           const res = await request(app)
                 .get('/templates/invalidId')
                  .set('Authorization', 'Bearer validToken')
            expect(res.status).toBe(400);
             expect(res.body.message).toBe('Template id is required, and must be a valid uuid.');
         });
        it('should return 401 if authentication fails', async () => {
              const res = await request(app).get('/templates/123');
            expect(res.status).toBe(401);
             expect(res.body.message).toBe('Access token missing.');
         });
    });
});