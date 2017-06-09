const wellknown = require('wellknown');
const soda = require('soda-js');
const fs = require('fs');
const geojson = require('./geojsonHelper');
const bulkHeights = require('./sfheights.geo.json');

Promise.settle = function(promises) {
var results = [];
var done = promises.length;

    return new Promise(function(resolve) {
        function tryResolve(i, v) {
        results[i] = v;
        done = done - 1;
        if (done == 0)
            resolve(results);
        }

        for (var i=0; i<promises.length; i++)
        promises[i].then(tryResolve.bind(null, i), tryResolve.bind(null, i));
        if (done == 0)
        resolve(results);
    });
}

let sfSoda = new soda.Consumer('data.sfgov.org', { apiToken: 'AK6UdQ4uOFfUT3PO8ysMTvnwB' });
let buildingsGeoJSON = geojson.GeoJSON();

const bulkHeightsFeatures = bulkHeights.features.slice(0,1500);

const buildingsPromises = bulkHeightsFeatures.map( (block) => {
    return getBuildingsInBlock(block)
        .then((buildingRows) => {
            let buildings = rowsToFeatures(buildingRows);
            buildings.forEach((building) => {
                building.properties.height_code = block.properties.heightCode;
                building.properties.allowed_height = block.properties.height;
                building.properties.height_delta = block.properties.height - building.properties.height;
            });
            return buildings;
        })
        .then((buildingFeatures) => {
            buildingFeatures.forEach ( (building) => {
                buildingsGeoJSON.features.push(building);
            });
            return buildingFeatures.length;
        })
});

Promise.settle(buildingsPromises)
.then((counts) => {
    fs.writeFileSync('./sfbuildings.geo.json', JSON.stringify(buildingsGeoJSON));
    process.exit(0);
})
.catch( (e) => {
    console.log(e);
    process.exit(1);
});

function getBuildingsInBlock(blockFeature) {
    let wkt = wellknown.stringify(blockFeature);
    return new Promise((resolve, reject) => {
        sfSoda.query()
            .withDataset('2s2t-jwzp')
            .select(['globalid', 'the_geom', 'hgt_median_m', 'gnd_min_m', 'objectid', 'p2010_name'])
            .where(`intersects(the_geom, '${wkt}')`)
            .getRows()
            .on('success', function (rows) { resolve(rows); })
            .on('error', function (error) { 
                reject(error); 
            });
    });
}

function rowsToFeatures(rows) {
    return rows.map((row) => {
        let feature = geojson.GeoJSONFeature();
        feature.id = row.globalid;
        feature.properties.guid = row.globalid;
        feature.properties.height = Number(row.hgt_median_m);
        feature.properties.min_height = Number(row.gnd_min_m);
        feature.properties.name = row.p2010_name;
        feature.properties.objectid = row.objectid;
        feature.geometry = row.the_geom;
        return feature;
    });
}