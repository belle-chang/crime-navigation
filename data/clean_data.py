from more_itertools import unique_everseen
with open('crime_open_database_core_2019.csv','r') as f, open('crime_db_clean.csv','w') as out_file:
    out_file.writelines(unique_everseen(f))