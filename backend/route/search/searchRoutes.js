// backend/routes/search/searchRoutes.js
const express = require('express');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const pool = require('../../database');
const { authenticateToken, authorizeRole } = require('../../middleware/authMiddleware');
const { sanitizeInput, handleError } = require('../../utils');
const { body, validationResult, param, query } = require('express-validator');
const SearchQuery = require('../../models/searchQuery.model')
const Article = require('../../models/article.model');

const router = express.Router();
const SEARCH_QUERIES_TABLE = 'search_queries';
const ARTICLES_TABLE = 'articles';
/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Get articles based on query
 *     description: Get a list of articles based on the provided search query
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         description: search query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Articles retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                      article_id:
 *                       type: string
 *                       description: unique id of the article
 *                      database_id:
 *                         type: string
 *                         description: database id of the article
 *                      title:
 *                         type: string
 *                        description: Title of the article
 *                      authors:
 *                        type: string
 *                       description: Authors of the article
 *                       abstract:
 *                         type: string
 *                         description: Abstract of the article
 *                      publication_date:
 *                         type: string
 *                         description: publication date of the article
 *                     doi:
 *                       type: string
 *                       description: DOI of the article
 *                     pmid:
 *                        type: string
 *                       description: pubmed id of the article
 *                      pmcid:
 *                       type: string
 *                      description: pubmed central id of the article
 *                     additional_fields:
 *                       type: string
 *                      description: additional fields of the article, stored in json
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Search query is required'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *                message: 'Failed to fetch articles'
 */
router.get('/articles', authenticateToken,
   [
        query('query').notEmpty().isString().trim().isLength({max:1000}).withMessage('Search query is required, and must be a string not more than 1000 characters.')
    ],
   async (req, res) => {
       const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }
        const {query} = req.query;
    try{
         const queryData = {
             rawSqlString: `SELECT * FROM ${ARTICLES_TABLE} WHERE title LIKE '%${query}%' OR authors LIKE '%${query}%' OR abstract LIKE '%${query}%' `
         }
         const articles =  await pool.queryByRawSql(queryData.rawSqlString);
          res.status(200).json(articles.map(article=> new Article(article).toJSON()));
     } catch (error) {
         console.error('Error searching articles:', error);
         handleError(res, error, 500, 'Failed to fetch articles.');
    }
});

/**
 * @swagger
 * /search/query-builder:
 *   get:
 *     summary: Get saved queries for a user
 *     description: Retrieves the saved queries for a specific user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved queries fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   query_id:
 *                     type: string
 *                     description: unique id for search query
 *                   user_id:
 *                      type: string
 *                     description: unique id for user
 *                   database:
 *                     type: string
 *                     description: datbase used for the search
 *                   full_query:
 *                      type: string
 *                      description: The search query
 *                   created_at:
 *                      type: string
 *                       description: date and time that the search query was created.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *               message: 'Failed to retrieve queries.'
 */
router.get('/search/query-builder', authenticateToken, async (req, res) => {
  try {
      const queries = await pool.getAllRecord(SEARCH_QUERIES_TABLE, SearchQuery)
       res.status(200).json(queries.map(query => query.toJSON()));
  } catch (error) {
    console.error('Error fetching saved queries:', error);
      handleError(res, error, 500, 'Failed to retrieve queries.');
   }
});
/**
 * @swagger
 * /search/query-builder:
 *   post:
 *     summary: Save a search query
 *     description: Save a generated search query
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               database:
 *                 type: string
 *                 description: array of databases used for this query
 *               full_query:
 *                 type: string
 *                 description: The search query to save.
 *             example:
 *                 database: "pubmed"
 *                 search_query: "(title:(covid-19) OR abstract:(covid-19)) AND (author:johnson)"
 *     responses:
 *       201:
 *         description: Saved queries saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query_id:
 *                   type: string
 *                   description: The unique id for the new search query.
 *                 full_query:
 *                   type: string
 *                   description: The search query that was saved
 *                 created_at:
 *                    type: string
 *                     description: The timestamp that it was created.
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'database and query parameters are required'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *                message: 'Failed to save query'
 */
