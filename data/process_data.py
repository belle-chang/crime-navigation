# importing csv module 
import csv 

# csv file name 
filename = "crime_db_clean.csv"
# filename = "crime.csv"
  
# initializing the titles and rows list 
fields_dict = {
    "uid": 0, 
    "city_name": 1, 
    "offense_code": 2, 
    "offense_type": 3, 
    "offense_group": 4, 
    "offense_against": 5, 
    "date_single": 6, 
    "longitude": 7, 
    "latitude": 8, 
    "location_type": 9, 
    "location_category": 10, 
    "census_block": 11, 
    "date_start": 12, 
    "date_end": 13 
}
cities = {
    "Austin": 0,
    "Boston": 0,
    "Chicago": 0,
    "Detroit": 0,
    "Fort Worth": 0,
    "Kansas City": 0,
    "Los Angeles": 0,
    "Louisville": 0,
    "Mesa": 0,
    "Nashville": 0,
    "New York": 0,
    "San Francisco": 0,
    "Seattle": 0,
    "St Louis": 0,
    "Tucson": 0,
    "Virginia Beach": 0
}
fields = [] 
rows = [] 
# geojson format
# {
#   "type": "Feature",
#   "geometry": {
#     "type": "Point",
#     "coordinates": [125.6, 10.1]
#   },
#   "properties": {
#     "name": "Dinagat Islands",
#     "date": 
#   }
# }
geojson = { 
    'type': 'FeatureCollection'
    # 'features': [

    # ]
}
features = []
feature = {
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [125.6, 10.1]
  },
  "properties": {
    "offense_code": "",
    "offense_type": "",
    "date_single": ""
  }
}
# reading csv file 
import json
with open(filename, 'r') as csvfile: 
    # creating a csv reader object 
    csvreader = csv.reader(csvfile) 
      
    # extracting field names through first row 
    fields = next(csvreader) 
  
    # extracting each data row one by one 
    
    for row in csvreader: 
        rows.append(row)
        city = row[fields_dict['city_name']]
        cities[city] = cities[city] + 1
        if city == "Boston":
            rows.append(row)
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [125.6, 10.1]
                },
                "properties": {
                    "offense_code": "",
                    "offense_type": "",
                    "date": ""
                }
            }
            lat = float(row[fields_dict['latitude']])
            lon = float(row[fields_dict['longitude']])
            # print([lat, lon])
            if lat > 90 or lat < -90 or lon > 180 or lon < -180:
                # print("invalid")
                continue
            feature['geometry']['coordinates'] = [lon, lat] 
            # print("lat, long: ", [row[fields_dict['latitude']], row[fields_dict['longitude']]] )
            feature['properties']['offense_code'] = row[fields_dict['offense_code']]
            feature['properties']['offense_type'] = row[fields_dict['offense_type']]
            feature['properties']['date'] = row[fields_dict['date_single']]
            # print(feature)
            features.append(feature)

    # print("features : ", features)
    geojson['features'] = features
    # print("geojson : ", geojson)
    print("cities  : ", cities)
    # get total number of rows 
    print("Total no. of rows: %d"%(csvreader.line_num)) 
    print(len(features))

print("\n\n\n")
import json
# with open('chi_clean.json', 'w') as writefile:
    # json.dump(geojson, writefile)
    # print(geojson, file=writefile)
# printing the field names 
# print('Field names are:' + ', '.join(field for field in fields)) 
  
# #  printing first 5 rows 
# print('\nFirst 5 rows are:\n') 
# for row in rows[:5]: 
#     # parsing each column of a row 
#     for col in row: 
#         print("%10s"%col), 
#     print('\n') 

# RUN THIS TO PRETTY PRINT JSON
# cat ny.json | python3 -mjson.tool > ny_final.json
# cat bos_clean.json | python3 -mjson.tool > bos_clean_final.json