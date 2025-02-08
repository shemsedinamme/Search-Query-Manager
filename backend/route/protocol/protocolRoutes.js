// backend/routes/protocol/protocolRoutes.js
const express = require('express');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const pool = require('../../database');
const { authenticateToken, authorizeRole } = require('../../middleware/authMiddleware');
const { sanitizeInput, handleError } = require('../../utils');
const { body, validationResult, param } = require('express-validator');
const Protocol = require('../../models/protocol.model');
const Template = require('../../models/template.model');

const router = express.Router();
const PROTOCOLS_TABLE = 'protocols';
const TEMPLATES_TABLE = 'templates';
const TEMPLATE_SECTIONS_TABLE = 'template_sections';
const TEMPLATE_DATA_FIELDS_TABLE = 'template_data_fields';
const PROTOCOL_SECTIONS_TABLE = 'protocol_sections';
/**
 * @swagger
 * /protocols:
 *   get:
 *     summary: Get all protocols
 *     description: Retrieves a list of all protocols
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of protocols retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                     protocol_id:
 *                       type: string
 *                       description: The unique identifier of the protocol.
 *                     template_id:
 *                       type: string
 *                       description: The id of the template for the protocol
 *                     project_id:
 *                      type: string
 *                      description: The unique id for the project
 *                     title:
 *                      type: string
 *                      description: Title of the protocol
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
 *                message: 'Failed to retrieve protocols.'
 */
router.get('/protocols', authenticateToken, async (req, res) => {
  try {
     const protocols =  await pool.getAllRecord(PROTOCOLS_TABLE, Protocol);
     res.status(200).json(protocols.map(protocol => protocol.toJSON()));
  } catch (error) {
    console.error('Error fetching protocols:', error);
    handleError(res, error, 500, 'Failed to retrieve protocols.');
  }
});

/**
 * @swagger
 * /protocols:
 *   post:
 *     summary: Create a new protocol
 *     description: Creates a new protocol using a template and project ID.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_id:
 *                 type: string
 *                 description: The ID of the template to use.
 *               project_id:
 *                 type: string
 *                 description: The ID of the project to attach this protocol to.
 *               title:
 *                 type: string
 *                 description: Title for the protocol.
 *             example:
 *               template_id: "12345"
 *               project_id: "abcdef"
 *               title: "My Protocol Title"
 *     responses:
 *       201:
 *         description: Protocol created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 protocol_id:
 *                   type: string
 *                   description: unique id of the protocol
 *                 template_id:
 *                    type: string
 *                    description: The id of the template for this protocol
 *                 project_id:
 *                   type: string
 *                   description: The unique id of the project for this protocol
 *                 title:
 *                    type: string
 *                    description: Title of the protocol
 *                  sections:
 *                    type: array
 *                    description: array of sections for this protocol
 *                    items:
 *                        type: object
 *                        properties:
 *                           section_id:
 *                              type: string
 *                              description: unique id for the protocol section
 *                           section_name:
 *                              type: string
 *                               description: name of the section
 *                            content:
 *                               type: string
 *                                 description: Content of the section
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
 *                message: 'Template id, project id and title are required'
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
 *                message: 'Failed to create protocol.'
 */
