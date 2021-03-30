import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'
import * as turf from '@turf/turf';
import polyline from '@mapbox/polyline'
import bos from './bos_final.json'
import fw from './fw_final.json'

mapboxgl.accessToken =
    'pk.eyJ1IjoiYW5hYmVsbGVjaGFuZyIsImEiOiJja20xZmVxNGYwMTRpMnJtemJ0M3podzFzIn0.punpaEzFpzG4kmbcpdtwUQ'

const App = () => {
    // playign with here api
    {
    // const apiUrl = 'https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=dQsyJbZZS_IvjJSlSFFxt1tadvGuxoOzkxEn5wGTP80&waypoint0=geo!52.5184443440238,13.383906494396967&waypoint1=geo!52.51435421904425,13.396947378094524&mode=fastest;car;traffic:disabled&avoidareas=52.517100760,13.3905424488;52.5169701849,13.391808451!52.51623131288022,13.389888672738778;52.51335487996589,13.395274548440511!52.52006148651319,13.385160024545286;52.517760038213815,13.389707563495335';
    // fetch(apiUrl)
    //   .then((response) => response.json())
    //   .then((data) => console.log('This is your data', data));
    }
      
    const mapContainerRef = useRef(null);
    // boston
    // const [lng, setLng] = useState(-71.0799);
    // const [lat, setLat] = useState(42.3083);
    // const [zoom, setZoom] = useState(13.59);

    const [lng, setLng] = useState(-96.2485);
    const [lat, setLat] = useState(38.5370);
    const [zoom, setZoom] = useState(4.16);
    // Initialize map when component mounts
    useEffect(() => {
        // crate new map
        const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        //   style: 'mapbox://styles/anabellechang/ckm11howb889h17qf87wj3ld6',
        center: [lng, lat],
        zoom: zoom
        });

        let obstacle = turf.buffer(fw, 7, { units: "meters" });
        let bbox = [0, 0, 0, 0];
        let polygon = turf.bboxPolygon(bbox);
        let counter = 0;
        let maxAttempts = 50;
        let min_intersections;
        let num_intersections = Infinity;
        let route;
        let origin;
        let destination;

        map.on('load', function() {
            let cities = ['bos', 'fw'];
            let cities_geo = ['https://raw.githubusercontent.com/belle-chang/navi-crime/main/data/jsonformatter-2.json', 'https://raw.githubusercontent.com/belle-chang/crime-navi/main/data/fw_final.json'];

            for (let i = 0; i < cities.length; i++) {
                map.addSource("crime-" + cities[i], {
                    type: 'geojson',
                    // data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_ports.geojson'
                    data: cities_geo[i],
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });

                map.addLayer({
                    id: "clusters-" + cities[i],
                    source: "crime-" + cities[i], // this should be the id of the source
                    type: "circle",
                    filter: ['has', 'point_count'],
                    // paint properties
                    paint: {
                    //   "circle-opacity": 0.75,
                    //   "circle-stroke-width": 1,
                    //   "circle-radius": 4,
                    //   "circle-color": "#FFEB3B"
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#ffb6ab',
                            20,
                            '#f5735f',
                            50,
                            '#b83e2c'
                            ],
                            'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            20,
                            30,
                            50,
                            40
                        ]
                    },
                    layout: {
                        // make layer visible by default
                        'visibility': 'visible'
                    }
                });
    
                map.addLayer({
                    id: 'cluster-count-' + cities[i],
                    // id: 'clusters',
                    type: 'symbol',
                    source: "crime-" + cities[i], // this should be the id of the source
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                        'visibility': 'visible'
                    }
                });
    
                map.addLayer({
                    id: 'unclustered-point-' + cities[i],
                    // id: 'clusters',
                    type: 'circle',
                    source: "crime-" + cities[i], // this should be the id of the source
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': '#11b4da',
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                        },
                    layout: {
                        // make layer visible by default
                        'visibility': 'visible'
                        }
                });
                // console.log(map.getStyle().layers)
            }
            // testing routing api
            {
            
            map.addSource("obstacles", {
                type: 'geojson',
                data: obstacle
            })
            map.addLayer({
                id: 'obstacles',
                type: 'fill',
                source: "obstacles",
                paint: {
                    'fill-color': '#f03b20',
                    // 'circle-radius': 5,
                    // 'circle-stroke-width': 1,
                    'fill-opacity': 0.5,
                    'fill-outline-color': '#f03b20'
                }
            });
                 
            map.addSource('theRoute', {
                type: 'geojson',
                data: {
                    type: 'Feature'
                }
            });
                 
            map.addLayer({
                id: 'theRoute',
                type: 'line',
                source: 'theRoute',
                layout: {
                'line-join': 'round',
                'line-cap': 'round'
                },
                paint: {
                'line-color': '#cccccc',
                'line-opacity': 0.75,
                'line-width': 10,
                'line-blur': 0.5
                }
            });
                 
            // Source and layer for the bounding box
            map.addSource('theBox', {
                type: 'geojson',
                data: {
                type: 'Feature'
                }
                });
                map.addLayer({
                id: 'theBox',
                type: 'fill',
                source: 'theBox',
                layout: {},
                paint: {
                'fill-color': '#FFC300',
                'fill-opacity': 0.5,
                'fill-outline-color': '#FFC300'
                }
            });
            }
        });

        let dictionary = {
            "Boston": ['clusters-bos', 'cluster-count-bos', 'unclustered-point-bos'],
            "Fort Worth": ['clusters-fw', 'cluster-count-fw', 'unclustered-point-fw']
        }
        let lng_lat_zoom = {
            "Boston": {
                center: [-71.0799, 42.3083],
                zoom: 11.27
            },
            "Fort Worth": {
                center: [-97.3444, 32.8168],
                zoom: 9.73
            }
        }
        let lng_city = {
            [-71.0799]: bos,
            [-97.3444]: fw
        }

        for (let key in dictionary) {
            // check if the property/key is defined in the object itself, not in parent
            if (dictionary.hasOwnProperty(key)) {           
                console.log(key, dictionary[key]);
                let link = document.createElement('a');
                link.id = key;
                link.href = '#';
                link.className = 'active city_menu';
                link.textContent = key;
            let layers = document.getElementById('menu');
            layers.appendChild(link);
            }
        }
        // fly to city, set obstacle 
        let cities = document.getElementsByClassName("city_menu");
        for (let i = 0; i < cities.length; i++) {
            cities[i].onclick = function(e) {
                map.flyTo(lng_lat_zoom[cities[i].id])
            }
            console.log(map.getSource('obstacles'))
            console.log(map.getSource('clusters-bos'))
            console.log(map)
            // obstacle = turf.buffer(data[cities[i].id], 7, { units: "meters" });
            // map.getSource('obstacles').setData(obstacle);
        }


        // Add navigation control (the +/- zoom buttons) the top right of the canvas
        map.addControl(new mapboxgl.NavigationControl());
        // map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const directions = new MapboxDirections({
            accessToken: mapboxgl.accessToken,
            unit: 'imperial',
            profile: 'mapbox/walking',
            geometries: 'geojson',
            alternatives: false,
            flyTo: false,
            walkway_bias: .75,
            alley_bias: -.75,
            steps: true,
            controls: { instructions: false },
        });

        // Integrates directions control with map
        map.addControl(directions, 'top-left');

        let isEmpty = function(obj){
            return Object.keys(obj).length === 0;
        }
        directions.on('clear', function(e) {
            counter = 0;
            num_intersections = Infinity;
            // map.setLayoutProperty('theRoute', 'visibility', 'none');
            map.setLayoutProperty('theBox', 'visibility', 'none');
            let instructions = document.getElementById('instructions')
            instructions.innerHTML = ""
            instructions.style.visibility = "hidden"

            // let tempo = directions.getOrigin();
            // let tempd = directions.getDestination();
            // // if (isEmpty(tempo) && isEmpty(tempd)) {
            // //     map.setLayoutProperty('theRoute', 'visibility', 'none');
            // // }
            // console.log(tempo)
            // console.log(tempd)

        });

        let addDirections = function(route) {
            directions.removeRoutes();
            let notice = document.getElementById("notice");
            notice.style.visibility = "hidden"
            let route_num = document.getElementById("route_num");
            route_num.innerHTML = "Running route "
            let instructions = document.getElementById('instructions');
            instructions.style.visibility = "visible"
            let steps = route.legs[0].steps;
            console.log(steps)
            let total_dist = (route.distance / 1609.344).toFixed(2);
            let duration = (route.duration / 60).toFixed(0);
            let str = "<tr> "+ "<td><b>" + total_dist + "mi" + "</b></td>" + "<td>" + duration + "min" + "</td>" + "</tr>"
            instructions.innerHTML += str;
            for (var i = 0; i < steps.length; i++) {
                console.log(steps[i].maneuver.instruction);
                
                let miles = (steps[i].distance / 1609.344).toFixed(2);
                let dist = miles;
                let unit = "mi";
                let feet = (steps[i].distance / 0.3048).toFixed(0);
                if (miles < 0.15) {
                    dist = feet;
                    unit = "ft"
                }
                // let str = "<li> "+steps[i].maneuver.instruction + "--" + dist + unit + "</li>"
                let str = "<tr> "+ "<td>" + dist + unit + "</td>" + "<td>" + steps[i].maneuver.instruction + "</td>" + "</tr>"
                instructions.innerHTML += str;
            }
        }

        directions.on('route', function (e) {
            let notice = document.getElementById("notice");
            notice.style.visibility = "visible"
            let route_num = document.getElementById("route_num");
            route_num.innerHTML = "Running route " + counter + "."

            if (counter == 0) {
                origin = directions.getOrigin();
                destination = directions.getDestination();
                console.log("origin")
                console.log(origin)
                console.log("destination")
                console.log(destination)
            }
            
            
            let routes = e.route;
             
            // Hide the route and box by setting the opacity to zero
            // map.setLayoutProperty('theRoute', 'visibility', 'none');
            // map.setLayoutProperty('theBox', 'visibility', 'none');
             
            if (counter >= maxAttempts) {
                console.log(min_intersections)
                e.route = route;
                console.log(e.route)
                map.getSource('theRoute').setData(min_intersections);
                addDirections(e.route);
            } 
            else {
                // Make each route visible
                routes.forEach((e) => {

                    console.log(counter);
                    // Make each route visible
                    map.setLayoutProperty('theRoute', 'visibility', 'visible');
                    map.setLayoutProperty('theBox', 'visibility', 'visible');
                    
                    // Get GeoJson LineString feature of route
                    let routeLine = polyline.toGeoJSON(e.geometry);
                    let intersects = turf.lineIntersect(obstacle, routeLine);

                    // get route with minimum intersections
                    if (intersects.features.length < num_intersections) {
                        num_intersections = intersects.features.length;
                        min_intersections = routeLine;
                        route = e;
                    }
                    
                    // Create a bounding box around this route
                    // The app will find a random point in the new bbox
                    bbox = turf.bbox(routeLine);
                    polygon = turf.bboxPolygon(bbox);
                    
                    // Update the data for the route
                    // This will update the route line on the map
                    map.getSource('theRoute').setData(routeLine);
                    // Update the box
                    map.getSource('theBox').setData(polygon);
                    
                    let clear = turf.booleanDisjoint(obstacle, routeLine);
                    
                    if (clear == true) {
                        // Hide the box
                        map.setLayoutProperty('theBox', 'visibility', 'none');
                        map.setPaintProperty('theRoute', 'line-color', '#74c476');
                        // Reset the counter, min intersections
                        route = e;
                        counter = 0;
                        num_intersections = Infinity;
                        addDirections(route);
                    } else {
                    // Collision occurred, so increment the counter
                        counter = counter + 1;
                        // As the attempts increase, expand the search area
                        // by a factor of the attempt count
                        polygon = turf.transformScale(polygon, counter * 0.025);
                        bbox = turf.bbox(polygon);
                        map.setPaintProperty('theRoute', 'line-color', '#072dab');
                        
                        // Add a randomly selected waypoint to get a new route from the Directions API
                        let randomWaypoint = turf.randomPoint(1, { bbox: bbox });
                        directions.setWaypoint(
                            0,
                            randomWaypoint['features'][0].geometry.coordinates
                        );
                    }
                });
            }
        });

        map.on('move', function() {
            // shitty workaround
            let tempo = directions.getOrigin();
            let tempd = directions.getDestination();
            if (isEmpty(tempo) && isEmpty(tempd)) {
                map.setLayoutProperty('theRoute', 'visibility', 'none');
            }
            setLng(map.getCenter().lng.toFixed(4));
            setLat(map.getCenter().lat.toFixed(4));
            setZoom(map.getZoom().toFixed(2));
        });

        map.on('moveend', function() {
            let lng = map.getCenter().lng.toFixed(4)
            console.log(lng_city[lng])
            if (lng_city[lng]) {
                obstacle = turf.buffer(lng_city[lng], 7, { units: "meters" });
                map.getSource('obstacles').setData(obstacle);
            }
        })

        

        // Clean up on unmount
        return () => map.remove();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            <nav id="menu">
                <a id="title" href="#">
                    Available Cities
                </a>
            </nav>
        <div id="notice">
           <b>Your custom route is being calculated!</b> 
           <br/>
           <div id="route_num">Running route </div>
        </div>

        <table id="instructions" >
            {/* <tr>
                <td>
                    herjahd
                </td>
                <td>
                    adkfsj;
                </td>
            </tr>
            <tr>
                <td>
                    herjahd
                </td>
                <td>
                    adkfsj;
                </td>
            </tr> */}
        </table>
        {/* <div className='sidebarStyle'>
            <div>
            Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
            </div>
        </div> */}
        <div className='map-container' ref={mapContainerRef} />
        
        </div>
    );
};

export default App;

// class App extends React.Component {

//   componentDidMount() {

//     // Creates new map instance
//     const map = new mapboxgl.Map({
//       container: this.mapWrapper,
//       style: 'mapbox://styles/mapbox/streets-v10',
//       center: [-73.985664, 40.748514],
//       zoom: 12
//     });

//     // Creates new directions control instance
//     const directions = new MapboxDirections({
//       accessToken: mapboxgl.accessToken,
//       unit: 'metric',
//       profile: 'mapbox/driving',
//     });

//     // Integrates directions control with map
//     map.addControl(directions, 'top-left');
//   }

//   render() {
//     return (
//       // Populates map by referencing map's container property
//       <div ref={el => (this.mapWrapper = el)} className="mapWrapper" />
//     );
//   }
// }

// export default App;

                // turns off cities
                // link.onclick = function (e) {
                //     for (let index in dictionary[key]) {
                //         let clickedLayer = dictionary[key][index];
                //         e.preventDefault();
                //         e.stopPropagation();
                    
                //         let visibility = map.getLayoutProperty(clickedLayer, 'visibility');
                    
                //         if (visibility === 'visible') {
                //             map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                //             this.className = '';
                //         } else {
                //             this.className = 'active';
                //             map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                //         }
                //     }
                // };