router.post('/search/query-builder', authenticateToken,
   [
        body('database').notEmpty().isString().trim().isLength({max:255}).withMessage('Database parameter is required, and must be a string not more than 255 characters.'),
        body('full_query').notEmpty().isString().trim().isLength({max:1000}).withMessage('Search query is required, and must be a string not more than 1000 characters.'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
        if (!errors.isEmpty()) {
           return res.status(400).json({ message: errors.array()[0].msg });
       }
       const { database, full_query } = req.body;
     try {
           const searchQuery = new SearchQuery({
              query_id: uuidv4(),
              user_id: req.user.user_id,
              database: database,
              full_query: full_query,
            });
          const savedQuery =  await pool.insertRecord(SEARCH_QUERIES_TABLE, searchQuery,['query_id', 'user_id', 'database', 'full_query']);
           if(!savedQuery)  return handleError(res, null, 500, 'Failed to save query.')
          res.status(201).json(new SearchQuery(savedQuery).toJSON());
      } catch (error) {
        console.error('Error saving search query:', error);
         handleError(res, error, 500, 'Failed to save query.');
      }
});
/**
 * @swagger
 * /search/generate-query:
 *   post:
 *     summary: Generate a search query
 *     description: Generate a search query based on the provided keywords, or PICO elements
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keywords:
 *                 type: string
 *                 description: The comma separated list of keywords.
 *               population:
 *                  type: string
 *                  description: Population for PICO query.
 *               intervention:
 *                  type: string
 *                 description: Intervention for PICO query.
 *               comparison:
 *                  type: string
 *                 description: Comparison for PICO query.
 *               outcome:
 *                  type: string
 *                 description: Outcome for PICO query.
 *             example:
 *               keywords: "covid-19, pandemic, vaccine"
 *     responses:
 *       200:
 *         description: Search query generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                   description: The generated search query.
 *             example:
 *                query: "covid-19 OR pandemic OR vaccine"
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *                message: 'Keywords parameter are required'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *               message: 'Failed to generate a search query'
 */
router.post('/search/generate-query', authenticateToken,
    [
       body('keywords').notEmpty().isString().trim().isLength({max:1000}).withMessage('Keywords parameter is required, and must be a string not more than 1000 characters.')
    ],
   async (req, res) => {
     const errors = validationResult(req);
       if (!errors.isEmpty()) {
          return res.status(400).json({ message: errors.array()[0].msg });
      }
     const {keywords} = req.body;
   try {
       //  Here, replace the logic to generate the query based on PICO or other elements. For now, only keyword is used
      const generatedQuery =  keywords.split(',').map(k =>  k.trim()).join(' OR ') // just basic key word to create query based on OR
         res.status(200).json({query: generatedQuery});
    } catch (error) {
      console.error('Error generating search query:', error);
      handleError(res, error, 500, 'Failed to generate a search query.');
    }
});
/**
 * @swagger
 * /search/translate-query:
 *   post:
 *     summary: Translate search query based on the database.
 *     description: Translates search queries for the provided databases.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: The search query to translate
 *               databases:
 *                 type: array
 *                 description: The databases to generate queries
 *             example:
 *                 query: "(title:covid-19 OR abstract:covid-19) AND (author:johnson)"
 *                 databases: ["pubmed", "scopus", "wos"]
 *     responses:
 *       200:
 *         description: Query translated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 translatedQueries:
 *                    type: object
 *                    description: The databases as keys with values as translated queries.
 *             example:
 *               translatedQueries: {pubmed: "(title:covid-19 OR abstract:covid-19) AND (author:johnson)", scopus: "TITLE-ABS(covid-19) AND AUTHOR(johnson)"}
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *                message: 'Query and database parameters are required'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *               message: 'Failed to translate the query.'
 */
router.post('/search/translate-query', authenticateToken,
  [
    body('query').notEmpty().isString().trim().isLength({max:1000}).withMessage('Query parameter is required, and must be a string not more than 1000 characters.'),
    body('databases').notEmpty().isArray().withMessage('Databases parameter is required, and must be an array.')
  ],
 async (req, res) => {
      const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ message: errors.array()[0].msg });
       }
     const { query, databases } = req.body;
    try {
         const translatedQueries = {};
         for (const database of databases) {
            switch (database) {
                case 'pubmed':
                    translatedQueries[database] = query; // No translation needed
                     break;
                case 'scopus':
                     translatedQueries[database] = query.replace(/title:/gi, 'TITLE-ABS(')
                     .replace(/abstract:/gi, 'TITLE-ABS(')
                     .replace(/\)/g, ')');
                    break;
                 case 'wos':
                       translatedQueries[database] = query.replace(/title:/gi, 'TI=')
                        .replace(/abstract:/gi, 'AB=')
                        .replace(/\(/g, '(ALL=')
                         .replace(/\)/g, ')');
                    break;
               case 'ovid':
                   translatedQueries[database] = query.replace(/\[Mesh\]/gi, '/exp')
                       .replace(/\[tiab\]/gi, '.tw.');
                    break;
                 case 'cochrane':
                      translatedQueries[database] = query.replace(/\[Mesh\]/gi, '[mh ""]')
                      .replace(/\[tiab\]/gi, ':ti,ab');
                      break;
               case 'embase':
                    translatedQueries[database] = query.replace(/\[Mesh\]/gi, '/exp')
                     .replace(/\[tiab\]/gi, ':ti,ab')
                  break;
                case 'cinahl':
                     translatedQueries[database] = query.replace(/\[Mesh\]/gi, 'MH ""+')
                     .replace(/tiab/gi, 'TI')
                      .replace(/ab/gi, 'AB');
                  break;
               case 'proquest':
                    translatedQueries[database] = query.replace(/\[Mesh\]/gi, 'MESH.EXACT.EXPLODE("")')
                      .replace(/tiab/gi, 'TI,AB');
                    break;
              case 'sportdiscus':
                  translatedQueries[database] = query.replace(/\[Mesh\]/gi, 'DE ""')
                     .replace(/tiab/gi, 'TI')
                     .replace(/ab/gi, 'AB');
                     break;
               case 'hinari':
                  translatedQueries[database] = query.replace(/\[Mesh\]/gi, '[MeSH Term]')
                    .replace(/tiab/gi, 'ti,ab');
                  break;
                case 'lens':
                   translatedQueries[database] = query.replace(/title:/gi, 'publication.title:')
                      .replace(/abstract:/gi, 'publication.abstract:')
                      .replace(/author:/gi, 'inventors:');
                  break;
                case 'google':
                  translatedQueries[database] = query;
                    break;
                default:
                    translatedQueries[database] = query;
                    break;
            }
        }
      res.status(200).json({ translatedQueries: translatedQueries });
    } catch (error) {
      console.error('Error during query translation:', error);
       handleError(res, error, 500, 'Failed to translate the query.');
    }
});