router.post('/protocols', authenticateToken,
  [
      body('template_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Template id is required, and must be a valid uuid.'),
      body('project_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Project id is required, and must be a valid uuid.'),
      body('title').notEmpty().isString().trim().isLength({max:255}).withMessage('Protocol title is required, and must be a string not more than 255 characters.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { template_id, project_id, title } = req.body;
   try{
        const newProtocol = new Protocol({
            protocol_id: uuidv4(),
            template_id: template_id,
            project_id: project_id,
            title: title
        });

         const createdProtocol = await pool.insertRecord(PROTOCOLS_TABLE, newProtocol, ['protocol_id', 'template_id', 'project_id', 'title']);
           if(!createdProtocol) return handleError(res, null, 500, `Failed to create new protocol, please check your database!`);
           const [sections] =  await pool.query('SELECT section_id, section_name FROM template_sections WHERE template_id = ?', [template_id]);
           const protocolObj =  new Protocol(createdProtocol); // map to model object
            const protocolSections = [];
            if(sections && sections.length > 0){
               for(const section of sections){
               const newSectionId = uuidv4();
               await pool.query( 'INSERT INTO protocol_sections (section_id, protocol_id, section_name) VALUES (?, ?, ?)', [newSectionId, newProtocol.protocol_id, section.section_name])
               protocolSections.push({ section_id: newSectionId, section_name: section.section_name, content: ""})
             }
            }
            res.status(201).json({...protocolObj.toJSON(), sections: protocolSections});

    } catch (error) {
       console.error('Error creating protocol:', error);
      handleError(res, error, 500, 'Failed to create protocol.');
   }
});
/**
 * @swagger
 * /protocols/{protocol_id}:
 *   get:
 *     summary: Get a protocol by id
 *     description: Gets a protocol based on the protocol id.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: protocol_id
 *         required: true
 *         description: ID of the protocol to get.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Protocol fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 protocol_id:
 *                   type: string
 *                   description: unique id of the protocol
 *                 template_id:
 *                    type: string
 *                   description: The id of the template for this protocol
 *                 project_id:
 *                   type: string
 *                   description: The unique id of the project for this protocol
 *                 title:
 *                    type: string
 *                    description: Title of the protocol
 *                 sections:
 *                    type: array
 *                    description: array of sections for this protocol
 *                    items:
 *                        type: object
 *                        properties:
 *                           section_id:
 *                              type: string
 *                              description: unique id for the protocol section
 *                           section_name:
 *                              type: string
 *                               description: name of the section
 *                            content:
 *                               type: string
 *                                 description: Content of the section
 *       404:
 *         description: Protocol not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Protocol not found.'
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
 *                message: 'Failed to fetch protocol.'
 */
router.get('/protocols/:protocol_id', authenticateToken,
    [
        param('protocol_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Invalid protocol id format')
    ],
    async (req, res) => {
        const errors = validationResult(req);
         if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }
       const { protocol_id } = req.params;
      try{
           const protocol =  await pool.getRecordById(PROTOCOLS_TABLE, protocol_id, 'protocol_id', Protocol);
          if(!protocol) return handleError(res, null, 404, `Protocol with id ${protocol_id} not found.`);
           const [sections] = await pool.query('SELECT section_id, section_name, content FROM protocol_sections WHERE protocol_id = ?', [protocol_id]);
           res.status(200).json({...protocol.toJSON(), sections: sections});
       } catch (error) {
          console.error('Error fetching protocol:', error);
        handleError(res, error, 500, 'Failed to fetch protocol.');
       }
});
/**
 * @swagger
 * /protocols/{protocol_id}:
 *   put:
 *     summary: Update a specific protocol
 *     description: Updates a specific protocol based on the provided id.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: protocol_id
 *         required: true
 *         description: ID of the protocol to update.
 *         schema:
 *           type: string
  *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
  *               title:
 *                 type: string
 *                 description: The title of the protocol.
 *             example:
 *               title: "My Updated Protocol Title"
 *     responses:
 *       200:
 *         description: Protocol updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 protocol_id:
 *                   type: string
 *                   description: The unique identifier of the protocol.
 *                 template_id:
 *                    type: string
 *                   description: The id of the template for this protocol
 *                 project_id:
 *                   type: string
 *                   description: The unique id of the project for this protocol
 *                 title:
 *                    type: string
 *                    description: Title of the protocol
  *                      sections:
 *                         type: array
 *                         description: array of sections for this protocol
 *                         items:
 *                           type: object
 *                           properties:
 *                             section_id:
 *                                type: string
 *                              description: unique id for the protocol section
 *                             section_name:
 *                                type: string
 *                                description: name of the section
 *                             content:
 *                                type: string
 *                                 description: Content of the section
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                    message:
 *                       type: string
 *                       description: The message returned by the system.
 *              example:
 *                message: 'Title is required'
 *       404:
 *         description: Protocol not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Protocol not found.'
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
 *                message: 'Failed to update protocol.'
 */
