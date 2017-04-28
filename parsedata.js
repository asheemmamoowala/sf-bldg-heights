const sfheights = require('./bulk height data.json');
const fs = require('fs');
let geoJson = {
    type: 'FeatureCollection',
    features: []
}

function GeoJSONFeature() {
    return  {
        type: 'Feature',
        properties: {},
        geometry: {
            coordinates: [],
            type: 'Polygon'
        }
    };
}


function parsePolygon(polygonStr, guid) {
    const isPolygon = polygonStr.startsWith('POLYGON');
    if(!isPolygon) {
        return null;
    }
    
    let res = /POLYGON \(\(([0-9.,-\s]*)\)\)/.exec(polygonStr);
    if (!res || !res[1]) {
        // console.log(`${guid} geometry data is not parseable: ${polygonStr} `);
        return null;
    }
    let coordsArr = res[1].split(',');
    let result = [];
    coordsArr.forEach( (coordStr) => {
        let coord = coordStr.trimLeft().split(' ');
        result.push([Number(coord[0]), Number(coord[1])]);
    });
    return result;
}

const data = sfheights.data;

for ( let row of data) {
    //Each row is an array of sid, guid,?,?,?,?,?,?,height, height code, area, length, POLYGON string
    let guid = row[1];
    let height = Number(row[8])
    if (Number.isNaN(height)) {
        console.log(`${guid} has invalid height: ${row[8]}`);
        continue;
    }
    if (height > 1000) {
        console.log (`${guid} is really tall! with height: ${height}`);
        continue;
    }
    
    let heightCode = row[9];
    let area = row[10];
    let polygon = row[12];
    let isMultiPolygon = row[13];
    let coordinates = isMultiPolygon ? null: parsePolygon(polygon, guid);
    if (!Array.isArray(coordinates)) {
        // console.log(`${guid} has invalid polygon: ${polygon}`);
        continue;
    }
    
    let feature = new GeoJSONFeature();
    feature.properties.guid = guid;
    feature.properties.heightCode = heightCode;
    feature.properties.area = area;
    feature.properties.height = height * 0.3048; // Convert to meters
    feature.geometry.coordinates.push(coordinates);
    feature.id = row[0];
    geoJson.features.push(feature);
    
};

fs.writeFileSync('./sfheights.geo.json', JSON.stringify(geoJson));
process.exit(0);
