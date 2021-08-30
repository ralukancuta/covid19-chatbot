import express = require('express');
import { callImportCovidCases, callImportTravelAdvice } from './import-services/import.service';
import { webhookProcessing } from './services/webhook';

const app = express();
const bodyParser = require('body-parser');
const contextService = require('request-context');

app.use(bodyParser.json());
app.use(contextService.middleware('request'));

app.get('/import/covidCases', async (request, response) => {

    console.log('covidCasesImport function was triggered');

    await callImportCovidCases(request, response);

    console.log('covidCasesImport finished');
    return response;
});


app.get('/import/travelAdvice/:letter', async (request, response) => {

    console.log('travelAdviceImport function was triggered');

    await callImportTravelAdvice(request, response);

    console.log('travelAdviceImport finished');
    return response;
});


app.post('/covidCXFulfillment', async (request, response) => {

    console.log('covidCXFulfillment function was triggered');

    const jsonResponse = await webhookProcessing(request, response);

    return response.json(jsonResponse);
});

app.listen(3000, () => {
    console.log('The application is listening on port 3000!');
})