router.put('/protocols/:protocol_id', authenticateToken,
 [
       param('protocol_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Invalid protocol id format'),
     body('title').notEmpty().isString().trim().isLength({max:255}).withMessage('Title is required and must be a string not more than 255 characters.')
   ],
   async (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
           return res.status(400).json({ message: errors.array()[0].msg });
        }
        const { protocol_id } = req.params;
       const { title } = req.body;
    try {
        const updatedProtocol = await pool.updateRecord(PROTOCOLS_TABLE, { title }, protocol_id, 'protocol_id', ['title']);
          if(!updatedProtocol) return handleError(res, null, 404, `Protocol with id ${protocol_id} not found`);
        const protocol = await pool.getRecordById(PROTOCOLS_TABLE, protocol_id, 'protocol_id', Protocol);
       const [sections] = await pool.query('SELECT section_id, section_name, content FROM protocol_sections WHERE protocol_id = ?', [protocol_id]);
        res.status(200).json({...protocol.toJSON(), sections: sections});
  } catch (error) {
       console.error('Error updating protocol:', error);
       handleError(res, error, 500, 'Failed to update protocol.');
    }
});

/**
 * @swagger
 * /protocols/{protocol_id}:
 *   delete:
 *     summary: Delete a protocol by ID.
 *     description: Deletes a protocol using its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: protocol_id
 *         required: true
 *         description: ID of the protocol to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Protocol deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                     type: string
 *                     description: Message from system about deletion.
 *       404:
 *         description: Protocol not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Protocol not found.'
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
 *               message: 'Failed to delete protocol.'
 */
router.delete('/protocols/:protocol_id', authenticateToken,
  [
        param('protocol_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Invalid protocol id format')
    ],
     async (req, res) => {
       const { protocol_id } = req.params;
       try{
            const delProtocol =  await pool.deleteRecord(PROTOCOLS_TABLE, protocol_id, 'protocol_id');
           if(!delProtocol) return handleError(res, null, 404, `Protocol with id ${protocol_id} not found`);
            res.status(200).json({ message: 'Protocol deleted successfully.' });
      } catch (error) {
         console.error('Error deleting protocol:', error);
         handleError(res, error, 500, 'Failed to delete protocol.');
      }
});
/**
 * @swagger
 * /templates:
 *   get:
 *     summary: Get all protocol templates
 *     description: Retrieves a list of all protocol templates.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                      template_id:
 *                        type: string
 *                        description: unique id of the template
 *                      template_name:
 *                         type: string
 *                         description: name of the template
 *                     template_description:
 *                         type: string
 *                         description: description of the template
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
 *                message: 'Failed to retrieve templates'
 */
router.get('/templates', authenticateToken, async (req, res) => {
    try {
        const templates = await pool.getAllRecord(TEMPLATES_TABLE, Template);
        res.status(200).json(templates.map(template => template.toJSON()));
    } catch (error) {
        console.error('Error fetching templates:', error);
        handleError(res, error, 500, 'Failed to retrieve templates');
    }
});

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Creates a new protocol template.
 *     description: Creates a new protocol template.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_name:
 *                 type: string
 *                 description: Name of the template.
 *               template_description:
 *                 type: string
 *                 description: Description of the template.
 *                 sections:
 *                    type: array
 *                    description: array of sections
 *                    items:
 *                       type: object
 *                       properties:
 *                         section_name:
 *                           type: string
 *                           description: name of the section.
 *                         data_fields:
 *                            type: array
 *                            description: array of data fields
 *                            items:
 *                               type: object
 *                               properties:
 *                                  field_name:
 *                                     type: string
 *                                     description: name of the data field
 *             example:
 *               template_name: "Sample Template"
 *               template_description: "Sample Template description"
 *               sections:
 *                  [{section_name:"section1" , data_fields:[{field_name:"field1"}, {field_name:"field2"}]}]
 *     responses:
 *       201:
 *         description: New template created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                      template_id:
 *                        type: string
 *                        description: unique id for this template
 *                      template_name:
 *                        type: string
 *                        description: Name of the template
 *                     template_description:
 *                       type: string
 *                        description: Description of the template
 *                      sections:
 *                       type: array
 *                       description: array of sections for this template
 *                       items:
 *                          type: object
 *                         properties:
 *                            section_id:
 *                              type: string
 *                              description: id of the section
 *                            section_name:
 *                              type: string
 *                              description: name of the section
 *                           data_fields:
 *                                type: array
 *                                description: array of data fields for this section
 *                                items:
 *                                    type: object
 *                                   properties:
 *                                      field_id:
 *                                       type: string
 *                                       description: id of the data field
 *                                     field_name:
 *                                        type: string
 *                                        description: name of the data field
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
 *               message: 'Template name and description required'
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
 *                message: 'Failed to create a new template.'
 */