/**
 * @swagger
 * /search/results/export:
 *   get:
 *     summary: Export search results.
 *     description: Exports the search results in a specified format.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         description: The format in which search results are exported
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results exported successfully.
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *                message: 'Format parameter is required.'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *                message: 'Failed to export search results.'
 */
router.get('/search/results/export', authenticateToken,
    [
        query('format').notEmpty().isString().trim().isIn(['csv', 'excel','xml', 'pdf', 'word']).withMessage('Format parameter is required and must be csv, excel, xml, word, or pdf.')
    ],
   async (req, res) => {
     const errors = validationResult(req);
       if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
      }
    const {format} = req.query;
     try {
          // Placeholder logic: In real application get the data and then call the report utilities to export and send back to the user.
           res.status(200).send(`Search results will be exported in ${format} format`);
       } catch (error) {
           console.error('Error exporting search results:', error);
         handleError(res, error, 500, 'Failed to export search results.');
       }
});

/**
 * @swagger
 * /citation/format:
 *   post:
 *     summary: Format a citation
 *     description: Format a citation string based on the provided style
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               citation:
 *                 type: string
 *                 description: The citation string to format
 *               style:
 *                 type: string
 *                 description: The citation style e.g. APA, MLA, Chicago, Vancouver
 *             example:
 *                citation: "John Doe et al. (2023). Title of Article. Journal Name."
 *                style: "APA"
 *     responses:
 *       200:
 *         description: citation formatted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 formattedCitation:
 *                   type: string
 *                   description: The formatted citation
 *             example:
 *                 formattedCitation: "Doe, J., et al. (2023). Title of Article. Journal Name."
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                      type: string
 *                       description: The message returned by the system.
 *             example:
 *               message: 'Citation and style parameters are required.'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *                message: 'Failed to format the citation.'
 */
router.post('/citation/format', authenticateToken,
  [
      body('citation').notEmpty().isString().trim().isLength({max:1000}).withMessage('Citation parameter is required and must be a string not more than 1000 characters.'),
       body('style').notEmpty().isString().trim().isIn(['APA', 'MLA', 'Chicago', 'Vancouver']).withMessage('Style parameter is required and must be APA, MLA, Chicago, or Vancouver.')
   ],
    async (req, res) => {
       const errors = validationResult(req);
        if (!errors.isEmpty()) {
           return res.status(400).json({ message: errors.array()[0].msg });
        }
        const { citation, style } = req.body;
     try{
         //TODO - Implement logic to format a citation string.
         res.status(200).json({ formattedCitation: `Citation formatted to ${style}: ${citation}` });
    } catch(error)
       {
         console.error('Error formating citation:', error);
         handleError(res, error, 500, 'Failed to format the citation.');
      }
});

