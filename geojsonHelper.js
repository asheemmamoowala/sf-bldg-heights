
function GeoJSONFeature() {
    return {
        type: 'Feature',
        properties: {},
        geometry: {
            coordinates: [],
            type: 'Polygon'
        }
    };
}

function GeoJSON() {
    return {
        type: 'FeatureCollection',
        features: []
    }
}

module.exports = {
    GeoJSON: GeoJSON,
    GeoJSONFeature: GeoJSONFeature
};