router.post('/templates', authenticateToken,
    [
        body('template_name').notEmpty().isString().trim().isLength({max:255}).withMessage('Template name is required and must be a string not more than 255 characters.'),
        body('template_description').optional().isString().trim().isLength({max:1000}).withMessage('Template description is optional and must be a string not more than 1000 characters.'),
        body('sections').optional().isArray().withMessage('Sections must be an array.'),
        body('sections.*.section_name').optional().isString().trim().isLength({max:255}).withMessage('Section names must be a string not more than 255 characters'),
       body('sections.*.data_fields').optional().isArray().withMessage('data fields must be an array.'),
        body('sections.*.data_fields.*.field_name').optional().isString().trim().isLength({max:255}).withMessage('data field name must be a string not more than 255 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
         if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }
        const { template_name, template_description, sections} = req.body;
         try {
             const newTemplate = new Template({
                  template_id: uuidv4(),
                 template_name: template_name,
                template_description: template_description,
            });
          const result = await pool.insertRecord(TEMPLATES_TABLE, newTemplate, ['template_id','template_name','template_description']);
                if (!result) {
                  throw new Error('Failed to create a new template.');
              }
          const templateObj = new Template(result); // transform to data object
            if(sections && sections.length > 0){
              for( const section of sections){
                  const newSectionId = uuidv4();
                 await pool.query('INSERT INTO template_sections (section_id, template_id, section_name) VALUES (?, ?, ?)', [newSectionId, newTemplate.template_id, sanitizeInput(section.section_name)]);

                    if(section.data_fields && section.data_fields.length > 0)
                       {
                        for( const dataField of section.data_fields)
                           {
                            const newFieldId = uuidv4();
                            await pool.query('INSERT INTO template_data_fields (field_id, section_id, field_name) VALUES (?, ?, ?)', [newFieldId, newSectionId, sanitizeInput(dataField.field_name)]);
                          }
                      }

               }
          }
      const updatedTemplate = await pool.getRecordById(TEMPLATES_TABLE, newTemplate.template_id, 'template_id', Template);
         res.status(201).json(updatedTemplate.toJSON());
      } catch (error) {
         console.error('Error creating new template:', error);
         handleError(res, error, 500, 'Failed to create a new template.');
    }
});
/**
 * @swagger
 * /templates/{template_id}:
 *   get:
 *     summary: Get a protocol template by id
 *     description: Gets a protocol template based on the template id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: template_id
 *         required: true
 *         description: ID of the template to get
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                      template_id:
 *                        type: string
 *                        description: unique id of the template
 *                      template_name:
 *                         type: string
 *                         description: name of the template
 *                     template_description:
 *                       type: string
 *                        description: Description of the template
 *                      sections:
 *                         type: array
 *                         description: array of sections
 *                         items:
 *                            type: object
 *                            properties:
 *                               section_id:
 *                                  type: string
 *                                  description: unique id for the template section
 *                               section_name:
 *                                 type: string
 *                                 description: name of the section
 *                               data_fields:
 *                                  type: array
 *                                 description: array of data fields for the template section
 *                                 items:
 *                                    type: object
 *                                     properties:
 *                                        field_id:
 *                                         type: string
 *                                          description: unique id for the data field
 *                                        field_name:
 *                                           type: string
 *                                           description: name of the data field
 *       404:
 *         description: Template not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Template not found.'
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
 *                message: 'Failed to fetch template.'
 */
