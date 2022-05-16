# covid-case-data-service

Data APIs to fetch total no. of cases as well as cases on each state of India in real time.

## Data Source
The data is scraped from [MoHFW](https://www.mohfw.gov.in/) site every 10 minutes.

## Libraries Used
1. Node.js runtime with Express.js
2. Puppeteer to scrap data from source
3. QuickDB to save and fetch records after scraping.

## API Details

Base endpoint: https://peaceful-mesa-18231.herokuapp.com/data-service/

This module currently has 2 GET apis:
1. getTotalRecords(): GET api to fetch overall India records.<br />
   Endpoint: https://peaceful-mesa-18231.herokuapp.com/data-service/totalRecords
2. getStateRecords(): GET api to fetch statewise records.<br />
   Endpoint: https://peaceful-mesa-18231.herokuapp.com/data-service/stateRecords
