import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'
import * as turf from '@turf/turf';
import polyline from '@mapbox/polyline'
import bos from './bos_nodupes.json'
import fw from './fw_nodupes.json'
import chi from './chi_nodupes.json'
import sf from './sf_nodupes.json'
import {XIcon, QuestionIcon} from '@primer/octicons-react'

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
        style: 'mapbox://styles/mapbox/dark-v10',
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
        let distance = Infinity;
        let current_city;
        let route;

        map.on('load', function() {
            let cities = ['bos', 'fw', 'chi', 'sf'];
            let data = [bos, fw, chi, sf]
            
            for (let i = 0; i < cities.length; i++) {
                map.addSource("crime-" + cities[i], {
                    type: 'geojson',
                    // data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_ports.geojson'
                    data: data[i],
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
                        "circle-opacity": 0.75,
                    //   "circle-stroke-width": 1,
                    //   "circle-radius": 4,
                    //   "circle-color": "#FFEB3B"
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#ffb6ab',
                            30,
                            '#f5735f',
                            75,
                            '#b83e2c'
                            ],
                            'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            30,
                            30,
                            75,
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
                        'text-font': ['Arial Unicode MS Bold'],
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
                        'circle-color': '#fc0b03',
                        // 'circle-color': '#ffffff',
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
            
            // map.addSource("obstacles", {
            //     type: 'geojson',
            //     data: obstacle
            // })
            // map.addLayer({
            //     id: 'obstacles',
            //     type: 'fill',
            //     source: "obstacles",
            //     paint: {
            //         'fill-color': '#f03b20',
            //         // 'circle-radius': 5,
            //         // 'circle-stroke-width': 1,
            //         'fill-opacity': 0.5,
            //         'fill-outline-color': '#f03b20'
            //     }
            // });
                 
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
                'line-color': '#4881c5',
                'line-opacity': 0.75,
                'line-width': 10,
                'line-blur': 0.5,
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
            "Fort Worth": ['clusters-fw', 'cluster-count-fw', 'unclustered-point-fw'],
            "Chicago": ['clusters-chi', 'cluster-count-chi', 'unclustered-point-chi'],
            "San Francisco": ['clusters-sf', 'cluster-count-sf', 'unclustered-point-sf'],
        }
        let lng_lat_zoom = {
            "Boston": {
                center: [-71.0799, 42.3083],
                zoom: 11.27
            },
            "Fort Worth": {
                center: [-97.3444, 32.8168],
                zoom: 9.73
            },
            "Chicago": {
                center: [-87.72023,41.83138],
                zoom: 10
            },
            "San Francisco": {
                center: [-122.44779,37.76190],
                zoom: 12
            }
        }
        let data = {
            "Boston": bos,
            "Fort Worth": fw,
            "Chicago": chi,
            "San Francisco": sf,
        }

        // once map loads, populate menu bar
        map.once('load', function() {
            for (let key in dictionary) {
                // check if the property/key is defined in the object itself, not in parent
                if (dictionary.hasOwnProperty(key)) {           
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
                    // obstacle = turf.buffer(data[cities[i].id], 7, { units: "meters" });
                    current_city = data[cities[i].id]
                }
                // map.getSource('obstacles').setData(obstacle);
            }
        })

        // add navigation control (the +/- zoom buttons) the top right of the canvas
        map.addControl(new mapboxgl.NavigationControl());

        // add directions
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
            flyTo: false
        });

        // add directions control with map
        map.addControl(directions, 'top-left');

        let isEmpty = function(obj){
            return Object.keys(obj).length === 0;
        }

        let hide_element = function(el_name) {
            let el = document.getElementById(el_name);
            el.style.visibility = "hidden";
        }

        let show_element = function(el_name) {
            let el = document.getElementById(el_name);
            el.style.visibility = "visible";
        }

        // when directions clear, remove bbox, hide instructions and notice
        directions.on('clear', function(e) {
            counter = 0;
            num_intersections = Infinity;
            distance = Infinity;
            // map.setLayoutProperty('theRoute', 'visibility', 'none');
            map.setLayoutProperty('theBox', 'visibility', 'none');
            let instructions = document.getElementById('instructions')
            instructions.innerHTML = ""
            instructions.style.visibility = "hidden"
            // let notice = document.getElementById("notice");
            // notice.style.visibility = "hidden"
            hide_element("notice");
        });

        let addDirections = function(route) {
            directions.removeRoutes();
            // let notice = document.getElementById("notice");
            // notice.style.visibility = "hidden"
            hide_element("notice")
            let route_num = document.getElementById("route_num");
            route_num.innerHTML = "Running route "
            let instructions = document.getElementById('instructions');
            instructions.style.visibility = "visible"
            let steps = route.legs[0].steps;
            console.log(steps)
            let total_dist = (route.distance / 1609.344).toFixed(2);
            let duration = (route.duration / 60).toFixed(0);
            let str = "<tr> "+ "<td id=\"column1\"><b>" + total_dist + "mi" + "</b></td>" + "<td id=\"column2\">" + duration + "min" + "</td>" + "</tr>"
            instructions.innerHTML += str;
            for (var i = 0; i < steps.length; i++) {                
                let miles = (steps[i].distance / 1609.344).toFixed(2);
                let dist = miles;
                let unit = "mi";
                let feet = (steps[i].distance / 0.3048).toFixed(0);
                if (miles < 0.15) {
                    dist = feet;
                    unit = "ft"
                }
                // let str = "<li> "+steps[i].maneuver.instruction + "--" + dist + unit + "</li>"
                let str = "<tr> "+ "<td id=\"column1\">" + dist + unit + "</td>" + "<td id=\"column2\">" + steps[i].maneuver.instruction + "</td>" + "</tr>"
                instructions.innerHTML += str;
            }
        }

        directions.on('route', function (e) {
            if (current_city == null) {
                window.alert("Please select a city in the menu in the bottom left!");
                directions.removeRoutes();
                return;
            }
            let tempo = directions.getOrigin();
            let tempd = directions.getDestination();
            if (isEmpty(tempo) || isEmpty(tempd)) {
                directions.removeRoutes();
                return;
            }
            let notice = document.getElementById("notice");
            if (notice.style.visibility != "visible") notice.style.visibility = "visible";
            let route_num = document.getElementById("route_num");
            route_num.innerHTML = "Running route " + counter + "."

            let instructions = document.getElementById('instructions');
            if (instructions.style.visibility != "hidden") instructions.style.visibility = "hidden";
            
            let routes = e.route;
             
            // Hide the route and box by setting the opacity to zero
            // map.setLayoutProperty('theRoute', 'visibility', 'none');
            // map.setLayoutProperty('theBox', 'visibility', 'none');
             
            if (counter >= maxAttempts) {
                // console.log(min_intersections)
                e.route = route;
                // console.log(e.route)
                map.getSource('theRoute').setData(min_intersections);
                addDirections(e.route);
            } 
            else {
                // Make each route visible
                routes.forEach((e) => {

                    // Make each route visible
                    map.setLayoutProperty('theRoute', 'visibility', 'visible');
                    map.setLayoutProperty('theBox', 'visibility', 'visible');
                    
                    // Get GeoJson LineString feature of route
                    let routeLine = polyline.toGeoJSON(e.geometry);
                    
                    // Create a bounding box around this route
                    // The app will find a random point in the new bbox
                    bbox = turf.bbox(routeLine);
                    polygon = turf.bboxPolygon(bbox);
                    let points_within = turf.pointsWithinPolygon(current_city, polygon);
                    obstacle = turf.buffer(points_within, 7, { units: "meters" });
                    let intersects = turf.lineIntersect(obstacle, routeLine);

                    // get route with minimum intersections
                    if (intersects.features.length <= num_intersections) {
                        if (intersects.features.length == num_intersections && e.distance < distance) {
                            num_intersections = intersects.features.length;
                            min_intersections = routeLine;
                            distance = e.distance
                            route = e;
                        }
                        else if (intersects.features.length < num_intersections) {
                            num_intersections = intersects.features.length;
                            min_intersections = routeLine;
                            distance = e.distance
                            route = e;
                        }
                        // console.log(intersects.features.length)
                        // console.log(num_intersections)
                        // console.log(e);
                    }
                    
                    // // Create a bounding box around this route
                    // // The app will find a random point in the new bbox
                    // bbox = turf.bbox(routeLine);
                    // polygon = turf.bboxPolygon(bbox);
                    // let points_within = turf.pointsWithinPolygon(bos, polygon);
                    // console.log(points_within)
                    
                    // Update the data for the route
                    // This will update the route line on the map
                    map.getSource('theRoute').setData(routeLine);
                    // Update the box
                    map.getSource('theBox').setData(polygon);
                    
                    let clear = turf.booleanDisjoint(obstacle, routeLine);
                    
                    if (clear == true) {
                        // Hide the box
                        map.setLayoutProperty('theBox', 'visibility', 'none');
                        // map.setPaintProperty('theRoute', 'line-color', '#74c476');
                        // Reset the counter, min intersections
                        route = e;
                        counter = 0;
                        num_intersections = Infinity;
                        distance = Infinity;
                        addDirections(route);
                    } else {
                    // Collision occurred, so increment the counter
                        counter = counter + 1;
                        // As the attempts increase, expand the search area
                        // by a factor of the attempt count
                        polygon = turf.transformScale(polygon, counter * 0.025);
                        bbox = turf.bbox(polygon);
                        // map.setPaintProperty('theRoute', 'line-color', '#4881c5');
                        
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
            if (isEmpty(tempo) || isEmpty(tempd)) {
                map.setLayoutProperty('theRoute', 'visibility', 'none');
            }
            setLng(map.getCenter().lng.toFixed(4));
            setLat(map.getCenter().lat.toFixed(4));
            setZoom(map.getZoom().toFixed(2));
        });

        // map.on('moveend', function() {
        //     let lng = map.getCenter().lng.toFixed(4)
        //     console.log(lng_city[lng])
        //     if (lng_city[lng]) {
        //         obstacle = turf.buffer(lng_city[lng], 7, { units: "meters" });
        //         // map.getSource('obstacles').setData(obstacle);
        //     }
        // })
        // let close_loader = document.getElementById("loader");
        let close_loader = document.getElementById("close");
        close_loader.onclick = function(e) {
            close_loader.parentElement.style.visibility = "hidden";
        }

        let toggle_loader = document.getElementById("question");
        toggle_loader.onclick = function(e) {
            if (close_loader.parentElement.style.visibility == "hidden")
                close_loader.parentElement.style.visibility = "visible";
            else
                close_loader.parentElement.style.visibility = "hidden";
        }

        

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
            
            <div id="loader">
                <br/>
                <h1>A New Way to Navigate</h1>
                This is an application created to help you navigate around crime-ridden areas in dense urban areas. 
                <br/>
                Current featured cities include Boston, Fort Worth, Chicago, and San Francisco.
                <br/>
                <br/>
                Each red circle indicates a cluster of plotted crime data, with the number signaling the cluster size. Zoom in closer to get a better look.
                <br/>
                <br/>
                Click on a city in the lower left menu to get started!
                {/* <a id="close">x</a> */}
                <div id="close">
                <XIcon size={24}/>
                </div>
            </div>
        <div id="notice">
           <b>Your custom route is being calculated!</b> 
           <br/>
           <div id="route_num">Running route </div>
        </div>

        
        {/* <table id="distance_duration" >
        </table> */}
        <div id="table">
        <table id="instructions" >
            {/* <tbody>
            <tr>
                <td id="column1"><b>.21mi</b> </td>
                <td id="column2">10min</td>
            </tr>
            <tr>
                <td id="column1">209ft</td>
                <td id="column2">Walk northeast on Puritan Avenue.</td>
            </tr>
            </tbody> */}
        </table>
        </div>
        
        {/* <div className='sidebarStyle'>
            <div>
            Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
            </div>
        </div> */}
        <div id="question">
            <QuestionIcon size={24} fill="#FFFFFF"/>
        </div>
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