router.get('/templates/:template_id', authenticateToken,
   [
        param('template_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Invalid template id format')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
       }
         const { template_id } = req.params;
        try{
          const template = await pool.getRecordById(TEMPLATES_TABLE, template_id, 'template_id', Template);
            if(!template) return handleError(res, null, 404, `Template with id ${template_id} not found`);
            const [sections] = await pool.query('SELECT section_id, section_name FROM template_sections WHERE template_id = ?', [template_id]);
          const newSections = await Promise.all(sections.map(async (section) => {
               const dataFields = await pool.query('SELECT field_id, field_name FROM template_data_fields WHERE section_id = ?', [section.section_id]);
              return { ...section, data_fields: dataFields[0] || [] };
          }))
         res.status(200).json({...template.toJSON(), sections: newSections});
      } catch (error) {
           console.error('Error fetching template:', error);
           handleError(res, error, 500, 'Failed to fetch template.');
       }
});
/**
 * @swagger
 * /protocols/{protocol_id}:
 *   put:
 *     summary: Update a specific protocol
 *     description: Updates a specific protocol based on the provided id.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: protocol_id
 *         required: true
 *         description: ID of the protocol to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the protocol.
 *             example:
 *               title: "My Updated Protocol Title"
 *     responses:
 *       200:
 *         description: Protocol updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 protocol_id:
 *                   type: string
 *                   description: The unique identifier of the protocol.
 *                 template_id:
 *                    type: string
 *                   description: The id of the template for this protocol
 *                 project_id:
 *                   type: string
 *                   description: The unique id of the project for this protocol
 *                 title:
 *                    type: string
 *                    description: Title of the protocol
 *                      sections:
 *                         type: array
 *                         description: array of sections for this protocol
 *                         items:
 *                           type: object
 *                           properties:
 *                             section_id:
 *                                type: string
 *                              description: unique id for the protocol section
 *                             section_name:
 *                                type: string
 *                                description: name of the section
 *                             content:
 *                                type: string
 *                                 description: Content of the section
 *       400:
 *         description: Bad request, input is not valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                    message:
 *                       type: string
 *                       description: The message returned by the system.
 *              example:
 *                message: 'Title is required'
 *       404:
 *         description: Protocol not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Protocol not found.'
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
 *                message: 'Failed to update protocol.'
 */
router.put('/protocols/:protocol_id', authenticateToken,
   [
       param('protocol_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Invalid protocol id format'),
       body('title').notEmpty().isString().trim().isLength({max:255}).withMessage('Title is required and must be a string not more than 255 characters.')
   ],
    async (req, res) => {
      const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }
        const { protocol_id } = req.params;
       const { title } = req.body;
    try {
         const updatedProtocol = await pool.updateRecord(PROTOCOLS_TABLE, { title }, protocol_id, 'protocol_id', ['title']);
         if(!updatedProtocol) return handleError(res, null, 404, `Protocol with id ${protocol_id} not found`);
        const protocol = await pool.getRecordById(PROTOCOLS_TABLE, protocol_id, 'protocol_id', Protocol);
        const [sections] = await pool.query('SELECT section_id, section_name, content FROM protocol_sections WHERE protocol_id = ?', [protocol_id]);
           res.status(200).json({...protocol.toJSON(), sections: sections});
    } catch (error) {
      console.error('Error updating protocol:', error);
        handleError(res, error, 500, 'Failed to update protocol.');
   }
});

/**
 * @swagger
 * /protocols/{protocol_id}:
 *   delete:
 *     summary: Delete a protocol by ID.
 *     description: Deletes a protocol using its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: protocol_id
 *         required: true
 *         description: ID of the protocol to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Protocol deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   message:
 *                     type: string
 *                     description: Message from system about deletion.
 *       404:
 *         description: Protocol not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: The message returned by the system.
 *             example:
 *               message: 'Protocol not found.'
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
 *               message: 'Failed to delete protocol.'
 */