/**
 * @swagger
 * /citation/bibliography:
 *   post:
 *     summary: Generate bibliography.
 *     description: Generates bibliography based on the citations and the style
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               citations:
 *                 type: array
 *                 items:
 *                     type: string
 *                 description: The citations to format and generate bibliography.
 *               style:
 *                 type: string
 *                 description: The citation style to use for bibliography e.g. APA, MLA, Chicago, Vancouver
 *             example:
 *               citations: [
 *                   "John Doe et al. (2023). Title of Article. Journal Name.",
 *                   "Another Author (2024). Title of Book. Publisher."
 *               ],
 *                style: "APA"
 *     responses:
 *       200:
 *         description: Bibliography generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bibliography:
 *                   type: string
 *                   description: The generated bibliography based on given citations and style
 *             example:
 *                bibliography: "Doe, J., et al. (2023). Title of Article. Journal Name. \nAnother Author (2024). Title of Book. Publisher."
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Citations and style parameters are required.'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *               message: 'Failed to generate bibliography.'
 */
router.post('/citation/bibliography', authenticateToken,
 [
      body('citations').notEmpty().isArray().withMessage('Citations must be an array'),
      body('citations.*').isString().trim().isLength({max:1000}).withMessage('Each citation in citations must be a string not more than 1000 characters'),
      body('style').notEmpty().isString().trim().isIn(['APA', 'MLA', 'Chicago', 'Vancouver']).withMessage('Style parameter is required and must be APA, MLA, Chicago, or Vancouver.')
  ],
    async (req, res) => {
      const errors = validationResult(req);
       if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
       }
        const { citations, style } = req.body;
   try{
          //TODO - Implement logic to generate bibliography
        res.status(200).json({ bibliography:  `Generated bibliography using ${style} style is: ${citations.join("\n")}` });
     } catch (error) {
       console.error('Error generating bibliography:', error);
       handleError(res, error, 500, 'Failed to generate bibliography.');
      }
});
/**
 * @swagger
 * /citation/link:
 *   post:
 *     summary: Link citation to the article full text
 *     description: Links a citation to the full text article
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doi:
 *                 type: string
 *                 description: DOI of the article for the link.
 *               pmid:
 *                 type: string
 *                 description: PMID of the article for the link.
 *             example:
 *                doi: "10.1000/test"
 *                pmid: "23423432"
 *     responses:
 *       200:
 *         description: Successfully linked the citation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   link:
 *                      type: string
 *                       description: Link to the article full text
 *             example:
 *                link: "https://test.com/10.1000/test"
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Either DOI or PMID are required.'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The message returned by the system.
 *             example:
 *                message: 'Failed to link the citation.'
 */
router.post('/citation/link', authenticateToken,
   [
      body().custom((value, { req }) => {
           if (!req.body.doi && !req.body.pmid) {
               throw new Error('Either DOI or PMID is required.');
           }
           return true;
       }),
       body('doi').optional().isString().trim().isLength({max:255}).withMessage('DOI must be a string not more than 255 characters'),
      body('pmid').optional().isString().trim().isLength({max:255}).withMessage('PMID must be a string not more than 255 characters')
   ],
   async (req, res) => {
        const errors = validationResult(req);
         if (!errors.isEmpty()) {
             return res.status(400).json({ message: errors.array()[0].msg });
         }
        const { doi, pmid } = req.body;
     try {
         //TODO - Implement the logic to fetch the link to the full text, based on pmid or doi.
        res.status(200).json({ link: `Article full text is available at https://test.com/${doi || pmid}` });
    } catch (error) {
      console.error('Error linking citation:', error);
        handleError(res, error, 500, 'Failed to link the citation.');
     }
});
router.use((req, res, next) => {
    // Log all changes to the audit trail.
    const logDetails = {
        user_id: req.user ? req.user.user_id : null,
        action: `${req.method} ${req.path}`,
        target_type: 'api',
         target_id: null,
         details: JSON.stringify(req.body || req.query)
     };
    pool.query('INSERT INTO audit_logs(log_id, user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)', [uuidv4(), logDetails.user_id, logDetails.action, logDetails.target_type, logDetails.target_id, logDetails.details])
    next();
});
module.exports = router;