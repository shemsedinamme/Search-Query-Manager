const config = {
    apiBaseUrl: 'http://localhost:3306', // Your API base URL
};

$(document).ready(function () {
    const token = localStorage.getItem('token');
    let templates = [];
    let selectedTemplate = '';
    let protocol = { title: '', summary: '', review_type: '', sections: [] };

    // Fetch templates from the server
    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/templates`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                templates = await response.json();
                renderTemplates();
            } else {
                console.error('Failed to fetch protocol templates');
            }
        } catch (error) {
            console.error('Error fetching protocol templates:', error);
        }
    };

    const renderTemplates = () => {
        templates.forEach(template => {
            $('#templateSelect').append(`<option value="${template.template_id}">${template.template_name}</option>`);
        });
    };

    // Handle template selection
    $('#templateSelect').change(async function () {
        selectedTemplate = $(this).val();
        if (selectedTemplate) {
            await fetchTemplateSections(selectedTemplate);
        }
    });

    // Fetch sections of the selected template
    const fetchTemplateSections = async (templateId) => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/templates/${templateId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const templateData = await response.json();
                protocol.sections = templateData.sections; // Update protocol sections
                renderSections();
            } else {
                console.error('Failed to fetch template sections');
            }
        } catch (error) {
            console.error('Error fetching template sections:', error);
        }
    };

    // Render sections
    const renderSections = () => {
        $('#sectionList').empty();
        protocol.sections.forEach(section => {
            const sectionItem = $(`
                <div class="sectionItem">
                    <h2>${section.section_name}</h2>
                    <textarea id="editor-${section.section_id}" class="editor"></textarea>
                    <button class="saveButton" data-section-id="${section.section_id}">Save Section</button>
                </div>
            `);
            $('#sectionList').append(sectionItem);

            // Initialize CKEditor
            ClassicEditor.create(document.querySelector(`#editor-${section.section_id}`))
                .then(editor => {
                    editor.setData(section.content || '');
                    sectionItem.find('.saveButton').click(() => {
                        handleUpdateSection(section.section_id, editor.getData());
                    });
                })
                .catch(error => {
                    console.error('Error initializing CKEditor:', error);
                });
        });
    };

    // Handle creating the protocol
    $('#createProtocol').click(async function () {
        protocol.title = $('#protocolTitle').val();
        protocol.summary = $('#summary').val();
        protocol.review_type = $('#review_type').val();

        if (!selectedTemplate) {
            $('#message').text('Please select a template to create a protocol');
            return;
        }

        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    template_id: selectedTemplate, 
                    title: protocol.title,
                    summary: protocol.summary,
                    review_type: protocol.review_type
                }),
            });
            if (response.ok) {
                const data = await response.json();
                protocol = data; // Update protocol with created data
                renderSections(); // Render the sections if needed
                $('#message').text('Protocol created successfully');
            } else {
                const errorData = await response.json();
                console.error('Failed to create protocol:', errorData);
                $('#message').text('Failed to create Protocol');
            }
        } catch (error) {
            console.error('Error creating protocol:', error);
            $('#message').text('Error creating protocol');
        }
    });

    // Update section
    const handleUpdateSection = async (sectionId, content) => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocol.protocol_id}/sections/${sectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (response.ok) {
                $('#message').text('Protocol section saved');
            } else {
                console.error('Failed to update section');
                alert('Failed to update section');
            }
        } catch (error) {
            console.error('Error updating section:', error);
            alert('Error updating section');
        }
    };

    // Fetch templates on page load
    fetchTemplates();
});