router.delete('/protocols/:protocol_id', authenticateToken,
   [
       param('protocol_id').notEmpty().isString().trim().custom(uuidValidate).withMessage('Invalid protocol id format')
    ],
    async (req, res) => {
     const { protocol_id } = req.params;
   try{
      const delProtocol =  await pool.deleteRecord(PROTOCOLS_TABLE, protocol_id, 'protocol_id');
        if(!delProtocol) return handleError(res, null, 404, `Protocol with id ${protocol_id} not found`);
      res.status(200).json({ message: 'Protocol deleted successfully.' });
    } catch (error) {
       console.error('Error deleting protocol:', error);
        handleError(res, error, 500, 'Failed to delete protocol.');
    }
});
/**
 * @swagger
 * /templates:
 *   get:
 *     summary: Get all protocol templates
 *     description: Retrieves a list of all protocol templates.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                      template_id:
 *                        type: string
 *                        description: unique id of the template
 *                      template_name:
 *                         type: string
 *                         description: name of the template
 *                     template_description:
 *                         type: string
 *                         description: description of the template
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
 *                message: 'Failed to retrieve templates'
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
      const templates = await pool.getAllRecord(TEMPLATES_TABLE, Template);
       res.status(200).json(templates.map(template => template.toJSON()));
  } catch (error) {
      console.error('Error fetching templates:', error);
      handleError(res, error, 500, 'Failed to retrieve templates');
   }
});

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Creates a new protocol template.
 *     description: Creates a new protocol template.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_name:
 *                 type: string
 *                 description: Name of the template.
 *               template_description:
 *                 type: string
 *                 description: Description of the template.
 *                 sections:
 *                    type: array
 *                    description: array of sections
 *                    items:
 *                       type: object
 *                       properties:
 *                         section_name:
 *                           type: string
 *                           description: name of the section.
 *                         data_fields:
 *                            type: array
 *                            description: array of data fields
 *                            items:
 *                               type: object
 *                               properties:
 *                                  field_name:
 *                                     type: string
 *                                     description: name of the data field
 *             example:
 *               template_name: "Sample Template"
 *               template_description: "Sample Template description"
 *               sections:
 *                  [{section_name:"section1" , data_fields:[{field_name:"field1"}, {field_name:"field2"}]}]
 *     responses:
 *       201:
 *         description: New template created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                      template_id:
 *                        type: string
 *                        description: unique id for this template
 *                      template_name:
 *                        type: string
 *                        description: Name of the template
 *                     template_description:
 *                       type: string
 *                        description: Description of the template
 *                      sections:
 *                       type: array
 *                       description: array of sections for this template
 *                       items:
 *                          type: object
 *                         properties:
 *                            section_id:
 *                              type: string
 *                              description: id of the section
 *                            section_name:
 *                              type: string
 *                              description: name of the section
 *                           data_fields:
 *                                type: array
 *                                description: array of data fields for this section
 *                                items:
 *                                    type: object
 *                                   properties:
 *                                      field_id:
 *                                       type: string
 *                                       description: id of the data field
 *                                      field_name:
 *                                        type: string
 *                                        description: name of the data field
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
 *               message: 'Template name and description required'
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
 *                message: 'Failed to create a new template.'
 */
router.post('/templates', authenticateToken,
 [
     body('template_name').notEmpty().isString().trim().isLength({max:255}).withMessage('Template name is required and must be a string not more than 255 characters.'),
     body('template_description').optional().isString().trim().isLength({max:1000}).withMessage('Template description is optional and must be a string not more than 1000 characters.'),
     body('sections').optional().isArray().withMessage('Sections must be an array.'),
    body('sections.*.section_name').optional().isString().trim().isLength({max:255}).withMessage('Section names must be a string not more than 255 characters'),
     body('sections.*.data_fields').optional().isArray().withMessage('data fields must be an array.'),
      body('sections.*.data_fields.*.field_name').optional().isString().trim().isLength({max:255}).withMessage('data field name must be a string not more than 255 characters'),
 ],
 async (req, res) => {
      const errors = validationResult(req);
        if (!errors.isEmpty()) {
             return res.status(400).json({ message: errors.array()[0].msg });
         }
   const { template_name, template_description, sections} = req.body;
   try {
       const newTemplate = new Template({
            template_id: uuidv4(),
            template_name: template_name,
            template_description: template_description,
      });
       const result =  await pool.insertRecord(TEMPLATES_TABLE, newTemplate, ['template_id','template_name','template_description']);
      if (!result) {
             throw new Error('Failed to create a new template.');
      }
      const templateObj = new Template(result);
       if(sections && sections.length > 0){
         for(const section of sections){
           const newSectionId = uuidv4();
            await pool.query('INSERT INTO template_sections (section_id, template_id, section_name) VALUES (?, ?, ?)', [newSectionId, newTemplate.template_id, sanitizeInput(section.section_name)]);
             if(section.data_fields && section.data_fields.length > 0)
                  {
                  for(const dataField of section.data_fields)
                      {
                        const newFieldId = uuidv4();
                        await  pool.query('INSERT INTO template_data_fields (field_id, section_id, field_name) VALUES (?, ?, ?)', [newFieldId, newSectionId, sanitizeInput(dataField.field_name)]);
                       }
                   }
              }
            }
            const updatedTemplate =  await pool.getRecordById(TEMPLATES_TABLE, newTemplate.template_id, 'template_id', Template);
          res.status(201).json(updatedTemplate.toJSON());
       } catch (error) {
           console.error('Error creating new template:', error);
         handleError(res, error, 500, 'Failed to create a new template.');
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