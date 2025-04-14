// Helper function to build nested objects from flat form data
function buildNestedObject(flatObj) {
    const result = {};
    for (const key in flatObj) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const part = keys[i];
            // Handle array notation [0], [1], etc.
            if (part.includes('[') && part.includes(']')) {
                const arrayPart = part.split('[');
                const arrayName = arrayPart[0];
                const arrayIndex = parseInt(arrayPart[1]);
                
                if (!current[arrayName]) {
                    current[arrayName] = [];
                }
                if (!current[arrayName][arrayIndex]) {
                    current[arrayName][arrayIndex] = {};
                }
                current = current[arrayName][arrayIndex];
            } else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
        
        const lastKey = keys[keys.length - 1];
        // Try to parse as JSON if it looks like an object/array
        if (typeof flatObj[key] === 'string' && 
            (flatObj[key].startsWith('{') || flatObj[key].startsWith('['))) {
            try {
                current[lastKey] = JSON.parse(flatObj[key]);
            } catch (e) {
                current[lastKey] = flatObj[key];
            }
        } else {
            current[lastKey] = flatObj[key];
        }
    }
    return result;
}

module.exports = {
    buildNestedObject
}; 