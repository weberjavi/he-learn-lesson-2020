require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/request",
  "esri/Graphic",
  "esri/layers/FeatureLayer",
  "esri/layers/TileLayer",
  "esri/Basemap",
  "esri/widgets/LayerList",
  "dojo/domReady!" // will not be called until DOM is ready
], function (
  Map,
  SceneView,
  request,
  Graphic,
  FeatureLayer,
  TileLayer,
  Basemap,
  LayerList
) {

  const basemap = new Basemap({
    baseLayers: [
      new TileLayer({
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        title: "satellite"
      }),
      new TileLayer({
        url: "https://tiles.arcgis.com/tiles/nGt4QxSblgDfeJn9/arcgis/rest/services/HalfEarthFirefly/MapServer",
        title: "half-earth-firefly"
      })
    ],
    title: "half-earth-basemap",
    id: "half-earth-basemap"
  });

  const rangeland = new TileLayer({
    url: 'https://tiles.arcgis.com/tiles/IkktFdUAcY3WrH25/arcgis/rest/services/gHM_Rangeland_inverted/MapServer'
  })

  const protected = new FeatureLayer({
    url: 'https://services5.arcgis.com/Mj0hjvkNtV7NRhA7/arcgis/rest/services/WDPA_v0/FeatureServer/1'
  })

  const map = new Map({
    // basemap: 'satellite',
    basemap: basemap,
    layers: [protected, rangeland]
  });

  const view = new SceneView({
    map: map,
    container: "sceneContainer",
    environment: {
      atmosphereEnabled: false,
      background: {
        type: "color",
        color: [0,10,16]
      }
    },
    ui: {
      components: ["zoom"]
    }
  });

  const layerList = new LayerList({
    view: view
  });

  view.ui.add(layerList, {
    position: "top-right"
  });


  document
    .getElementById("uploadForm")
    .addEventListener("change", function (event) {
      const filePath = event.target.value.toLowerCase();

      if (filePath.indexOf(".zip") !== -1) {
        //only accept .zip files
        generateFeatureCollection(filePath);
      } 
    });


  function generateFeatureCollection(filePath) {
    let name = filePath.split(".");
    // Chrome and IE add c:\fakepath to the value - we need to remove it
    // see this link for more info: http://davidwalsh.name/fakepath
    name = name[0].replace("c:\\fakepath\\", "");

    const myContent = {
      filetype: "shapefile",
      // Check this docs for params spec
      // https://developers.arcgis.com/rest/users-groups-and-items/publish-item.htm
      publishParameters: JSON.stringify({
        name: name,
        targetSR: view.spatialReference
      }),
      f: "json"
    };

    request("https://www.arcgis.com/sharing/rest/content/features/generate", {
      query: myContent,
      body: document.getElementById("uploadForm"),
      responseType: "json"
    })
      .then(function (response) {
        addShapefileToMap(response.data.featureCollection);
      })
  }


  function addShapefileToMap(featureCollection) {
   let sourceGraphics = [];

    const layers = featureCollection.layers.map(function (layer) {
      const graphics = layer.featureSet.features.map(function (feature) {
        return Graphic.fromJSON(feature);
      });
      sourceGraphics = sourceGraphics.concat(graphics);
      const featureLayer = new FeatureLayer({
        objectIdField: "FID",
        source: graphics,
        title: 'User uploaded shapefile'
      });
      return featureLayer;
    });
    map.addMany(layers);
    view.goTo({target: sourceGraphics, tilt: 40});
  }

  });