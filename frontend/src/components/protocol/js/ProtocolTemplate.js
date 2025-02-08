//ProtocolTemplate.js
const config = {
    apiBaseUrl: 'http://localhost:3306', // Your API base URL
    websocketUrl: 'ws://localhost:3000', // Your WebSocket server
};

$(document).ready(function () {
    const token = localStorage.getItem('token');
    let templates = [];
    let formData = { template_name: '', template_description: '', sections: [] };

    // Fetch existing templates
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
                const errorData = await response.json();
                alert(`Failed to fetch protocol templates: ${errorData.message}`);
                console.error('Failed to fetch protocol templates');
            }
        } catch (error) {
            alert(`Error fetching protocol templates: ${error.message}`);
            console.error('Error fetching protocol templates:', error);
        }
    };

    const renderTemplates = () => {
        $('#existingTemplates').empty();
        templates.forEach(template => {
            const templateItem = $(`
                <div class="templateItem">
                    <span>${template.template_name}</span>
                    <button class="selectButton" data-id="${template.template_id}">Select</button>
                    <button class="shareButton" data-id="${template.template_id}">Share</button>
                </div>
            `);
            $('#existingTemplates').append(templateItem);
        });
    };

    // Handle adding a new section
    $('#addSection').click(function () {
        const newSectionName = $('#newSection').val();
        if (!newSectionName) return;

        formData.sections.push({
            section_id: uuid.v4(),
            section_name: newSectionName,
            data_fields: [],
        });
        $('#newSection').val(''); // Clear input field
        renderSections();
    });

    const renderSections = () => {
        $('#sectionList').empty();
        formData.sections.forEach(section => {
            const sectionItem = $(`
                <div class="sectionItem" data-id="${section.section_id}">
                    <h3>${section.section_name}</h3>
                    <div class="addDataField">
                        <input type="text" placeholder="Add new data field" class="dataFieldInput" />
                        <button class="addDataFieldButton">Add</button>
                    </div>
                    <ul class="dataFieldList"></ul>
                    <button class="deleteButton">Delete Section</button>
                </div>
            `);
            $('#sectionList').append(sectionItem);
        });
    };

    // Handle creating the template
    $('#createTemplate').click(async function () {
        try {
            const response = await fetch(`${config.apiBaseUrl}/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const updatedData = await response.json();
                alert('New template created successfully');
                templates.push(updatedData);
                formData = { template_name: '', template_description: '', sections: [] };
                $('#template_name').val('');
                $('#template_description').val('');
                renderTemplates();
            } else {
                const errorData = await response.json();
                alert(`Failed to create new template: ${errorData.message}`);
                console.error('Failed to create new template');
            }
        } catch (error) {
            alert(`Error creating new template: ${error.message}`);
            console.error('Error creating new template:', error);
        }
    });

    // Event delegation for dynamically added buttons
    $('#sectionList').on('click', '.deleteButton', function () {
        const sectionId = $(this).closest('.sectionItem').data('id');
        formData.sections = formData.sections.filter(section => section.section_id !== sectionId);
        renderSections();
    });

    $('#sectionList').on('click', '.addDataFieldButton', function () {
        const sectionItem = $(this).closest('.sectionItem');
        const sectionId = sectionItem.data('id');
        const dataFieldName = sectionItem.find('.dataFieldInput').val();

        if (dataFieldName) {
            const section = formData.sections.find(s => s.section_id === sectionId);
            section.data_fields.push({ field_id: uuid.v4(), field_name: dataFieldName });
            sectionItem.find('.dataFieldInput').val(''); // Clear input field
            renderSections();
        }
    });

    // Fetch templates on page load
    fetchTemplates();
});
